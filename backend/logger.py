import logging
import sys
import json
from datetime import datetime
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from typing import Any, Dict, Optional
from contextlib import contextmanager
import time

# Create logs directory
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

class ColoredFormatter(logging.Formatter):
    """Enhanced colored formatter with better visual hierarchy"""
    
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
    }
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    
    EMOJI = {
        'DEBUG': '🔍',
        'INFO': '✅',
        'WARNING': '⚠️',
        'ERROR': '❌',
        'CRITICAL': '🚨',
    }
    
    def format(self, record: logging.LogRecord) -> str:
        # Add emoji and color
        emoji = self.EMOJI.get(record.levelname, '')
        color = self.COLORS.get(record.levelname, self.RESET)
        
        # Format timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime('%H:%M:%S')
        
        # Color the level name
        level_colored = f"{color}{self.BOLD}{record.levelname:8s}{self.RESET}"
        
        # Dim the module/function info
        location = f"{self.DIM}{record.name}:{record.funcName}{self.RESET}"
        
        # Build final message
        message = f"{emoji} {level_colored} {self.DIM}[{timestamp}]{self.RESET} {location} | {record.getMessage()}"
        
        # Add exception info if present
        if record.exc_info:
            message += f"\n{self.formatException(record.exc_info)}"
        
        return message

