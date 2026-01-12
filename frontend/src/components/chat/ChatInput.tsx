import React, { useState, useRef, useEffect } from 'react';
import { PaperclipIcon, XCircleIcon, StopIcon, SparklesIcon, DocumentTextIcon, PencilIcon, BotIcon } from './icons';
import { useMCPStore } from '../../store/mcpStore';
import type { MCPResource, MCPPrompt } from './types';
 
interface ChatInputProps {
  onSend: (prompt: string, image?: { data: string; mimeType: string } | null) => void;
  isLoading: boolean;
  editingMessage?: any;
  onCancelEdit?: () => void;
  onStop?: () => void;
}
 
const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, editingMessage, onCancelEdit, onStop }) => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
 
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
 
  const { resources, prompts } = useMCPStore();
 
  useEffect(() => {
    if (editingMessage) {
      setPrompt(editingMessage.content);
      if (textareaRef.current) adjustHeight(textareaRef.current);
    }
    textareaRef.current?.focus();
  }, [editingMessage]);
 
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
 
  const adjustHeight = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };
 
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    adjustHeight(e.target);
  };
 
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
 
  const handleSubmit = () => {
    if ((!prompt.trim() && !image) || isLoading) return;
    onSend(prompt, image);
    setPrompt('');
    setImage(null);
    if (textareaRef.current) textareaRef.current.style.height = '56px';
  };
 
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ data: reader.result as string, mimeType: file.type });
        setIsMenuOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };
 
  const handleResourceSelect = async (resource: MCPResource) => {
    setIsMenuOpen(false);
    try {
      const res = await fetch('/api/mcp/resources/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: resource.connection_id, uri: resource.uri })
      });
      if (!res.ok) throw new Error("Failed to fetch resource");
      const data = await res.json();
      const contextBlock = `\n\n--- Context: ${resource.name} (${resource.uri}) ---\n${data.content}\n----------------------------------\n\n`;
      setPrompt(prev => contextBlock + prev);
      if (textareaRef.current) {
         adjustHeight(textareaRef.current);
         textareaRef.current.focus();
      }
    } catch (e) {
      console.error("Failed to read resource", e);
    }
  };
 
  const handlePromptSelect = async (mcpPrompt: MCPPrompt) => {
    setIsMenuOpen(false);
    try {
      const args: Record<string, string> = {};
      if (mcpPrompt.arguments) {
        mcpPrompt.arguments.forEach(arg => args[arg.name] = `[${arg.name.toUpperCase()}]`);
      }
      const res = await fetch('/api/mcp/prompts/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: mcpPrompt.connection_id, name: mcpPrompt.name, args })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Server Error");
      }
      const data = await res.json();
      if (typeof data.content === 'string') {
        setPrompt(data.content);
        if (textareaRef.current) {
          textareaRef.current.focus();
          adjustHeight(textareaRef.current);
        }
      }
    } catch (e: any) {
      console.error("Failed to get prompt", e);
    }
  };
 
  return (
    <div className="w-full relative">
      {editingMessage && (
        <div className="absolute -top-12 left-0 right-0 flex justify-center z-10">
          <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg animate-in">
            <PencilIcon size={12} />
            <span>Editing Message</span>
            <button onClick={onCancelEdit} className="hover:text-amber-800 dark:hover:text-amber-200 ml-1"><XCircleIcon size={14} /></button>
          </div>
        </div>
      )}
 
      {/* Main Container */}
      <div
        className={`
          relative flex flex-col bg-[var(--bg-secondary)] dark:bg-[#121214]
          rounded-3xl border transition-all duration-300 ease-out
          ${isFocused
            ? 'border-[var(--accent)] shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)] ring-1 ring-[var(--accent)]/20'
            : 'border-[var(--border)] shadow-sm hover:border-gray-300 dark:hover:border-zinc-700'}
        `}
      >
       
        {/* Image Preview */}
        {image && (
          <div className="p-4 pb-0">
            <div className="relative inline-block group">
              <img src={image.data} alt="Upload" className="h-20 w-20 object-cover rounded-xl border border-[var(--border)] shadow-md" />
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => setImage(null)} className="text-white bg-red-500/80 p-1 rounded-full hover:bg-red-600 transition"><XCircleIcon size={16} /></button>
              </div>
            </div>
          </div>
        )}
 
        <div className="flex items-end gap-3 p-3">
         
          {/* Menu Button */}
          <div className="relative pb-1.5 pl-1" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2.5 rounded-xl transition-all duration-200 ${isMenuOpen ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}
              title="Attach tools or files"
            >
              <PaperclipIcon size={20} />
            </button>
 
            {/* Floating Menu */}
            {isMenuOpen && (
              <div className="absolute bottom-14 left-0 w-72 bg-[var(--bg-primary)]/90 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in ring-1 ring-black/5">
                <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Attachments & Tools
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-3 py-2.5 text-sm rounded-xl hover:bg-[var(--bg-tertiary)] flex items-center gap-3 text-[var(--text-primary)] transition-colors group">
                    <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors"><PaperclipIcon size={16} /></div>
                    <span>Upload Image</span>
                  </button>
                 
                  {resources.length > 0 && (
                    <>
                      <div className="my-2 border-t border-[var(--border)] mx-2" />
                      <div className="px-3 py-1 text-[10px] font-semibold text-[var(--text-secondary)] uppercase">MCP Resources</div>
                      {resources.map(res => (
                        <button key={res.uri} onClick={() => handleResourceSelect(res)} className="w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-[var(--bg-tertiary)] flex items-center gap-3 text-[var(--text-primary)] transition-colors group truncate">
                          <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors flex-shrink-0"><DocumentTextIcon size={16} /></div>
                          <span className="truncate opacity-90">{res.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                 
                  {prompts.length > 0 && (
                    <>
                      <div className="my-2 border-t border-[var(--border)] mx-2" />
                      <div className="px-3 py-1 text-[10px] font-semibold text-[var(--text-secondary)] uppercase">MCP Prompts</div>
                      {prompts.map(p => (
                        <button key={p.name} onClick={() => handlePromptSelect(p)} className="w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-[var(--bg-tertiary)] flex items-center gap-3 text-[var(--text-primary)] transition-colors group truncate">
                          <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors flex-shrink-0"><BotIcon size={16} /></div>
                          <span className="truncate opacity-90">{p.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
 
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
 
          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 max-h-48 bg-transparent border-none outline-none resize-none py-3.5 px-1 text-[var(--text-primary)] placeholder-gray-400 text-[15px] leading-relaxed"
            style={{ minHeight: '56px' }}
          />
 
          {/* Action Button */}
          <div className="pb-1.5 pr-1">
            {isLoading ? (
              <button onClick={onStop} className="p-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-md">
                <StopIcon size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() && !image}
                className={`
                  p-3 rounded-xl transition-all duration-300 ease-out flex items-center justify-center
                  ${prompt.trim() || image
                    ? 'bg-gradient-to-r from-[var(--accent-gradient-from)] to-[var(--accent-gradient-to)] text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95'
                    : 'bg-[var(--bg-tertiary)] text-gray-400 cursor-not-allowed'}
                `}
              >
                <SparklesIcon size={20} className={prompt.trim() ? "animate-pulse" : ""} />
              </button>
            )}
          </div>
        </div>
      </div>
       
      <div className="text-center mt-3 text-[10px] font-medium text-[var(--text-secondary)] opacity-50 tracking-wide">
         MCP Station • Created by Shubham Mishra • MCP Enabled • Press Shift + Enter for new line
      </div>
    </div>
  );
};
 
export default ChatInput;