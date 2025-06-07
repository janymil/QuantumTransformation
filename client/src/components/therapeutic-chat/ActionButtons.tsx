import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface ActionButtonsProps {
  onGoDeeper: () => void;
  onNewDirection: () => void;
  onCustomize: () => void;
  onFinishConversation: () => void;
  isLoading: boolean;
  hasActiveSession: boolean;
}

export function ActionButtons({ 
  onGoDeeper, 
  onNewDirection, 
  onCustomize, 
  onFinishConversation, 
  isLoading,
  hasActiveSession 
}: ActionButtonsProps) {
  return (
    <div className="mt-3 flex items-center gap-2 justify-center">
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs"
        onClick={onGoDeeper}
        disabled={isLoading}
      >
        Go Deeper
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-xs"
        onClick={onNewDirection}
        disabled={isLoading}
      >
        New Direction
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-xs"
        onClick={onCustomize}
      >
        <Settings className="h-3 w-3 mr-1" />
        Customize
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        onClick={onFinishConversation}
        disabled={!hasActiveSession}
      >
        Finish Entry
      </Button>
    </div>
  );
}