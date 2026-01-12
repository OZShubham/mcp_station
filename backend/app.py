

import os
import json
import asyncio
import shlex
import re
import sys
import traceback
import uuid
import shutil
import time
from contextlib import AsyncExitStack
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- Database Import ---
from database import init_db, ChatDatabase

# --- MCP Imports ---
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.client.sse import sse_client
from mcp.types import (
    CallToolResult,
    TextContent,
    ImageContent,
    EmbeddedResource,
)
from mcp.shared.exceptions import McpError
from mcp.client.streamable_http import streamable_http_client

# --- Groq SDK Imports ---
from groq import Groq, AsyncGroq

# --- Google GenAI SDK Imports ---
from google import genai
from google.genai import types

# --- Enhanced Logger ---
from logger import (
    logger,
    log_mcp_connection,
    log_tool_execution,
    log_llm_request,
    log_api_request,
    log_session_event,
    log_startup_info,
    log_exception,
    log_execution_time
)

MAX_TOOL_RESULT_LENGTH = 8000  # Characters (about 2000 tokens)

load_dotenv()
init_db()
db = ChatDatabase()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# LLM PROVIDER CONFIGURATION
# ==========================================
class LLMProvider:
    GROQ = "groq"
    GEMINI = "gemini"

# --- GROQ CONFIGURATION ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"
groq_client = None
groq_async_client = None

try:
    if GROQ_API_KEY:
        groq_client = Groq(api_key=GROQ_API_KEY)
        groq_async_client = AsyncGroq(api_key=GROQ_API_KEY)
        logger.info(f"Groq client initialized successfully", extra={
            "extra_data": {"model": GROQ_MODEL}
        })
except Exception as e:
    log_exception("Groq initialization failed", e, provider="groq")

# --- GEMINI CONFIGURATION ---
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT")
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "global")
GEMINI_MODEL = "gemini-2.5-flash"
gemini_client = None

try:
    if PROJECT_ID:
        gemini_client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)
        logger.info("Gemini Vertex AI client initialized successfully", extra={
            "extra_data": {"model": GEMINI_MODEL, "project": PROJECT_ID, "location": LOCATION}
        })
    elif os.environ.get("GOOGLE_API_KEY"):
        gemini_client = genai.Client(
            api_key=os.environ.get("GOOGLE_API_KEY"),
            http_options={'api_version': 'v1alpha'}
        )
        logger.info("Gemini API Key client initialized successfully", extra={
            "extra_data": {"model": GEMINI_MODEL}
        })
except Exception as e:
    log_exception("Gemini initialization failed", e, provider="gemini")

# Determine active provider
ACTIVE_PROVIDER = None
if groq_client:
    ACTIVE_PROVIDER = LLMProvider.GROQ
elif gemini_client:
    ACTIVE_PROVIDER = LLMProvider.GEMINI

# Log startup information
log_startup_info(
    active_provider=ACTIVE_PROVIDER,
    available_providers={
        "groq": groq_client is not None,
        "gemini": gemini_client is not None
    }
)

if not ACTIVE_PROVIDER:
    logger.critical("No LLM provider available! Please configure GROQ_API_KEY or GOOGLE_API_KEY/GOOGLE_CLOUD_PROJECT")

# ==========================================
# 0. DATA MODELS
# ==========================================
class ConnectRequest(BaseModel):
    id: str
    target: str
    type: str

class ChatRequest(BaseModel):
    session_id: str
    new_message: Dict[str, Any]
    config: Optional[Dict] = None

class ExecuteToolRequest(BaseModel):
    session_id: str
    tool_call_id: str
    tool_name: str
    tool_args: Dict[str, Any]

class CreateSessionRequest(BaseModel):
    title: str

class SaveMessageRequest(BaseModel):
    session_id: str
    message: Dict[str, Any]

class ReadResourceRequest(BaseModel):
    connection_id: str
    uri: str

class GetPromptRequest(BaseModel):
    connection_id: str
    name: str
    args: Optional[Dict[str, str]] = {}

# ==========================================
# 1. CHAT CONNECTION MANAGER (MCP)
# ==========================================
class MCPConnection:
    def __init__(self, name: str, session: ClientSession, exit_stack: AsyncExitStack, 
                 tools: List[Any], resources: List[Any], prompts: List[Any]):
        self.name = name
        self.session = session
        self.exit_stack = exit_stack
        self.tools = tools
        self.resources = resources
        self.prompts = prompts

