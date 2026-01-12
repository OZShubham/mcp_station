import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './components/chat/context/ThemeContext';
import ChatContainer from './containers/ChatContainer';
import { MCPTester } from './components/mcp/MCPTester'; // REVERTED IMPORT
import { XIcon, BotIcon } from './components/chat/icons';
import { useMCPStore } from './store/mcpStore';
import useChatStore from './store/chatStore';
 
const App: React.FC = () => {
  const [view, setView] = useState<'chat' | 'mcp'>('chat');
  const { fetchStatus } = useMCPStore();
  const { loadSessions } = useChatStore();
 
  // Sync backend status and load history on startup
  useEffect(() => {
    fetchStatus();
    loadSessions();
  }, []);
 
  return (
    <ThemeProvider>
      <div className="relative h-full w-full overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors duration-300">
       
        {view === 'chat' ? (
          <ChatContainer
            className="h-screen w-full"
            onSwitchToMcp={() => setView('mcp')}
          />
        ) : (
          <div className="h-full flex flex-col animate-in">
            {/* Debugger Header */}
            <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-md z-10">
              <div className="font-bold text-lg flex items-center gap-2 text-[var(--text-primary)]">
                <span className="bg-[var(--accent)] text-white px-2 py-0.5 rounded text-xs font-bold tracking-wider">DEV</span>
                <span className="flex items-center gap-2"><BotIcon className="text-[var(--accent)]" /> MCP Debugger</span>
              </div>
              <button
                onClick={() => setView('chat')}
                className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <XIcon size={18} /> Close Debugger
              </button>
            </header>
           
            <div className="flex-1 overflow-hidden bg-[var(--bg-primary)]">
              <MCPTester />
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
};
 
export default App;