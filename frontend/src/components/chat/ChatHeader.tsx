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
    </CardHeader>
  );
};

export default ChatHeader;