class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, MCPConnection] = {}

    async def connect(self, connection_id: str, target: str, type: str):
        start_time = time.time()
        exit_stack = AsyncExitStack()
        
        logger.info(f"Attempting MCP connection", extra={
            "extra_data": {
                "connection_id": connection_id,
                "target": target,
                "type": type
            }
        })
        
        try:
            read, write = None, None

            # --- 1. AUTO-DETECTION & VALIDATION ---
            # Auto-detect GitMCP servers
            if "gitmcp.io" in target:
                type = "sse"
                if not target.endswith("/sse"):
                    target = f"{target}/sse"
                logger.debug(f"Auto-detected GitMCP server, using SSE transport")
            
            # Auto-detect local Python scripts
            elif target.endswith('.py') or (not target.startswith('http://') and not target.startswith('https://')):
                # If it's a .py file or doesn't start with http, force stdio
                if type not in ['stdio', 'sse']:
                    logger.debug(f"Auto-correcting transport type from '{type}' to 'stdio' for local script")
                    type = 'stdio'
            
            # Validate HTTP/HTTPS URLs
            elif type == 'http' or type == 'sse':
                if not target.startswith('http://') and not target.startswith('https://'):
                    error_msg = f"Invalid URL for {type} transport. URL must start with http:// or https://"
                    logger.error(error_msg, extra={
                        "extra_data": {"target": target, "type": type}
                    })
                    raise ValueError(error_msg)

            # --- 2. TRANSPORT LOGIC ---
            if type == "stdio":
                command = ""
                args = []
                env = os.environ.copy()
                env["PYTHONUNBUFFERED"] = "1"

                # Check if target ends with .py (it's a script path)
                if target.endswith(".py"):
                    try:
                        script_path = self._find_script(target)
                        command = sys.executable
                        args = [script_path]
                        logger.debug(f"Launching local Python script", extra={
                            "extra_data": {"command": command, "script": script_path}
                        })
                    except FileNotFoundError as e:
                        logger.error(f"Script not found: {target}")
                        raise HTTPException(status_code=400, detail=str(e))
                else:
                    # Parse the full command string
                    is_windows = sys.platform == "win32"
                    try:
                        parts = shlex.split(target, posix=not is_windows)
                    except ValueError as e:
                        logger.error(f"Invalid command syntax: {target}")
                        raise HTTPException(status_code=400, detail=f"Invalid command syntax: {str(e)}")
                    
                    if not parts:
                        raise ValueError("Empty command")
                    
                    # Check if first part is 'python' or 'python3'
                    if parts[0] in ['python', 'python3', 'python.exe']:
                        command = sys.executable
                        args = parts[1:]
                        
                        if args and args[0].endswith('.py'):
                            try:
                                args[0] = self._find_script(args[0])
                            except FileNotFoundError as e:
                                logger.error(f"Script not found: {args[0]}")
                                raise HTTPException(status_code=400, detail=str(e))
                    else:
                        cmd_name = parts[0]
                        full_cmd_path = shutil.which(cmd_name)
                        if not full_cmd_path:
                            logger.warning(f"Command '{cmd_name}' not found in PATH, attempting to use as-is")
                        command = full_cmd_path if full_cmd_path else cmd_name
                        args = parts[1:]
                    
                    logger.debug(f"Launching command", extra={
                        "extra_data": {"command": command, "args": args}
                    })

                server_params = StdioServerParameters(command=command, args=args, env=env)
                
                try:
                    read, write = await exit_stack.enter_async_context(stdio_client(server_params))
                except Exception as e:
                    logger.error(f"Failed to start stdio server", extra={
                        "extra_data": {"command": command, "args": args, "error": str(e)}
                    })
                    raise HTTPException(
                        status_code=500, 
                        detail=f"Failed to start server: {str(e)}\nCommand: {command} {' '.join(args)}"
                    )
                read, write = await exit_stack.enter_async_context(stdio_client(server_params))
            
            elif type == "sse":
                logger.debug(f"Establishing SSE connection to {target}")
                try:
                    read, write = await exit_stack.enter_async_context(
                        sse_client(target, headers={"User-Agent": "mcp-client/1.0"}, timeout=120.0)
                    )
                except Exception as e:
                    logger.error(f"SSE connection failed", extra={
                        "extra_data": {"target": target, "error": str(e)}
                    })
                    raise HTTPException(
                        status_code=500,
                        detail=f"SSE connection failed: {str(e)}\nURL: {target}"
                    )
            
            elif type == "http":
                if not streamable_http_client:
                    raise ValueError("HTTP transport library not found.")
                logger.debug(f"Establishing HTTP connection to {target}")
                try:
                    read, write, _ = await exit_stack.enter_async_context(streamable_http_client(target))
                except Exception as e:
                    logger.error(f"HTTP connection failed", extra={
                        "extra_data": {"target": target, "error": str(e)}
                    })
                    raise HTTPException(
                        status_code=500,
                        detail=f"HTTP connection failed: {str(e)}\nURL: {target}"
                    )
            
            else:
                raise ValueError(f"Unknown connection type: {type}")

            # --- 3. INITIALIZE SESSION ---
            logger.debug(f"Initializing MCP session")
            try:
                session = await exit_stack.enter_async_context(ClientSession(read, write))
                
                # Add timeout for initialization
                import asyncio
                try:
                    await asyncio.wait_for(session.initialize(), timeout=30.0)
                except asyncio.TimeoutError:
                    raise HTTPException(
                        status_code=504,
                        detail=f"Connection timeout: Server did not respond within 30 seconds. "
                               f"The server may be starting up or not responding to MCP protocol."
                    )
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Session initialization failed", extra={
                    "extra_data": {"error": str(e), "error_type": type(e).__name__}
                })
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to initialize MCP session: {str(e)}"
                )
            
            fetched_tools, fetched_resources, fetched_prompts = [], [], []
            try:
                fetched_tools = (await session.list_tools()).tools
            except Exception as e:
                logger.warning(f"Could not fetch tools", extra={
                    "extra_data": {"connection_id": connection_id, "error": str(e)}
                })
            
            try:
                fetched_resources = (await session.list_resources()).resources
            except Exception as e:
                logger.warning(f"Could not fetch resources", extra={
                    "extra_data": {"connection_id": connection_id, "error": str(e)}
                })
            
            try:
                fetched_prompts = (await session.list_prompts()).prompts
            except Exception as e:
                logger.warning(f"Could not fetch prompts", extra={
                    "extra_data": {"connection_id": connection_id, "error": str(e)}
                })

            self.connections[connection_id] = MCPConnection(
                name=connection_id, session=session, exit_stack=exit_stack,
                tools=fetched_tools, resources=fetched_resources, prompts=fetched_prompts
            )
            
            duration = time.time() - start_time
            
            log_mcp_connection(
                connection_id=connection_id,
                target=target,
                transport=type,
                success=True,
                tool_count=len(fetched_tools),
                resource_count=len(fetched_resources),
                prompt_count=len(fetched_prompts),
                duration=duration
            )
            
            return {
                "status": "connected",
                "tools": len(fetched_tools),
                "resources": len(fetched_resources),
                "prompts": len(fetched_prompts)
            }

        except Exception as e:
            await exit_stack.aclose()
            duration = time.time() - start_time
            
            log_mcp_connection(
                connection_id=connection_id,
                target=target,
                transport=type,
                success=False,
                error=str(e),
                duration=duration
            )
            
            logger.error("Connection failed", extra={
                "extra_data": {
                    "connection_id": connection_id,
                    "traceback": traceback.format_exc()
                }
            })
            
            raise HTTPException(status_code=500, detail=f"Connection Failed: {str(e)}")

    def _find_script(self, script_name: str) -> str:
        """Intelligently find a Python script in multiple locations."""
        cwd = os.getcwd()
        
        search_paths = [
            script_name if os.path.isabs(script_name) else None,
            os.path.join(cwd, script_name),
            os.path.join(cwd, os.path.basename(script_name)),
            os.path.join(cwd, 'backend', script_name),
            os.path.join(os.path.dirname(cwd), script_name),
            os.path.join(os.path.dirname(cwd), 'backend', script_name),
            os.path.basename(script_name),
        ]
        
        for path in search_paths:
            if path and os.path.exists(path):
                abs_path = os.path.abspath(path)
                logger.debug(f"Found script at: {abs_path}")
                return abs_path
        
        logger.error(f"Script not found", extra={
            "extra_data": {
                "script_name": script_name,
                "cwd": cwd,
                "searched_paths": [p for p in search_paths if p]
            }
        })
        
        raise FileNotFoundError(
            f"Could not find script '{script_name}'. "
            f"Current directory: {cwd}. "
            f"Try using the full filename like 'tools_server.py'"
        )

    async def disconnect(self, connection_id: str):
        if connection_id in self.connections:
            await self.connections[connection_id].exit_stack.aclose()
            del self.connections[connection_id]
            logger.info(f"Disconnected from MCP server: {connection_id}")

    def get_all_tools(self):
        all_tools = []
        tool_map = {}
       
        for conn_id, conn in self.connections.items():
            for tool in conn.tools:
                raw_name = f"{conn_id}__{tool.name}"
                sanitized_name = re.sub(r'[^a-zA-Z0-9_]', '_', raw_name)
                if not sanitized_name[0].isalpha():
                    sanitized_name = f"action_{sanitized_name}"
                sanitized_name = sanitized_name[:63]
               
                tool_map[sanitized_name] = {"connection_id": conn_id, "real_name": tool.name}
                
                tool_def = {
                    "name": sanitized_name,
                    "description": tool.description[:1024] if tool.description else "No description",
                    "parameters": tool.inputSchema if isinstance(tool.inputSchema, dict) else {}
                }
                all_tools.append(tool_def)
        
        logger.debug(f"Retrieved {len(all_tools)} tools from {len(self.connections)} connections")
        return all_tools, tool_map
    
    def get_tools_for_groq(self, tools):
        """Convert tools to Groq/OpenAI format"""
        return [
            {
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": tool["parameters"]
                }
            }
            for tool in tools
        ]
    
    def get_tools_for_gemini(self, tools):
        """Convert tools to Gemini format"""
        def clean_schema(schema: Dict[str, Any]) -> Dict[str, Any]:
            if not isinstance(schema, dict):
                return schema
            schema = schema.copy()
            for key in ['title', '$schema', 'additionalProperties', 'default']:
                if key in schema:
                    del schema[key]
            if 'type' not in schema:
                if 'properties' in schema:
                    schema['type'] = 'object'
                else:
                    schema['type'] = 'string'
            if 'properties' in schema:
                for k, v in schema['properties'].items():
                    schema['properties'][k] = clean_schema(v)
            if 'items' in schema:
                schema['items'] = clean_schema(schema['items'])
            return schema
        
        return [
            types.FunctionDeclaration(
                name=tool["name"],
                description=tool["description"],
                parameters=clean_schema(tool["parameters"])
            )
            for tool in tools
        ]

    async def execute_tool(self, unique_name: str, args: dict, tool_map: dict):
        start_time = time.time()
        info = tool_map.get(unique_name)
        
        if not info:
            logger.error(f"Tool not found: {unique_name}")
            return f"Error: Tool {unique_name} not found."
        
        conn = self.connections.get(info['connection_id'])
        if not conn:
            logger.error(f"Connection lost for tool: {unique_name}")
            return "Error: Connection lost."
        
        try:
            logger.debug(f"Executing tool: {info['real_name']}", extra={
                "extra_data": {"args": args, "connection": info['connection_id']}
            })
            
            result: CallToolResult = await conn.session.call_tool(
                info['real_name'], 
                arguments=args
            )
            
            duration = time.time() - start_time
            
            if result.isError:
                error_msg = f"Tool Execution Error: {result.content}"
                log_tool_execution(
                    tool_name=info['real_name'],
                    session_id="N/A",
                    args=args,
                    result=None,
                    duration=duration,
                    success=False,
                    error=error_msg
                )
                return error_msg
            
            output_parts = []
            
            if hasattr(result, "structuredContent") and result.structuredContent:
                output_parts.append(json.dumps(result.structuredContent, indent=2))
            
            if result.content:
                for content in result.content:
                    if isinstance(content, TextContent):
                        output_parts.append(content.text)
                    elif isinstance(content, ImageContent):
                        output_parts.append(f"[Image Returned: {content.mimeType}]")
                    elif isinstance(content, EmbeddedResource):
                        output_parts.append(f"[Resource Embedded: {content.resource.uri}]")
                    else:
                        output_parts.append(str(content))
            
            final_out = "\n".join(output_parts)
            
            # Truncate if too long
            if len(final_out) > MAX_TOOL_RESULT_LENGTH:
                original_length = len(final_out)
                truncated = final_out[:MAX_TOOL_RESULT_LENGTH]
                
                logger.warning(f"Tool output truncated", extra={
                    "extra_data": {
                        "tool": info['real_name'],
                        "original_length": original_length,
                        "truncated_length": MAX_TOOL_RESULT_LENGTH
                    }
                })
                
                final_out = (
                    f"{truncated}\n\n"
                    f"{'='*60}\n"
                    f"⚠️  OUTPUT TRUNCATED FOR PERFORMANCE\n"
                    f"{'='*60}\n"
                    f"📊 Original length: {original_length:,} characters\n"
                    f"📊 Displayed: {MAX_TOOL_RESULT_LENGTH:,} characters\n"
                    f"💡 Tip: Ask me to summarize or extract specific parts\n"
                    f"{'='*60}"
                )
            
            log_tool_execution(
                tool_name=info['real_name'],
                session_id="N/A",
                args=args,
                result=final_out,
                duration=duration,
                success=True
            )
            
            return final_out if final_out else "✅ Success (No output)"
            
        except Exception as e:
            duration = time.time() - start_time
            error_msg = f"❌ Tool Exception: {str(e)}"
            
            log_exception("Tool execution failed", e, 
                tool_name=info['real_name'],
                args=args
            )
            
            log_tool_execution(
                tool_name=info['real_name'],
                session_id="N/A",
                args=args,
                result=None,
                duration=duration,
                success=False,
                error=str(e)
            )
            
            return error_msg

    async def read_resource(self, connection_id: str, uri: str):
        conn = self.connections.get(connection_id)
        if not conn:
            raise ValueError("Connection not found")
        
        logger.debug(f"Reading resource: {uri}", extra={
            "extra_data": {"connection_id": connection_id}
        })
        
        result = await conn.session.read_resource(uri)
        contents = []
        for item in result.contents:
            if hasattr(item, "text"):
                contents.append(item.text)
            elif hasattr(item, "blob"):
                contents.append(f"[Binary Blob: {item.mimeType}]")
        return "\n\n".join(contents)

    async def get_prompt(self, connection_id: str, name: str, args: dict):
        conn = self.connections.get(connection_id)
        if not conn:
            raise ValueError("Connection not found")
        
        logger.debug(f"Getting prompt: {name}", extra={
            "extra_data": {"connection_id": connection_id, "args": args}
        })
        
        result = await conn.session.get_prompt(name, arguments=args)
        prompt_text = []
        for msg in result.messages:
            if hasattr(msg.content, 'text'):
                prompt_text.append(msg.content.text)
        return "\n".join(prompt_text)

