import React, { useState } from 'react';
import { CheckCircleIcon, ChevronDownIcon, XCircleIcon } from './icons';
 
interface ToolDisplayProps {
  name: string;
  args: any;
  result?: string;
  status: 'running' | 'completed' | 'error';
}
 
const ToolDisplay: React.FC<ToolDisplayProps> = ({ name, args, result, status }) => {
  const [isOpen, setIsOpen] = useState(false);
  const displayName = name.split('__').pop() || name;
 
  return (
    <div className="w-full max-w-2xl transition-all duration-200">
      {/* Minimized View - Just a clean status line */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all
          ${isOpen
            ? 'bg-[var(--bg-secondary)] border-[var(--border)] shadow-sm'
            : 'bg-transparent border-transparent hover:bg-[var(--bg-tertiary)]'
          }
        `}
      >
        <div className="flex items-center gap-2.5">
          {status === 'running' ? (
            <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-[var(--accent)] border-t-transparent animate-spin" />
          ) : status === 'completed' ? (
            <CheckCircleIcon size={16} className="text-emerald-500" />
          ) : (
            <XCircleIcon size={16} className="text-red-500" />
          )}
         
          <div className="flex items-center gap-2">
            <span className={`font-medium ${status === 'running' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
              {status === 'running' ? 'Running' : status === 'completed' ? 'Used' : 'Failed'}
            </span>
            <span className="font-mono text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[11px]">
              {displayName}
            </span>
          </div>
        </div>
       
        <ChevronDownIcon size={14} className={`text-[var(--text-secondary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
 
      {/* Expanded Details */}
      {isOpen && (
        <div className="mt-1 ml-1 border-l-2 border-[var(--border)] pl-3 py-1 space-y-2 animate-in">
          <div className="text-xs">
            <div className="text-[var(--text-secondary)] font-semibold text-[10px] uppercase tracking-wider mb-1">Input</div>
            <div className="bg-[var(--bg-secondary)] p-2 rounded border border-[var(--border)] font-mono text-[var(--text-primary)] overflow-x-auto">
              {JSON.stringify(args, null, 2)}
            </div>
          </div>
          {result && (
             <div className="text-xs">
             <div className="text-[var(--text-secondary)] font-semibold text-[10px] uppercase tracking-wider mb-1">Output</div>
             <div className="bg-[var(--bg-secondary)] p-2 rounded border border-[var(--border)] font-mono text-[var(--text-primary)] max-h-48 overflow-y-auto whitespace-pre-wrap custom-scrollbar">
               {result}
             </div>
           </div>
          )}
        </div>
      )}
    </div>
  );
};
 
export default ToolDisplay;