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
import { Plus, MessageCircle, Clock, Trash2, Heart, Lightbulb, Settings } from "lucide-react";

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
    queryKey: ['/api/deep-journaling/threads'],
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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { 
      message: string; 
      threadId?: number; 
      conversationStyle?: string; 
      focusArea?: string; 
      responseLength?: string;
      wasVoiceInput?: boolean;
    }) => {
      const response = await fetch('/api/deep-journaling/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data: TherapeuticResponse) => {
      const aiMessage: Message = {
        id: data.messageId,
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        emotionalTone: data.emotionalState?.primaryEmotion
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (data.sessionId && !activeSession) {
        setActiveSession({
          id: data.sessionId,
          title: `Session ${new Date().toLocaleDateString()}`,
          messages: [],
          lastMessage: data.response.substring(0, 100) + "...",
          createdAt: new Date().toISOString(),
          emotionalJourney: []
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/deep-journaling/threads'] });
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

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    const messageToSend = currentMessage;
    setCurrentMessage("");

    try {
      await sendMessageMutation.mutateAsync({
        message: messageToSend,
        threadId: activeSession?.id,
        conversationStyle,
        focusArea,
        responseLength,
        wasVoiceInput: false
      });
    } catch (error) {
      console.error('Failed to send message:', error);
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
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: deeperPrompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      await sendMessageMutation.mutateAsync({
        message: deeperPrompt,
        threadId: activeSession?.id,
        conversationStyle: 'socratic',
        focusArea: 'patterns',
        responseLength,
        wasVoiceInput: false
      });
    } catch (error) {
      console.error('Failed to go deeper:', error);
    }
  };

  const handleNewDirection = async (lastAiMessage: string) => {
    const newDirectionPrompt = `Let's explore a different angle. Based on our conversation, what other perspectives or aspects should we consider?`;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: newDirectionPrompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      await sendMessageMutation.mutateAsync({
        message: newDirectionPrompt,
        threadId: activeSession?.id,
        conversationStyle: 'collaborative',
        focusArea: 'general',
        responseLength,
        wasVoiceInput: false
      });
    } catch (error) {
      console.error('Failed to explore new direction:', error);
    }
  };

  const handleFinishConversation = () => {
    if (activeSession) {
      toast({
        title: "Session Completed",
        description: "Your therapeutic conversation has been saved.",
      });
      
      setActiveSession(null);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ['/api/deep-journaling/threads'] });
    }
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Deep Journaling</h2>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            AI-powered therapeutic conversations for self-discovery and emotional growth
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {threads.map((thread: any) => (
              <Card key={thread.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">
                        {thread.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {thread.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </span>
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
            ))}
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
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 w-full">
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
                          disabled={!activeSession}
                        >
                          Finish Entry
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