manager = ConnectionManager()

# ==========================================
# 2. CORE LOGIC (Multi-Provider Support)
# ==========================================

async def stream_groq_response(session_id: str, raw_history: List[Dict]):
    start_time = time.time()
    
    if not groq_async_client:
        logger.error("Groq client not initialized")
        yield f"data: {json.dumps({'error': 'Groq client not initialized'})}\n\n"
        return
    
    mcp_tools, tool_map = manager.get_all_tools()
    groq_tools = manager.get_tools_for_groq(mcp_tools)

    # Convert history to Groq format
    groq_messages = []
    
    # Add system message with clear instructions
    if groq_tools:
        tool_names = "\n".join([f"- {t['function']['name']}: {t['function']['description']}" for t in groq_tools[:10]])
        system_msg = {
            "role": "system",
            "content": f"""You are a helpful AI assistant with access to tools.

Available Tools:
{tool_names}

IMPORTANT INSTRUCTIONS:
- When users ask "what tools do you have" or "list your tools", simply DESCRIBE the available tools in natural language. DO NOT execute them.
- Only use tools when the user specifically asks you to perform an action (e.g., "fetch the documentation", "get the data").
- If a tool returns a lot of data, summarize it concisely.
- Always explain what you're doing before using a tool."""
        }
        groq_messages.append(system_msg)
    
    for msg in raw_history:
        role = msg['role']
        
        # Handle tool results - TRUNCATE LONG OUTPUTS
        if msg.get('is_tool_result'):
            content = msg['content']
            max_tool_result_length = 8000
            if len(content) > max_tool_result_length:
                content = content[:max_tool_result_length] + f"\n\n[... Output truncated. Total length: {len(msg['content'])} characters]"
            
            groq_messages.append({
                "role": "tool",
                "tool_call_id": msg.get('tool_call_id', 'unknown'),
                "content": content
            })
            continue
        
        # Handle assistant messages with tool calls
        if role == "model" or role == "assistant":
            message = {"role": "assistant"}
            
            if msg.get('content'):
                message["content"] = msg['content']
            
            if msg.get('toolCalls'):
                message["tool_calls"] = [
                    {
                        "id": tc['id'],
                        "type": "function",
                        "function": {
                            "name": tc['name'],
                            # Ensure arguments is NEVER None. It must be a JSON string.
                            "arguments": json.dumps(tc['args']) if isinstance(tc['args'], dict) else (tc['args'] or "{}")
                        }
                    }
                    for tc in msg['toolCalls']
                ]
            
            groq_messages.append(message)
        
        # Handle user messages
        elif role == "user":
            groq_messages.append({
                "role": "user",
                "content": msg['content']
            })

    if not groq_messages:
        return

    try:
        logger.debug(f"Sending request to Groq", extra={
            "extra_data": {
                "session_id": session_id,
                "message_count": len(groq_messages),
                "has_tools": len(groq_tools) > 0
            }
        })
        
        # Make streaming request to Groq
        stream = await groq_async_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=groq_messages,
            tools=groq_tools if groq_tools else None,
            tool_choice="auto",
            temperature=0.7,
            parallel_tool_calls=False,
            max_tokens=2048,
            stream=True
        )

        final_text = ""
        tool_calls_buffer = {}
        
        async for chunk in stream:
            if not chunk.choices:
                continue
            
            delta = chunk.choices[0].delta
            
            # Handle text content
            if delta.content:
                final_text += delta.content
                yield f"data: {json.dumps({'type': 'text', 'content': delta.content})}\n\n"
            
            # Handle tool calls
            if delta.tool_calls:
                for tool_call in delta.tool_calls:
                    idx = tool_call.index
                    
                    if idx not in tool_calls_buffer:
                        tool_calls_buffer[idx] = {
                            "id": tool_call.id or "",
                            "name": "",
                            "arguments": ""
                        }
                    
                    if tool_call.id:
                        tool_calls_buffer[idx]["id"] = tool_call.id
                    
                    if tool_call.function:
                        if tool_call.function.name:
                            tool_calls_buffer[idx]["name"] = tool_call.function.name
                        if tool_call.function.arguments:
                            tool_calls_buffer[idx]["arguments"] += tool_call.function.arguments
        
        # Process completed tool calls
        if tool_calls_buffer:
            tool_calls_list = []
            for tool_call_data in tool_calls_buffer.values():
                try:
                    args = json.loads(tool_call_data["arguments"])
                except:
                    args = {}
                
                tool_data = {
                    "id": tool_call_data["id"],
                    "name": tool_call_data["name"],
                    "args": args
                }
                tool_calls_list.append(tool_data)
            
            # Save assistant message with tool calls
            db.add_message(session_id, {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "content": final_text,
                "toolCalls": tool_calls_list
            })
            
            # Send tool approval request for first tool
            if tool_calls_list:
                yield f"data: {json.dumps({'type': 'tool_approval_request', 'tool': tool_calls_list[0]})}\n\n"
            
            yield "data: [DONE]\n\n"
            
            duration = time.time() - start_time
            log_llm_request(
                provider="groq",
                model=GROQ_MODEL,
                session_id=session_id,
                message_count=len(groq_messages),
                duration=duration,
                success=True
            )
            return
        
        # Save final message if no tool calls
        if final_text:
            db.add_message(session_id, {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "content": final_text
            })
        
        duration = time.time() - start_time
        log_llm_request(
            provider="groq",
            model=GROQ_MODEL,
            session_id=session_id,
            message_count=len(groq_messages),
            duration=duration,
            success=True
        )
        
        yield "data: [DONE]\n\n"

    except Exception as e:
        duration = time.time() - start_time
        log_llm_request(
            provider="groq",
            model=GROQ_MODEL,
            session_id=session_id,
            message_count=len(groq_messages),
            duration=duration,
            success=False,
            error=str(e)
        )
        log_exception("Groq API error", e, session_id=session_id)
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

