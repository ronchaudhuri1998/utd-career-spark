import { MessageCircle, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle } from "@/components/ui/card";

interface ChatHeaderProps {
  isConnected: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

const ChatHeader = ({
  isConnected,
  isMinimized,
  onToggleMinimize,
}: ChatHeaderProps) => {
  return (
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
        onClick={onToggleMinimize}
        className="h-8 w-8 p-0"
      >
        <Minus className="w-4 h-4" />
      </Button>
    </CardHeader>
  );
};

export default ChatHeader;
