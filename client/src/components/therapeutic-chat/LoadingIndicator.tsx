import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brain } from "lucide-react";

export function LoadingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="mt-1">
        <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
          <Brain className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
        <span className="text-sm">AI is thinking...</span>
      </div>
    </div>
  );
}