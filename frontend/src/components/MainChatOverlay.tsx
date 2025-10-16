import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Wrench, CheckCircle, Clock, Search, FileText, TrendingUp, User } from "lucide-react";

interface Message {
  id: number;
  message: string;
  isUser: boolean;
  type?: 'message' | 'tool_call' | 'action';
  toolName?: string;
  toolArgs?: any;
  status?: 'pending' | 'success' | 'error';
  result?: string;
}

interface MainChatOverlayProps {
  className?: string;
}

const MainChatOverlay = ({ className = "" }: MainChatOverlayProps) => {
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [showChatOverlay, setShowChatOverlay] = useState(false);

  const getMockResponse = (userMessage: string): string => {
    return "testing 123";
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // Add user message to chat history
      const userMessage = {
        id: Date.now(),
        message: chatMessage,
        isUser: true,
      };
      setChatHistory((prev) => [...prev, userMessage]);

      // Generate mock assistant response
      const assistantResponse = getMockResponse(chatMessage);
      const assistantMessage = {
        id: Date.now() + 1,
        message: assistantResponse,
        isUser: false,
      };

      // Add assistant response after a short delay to simulate typing
      setTimeout(() => {
        setChatHistory((prev) => [...prev, assistantMessage]);
      }, 1000);

      setChatMessage("");
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
                <div
                  className={`max-w-[80%] px-6 py-5 rounded-3xl shadow-2xl ${
                    message.isUser
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      : "bg-gradient-to-r from-pink-400 to-blue-500 text-white"
                  }`}
                >
                  <p className="text-xl leading-relaxed">{message.message}</p>
                </div>
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
