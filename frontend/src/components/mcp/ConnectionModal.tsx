import React, { useState } from 'react';
import { useMCPStore } from '../../store/mcpStore';
import { XIcon, CheckCircleIcon, XCircleIcon, TableIcon } from '../chat/icons';
 
interface Props {
  isOpen: boolean;
  onClose: () => void;
}
 
export const ConnectionModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { connectServer, connections, disconnectServer } = useMCPStore();
  const [target, setTarget] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'stdio' | 'sse' | 'http'>('stdio');
 
  if (!isOpen) return null;
 
  const handleConnect = () => {
    const id = name.trim() || (target.includes('/') ? target.split('/').pop() : target) || 'server';
    connectServer(id, target, type);
    setTarget('');
    setName('');
  };
 
  const getPlaceholder = () => {
    if (type === 'stdio') return "e.g. python C:/path/server.py";
    if (type === 'http') return "e.g. http://localhost:8000/mcp";
    return "e.g. https://gitmcp.io/langchain/sse";
  };
 
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in p-4">
      <div className="bg-[var(--bg-secondary)] rounded-2xl w-full max-w-xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col max-h-[90vh]">
       
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[var(--border)] bg-[var(--bg-tertiary)]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg">
              <TableIcon size={20} />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">MCP Connections</h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 hover:bg-[var(--bg-tertiary)] rounded">
            <XIcon size={20} />
          </button>
        </div>
 
        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
         
          {/* Connection List */}
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Active Servers</h3>
            {connections.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] text-sm">
                No servers connected yet.
              </div>
            )}
            {connections.map(c => (
              <div key={c.id} className={`flex flex-col p-4 rounded-xl border transition-all ${c.status === 'error' ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900' : 'bg-[var(--bg-primary)] border-[var(--border)]'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                   
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {c.status === 'connected' ? (
                        <CheckCircleIcon size={20} className="text-green-500" />
                      ) : c.status === 'error' ? (
                        <XCircleIcon size={20} className="text-red-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                      )}
                    </div>
 
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[var(--text-primary)] truncate">{c.id}</div>
                      <div className="text-xs text-[var(--text-secondary)] truncate flex items-center gap-2">
                        <span className="uppercase font-bold text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)]">{c.type}</span>
                        {c.target}
                      </div>
                    </div>
                  </div>
                 
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    {c.status === 'connected' && <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">{c.toolCount} tools</span>}
                    <button onClick={() => disconnectServer(c.id)} className="text-xs font-medium text-red-500 hover:text-red-600 hover:underline">Disconnect</button>
                  </div>
                </div>
               
                {c.status === 'error' && c.error && (
                  <div className="mt-3 text-xs font-mono bg-[var(--bg-secondary)] p-3 rounded border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 whitespace-pre-wrap break-all">
                    {c.error}
                  </div>
                )}
              </div>
            ))}
          </div>
 
          {/* Add New Form */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Connect New Server</h3>
           
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="p-3 text-sm border rounded-xl bg-[var(--bg-tertiary)] border-transparent focus:border-[var(--accent)] outline-none text-[var(--text-primary)] transition-all cursor-pointer"
              >
                <option value="stdio">Stdio (Local)</option>
                <option value="http">HTTP (Remote)</option>
                <option value="sse">SSE (Legacy)</option>
              </select>
              <input
                className="flex-1 p-3 text-sm border rounded-xl bg-[var(--bg-tertiary)] border-transparent focus:border-[var(--accent)] outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-all"
                placeholder="Name (Optional)"
                value={name} onChange={e => setName(e.target.value)}
              />
            </div>
 
            <input
              className="w-full p-3 text-sm border rounded-xl bg-[var(--bg-tertiary)] border-transparent focus:border-[var(--accent)] outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-all font-mono"
              placeholder={getPlaceholder()}
              value={target} onChange={e => setTarget(e.target.value)}
            />
           
            {/* FIXED HOVER STATE HERE */}
            <button
              onClick={handleConnect}
              disabled={!target}
              className="w-full bg-[var(--accent)] hover:opacity-90 text-white py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Connect Server
            </button>
          </div>
 
        </div>
      </div>
    </div>
  );
};
 