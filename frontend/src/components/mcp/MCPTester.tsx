import React, { useState, useRef, useEffect } from 'react';
import { TableIcon, PencilIcon, DocumentTextIcon, CheckCircleIcon, RefreshIcon } from '../chat/icons';
 
// --- Types ---
interface Tool {
  name: string;
  description: string;
  schema: any;
}
 
interface Resource {
  uri: string;
  name: string;
  description?: string;
}
 
interface Prompt {
  name: string;
  description?: string;
  arguments: { name: string; required: boolean }[];
}
 
type LogMessage = {
  timestamp: string;
  text: string;
  isError?: boolean;
};
 
export const MCPTester: React.FC = () => {
  // Connection State
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [serverPath, setServerPath] = useState("https://gitmcp.io/langchain-ai/langchain");
  const [connectionType, setConnectionType] = useState<'stdio' | 'http' | 'sse'>('http');
  const [isConnected, setIsConnected] = useState(false);
 
  // Data State
  const [activeTab, setActiveTab] = useState<'tools' | 'resources' | 'prompts'>('tools');
  const [tools, setTools] = useState<Tool[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
 
  // Selection State
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [argsInput, setArgsInput] = useState<string>("{}");
 
  // Logs
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
 
  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
 
  const addLog = (text: string, isError = false) => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), text, isError }]);
  };
 
  const connect = () => {
    if (!serverPath) return;
    addLog(`Connecting to ${serverPath} via ${connectionType}...`);
   
    // Dynamic WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/mcp`;
   
    const ws = new WebSocket(wsUrl);
   
    ws.onopen = () => {
      ws.send(JSON.stringify({
        command: "connect",
        path: serverPath,
        type: connectionType
      }));
    };
 
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
     
      if (data.error) {
        addLog(data.error, true);
        setIsConnected(false);
      }
      else if (data.status === "connected") {
        setIsConnected(true);
        addLog("✅ Connected to Server");
        ws.send(JSON.stringify({ command: "list_tools" }));
      }
      else if (data.type === "tools_list") setTools(data.data);
      else if (data.type === "resources_list") setResources(data.data);
      else if (data.type === "prompts_list") setPrompts(data.data);
      else if (data.type === "log") addLog(data.message);
    };
 
    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
      addLog("🔌 Disconnected");
    };
 
    setSocket(ws);
  };
 
  const disconnect = () => socket?.close();
 
  const handleExecute = () => {
    if (!socket) return;
    try {
      const args = JSON.parse(argsInput);
     
      if (activeTab === 'tools' && selectedTool) {
        addLog(`🚀 Calling Tool: ${selectedTool.name}...`);
        socket.send(JSON.stringify({ command: "call_tool", name: selectedTool.name, args }));
      }
      else if (activeTab === 'prompts' && selectedPrompt) {
        addLog(`📝 Generating Prompt: ${selectedPrompt.name}...`);
        socket.send(JSON.stringify({ command: "get_prompt", name: selectedPrompt.name, args }));
      }
    } catch (e) {
      addLog("❌ Invalid JSON arguments", true);
    }
  };
 
  const handleReadResource = (uri: string) => {
    if (!socket) return;
    addLog(`📖 Reading: ${uri}...`);
    socket.send(JSON.stringify({ command: "read_resource", uri }));
  };
 
  const getPlaceholder = () => {
    if (connectionType === 'stdio') return "e.g. uv run main.py";
    if (connectionType === 'http') return "e.g. https://gitmcp.io/... (Streamable HTTP)";
    return "e.g. https://.../sse (Legacy SSE)";
  }
 
  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-primary)] p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex gap-2 w-full sm:w-auto items-center">
         
          {/* Transport Selector */}
          <select
            value={connectionType}
            onChange={(e) => setConnectionType(e.target.value as any)}
            disabled={isConnected}
            className="p-2.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none cursor-pointer"
          >
            <option value="http">HTTP (Remote)</option>
            <option value="stdio">Stdio (Local)</option>
            <option value="sse">SSE (Legacy)</option>
          </select>
 
          <input
            type="text"
            value={serverPath}
            onChange={(e) => setServerPath(e.target.value)}
            placeholder={getPlaceholder()}
            className="flex-1 sm:w-96 p-2.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none font-mono"
            disabled={isConnected}
          />
         
          {!isConnected ? (
            <button onClick={connect} className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
              Connect
            </button>
          ) : (
            <button onClick={disconnect} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
              Disconnect
            </button>
          )}
        </div>
      </div>
 
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Panel: Explorer */}
        <div className="w-1/3 flex flex-col bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
         
          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            {(['tools', 'resources', 'prompts'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--bg-tertiary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
 
          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {!isConnected && <div className="p-4 text-center text-[var(--text-secondary)] text-sm italic">Waiting for connection...</div>}
 
            {/* TOOLS LIST */}
            {activeTab === 'tools' && tools.map(tool => (
              <button
                key={tool.name}
                onClick={() => {
                  setSelectedTool(tool);
                  setArgsInput(JSON.stringify(tool.schema?.properties || {}, null, 2));
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedTool?.name === tool.name
                    ? 'border-[var(--accent)] bg-[var(--bg-tertiary)] ring-1 ring-[var(--accent)]'
                    : 'border-transparent hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <TableIcon size={16} className="text-[var(--accent)]" />
                  <span className="font-semibold text-[var(--text-primary)] text-sm">{tool.name}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{tool.description}</p>
              </button>
            ))}
 
            {/* RESOURCES LIST */}
            {activeTab === 'resources' && resources.map(res => (
              <button
                key={res.uri}
                onClick={() => handleReadResource(res.uri)}
                className="w-full text-left p-3 rounded-lg border border-transparent hover:bg-[var(--bg-tertiary)] transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <DocumentTextIcon size={16} className="text-emerald-500" />
                  <span className="font-semibold text-[var(--text-primary)] text-sm">{res.name}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-mono truncate">{res.uri}</p>
              </button>
            ))}
 
            {/* PROMPTS LIST */}
            {activeTab === 'prompts' && prompts.map(prompt => (
              <button
                key={prompt.name}
                onClick={() => {
                  setSelectedPrompt(prompt);
                  const demoArgs = prompt.arguments.reduce((acc, arg) => ({ ...acc, [arg.name]: "" }), {});
                  setArgsInput(JSON.stringify(demoArgs, null, 2));
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedPrompt?.name === prompt.name
                    ? 'border-[var(--accent)] bg-[var(--bg-tertiary)]'
                    : 'border-transparent hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <PencilIcon size={16} className="text-amber-500" />
                  <span className="font-semibold text-[var(--text-primary)] text-sm">{prompt.name}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{prompt.description}</p>
              </button>
            ))}
          </div>
        </div>
 
        {/* Right Panel: Action & Output */}
        <div className="w-2/3 flex flex-col gap-4">
         
          {/* Argument Editor */}
          {activeTab !== 'resources' && (
            <div className="h-1/3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-4 flex flex-col shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  {activeTab === 'tools'
                    ? `Arguments for: ${selectedTool?.name || 'None'}`
                    : `Arguments for: ${selectedPrompt?.name || 'None'}`}
                </h3>
                {/* FIXED HOVER STATE HERE */}
                <button
                  onClick={handleExecute}
                  disabled={!isConnected || (activeTab === 'tools' ? !selectedTool : !selectedPrompt)}
                  className="px-3 py-1.5 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white text-sm rounded-md font-medium transition-colors flex items-center gap-2"
                >
                  <CheckCircleIcon size={16} /> Execute
                </button>
              </div>
              <textarea
                value={argsInput}
                onChange={(e) => setArgsInput(e.target.value)}
                className="flex-1 w-full p-3 font-mono text-xs sm:text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg resize-none focus:ring-2 focus:ring-[var(--accent)] outline-none text-[var(--text-primary)]"
                placeholder="{}"
              />
            </div>
          )}
 
          {/* Logs / Output */}
          <div className={`bg-[#0f172a] rounded-xl border border-[var(--border)] flex flex-col shadow-md overflow-hidden ${activeTab === 'resources' ? 'h-full' : 'h-2/3'}`}>
            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Console Output</span>
              <button onClick={() => setLogs([])} className="text-slate-500 hover:text-slate-300 transition-colors"><RefreshIcon size={14}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm custom-scrollbar">
              {logs.length === 0 && <div className="text-slate-600 italic text-center mt-10">Ready to capture events...</div>}
              {logs.map((log, i) => (
                <div key={i} className={`break-words whitespace-pre-wrap ${log.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                  <span className="text-slate-600 mr-2">[{log.timestamp}]</span>
                  {log.text}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
 
        </div>
      </div>
    </div>
  );
};