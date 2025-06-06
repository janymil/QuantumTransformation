import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Target, TrendingUp, Calendar, Sparkles, CheckCircle, Lightbulb, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AiDailyAssessment } from '@/components/ai/ai-daily-assessment';

export default function AiCouchNewDashboard() {
  const [activeTab, setActiveTab] = useState('today');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch today's AI-generated assessment
  const { data: dailyAssessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ['/api/ai-couch/daily-assessment'],
    retry: 1
  });

  // Fetch user's progress and streaks
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/ai-couch/progress'],
    retry: 1
  });

  // Complete assessment mutation
  const completeAssessment = useMutation({
    mutationFn: (data: { assessmentId: string; responses: any }) => 
      apiRequest(`/api/ai-couch/complete-assessment/${data.assessmentId}`, {
        method: 'POST',
        body: data.responses
      }),
    onSuccess: () => {
      toast({
        title: "Assessment Completed!",
        description: "Your progress has been saved and tomorrow's content will be adapted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-couch/daily-assessment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-couch/progress'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete assessment",
        variant: "destructive"
      });
    }
  });

  if (assessmentLoading || progressLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">AI Couch Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Loading your personalized AI coaching session...
            </p>
          </div>
        </div>
        <div className="grid gap-6">
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
          <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Couch Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Your AI agent has analyzed your progress and created today's personalized session
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Brain className="w-4 h-4 mr-1" />
            AI Adaptive Mode
          </Badge>
          {progressData?.currentStreak > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Target className="w-4 h-4 mr-1" />
              {progressData.currentStreak} Day Streak
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today's Focus</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          {dailyAssessment ? (
            <AiDailyAssessment 
              assessment={dailyAssessment} 
              onComplete={(responses) => {
                completeAssessment.mutate({
                  assessmentId: dailyAssessment.id,
                  responses
                });
              }}
              isSubmitting={completeAssessment.isPending}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  AI Analysis in Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <p className="text-muted-foreground">
                      Your AI coach is analyzing your journal entries, saved affirmations, and progress to create today's personalized session...
                    </p>
                  </div>
                  <Button 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/ai-couch/daily-assessment'] })}
                    variant="outline"
                  >
                    Refresh Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Transformation Journey</span>
                    <span>{progressData?.completionRate || 0}%</span>
                  </div>
                  <Progress value={progressData?.completionRate || 0} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{progressData?.totalDays || 0}</div>
                    <div className="text-sm text-muted-foreground">Days Active</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{progressData?.completedAssessments || 0}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {progressData?.currentStreak || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">consecutive days</div>
                  </div>
                  <div className="text-sm text-center text-muted-foreground">
                    Best streak: {progressData?.bestStreak || 0} days
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-7 gap-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-xs text-center text-muted-foreground">
                        {day}
                      </div>
                    ))}
                    {progressData?.weeklyProgress?.map((completed: boolean, i: number) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          completed 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {completed ? <CheckCircle className="w-3 h-3" /> : ''}
                      </div>
                    )) || Array.from({ length: 7 }, (_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-gray-100"></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  AI Insights
                </CardTitle>
                <CardDescription>
                  Patterns identified from your journal and progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {progressData?.recentInsights?.length > 0 ? (
                  <div className="space-y-3">
                    {progressData.recentInsights.map((insight: any, i: number) => (
                      <div key={i} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-900">{insight.title}</div>
                        <div className="text-sm text-blue-700 mt-1">{insight.description}</div>
                        <div className="text-xs text-blue-600 mt-2">{insight.date}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Complete a few daily assessments to see AI-generated insights about your progress patterns.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Growth Trends
                </CardTitle>
                <CardDescription>
                  Your transformation trajectory
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {progressData?.growthTrends ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-medium text-green-900">Consistency</div>
                      <div className="text-sm text-green-700 mt-1">
                        {progressData.growthTrends.consistency}% improvement this week
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="font-medium text-purple-900">Emotional Patterns</div>
                      <div className="text-sm text-purple-700 mt-1">
                        Mood trending {progressData.growthTrends.mood > 0 ? 'upward' : 'stable'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Growth trends will appear after completing several assessments.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}