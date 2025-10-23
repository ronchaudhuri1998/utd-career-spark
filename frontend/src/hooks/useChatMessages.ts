import { useState, useEffect, useRef } from "react";
import { Message } from "@/components/chat/ChatMessage";
import { AgentCard, PlanComplete } from "@/hooks/useSSE";

interface UseChatMessagesProps {
  agentCards: Map<string, AgentCard>;
  result: PlanComplete | null;
  error: string | null;
  responseText?: string;
}

export const useChatMessages = ({
  agentCards,
  result,
  error,
  responseText,
}: UseChatMessagesProps) => {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const assistantMessageIdRef = useRef<number | null>(null);

  // Handle response text updates (streaming assistant message)
  useEffect(() => {
    if (responseText && responseText.trim()) {
      setChatHistory((prev) => {
        const assistantMessageId = assistantMessageIdRef.current;

        if (assistantMessageId !== null) {
          // Update existing assistant message
          const messageIndex = prev.findIndex(
            (msg) => msg.id === assistantMessageId
          );
          if (messageIndex >= 0) {
            const updatedMessages = [...prev];
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              text: responseText,
            };
            return updatedMessages;
          }
        }

        // Create new assistant message
        const newAssistantMessage: Message = {
          id: Date.now() + 1000, // Use a unique ID for assistant message
          text: responseText,
          isUser: false,
        };

        assistantMessageIdRef.current = newAssistantMessage.id;
        return [...prev, newAssistantMessage];
      });
    }
  }, [responseText]);

  // Convert agentCards Map to Message array
  useEffect(() => {
    const messages: Message[] = [];

    agentCards.forEach((card, agentName) => {
      const displayText = card.reasoningItems[0] || "Working...";
      const status = card.status === "completed" ? "completed" : "progress";

      messages.push({
        id: card.startTime,
        text: displayText,
        isUser: false,
        meta: {
          agent: agentName,
          call_id: agentName,
          event: displayText,
          output: card.output,
          status: status,
          progressUpdates: card.reasoningItems,
        },
      });
    });

    setChatHistory((prev) => {
      const userMessages = prev.filter((msg) => msg.isUser);
      return [...userMessages, ...messages];
    });
  }, [agentCards]);

  // Collaborator responses are now handled in useSSE.ts and passed as progress events

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
    assistantMessageIdRef.current = null;
  };

  return {
    chatHistory,
    addUserMessage,
    addErrorMessage,
    clearHistory,
  };
};
