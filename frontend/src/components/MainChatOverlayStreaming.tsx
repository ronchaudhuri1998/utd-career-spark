import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useUserData } from "@/contexts/UserDataContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useChatMessages } from "@/hooks/useChatMessages";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatHistory from "@/components/chat/ChatHistory";
import ChatInput from "@/components/chat/ChatInput";
import { agentBadgeIntent } from "@/components/chat/AgentBadgeConfig";

const MainChatOverlayStreaming = ({
  className = "",
}: {
  className?: string;
}) => {
  const { userData, sessionId } = useUserData();
  const {
    isConnected,
    isRunning,
    progress,
    result,
    error,
    startPlan,
    clearProgress,
  } = useWebSocket();

  const { chatHistory, addUserMessage, addErrorMessage } = useChatMessages({
    progress,
    result,
    error,
  });

  const [chatMessage, setChatMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSendMessage = async () => {
    const trimmed = chatMessage.trim();
    if (!trimmed || isSubmitting || !isConnected) {
      return;
    }

    addUserMessage(trimmed);
    setChatMessage("");
    setIsSubmitting(true);
    clearProgress();

    try {
      const extraContext = {
        student_year: userData.studentYear || userData.graduationYear || "",
        courses_taken: userData.coursesTaken || "",
        about: userData.bio || "",
        time_commitment: userData.timeCommitment || "",
        contact_email: userData.email || "",
      };

      startPlan(trimmed, sessionId, extraContext);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start plan";
      addErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card
        className={`w-96 shadow-lg transition-all duration-300 ${
          isMinimized ? "h-16" : "h-[600px]"
        }`}
      >
        <ChatHeader
          isConnected={isConnected}
          isMinimized={isMinimized}
          onToggleMinimize={() => setIsMinimized(!isMinimized)}
        />
        <CardContent className="flex flex-col h-[calc(100%-4rem)] p-0">
          <div className="flex-1 overflow-hidden">
            <ChatHistory
              messages={chatHistory}
              agentBadgeIntent={agentBadgeIntent}
              isLoading={isRunning}
            />
          </div>
          <div className="p-6 pt-3">
            <ChatInput
              message={chatMessage}
              onMessageChange={setChatMessage}
              onSend={handleSendMessage}
              isSubmitting={isSubmitting}
              isConnected={isConnected}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MainChatOverlayStreaming;
