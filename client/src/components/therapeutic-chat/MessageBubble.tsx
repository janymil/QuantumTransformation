import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Trash2 } from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  emotionalTone?: string;
}

interface MessageBubbleProps {
  message: Message;
  onDelete: (id: string) => void;
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
  return (
    <div className="group mb-6">
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <div className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <Avatar className="mt-1 flex-shrink-0">
              <AvatarFallback className={
                message.type === 'user' 
                  ? "bg-blue-500 text-white" 
                  : "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
              }>
                {message.type === 'user' ? 'Y' : <Brain className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className={`p-4 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {message.type === 'ai' ? (
                    <div className="space-y-3">
                      <div className="text-gray-800 dark:text-gray-200 leading-7">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {message.type === 'ai' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(message.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}