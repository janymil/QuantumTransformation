import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Send, Brain, User, Mic, Settings, MoreVertical } from "lucide-react";

interface TherapeuticCustomizations {
  mode: 'conversational' | 'therapeutic' | 'analytical';
  tone: 'supportive' | 'challenging' | 'neutral' | 'empathetic';
  perspective: 'psychologist' | 'life_coach' | 'cbt_therapist' | 'philosopher' | 'stoic';
}

export default function TherapeuticChat() {
  const [currentMessage, setCurrentMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [customizations, setCustomizations] = useState<TherapeuticCustomizations>({
    mode: 'conversational',
    tone: 'supportive',
    perspective: 'psychologist'
  });
  const [showCustomizations, setShowCustomizations] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Connect to existing deep journaling backend
  const { data: threadData, isLoading: threadLoading } = useQuery({
    queryKey: ['/api/deep-journaling/threads'],
    retry: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      userInput: string;
      customizations: TherapeuticCustomizations;
      actionType?: 'go_deeper' | 'new_direction' | 'customize_response';
    }) => {
      return await apiRequest('/api/deep-journaling/process', 'POST', data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/deep-journaling/threads'] });
      setCurrentMessage("");
      
      // Scroll to show new response
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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

  const handleQuickAction = (actionType: 'go_deeper' | 'new_direction' | 'customize_response') => {
    if (!currentMessage.trim()) return;
    
    sendMessageMutation.mutate({
      userInput: currentMessage,
      customizations,
      actionType,
    });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentMessage]);

  const latestThread = Array.isArray(threadData) && threadData.length > 0 ? threadData[0] : null;
  const exchanges = latestThread?.exchanges || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Therapeutic Chat
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your AI therapeutic companion for deep conversations and personal growth
          </p>
        </div>

        {/* Conversation Display */}
        <div className="space-y-6 mb-8">
          {exchanges.length > 0 ? (
            exchanges.map((exchange: any, index: number) => (
              <div key={index} className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-6 py-4 max-w-[80%]">
                    <p className="leading-relaxed">{exchange.userInput}</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-6 py-4 max-w-[80%] shadow-sm">
                    <div className="space-y-3">
                      {/* Main AI Analysis */}
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {typeof exchange.aiAnalysis === 'string' 
                          ? exchange.aiAnalysis 
                          : exchange.aiAnalysis?.response || exchange.aiAnalysis?.analysis || 'Processing your thoughts...'}
                      </p>
                      
                      {/* Emotional Insight */}
                      {exchange.aiEmotionalAssessment && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                            Emotional Insight
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {typeof exchange.aiEmotionalAssessment === 'string' 
                              ? exchange.aiEmotionalAssessment 
                              : exchange.aiEmotionalAssessment?.insight || JSON.stringify(exchange.aiEmotionalAssessment)}
                          </p>
                        </div>
                      )}
                      
                      {/* Follow-up Question */}
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
            ))
          ) : (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Start Your Therapeutic Journey
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Share what's on your mind and begin a meaningful conversation
              </p>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        {currentMessage.trim() && (
          <div className="flex flex-wrap gap-3 mb-6 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('go_deeper')}
              disabled={sendMessageMutation.isPending}
              className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              Go Deeper
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('new_direction')}
              disabled={sendMessageMutation.isPending}
              className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
            >
              New Direction
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('customize_response')}
              disabled={sendMessageMutation.isPending}
              className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
            >
              Customize Response
            </Button>
          </div>
        )}

        {/* Input Area */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg">
          <CardContent className="p-6">
            {/* Customization Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomizations(!showCustomizations)}
                  className="text-gray-600 dark:text-gray-400"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Customize AI
                </Button>
              </div>
              
              {latestThread && (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {latestThread.currentEmotionalState || 'Neutral'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {exchanges.length} exchanges
                  </Badge>
                </div>
              )}
            </div>

            {/* Customization Panel */}
            {showCustomizations && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mode
                    </label>
                    <Select 
                      value={customizations.mode} 
                      onValueChange={(value: any) => setCustomizations({...customizations, mode: value})}
                    >
                      <SelectTrigger className="w-full">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tone
                    </label>
                    <Select 
                      value={customizations.tone} 
                      onValueChange={(value: any) => setCustomizations({...customizations, tone: value})}
                    >
                      <SelectTrigger className="w-full">
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Perspective
                    </label>
                    <Select 
                      value={customizations.perspective} 
                      onValueChange={(value: any) => setCustomizations({...customizations, perspective: value})}
                    >
                      <SelectTrigger className="w-full">
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
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Share your thoughts, feelings, or what's on your mind..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[100px] max-h-[300px] resize-none pr-12 text-base leading-relaxed"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setIsRecording(!isRecording)}
                >
                  <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500' : ''}`} />
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                className="self-end bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
              >
                {sendMessageMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}