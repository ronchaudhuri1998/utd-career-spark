import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Wrench, CheckCircle, Clock, Search, FileText, TrendingUp, User } from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";

interface Message {
  id: number;
  message: string;
  isUser: boolean;
  type?: "message" | "tool_call" | "action";
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  status?: "pending" | "success" | "error";
  result?: string;
}

interface MainChatOverlayProps {
  className?: string;
}

const MainChatOverlay = ({ className = "" }: MainChatOverlayProps) => {
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const { setSectionLoading } = useUserData();

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "job_market_overview":
        return <Search className="w-4 h-4" />;
      case "projects_overview":
        return <User className="w-4 h-4" />;
      case "academic_planning":
        return <FileText className="w-4 h-4" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  const simulateAPICall = async (toolName: string, delay: number) => {
    // Set loading state for the corresponding section
    const sectionMap: {
      [key: string]: "jobMarket" | "projects" | "academics";
    } = {
      job_market_overview: "jobMarket",
      projects_overview: "projects",
      academic_planning: "academics",
    };

    const section = sectionMap[toolName];
    if (section) {
      setSectionLoading(section, true);
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Clear loading state
    if (section) {
      setSectionLoading(section, false);
    }
  };

  const simulateAgenticFlow = async (userMessage: string) => {
    const messages: Message[] = [];

    // Add user message
    messages.push({
      id: Date.now(),
      message: userMessage,
      isUser: true,
      type: "message",
    });

    // Add thinking message
    messages.push({
      id: Date.now() + 1,
      message:
        "I'll help you with that! Let me analyze your profile and gather some information...",
      isUser: false,
      type: "message",
    });

    // Add tool calls
    const toolCalls = [
      {
        id: Date.now() + 2,
        toolName: "job_market_overview",
        toolArgs: {
          location: "Dallas, TX",
          skills: ["React", "Python", "Machine Learning"],
          experience: "entry",
        },
        message: "Fetching job market data and trending opportunities...",
      },
      {
        id: Date.now() + 3,
        toolName: "projects_overview",
        toolArgs: {
          userId: "user123",
          skills: ["React", "Python", "Machine Learning"],
          difficulty: "intermediate",
        },
        message:
          "Analyzing your profile and generating project recommendations...",
      },
      {
        id: Date.now() + 4,
        toolName: "academic_planning",
        toolArgs: {
          userId: "user123",
          currentCourses: ["CS 3345", "CS 3305"],
          targetGPA: "3.8",
          graduationYear: "2025",
        },
        message:
          "Creating personalized academic roadmap and course suggestions...",
      },
    ];

    // Add tool calls with pending status
    toolCalls.forEach((toolCall) => {
      messages.push({
        ...toolCall,
        isUser: false,
        type: "tool_call" as const,
        status: "pending" as const,
      });
    });

    // Add final response
    messages.push({
      id: Date.now() + 6,
      message:
        "Perfect! I've analyzed your profile, found 15 relevant job opportunities, and created a personalized 6-month career development plan. You're particularly well-positioned for React Developer roles with an average salary of $85K in your area. Would you like me to show you the detailed plan?",
      isUser: false,
      type: "message",
    });

    return messages;
  };

  const handleSendMessage = async () => {
    if (chatMessage.trim()) {
      const userInput = chatMessage;
      setChatMessage("");

      // Simulate agentic flow
      const messages = await simulateAgenticFlow(userInput);

      // Add messages with delays to simulate real-time processing
      for (let i = 0; i < messages.length; i++) {
        setTimeout(async () => {
          setChatHistory((prev) => [...prev, messages[i]]);

          // Update tool call status after a delay and simulate API call
          if (messages[i].type === "tool_call") {
            const toolName = messages[i].toolName;
            const delay = 2000 + i * 1000; // Vary delay for each tool call

            // Simulate API call
            await simulateAPICall(toolName!, delay);

            // Update status to success
            setChatHistory((prev) =>
              prev.map((msg) =>
                msg.id === messages[i].id
                  ? {
                      ...msg,
                      status: "success" as const,
                      result: "API call completed successfully",
                    }
                  : msg
              )
            );
          }
        }, i * 1500);
      }
    }
  };

  const dismissMessages = () => {
    setShowChatOverlay(false);
  };

  const handleInputClick = () => {
    setShowChatOverlay(true);
  };

  return (
    <>
      {/* Dimming Overlay */}
      {showChatOverlay && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 cursor-pointer"
          onClick={dismissMessages}
        />
      )}

      {/* Floating Messages Container */}
      {showChatOverlay && chatHistory.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-40 flex flex-col justify-end pb-20">
          <div className="space-y-3 w-full px-4">
            {chatHistory.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isUser ? "justify-end" : "justify-start"
                }`}
              >
                {message.type === "tool_call" ? (
                  <Card className="max-w-[80%] bg-white/95 backdrop-blur-sm border-2 border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        {getToolIcon(message.toolName || "")}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {message.toolName
                                ?.replace("_", " ")
                                .toUpperCase()}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {message.status === "pending" && (
                                <Clock className="w-3 h-3 text-yellow-500 animate-spin" />
                              )}
                              {message.status === "success" && (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              )}
                              {message.status === "error" && (
                                <div className="w-3 h-3 bg-red-500 rounded-full" />
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {message.message}
                          </p>
                          {message.result && (
                            <p className="text-xs text-green-600 mt-1">
                              {message.result}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div
                    className={`max-w-[80%] px-6 py-5 rounded-3xl shadow-2xl ${
                      message.isUser
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "bg-gradient-to-r from-pink-400 to-blue-500 text-white"
                    }`}
                  >
                    <p className="text-xl leading-relaxed">{message.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div
        className={`flex gap-3 p-4 ${
          showChatOverlay ? "relative z-50" : ""
        } ${className}`}
      >
        <Input
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          placeholder="Ask me anything about your career..."
          className="flex-1"
          onClick={handleInputClick}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!chatMessage.trim()}
          className="px-6"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
};

export default MainChatOverlay;