async def stream_gemini_response(session_id: str, raw_history: List[Dict]):
    start_time = time.time()
    
    if not gemini_client:
        logger.error("Gemini client not initialized")
        yield f"data: {json.dumps({'error': 'Gemini client not initialized'})}\n\n"
        return
    
    mcp_tools, tool_map = manager.get_all_tools()
    gemini_tools = manager.get_tools_for_gemini(mcp_tools)

    system_instruction = "You are a helpful AI assistant."
    if gemini_tools:
        tool_names = ", ".join([t.name for t in gemini_tools[:10]])
        system_instruction = f"""You are a helpful AI assistant with access to tools.

Available Tools: {tool_names}

IMPORTANT INSTRUCTIONS:
- When users ask "what tools do you have" or "list your tools", simply DESCRIBE the available tools. DO NOT execute them.
- Only use tools when the user specifically asks you to perform an action.
- If a tool returns a lot of data, summarize it concisely.
- Always explain what you're doing before using a tool.
"""

    config = types.GenerateContentConfig(
        tools=[types.Tool(function_declarations=gemini_tools)] if gemini_tools else None,
        temperature=1.0,
        system_instruction=system_instruction,
    )

    gemini_history = []
   
    for msg in raw_history:
        role = "model" if msg['role'] == "model" else "user"
        parts = []
       
        if msg.get('toolCalls'):
            for tc in msg['toolCalls']:
                function_call_part = types.Part.from_function_call(
                    name=tc['name'],
                    args=tc['args']
                )
                parts.append(function_call_part)
       
        elif msg.get('is_tool_result'):
            tool_name = "unknown_tool"
            match = re.search(r"Tool '([^']+)' Output:", msg.get('content', ''))
            if match:
                tool_name = match.group(1)
            
            # Truncate long tool results
            content = msg['content']
            max_length = 8000
            if len(content) > max_length:
                content = content[:max_length] + f"\n\n[... Output truncated. Total: {len(msg['content'])} chars]"
           
            parts.append(types.Part.from_function_response(
                name=tool_name,
                response={"result": content}
            ))

        elif msg.get('content'):
            parts.append(types.Part.from_text(text=msg['content']))
           
        if parts:
            gemini_history.append(types.Content(role=role, parts=parts))

    if not gemini_history:
        return

    try:
        logger.debug(f"Sending request to Gemini", extra={
            "extra_data": {
                "session_id": session_id,
                "message_count": len(gemini_history),
                "has_tools": len(gemini_tools) > 0
            }
        })
        
        response_stream = await gemini_client.aio.models.generate_content_stream(
            model=GEMINI_MODEL, contents=gemini_history, config=config
        )

        final_text = ""
       
        async for chunk in response_stream:
            if not chunk.candidates:
                continue
           
            cand = chunk.candidates[0]
           
            for part in cand.content.parts:
                if part.function_call:
                    call_id = str(uuid.uuid4())
                    tool_data = {
                        "id": call_id,
                        "name": part.function_call.name,
                        "args": dict(part.function_call.args)
                    }
                   
                    yield f"data: {json.dumps({'type': 'tool_approval_request', 'tool': tool_data})}\n\n"
                   
                    db.add_message(session_id, {
                        "id": str(uuid.uuid4()),
                        "role": "model",
                        "content": final_text,
                        "toolCalls": [tool_data]
                    })
                   
                    yield "data: [DONE]\n\n"
                    
                    duration = time.time() - start_time
                    log_llm_request(
                        provider="gemini",
                        model=GEMINI_MODEL,
                        session_id=session_id,
                        message_count=len(gemini_history),
                        duration=duration,
                        success=True
                    )
                    return

                if part.text:
                    final_text += part.text
                    yield f"data: {json.dumps({'type': 'text', 'content': part.text})}\n\n"

        if final_text:
            db.add_message(session_id, {
                "id": str(uuid.uuid4()),
                "role": "model",
                "content": final_text
            })
        
        duration = time.time() - start_time
        log_llm_request(
            provider="gemini",
            model=GEMINI_MODEL,
            session_id=session_id,
            message_count=len(gemini_history),
            duration=duration,
            success=True
        )
       
        yield "data: [DONE]\n\n"

    except Exception as e:
        duration = time.time() - start_time
        log_llm_request(
            provider="gemini",
            model=GEMINI_MODEL,
            session_id=session_id,
            message_count=len(gemini_history),
            duration=duration,
            success=False,
            error=str(e)
        )
        log_exception("Gemini API error", e, session_id=session_id)
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

