import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Send,
  Bot,
  User,
  Loader2,
  CircleCheck,
  Activity,
  Minus,
  MessageCircle,
} from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import { useWebSocket } from "@/hooks/useWebSocket";

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

const MainChatOverlayStreaming = ({
  className = "",
}: {
  className?: string;
}) => {
  const { userData, sessionId } = useUserData();
  const {
    isConnected,
    isRunning,
    progress,
    result,
    error,
    startPlan,
    clearProgress,
  } = useWebSocket();

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Handle live agent progress updates
  useEffect(() => {
    if (progress.length > 0) {
      const latestProgress = progress[progress.length - 1];
      const progressMessage: Message = {
        id: Date.now() + latestProgress.timestamp,
        text: latestProgress.event,
        isUser: false,
        meta: {
          agent: latestProgress.agent,
          event: latestProgress.event,
          output: latestProgress.output,
        },
      };

      // Update or add the progress message
      setChatHistory((prev) => {
        // Remove any existing progress messages for this agent
        const filtered = prev.filter(
          (msg) =>
            !(
              msg.meta?.agent === latestProgress.agent &&
              msg.meta?.event === latestProgress.event
            )
        );
        return [...filtered, progressMessage];
      });
    }
  }, [progress]);

  // Handle plan completion
  useEffect(() => {
    if (result) {
      const agentEntries = result.trace.map((entry, idx) => ({
        id: Date.now() + idx + 1,
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
  }, [result]);

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

  const handleSendMessage = async () => {
    const trimmed = chatMessage.trim();
    if (!trimmed || isSubmitting || !isConnected) {
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
    clearProgress();

    try {
      const extraContext = {
        student_year: userData.studentYear || userData.graduationYear || "",
        courses_taken: userData.coursesTaken || "",
        about: userData.bio || "",
        time_commitment: userData.timeCommitment || "",
        contact_email: userData.email || "",
      };

      startPlan(trimmed, sessionId, extraContext);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start plan";
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now() + 999,
          text: message,
          isUser: false,
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const overallLoading = isRunning;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card
        className={`w-96 shadow-lg transition-all duration-300 ${
          isMinimized ? "h-16" : "h-[600px]"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Career Chat
            {!isConnected && (
              <Badge variant="destructive" className="text-xs">
                Disconnected
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0"
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
              chatHistory.map((msg) => {
                const isProgressUpdate = msg.meta?.agent && !msg.isUser;
                const isCompleted =
                  msg.meta?.event?.includes("Completed") ||
                  msg.meta?.event?.includes("Generated");

                return (
                  <div
                    key={msg.id}
                    className={`rounded-lg border p-3 text-sm transition-all duration-200 ${
                      msg.isUser
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
                        {msg.isUser ? (
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
                          {msg.isUser ? "You" : msg.meta?.agent || "Agent"}
                        </span>
                        {isProgressUpdate && !isCompleted && (
                          <span className="text-blue-600 text-xs">
                            Working...
                          </span>
                        )}
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
                      {msg.meta?.output
                        ? `${msg.text}\n\n${msg.meta.output}`
                        : msg.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask about your career goals..."
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isSubmitting || !isConnected}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSubmitting || !isConnected || !chatMessage.trim()}
                size="sm"
                className="px-3"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {overallLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Agents are working on your request...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MainChatOverlayStreaming;
