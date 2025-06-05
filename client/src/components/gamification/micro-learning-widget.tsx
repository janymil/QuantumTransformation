import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  Trophy, 
  Zap, 
  Target, 
  Clock, 
  CheckCircle2,
  Award,
  TrendingUp,
  Flame
} from "lucide-react";

interface GamificationStats {
  level: {
    level: number;
    totalPoints: number;
    currentLevelPoints: number;
    pointsToNextLevel: number;
  } | null;
  streak: {
    currentStreak: number;
    longestStreak: number;
    streakMultiplier: number;
  } | null;
  badges: Array<{
    id: number;
    badgeType: string;
    badgeName: string;
    description: string;
    iconUrl: string;
    earnedAt: string;
  }>;
  recentActivities: Array<{
    id: number;
    activityType: string;
    pointsEarned: number;
    completedAt: string;
  }>;
  nextLevelProgress: {
    current: number;
    needed: number;
    percentage: number;
  } | null;
}

interface MicroLearningWidgetProps {
  challengeType: string;
  day: number;
  onActivityComplete?: (points: number, levelUp?: boolean) => void;
}

export default function MicroLearningWidget({ challengeType, day, onActivityComplete }: MicroLearningWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showFullStats, setShowFullStats] = useState(false);

  // Fetch gamification stats
  const { data: stats, isLoading } = useQuery<GamificationStats>({
    queryKey: [`/api/gamification/stats/${challengeType}`],
    enabled: !!user && !!challengeType,
  });

  // Track activity mutation
  const trackActivityMutation = useMutation({
    mutationFn: async (activityData: {
      activityType: string;
      activityData?: any;
    }) => {
      return apiRequest("POST", "/api/gamification/track-activity", {
        challengeType,
        day,
        ...activityData
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [`/api/gamification/stats/${challengeType}`] });
      
      if (result.levelUp) {
        toast({
          title: "Level Up!",
          description: `Congratulations! You've reached level ${result.newLevel}!`,
        });
      }
      
      if (result.badgeEarned) {
        toast({
          title: "New Badge Earned!",
          description: `${result.badgeEarned.badgeName}: ${result.badgeEarned.description}`,
        });
      }

      if (result.pointsEarned > 0) {
        toast({
          title: `+${result.pointsEarned} Points!`,
          description: "Great work on your practice!",
        });
      }

      onActivityComplete?.(result.pointsEarned, result.levelUp);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to track activity",
        variant: "destructive",
      });
    },
  });

  const handlePracticeCompleted = (practiceType: string, timeSpent: number = 0) => {
    trackActivityMutation.mutate({
      activityType: `${practiceType}_practice`,
      activityData: {
        practiceType,
        timeSpent,
        completed: true
      }
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Compact Stats Bar */}
      <Card className="w-full bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Level */}
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-bold text-lg">Level {stats.level?.level || 1}</span>
              </div>

              {/* Points */}
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{stats.level?.totalPoints || 0} pts</span>
              </div>

              {/* Streak */}
              {stats.streak && stats.streak.currentStreak > 0 && (
                <div className="flex items-center space-x-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">{stats.streak.currentStreak} day streak</span>
                  {stats.streak.streakMultiplier > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {stats.streak.streakMultiplier}x bonus
                    </Badge>
                  )}
                </div>
              )}

              {/* Recent badges */}
              {stats.badges.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Trophy className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">{stats.badges.length}</span>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullStats(!showFullStats)}
            >
              {showFullStats ? "Hide" : "Details"}
            </Button>
          </div>

          {/* Progress bar */}
          {stats.nextLevelProgress && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Level {stats.level?.level}</span>
                <span>Level {(stats.level?.level || 1) + 1}</span>
              </div>
              <Progress 
                value={stats.nextLevelProgress.percentage} 
                className="h-2"
              />
              <div className="text-xs text-center mt-1 text-gray-500">
                {stats.nextLevelProgress.needed} points to next level
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded Stats */}
      {showFullStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Activities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex justify-between items-center text-sm">
                  <span className="capitalize">{activity.activityType.replace('_', ' ')}</span>
                  <Badge variant="outline" className="text-xs">
                    +{activity.pointsEarned} pts
                  </Badge>
                </div>
              ))}
              {stats.recentActivities.length === 0 && (
                <p className="text-sm text-gray-500">No activities yet. Start practicing!</p>
              )}
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {stats.badges.slice(0, 6).map((badge) => (
                  <div
                    key={badge.id}
                    className="text-center p-2 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200"
                    title={badge.description}
                  >
                    <div className="text-lg mb-1">{badge.iconUrl}</div>
                    <div className="text-xs font-medium truncate">{badge.badgeName}</div>
                  </div>
                ))}
                {stats.badges.length === 0 && (
                  <div className="col-span-3 text-center text-sm text-gray-500 py-4">
                    Complete activities to earn badges!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Action Buttons for Current Day */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Day {day} Practice Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePracticeCompleted('morning', 900)} // 15 minutes
              disabled={trackActivityMutation.isPending}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Morning (+25pts)
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePracticeCompleted('daytime', 0)}
              disabled={trackActivityMutation.isPending}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Daytime (+15pts)
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePracticeCompleted('evening', 600)} // 10 minutes
              disabled={trackActivityMutation.isPending}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Evening (+20pts)
            </Button>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-600 text-center">
              Complete your daily practices to earn points, maintain streaks, and unlock achievements!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for easy integration
export function useGamification(challengeType: string) {
  const trackActivityMutation = useMutation({
    mutationFn: async (activityData: {
      challengeType: string;
      day: number;
      activityType: string;
      activityData?: any;
    }) => {
      return apiRequest("POST", "/api/gamification/track-activity", activityData);
    },
  });

  const trackPractice = (day: number, practiceType: string, timeSpent: number = 0) => {
    trackActivityMutation.mutate({
      challengeType,
      day,
      activityType: `${practiceType}_practice`,
      activityData: { practiceType, timeSpent, completed: true }
    });
  };

  const trackJournal = (day: number, journalLength: number) => {
    trackActivityMutation.mutate({
      challengeType,
      day,
      activityType: 'journal_entry',
      activityData: { journalLength }
    });
  };

  const trackVideo = (day: number, videoId: string, timeSpent: number) => {
    trackActivityMutation.mutate({
      challengeType,
      day,
      activityType: 'video_watched',
      activityData: { videoId, timeSpent }
    });
  };

  const trackDayCompletion = (day: number) => {
    trackActivityMutation.mutate({
      challengeType,
      day,
      activityType: 'day_completed',
      activityData: { completed: true }
    });
  };

  return {
    trackPractice,
    trackJournal,
    trackVideo,
    trackDayCompletion,
    isTracking: trackActivityMutation.isPending
  };
}