async def stream_llm_response(session_id: str, raw_history: List[Dict], provider: str = None):
    """Route to appropriate LLM provider"""
    if provider is None:
        provider = ACTIVE_PROVIDER
    
    if provider == LLMProvider.GROQ:
        async for chunk in stream_groq_response(session_id, raw_history):
            yield chunk
    elif provider == LLMProvider.GEMINI:
        async for chunk in stream_gemini_response(session_id, raw_history):
            yield chunk
    else:
        logger.error("No LLM provider available")
        yield f"data: {json.dumps({'error': 'No LLM provider available'})}\n\n"

# ==========================================
# 3. ENDPOINTS
# ==========================================

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest, bg_tasks: BackgroundTasks):
    start_time = time.time()
    
    if not ACTIVE_PROVIDER:
        logger.error("No LLM provider initialized")
        raise HTTPException(500, "No LLM provider initialized. Please set GROQ_API_KEY or GOOGLE_API_KEY/GOOGLE_CLOUD_PROJECT.")
   
    db.add_message(request.session_id, request.new_message)
   
    raw_history = db.get_messages(request.session_id)
    
    # Get provider from config or use active
    provider = request.config.get("provider") if request.config else None
    
    # Generate title for new conversations
    if len(raw_history) <= 1:
        async def gen_title():
            try:
                if ACTIVE_PROVIDER == LLMProvider.GROQ and groq_client:
                    response = groq_client.chat.completions.create(
                        model=GROQ_MODEL,
                        messages=[
                            {"role": "user", "content": f"Generate a short 3-5 word title for this message: {request.new_message.get('content')}"}
                        ],
                        max_tokens=20,
                        temperature=0.7
                    )
                    if response.choices[0].message.content:
                        title = response.choices[0].message.content.strip()[:50]
                        db.update_session_title(request.session_id, title)
                        logger.debug(f"Generated session title: {title}", extra={
                            "extra_data": {"session_id": request.session_id}
                        })
                
                elif ACTIVE_PROVIDER == LLMProvider.GEMINI and gemini_client:
                    res = await gemini_client.aio.models.generate_content(
                        model=GEMINI_MODEL,
                        contents=f"Generate a short 3-5 word title: {request.new_message.get('content')}",
                        config=types.GenerateContentConfig(max_output_tokens=20)
                    )
                    if res.text:
                        title = res.text.strip()[:50]
                        db.update_session_title(request.session_id, title)
                        logger.debug(f"Generated session title: {title}", extra={
                            "extra_data": {"session_id": request.session_id}
                        })
            except Exception as e:
                log_exception("Title generation failed", e, session_id=request.session_id)
        
        bg_tasks.add_task(gen_title)
    
    duration = time.time() - start_time
    log_api_request(
        endpoint="/api/chat",
        method="POST",
        status_code=200,
        duration=duration,
        session_id=request.session_id
    )
 
    return StreamingResponse(stream_llm_response(request.session_id, raw_history, provider), media_type="text/event-stream")

