import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage, FeedbackStatus, Artifact } from './types';
import { BotIcon, UserIcon, CopyIcon, ThumbUpIcon, ThumbDownIcon,XCircleIcon, CheckCircleIcon, DocumentTextIcon, ThumbUpIconSolid, ThumbDownIconSolid, RefreshIcon, SparklesIcon, PencilIcon } from './icons';
import { useTheme } from './context/ThemeContext';
import ToolDisplay from './ToolDisplay';
 
// --- Message Actions ---
const MessageActions: React.FC<{ content: string; feedback: FeedbackStatus; onFeedback: (f: 'liked' | 'disliked') => void; onRegenerate: () => void }> = ({ content, feedback, onFeedback, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
 
  return (
    <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <button onClick={handleCopy} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors" title="Copy">
        {copied ? <CheckCircleIcon size={14} className="text-emerald-500" /> : <CopyIcon size={14} />}
      </button>
      <button onClick={() => onFeedback('liked')} className={`p-1.5 rounded-lg transition-colors ${feedback === 'liked' ? 'text-emerald-500 bg-emerald-500/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}>
        {feedback === 'liked' ? <ThumbUpIconSolid size={14} /> : <ThumbUpIcon size={14} />}
      </button>
      <button onClick={() => onFeedback('disliked')} className={`p-1.5 rounded-lg transition-colors ${feedback === 'disliked' ? 'text-red-500 bg-red-500/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}>
        {feedback === 'disliked' ? <ThumbDownIconSolid size={14} /> : <ThumbDownIcon size={14} />}
      </button>
      <button onClick={onRegenerate} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors" title="Regenerate">
        <RefreshIcon size={14} />
      </button>
    </div>
  );
};
 
// --- Artifact Chip ---
const ArtifactChip: React.FC<{ artifact: Artifact; onClick: () => void }> = ({ artifact, onClick }) => (
  <div onClick={onClick} className="cursor-pointer mt-4 mb-2 w-full max-w-sm group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 hover:border-[var(--accent)] hover:shadow-lg transition-all duration-300">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--bg-tertiary)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    <div className="flex items-center gap-4 relative z-10">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] group-hover:scale-110 transition-transform">
        <DocumentTextIcon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">{artifact.title}</h4>
        <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">Click to view content</p>
      </div>
    </div>
  </div>
);
 
// Add these new props to MessageProps interface
interface MessageProps {
  message: ChatMessage;
  onFeedback: (feedback: 'liked' | 'disliked') => void;
  onArtifactClick: (artifact: Artifact) => void;
  onRegenerate: () => void;
  onEdit: () => void;
  onApproveTool?: (toolId: string, name: string, args: any) => void;
  onRetry?: () => void; // NEW
}

// Add error detection in Message component
const Message: React.FC<MessageProps> = ({ 
  message, 
  onFeedback, 
  onArtifactClick, 
  onRegenerate, 
  onEdit, 
  onApproveTool,
  onRetry 
}) => {
  const { theme } = useTheme();
  const isModel = message.role === 'model';
  
  // Detect error conditions
  const hasError = message.content && (
    message.content.includes('Error:') || 
    message.content.includes('Exception:') ||
    message.content.includes('Failed:') ||
    message.content.startsWith('❌')
  );
  
  const hasToolError = message.toolCalls?.some(tc => tc.status === 'error');

  return (
    <div className={`group w-full flex gap-4 mb-8 animate-in ${isModel ? 'justify-start' : 'justify-end'}`}>
     
      {/* Bot Avatar (Left) */}
      {isModel && (
        <div className="flex-shrink-0 mt-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg text-white ring-2 ring-[var(--bg-primary)] ${
            hasError || hasToolError 
              ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
          }`}>
            <BotIcon size={18} />
          </div>
        </div>
      )}

      <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${isModel ? 'items-start' : 'items-end'}`}>
       
        {/* Tool Calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="w-full mb-3 space-y-2">
            {message.toolCalls.map(tc => (
              <div key={tc.id} className="flex flex-col">
                <ToolDisplay name={tc.name} args={tc.args} result={tc.result} status={tc.status} />
               
                {/* Tool Approval UI */}
                {message.isWaitingForApproval && tc.status === 'running' && (
                  <div className="flex items-center gap-4 mt-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/10 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 animate-in shadow-sm">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-amber-800 dark:text-amber-200">Permission Required</div>
                      <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">The AI wants to run <strong>{tc.name}</strong>.</div>
                    </div>
                    <button
                      onClick={() => onApproveTool?.(tc.id, tc.name, tc.args)}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      Approve
                    </button>
                  </div>
                )}
                
                {/* Tool Error Retry */}
                {tc.status === 'error' && onRetry && (
                  <div className="flex items-center gap-3 mt-2 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800/50">
                    <XCircleIcon className="text-red-500" size={16} />
                    <span className="text-xs text-red-700 dark:text-red-300 flex-1">Tool execution failed</span>
                    <button
                      onClick={onRetry}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-all"
                    >
                      <RefreshIcon size={12} /> Retry
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message Bubble */}
        {message.content && (
          <div className={`
            relative text-[15px] leading-relaxed transition-all duration-200
            ${isModel
              ? `text-[var(--text-primary)] px-4 py-3 -ml-4 rounded-2xl hover:bg-[var(--bg-tertiary)]/50 ${
                  hasError ? 'border-l-4 border-red-500 bg-red-50/50 dark:bg-red-950/10' : ''
                }`
              : 'bg-gradient-to-br from-[var(--accent-gradient-from)] to-[var(--accent-gradient-to)] text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md shadow-indigo-500/10'
            }
          `}>
            
            {/* Error Banner */}
            {hasError && isModel && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-red-200 dark:border-red-800">
                <XCircleIcon className="text-red-500" size={16} />
                <span className="text-xs font-semibold text-red-700 dark:text-red-300">Error occurred</span>
              </div>
            )}
            
            {message.image && (
              <img src={message.image.data} alt="User upload" className="max-w-full h-auto rounded-xl mb-4 border border-white/20 shadow-sm" />
            )}

            <div className={`prose max-w-none break-words ${isModel ? (theme === 'dark' ? 'prose-invert' : '') : 'prose-invert'} prose-p:my-1 prose-pre:my-2 prose-ul:my-1`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, inline, className, children, ...props}: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="rounded-xl overflow-hidden my-4 border border-[var(--border)] shadow-sm bg-[var(--bg-tertiary)] dark:bg-[#1e1e1e]">
                        <div className="bg-gray-100 dark:bg-[#2d2d2d] px-4 py-2 text-xs font-mono text-gray-500 dark:text-gray-400 border-b border-[var(--border)] dark:border-[#3e3e3e] flex justify-between items-center">
                          <span className="uppercase">{match[1]}</span>
                        </div>
                        <SyntaxHighlighter
                          style={theme === 'dark' ? vscDarkPlus : oneLight}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, borderRadius: 0, background: 'transparent', padding: '1.25rem', fontSize: '13px' }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className={`px-1.5 py-0.5 rounded text-[13px] font-mono font-medium ${isModel ? 'bg-[var(--bg-tertiary)] text-[var(--accent)] border border-[var(--border)]' : 'bg-white/20 text-white'}`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  a: ({node, ...props}) => <a className="text-[var(--accent)] hover:underline underline-offset-2 font-medium" {...props} />
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Edit Button (User) */}
            {!isModel && (
              <button
                onClick={onEdit}
                className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-full opacity-0 group-hover:opacity-100 transition-all"
                title="Edit"
              >
                <PencilIcon size={14} />
              </button>
            )}
          </div>
        )}

        {/* Generating Indicator */}
        {message.isGeneratingArtifact && (
          <div className="flex items-center gap-3 text-[var(--accent)] text-sm font-medium mt-3 animate-pulse bg-[var(--bg-secondary)] px-5 py-2.5 rounded-xl border border-[var(--border)] shadow-sm w-fit">
            <SparklesIcon className="animate-spin-slow" size={18} />
            <span className="bg-gradient-to-r from-[var(--accent)] to-purple-500 bg-clip-text text-transparent">Crafting content...</span>
          </div>
        )}

        {message.artifact && <ArtifactChip artifact={message.artifact} onClick={() => onArtifactClick(message.artifact!)} />}

        {/* Actions (Bot) */}
        {isModel && message.content && (
          <div className="ml-1 flex items-center gap-2">
            <MessageActions 
              content={message.content} 
              feedback={message.feedback || null} 
              onFeedback={onFeedback} 
              onRegenerate={onRegenerate} 
            />
            
            {/* Retry Button for Errors */}
            {hasError && onRetry && (
              <button 
                onClick={onRetry}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                title="Retry this message"
              >
                <RefreshIcon size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Avatar (Right) */}
      {!isModel && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)]">
            <UserIcon size={18} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;