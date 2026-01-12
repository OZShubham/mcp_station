import React, { useRef, useEffect, useState } from 'react';
import type { ChatSession, ChatMessage, Artifact, FeedbackStatus } from './types';
import Message from './Message';
import ChatInput from './ChatInput';
import { BotIcon } from './icons';
import useChatStore from '../../store/chatStore';
import ConnectionStatus from './ConnectionStatus';

interface ChatWindowProps {
  session: ChatSession;
  isLoading: boolean;
  error: string | null;
  onSendMessage: (prompt: string, image?: { data: string; mimeType: string } | null, conversationHistory?: ChatMessage[]) => Promise<void>;
  onRegenerate: () => void;
  onUpdateFeedback: (messageId: string, feedback: FeedbackStatus) => void;
  onUpdateMessages: (messages: ChatMessage[]) => void;
  onApproveTool: (session_id: string, tool_id: string, name: string, args: any) => Promise<void>;
  initialPrompt: string | null;
  clearInitialPrompt: () => void;
  openArtifactModal: (artifact: Artifact) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  session,
  isLoading,
  error,
  onSendMessage,
  onRegenerate,
  onUpdateFeedback,
  onUpdateMessages,
  onApproveTool,
  initialPrompt,
  clearInitialPrompt,
  openArtifactModal,
}) => {
  const { stopGeneration } = useChatStore();
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = () => {
    if (shouldAutoScroll) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
    }
  };

  useEffect(() => {
    if (initialPrompt && !isLoading) {
      onSendMessage(initialPrompt);
      clearInitialPrompt();
    }
  }, [initialPrompt, onSendMessage, clearInitialPrompt, isLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isLoading]);

  const handleEdit = (message: ChatMessage) => setEditingMessage(message);

  const handleSendEdit = (prompt: string, image?: { data: string; mimeType: string } | null) => {
    if (!editingMessage) return;
    const historyUntilEdit = session.messages.slice(0, session.messages.indexOf(editingMessage));
    onSendMessage(prompt, image, historyUntilEdit);
    setEditingMessage(null);
  };

  // --- Error Recovery Handler ---
  const handleRetry = async () => {
    if (!session) return;
    const messages = [...session.messages];
    const lastUserMsgIndex = messages.reverse().findIndex(m => m.role === 'user');
    if (lastUserMsgIndex >= 0) {
      const actualIndex = messages.length - 1 - lastUserMsgIndex;
      const cleanHistory = session.messages.slice(0, actualIndex + 1);
      onUpdateMessages(cleanHistory);
      const lastUserMsg = session.messages[actualIndex];
      const historyBeforeLastMsg = session.messages.slice(0, actualIndex);
      await onSendMessage(lastUserMsg.content, lastUserMsg.image, historyBeforeLastMsg);
    }
  };

  const lastMsg = session.messages[session.messages.length - 1];
  const isThinking = isLoading
    && session.messages.length > 0
    && lastMsg?.role === 'model'
    && !lastMsg.content
    && !lastMsg.artifact
    && !lastMsg.isGeneratingArtifact
    && (!lastMsg.toolCalls || lastMsg.toolCalls.length === 0);

  const messagesToShow = isThinking ? session.messages.slice(0, -1) : session.messages;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      
      {/* --- NEW: Connection Status Indicator --- */}
      <ConnectionStatus />

      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 dark:opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
      </div>

      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar px-4 relative z-10">
        <div className="max-w-3xl mx-auto pt-10 pb-4">
          {messagesToShow.map((msg) => (
            <Message
              key={msg.id}
              message={msg}
              onFeedback={(feedback) => onUpdateFeedback(msg.id, feedback)}
              onArtifactClick={openArtifactModal}
              onEdit={() => handleEdit(msg)}
              onRegenerate={onRegenerate}
              onApproveTool={(toolId, name, args) => onApproveTool(session.id, toolId, name, args)}
              onRetry={handleRetry}
            />
          ))}
          
          {isThinking && (
            <div className="flex items-center gap-4 animate-in pl-2 mb-8 opacity-70">
              <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/20">
                <BotIcon className="text-white animate-pulse" size={18} />
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-6" />
        </div>
      </div>

      <div className="flex-shrink-0 w-full relative z-20">
        <div className="absolute bottom-full left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-primary)] to-transparent pointer-events-none" />
        <div className="bg-[var(--bg-primary)] px-4 pb-6 pt-2">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={editingMessage ? handleSendEdit : onSendMessage}
              isLoading={isLoading}
              editingMessage={editingMessage}
              onCancelEdit={() => setEditingMessage(null)}
              onStop={stopGeneration}
            />
            {error && <p className="mt-3 text-xs text-red-500 text-center font-medium bg-red-50 dark:bg-red-900/20 py-1.5 rounded-lg border border-red-100 dark:border-red-800">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;