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
  const assistantMessageIdRef = useRef<string | number | null>(null);

  // Handle response text updates (streaming assistant message)
  useEffect(() => {
    if (responseText && responseText.trim()) {
      setChatHistory((prev) => {
        const assistantMessageId = assistantMessageIdRef.current;

        if (assistantMessageId !== null) {
          console.log(
            `📝 Updating existing assistant message with ID: ${assistantMessageId}`
          );
          // Update existing assistant message
          const messageIndex = prev.findIndex(
            (msg) => msg.id === assistantMessageId
          );
          if (messageIndex >= 0) {
            console.log(
              `📝 Found existing message at index ${messageIndex}, updating...`
            );
            const updatedMessages = [...prev];
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              text: responseText,
            };
            return updatedMessages;
          } else {
            console.log(`📝 Existing message not found, will create new one`);
          }
        }

        // Create new assistant message with unique time-based ID
        const newAssistantMessage: Message = {
          id: `assistant-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          text: responseText,
          isUser: false,
        };

        console.log(
          `📝 Creating new assistant message with unique ID: ${newAssistantMessage.id}`
        );
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

      // Create a unique ID that includes timestamp and agent name to avoid conflicts
      const uniqueId = `${card.startTime}-${agentName}-${Date.now()}`;

      console.log(
        `🔧 Creating new agent message with unique ID: ${uniqueId} for agent: ${agentName}`
      );

      messages.push({
        id: uniqueId,
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
      console.log(`📝 Current chat history length: ${prev.length}`);
      console.log(`📝 New agent messages count: ${messages.length}`);

      // Keep all previous messages and add new agent messages
      // Since we're using unique IDs, we should keep all previous messages
      // and just add the new ones
      const allMessages = [...prev, ...messages];

      console.log(`📝 Final chat history length: ${allMessages.length}`);

      return allMessages;
    });
  }, [agentCards]);

  // Collaborator responses are now handled in useSSE.ts and passed as progress events

  // Handle errors
  useEffect(() => {
    if (error) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: error,
          isUser: false,
        },
      ]);
    }
  }, [error]);

  const addUserMessage = (text: string) => {
    const userEntry: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      isUser: true,
    };
    console.log(`📝 Creating new user message with unique ID: ${userEntry.id}`);

    // Reset assistant message ref when user sends a new message
    // This ensures each assistant response gets a new unique ID
    console.log(`🔄 Resetting assistant message ref for new conversation`);
    assistantMessageIdRef.current = null;

    setChatHistory((prev) => [...prev, userEntry]);
  };

  const addErrorMessage = (text: string) => {
    const errorEntry: Message = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