@app.post("/api/tools/execute")
async def execute_tool_endpoint(req: ExecuteToolRequest):
    start_time = time.time()
    
    logger.info(f"Tool execution requested", extra={
        "extra_data": {
            "tool_name": req.tool_name,
            "session_id": req.session_id,
            "tool_call_id": req.tool_call_id
        }
    })
    
    _, tool_map = manager.get_all_tools()
    result_text = await manager.execute_tool(req.tool_name, req.tool_args, tool_map)
   
    db.add_message(req.session_id, {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": f"Tool '{req.tool_name}' Output:\n{result_text}",
        "is_tool_result": True,
        "tool_call_id": req.tool_call_id
    })
 
    async def generator():
        yield f"data: {json.dumps({'type': 'tool_result', 'tool': req.tool_name, 'result': result_text})}\n\n"
        raw_history = db.get_messages(req.session_id)
        async for chunk in stream_llm_response(req.session_id, raw_history):
            yield chunk
    
    duration = time.time() - start_time
    log_api_request(
        endpoint="/api/tools/execute",
        method="POST",
        status_code=200,
        duration=duration,
        session_id=req.session_id
    )
 
    return StreamingResponse(generator(), media_type="text/event-stream")

# --- STANDARD ENDPOINTS ---
@app.get("/api/llm/status")
async def get_llm_status():
    """Get status of all LLM providers"""
    status = {
        "active_provider": ACTIVE_PROVIDER,
        "providers": {
            "groq": {
                "available": groq_client is not None,
                "model": GROQ_MODEL if groq_client else None
            },
            "gemini": {
                "available": gemini_client is not None,
                "model": GEMINI_MODEL if gemini_client else None
            }
        }
    }
    logger.debug("LLM status requested", extra={"extra_data": status})
    return status

