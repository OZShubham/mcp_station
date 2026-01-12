// Create new file: frontend/src/components/chat/ConnectionStatus.tsx
import React, { useState } from 'react';
import { useMCPStore } from '../../store/mcpStore';
import { CheckCircleIcon, XCircleIcon, TableIcon, ChevronDownIcon } from './icons';

const ConnectionStatus: React.FC = () => {
  const { connections } = useMCPStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const activeConnections = connections.filter(c => c.status === 'connected');
  const hasConnections = activeConnections.length > 0;
  
  if (!hasConnections) return null;

  return (
    <div className="fixed top-4 right-4 z-40">
      {/* Collapsed View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-[var(--bg-secondary)]/90 backdrop-blur-md border border-[var(--border)] px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {activeConnections.length} Server{activeConnections.length !== 1 ? 's' : ''}
            </span>
          </div>
          <ChevronDownIcon size={14} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="bg-[var(--bg-secondary)]/95 backdrop-blur-md border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-in min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--bg-tertiary)]/50">
            <div className="flex items-center gap-2">
              <TableIcon size={16} className="text-[var(--accent)]" />
              <span className="text-sm font-bold text-[var(--text-primary)]">MCP Servers</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronDownIcon size={16} className="rotate-180" />
            </button>
          </div>

          {/* Connection List */}
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {activeConnections.map(conn => (
              <div
                key={conn.id}
                className="p-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-tertiary)]/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {conn.status === 'connected' ? (
                        <CheckCircleIcon size={14} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircleIcon size={14} className="text-red-500 flex-shrink-0" />
                      )}
                      <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                        {conn.id}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <span className="uppercase font-bold bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                        {conn.type}
                      </span>
                      {conn.status === 'connected' && (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {conn.toolCount} tool{conn.toolCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Connection Quality Indicator */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className={`w-1 rounded-full ${
                            i <= (conn.toolCount > 0 ? 3 : 1)
                              ? 'bg-green-500'
                              : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                          style={{ height: `${i * 4}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="p-3 bg-[var(--bg-tertiary)]/30 border-t border-[var(--border)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Total Tools Available</span>
              <span className="font-bold text-[var(--accent)]">
                {activeConnections.reduce((sum, c) => sum + c.toolCount, 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;