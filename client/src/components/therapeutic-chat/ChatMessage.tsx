import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, User, Brain } from "lucide-react";
import { Message } from "./types";

interface ChatMessageProps {
  message: Message;
  onDelete: (messageId: string) => void;
}

export function ChatMessage({ message, onDelete }: ChatMessageProps) {
  const isUser = message.type === 'user';
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <Avatar className="mt-1">
          <AvatarFallback className={isUser 
            ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" 
            : "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
          }>
            {isUser ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
          <div className={`group relative inline-block max-w-full ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          } rounded-lg px-4 py-3 shadow-sm`}>
            <div className={`text-sm whitespace-pre-wrap ${
              isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'
            }`}>
              {message.content}
            </div>
            
            {message.emotionalTone && (
              <div className="mt-2 text-xs opacity-75">
                Emotional tone: {message.emotionalTone}
              </div>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              onClick={() => onDelete(message.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          
          <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isUser ? 'text-right' : ''}`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}