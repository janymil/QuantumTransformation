import { useState } from "react";
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
  BookOpen
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
  const [activeTab, setActiveTab] = useState(initialTab);
  const [question, setQuestion] = useState(prefilledQuestion);
  const [goals, setGoals] = useState("");
  const [challenges, setChallenges] = useState("");
  const [mood, setMood] = useState(5);
  const [coachingResponse, setCoachingResponse] = useState<any>(null);
  const [explanationResponse, setExplanationResponse] = useState<any>(null);

  // Update question when prefilledQuestion changes
  React.useEffect(() => {
    if (prefilledQuestion) {
      setQuestion(prefilledQuestion);
    }
  }, [prefilledQuestion]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Get AI usage stats
  const { data: usageStats } = useQuery({
    queryKey: ["/api/ai/usage-stats"],
    retry: false,
  }) as { data?: { requestsToday: number; dailyLimit: number; requestsThisWeek: number; totalRequests: number } };

  // Personalized coaching mutation
  const coachingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ai/coaching", {
        currentDay,
        challengeType,
        userGoals: goals,
        currentChallenges: challenges.split(',').map(c => c.trim()).filter(Boolean),
        mood,
        userTier: 'basic'
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

  // AI explanation mutation
  const explanationMutation = useMutation({
    mutationFn: async (questionText: string) => {
      return apiRequest("POST", "/api/ai/explain", {
        topic: `Day ${currentDay} - ${challengeType}`,
        day: currentDay,
        userQuestion: questionText,
        context: challengeType
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
            {usageStats.requestsToday || 0}/{usageStats.dailyLimit || 10} requests today
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
                        Personal Message
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {(coachingMutation.data || coachingResponse)?.personalizedMessage || "No response available"}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        Today's Recommendation
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {(coachingMutation.data || coachingResponse)?.todaysRecommendation || "No recommendation available"}
                      </p>
                    </div>

                    {(coachingMutation.data || coachingResponse)?.practiceAdjustments && (
                      <div>
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Practice Adjustments
                        </h4>
                        <ul className="space-y-1">
                          {((coachingMutation.data || coachingResponse)?.practiceAdjustments || []).map((adjustment: string, index: number) => (
                            <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-start">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-2 mr-2"></span>
                              {adjustment}
                            </li>
                          ))}
                        </ul>
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
                      <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                        {(explanationMutation.data || explanationResponse)?.explanation || "No response available"}
                      </p>
                    </div>

                    {((explanationMutation.data || explanationResponse)?.practicalTips?.length > 0) && (
                      <div>
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Practical Tips
                        </h4>
                        <ul className="space-y-1">
                          {((explanationMutation.data || explanationResponse)?.practicalTips || []).map((tip: string, index: number) => (
                            <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-start">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-2 mr-2"></span>
                              {tip}
                            </li>
                          ))}
                        </ul>
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
                        <span className="font-medium">{usageStats.requestsToday || 0}/{usageStats.dailyLimit || 10}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">This week:</span>
                        <span className="font-medium">{usageStats.requestsThisWeek || 0}</span>
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