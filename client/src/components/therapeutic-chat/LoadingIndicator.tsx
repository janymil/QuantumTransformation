import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brain } from "lucide-react";

export function LoadingIndicator() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-start gap-3">
          <Avatar className="mt-1 flex-shrink-0">
            <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
              <Brain className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="bg-transparent border-l-4 border-l-blue-500 pl-4 p-4 rounded-2xl thinking-container">
              <div className="flex items-center gap-2">
                {/* Blinking cursor */}
                <div className="w-0.5 h-5 bg-blue-500 cursor-blink"></div>
                
                {/* Thinking text with animated dots */}
                <div className="text-blue-800 dark:text-blue-300 text-sm">
                  <span>Analyzing and reflecting</span>
                  <span className="inline-block ml-1">
                    <span className="dot-bounce-1">.</span>
                    <span className="dot-bounce-2">.</span>
                    <span className="dot-bounce-3">.</span>
                  </span>
                </div>
              </div>
              
              {/* Subtle breathing animation for the whole container */}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 opacity-75">
                Taking time to understand your perspective
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}