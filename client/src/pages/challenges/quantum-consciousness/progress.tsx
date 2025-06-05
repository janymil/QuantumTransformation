import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Target, Award } from "lucide-react";
import { format } from "date-fns";

export default function QuantumConsciousnessProgress() {
  const { isAuthenticated } = useAuth();

  const { data: progressData, isLoading } = useQuery({
    queryKey: ["/api/progress/all"],
    enabled: isAuthenticated,
  });

  const { data: completions } = useQuery({
    queryKey: ["/api/challenges/completion"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Find the progress for quantum consciousness challenge
  const allProgress = (progressData as any)?.allProgress || [];
  const challengeProgress = allProgress.find((p: any) => p.challengeType === 'general_quantum');

  if (!challengeProgress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Quantum Consciousness Progress</h1>
          <p className="text-muted-foreground mb-6">You haven't started this challenge yet.</p>
          <a href="/challenges" className="text-primary hover:underline">Go to Challenges</a>
        </div>
      </div>
    );
  }

  const completedDays = (challengeProgress?.completedDays as number[]) || [];
  const currentDay = challengeProgress?.currentDay || 1;
  const streakCount = challengeProgress?.streakCount || 0;
  const progressPercent = (completedDays.length / 21) * 100;

  const challengeCompletions = (completions as any)?.filter((c: any) => 
    c.challengeType === 'general_quantum'
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Quantum Consciousness Progress
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your transformation through conscious awareness
            </p>
          </div>

          {/* Progress Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center p-6">
                <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{currentDay}</div>
                <div className="text-sm text-muted-foreground">Current Day</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center p-6">
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{completedDays.length}</div>
                <div className="text-sm text-muted-foreground">Days Completed</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center p-6">
                <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{streakCount}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center p-6">
                <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{Math.round(progressPercent)}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                21-Day Challenge Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={progressPercent} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{completedDays.length} of 21 days completed</span>
                  <span>{21 - completedDays.length} days remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Progress Grid */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Daily Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 21 }, (_, i) => {
                  const day = i + 1;
                  const isCompleted = completedDays.includes(day);
                  const isCurrent = day === currentDay;
                  const isAccessible = day <= currentDay;

                  return (
                    <div
                      key={day}
                      className={`
                        aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-medium
                        ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                        ${isCurrent && !isCompleted ? 'bg-purple-100 border-purple-500 text-purple-700' : ''}
                        ${!isAccessible ? 'bg-gray-100 border-gray-200 text-gray-400' : ''}
                        ${isAccessible && !isCompleted && !isCurrent ? 'bg-white border-gray-300 text-gray-600 hover:border-purple-300' : ''}
                      `}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Completions */}
          {challengeCompletions.length > 0 && (
            <Card className="mt-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Recent Completions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {challengeCompletions.slice(0, 5).map((completion: any) => (
                    <div key={completion.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-purple-100 text-purple-700">
                          Day {completion.day}
                        </Badge>
                        <span className="font-medium">Day {completion.day} Completed</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {completion.createdAt && !isNaN(new Date(completion.createdAt).getTime()) 
                          ? format(new Date(completion.createdAt), 'MMM dd, yyyy')
                          : 'Date unavailable'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}