import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Bot, User, Loader2, CircleCheck, Activity, Minus, MessageCircle } from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";

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

const agentBadgeIntent: Record<string, string> = {
  JobMarketAgent: "bg-orange-500/10 text-orange-700 border-orange-200",
  CourseCatalogAgent: "bg-green-500/10 text-green-700 border-green-200",
  ProjectAdvisorAgent: "bg-blue-500/10 text-blue-700 border-blue-200",
  CareerPlannerAgent: "bg-purple-500/10 text-purple-700 border-purple-200",
};

const MainChatOverlay = ({ className = "" }: { className?: string }) => {
  const {
    runAgentWorkflow,
    agentOutputs,
    sectionLoading,
    resetAgentOutputs,
  } = useUserData();
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSendMessage = async () => {
    const trimmed = chatMessage.trim();
    if (!trimmed || isSubmitting) {
      return;
    }

    const userEntry: Message = {
      id: Date.now(),
      text: trimmed,
      isUser: true,
    };
    setChatHistory((prev) => [...prev, userEntry]);
    setChatMessage("");
    setIsSubmitting(true);

    try {
      const response = await runAgentWorkflow(trimmed);
      if (response?.trace) {
        const agentEntries = response.trace.map((entry, idx) => ({
          id: userEntry.id + idx + 1,
          text: entry.event,
          isUser: false,
          meta: {
            agent: entry.agent,
            event: entry.event,
            output: entry.output,
          },
        }));
        setChatHistory((prev) => [...prev, ...agentEntries]);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Agent workflow failed";
      setChatHistory((prev) => [
        ...prev,
        {
          id: userEntry.id + 999,
          text: message,
          isUser: false,
        },
      ]);
    } finally {
      setIsSubmitting(false);
      setShowOverlay(true);
    }
  };

  const overallLoading =
    sectionLoading.jobMarket || sectionLoading.projects || sectionLoading.academics;

  if (isMinimized) {
    return (
      <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
        <Button
          className="rounded-full shadow-lg bg-gradient-primary text-primary-foreground px-4 py-2 flex items-center gap-2"
          onClick={() => setIsMinimized(false)}
        >
          <MessageCircle className="w-4 h-4" />
          Open Agent Console
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-full max-w-lg z-40 ${className}`}>
      <Card className="relative shadow-xl border-2 border-primary/20">
        <CardHeader className="relative bg-primary text-primary-foreground rounded-t-xl flex items-center justify-between pr-12">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Agent Console
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-primary-foreground hover:bg-primary/20 rounded-full w-8 h-8"
            onClick={() => setIsMinimized(true)}
            aria-label="Minimize agent console"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-64 overflow-y-auto space-y-3 pr-1">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                <Activity className="w-6 h-6 mb-2" />
                Ask for a new goal and the agents will re-run the workflow.
              </div>
            ) : (
              chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg border p-3 text-sm ${
                    msg.isUser
                      ? "border-primary/40 bg-primary/10"
                      : "border-secondary bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {msg.isUser ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <Bot className="w-3 h-3" />
                      )}
                      <span className="font-semibold">
                        {msg.isUser ? "You" : msg.meta?.agent || "Agent"}
                      </span>
                    </div>
                    {!msg.isUser && (
                      <Badge
                        variant="outline"
                        className={
                          msg.meta?.agent
                            ? agentBadgeIntent[msg.meta.agent] || ""
                            : ""
                        }
                      >
                        {msg.meta?.agent || "Response"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {msg.meta?.output ? `${msg.text}\n\n${msg.meta.output}` : msg.text}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Ask the agents for a new plan..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onFocus={() => setShowOverlay(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isSubmitting}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSubmitting}
              className="bg-gradient-primary"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {overallLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CircleCheck className="w-3 h-3 text-green-600" />
              )}
              <span>
                {overallLoading
                  ? "Agents running..."
                  : "Last plan stored in AgentCore: " +
                    (agentOutputs.agentcore?.status || "Unknown")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                resetAgentOutputs();
                setChatHistory([]);
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MainChatOverlay;
