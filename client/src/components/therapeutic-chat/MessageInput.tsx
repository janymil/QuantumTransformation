import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, Smile, Tag, X } from "lucide-react";

interface MessageInputProps {
  currentMessage: string;
  isRecording: boolean;
  isLoading: boolean;
  currentMood: number;
  currentTags: string[];
  showMoodTracker: boolean;
  onMessageChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSendMessage: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onMoodChange: (mood: number) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onToggleMoodTracker: () => void;
}

export function MessageInput({
  currentMessage,
  isRecording,
  isLoading,
  currentMood,
  currentTags,
  showMoodTracker,
  onMessageChange,
  onKeyPress,
  onSendMessage,
  onStartRecording,
  onStopRecording,
  onMoodChange,
  onAddTag,
  onRemoveTag,
  onToggleMoodTracker
}: MessageInputProps) {
  const [tagInput, setTagInput] = useState("");
  
  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!currentTags.includes(tagInput.trim().toLowerCase())) {
        onAddTag(tagInput.trim().toLowerCase());
      }
      setTagInput("");
    }
  };

  const moodEmojis = ['😰', '😟', '😐', '😊', '😍'];
  const moodLabels = ['Very Low', 'Low', 'Neutral', 'Good', 'Excellent'];

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        {!isLoading && (
          <>
            {/* Mood and Tags Toolbar */}
            <div className="mb-4 space-y-3">
              {/* Mood Tracker Toggle and Display */}
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onToggleMoodTracker}
                  className="flex items-center gap-2"
                >
                  <Smile className="h-4 w-4" />
                  {showMoodTracker ? 'Hide Mood' : 'Track Mood'}
                </Button>
                
                {currentMood > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-2">
                    <span className="text-lg">{moodEmojis[Math.floor((currentMood - 1) / 2)]}</span>
                    <span>Mood: {currentMood}/10</span>
                  </Badge>
                )}
              </div>

              {/* Mood Slider */}
              {showMoodTracker && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">How are you feeling right now?</span>
                      <span className="font-medium">{moodLabels[Math.floor((currentMood - 1) / 2)] || 'Not Set'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">😰</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={currentMood}
                        onChange={(e) => onMoodChange(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <span className="text-2xl">😍</span>
                    </div>
                    <div className="text-center">
                      <span className="text-3xl">{moodEmojis[Math.floor((currentMood - 1) / 2)]}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Add topic tags (e.g., work, family, anxiety)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    className="text-sm"
                  />
                </div>
                
                {/* Current Tags */}
                {currentTags && currentTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                        onClick={() => onRemoveTag(tag)}
                      >
                        #{tag}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Message Input */}
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