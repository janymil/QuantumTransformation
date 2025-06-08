import { Button } from "@/components/ui/button";
import { MessageSquare, Lightbulb, Settings } from "lucide-react";

interface ActionButtonsProps {
  onGoDeeper: () => void;
  onNewDirection: () => void;
  onCustomize: () => void;
  isLoading?: boolean;
}

export function ActionButtons({ onGoDeeper, onNewDirection, onCustomize, isLoading = false }: ActionButtonsProps) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex gap-2 justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onGoDeeper}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs"
          >
            <MessageSquare className="h-3 w-3" />
            {isLoading ? 'Processing...' : 'Go Deeper'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNewDirection}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs"
          >
            <Lightbulb className="h-3 w-3" />
            {isLoading ? 'Processing...' : 'New Direction'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onCustomize}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs"
          >
            <Settings className="h-3 w-3" />
            Customize
          </Button>
        </div>
      </div>
    </div>
  );
}