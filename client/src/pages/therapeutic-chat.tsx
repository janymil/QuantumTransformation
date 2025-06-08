import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, MessageCircle, Clock, Trash2, Heart, Lightbulb, Settings, Brain } from "lucide-react";

// Import modular components
import { MessageBubble } from "@/components/therapeutic-chat/MessageBubble";
import { ActionButtons } from "@/components/therapeutic-chat/ActionButtons";
import { MessageInput } from "@/components/therapeutic-chat/MessageInput";
import { LoadingIndicator } from "@/components/therapeutic-chat/LoadingIndicator";
import { Message, ConversationSession, TherapeuticResponse } from "@/components/therapeutic-chat/types";

export default function TherapeuticChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [activeSession, setActiveSession] = useState<ConversationSession | null>(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [conversationStyle, setConversationStyle] = useState("socratic");
  const [focusArea, setFocusArea] = useState("general");
  const [responseLength, setResponseLength] = useState("balanced");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversation threads
  const { data: threads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ['/api/therapeutic-chat/sessions'],
  });

  // Delete thread mutation
  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: number) => {
      const response = await fetch(`/api/deep-journaling/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deep-journaling/threads'] });
      toast({
        title: "Thread Deleted",
        description: "The conversation thread has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete thread",
        variant: "destructive",
      });
    },
  });

  // Send message mutation - therapeutic chat only (no database save until finish)
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, actionType }: { message: string; actionType?: 'go_deeper' | 'new_direction' | 'customize_response' }) => {
      // Call therapeutic chat endpoint directly without saving to database
      const response = await fetch('/api/therapeutic-chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: message.trim(),
          threadId: activeSession?.threadId, // Include threadId to continue existing conversation
          conversationStyle,
          focusArea,
          actionType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      return await response.json();
    },
    onSuccess: (response: any, variables: any) => {
      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: variables.message,
        timestamp: new Date()
      };
      
      // Add AI response with therapeutic chat format
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: response.response || 'I understand. Please tell me more.',
        timestamp: new Date(),
        emotionalTone: response.emotionalInsight || 'curious'
      };
      
      setMessages(prev => [...prev, userMessage, aiMessage]);
      setCurrentMessage("");
      
      // Do NOT save to database or update threads here
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: "Hello! I'm here to listen and support you. Feel free to share whatever is on your mind - there's no judgment here, just genuine understanding. What would you like to explore together today?",
        timestamp: new Date(),
        emotionalTone: 'welcoming'
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || sendMessageMutation.isPending) return;

    const messageToSend = currentMessage.trim();
    
    try {
      await sendMessageMutation.mutateAsync({
        message: messageToSend
      });
      setCurrentMessage(""); // Clear input only after successful send
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGoDeeper = async (lastAiMessage: string) => {
    const deeperPrompt = `I'd like to explore this further. Can you help me go deeper into what we just discussed: "${lastAiMessage.substring(0, 100)}..."`;
    
    try {
      const response = await fetch('/api/deep-journaling/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput: deeperPrompt, actionType: 'go_deeper' })
      });

      if (response.ok) {
        const data = await response.json();
        const newAiMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: data.analysis?.professionalAnalysis || data.question || data.response || 'Let me explore this deeper with you.',
          timestamp: new Date(),
          emotionalTone: data.emotionalState?.primaryEmotion || 'insightful'
        };

        setMessages(prev => [...prev, newAiMessage]);
        setActiveSession(data.threadId);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate deeper response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewDirection = async (aiMessage: string) => {
    const newDirectionPrompt = `Please completely shift the therapeutic direction. Instead of continuing with "${aiMessage}", explore a different angle of my concerns. Ask questions that reveal new perspectives, challenge my assumptions, or guide me toward unexplored aspects of my situation. Help me see my challenges from a fresh, innovative viewpoint.`;
    
    try {
      const response = await fetch('/api/deep-journaling/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput: newDirectionPrompt, actionType: 'new_direction' })
      });

      if (response.ok) {
        const data = await response.json();
        const newAiMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: data.analysis?.professionalAnalysis || data.question || data.response || 'Let me explore this further with you.',
          timestamp: new Date(),
          emotionalTone: data.emotionalState?.primaryEmotion || 'curious'
        };

        setMessages(prev => [...prev, newAiMessage]);
        setActiveSession(data.threadId);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate new direction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFinishConversation = async () => {
    if (messages.length <= 1) {
      toast({
        title: "No Conversation to Save",
        description: "Please have a conversation first before finishing.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Prepare conversation data for saving
      const conversationData = {
        threadId: activeSession?.threadId, // Include threadId if continuing existing conversation
        title: messages.find(m => m.type === 'user')?.content?.slice(0, 50) + '...' || 'Therapeutic Chat',
        messages: messages.filter(m => m.type !== 'ai' || m.id !== 'welcome'), // Exclude welcome message
        conversationStyle,
        focusArea
      };

      const response = await fetch('/api/therapeutic-chat/save-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversationData)
      });

      if (response.ok) {
        toast({
          title: "Conversation Saved",
          description: "Your therapeutic session has been saved successfully.",
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/therapeutic-chat/sessions"] });
        
        setActiveSession(null);
        setMessages([]);
        startNewSession();
      } else {
        throw new Error('Failed to save conversation');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Unable to save conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startNewSession = () => {
    setMessages([{
      id: 'welcome',
      type: 'ai',
      content: "Hello! I'm here to listen and support you. Feel free to share whatever is on your mind - there's no judgment here, just genuine understanding. What would you like to explore together today?",
      timestamp: new Date(),
      emotionalTone: 'welcoming'
    }]);
    setActiveSession(null);
    setCurrentMessage("");
  };

  // Load session function to continue chatting with saved conversations
  const loadSession = async (sessionId: number) => {
    try {
      console.log('Loading session:', sessionId);
      const response = await fetch(`/api/therapeutic-chat/sessions/${sessionId}/messages`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Session data received:', data);
        
        if (data?.exchanges && data.exchanges.length > 0) {
          const formattedMessages: Message[] = [];
          
          // Load conversation history directly without welcome message
          data.exchanges.forEach((exchange: any) => {
            console.log('Processing exchange:', exchange);
            
            if (exchange.userInput) {
              formattedMessages.push({
                id: `user-${exchange.id}`,
                type: 'user',
                content: exchange.userInput,
                timestamp: new Date(exchange.createdAt || Date.now())
              });
            }
            
            // Check multiple possible fields for AI response
            const aiContent = exchange.aiAnalysis || exchange.analysis || exchange.question || exchange.response;
            if (aiContent) {
              formattedMessages.push({
                id: `ai-${exchange.id}`,
                type: 'ai',
                content: aiContent,
                timestamp: new Date(exchange.createdAt || Date.now()),
                emotionalTone: 'supportive'
              });
            }
          });
          
          console.log('Formatted messages:', formattedMessages);
          
          // Set the loaded conversation history
          setMessages(formattedMessages);
          setActiveSession({
            id: sessionId,
            threadId: sessionId,
            title: data.session?.title || `Session ${sessionId}`,
            isActive: true
          });
          
          toast({
            title: "Conversation Loaded",
            description: `Loaded ${formattedMessages.length} messages. Continue where you left off.`,
          });
        } else {
          console.log('No exchanges found, starting fresh session');
          // If no exchanges found, start fresh but with session context
          setMessages([]);
          setActiveSession({
            id: sessionId,
            threadId: sessionId,
            title: data.session?.title || `Session ${sessionId}`,
            isActive: true
          });
          
          toast({
            title: "Session Started",
            description: "Continuing session with fresh conversation.",
          });
        }
      } else {
        console.error('Failed to load session:', response.status, response.statusText);
        throw new Error('Failed to load conversation');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Voice recording functions - restored from original working implementation
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await processVoiceRecording(audioBlob);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setAudioChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);
    } catch (error) {
      toast({
        title: "Microphone Access",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };



  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };



  const processVoiceRecording = async (audioBlob: Blob) => {
    // Voice processing would go here
    toast({
      title: "Voice Processing",
      description: "Voice recording feature is being enhanced. Please type your message for now.",
    });
  };

  useEffect(() => {
    if (audioChunks.length > 0 && !isRecording) {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      processVoiceRecording(audioBlob);
      setAudioChunks([]);
    }
  }, [audioChunks, isRecording]);

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Therapeutic Chat</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered therapeutic companion</p>
            </div>
          </div>
          
          <Button 
            onClick={startNewSession}
            className="w-full"
            variant="default"
          >
            Start New Conversation
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {threads && Array.isArray(threads) && threads.length > 0 ? (
              threads.map((thread: any) => (
                <Card 
                  key={thread.id} 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => loadSession(thread.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="h-4 w-4 text-blue-500" />
                          <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">
                            {thread.title || 'Therapeutic Session'}
                          </h3>
                        </div>
                        
                        {/* Emotional insight badge */}
                        {thread.emotionalJourney && thread.emotionalJourney.length > 0 && (
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              <Heart className="h-3 w-3 mr-1" />
                              {thread.emotionalJourney[0] || 'Processing emotions'}
                            </span>
                          </div>
                        )}
                        
                        {/* Brief analysis */}
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {thread.lastMessage ? 
                            `Topic: ${thread.lastMessage.slice(0, 50)}${thread.lastMessage.length > 50 ? '...' : ''}` :
                            'Therapeutic conversation about personal growth and self-reflection'
                          }
                        </p>
                        
                        {/* Statistics */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>Session</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteThreadMutation.mutate(thread.id);
                        }}
                        disabled={deleteThreadMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No conversations yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Start your first therapeutic chat session
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Heart className="h-4 w-4 text-pink-500" />
            <span>Safe space for reflection</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span>AI-guided insights</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeSession ? activeSession.title : "New Therapeutic Session"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Confidential AI-assisted therapeutic conversation
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <MessageCircle className="h-3 w-3 mr-1" />
              Active Session
            </Badge>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-blue-25 to-blue-50 dark:from-gray-800 dark:to-gray-900">
          <div className="space-y-6 w-full max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <div key={message.id}>
                <MessageBubble 
                  message={message} 
                  onDelete={deleteMessage}
                />
                
                {/* Action buttons after last AI message */}
                {message.type === 'ai' && index === messages.length - 1 && (
                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                      <div className="mt-3 flex items-center gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => handleGoDeeper(message.content)}
                          disabled={sendMessageMutation.isPending}
                        >
                          Go Deeper
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => handleNewDirection(message.content)}
                          disabled={sendMessageMutation.isPending}
                        >
                          New Direction
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => setShowCustomizationModal(true)}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Customize
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          onClick={() => handleFinishConversation()}
                          disabled={messages.length <= 1}
                        >
                          Finish Conversation
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Input Area - Inside chat with consistent alignment */}
            <MessageInput
              currentMessage={currentMessage}
              isRecording={isRecording}
              isLoading={sendMessageMutation.isPending}
              onMessageChange={setCurrentMessage}
              onKeyPress={handleKeyPress}
              onSendMessage={handleSendMessage}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
            />
          
            {sendMessageMutation.isPending && (
              <div className="flex justify-center">
                <div className="w-full max-w-2xl">
                  <LoadingIndicator />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Customization Modal */}
      <Dialog open={showCustomizationModal} onOpenChange={setShowCustomizationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Response</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="conversation-style">Conversation Style</Label>
              <Select value={conversationStyle} onValueChange={setConversationStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="socratic">Socratic Questioning</SelectItem>
                  <SelectItem value="directive">Directive</SelectItem>
                  <SelectItem value="reflective">Reflective</SelectItem>
                  <SelectItem value="collaborative">Collaborative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="focus-area">Focus Area</Label>
              <Select value={focusArea} onValueChange={setFocusArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Select focus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Exploration</SelectItem>
                  <SelectItem value="emotions">Emotional Processing</SelectItem>
                  <SelectItem value="patterns">Pattern Recognition</SelectItem>
                  <SelectItem value="goals">Goal Setting</SelectItem>
                  <SelectItem value="relationships">Relationships</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="response-length">Response Length</Label>
              <Select value={responseLength} onValueChange={setResponseLength}>
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief & Focused</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="detailed">Detailed & Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={() => setShowCustomizationModal(false)}
              className="w-full"
            >
              Apply Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}