import React from 'react';
import { BotIcon, TableIcon, SparklesIcon, TerminalIcon, CheckCircleIcon } from './icons';
import ChatInput from './ChatInput';
 
interface WelcomeProps {
  onNewChat?: () => void;
  onSuggestionClick: (prompt: string) => void;
  onSend: (prompt: string, image?: { data: string; mimeType: string } | null) => void;
  isLoading: boolean;
}
 
const Welcome: React.FC<WelcomeProps> = ({ onSuggestionClick, onSend, isLoading }) => {
  const suggestions = [
    {
      icon: <TerminalIcon />,
      title: "Generate Server",
      prompt: "Write a FastMCP script to fetch stock prices.",
      label: "Code",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: <TableIcon />,
      title: "Connect Data",
      prompt: "How do I connect a local SQLite database?",
      label: "Connect",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: <CheckCircleIcon />,
      title: "Debug Tools",
      prompt: "Analyze connected tools and suggest test cases.",
      label: "Debug",
      color: "from-violet-500 to-purple-500"
    },
    {
      icon: <SparklesIcon />,
      title: "Explain Concept",
      prompt: "How do Thought Signatures work in Gemini 3?",
      label: "Learn",
      color: "from-amber-500 to-orange-500"
    },
  ];
 
  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[var(--bg-primary)]">
     
      {/* Background Decor - Subtle & Small */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20 dark:opacity-10">
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />
      </div>
 
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 flex flex-col justify-center">
        <div className="w-full max-w-2xl mx-auto px-6 flex flex-col items-center">
         
          {/* Hero Section - Compact */}
          <div className="mb-8 flex flex-col items-center text-center animate-in">
            <div className="mb-4 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative w-12 h-12 bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center shadow-lg border border-[var(--border)]">
                <BotIcon size={24} className="text-[var(--accent)]" />
              </div>
            </div>
 
            <h1 className="text-2xl font-bold mb-2 tracking-tight">
              <span className="bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
                MCP Station
              </span>
            </h1>
            <p className="text-[var(--text-secondary)] text-sm max-w-md leading-relaxed">
              Connect, debug, and orchestrate MCP Server.
            </p>
          </div>
           
          {/* Suggestions Grid - Compact */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(s.prompt)}
                className="group relative flex flex-col items-start p-3 text-left bg-[var(--bg-secondary)]/40 hover:bg-[var(--bg-secondary)]/80 backdrop-blur-sm border border-[var(--border)] rounded-xl hover:border-[var(--accent)]/30 hover:shadow-md transition-all duration-200 overflow-hidden"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Hover Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-[0.04] transition-opacity`} />
 
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${s.color} bg-opacity-10 text-white shadow-sm ring-1 ring-white/5`}>
                    <div className="text-white opacity-90">
                      {React.cloneElement(s.icon as React.ReactElement<any>, { size: 14 })}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider opacity-50 bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                    {s.label}
                  </span>
                </div>
               
                <h3 className="font-semibold text-[var(--text-primary)] text-xs mb-0.5 group-hover:text-[var(--accent)] transition-colors">
                  {s.title}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 opacity-70 group-hover:opacity-100">
                  {s.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
 
      {/* Input Area - Compact Padding */}
      <div className="flex-shrink-0 w-full relative z-20">
        <div className="absolute bottom-full left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg-primary)] to-transparent pointer-events-none" />
        <div className="px-4 pb-6 pt-1 bg-[var(--bg-primary)]">
          <ChatInput onSend={onSend} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};
 
export default Welcome;