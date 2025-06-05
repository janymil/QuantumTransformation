import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Clock, 
  Zap, 
  Shield, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  BarChart3
} from "lucide-react";

interface CostControlledAIAssistantProps {
  challengeType: string;
  currentDay: number;
  userTier?: 'free' | 'premium' | 'unlimited';
}

interface AIUsageStats {
  dailyUsage: number;
  monthlyUsage: number;
  totalCost: number;
  cacheHitRate: number;
}

const TIER_LIMITS = {
  free: { dailyRequests: 5, monthlyRequests: 100, maxInputLength: 500 },
  premium: { dailyRequests: 50, monthlyRequests: 1000, maxInputLength: 2000 },
  unlimited: { dailyRequests: -1, monthlyRequests: -1, maxInputLength: 5000 }
};

const QUICK_PROMPTS = [
  "Explain today's practice in detail",
  "How does this connect to quantum physics?",
  "What should I focus on during meditation?",
  "Help me understand the science behind this",
  "Give me tips for better visualization"
];

export default function CostControlledAIAssistant({ 
  challengeType, 
  currentDay, 
  userTier = 'free' 
}: CostControlledAIAssistantProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("assistant");
  const [userInput, setUserInput] = useState("");
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'ai';
    content: string;
    fromCache?: boolean;
    timestamp: Date;
  }>>([]);

  // Get AI usage statistics
  const { data: aiStats } = useQuery<AIUsageStats>({
    queryKey: ["/api/ai/usage-stats"],
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // AI request mutation with cost control
  const aiRequestMutation = useMutation({
    mutationFn: async (requestData: {
      type: string;
      input: string;
      quickPrompt?: boolean;
    }) => {
      return apiRequest("POST", "/api/ai/explain", {
        topic: challengeType,
        day: currentDay,
        userQuestion: requestData.input,
        challengeType,
        userTier,
        context: { currentDay, challengeType }
      });
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/usage-stats"] });
      
      setConversation(prev => [
        ...prev,
        {
          type: 'user',
          content: variables.input,
          timestamp: new Date()
        },
        {
          type: 'ai',
          content: result.explanation || "I'm here to help with your quantum consciousness journey.",
          fromCache: result.fromCache,
          timestamp: new Date()
        }
      ]);

      if (result.fromCache) {
        toast({
          title: "Instant Response",
          description: "Answer retrieved from cache - no API cost!",
        });
      } else {
        toast({
          title: "AI Response Generated",
          description: `${result.remainingRequests || 0} requests remaining today`,
        });
      }

      setUserInput("");
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to get AI response";
      
      if (errorMessage.includes("limit reached") || errorMessage.includes("wait")) {
        toast({
          title: "Usage Limit Reached",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    aiRequestMutation.mutate({
      type: 'explanation',
      input: userInput.trim()
    });
  };

  const handleQuickPrompt = (prompt: string) => {
    aiRequestMutation.mutate({
      type: 'explanation',
      input: prompt,
      quickPrompt: true
    });
  };

  const tierLimits = TIER_LIMITS[userTier];
  const usagePercentage = aiStats ? (aiStats.dailyUsage / tierLimits.dailyRequests) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          AI Assistant
          <Badge variant={userTier === 'free' ? 'outline' : userTier === 'premium' ? 'default' : 'secondary'}>
            {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assistant">Chat</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assistant" className="space-y-4">
            {/* Usage Summary */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Daily Usage</span>
                <span className="text-sm text-gray-600">
                  {aiStats?.dailyUsage || 0}/{tierLimits.dailyRequests === -1 ? '∞' : tierLimits.dailyRequests}
                </span>
              </div>
              {tierLimits.dailyRequests !== -1 && (
                <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Quick Questions:</div>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_PROMPTS.slice(0, 3).map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt(prompt)}
                    disabled={aiRequestMutation.isPending}
                    className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
                  >
                    <MessageSquare className="h-3 w-3 mr-2 flex-shrink-0" />
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="space-y-3">
              <Textarea
                placeholder={`Ask about Day ${currentDay} practice... (${userInput.length}/${tierLimits.maxInputLength} chars)`}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.slice(0, tierLimits.maxInputLength))}
                className="min-h-[80px]"
                disabled={aiRequestMutation.isPending}
              />
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Questions about quantum consciousness, meditation, and your daily practice
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || aiRequestMutation.isPending}
                  size="sm"
                >
                  {aiRequestMutation.isPending ? "Thinking..." : "Ask AI"}
                </Button>
              </div>
            </div>

            {/* Upgrade Prompt for Free Users */}
            {userTier === 'free' && aiStats && aiStats.dailyUsage >= 3 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Almost at your daily limit</span>
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Upgrade to Premium for 50 daily requests and longer messages
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="usage" className="space-y-4">
            {/* Usage Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{aiStats?.dailyUsage || 0}</div>
                <div className="text-xs text-gray-600">Today's Requests</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{aiStats?.cacheHitRate || 0}%</div>
                <div className="text-xs text-gray-600">Cache Hit Rate</div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Smart Features Active</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Intelligent caching for common questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Challenge-specific content filtering</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Context optimization for relevant answers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-blue-500" />
                  <span>Rate limiting prevents overuse</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}