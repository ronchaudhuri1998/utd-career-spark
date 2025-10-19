import { Bot, User, Loader2, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  meta?: {
    agent: string;
    call_id: string;
    event: string;
    output?: string;
    status?: "started" | "progress" | "completed";
    progressUpdates?: string[];
  };
}

interface ChatMessageProps {
  message: Message;
  agentBadgeIntent: Record<string, string>;
}

const ChatMessage = ({ message, agentBadgeIntent }: ChatMessageProps) => {
  const isProgressUpdate = message.meta?.agent && !message.isUser;
  const isCompleted = message.meta?.status === "completed";
  const isInProgress = message.meta?.status === "progress";
  const isStarted = message.meta?.status === "started";

  // Determine if we should show accordion content
  const hasProgressUpdates =
    message.meta?.progressUpdates && message.meta.progressUpdates.length > 0;
  const hasOutput = message.meta?.output;
  const shouldShowAccordion =
    isProgressUpdate && (hasProgressUpdates || hasOutput);

  return (
    <div
      className={`rounded-lg border p-3 text-sm transition-all duration-200 m-4 ${
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
            <span className="text-blue-600 text-xs">
              {isStarted ? "Starting..." : "Working..."}
            </span>
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

      {shouldShowAccordion ? (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details" className="border-none">
            <AccordionTrigger className="py-2 px-0 hover:no-underline">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed text-left">
                {message.text}
              </p>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="space-y-2">
                {!isCompleted && hasProgressUpdates && (
                  <div>
                    <p className="font-medium text-sm mb-2">
                      Progress Updates:
                    </p>
                    {message.meta.progressUpdates.map((update, index) => (
                      <p key={index}>{update}</p>
                    ))}
                  </div>
                )}
                {isCompleted && hasOutput && (
                  <div>
                    <p className="whitespace-pre-wrap">{message.meta.output}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <p className="text-foreground whitespace-pre-wrap leading-relaxed">
          {message.text}
        </p>
      )}
    </div>
  );
};

export default ChatMessage;
export type { Message };
