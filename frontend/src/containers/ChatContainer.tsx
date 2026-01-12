import React, { useState } from 'react';
import useChatStore from '../store/chatStore';
import ChatInterface from '../components/chat/ChatInterface';
import type { Artifact } from '../components/chat/types';
 
interface ChatContainerProps {
  className?: string;
  onSwitchToMcp: () => void;
}
 
const ChatContainer: React.FC<ChatContainerProps> = ({ className, onSwitchToMcp }) => {
  const {
    sessions,
    currentSessionId,
    currentSession,
    isLoading,
    error,
    addSession,
    deleteSession,
    selectSession,
    sendMessage,
    regenerateLastResponse,
    updateMessageFeedback,
    updateMessages,
    approveTool, // Import the new action
  } = useChatStore();
 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<Artifact | null>(null);
 
  const openArtifactModal = (artifact: Artifact) => {
    setModalContent(artifact);
    setIsModalOpen(true);
  };
 
  return (
    <ChatInterface
      className={className}
      sessions={sessions}
      currentSessionId={currentSessionId}
      currentSession={currentSession}
      isLoading={isLoading}
      error={error}
      onNewChat={addSession}
      onSelectSession={selectSession}
      onDeleteSession={deleteSession}
      onSendMessage={sendMessage}
      onRegenerate={regenerateLastResponse}
      onUpdateFeedback={updateMessageFeedback}
      onUpdateMessages={updateMessages}
      onApproveTool={approveTool} // Pass it down
      isModalOpen={isModalOpen}
      modalContent={modalContent}
      openArtifactModal={openArtifactModal}
      closeArtifactModal={() => setIsModalOpen(false)}
      onSwitchToMcp={onSwitchToMcp}
    />
  );
};
 
export default ChatContainer;