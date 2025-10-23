import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useUserData } from "@/contexts/UserDataContext";
import { useSSEContext } from "@/contexts/SSEContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatHistory from "@/components/chat/ChatHistory";
import ChatInput from "@/components/chat/ChatInput";
import { agentBadgeIntent } from "@/components/chat/AgentBadgeConfig";

interface DashboardEmbeddedChatProps {
  title?: string;
  dashboardType: "jobmarket" | "academics" | "projects";
  className?: string;
}

const DashboardEmbeddedChat = ({
  title = "Career Assistant",
  dashboardType,
  className = "",
}: DashboardEmbeddedChatProps) => {
  const { userData, sessionId, agentOutputs } = useUserData();
  const {
    isConnected,
    isRunning,
    agentCards,
    result,
    error,
    responseText,
    startPlan,
    clearProgress,
  } = useSSEContext();

  const { chatHistory, addUserMessage, addErrorMessage, clearHistory } =
    useChatMessages({
      agentCards,
      result,
      error,
      responseText,
    });

  const [chatMessage, setChatMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build elaborate context prefix
  const buildContextPrefix = (userMessage: string) => {
    let context = "";
    let instruction = "";

    if (dashboardType === "jobmarket") {
      const data = agentOutputs.jobMarket;
      context = `[CONTEXT: User is viewing Job Market Dashboard with current data: ${
        data ? "loaded" : "not loaded"
      }]`;
      instruction = `[INSTRUCTION: Focus on updating ONLY the Job Market data. Do NOT call other agents (CourseCatalogAgent, ProjectAdvisorAgent) unless the user explicitly requests it. Only update what the user can currently see to avoid surprising them with hidden changes.]`;
    } else if (dashboardType === "academics") {
      const data = agentOutputs.coursePlan;
      context = `[CONTEXT: User is viewing Academic Planning Dashboard with current data: ${
        data ? "loaded" : "not loaded"
      }]`;
      instruction = `[INSTRUCTION: Focus on updating ONLY the Academic Planning data. Do NOT call other agents (JobMarketAgent, ProjectAdvisorAgent) unless the user explicitly requests it. Only update what the user can currently see to avoid surprising them with hidden changes.]`;
    } else if (dashboardType === "projects") {
      const data = agentOutputs.projectRecommendations;
      context = `[CONTEXT: User is viewing Project Portfolio Dashboard with current data: ${
        data ? "loaded" : "not loaded"
      }]`;
      instruction = `[INSTRUCTION: Focus on updating ONLY the Project Portfolio data. Do NOT call other agents (JobMarketAgent, CourseCatalogAgent) unless the user explicitly requests it. Only update what the user can currently see to avoid surprising them with hidden changes.]`;
    }

    return `${context}\n${instruction}\nUser question: ${userMessage}`;
  };

  const handleSendMessage = async () => {
    const trimmed = chatMessage.trim();
    if (!trimmed || isSubmitting || !isConnected) {
      return;
    }

    // Add context prefix for backend
    const messageWithContext = buildContextPrefix(trimmed);

    // Show original message to user
    addUserMessage(trimmed);
    setChatMessage("");
    setIsSubmitting(true);

    // Don't clear progress - preserve chat history
    // clearProgress();

    try {
      startPlan(messageWithContext, sessionId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start plan";
      addErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearChat = () => {
    clearHistory();
    clearProgress();
  };

  return (
    <div className={`${className} h-[500px]`}>
      <Card className="w-full shadow-lg border border-border bg-card/95 backdrop-blur-sm transition-all duration-300 h-full flex flex-col">
        <ChatHeader
          isConnected={isConnected}
          isMinimized={false}
          onToggleMinimize={() => {}}
          onClearChat={handleClearChat}
          title={title}
        />
        <CardContent className="flex flex-col flex-1 min-h-0 p-0">
          <div className="flex-1 overflow-hidden min-h-0">
            <ChatHistory
              messages={chatHistory}
              agentBadgeIntent={agentBadgeIntent}
              isLoading={isRunning}
            />
          </div>
          <div className="p-4 pt-3 flex-shrink-0">
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

export default DashboardEmbeddedChat;
