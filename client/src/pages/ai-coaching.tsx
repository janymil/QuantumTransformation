import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AICoachingHub from "@/components/ai/ai-coaching-hub";
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
  Zap,
  BookOpen,
  Users,
  BarChart3
} from "lucide-react";

export default function AICoaching() {
  const { user } = useAuth();
  const [selectedChallenge, setSelectedChallenge] = useState("money_blocks_clearing");
  const [activeTab, setActiveTab] = useState("coaching");

  // Get user challenges
  const { data: userChallenges } = useQuery({
    queryKey: ["/api/challenges/user-challenges"],
    retry: false,
  });

  // Get AI usage stats
  const { data: usageStats } = useQuery({
    queryKey: ["/api/ai/usage-stats"],
    retry: false,
  });

  const challengeOptions = [
    { id: "money_blocks_clearing", title: "Money Blocks Clearing", icon: Target },
    { id: "general_quantum", title: "Quantum Consciousness", icon: Brain },
    { id: "relationships", title: "Relationships", icon: Heart },
    { id: "health_vitality", title: "Health & Vitality", icon: Sparkles },
    { id: "career_purpose", title: "Career & Purpose", icon: Star }
  ];

  const currentDay = userChallenges?.find((c: any) => c.challengeType === selectedChallenge)?.currentDay || 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">AI Personal Coach</h1>
                <p className="text-muted-foreground">
                  Get personalized guidance, insights, and support for your transformation journey
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Requests</p>
                      <p className="text-2xl font-bold text-foreground">
                        {(usageStats as any)?.requestsToday || 0}
                      </p>
                    </div>
                    <Zap className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Limit</p>
                      <p className="text-2xl font-bold text-foreground">
                        {(usageStats as any)?.dailyLimit || 10}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-2xl font-bold text-foreground">
                        {(usageStats as any)?.requestsThisWeek || 0}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sessions</p>
                      <p className="text-2xl font-bold text-foreground">
                        {(usageStats as any)?.totalRequests || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Challenge Selection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-6 h-6 mr-2 text-primary" />
                Select Your Active Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {challengeOptions.map((challenge) => {
                  const IconComponent = challenge.icon;
                  return (
                    <Button
                      key={challenge.id}
                      variant={selectedChallenge === challenge.id ? "default" : "outline"}
                      className="h-auto py-4 px-3 flex flex-col items-center space-y-2"
                      onClick={() => setSelectedChallenge(challenge.id)}
                    >
                      <IconComponent className="w-6 h-6" />
                      <span className="text-xs text-center leading-tight">
                        {challenge.title}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Main AI Coaching Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* AI Coaching Interface */}
            <div className="lg:col-span-2">
              <AICoachingHub 
                challengeType={selectedChallenge}
                currentDay={currentDay}
                initialTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>

            {/* Sidebar - Tips and Resources */}
            <div className="space-y-6">
              {/* AI Coaching Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                    Coaching Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      Be Specific
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      The more specific your questions and goals, the better personalized guidance you'll receive.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Daily Check-ins
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Regular coaching sessions help track progress and adjust your practice effectively.
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-700">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      Apply Insights
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Take action on the recommendations to see real transformation in your life.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("questions")}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask about today's practice
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("coaching")}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Set new goals
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("questions")}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Explain concepts
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("coaching")}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Overcome challenges
                  </Button>
                </CardContent>
              </Card>

              {/* Usage Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                    Usage Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Daily Requests</span>
                        <span>{(usageStats as any)?.requestsToday || 0}/{(usageStats as any)?.dailyLimit || 10}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, ((usageStats as any)?.requestsToday || 0) / ((usageStats as any)?.dailyLimit || 10) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        Free Tier: 10 requests/day
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}