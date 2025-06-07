import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, Send, Heart, Brain, MessageCircle, Lightbulb, TrendingUp, Zap, ChevronDown, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ThreadExchange {
  id: number;
  exchangeOrder: number;
  userInput: string;
  aiAnalysis: any;
  aiQuestion: string;
  aiEmotionalAssessment: any;
  createdAt: Date;
}

interface JournalingThread {
  id: number;
  title: string;
  exchanges: ThreadExchange[];
  currentTopic: string;
  currentEmotionalState: string;
  lastActiveAt: Date;
}

interface TherapeuticCustomizations {
  mode: 'conversational' | 'therapeutic' | 'analytical';
  tone: 'supportive' | 'challenging' | 'neutral' | 'empathetic';
  perspective: 'psychologist' | 'life_coach' | 'cbt_therapist' | 'philosopher' | 'stoic';
}

export default function TherapeuticChat() {
  const [currentMessage, setCurrentMessage] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [customizations, setCustomizations] = useState<TherapeuticCustomizations>({
    mode: 'conversational',
    tone: 'empathetic',
    perspective: 'psychologist'
  });
  const [showCustomizations, setShowCustomizations] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch threads
  const { data: threads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ['/api/deep-journaling/threads'],
    retry: false,
  });

  // Fetch active thread details
  const { data: activeThread, isLoading: threadLoading } = useQuery({
    queryKey: ['/api/deep-journaling/thread', activeThreadId],
    enabled: !!activeThreadId,
    retry: false,
  });

  // Send message mutation - connect to deep journaling engine
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      threadId?: number;
      userInput: string;
      customizations: TherapeuticCustomizations;
      actionType?: 'go_deeper' | 'new_direction' | 'customize_response';
    }) => {
      return await apiRequest('/api/deep-journaling/process', 'POST', data);
    },
    onSuccess: (response: any) => {
      // Update active thread or set new thread
      if (response.threadId) {
        setActiveThreadId(response.threadId);
        queryClient.invalidateQueries({ queryKey: ['/api/deep-journaling/thread', response.threadId] });
        queryClient.invalidateQueries({ queryKey: ['/api/deep-journaling/threads'] });
      }
      setCurrentMessage("");
      
      // Scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
      console.error('Send message error:', error);
    },
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      threadId: activeThreadId || undefined,
      userInput: currentMessage,
      customizations,
    });
  };

  const handleCustomizationChange = (key: keyof TherapeuticCustomizations, value: string) => {
    setCustomizations(prev => ({ ...prev, [key]: value }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentMessage]);

  const startNewConversation = () => {
    setActiveThreadId(null);
    setCurrentMessage("");
  };

  const applyAction = (actionType: 'go_deeper' | 'new_direction' | 'customize_response') => {
    if (!activeThread?.exchanges?.length) return;
    
    const lastExchange = activeThread.exchanges[activeThread.exchanges.length - 1];
    
    sendMessageMutation.mutate({
      threadId: activeThreadId || undefined,
      userInput: lastExchange.userInput,
      customizations,
      actionType,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto max-w-6xl h-screen flex flex-col p-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Therapeutic Chat</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activeThread ? `Topic: ${activeThread.currentTopic}` : 'Start a new conversation'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={startNewConversation}
              className="hidden sm:flex"
            >
              New Chat
            </Button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          {/* Sidebar with threads */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hidden lg:flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Conversations</h3>
            </div>
            <ScrollArea className="flex-1 p-2">
              {threadsLoading ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
              ) : threads.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No conversations yet</div>
              ) : (
                <div className="space-y-2">
                  {threads.map((thread: any) => (
                    <div
                      key={thread.id}
                      onClick={() => setActiveThreadId(thread.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        activeThreadId === thread.id
                          ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      } border`}
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                        {thread.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {thread.dominantEmotion && (
                          <Badge variant="outline" className="mr-2">
                            {thread.dominantEmotion}
                          </Badge>
                        )}
                        {new Date(thread.lastActiveAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col">
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              {threadLoading ? (
                <div className="text-center text-gray-500 py-8">Loading conversation...</div>
              ) : !activeThread ? (
                <div className="text-center text-gray-500 py-12">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Welcome to Therapeutic Chat</h3>
                  <p className="text-sm mb-6 max-w-md mx-auto">
                    Share what's on your mind. I'm here to listen, understand, and guide you through thoughtful conversation.
                  </p>
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMessage("I've been feeling overwhelmed lately...")}
                      className="text-left justify-start"
                    >
                      💭 Share feelings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMessage("I want to work on personal growth...")}
                      className="text-left justify-start"
                    >
                      🌱 Personal growth
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMessage("I'm dealing with a difficult situation...")}
                      className="text-left justify-start"
                    >
                      🤔 Difficult situation
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMessage("I need clarity on my goals...")}
                      className="text-left justify-start"
                    >
                      🎯 Goal clarity
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeThread.exchanges?.map((exchange: ThreadExchange) => (
                    <div key={exchange.id} className="space-y-4">
                      {/* User Message */}
                      <div className="flex justify-end">
                        <div className="bg-blue-600 text-white rounded-lg px-4 py-3 max-w-md shadow-sm">
                          <p className="text-sm">{exchange.userInput}</p>
                        </div>
                      </div>
                      
                      {/* AI Response */}
                      <div className="flex justify-start">
                        <div className="flex space-x-3 max-w-4xl">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              <Brain className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 flex-1">
                            <div className="space-y-3">
                              {exchange.therapeuticResponse && (
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {exchange.therapeuticResponse}
                                </p>
                              )}
                              
                              {exchange.emotionalInsight && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Heart className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Emotional Insight</span>
                                  </div>
                                  <p className="text-xs text-blue-700 dark:text-blue-300">
                                    {exchange.emotionalInsight}
                                  </p>
                                </div>
                              )}
                              
                              {exchange.followUpQuestion && (
                                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                                  <p className="text-sm text-purple-900 dark:text-purple-100 font-medium">
                                    {exchange.followUpQuestion}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Action Buttons (like Mindsera) */}
                  {activeThread?.exchanges?.length > 0 && (
                    <div className="flex justify-center space-x-2 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyAction('go_deeper')}
                        disabled={sendMessageMutation.isPending}
                        className="flex items-center space-x-2"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>Go Deeper</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyAction('new_direction')}
                        disabled={sendMessageMutation.isPending}
                        className="flex items-center space-x-2"
                      >
                        <Lightbulb className="w-4 h-4" />
                        <span>New Direction</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomizations(!showCustomizations)}
                        className="flex items-center space-x-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Customize</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showCustomizations ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* In-Chat Customization Panel */}
            {showCustomizations && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Mode
                    </label>
                    <Select
                      value={customizations.mode}
                      onValueChange={(value) => handleCustomizationChange('mode', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversational">Conversational</SelectItem>
                        <SelectItem value="therapeutic">Therapeutic</SelectItem>
                        <SelectItem value="analytical">Analytical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Tone
                    </label>
                    <Select
                      value={customizations.tone}
                      onValueChange={(value) => handleCustomizationChange('tone', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="empathetic">Empathetic</SelectItem>
                        <SelectItem value="supportive">Supportive</SelectItem>
                        <SelectItem value="challenging">Challenging</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Perspective
                    </label>
                    <Select
                      value={customizations.perspective}
                      onValueChange={(value) => handleCustomizationChange('perspective', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="psychologist">Psychologist</SelectItem>
                        <SelectItem value="life_coach">Life Coach</SelectItem>
                        <SelectItem value="cbt_therapist">CBT Therapist</SelectItem>
                        <SelectItem value="philosopher">Philosopher</SelectItem>
                        <SelectItem value="stoic">Stoic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Share what's on your mind..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[50px] max-h-[150px] resize-none pr-12"
                    disabled={sendMessageMutation.isPending}
                  />
                  <div className="absolute right-2 bottom-2 flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsRecording(!isRecording)}
                      className="w-8 h-8 p-0"
                    >
                      {isRecording ? (
                        <MicOff className="w-4 h-4 text-red-500" />
                      ) : (
                        <Mic className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                  className="px-6"
                >
                  {sendMessageMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}