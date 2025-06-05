import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  Trophy, 
  Zap, 
  TrendingUp,
  Flame,
  Target
} from "lucide-react";

interface PointsDisplayProps {
  challengeType: string;
  compact?: boolean;
}

export default function PointsDisplay({ challengeType, compact = false }: PointsDisplayProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/gamification/stats/${challengeType}`],
    refetchInterval: 5000
  });

  if (isLoading) {
    return (
      <Card className={compact ? "p-3" : ""}>
        <CardContent className={compact ? "p-0" : ""}>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats?.level) {
    return (
      <Card className={compact ? "p-3" : ""}>
        <CardContent className={compact ? "p-0" : ""}>
          <div className="text-center text-gray-500">
            <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start your journey to earn points!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const level = stats.level;
  const streak = stats.streak;
  const nextLevelProgress = stats.nextLevelProgress;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <span className="font-bold text-lg">{level.totalPoints}</span>
          <span className="text-sm text-gray-600">points</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Level {level.level}</span>
        </div>

        {streak && streak.currentStreak > 0 && (
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">{streak.currentStreak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Points */}
        <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
          <div className="text-3xl font-bold text-yellow-600">{level.totalPoints}</div>
          <div className="text-sm text-gray-600">Total Points Earned</div>
        </div>

        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Level {level.level}</span>
            </div>
            {nextLevelProgress && (
              <span className="text-sm text-gray-500">
                {nextLevelProgress.current}/{nextLevelProgress.current + nextLevelProgress.needed}
              </span>
            )}
          </div>
          
          {nextLevelProgress && (
            <div className="space-y-1">
              <Progress value={nextLevelProgress.percentage} className="h-2" />
              <div className="text-xs text-gray-500 text-center">
                {nextLevelProgress.needed} points to next level
              </div>
            </div>
          )}
        </div>

        {/* Streak */}
        {streak && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Daily Streak</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-orange-600">{streak.currentStreak} days</div>
              <div className="text-xs text-gray-500">
                Best: {streak.longestStreak} days
              </div>
            </div>
          </div>
        )}

        {/* Recent Achievements */}
        {stats.badges && stats.badges.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Recent Achievements</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {stats.badges.slice(0, 4).map((badge) => (
                <Badge key={badge.id} variant="outline" className="justify-center">
                  {badge.badgeName}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Level Multiplier */}
        {streak && streak.streakMultiplier > 1 && (
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">
                {streak.streakMultiplier}x Points Multiplier
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}