import { Activity, Loader2 } from "lucide-react";
import ChatMessage, { Message } from "./ChatMessage";

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
    <div className="h-full overflow-y-auto space-y-3 pr-1">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          agentBadgeIntent={agentBadgeIntent}
        />
      ))}
    </div>
  );
};

export default ChatHistory;
