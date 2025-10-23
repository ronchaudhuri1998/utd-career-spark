import { MessageCircle, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle } from "@/components/ui/card";

interface ChatHeaderProps {
  isConnected: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClearChat?: () => void;
}

const ChatHeader = ({
  isConnected,
  isMinimized,
  onToggleMinimize,
  onClearChat,
}: ChatHeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/50">
      <CardTitle className="text-lg font-semibold flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        Career Chat
        {!isConnected && (
          <Badge variant="destructive" className="text-xs">
            Disconnected
          </Badge>
        )}
      </CardTitle>
      {onClearChat && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearChat}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </CardHeader>
  );
};

export default ChatHeader;
