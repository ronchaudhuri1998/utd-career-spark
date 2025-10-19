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
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
        <Activity className="w-6 h-6 mb-2" />
        Ask for a new goal and the agents will re-run the workflow.
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
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Agents are working on your request...</span>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;
