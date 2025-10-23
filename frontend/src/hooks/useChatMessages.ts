import { useState, useEffect, useRef } from "react";
import { Message } from "@/components/chat/ChatMessage";
import { AgentProgress, PlanComplete } from "@/hooks/useSSE";

interface UseChatMessagesProps {
  progress: AgentProgress[];
  result: PlanComplete | null;
  error: string | null;
  responseText?: string;
}

export const useChatMessages = ({
  progress,
  result,
  error,
  responseText,
}: UseChatMessagesProps) => {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const agentMessagesRef = useRef<Map<string, Message>>(new Map());
  const processedProgressRef = useRef<Set<string>>(new Set());
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

  // Handle live agent progress updates
  useEffect(() => {
    if (progress.length > 0) {
      const latestProgress = progress[progress.length - 1];
      const agent = latestProgress.agent;

      // Create unique key to prevent double processing in React StrictMode
      const callId = latestProgress.call_id || "no-call-id";
      const progressKey = `${latestProgress.agent}-${callId}-${latestProgress.event}-${latestProgress.timestamp}`;

      if (processedProgressRef.current.has(progressKey)) {
        console.log("🔄 Skipping already processed progress:", progressKey);
        return;
      }

      processedProgressRef.current.add(progressKey);

      console.log("🔄 Processing progress:", {
        agent: latestProgress.agent,
        call_id: latestProgress.call_id,
        event: latestProgress.event,
        status: latestProgress.status,
        completed: latestProgress.completed,
      });

      setChatHistory((prev) => {
        // Check if we already have a message for this agent call (using call_id)
        const callId = latestProgress.call_id || "no-call-id";
        const existingMessageIndex = prev.findIndex(
          (msg) =>
            msg.meta?.agent === agent &&
            (msg.meta?.call_id || "no-call-id") === callId &&
            !msg.isUser
        );

        console.log("🔍 Message lookup:", {
          agent,
          call_id: latestProgress.call_id,
          callId,
          existingMessageIndex,
          totalMessages: prev.length,
          existingMessage:
            existingMessageIndex >= 0 ? prev[existingMessageIndex] : null,
        });

        let updatedMessage: Message;

        if (existingMessageIndex >= 0) {
          // Update existing message
          const existingMessage = prev[existingMessageIndex];

          // Always allow status updates, including progress -> completed transitions
          const progressUpdates = existingMessage.meta?.progressUpdates || [];

          // Add new progress update if it's different from the last one
          if (latestProgress.event !== existingMessage.text) {
            progressUpdates.push(latestProgress.event);
          }

          updatedMessage = {
            ...existingMessage,
            text: latestProgress.event,
            meta: {
              ...existingMessage.meta,
              call_id: callId,
              event: latestProgress.event,
              output: latestProgress.output,
              status:
                latestProgress.status ||
                (latestProgress.completed ? "completed" : "progress"),
              progressUpdates: progressUpdates,
            },
          };
        } else {
          // Create new message for this agent
          updatedMessage = {
            id: Date.now() + parseInt(latestProgress.timestamp),
            text: latestProgress.event,
            isUser: false,
            meta: {
              agent: latestProgress.agent,
              call_id: callId,
              event: latestProgress.event,
              output: latestProgress.output,
              status:
                latestProgress.status ||
                (latestProgress.completed ? "completed" : "progress"),
              progressUpdates: [],
            },
          };
        }

        // Update the message in the array
        const newHistory = [...prev];
        if (existingMessageIndex >= 0) {
          newHistory[existingMessageIndex] = updatedMessage;
          console.log("✅ Updated existing message:", {
            agent: updatedMessage.meta?.agent,
            call_id: updatedMessage.meta?.call_id,
            status: updatedMessage.meta?.status,
          });
        } else {
          newHistory.push(updatedMessage);
          console.log("🆕 Created new message:", {
            agent: updatedMessage.meta?.agent,
            call_id: updatedMessage.meta?.call_id,
            status: updatedMessage.meta?.status,
          });
        }

        return newHistory;
      });
    }
  }, [progress]);

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
    agentMessagesRef.current.clear();
    processedProgressRef.current.clear();
    assistantMessageIdRef.current = null;
  };

  return {
    chatHistory,
    addUserMessage,
    addErrorMessage,
    clearHistory,
  };
};
