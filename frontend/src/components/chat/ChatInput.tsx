import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  isSubmitting: boolean;
  isConnected: boolean;
  disabled?: boolean;
}

const ChatInput = ({
  message,
  onMessageChange,
  onSend,
  isSubmitting,
  isConnected,
  disabled = false,
}: ChatInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled) {
      onSend();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Ask about your career goals..."
          onKeyDown={handleKeyDown}
          disabled={isSubmitting || !isConnected || disabled}
          className="flex-1 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
        />
        <Button
          onClick={onSend}
          disabled={isSubmitting || !isConnected || !message.trim() || disabled}
          className="h-10 w-10"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
