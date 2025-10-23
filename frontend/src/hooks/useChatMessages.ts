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

      // Use the map key (which is the call_id) as the stable message ID
      const uniqueId = agentName; // agentName is already the call_id from the map key

      console.log(
        `🔧 Creating new agent message with unique ID: ${uniqueId} for agent: ${agentName}`
      );

      // Use the card.agent property for display name, not the map key
      const displayAgentName = card.agent || agentName;

      messages.push({
        id: uniqueId,
        text: displayText,
        isUser: false,
        meta: {
          agent: displayAgentName,
          call_id: agentName,
          event: displayText,
          output: card.output,
          status: status,
          progressUpdates: card.reasoningItems,
          toolCalls: card.toolCalls,
        },
      });
    });

    setChatHistory((prev) => {
      console.log(`📝 Current chat history length: ${prev.length}`);
      console.log(`📝 New agent messages count: ${messages.length}`);

      // Create a map of all messages by ID for deduplication
      const messageMap = new Map<string | number, Message>();

      // Add all existing messages to the map (this preserves their data)
      prev.forEach((msg) => {
        messageMap.set(msg.id, msg);
      });

      // Add/update agent messages (these will replace existing entries with same ID)
      messages.forEach((msg) => {
        messageMap.set(msg.id, msg);
      });

      // Convert back to array and sort by ID (which includes timestamp for user messages)
      // User messages have timestamp-based IDs, agent messages have stable call_ids
      // We need to maintain insertion order for proper chronology
      const allMessages = Array.from(messageMap.values());

      // Sort messages chronologically
      // User messages have numeric IDs (timestamps), agent cards have string IDs
      // We'll sort by the order they appear in the original array or by timestamp
      allMessages.sort((a, b) => {
        // If both have numeric IDs (user messages), sort by ID
        if (typeof a.id === "number" && typeof b.id === "number") {
          return a.id - b.id;
        }
        // If one is user message and one is agent, preserve their relative order from prev
        const aIndex = prev.findIndex((msg) => msg.id === a.id);
        const bIndex = prev.findIndex((msg) => msg.id === b.id);

        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }

        // New messages go to the end
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;

        return 0;
      });

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
