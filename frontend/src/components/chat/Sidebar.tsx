import React from 'react';
import { PlusIcon, ChatBubbleIcon, TrashIcon, MoonIcon, SunIcon, XIcon, TableIcon, BotIcon } from './icons';
import { useTheme } from './context/ThemeContext';
import type { ChatSession } from './types';
 
interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onOpenMcp: () => void;
  onSwitchToMcp: () => void;
}
 
const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  isOpen,
  setIsOpen,
  onOpenMcp,
  onSwitchToMcp
}) => {
  const { theme, toggleTheme } = useTheme();
 
  // Filter out empty/new chats from the history list to keep it clean
  const displaySessions = sessions.filter(s => s.title !== 'New Chat');
 
  return (
    <aside className={`
      flex flex-col h-full w-72 flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
      bg-[var(--bg-secondary)] border-r border-[var(--border)] z-40
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none lg:overflow-hidden'}
    `}>
      {/* Header */}
      <div className="p-4 pt-6">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            {/* Logo Icon */}
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[var(--accent)] to-purple-600 flex items-center justify-center text-white shadow-sm">
              <BotIcon size={14} />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
              MCP Station
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 rounded hover:bg-[var(--bg-tertiary)]">
            <XIcon className="text-[var(--text-secondary)]" />
          </button>
        </div>
       
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200 group"
        >
          <div className="p-1 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-md group-hover:scale-110 transition-transform">
            <PlusIcon size={16} />
          </div>
          <span>New Chat</span>
        </button>
      </div>
 
      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        <div className="px-3 py-2 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider opacity-60">Recents</div>
       
        <div className="space-y-1">
          {displaySessions.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-[var(--text-secondary)] opacity-60 italic">
              {sessions.length > 0 ? (
                // If sessions exist but are all "New Chat", show generic empty state
                <span>Start chatting to save history</span>
              ) : (
                <>
                  <div className="mb-2 text-2xl">👻</div>
                  No history yet
                </>
              )}
            </div>
          ) : (
            displaySessions.map(session => (
              <div key={session.id} className="group relative">
                <button
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-xl transition-all duration-200 border
                    ${currentSessionId === session.id
                      ? 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] font-medium shadow-sm'
                      : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                  <ChatBubbleIcon size={16} className={currentSessionId === session.id ? 'text-[var(--accent)]' : 'opacity-50'} />
                  <span className="truncate pr-6">{session.title}</span>
                </button>
               
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
 
      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm">
        <div className="space-y-1">
          <button onClick={onOpenMcp} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-xl transition-colors">
            <TableIcon size={16} />
            <span>Connections</span>
          </button>
         
          <button onClick={onSwitchToMcp} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-xl transition-colors">
            <BotIcon size={16} />
            <span>Debugger</span>
          </button>
 
          <div className="h-px bg-[var(--border)] my-2 opacity-50" />
 
          <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-xl transition-colors">
            {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
 
export default Sidebar;