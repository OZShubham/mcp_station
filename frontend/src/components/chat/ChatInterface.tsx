import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import Welcome from './Welcome';
import ArtifactModal from './ArtifactModal';
import { ConnectionModal } from '../mcp/ConnectionModal';
import type { ChatSession, Artifact, ChatMessage, FeedbackStatus } from './types';
import { MenuIcon, XIcon } from './icons';
 
interface ChatInterfaceProps {
  className?: string;
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onSendMessage: (prompt: string, image?: { data: string; mimeType: string } | null, conversationHistory?: ChatMessage[]) => Promise<void>;
  onRegenerate: () => void;
  onUpdateFeedback: (messageId: string, feedback: FeedbackStatus) => void;
  onUpdateMessages: (messages: ChatMessage[]) => void;
  // NEW PROP
  onApproveTool: (session_id: string, tool_id: string, name: string, args: any) => Promise<void>;
 
  isModalOpen: boolean;
  modalContent: Artifact | null;
  openArtifactModal: (artifact: Artifact) => void;
  closeArtifactModal: () => void;
  onSwitchToMcp: () => void;
}
 
const ChatInterface: React.FC<ChatInterfaceProps> = ({
  className,
  sessions,
  currentSessionId,
  currentSession,
  isLoading,
  error,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onSendMessage,
  onRegenerate,
  onUpdateFeedback,
  onUpdateMessages,
  onApproveTool, // Destructure new prop
  isModalOpen,
  modalContent,
  openArtifactModal,
  closeArtifactModal,
  onSwitchToMcp,
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
 
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
 
  const handleSuggestionClick = (prompt: string) => {
    onSendMessage(prompt);
  };
 
  const showWelcome = !currentSession || currentSession.messages.length === 0;
 
  return (
    <div className={`flex h-screen w-full bg-[var(--bg-primary)] ${className}`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div className="fixed inset-0 bg-black/50 z-20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
 
      {/* Sidebar */}
      <div className={`fixed lg:relative z-30 h-full transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-0'}`}>
        <Sidebar
          sessions={sessions}
          onSwitchToMcp={onSwitchToMcp}
          currentSessionId={currentSessionId}
          onNewChat={onNewChat}
          onSelectSession={onSelectSession}
          onDeleteSession={onDeleteSession}
          isOpen={isSidebarOpen}
          setIsOpen={setSidebarOpen}
          onOpenMcp={() => setIsMcpModalOpen(true)}
        />
      </div>
 
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-[var(--bg-primary)] transition-all duration-300">
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
              {isSidebarOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
            <span className="font-semibold text-[var(--text-primary)] text-sm truncate max-w-[200px]">
              {currentSession?.title || 'New Chat'}
            </span>
          </div>
        </header>
       
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {!showWelcome ? (
            <ChatWindow
              session={currentSession!}
              isLoading={isLoading}
              error={error}
              onSendMessage={onSendMessage}
              onRegenerate={onRegenerate}
              onUpdateFeedback={onUpdateFeedback}
              onUpdateMessages={onUpdateMessages}
              onApproveTool={onApproveTool} // Pass it here
              initialPrompt={initialPrompt}
              clearInitialPrompt={() => setInitialPrompt(null)}
              openArtifactModal={openArtifactModal}
            />
          ) : (
            <Welcome
              onNewChat={onNewChat}
              onSuggestionClick={handleSuggestionClick}
              onSend={onSendMessage}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>
 
      {/* Modals */}
      {isModalOpen && modalContent && (
        <ArtifactModal artifact={modalContent} onClose={closeArtifactModal} />
      )}
 
      <ConnectionModal
        isOpen={isMcpModalOpen}
        onClose={() => setIsMcpModalOpen(false)}
      />
    </div>
  );
};
 
export default ChatInterface;