class StructuredJSONFormatter(logging.Formatter):
    """JSON formatter for structured logging to files"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
        }
        
        # Add custom fields
        if hasattr(record, "extra_data"):
            log_data["extra"] = record.extra_data
        
        # Add exception info
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data, ensure_ascii=False)

class RequestIDFilter(logging.Filter):
    """Add request ID to logs for request tracing"""
    def __init__(self):
        super().__init__()
        self.request_id = None
    
    def filter(self, record):
        record.request_id = getattr(self, 'request_id', 'N/A')
        return True

def setup_logger(
    name: str = "mcp_station",
    level: int = logging.INFO,
    log_to_file: bool = True,
    log_to_console: bool = True,
    enable_debug_file: bool = True
) -> logging.Logger:
    """
    Setup application logger with multiple handlers
    
    Args:
        name: Logger name
        level: Minimum logging level
        log_to_file: Enable file logging
        log_to_console: Enable console logging
        enable_debug_file: Enable separate debug log file
    """
    
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)  # Capture everything, handlers will filter
    
    # Clear existing handlers to avoid duplicates
    if logger.handlers:
        logger.handlers.clear()
    
    # === Console Handler (Colored, Human-Readable) ===
    if log_to_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        console_handler.setFormatter(ColoredFormatter())
        logger.addHandler(console_handler)
    
    if log_to_file:
        # === Main Application Log (JSON, Structured) ===
        app_handler = RotatingFileHandler(
            LOGS_DIR / "app.log",
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        app_handler.setLevel(logging.INFO)
        app_handler.setFormatter(StructuredJSONFormatter())
        logger.addHandler(app_handler)
        
        # === Error Log (Errors Only) ===
        error_handler = RotatingFileHandler(
            LOGS_DIR / "errors.log",
            maxBytes=10 * 1024 * 1024,
            backupCount=3,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(StructuredJSONFormatter())
        logger.addHandler(error_handler)
        
        # === Debug Log (Everything, Time-Rotated Daily) ===
        if enable_debug_file:
            debug_handler = TimedRotatingFileHandler(
                LOGS_DIR / "debug.log",
                when='midnight',
                interval=1,
                backupCount=7,  # Keep 7 days
                encoding='utf-8'
            )
            debug_handler.setLevel(logging.DEBUG)
            debug_handler.setFormatter(StructuredJSONFormatter())
            logger.addHandler(debug_handler)
    
    # Prevent propagation to root logger
    logger.propagate = False
    
    return logger

# Global logger instance
logger = setup_logger()

# === Context Managers for Timing ===

@contextmanager
def log_execution_time(operation: str, level: int = logging.INFO):
    """Context manager to log execution time"""
    start = time.time()
    try:
        yield
    finally:
        duration = time.time() - start
        logger.log(
            level,
            f"{operation} completed",
            extra={
                "extra_data": {
                    "operation": operation,
                    "duration_ms": round(duration * 1000, 2),
                    "duration_s": round(duration, 3)
                }
            }
        )

# === Specialized Logging Functions ===

def log_mcp_connection(
    connection_id: str,
    target: str,
    transport: str,
    success: bool,
    tool_count: int = 0,
    resource_count: int = 0,
    prompt_count: int = 0,
    error: Optional[str] = None,
    duration: Optional[float] = None
):
    """Log MCP server connection attempts with rich metadata"""
    level = logging.INFO if success else logging.ERROR
    status = "succeeded" if success else "failed"
    
    message = f"MCP connection {status}: {connection_id}"
    
    extra_data = {
        "connection_id": connection_id,
        "target": target,
        "transport": transport,
        "success": success,
        "tool_count": tool_count,
        "resource_count": resource_count,
        "prompt_count": prompt_count,
    }
    
    if error:
        extra_data["error"] = error
    if duration:
        extra_data["duration_ms"] = round(duration * 1000, 2)
    
    logger.log(level, message, extra={"extra_data": extra_data})

def log_tool_execution(
    tool_name: str,
    session_id: str,
    args: Dict[str, Any],
    result: Optional[str],
    duration: float,
    success: bool,
    error: Optional[str] = None
):
    """Log tool execution with comprehensive details"""
    level = logging.INFO if success else logging.ERROR
    status = "succeeded" if success else "failed"
    
    message = f"Tool execution {status}: {tool_name}"
    
    extra_data = {
        "tool_name": tool_name,
        "session_id": session_id,
        "args": args,
        "success": success,
        "duration_ms": round(duration * 1000, 2),
    }
    
    if result:
        extra_data["result_length"] = len(result)
        # Truncate result in logs to avoid bloat
        extra_data["result_preview"] = result[:200] if len(result) > 200 else result
    
    if error:
        extra_data["error"] = error
    
    logger.log(level, message, extra={"extra_data": extra_data})

def log_llm_request(
    provider: str,
    model: str,
    session_id: str,
    message_count: int = 0,
    input_tokens: int = 0,
    output_tokens: int = 0,
    duration: float = 0,
    success: bool = True,
    error: Optional[str] = None
):
    """Log LLM API requests with token usage and cost estimation"""
    level = logging.INFO if success else logging.ERROR
    
    message = f"LLM request: {provider}/{model}"
    
    extra_data = {
        "provider": provider,
        "model": model,
        "session_id": session_id,
        "message_count": message_count,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
        "duration_ms": round(duration * 1000, 2),
        "success": success,
    }
    
    if error:
        extra_data["error"] = error
    
    logger.log(level, message, extra={"extra_data": extra_data})

def log_api_request(
    endpoint: str,
    method: str,
    status_code: int,
    duration: float,
    session_id: Optional[str] = None,
    error: Optional[str] = None
):
    """Log HTTP API requests"""
    level = logging.INFO if 200 <= status_code < 400 else logging.ERROR
    
    message = f"{method} {endpoint} -> {status_code}"
    
    extra_data = {
        "endpoint": endpoint,
        "method": method,
        "status_code": status_code,
        "duration_ms": round(duration * 1000, 2),
    }
    
    if session_id:
        extra_data["session_id"] = session_id
    if error:
        extra_data["error"] = error
    
    logger.log(level, message, extra={"extra_data": extra_data})

def log_session_event(
    event_type: str,
    session_id: str,
    details: Optional[Dict[str, Any]] = None
):
    """Log chat session events (create, delete, select)"""
    message = f"Session {event_type}: {session_id}"
    
    extra_data = {
        "event_type": event_type,
        "session_id": session_id,
    }
    
    if details:
        extra_data.update(details)
    
    logger.info(message, extra={"extra_data": extra_data})

def log_startup_info(
    active_provider: Optional[str],
    available_providers: Dict[str, bool],
    environment: str = "production"
):
    """Log application startup information"""
    logger.info(
        "Application starting",
        extra={
            "extra_data": {
                "active_provider": active_provider,
                "available_providers": available_providers,
                "environment": environment,
                "log_directory": str(LOGS_DIR.absolute()),
            }
        }
    )

# === Error Logging Helpers ===

def log_exception(message: str, exc: Exception, **kwargs):
    """Log an exception with context"""
    logger.exception(
        message,
        extra={
            "extra_data": {
                "exception_type": type(exc).__name__,
                "exception_message": str(exc),
                **kwargs
            }
        }
    )

# === Example Usage Documentation ===
"""
USAGE EXAMPLES:

# Basic logging
logger.info("Server started successfully")
logger.warning("Rate limit approaching")
logger.error("Database connection failed")

# With timing
with log_execution_time("Database migration"):
    # ... operation ...
    pass

# Structured logging
log_mcp_connection(
    connection_id="tools_server",
    target="tools_server.py",
    transport="stdio",
    success=True,
    tool_count=5,
    duration=0.5
)

log_tool_execution(
    tool_name="web_search",
    session_id="abc123",
    args={"query": "python"},
    result="...",
    duration=1.5,
    success=True
)

log_llm_request(
    provider="groq",
    model="llama-3.3-70b",
    session_id="abc123",
    input_tokens=100,
    output_tokens=50,
    duration=2.0
)

# Exception logging
try:
    risky_operation()
except Exception as e:
    log_exception("Operation failed", e, operation="risky_operation")
"""