@app.post("/api/llm/switch")
async def switch_provider(provider: str):
    """Switch active LLM provider"""
    global ACTIVE_PROVIDER
    
    logger.info(f"Provider switch requested", extra={
        "extra_data": {"requested_provider": provider, "current_provider": ACTIVE_PROVIDER}
    })
    
    if provider == LLMProvider.GROQ and groq_client:
        ACTIVE_PROVIDER = LLMProvider.GROQ
        logger.info(f"Switched to Groq provider")
        return {"status": "success", "provider": ACTIVE_PROVIDER}
    elif provider == LLMProvider.GEMINI and gemini_client:
        ACTIVE_PROVIDER = LLMProvider.GEMINI
        logger.info(f"Switched to Gemini provider")
        return {"status": "success", "provider": ACTIVE_PROVIDER}
    else:
        logger.warning(f"Provider switch failed - provider not available", extra={
            "extra_data": {"requested_provider": provider}
        })
        raise HTTPException(400, f"Provider '{provider}' not available")

@app.get("/api/mcp/tools/list")
async def list_all_tools():
    """List all available MCP tools without executing them"""
    all_tools, tool_map = manager.get_all_tools()
    
    tools_info = []
    for tool in all_tools:
        tools_info.append({
            "name": tool["name"],
            "description": tool["description"],
            "parameters": tool["parameters"]
        })
    
    logger.debug(f"Listed {len(tools_info)} tools")
    
    return {
        "tools": tools_info,
        "count": len(tools_info)
    }

@app.get("/api/mcp/status")
async def get_mcp_status():
    status = {
        "connections": [
            {
                "id": k,
                "tools": len(v.tools),
                "resources": len(v.resources),
                "prompts": len(v.prompts)
            }
            for k, v in manager.connections.items()
        ]
    }
    logger.debug("MCP status requested", extra={"extra_data": status})
    return status

@app.post("/api/mcp/connect")
async def connect_mcp(req: ConnectRequest):
    start_time = time.time()
    
    # Validate and auto-correct connection type
    original_type = req.type
    target = req.target
    
    # Auto-detect correct type based on target
    if target.endswith('.py') or (not target.startswith('http://') and not target.startswith('https://')):
        # Local script - must be stdio
        if req.type != 'stdio':
            logger.warning(f"Auto-correcting connection type from '{req.type}' to 'stdio' for local script", extra={
                "extra_data": {"target": target, "original_type": req.type}
            })
            req.type = 'stdio'
    elif 'gitmcp.io' in target:
        # GitMCP server - must be SSE
        if req.type != 'sse':
            logger.warning(f"Auto-correcting connection type from '{req.type}' to 'sse' for GitMCP server", extra={
                "extra_data": {"target": target, "original_type": req.type}
            })
            req.type = 'sse'
    
    try:
        result = await manager.connect(req.id, req.target, req.type)
        duration = time.time() - start_time
        
        log_api_request(
            endpoint="/api/mcp/connect",
            method="POST",
            status_code=200,
            duration=duration
        )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        log_api_request(
            endpoint="/api/mcp/connect",
            method="POST",
            status_code=500,
            duration=duration,
            error=str(e)
        )
        raise

@app.post("/api/mcp/disconnect/{id}")
async def disconnect_mcp(id: str):
    await manager.disconnect(id)
    return {"status": "disconnected"}

@app.get("/api/mcp/resources/list")
async def list_resources():
    all_resources = []
    for conn_id, conn in manager.connections.items():
        for r in conn.resources:
            all_resources.append({
                "connection_id": conn_id,
                "name": r.name,
                "uri": r.uri,
                "mimeType": r.mimeType,
                "description": r.description
            })
    
    logger.debug(f"Listed {len(all_resources)} resources")
    return {"resources": all_resources}

@app.post("/api/mcp/resources/read")
async def read_resource(req: ReadResourceRequest):
    start_time = time.time()
    try:
        content = await manager.read_resource(req.connection_id, req.uri)
        duration = time.time() - start_time
        
        logger.info(f"Resource read successfully", extra={
            "extra_data": {
                "connection_id": req.connection_id,
                "uri": req.uri,
                "content_length": len(content),
                "duration_ms": round(duration * 1000, 2)
            }
        })
        return {"content": content}
    except Exception as e:
        duration = time.time() - start_time
        log_exception("Resource read failed", e, 
            connection_id=req.connection_id,
            uri=req.uri,
            duration_ms=round(duration * 1000, 2)
        )
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mcp/prompts/list")
async def list_prompts():
    all_prompts = []
    for conn_id, conn in manager.connections.items():
        for p in conn.prompts:
            all_prompts.append({
                "connection_id": conn_id,
                "name": p.name,
                "description": p.description,
                "arguments": [dict(a) for a in p.arguments] if p.arguments else []
            })
    
    logger.debug(f"Listed {len(all_prompts)} prompts")
    return {"prompts": all_prompts}

