import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bot, 
  Brain, 
  Heart, 
  Target, 
  Lightbulb, 
  MessageSquare,
  Sparkles,
  TrendingUp,
  Clock,
  Star,
  Send,
  Loader2,
  Zap,
  BookOpen,
  Settings,
  Edit3,
  Save,
  RotateCcw,
  Mic,
  MicOff,
  ArrowDown,
  Shuffle,
  Palette,
  User,
  Archive,
  Plus,
  Volume2,
  Play,
  Pause
} from "lucide-react";

interface AICoachingHubProps {
  challengeType: string;
  currentDay: number;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
  prefilledQuestion?: string;
  shouldFocusGoals?: boolean;
  shouldFocusChallenges?: boolean;
}

export default function AICoachingHub({ 
  challengeType, 
  currentDay, 
  initialTab = "coaching", 
  onTabChange,
  prefilledQuestion = "",
  shouldFocusGoals = false,
  shouldFocusChallenges = false
}: AICoachingHubProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [question, setQuestion] = useState(prefilledQuestion);
  const [goals, setGoals] = useState("");
  const [challenges, setChallenges] = useState("");
  const [mood, setMood] = useState(5);
  const [coachingResponse, setCoachingResponse] = useState<any>(null);
  const [explanationResponse, setExplanationResponse] = useState<any>(null);
  
  // Mindsera-like deep journaling features
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [freeFormInput, setFreeFormInput] = useState("");
  
  // Advanced customization settings
  const [customizations, setCustomizations] = useState({
    mode: "therapeutic" as "conversational" | "therapeutic" | "analytical",
    tone: "supportive" as "supportive" | "challenging" | "neutral" | "empathetic", 
    perspective: "psychologist" as "psychologist" | "life_coach" | "cbt_therapist" | "philosopher" | "stoic",
    customInstructions: ""
  });

  // Update question when prefilledQuestion changes
  useEffect(() => {
    if (prefilledQuestion) {
      setQuestion(prefilledQuestion);
    }
  }, [prefilledQuestion]);

  // Handle focus actions for quick action buttons
  useEffect(() => {
    if (shouldFocusGoals) {
      // Focus on goals textarea when quick action is triggered
      setTimeout(() => {
        const goalsTextarea = document.querySelector('textarea[placeholder*="working to achieve"]') as HTMLTextAreaElement;
        if (goalsTextarea) {
          goalsTextarea.focus();
        }
      }, 100);
    }
  }, [shouldFocusGoals]);

  useEffect(() => {
    if (shouldFocusChallenges) {
      // Focus on challenges input when quick action is triggered
      setTimeout(() => {
        const challengesInput = document.querySelector('input[placeholder*="obstacles are you facing"]') as HTMLInputElement;
        if (challengesInput) {
          challengesInput.focus();
        }
      }, 100);
    }
  }, [shouldFocusChallenges]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Helper function to format AI coaching responses for better readability
  const formatCoachingMessage = (message: string) => {
    if (!message) return "No guidance available";
    
    // Remove technical formatting markers and improve readability
    let formatted = message
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-purple-900 dark:text-purple-100">$1</strong>') // Bold text
      .replace(/### (.*?)(\n|$)/g, '<h4 class="font-semibold text-purple-800 dark:text-purple-200 mt-4 mb-2 text-base">$1</h4>$2') // Headers
      .replace(/#{2,3} (.*?)(\n|$)/g, '<h4 class="font-semibold text-purple-800 dark:text-purple-200 mt-4 mb-2 text-base">$1</h4>$2') // Headers
      .replace(/- \*\*(.*?)\*\*/g, '<div class="mt-3 mb-2"><strong class="text-purple-900 dark:text-purple-100">$1</strong></div>') // List items with bold
      .replace(/\*\*Practice:\*\*/g, '<div class="mt-3 mb-1"><strong class="text-green-700 dark:text-green-300">Practice:</strong></div>')
      .replace(/\*\*Technique:\*\*/g, '<div class="mt-3 mb-1"><strong class="text-blue-700 dark:text-blue-300">Technique:</strong></div>')
      .replace(/\*\*Exercise:\*\*/g, '<div class="mt-3 mb-1"><strong class="text-indigo-700 dark:text-indigo-300">Exercise:</strong></div>')
      .replace(/\*\*Intention:\*\*/g, '<div class="mt-3 mb-1"><strong class="text-orange-700 dark:text-orange-300">Intention:</strong></div>')
      .replace(/\*\*Awareness:\*\*/g, '<div class="mt-3 mb-1"><strong class="text-teal-700 dark:text-teal-300">Awareness:</strong></div>')
      .replace(/\n\n/g, '</p><p class="mt-3">') // Paragraph breaks
      .replace(/\n/g, '<br/>'); // Line breaks
    
    // Wrap in paragraph tags
    formatted = '<p class="leading-relaxed">' + formatted + '</p>';
    
    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  // Get AI usage stats
  const { data: usageStats } = useQuery({
    queryKey: ["/api/ai/usage-stats"],
    retry: false,
  }) as { data?: { dailyUsage: string; monthlyUsage: string; totalRequests: string } };



  // Advanced deep journaling mutation with cost optimization
  const coachingMutation = useMutation({
    mutationFn: async () => {
      const userInput = `Current Goals: ${goals}\nChallenges: ${challenges}\nEnergy Level: ${mood}/10\nChallenge Type: ${challengeType}\nDay: ${currentDay}`;
      
      return apiRequest("POST", "/api/deep-journaling/process", {
        userInput,
        actionType: "initial_exploration",
        customizations: {
          mode: "therapeutic",
          tone: "supportive",
          perspective: "life_coach"
        }
      });
    },
    onSuccess: (data) => {
      setCoachingResponse(data);
      queryClient.invalidateQueries({ queryKey: ["/api/ai/usage-stats"] });
      toast({
        title: "Coaching Generated",
        description: "Your personalized guidance is ready!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate coaching",
        variant: "destructive",
      });
    },
  });

  // Advanced deep journaling question mutation
  const explanationMutation = useMutation({
    mutationFn: async (questionText: string) => {
      return apiRequest("POST", "/api/deep-journaling/process", {
        userInput: questionText,
        actionType: "initial_exploration",
        customizations: {
          mode: "conversational",
          tone: "supportive",
          perspective: "life_coach"
        }
      });
    },
    onSuccess: (data) => {
      setExplanationResponse(data);
      setQuestion("");
      queryClient.invalidateQueries({ queryKey: ["/api/ai/usage-stats"] });
      toast({
        title: "Answer Generated",
        description: "Your question has been answered!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI explanation",
        variant: "destructive",
      });
    },
  });

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    explanationMutation.mutate(question);
  };

  const quickQuestions = [
    "How can I deepen my practice today?",
    "What's the science behind today's exercises?",
    "Help me overcome resistance to change",
    "Explain quantum consciousness simply",
    "Tips for maintaining focus during meditation"
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
            <Brain className="w-5 h-5 text-white" />
          </div>
          AI Personal Coach
          <Badge variant="secondary" className="ml-2">
            Day {currentDay}
          </Badge>
        </CardTitle>
        {usageStats && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Zap className="w-4 h-4 mr-1" />
            {usageStats?.dailyUsage || 0}/10 requests today
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="coaching" className="text-xs">
              <Heart className="w-4 h-4 mr-1" />
              Coaching
            </TabsTrigger>
            <TabsTrigger value="questions" className="text-xs">
              <MessageSquare className="w-4 h-4 mr-1" />
              Ask AI
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">
              <Lightbulb className="w-4 h-4 mr-1" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coaching" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Goals
                </label>
                <Textarea
                  placeholder="What are you working to achieve?"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="h-20 text-sm"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Challenges
                </label>
                <Input
                  placeholder="What obstacles are you facing? (comma-separated)"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Energy Level: {mood}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <Button 
                onClick={() => coachingMutation.mutate()}
                disabled={coachingMutation.isPending}
                className="w-full"
              >
                {coachingMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Coaching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Personalized Coaching
                  </>
                )}
              </Button>
            </div>

            {(coachingMutation.data || coachingResponse) && (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-700">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center">
                        <Heart className="w-4 h-4 mr-2" />
                        AI Coach Response
                      </h4>
                      <div className="text-sm text-purple-700 dark:text-purple-300 prose prose-sm max-w-none">
                        {formatCoachingMessage((coachingMutation.data || coachingResponse)?.question || (coachingMutation.data || coachingResponse)?.analysis?.professionalAnalysis)}
                      </div>
                    </div>

                    {(coachingMutation.data || coachingResponse)?.suggestions && (
                      <div>
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Suggestions
                        </h4>
                        <ul className="space-y-1">
                          {((coachingMutation.data || coachingResponse)?.suggestions || []).map((suggestion: string, index: number) => (
                            <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-start">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-2 mr-2"></span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(coachingMutation.data || coachingResponse)?.emotionalState && (
                      <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                          <Brain className="w-4 h-4 mr-2" />
                          Emotional Insight
                        </h4>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          Primary emotion: {(coachingMutation.data || coachingResponse)?.emotionalState?.primaryEmotion} 
                          (Intensity: {(coachingMutation.data || coachingResponse)?.emotionalState?.intensity}/10)
                        </div>
                      </div>
                    )}

                    {(coachingMutation.data || coachingResponse)?.cost !== undefined && (
                      <div className="pt-2 border-t border-purple-200 dark:border-purple-700">
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                          Session cost: ${(coachingMutation.data || coachingResponse)?.cost?.toFixed(4)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask me anything about your practice..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                  disabled={explanationMutation.isPending}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAskQuestion}
                  disabled={explanationMutation.isPending || !question.trim()}
                  size="sm"
                >
                  {explanationMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick questions:</p>
                <div className="space-y-1">
                  {quickQuestions.map((q, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2 px-3 text-xs"
                      onClick={() => explanationMutation.mutate(q)}
                      disabled={explanationMutation.isPending}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {(explanationMutation.data || explanationResponse) && (
              <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 border-blue-200 dark:border-blue-700">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-2" />
                        AI Response
                      </h4>
                      <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed prose prose-sm max-w-none">
                        {formatCoachingMessage((explanationMutation.data || explanationResponse)?.question || (explanationMutation.data || explanationResponse)?.analysis?.professionalAnalysis || "No response available")}
                      </div>
                    </div>

                    {(explanationMutation.data || explanationResponse)?.suggestions && (
                      <div>
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Practical Tips
                        </h4>
                        <ul className="space-y-1">
                          {((explanationMutation.data || explanationResponse)?.suggestions || []).map((suggestion: string, index: number) => (
                            <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-start">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-2 mr-2"></span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(explanationMutation.data || explanationResponse)?.emotionalState && (
                      <div>
                        <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center">
                          <Heart className="w-4 h-4 mr-2" />
                          Emotional Insight
                        </h4>
                        <div className="text-sm text-purple-700 dark:text-purple-300">
                          Primary emotion: {(explanationMutation.data || explanationResponse)?.emotionalState?.primaryEmotion} 
                          (Intensity: {(explanationMutation.data || explanationResponse)?.emotionalState?.intensity}/10)
                        </div>
                      </div>
                    )}

                    {(explanationMutation.data || explanationResponse)?.cost !== undefined && (
                      <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Session cost: ${(explanationMutation.data || explanationResponse)?.cost?.toFixed(4)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-700">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                        Daily AI Insight
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Your quantum field is constantly responding to your thoughts and emotions. 
                        Today's practice helps you become more conscious of this creative process.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {usageStats && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Your AI Usage
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Today's requests:</span>
                        <span className="font-medium">{usageStats.dailyUsage || 0}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">This week:</span>
                        <span className="font-medium">{usageStats.monthlyUsage || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total questions:</span>
                        <span className="font-medium">{usageStats.totalRequests || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}