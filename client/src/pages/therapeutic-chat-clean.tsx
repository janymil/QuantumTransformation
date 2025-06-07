import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChatSidebar } from "@/components/therapeutic-chat/ChatSidebar";
import { ChatMessage } from "@/components/therapeutic-chat/ChatMessage";
import { ChatInput } from "@/components/therapeutic-chat/ChatInput";
import { Message, ConversationSession, TherapeuticResponse } from "@/components/therapeutic-chat/types";

export default function TherapeuticChatClean() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [activeSession, setActiveSession] = useState<ConversationSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [conversationStyle, setConversationStyle] = useState('socratic');
  const [focusArea, setFocusArea] = useState('general');

  // Queries
  const { data: savedSessions = [] } = useQuery<ConversationSession[]>({
    queryKey: ['/api/therapeutic-sessions'],
    enabled: true,
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return await apiRequest('/api/therapeutic-chat', {
        method: 'POST',
        body: JSON.stringify(messageData),
      });
    },
    onSuccess: (data: TherapeuticResponse) => {
      const aiMessage: Message = {
        id: data.messageId,
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        emotionalTone: data.emotionalState?.primaryEmotion,
      };
      setMessages(prev => [...prev, aiMessage]);
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      return await apiRequest(`/api/therapeutic-sessions/${sessionId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/therapeutic-sessions'] });
      toast({
        title: "Session deleted",
        description: "The conversation has been removed.",
      });
    }
  });

  // Functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    await sendMessageMutation.mutateAsync({
      message: currentMessage,
      sessionId: activeSession?.id,
      style: conversationStyle,
      focus: focusArea,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveSession(null);
    setCurrentMessage('');
    
    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now(),
      type: 'ai',
      content: "Hello! I'm here to provide a safe, supportive space for you to explore your thoughts and feelings. What's on your mind today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const handleSessionSelect = (session: ConversationSession) => {
    setActiveSession(session);
    setMessages(session.messages);
  };

  const handleSessionDelete = (sessionId: number) => {
    deleteSessionMutation.mutate(sessionId);
    if (activeSession?.id === sessionId) {
      handleNewChat();
    }
  };

  const handleGoDeeper = () => {
    if (messages.length === 0) return;
    const lastAiMessage = messages.filter(m => m.type === 'ai').pop();
    if (lastAiMessage) {
      setCurrentMessage(`Can you help me explore this deeper: "${lastAiMessage.content.substring(0, 100)}..."`);
    }
  };

  const handleNewDirection = () => {
    setCurrentMessage("I'd like to explore a different aspect of this topic.");
  };

  const handleFinishConversation = async () => {
    if (!activeSession || messages.length === 0) return;
    
    try {
      await apiRequest('/api/therapeutic-sessions/finish', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: activeSession.id,
          messages: messages,
          title: messages[0]?.content.substring(0, 50) || 'Therapeutic Session'
        }),
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/therapeutic-sessions'] });
      handleNewChat();
      
      toast({
        title: "Session saved",
        description: "Your conversation has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const startRecording = () => {
    setIsRecording(true);
    // Voice recording implementation would go here
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Voice recording implementation would go here
  };

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      handleNewChat();
    }
  }, []);

  const showActionButtons = messages.length > 0 && messages[messages.length - 1]?.type === 'ai';

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <ChatSidebar
        savedSessions={savedSessions}
        activeSession={activeSession}
        onSessionSelect={handleSessionSelect}
        onSessionDelete={handleSessionDelete}
        onNewChat={handleNewChat}
      />

      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                onDelete={deleteMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <ChatInput
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          isRecording={isRecording}
          isPending={sendMessageMutation.isPending}
          onSendMessage={handleSendMessage}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onKeyPress={handleKeyPress}
          onShowCustomization={() => setShowCustomizationModal(true)}
          onGoDeeper={handleGoDeeper}
          onNewDirection={handleNewDirection}
          onFinishConversation={handleFinishConversation}
          showActionButtons={showActionButtons}
          activeSession={activeSession}
        />
      </div>

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
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCustomizationModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCustomizationModal(false)}>
                Apply Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}