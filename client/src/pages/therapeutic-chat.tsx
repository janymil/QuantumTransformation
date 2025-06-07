import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageCircle, 
  Send, 
  Brain, 
  User, 
  Plus, 
  Heart, 
  Settings, 
  Lightbulb, 
  ArrowRight,
  Compass,
  RefreshCw
} from "lucide-react";

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
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [customizations, setCustomizations] = useState<TherapeuticCustomizations>({
    mode: 'conversational',
    tone: 'supportive',
    perspective: 'psychologist'
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch threads
  const { data: threads, isLoading: threadsLoading } = useQuery({
    queryKey: ['/api/deep-journaling/threads'],
    retry: false,
  });

  // Current active thread with exchanges
  const { data: currentThread, isLoading: threadLoading } = useQuery({
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
        queryClient.invalidateQueries({ queryKey: ['/api/deep-journaling/threads'] });
        queryClient.invalidateQueries({ queryKey: ['/api/deep-journaling/thread', response.threadId] });
      }
      setCurrentMessage("");
      
      // Scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    sendMessageMutation.mutate({
      threadId: activeThreadId || undefined,
      userInput: currentMessage,
      customizations,
    });
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
    const activeThreadData = currentThread as any;
    if (!activeThreadData?.exchanges?.length) return;
    
    const lastExchange = activeThreadData.exchanges[activeThreadData.exchanges.length - 1];
    
    sendMessageMutation.mutate({
      threadId: activeThreadId || undefined,
      userInput: lastExchange.userInput,
      customizations,
      actionType,
    });
  };

  const threadData = currentThread as any;
  const exchanges = threadData?.exchanges || [];

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
                {threadData ? `Topic: ${threadData.currentTopic || 'Deep Conversation'}` : 'Start a new conversation'}
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
          
          {/* Sidebar - Thread List */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Conversations</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewConversation}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {threadsLoading ? (
                <div className="text-sm text-gray-500">Loading conversations...</div>
              ) : threads && Array.isArray(threads) && threads.length > 0 ? (
                (threads as any[]).map((thread: any) => (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeThreadId === thread.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {thread.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(thread.lastActiveAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No conversations yet</div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
            
            {/* Customization Panel */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mode:</span>
                  <Select 
                    value={customizations.mode} 
                    onValueChange={(value: any) => setCustomizations({...customizations, mode: value})}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="therapeutic">Therapeutic</SelectItem>
                      <SelectItem value="analytical">Analytical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tone:</span>
                  <Select 
                    value={customizations.tone} 
                    onValueChange={(value: any) => setCustomizations({...customizations, tone: value})}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supportive">Supportive</SelectItem>
                      <SelectItem value="challenging">Challenging</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="empathetic">Empathetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-6"
            >
              {threadLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading conversation...</div>
                </div>
              ) : exchanges.length > 0 ? (
                exchanges.map((exchange: ThreadExchange) => (
                  <div key={exchange.id} className="space-y-4">
                    {/* User Message */}
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3 flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {exchange.userInput}
                        </p>
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="ml-6">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-purple-100 dark:bg-purple-900">
                            <Brain className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 flex-1">
                          <div className="space-y-3">
                            {exchange.aiAnalysis && (
                              <p className="text-sm text-gray-900 dark:text-white">
                                {typeof exchange.aiAnalysis === 'string' ? exchange.aiAnalysis : exchange.aiAnalysis.response || exchange.aiAnalysis.analysis}
                              </p>
                            )}
                            
                            {exchange.aiEmotionalAssessment && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Heart className="w-4 h-4 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Emotional Insight</span>
                                </div>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                  {typeof exchange.aiEmotionalAssessment === 'string' ? exchange.aiEmotionalAssessment : exchange.aiEmotionalAssessment.insight || JSON.stringify(exchange.aiEmotionalAssessment)}
                                </p>
                              </div>
                            )}
                            
                            {exchange.aiQuestion && (
                              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                                <p className="text-sm text-purple-900 dark:text-purple-100 font-medium">
                                  {exchange.aiQuestion}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start a Conversation</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Share your thoughts, feelings, or anything on your mind
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {exchanges.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyAction('go_deeper')}
                    disabled={sendMessageMutation.isPending}
                  >
                    <Lightbulb className="w-4 h-4 mr-1" />
                    Go Deeper
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyAction('new_direction')}
                    disabled={sendMessageMutation.isPending}
                  >
                    <Compass className="w-4 h-4 mr-1" />
                    New Direction
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyAction('customize_response')}
                    disabled={sendMessageMutation.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Customize Response
                  </Button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Textarea
                  ref={textareaRef}
                  placeholder="Share your thoughts..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 min-h-[60px] max-h-[200px] resize-none"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Insights */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversation Insights</h2>
            
            {threadData && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Heart className="w-4 h-4 text-pink-600" />
                      <span className="text-sm font-medium">Current Emotion</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {threadData.currentEmotionalState || 'Not assessed'}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Topic</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {threadData.currentTopic || 'General conversation'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Exchanges</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {exchanges.length} messages exchanged
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}