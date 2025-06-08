import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send } from "lucide-react";

interface MessageInputProps {
  currentMessage: string;
  isRecording: boolean;
  isLoading: boolean;
  onMessageChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSendMessage: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function MessageInput({
  currentMessage,
  isRecording,
  isLoading,
  onMessageChange,
  onKeyPress,
  onSendMessage,
  onStartRecording,
  onStopRecording
}: MessageInputProps) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        {!isLoading && (
          <>
            <div className="relative">
              <Textarea
                value={currentMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyDown={onKeyPress}
                placeholder="Write directly here... Press Enter to send, Shift+Enter for new line"
                className="min-h-[120px] max-h-[200px] resize-none pr-20 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isLoading}
              />
              
              {/* Voice and Send buttons inside textarea */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={isRecording ? onStopRecording : onStartRecording}
                  className={`h-8 w-8 p-0 ${isRecording ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                  disabled={isLoading}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  onClick={onSendMessage}
                  disabled={!currentMessage.trim() || isLoading}
                  className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Voice recording indicator */}
            {isRecording && (
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-red-500 animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Recording... Click the microphone to stop
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}