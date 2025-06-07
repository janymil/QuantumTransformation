import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Mic, 
  MicOff,
  Settings, 
  TrendingUp, 
  Brain, 
  Heart, 
  Target,
  ArrowRight,
  RotateCcw,
  Sparkles,
  History,
  BarChart3,
  PenTool,
  Volume2,
  Play,
  Pause,
  BookOpen,
  Lightbulb,
  Zap,
  Circle,
  Clock
} from "lucide-react";

interface DeepJournalingRequest {
  userId: string;
  threadId?: number;
  userInput: string;
  wasVoiceInput?: boolean;
  customizations?: {
    mode?: 'conversational' | 'therapeutic' | 'analytical';
    tone?: 'supportive' | 'challenging' | 'neutral' | 'empathetic';
    perspective?: 'psychologist' | 'life_coach' | 'cbt_therapist' | 'philosopher' | 'stoic';
    customInstructions?: string;
  };
  actionType?: 'go_deeper' | 'new_direction' | 'customize_response';
}

interface DeepJournalingResponse {
  threadId: number;
  exchangeId: number;
  analysis: {
    emotionalAssessment: any;
    patternInsights: any;
    professionalAnalysis: string;
  };
  question: string;
  suggestions?: string[];
  emotionalState: {
    primaryEmotion: string;
    intensity: number;
    clarity: number;
  };
  cost: number;
  remainingRequests?: number;
}

interface JournalingThread {
  id: number;
  title: string;
  currentEmotionalState: string;
  currentTopic: string;
  exchangeCount: number;
  lastActiveAt: string;
  preferredMode: string;
  preferredTone: string;
  preferredPerspective: string;
}

