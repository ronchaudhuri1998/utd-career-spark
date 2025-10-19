import { useState, useEffect } from "react";
import { Message } from "@/components/chat/ChatMessage";
import { AgentProgress, PlanComplete } from "@/lib/websocket";

interface UseChatMessagesProps {
  progress: AgentProgress[];
  result: PlanComplete | null;
  error: string | null;
}

export const useChatMessages = ({
  progress,
  result,
  error,
}: UseChatMessagesProps) => {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  // Handle live agent progress updates
  useEffect(() => {
    if (progress.length > 0) {
      const latestProgress = progress[progress.length - 1];
      const progressMessage: Message = {
        id: Date.now() + parseInt(latestProgress.timestamp),
        text: latestProgress.event,
        isUser: false,
        meta: {
          agent: latestProgress.agent,
          event: latestProgress.event,
          output: latestProgress.output,
        },
      };

      // Update or add the progress message
      setChatHistory((prev) => {
        // Remove any existing progress messages for this agent
        const filtered = prev.filter(
          (msg) =>
            !(
              msg.meta?.agent === latestProgress.agent &&
              msg.meta?.event === latestProgress.event
            )
        );
        return [...filtered, progressMessage];
      });
    }
  }, [progress]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now() + 999,
          text: error,
          isUser: false,
        },
      ]);
    }
  }, [error]);

  const addUserMessage = (text: string) => {
    const userEntry: Message = {
      id: Date.now(),
      text,
      isUser: true,
    };
    setChatHistory((prev) => [...prev, userEntry]);
  };

  const addErrorMessage = (text: string) => {
    const errorEntry: Message = {
      id: Date.now() + 999,
      text,
      isUser: false,
    };
    setChatHistory((prev) => [...prev, errorEntry]);
  };

  const clearHistory = () => {
    setChatHistory([]);
  };

  return {
    chatHistory,
    addUserMessage,
    addErrorMessage,
    clearHistory,
  };
};
