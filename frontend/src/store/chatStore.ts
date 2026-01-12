import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChatSession, ChatMessage, FeedbackStatus, ToolCall } from '../components/chat/types';
 
// --- Types ---
interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  currentSession: ChatSession | null;
  abortController: AbortController | null;
}
 
interface ChatActions {
  loadSessions: () => Promise<void>;
  addSession: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  sendMessage: (prompt: string, image?: { data: string; mimeType: string } | null) => Promise<void>;
  stopGeneration: () => void;
  updateMessageFeedback: (id: string, feedback: FeedbackStatus) => void;
  updateMessages: (messages: ChatMessage[]) => void;
  regenerateLastResponse: () => Promise<void>;
  approveTool: (session_id: string, tool_id: string, name: string, args: any) => Promise<void>;
}
 
// --- Helper: Robust SSE Stream Parser ---
async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: any) => void
) {
  const decoder = new TextDecoder();
  let buffer = '';
 
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
 
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';
 
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.substring(6).trim();
     
      if (dataStr === '[DONE]') return;
     
      try {
        const parsed = JSON.parse(dataStr);
        onEvent(parsed);
      } catch (e) {
        console.warn('Stream JSON parse error', e);
      }
    }
  }
}
 
// --- Store Implementation ---
const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  error: null,
  currentSession: null,
  abortController: null,
 
  loadSessions: async () => {
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = await res.json();
      const sessions = data.map((s: any) => ({ ...s, messages: [] }));
      set({ sessions });
      if (sessions.length > 0 && !get().currentSessionId) {
        get().selectSession(sessions[0].id);
      }
    } catch (e) {
      console.error("Load sessions error:", e);
    }
  },
 
  addSession: async () => {
    try {
      const title = 'New Chat';
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      const newSessionData = await res.json();
      const newSession: ChatSession = {
        id: newSessionData.id,
        title: newSessionData.title,
        messages: [],
        createdAt: new Date().toISOString()
      };
     
      // CRITICAL: Explicitly clear current session data before setting new one
      set(state => ({
        sessions: [newSession, ...state.sessions],
        currentSessionId: newSession.id,
        currentSession: newSession,
        error: null,
        isLoading: false
      }));
    } catch (e) {
      console.error("Add session error:", e);
    }
  },
 
  deleteSession: async (id) => {
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      set(state => {
        const remaining = state.sessions.filter(s => s.id !== id);
        let newId = state.currentSessionId;
        if (newId === id) {
          newId = remaining.length > 0 ? remaining[0].id : null;
        }
        const newSession = newId ? remaining.find(s => s.id === newId) || null : null;
        return { sessions: remaining, currentSessionId: newId, currentSession: newSession };
      });
    } catch (e) {
      console.error("Delete session error:", e);
    }
  },
 
  selectSession: async (id) => {
    // Optimistic UI update to clear view immediately
    set({ currentSessionId: id, isLoading: true, currentSession: null });
    try {
      const res = await fetch(`/api/sessions/${id}/messages`);
      const messages = await res.json();
      set(state => ({
        isLoading: false,
        currentSession: { ...state.sessions.find(s => s.id === id)!, messages: messages }
      }));
    } catch (e) {
      console.error("Select session error:", e);
      set({ isLoading: false });
    }
  },
 
  sendMessage: async (prompt, image) => {
    let activeSessionId = get().currentSessionId;
   
    // Auto-create session if none exists
    if (!activeSessionId) {
      await get().addSession();
      activeSessionId = get().currentSessionId;
    }
   
    // Double check to ensure we have a valid ID
    if (!activeSessionId) {
        set({ error: "Failed to initialize session" });
        return;
    }
 
    const abortController = new AbortController();
    set({ isLoading: true, error: null, abortController });
 
    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content: prompt, image };
    const modelPlaceholder: ChatMessage = { id: uuidv4(), role: 'model', content: '', toolCalls: [] };
 
    // Get messages from the *current* session object to ensure we aren't mixing
    const sessionObj = get().currentSession;
    const currentMsgs = sessionObj?.id === activeSessionId ? sessionObj.messages : [];
   
    get().updateMessages([...currentMsgs, userMsg, modelPlaceholder]);
 
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSessionId, new_message: userMsg }),
        signal: abortController.signal,
      });
 
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      if (!res.body) throw new Error('Response body is null');
 
      const reader = res.body.getReader();
      let fullText = '';
 
      await processStream(reader, (parsed) => {
        if (parsed.error) throw new Error(parsed.error);
       
        // Always fetch fresh state inside async loop
        const sess = get().currentSession;
        if (!sess || sess.id !== activeSessionId) return; // Prevent updating wrong session
       
        const msgs = [...sess.messages];
        const lastMsg = { ...msgs[msgs.length - 1] };
 
        if (parsed.type === 'text') {
          fullText += parsed.content;
          lastMsg.content = fullText;
        }
        else if (parsed.type === 'tool_approval_request') {
          const newCall: ToolCall = {
            id: parsed.tool.id,
            name: parsed.tool.name,
            args: parsed.tool.args,
            status: 'running'
          };
          lastMsg.toolCalls = [...(lastMsg.toolCalls || []), newCall];
          lastMsg.isWaitingForApproval = true;
          set({ isLoading: false });
        }
       
        msgs[msgs.length - 1] = lastMsg;
        get().updateMessages(msgs);
      });
 
      // Reload title if it's still "New Chat"
      const currentSess = get().sessions.find(s => s.id === activeSessionId);
      if (currentSess?.title === 'New Chat') {
        get().loadSessions();
      }
 
    } catch (e: any) {
      if (e.name !== 'AbortError') set({ error: e.message });
    } finally {
      const sess = get().currentSession;
      const lastMsg = sess?.messages[sess.messages.length - 1];
      if (!lastMsg?.isWaitingForApproval) {
        set({ isLoading: false, abortController: null });
      }
    }
  },
 
  approveTool: async (session_id, tool_id, name, args) => {
    set({ isLoading: true });
    const currentMsgs = get().currentSession?.messages || [];
   
    const updatedMsgs = currentMsgs.map(m => {
      if (m.toolCalls?.find(t => t.id === tool_id)) {
        return {
          ...m,
          isWaitingForApproval: false,
          toolCalls: m.toolCalls.map(t => t.id === tool_id ? { ...t, status: 'completed' as const } : t)
        };
      }
      return m;
    });
    get().updateMessages(updatedMsgs);
 
    try {
      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        session_id,
        tool_call_id: tool_id,
        tool_name: name,
        // Force empty object if args is null/undefined
        tool_args: args || {} 
      })
      });
 
      const reader = res.body?.getReader();
      if (!reader) return;
 
      await processStream(reader, (parsed) => {
          const sess = get().currentSession;
          if (!sess || sess.id !== session_id) return;
          const msgs = [...sess.messages];
          const last = msgs[msgs.length - 1];
 
          if (parsed.type === 'text') {
            last.content += parsed.content;
          }
          else if (parsed.type === 'tool_result') {
            if(last.toolCalls) {
              last.toolCalls = last.toolCalls.map(tc =>
                tc.name === parsed.tool ? { ...tc, result: parsed.result } : tc
              );
            }
          }
          get().updateMessages(msgs);
      });
 
    } catch (e) {
      console.error("Tool execution failed", e);
      set({ error: "Tool execution failed" });
    } finally {
      set({ isLoading: false });
    }
  },
 
  updateMessages: (messages) => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;
    set(state => ({
      currentSession: { ...state.currentSession!, messages },
      sessions: state.sessions.map(s => s.id === currentSessionId ? { ...s, messages } : s)
    }));
  },
 
  updateMessageFeedback: (id, feedback) => {
    const session = get().currentSession;
    if (!session) return;
    const msgs = session.messages.map(m =>
      m.id === id ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m
    );
    get().updateMessages(msgs);
  },
 
  stopGeneration: () => {
    get().abortController?.abort();
    set({ isLoading: false });
  },
 
  regenerateLastResponse: async () => {
    const session = get().currentSession;
    if (!session) return;
    const reversedMsgs = [...session.messages].reverse();
    const lastUserMsg = reversedMsgs.find(m => m.role === 'user');
    if (lastUserMsg) {
      const cutIndex = session.messages.indexOf(lastUserMsg);
      const cleanHistory = session.messages.slice(0, cutIndex + 1);
      get().updateMessages(cleanHistory);
      await get().sendMessage(lastUserMsg.content, lastUserMsg.image);
    }
  },
}));
 
export default useChatStore;