@app.post("/api/mcp/prompts/get")
async def get_prompt(req: GetPromptRequest):
    start_time = time.time()
    try:
        content = await manager.get_prompt(req.connection_id, req.name, req.args)
        duration = time.time() - start_time
        
        logger.info(f"Prompt retrieved successfully", extra={
            "extra_data": {
                "connection_id": req.connection_id,
                "prompt_name": req.name,
                "duration_ms": round(duration * 1000, 2)
            }
        })
        return {"content": content}
    except Exception as e:
        duration = time.time() - start_time
        log_exception("Prompt retrieval failed", e,
            connection_id=req.connection_id,
            prompt_name=req.name,
            duration_ms=round(duration * 1000, 2)
        )
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions")
async def get_sessions():
    sessions = db.get_sessions()
    logger.debug(f"Retrieved {len(sessions)} sessions")
    return sessions

@app.post("/api/sessions")
async def create_session(req: CreateSessionRequest):
    id = db.create_session(req.title)
    log_session_event("created", id, {"title": req.title})
    return {"id": id, "title": req.title}

@app.delete("/api/sessions/{id}")
async def delete_session(id: str):
    db.delete_session(id)
    log_session_event("deleted", id)
    return {"status": "deleted"}

@app.get("/api/sessions/{id}/messages")
async def get_messages(id: str):
    messages = db.get_messages(id)
    logger.debug(f"Retrieved {len(messages)} messages for session {id}")
    return messages

@app.post("/api/messages")
async def save_message(req: SaveMessageRequest):
    db.add_message(req.session_id, req.message)
    logger.debug(f"Message saved", extra={
        "extra_data": {
            "session_id": req.session_id,
            "message_id": req.message.get('id')
        }
    })
    return {"status": "saved"}

# ==========================================
# 4. DEBUGGER WEBSOCKET
# ==========================================
@app.websocket("/ws/mcp")
async def mcp_websocket(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection accepted")
    
    try:
        init_data = await websocket.receive_json()
        if init_data.get("command") != "connect":
            logger.warning("Invalid WebSocket command", extra={
                "extra_data": {"command": init_data.get("command")}
            })
            return
       
        target = init_data.get("path")
        conn_type = init_data.get("type") or ("http" if target.startswith("http") else "stdio")
        
        logger.info(f"WebSocket MCP connection request", extra={
            "extra_data": {"target": target, "type": conn_type}
        })

        async with AsyncExitStack() as stack:
            read, write = None, None

            if conn_type == "stdio":
                env = os.environ.copy()
                if target.endswith(".py"):
                    cmd = sys.executable
                    args = [target]
                else:
                    parts = shlex.split(target, posix=sys.platform != "win32")
                    cmd = shutil.which(parts[0]) or parts[0]
                    args = parts[1:]
               
                server_params = StdioServerParameters(command=cmd, args=args, env=env)
                read, write = await stack.enter_async_context(stdio_client(server_params))
           
            elif conn_type == "sse":
                read, write = await stack.enter_async_context(sse_client(target))
           
            elif conn_type == "http":
                read, write, _ = await stack.enter_async_context(streamable_http_client(target))

            async with ClientSession(read, write) as session:
                await session.initialize()
                await websocket.send_json({"status": "connected", "message": "Connected"})
                logger.info("WebSocket MCP session established")
               
                while True:
                    try:
                        msg = await websocket.receive_json()
                        cmd = msg.get("command")
                        
                        logger.debug(f"WebSocket command received", extra={
                            "extra_data": {"command": cmd}
                        })
                       
                        if cmd == "list_tools":
                            tools = await session.list_tools()
                            await websocket.send_json({
                                "type": "tools_list",
                                "data": [
                                    {
                                        "name": t.name,
                                        "description": t.description,
                                        "schema": t.inputSchema
                                    }
                                    for t in tools.tools
                                ]
                            })
                       
                        elif cmd == "call_tool":
                            tool_name = msg.get("name")
                            tool_args = msg.get("args", {})
                            
                            logger.info(f"WebSocket tool call", extra={
                                "extra_data": {"tool": tool_name, "args": tool_args}
                            })
                            
                            res = await session.call_tool(tool_name, tool_args)
                            text = ""
                            if hasattr(res, 'content') and res.content:
                                text = "\n".join([c.text for c in res.content if hasattr(c, 'text')])
                            
                            await websocket.send_json({
                                "type": "log",
                                "message": f"Result:\n{text}"
                            })
                   
                    except WebSocketDisconnect:
                        logger.info("WebSocket disconnected")
                        break

    except Exception as e:
        log_exception("WebSocket error", e)
        try:
            await websocket.close()
        except:
            pass

# ==========================================
# STARTUP/SHUTDOWN EVENTS
# ==========================================
@app.on_event("startup")
async def startup_event():
    logger.info("="*60)
    logger.info("🚀 MCP Station Starting Up")
    logger.info("="*60)
    logger.info(f"Active LLM Provider: {ACTIVE_PROVIDER or 'NONE'}")
    logger.info(f"Available Providers: Groq={'✓' if groq_client else '✗'}, Gemini={'✓' if gemini_client else '✗'}")
    logger.info("="*60)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("="*60)
    logger.info("🛑 MCP Station Shutting Down")
    logger.info("="*60)
    
    # Disconnect all MCP connections
    for conn_id in list(manager.connections.keys()):
        await manager.disconnect(conn_id)
    
    logger.info("All MCP connections closed")
    logger.info("="*60)

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Uvicorn server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)