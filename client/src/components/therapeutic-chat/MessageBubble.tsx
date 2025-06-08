import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, User, Bot } from "lucide-react";
import { Message } from "./types";

interface MessageBubbleProps {
  message: Message;
  onDelete: (messageId: string) => void;
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-2xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
        <div className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            message.type === 'user' 
              ? 'bg-blue-500 text-white' 
              : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
          }`}>
            {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>

          {/* Message Content */}
          <div className={`flex-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-4 rounded-2xl shadow-sm max-w-full ${
              message.type === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
            }`}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </div>

              {/* Timestamp only */}
              <div className={`flex items-center gap-2 mt-2 text-xs ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                <span>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>

            {/* Delete button - only show on hover */}
            <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(message.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}