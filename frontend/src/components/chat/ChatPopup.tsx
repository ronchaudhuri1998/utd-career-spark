import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";
import DashboardEmbeddedChat from "./DashboardEmbeddedChat";

interface ChatPopupProps {
  title: string;
  dashboardType: "jobmarket" | "academics" | "projects";
  className?: string;
}

const ChatPopup = ({
  title,
  dashboardType,
  className = "",
}: ChatPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={handleOpen}
        variant="default"
        size="sm"
        className={`gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}
      >
        <MessageCircle className="w-4 h-4" />
        Chat with {title}
      </Button>

      {/* Chat Popup Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 border-0 shadow-2xl flex flex-col">
          <div className="flex-1 min-h-0 overflow-hidden">
            <DashboardEmbeddedChat
              title={title}
              dashboardType={dashboardType}
              className="h-full border-0"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatPopup;
