import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brain } from "lucide-react";
import { useEffect, useState } from "react";

interface LoadingIndicatorProps {
  stage?: 'analyzing' | 'thinking' | 'responding';
}

export function LoadingIndicator({ stage = 'thinking' }: LoadingIndicatorProps) {
  const [dots, setDots] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = {
    analyzing: ['Analyzing your message', 'Understanding your emotions', 'Processing your thoughts'],
    thinking: ['Thinking deeply', 'Reflecting on your words', 'Considering your feelings'],
    responding: ['Crafting a response', 'Choosing the right words', 'Preparing insights']
  };

  const currentMessages = messages[stage];

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % currentMessages.length);
    }, 2000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(messageInterval);
    };
  }, [currentMessages.length]);

  return (
    <div className="flex items-start gap-3 mb-4" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <Avatar className="mt-1">
        <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
          <Brain className="h-4 w-4 animate-pulse" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-200 dark:border-gray-700 max-w-2xl">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm min-w-0 font-medium">
              {currentMessages[messageIndex]}{dots}
            </span>
          </div>
          
          {/* Typing indicator with blinking cursor */}
          <div className="mt-3 flex items-center gap-1">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full" style={{ animation: 'pulse-dot 1.5s infinite' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full" style={{ animation: 'pulse-dot 1.5s infinite 0.2s' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full" style={{ animation: 'pulse-dot 1.5s infinite 0.4s' }}></div>
            </div>
            <div className="w-0.5 h-4 bg-gray-500 ml-2" style={{ animation: 'blink 1s infinite' }}></div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
          Therapeutic AI is carefully considering your message...
        </div>
      </div>
    </div>
  );
}