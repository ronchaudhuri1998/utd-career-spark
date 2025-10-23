import { Activity, Loader2, ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ChatMessage, { Message } from "./ChatMessage";
import { Button } from "@/components/ui/button";

interface ChatHistoryProps {
  messages: Message[];
  agentBadgeIntent: Record<string, string>;
  isLoading: boolean;
}

const ChatHistory = ({
  messages,
  agentBadgeIntent,
  isLoading,
}: ChatHistoryProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Check if user is near the bottom
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Show button if user scrolled up more than 100px from bottom
    setShowScrollButton(distanceFromBottom > 100);
    setIsUserScrolling(distanceFromBottom > 20);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Auto-scroll to bottom when new messages arrive (unless user scrolled up)
  useEffect(() => {
    if (!isUserScrolling) {
      scrollToBottom();
    }
  }, [messages, isUserScrolling]);

  // Add scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScrollPosition);
    checkScrollPosition(); // Initial check

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
    };
  }, []);

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm p-6">
        <div className="bg-muted/30 rounded-full p-4 mb-4">
          <Activity className="w-8 h-8 text-muted-foreground/60" />
        </div>
        <p className="text-center leading-relaxed">
          Ask for a new goal and the agents will re-run the workflow.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto space-y-3 pr-1"
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            agentBadgeIntent={agentBadgeIntent}
          />
        ))}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 right-6 z-10">
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full shadow-lg hover:shadow-xl transition-all"
            onClick={scrollToBottom}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;
