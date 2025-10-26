import { Bot, User, Loader2, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Message {
  id: string | number;
  text: string;
  isUser: boolean;
  meta?: {
    agent: string;
    call_id: string;
    event: string;
    output?: string;
    status?: "started" | "progress" | "completed";
    progressUpdates?: string[];
    toolCalls?: Array<{
      type: string;
      name: string;
      result: string;
    }>;
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

  const messageClasses = cn(
    "rounded-lg border p-3 text-sm transition-all duration-200 m-4 text-foreground",
    message.isUser
      ? "border-primary/50 bg-primary/15 dark:bg-primary/20"
      : isProgressUpdate
      ? isCompleted
        ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/20"
        : "border-primary/50 bg-primary/10 dark:bg-primary/20"
      : "border-border bg-card/80 dark:bg-secondary/25"
  );

  return (
    <div className={messageClasses}>
      <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {message.isUser ? (
            <User className="w-3 h-3" />
          ) : isProgressUpdate ? (
            isCompleted ? (
              <CircleCheck className="w-3 h-3 text-emerald-500" />
            ) : (
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
            )
          ) : (
            <Bot className="w-3 h-3" />
          )}
          <span className="font-semibold">
            {message.isUser ? "You" : message.meta?.agent || "Agent"}
          </span>
          {isProgressUpdate && !isCompleted && (
            <span className="text-primary text-xs font-medium">
              {isStarted ? "Starting..." : "Working..."}
            </span>
          )}
        </div>
        {!message.isUser && (
          <Badge
            variant="outline"
            className={cn(
              "bg-transparent border-border text-foreground/80",
              message.meta?.agent ? agentBadgeIntent[message.meta.agent] || "" : ""
            )}
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
                {message.text.length > 100
                  ? `${message.text.slice(0, 100)}...`
                  : message.text}
              </p>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="space-y-2">
                {hasProgressUpdates && (
                  <div>
                    <p className="font-medium text-sm mb-2 text-foreground">
                      Reasoning:
                    </p>
                    <div className="space-y-1 text-sm text-foreground/90">
                      {message.meta.progressUpdates.map((update, index) => (
                        <p key={index} className="whitespace-pre-wrap">
                          {update}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {isCompleted && hasOutput && (
                  <div>
                    <p className="font-medium text-sm mb-2 text-foreground">
                      Final Output:
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-foreground/90">
                      {message.meta.output}
                    </p>
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
