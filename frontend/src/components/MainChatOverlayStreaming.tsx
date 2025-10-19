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
    <div className={`${className} h-full min-h-[400px] max-h-[800px]`}>
      <Card className="w-full shadow-xl border-2 border-border bg-card/95 backdrop-blur-sm transition-all duration-300 h-full flex flex-col">
        <ChatHeader
          isConnected={isConnected}
          isMinimized={false}
          onToggleMinimize={() => {}}
        />
        <CardContent className="flex flex-col flex-1 min-h-0 p-0">
          <div className="flex-1 overflow-hidden min-h-0">
            <ChatHistory
              messages={chatHistory}
              agentBadgeIntent={agentBadgeIntent}
              isLoading={isRunning}
            />
          </div>
          <div className="p-6 pt-3 flex-shrink-0">
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