export default function DeepJournaling() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Core state
  const [userInput, setUserInput] = useState("");
  const [currentThread, setCurrentThread] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("write");
  
  // Customization state
  const [mode, setMode] = useState<'conversational' | 'therapeutic' | 'analytical'>('conversational');
  const [tone, setTone] = useState<'supportive' | 'challenging' | 'neutral' | 'empathetic'>('supportive');
  const [perspective, setPerspective] = useState<'psychologist' | 'life_coach' | 'cbt_therapist' | 'philosopher' | 'stoic'>('psychologist');
  const [customInstructions, setCustomInstructions] = useState("");
  
  // Voice recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Get user's journaling threads
  const { data: threads, isLoading: threadsLoading } = useQuery({
    queryKey: ["/api/deep-journaling/threads"],
    retry: false,
  });

  // Get current thread details
  const { data: currentThreadData } = useQuery({
    queryKey: ["/api/deep-journaling/threads", currentThread],
    enabled: !!currentThread,
    retry: false,
  });

  // Get emotional analytics
  const { data: emotionalAnalytics } = useQuery({
    queryKey: ["/api/deep-journaling/analytics/emotions", { days: 30 }],
    retry: false,
  });

  // Process journaling request mutation
  const journalingMutation = useMutation({
    mutationFn: async (request: DeepJournalingRequest) => {
      return await apiRequest('POST', '/api/deep-journaling/analyze', request);
    },
    onSuccess: (response: DeepJournalingResponse) => {
      setCurrentThread(response.threadId);
      setUserInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/deep-journaling/threads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deep-journaling/threads", response.threadId] });
      
      toast({
        title: "Analysis Complete",
        description: `Emotional state: ${response.emotionalState.primaryEmotion} (${response.emotionalState.intensity}/10)`,
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    },
  });

  // Handle journaling submission
  const handleSubmit = (actionType?: 'go_deeper' | 'new_direction' | 'customize_response') => {
    if (!userInput.trim()) return;

    const request: DeepJournalingRequest = {
      userId: user?.id || '',
      threadId: currentThread || undefined,
      userInput: userInput.trim(),
      customizations: {
        mode,
        tone,
        perspective,
        customInstructions: customInstructions || undefined,
      },
      actionType,
    };

    journalingMutation.mutate(request);
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access for voice journaling.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    // TODO: Implement voice transcription
    toast({
      title: "Voice Transcription",
      description: "Voice transcription feature coming soon!",
    });
  };

  // Start new thread
  const startNewThread = () => {
    setCurrentThread(null);
    setUserInput("");
  };

  // Get emotion color
  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      joy: 'text-yellow-500',
      calm: 'text-blue-500',
      anxious: 'text-red-500',
      sad: 'text-purple-500',
      excited: 'text-orange-500',
      angry: 'text-red-600',
      peaceful: 'text-green-500',
      confused: 'text-gray-500',
    };
    return colors[emotion.toLowerCase()] || 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Deep Journaling
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Therapeutic journaling with AI-powered insights and analysis
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="write" className="flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              Write
            </TabsTrigger>
            <TabsTrigger value="threads" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Threads
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Writing Interface */}
          <TabsContent value="write" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Writing Area */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      {currentThread ? `Thread #${currentThread}` : "New Journal Entry"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Dialog open={customizationOpen} onOpenChange={setCustomizationOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Customize
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Customize AI Response</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Mode</Label>
                              <Select value={mode} onValueChange={(value: any) => setMode(value)}>
                                <SelectTrigger>
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
                              <Label>Tone</Label>
                              <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                                <SelectTrigger>
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
                              <Label>Perspective</Label>
                              <Select value={perspective} onValueChange={(value: any) => setPerspective(value)}>
                                <SelectTrigger>
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
                            <div>
                              <Label>Custom Instructions</Label>
                              <Textarea
                                placeholder="Any specific guidance for the AI..."
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {currentThread && (
                        <Button variant="outline" size="sm" onClick={startNewThread}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          New Thread
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Textarea
                        placeholder="Write about what's on your mind... Be as honest and detailed as you'd like."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        rows={8}
                        className="w-full resize-none pr-12"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={isRecording ? stopRecording : startRecording}
                      >
                        {isRecording ? (
                          <MicOff className="w-4 h-4 text-red-500" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        onClick={() => handleSubmit()}
                        disabled={!userInput.trim() || journalingMutation.isPending}
                        className="flex-1 min-w-0"
                      >
                        {journalingMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Analyzing...
                          </div>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Analyze & Continue
                          </>
                        )}
                      </Button>
                      
                      {currentThread && (
                        <>
                          <Button 
                            variant="outline"
                            onClick={() => handleSubmit('go_deeper')}
                            disabled={!userInput.trim() || journalingMutation.isPending}
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Go Deeper
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={() => handleSubmit('new_direction')}
                            disabled={!userInput.trim() || journalingMutation.isPending}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            New Direction
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Current customization display */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{mode}</Badge>
                      <Badge variant="secondary">{tone}</Badge>
                      <Badge variant="secondary">{perspective}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Thread Conversation */}
                {currentThreadData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Conversation History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="space-y-4">
                          {currentThreadData.exchanges?.map((exchange: any, index: number) => (
                            <div key={index} className="space-y-3 border-b pb-4 last:border-b-0">
                              {/* User Entry */}
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You wrote:</p>
                                <p className="text-sm">{exchange.userInput}</p>
                              </div>
                              
                              {/* AI Response */}
                              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="w-4 h-4 text-purple-500" />
                                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                    AI Analysis
                                  </p>
                                  {exchange.emotionalState && (
                                    <Badge variant="outline" className={getEmotionColor(exchange.emotionalState.primaryEmotion)}>
                                      {exchange.emotionalState.primaryEmotion} ({exchange.emotionalState.intensity}/10)
                                    </Badge>
                                  )}
                                </div>
                                
                                {exchange.analysis?.professionalAnalysis && (
                                  <div className="mb-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Professional Analysis:</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {exchange.analysis.professionalAnalysis}
                                    </p>
                                  </div>
                                )}
                                
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Therapeutic Question:</p>
                                  <p className="text-sm font-medium">{exchange.question}</p>
                                </div>
                                
                                {exchange.suggestions && exchange.suggestions.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Suggestions:</p>
                                    <ul className="text-xs space-y-1">
                                      {exchange.suggestions.map((suggestion: string, i: number) => (
                                        <li key={i} className="flex items-start gap-1">
                                          <Circle className="w-2 h-2 mt-1 text-gray-400" />
                                          {suggestion}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Current Emotional State */}
                {currentThreadData?.thread && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Heart className="w-5 h-5 text-red-500" />
                        Current State
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Emotional State</p>
                        <p className="font-medium">{currentThreadData.thread.currentEmotionalState || 'Not detected'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Current Topic</p>
                        <p className="font-medium">{currentThreadData.thread.currentTopic || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Exchanges</p>
                        <p className="font-medium">{currentThreadData.exchanges?.length || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Threads */}
                {threads && threads.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <History className="w-5 h-5" />
                        Recent Threads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {threads.slice(0, 5).map((thread: JournalingThread) => (
                          <div 
                            key={thread.id}
                            className={`p-2 rounded cursor-pointer transition-colors ${
                              currentThread === thread.id 
                                ? 'bg-blue-100 dark:bg-blue-900/30' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                            onClick={() => setCurrentThread(thread.id)}
                          >
                            <p className="font-medium text-sm truncate">{thread.title}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {new Date(thread.lastActiveAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Insights */}
                {emotionalAnalytics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Quick Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Dominant Emotion</p>
                        <p className="font-medium">{emotionalAnalytics.dominantEmotion || 'Not enough data'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Emotional Stability</p>
                        <div className="flex items-center gap-2">
                          <Progress value={emotionalAnalytics.stabilityScore || 0} className="flex-1" />
                          <span className="text-sm">{emotionalAnalytics.stabilityScore || 0}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Growth Areas</p>
                        <div className="flex flex-wrap gap-1">
                          {emotionalAnalytics.growthAreas?.slice(0, 3).map((area: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Threads Tab */}
          <TabsContent value="threads">
            <Card>
              <CardHeader>
                <CardTitle>All Journaling Threads</CardTitle>
              </CardHeader>
              <CardContent>
                {threadsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : threads && threads.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {threads.map((thread: JournalingThread) => (
                      <Card key={thread.id} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => {
                              setCurrentThread(thread.id);
                              setActiveTab("write");
                            }}>
                        <CardContent className="p-4">
                          <h3 className="font-medium mb-2">{thread.title}</h3>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p>State: {thread.currentEmotionalState || 'Unknown'}</p>
                            <p>Exchanges: {thread.exchangeCount || 0}</p>
                            <p>Last: {new Date(thread.lastActiveAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-1 mt-2">
                            <Badge variant="outline">{thread.preferredMode}</Badge>
                            <Badge variant="outline">{thread.preferredTone}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No journaling threads yet</p>
                    <p className="text-sm text-gray-500">Start writing to create your first thread</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {emotionalAnalytics && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        Emotional Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Dominant Emotion</p>
                        <p className="text-xl font-bold">{emotionalAnalytics.dominantEmotion || 'Not detected'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Emotional Range</p>
                        <div className="flex flex-wrap gap-1">
                          {emotionalAnalytics.emotionBreakdown?.map((emotion: any, index: number) => (
                            <Badge key={index} variant="outline" className={getEmotionColor(emotion.emotion)}>
                              {emotion.emotion} ({emotion.percentage}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Growth Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Stability Score</p>
                        <div className="flex items-center gap-2">
                          <Progress value={emotionalAnalytics.stabilityScore || 0} className="flex-1" />
                          <span className="font-medium">{emotionalAnalytics.stabilityScore || 0}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Self-Awareness</p>
                        <div className="flex items-center gap-2">
                          <Progress value={emotionalAnalytics.selfAwarenessScore || 0} className="flex-1" />
                          <span className="font-medium">{emotionalAnalytics.selfAwarenessScore || 0}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" />
                        Focus Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {emotionalAnalytics.growthAreas?.map((area: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm">{area}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}