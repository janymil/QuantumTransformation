import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, Target, Award, Heart } from "lucide-react";

export default function RelationshipsProgress() {
  const { isAuthenticated } = useAuth();

  const { data: progressData, isLoading } = useQuery({
    queryKey: ["/api/progress/all"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading your relationship progress...</p>
        </div>
      </div>
    );
  }

  const allProgress = (progressData as any)?.allProgress || [];
  const challengeProgress = allProgress.find((p: any) => p.challengeType === 'relationships');
  
  if (!challengeProgress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Relationships Progress</h1>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-red-600 rounded-full mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
              Relationships Progress
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your connection transformation journey
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center p-6">
                <Target className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-pink-600">{currentDay}</div>
                <div className="text-sm text-muted-foreground">Current Day</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center p-6">
                <Calendar className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{completedDays.length}</div>
                <div className="text-sm text-muted-foreground">Days Completed</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center p-6">
                <Award className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-pink-600">{streakCount}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center p-6">
                <TrendingUp className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{Math.round(progressPercent)}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-pink-600" />
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

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-pink-600" />
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
                        ${isCompleted ? 'bg-pink-500 border-pink-500 text-white' : ''}
                        ${isCurrent && !isCompleted ? 'bg-pink-100 border-pink-500 text-pink-700' : ''}
                        ${!isAccessible ? 'bg-gray-100 border-gray-200 text-gray-400' : ''}
                        ${isAccessible && !isCompleted && !isCurrent ? 'bg-white border-gray-300 text-gray-600 hover:border-pink-300' : ''}
                      `}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}