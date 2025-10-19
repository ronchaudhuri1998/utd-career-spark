import { Bot, User, Loader2, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  meta?: {
    agent: string;
    event: string;
    output?: string;
  };
}

interface ChatMessageProps {
  message: Message;
  agentBadgeIntent: Record<string, string>;
}

const ChatMessage = ({ message, agentBadgeIntent }: ChatMessageProps) => {
  const isProgressUpdate = message.meta?.agent && !message.isUser;
  const isCompleted =
    message.meta?.event?.includes("Completed") ||
    message.meta?.event?.includes("Generated");

  return (
    <div
      className={`rounded-lg border p-3 text-sm transition-all duration-200 ${
        message.isUser
          ? "border-primary/40 bg-primary/10"
          : isProgressUpdate
          ? isCompleted
            ? "border-green-200 bg-green-50"
            : "border-blue-200 bg-blue-50"
          : "border-secondary bg-secondary/30"
      }`}
    >
      <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {message.isUser ? (
            <User className="w-3 h-3" />
          ) : isProgressUpdate ? (
            isCompleted ? (
              <CircleCheck className="w-3 h-3 text-green-600" />
            ) : (
              <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
            )
          ) : (
            <Bot className="w-3 h-3" />
          )}
          <span className="font-semibold">
            {message.isUser ? "You" : message.meta?.agent || "Agent"}
          </span>
          {isProgressUpdate && !isCompleted && (
            <span className="text-blue-600 text-xs">Working...</span>
          )}
        </div>
        {!message.isUser && (
          <Badge
            variant="outline"
            className={
              message.meta?.agent
                ? agentBadgeIntent[message.meta.agent] || ""
                : ""
            }
          >
            {message.meta?.agent || "Response"}
          </Badge>
        )}
      </div>
      <p className="text-foreground whitespace-pre-wrap leading-relaxed">
        {message.meta?.output
          ? `${message.text}\n\n${message.meta.output}`
          : message.text}
      </p>
    </div>
  );
};

export default ChatMessage;
export type { Message };
