import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, Send, Settings, Heart, Brain, ChevronDown, Trash2, Plus, Target, ArrowRight, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  emotionalTone?: string;
}

interface ConversationSession {
  id: number;
  title: string;
  messages: Message[];
  lastMessage: string;
  createdAt: string;
  emotionalJourney: string[];
}

interface TherapeuticResponse {
  response: string;
  followUpQuestion: string;
  emotionalInsight: string;
  nextSteps?: string[];
  sessionId: number;
  messageId: string;
  analysis?: {
    emotionalAssessment: any;
    patternInsights: any;
    professionalAnalysis: string;
  };
  suggestions?: string[];
  emotionalState?: {
    primaryEmotion: string;
    intensity: number;
    clarity: number;
  };
}

export default function TherapeuticChat() {
  const [currentMessage, setCurrentMessage] = useState("");
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  
  // Therapeutic settings
  const [therapeuticMode, setTherapeuticMode] = useState('empathetic');
  const [conversationStyle, setConversationStyle] = useState('socratic');
  const [focusArea, setFocusArea] = useState('general');
  
  // Session management
  const [threadSessions, setThreadSessions] = useState<ConversationSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get conversation sessions from deep journaling threads
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/deep-journaling/threads"],
    retry: false,
  });

  // Get current session messages from deep journaling thread
  const { data: sessionMessages } = useQuery({
    queryKey: ["/api/deep-journaling/threads", activeSession],
    enabled: !!activeSession,
    retry: false,
  });

  // Send message mutation - now using deep journaling engine
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, actionType }: { message: string; actionType?: 'go_deeper' | 'new_direction' | 'customize_response' }) => {
      const requestBody: any = {
        userInput: message.trim(),
        customizations: {
          mode: therapeuticMode === 'empathetic' ? 'therapeutic' : 
                therapeuticMode === 'analytical' ? 'analytical' : 'conversational',
          tone: therapeuticMode === 'empathetic' ? 'empathetic' :
                therapeuticMode === 'solution-focused' ? 'challenging' : 'supportive',
          perspective: conversationStyle === 'socratic' ? 'psychologist' :
                      conversationStyle === 'cbt' ? 'cbt_therapist' :
                      conversationStyle === 'humanistic' ? 'life_coach' : 'psychologist'
        }
      };

      // Only include threadId if we have an active session
      if (activeSession) {
        requestBody.threadId = activeSession;
      }

      if (actionType) {
        requestBody.actionType = actionType;
      }

      return await apiRequest('POST', '/api/deep-journaling/process', requestBody);
    },
    onSuccess: (response: any) => {
      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: currentMessage,
        timestamp: new Date()
      };
      
      // Add AI response with deep journaling format
      const aiMessage: Message = {
        id: response.exchangeId?.toString() || `ai-${Date.now()}`,
        type: 'ai',
        content: response.question || response.response || '',
        timestamp: new Date(),
        emotionalTone: response.emotionalState?.primaryEmotion || 'neutral'
      };
      
      setMessages(prev => [...prev, userMessage, aiMessage]);
      setCurrentMessage("");
      setActiveSession(response.threadId);
      
      // Invalidate queries to refresh session list
      queryClient.invalidateQueries({ queryKey: ["/api/deep-journaling/threads"] });
    },
    onError: (error) => {
      toast({
        title: "Connection Issue",
        description: "Please try sending your message again.",
        variant: "destructive",
      });
    },
  });

  // Start new session
  const startNewSession = () => {
    setActiveSession(null);
    setMessages([]);
    
    // Add welcome message from AI
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'ai',
      content: "Hello! I'm here to listen and support you. Feel free to share whatever is on your mind - there's no judgment here, just genuine understanding. What would you like to explore together today?",
      timestamp: new Date(),
      emotionalTone: 'welcoming'
    };
    
    setMessages([welcomeMessage]);
  };

  // Load session
  const loadSession = (sessionId: number) => {
    setActiveSession(sessionId);
    // Messages will be loaded by the query
  };

  // Handle sending message
  const handleSendMessage = (actionType?: 'go_deeper' | 'new_direction' | 'customize_response') => {
    if (!currentMessage.trim()) return;
    
    sendMessageMutation.mutate({ message: currentMessage, actionType });
  };

  // Handle therapeutic actions
  const handleTherapeuticAction = (actionType: 'go_deeper' | 'new_direction' | 'customize_response') => {
    if (!currentMessage.trim()) return;
    
    sendMessageMutation.mutate({ message: currentMessage, actionType });
  };

  // Handle Go Deeper button - automatically generate deeper therapeutic response
  const handleGoDeeper = async (aiMessage: string) => {
    const deeperPrompt = `Based on my previous response: "${aiMessage}", please provide a much deeper, more insightful therapeutic exploration. Ask probing questions that help me uncover underlying patterns, beliefs, or emotions. Use techniques from depth psychology, CBT, or somatic therapy to guide me toward profound self-discovery.`;
    
    try {
      const response = await apiRequest('/api/deep-journaling/process', {
        method: 'POST',
        body: { userInput: deeperPrompt, actionType: 'go_deeper' }
      });

      if (response.response) {
        const newAiMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: response.response,
          timestamp: new Date(),
          emotionalTone: response.emotionalState?.primaryEmotion || 'insightful'
        };

        setMessages(prev => [...prev, newAiMessage]);
        queryClient.invalidateQueries({ queryKey: ["/api/deep-journaling/threads"] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate deeper response. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle New Direction button - automatically generate new questioning approach
  const handleNewDirection = async (aiMessage: string) => {
    const newDirectionPrompt = `Please completely shift the therapeutic direction. Instead of continuing with "${aiMessage}", explore a different angle of my concerns. Ask questions that reveal new perspectives, challenge my assumptions, or guide me toward unexplored aspects of my situation. Help me see my challenges from a fresh, innovative viewpoint.`;
    
    try {
      const response = await apiRequest('/api/deep-journaling/process', {
        method: 'POST',
        body: { userInput: newDirectionPrompt, actionType: 'new_direction' }
      });

      if (response.response) {
        const newAiMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: response.response,
          timestamp: new Date(),
          emotionalTone: response.emotionalState?.primaryEmotion || 'curious'
        };

        setMessages(prev => [...prev, newAiMessage]);
        queryClient.invalidateQueries({ queryKey: ["/api/deep-journaling/threads"] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate new direction. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load session messages when session changes
  useEffect(() => {
    if (sessionMessages?.exchanges) {
      const formattedMessages: Message[] = [];
      sessionMessages.exchanges.forEach((exchange: any) => {
        // Add user message
        formattedMessages.push({
          id: `user-${exchange.id}`,
          type: 'user',
          content: exchange.userInput,
          timestamp: new Date(exchange.createdAt)
        });
        
        // Add AI response
        if (exchange.aiResponse) {
          formattedMessages.push({
            id: `ai-${exchange.id}`,
            type: 'ai',
            content: exchange.aiResponse,
            timestamp: new Date(exchange.createdAt),
            emotionalTone: exchange.primaryEmotion || 'neutral'
          });
        }
      });
      setMessages(formattedMessages);
    }
  }, [sessionMessages]);

  // Voice recording state
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Voice recording functions
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
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  // Process voice recording
  const processVoiceRecording = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      // Send to transcription service
      const response = await fetch('/api/deep-journaling/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setCurrentMessage(result.text || '');
      } else {
        toast({
          title: "Transcription Failed",
          description: "Unable to transcribe audio. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Voice Processing Error",
        description: "Unable to process voice input. Please try typing instead.",
        variant: "destructive",
      });
    }
  };

  // Delete message function
  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

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

        {/* Sessions List */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Previous Conversations
            </h3>
            
            {sessionsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {sessions && Array.isArray(sessions) && sessions.map((session: any) => (
                  <Card 
                    key={session.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      activeSession === session.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => loadSession(session.id)}
                  >
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {session.title || 'Therapeutic Session'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {session.currentTopic || 'Deep therapeutic conversation'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          {session.currentEmotionalState && (
                            <Badge variant="secondary" className="text-xs px-1">
                              {session.currentEmotionalState}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Customization Panel */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Collapsible open={customizeOpen} onOpenChange={setCustomizeOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Customize Approach
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div>
                <Label className="text-xs">Therapeutic Mode</Label>
                <Select value={therapeuticMode} onValueChange={setTherapeuticMode}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empathetic">Empathetic & Supportive</SelectItem>
                    <SelectItem value="challenging">Thoughtfully Challenging</SelectItem>
                    <SelectItem value="analytical">Deeply Analytical</SelectItem>
                    <SelectItem value="solution-focused">Solution-Focused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Conversation Style</Label>
                <Select value={conversationStyle} onValueChange={setConversationStyle}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="socratic">Socratic Questioning</SelectItem>
                    <SelectItem value="cbt">Cognitive Behavioral</SelectItem>
                    <SelectItem value="humanistic">Humanistic Approach</SelectItem>
                    <SelectItem value="mindfulness">Mindfulness-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Focus Area</Label>
                <Select value={focusArea} onValueChange={setFocusArea}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Exploration</SelectItem>
                    <SelectItem value="anxiety">Anxiety & Stress</SelectItem>
                    <SelectItem value="relationships">Relationships</SelectItem>
                    <SelectItem value="self-worth">Self-Worth & Identity</SelectItem>
                    <SelectItem value="life-transitions">Life Transitions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                  <Heart className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Therapeutic Companion</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {therapeuticMode} • {conversationStyle} • {focusArea}
                </p>
              </div>
            </div>
            
            <Badge variant="outline" className="text-green-600 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              Active
            </Badge>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div key={message.id} className={`flex group ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className="mt-1">
                      <AvatarFallback className={
                        message.type === 'user' 
                          ? "bg-blue-500 text-white" 
                          : "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
                      }>
                        {message.type === 'user' ? 'Y' : <Brain className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-4 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                      
                      <div className={`flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {message.emotionalTone && (
                          <Badge variant="secondary" className="text-xs">
                            {message.emotionalTone}
                          </Badge>
                        )}
                        {message.type === 'ai' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMessage(message.id)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {/* Go Deeper button with submenu for AI messages */}
                      {message.type === 'ai' && (
                        <div className="mt-3 flex items-center gap-2">
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
                        </div>
                      )}

                      {/* Input field positioned directly below AI responses - Mindsera style */}
                      {message.type === 'ai' && messages.indexOf(message) === messages.length - 1 && (
                        <div className="mt-4">
                          <div className="relative">
                            <Textarea
                              value={currentMessage}
                              onChange={(e) => setCurrentMessage(e.target.value)}
                              onKeyDown={handleKeyPress}
                              placeholder="Can you customize your response to be more"
                              className="min-h-[80px] max-h-[200px] resize-none pr-20 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 bg-gray-50 dark:bg-gray-900 rounded-lg"
                              disabled={sendMessageMutation.isPending}
                            />
                            
                            {/* Voice and Send buttons inside textarea */}
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`h-8 w-8 p-0 ${isRecording ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                                disabled={sendMessageMutation.isPending}
                              >
                                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSendMessage()}
                                disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                                className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Voice recording indicator */}
                          {isRecording && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-red-500 animate-pulse">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Recording... Click the microphone to stop
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-3">
                            <Button variant="outline" size="sm" className="text-xs">
                              Refresh
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs text-gray-500">
                              Finish entry
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ))}

            {/* Initial input area when no messages */}
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="mb-6">
                  <Avatar className="w-16 h-16 mx-auto mb-4">
                    <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                      <Heart className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Hello! I'm here to listen and support you. Feel free to share whatever is on your mind - there's no judgment here, just genuine understanding. What would you like to explore together today?
                  </p>
                </div>
                
                <div className="max-w-2xl mx-auto">
                  <div className="relative">
                    <Textarea
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Write directly here... Press Enter to send, Shift+Enter for new line"
                      className="min-h-[120px] max-h-[200px] resize-none pr-20 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                      disabled={sendMessageMutation.isPending}
                    />
                    
                    {/* Voice and Send buttons inside textarea */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`h-8 w-8 p-0 ${isRecording ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                        disabled={sendMessageMutation.isPending}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSendMessage()}
                        disabled={!currentMessage.trim() || sendMessageMutation.isPending}
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
                </div>
              </div>
            )}
            
            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="max-w-2xl">
                  <div className="flex items-start gap-3">
                    <Avatar className="mt-1">
                      <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                        <Brain className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Reflecting on your message...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>


      </div>


    </div>
  );
}