# tools_server.py
import hashlib
import uuid
import secrets
import string
import json
from datetime import datetime, timedelta
from mcp.server.fastmcp import FastMCP
 
mcp = FastMCP("Swiss-Army-Knife")
 
# --- TOOL 1: Password Generator (True Randomness) ---
@mcp.tool()
def generate_secure_password(length: int = 16, include_symbols: bool = True) -> str:
    """
    Generates a cryptographically secure random password.
    LLMs cannot generate true random numbers; this tool uses Python's secrets module.
    """
    if length > 64: return "Error: Length too long."
   
    chars = string.ascii_letters + string.digits
    if include_symbols:
        chars += "!@#$%^&*()_+-="
       
    password = ''.join(secrets.choice(chars) for _ in range(length))
    return f"🔑 **Generated Password:** `{password}`"
 
# --- TOOL 2: Text Hashing (Impossible for LLMs) ---
@mcp.tool()
def calculate_hash(text: str, algorithm: str = "sha256") -> str:
    """
    Calculates the hash of a string.
    Supported algorithms: md5, sha1, sha256, sha512.
    Use this to verify data integrity or generate IDs.
    """
    try:
        if algorithm.lower() not in hashlib.algorithms_guaranteed:
            return f"Error: Algorithm '{algorithm}' not supported."
           
        h = hashlib.new(algorithm.lower())
        h.update(text.encode('utf-8'))
        return f"🧮 **{algorithm.upper()} Hash:**\n`{h.hexdigest()}`"
    except Exception as e:
        return str(e)
 
# --- TOOL 3: UUID Generator ---
@mcp.tool()
def generate_uuid(count: int = 1) -> str:
    """
    Generates random UUIDs (version 4).
    Useful for developers needing unique database keys.
    """
    ids = [str(uuid.uuid4()) for _ in range(min(count, 10))]
    return "🆔 **UUIDs:**\n" + "\n".join([f"- `{i}`" for i in ids])
 
# --- TOOL 4: Date Calculator ---
@mcp.tool()
def date_calculation(days_offset: int, format: str = "%Y-%m-%d") -> str:
    """
    Calculates exactly what date it will be in X days.
    Also returns the current exact server time.
    """
    now = datetime.now()
    future = now + timedelta(days=days_offset)
   
    return f"""📅 **Date Calculation:**
- **Current Time:** {now.strftime("%Y-%m-%d %H:%M:%S")}
- **Target Date ({days_offset} days):** {future.strftime(format)}
- **Day of Week:** {future.strftime("%A")}
"""
 
# --- PROMPT: Generate Developer Credentials ---
@mcp.prompt()
def generate_credentials() -> str:
    """Template to create a set of dummy credentials for testing."""
    return """Please generate a set of test credentials for a new user.
1. Create a secure 16-char password.
2. Generate a UUID for their User ID.
3. Calculate the SHA256 hash of the password (for DB storage simulation)."""
 
if __name__ == "__main__":
   
    mcp.run(transport="stdio")