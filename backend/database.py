import sqlite3
import json
import uuid
from typing import List, Dict, Any
from datetime import datetime
 
DB_NAME = "chat.db"
 
def init_db():
  """Initialize the database tables."""
  conn = sqlite3.connect(DB_NAME)
  conn.execute("PRAGMA journal_mode=WAL;")
   
  conn.execute('''
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT,
      created_at TEXT
    )
  ''')
   
  conn.execute('''
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      role TEXT,
      content TEXT,
      image_data TEXT,
      tool_calls TEXT,
      is_tool_result BOOLEAN DEFAULT 0,
      tool_call_id TEXT,
      thought_signature TEXT,
      created_at TEXT,
      FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  ''')
 
  # Ensure indexes exist
  conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);")
  conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);")
   
  conn.commit()
  conn.close()
 
class ChatDatabase:
  def __init__(self):
    self.conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    self.conn.row_factory = sqlite3.Row
 
  def get_sessions(self) -> List[Dict]:
    c = self.conn.cursor()
    c.execute("SELECT * FROM sessions ORDER BY created_at DESC")
    return [dict(row) for row in c.fetchall()]
 
  def create_session(self, title: str) -> str:
    session_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    c = self.conn.cursor()
    c.execute("INSERT INTO sessions (id, title, created_at) VALUES (?, ?, ?)",
         (session_id, title, created_at))
    self.conn.commit()
    return session_id
 
  def delete_session(self, session_id: str):
    c = self.conn.cursor()
    c.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
    c.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    self.conn.commit()
 
  def get_messages(self, session_id: str) -> List[Dict]:
    c = self.conn.cursor()
    c.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,))
    rows = c.fetchall()
    messages = []
   
    for row in rows:
      msg = dict(row)
     
      # --- SAFETY FIX: Sanitize potential bytes ---
      # FastAPI crashes if it tries to encode raw bytes that aren't valid utf-8
      for k, v in msg.items():
          if isinstance(v, bytes):
              try:
                  msg[k] = v.decode('utf-8')
              except UnicodeDecodeError:
                  # If binary junk, force string representation to prevent crash
                  msg[k] = str(v)
 
      # Deserialize JSON fields
      if msg.get('image_data'):
        try:
            msg['image'] = json.loads(msg['image_data'])
        except:
            msg['image'] = None
 
      if msg.get('tool_calls'):
        try:
            msg['toolCalls'] = json.loads(msg['tool_calls'])
        except:
            msg['toolCalls'] = []
       
      # Clean up raw columns
      if 'image_data' in msg: del msg['image_data']
      if 'tool_calls' in msg: del msg['tool_calls']
     
      messages.append(msg)
     
    return messages
 
  def add_message(self, session_id: str, msg_data: Dict[str, Any]):
    c = self.conn.cursor()
     
    msg_id = msg_data.get('id', str(uuid.uuid4()))
    role = msg_data.get('role', 'user')
    content = msg_data.get('content', '')
    is_tool_result = msg_data.get('is_tool_result', False)
    tool_call_id = msg_data.get('tool_call_id', None)
   
    # Ensure thought_signature is a string, not bytes
    thought_signature = msg_data.get('thought_signature')
    if isinstance(thought_signature, bytes):
        thought_signature = thought_signature.decode('utf-8', errors='ignore')
 
    # Serialize complex objects
    image_json = json.dumps(msg_data.get('image')) if msg_data.get('image') else None
    tool_json = json.dumps(msg_data.get('toolCalls')) if msg_data.get('toolCalls') else None
     
    created_at = datetime.now().isoformat()
 
    c.execute('''
      INSERT OR REPLACE INTO messages
      (id, session_id, role, content, image_data, tool_calls, is_tool_result, tool_call_id, thought_signature, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
      msg_id,
      session_id,
      role,
      content,
      image_json,
      tool_json,
      is_tool_result,
      tool_call_id,
      thought_signature,
      created_at
    ))
    self.conn.commit()
    return msg_id
 
  def update_session_title(self, session_id: str, title: str):
    c = self.conn.cursor()
    c.execute("UPDATE sessions SET title = ? WHERE id = ?", (title, session_id))
    self.conn.commit()