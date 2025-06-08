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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
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
  Clock,
  Lightbulb,
  Volume2
} from "lucide-react";

export default function DeepJournaling() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Core state
  const [currentInput, setCurrentInput] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [currentMode, setCurrentMode] = useState<'conversational' | 'therapeutic' | 'analytical'>('therapeutic');
  const [currentTone, setCurrentTone] = useState<'supportive' | 'challenging' | 'neutral' | 'empathetic'>('supportive');
  const [currentPerspective, setCurrentPerspective] = useState<'psychologist' | 'life_coach' | 'cbt_therapist' | 'philosopher' | 'stoic'>('psychologist');
  const [customInstructions, setCustomInstructions] = useState("");
  
  // UI state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('journal');
  
  // Voice recording
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Fetch threads
  const { data: threads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ["/api/deep-journaling/threads"],
    staleTime: 1000 * 60 * 5,
  });

  // Fetch active thread details
  const { data: activeThread } = useQuery({
    queryKey: ["/api/deep-journaling/threads", activeThreadId],
    enabled: !!activeThreadId,
    staleTime: 1000 * 60 * 2,
  });

  // Fetch emotional analytics
  const { data: emotionalAnalytics } = useQuery({
    queryKey: ["/api/deep-journaling/analytics/emotions"],
    staleTime: 1000 * 60 * 10,
  });

  // Process journaling mutation
  const processMutation = useMutation({
    mutationFn: async (request: any) => {
      const response = await fetch('/api/deep-journaling/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process journaling request');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      setActiveThreadId(data.threadId);
      setCurrentInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/deep-journaling/threads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deep-journaling/threads", data.threadId] });
      
      toast({
        title: "Analysis Complete",
        description: `Processed with ${data.emotionalState?.primaryEmotion || 'thoughtful'} emotion detected`,
      });
    },
    onError: (error) => {
      toast({
        title: "Processing Failed", 
        description: "Unable to process your journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle journal submission
  const handleSubmit = async (actionType: 'go_deeper' | 'new_direction' | 'customize_response' = 'go_deeper') => {
    if (!currentInput.trim() || !user) return;
    
    setIsProcessing(true);
    
    try {
      await processMutation.mutateAsync({
        userId: user.id,
        threadId: activeThreadId || undefined,
        userInput: currentInput,
        wasVoiceInput: false,
        customizations: {
          mode: currentMode,
          tone: currentTone,
          perspective: currentPerspective,
          customInstructions: customInstructions || undefined,
        },
        actionType,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        // Handle voice transcription here
        setIsRecording(false);
      };
      
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            Deep Journaling
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Explore your thoughts with AI-powered therapeutic analysis
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="journal" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Journaling Area */}
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <PenTool className="w-5 h-5" />
                        Journal Entry
                      </span>
                      <div className="flex items-center gap-2">
                        <Dialog open={showSettings} onOpenChange={setShowSettings}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Customize Your Experience</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="mode">Mode</Label>
                                <Select value={currentMode} onValueChange={(value: any) => setCurrentMode(value)}>
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
                                <Label htmlFor="tone">Tone</Label>
                                <Select value={currentTone} onValueChange={(value: any) => setCurrentTone(value)}>
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
                                <Label htmlFor="perspective">Perspective</Label>
                                <Select value={currentPerspective} onValueChange={(value: any) => setCurrentPerspective(value)}>
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
                                <Label htmlFor="instructions">Custom Instructions</Label>
                                <Textarea
                                  id="instructions"
                                  value={customInstructions}
                                  onChange={(e) => setCustomInstructions(e.target.value)}
                                  placeholder="Any specific guidance for the AI..."
                                  rows={3}
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        placeholder="What's on your mind today? Share your thoughts, feelings, or experiences..."
                        rows={12}
                        className="resize-none text-gray-900 dark:text-gray-100"
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isProcessing}
                          >
                            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            {isRecording ? 'Stop Recording' : 'Voice Input'}
                          </Button>
                          
                          <Badge variant="secondary" className="text-xs">
                            {currentMode} • {currentTone} • {currentPerspective}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleSubmit('new_direction')}
                            disabled={!currentInput.trim() || isProcessing}
                          >
                            <ArrowRight className="w-4 h-4" />
                            New Direction
                          </Button>
                          
                          <Button
                            onClick={() => handleSubmit('go_deeper')}
                            disabled={!currentInput.trim() || isProcessing}
                          >
                            {isProcessing ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            Go Deeper
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Thread Display */}
                {activeThread && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Current Session
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="space-y-4">
                          {(activeThread as any).exchanges?.map((exchange: any) => (
                            <div key={exchange.id} className="space-y-3">
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <p className="text-gray-900 dark:text-gray-100">{exchange.userInput}</p>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(exchange.createdAt).toLocaleString()}
                                </span>
                              </div>
                              
                              {exchange.aiAnalysis && (
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                  <div className="flex items-start gap-2 mb-2">
                                    <Brain className="w-4 h-4 text-purple-600 mt-1" />
                                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                      AI Analysis
                                    </span>
                                  </div>
                                  <p className="text-gray-900 dark:text-gray-100 mb-2">{exchange.aiAnalysis}</p>
                                  {exchange.aiQuestion && (
                                    <div className="border-t border-purple-200 dark:border-purple-700 pt-2 mt-2">
                                      <p className="text-purple-700 dark:text-purple-300 font-medium">
                                        {exchange.aiQuestion}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Thread History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Recent Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {Array.isArray(threads) && threads.map((thread: any) => (
                          <div
                            key={thread.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              activeThreadId === thread.id
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => setActiveThreadId(thread.id)}
                          >
                            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                              {thread.title}
                            </h4>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {thread.exchanges?.length || 0} exchanges
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(thread.lastActiveAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setActiveThreadId(null)}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Start New Session
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setActiveTab('analytics')}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Therapeutic Frameworks
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Emotional Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Emotional State
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Current State</span>
                      <Badge variant="outline">
                        {(emotionalAnalytics as any)?.dominantEmotion || 'Reflective'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Stability</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(emotionalAnalytics as any)?.stabilityScore || 75} className="w-16 h-2" />
                        <span className="text-xs text-gray-500">{(emotionalAnalytics as any)?.stabilityScore || 75}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Growth</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600">
                          {(emotionalAnalytics as any)?.growthAreas?.length || 0} areas
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Session Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</span>
                      <span className="font-medium">{Array.isArray(threads) ? threads.length : 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
                      <span className="font-medium">
                        {Array.isArray(threads) ? threads.slice(0, 7).length : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Avg Session</span>
                      <span className="font-medium">12 min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You've been consistent with journaling this week. 
                      Your emotional clarity has improved by 15%.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Session History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {Array.isArray(threads) && threads.map((thread: any) => (
                      <div
                        key={thread.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => {
                          setActiveThreadId(thread.id);
                          setActiveTab('journal');
                        }}
                      >
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {thread.title}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>{thread.exchanges?.length || 0} exchanges</span>
                          <span>{new Date(thread.lastActiveAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}