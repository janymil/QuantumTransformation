import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, Send, Settings, Brain } from "lucide-react";

interface ChatInputProps {
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  isRecording: boolean;
  isPending: boolean;
  onSendMessage: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onShowCustomization: () => void;
  onGoDeeper: () => void;
  onNewDirection: () => void;
  onFinishConversation: () => void;
  showActionButtons: boolean;
  activeSession: any;
}

export function ChatInput({
  currentMessage,
  setCurrentMessage,
  isRecording,
  isPending,
  onSendMessage,
  onStartRecording,
  onStopRecording,
  onKeyPress,
  onShowCustomization,
  onGoDeeper,
  onNewDirection,
  onFinishConversation,
  showActionButtons,
  activeSession
}: ChatInputProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="max-w-2xl mx-auto">
        {!isPending && (
          <div className="relative">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="Write directly here... Press Enter to send, Shift+Enter for new line"
              className="min-h-[120px] max-h-[200px] resize-none pr-20 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
              disabled={isPending}
            />
            
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={isRecording ? onStopRecording : onStartRecording}
                className={`h-8 w-8 p-0 ${isRecording ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                disabled={isPending}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                onClick={onSendMessage}
                disabled={!currentMessage.trim() || isPending}
                className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {isRecording && (
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-red-500 animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Recording... Click the microphone to stop
              </div>
            )}
          </div>
        )}
        
        {showActionButtons && (
          <div className="mt-3 flex items-center gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={onGoDeeper}
              disabled={isPending}
            >
              Go Deeper
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={onNewDirection}
              disabled={isPending}
            >
              New Direction
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={onShowCustomization}
            >
              <Settings className="h-3 w-3 mr-1" />
              Customize
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              onClick={onFinishConversation}
              disabled={!activeSession}
            >
              Finish Entry
            </Button>
          </div>
        )}
        
        {isPending && (
          <div className="flex justify-center">
            <div className="max-w-2xl">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}