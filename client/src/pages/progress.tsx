import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress as ProgressBar } from "@/components/ui/progress";
import ProgressCircle from "@/components/progress-circle";
import AchievementBadge from "@/components/achievement-badge";
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Zap, 
  Star, 
  Trophy,
  BarChart3,
  Clock,
  Brain,
  CheckCircle,
  Award,
  Flame
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

interface ProgressStats {
  totalDays: number;
  completedDays: number;
  currentStreak: number;
  longestStreak: number;
  averageRating: number;
  totalTimeSpent: number;
  weeklyProgress: number[];
}

const achievementDefinitions = {
  "first_step": {
    name: "First Step",
    description: "Completed your first quantum challenge",
    icon: "🌟",
    color: "from-blue-500 to-purple-500"
  },
  "week_warrior": {
    name: "Week Warrior",
    description: "Completed 7 days of challenges",
    icon: "⚡",
    color: "from-purple-500 to-pink-500"
  },
  "halfway_hero": {
    name: "Halfway Hero",
    description: "Reached the halfway point (15 days)",
    icon: "🚀",
    color: "from-pink-500 to-red-500"
  },
  "quantum_master": {
    name: "Quantum Master",
    description: "Completed the full 30-day challenge",
    icon: "👑",
    color: "from-yellow-500 to-orange-500"
  },
  "streak_3": {
    name: "3-Day Streak",
    description: "Maintained a 3-day practice streak",
    icon: "🔥",
    color: "from-orange-500 to-red-500"
  },
  "streak_7": {
    name: "7-Day Streak",
    description: "Maintained a 7-day practice streak",
    icon: "💫",
    color: "from-red-500 to-purple-500"
  },
  "streak_21": {
    name: "Habit Master",
    description: "Maintained a 21-day practice streak",
    icon: "💎",
    color: "from-indigo-500 to-blue-500"
  }
};

export default function Progress() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

  const { data: progressData, isLoading } = useQuery({
    queryKey: ["/api/progress"],
    retry: false,
    enabled: isAuthenticated && !!user,
  });

  const { data: completions } = useQuery({
    queryKey: ["/api/challenges/completions"],
    queryFn: async () => {
      const response = await fetch("/api/challenges/completions", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch completions");
      return response.json();
    },
    enabled: isAuthenticated && !!user,
  });

  useEffect(() => {
    if (!isLoading && !progressData) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [progressData, isLoading, toast]);

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="loading-shimmer h-12 w-64 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="loading-shimmer h-32 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="loading-shimmer h-96 rounded-xl"></div>
              <div className="loading-shimmer h-96 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return null;
  }

  const { progress, achievements } = progressData;
  const completedDays = (progress?.completedDays as number[]) || [];
  const streakCount = progress?.streakCount || 0;
  const currentDay = progress?.currentDay || 1;

  // Calculate statistics
  const stats: ProgressStats = {
    totalDays: 30,
    completedDays: completedDays.length,
    currentStreak: streakCount,
    longestStreak: streakCount, // Could be calculated from completion history
    averageRating: completions?.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) / (completions?.length || 1) || 0,
    totalTimeSpent: completions?.reduce((sum: number, c: any) => sum + (c.timeSpent || 0), 0) || 0,
    weeklyProgress: [65, 75, 80, 85] // Mock weekly progress data
  };

  const completionPercentage = Math.round((stats.completedDays / stats.totalDays) * 100);

  const statCards = [
    {
      label: "Days Completed",
      value: stats.completedDays,
      total: stats.totalDays,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "from-green-500/10 to-emerald-500/10"
    },
    {
      label: "Current Streak",
      value: stats.currentStreak,
      suffix: "days",
      icon: Flame,
      color: "text-orange-500",
      bgColor: "from-orange-500/10 to-red-500/10"
    },
    {
      label: "Time Invested",
      value: Math.round(stats.totalTimeSpent / 60),
      suffix: "hrs",
      icon: Clock,
      color: "text-blue-500",
      bgColor: "from-blue-500/10 to-indigo-500/10"
    },
    {
      label: "Achievements",
      value: achievements?.length || 0,
      icon: Trophy,
      color: "text-purple-500",
      bgColor: "from-purple-500/10 to-pink-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Progress Analytics</h1>
              <p className="text-muted-foreground">Track your quantum transformation journey</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant={timeRange === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("week")}
            >
              Week
            </Button>
            <Button 
              variant={timeRange === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("month")}
            >
              Month
            </Button>
            <Button 
              variant={timeRange === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("all")}
            >
              All Time
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                      {stat.total && <span className="text-lg text-muted-foreground">/{stat.total}</span>}
                      {stat.suffix && <span className="text-lg text-muted-foreground"> {stat.suffix}</span>}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.bgColor} flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                {stat.total && (
                  <div className="mt-4">
                    <ProgressBar 
                      value={(stat.value / stat.total) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Progress Circle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-6 h-6 mr-2 text-primary" />
                    Challenge Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <ProgressCircle 
                    percentage={completionPercentage}
                    size={200}
                    strokeWidth={12}
                  />
                  <div className="text-center mt-6">
                    <p className="text-2xl font-bold text-foreground mb-2">
                      {completionPercentage}% Complete
                    </p>
                    <p className="text-muted-foreground">
                      {stats.completedDays} of {stats.totalDays} days completed
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completions?.slice(0, 5).map((completion: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">{completion.day}</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Day {completion.day} Complete</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(completion.completedAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {completion.rating && (
                            <div className="flex items-center">
                              {[...Array(completion.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-warning fill-current" />
                              ))}
                            </div>
                          )}
                          {completion.timeSpent && (
                            <Badge variant="outline" className="text-xs">
                              {completion.timeSpent}m
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!completions || completions.length === 0) && (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No activity yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-primary" />
                  Weekly Progress Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {stats.weeklyProgress.map((progress, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-primary rounded-t-lg transition-all duration-500 hover:opacity-80"
                        style={{ height: `${progress}%` }}
                      ></div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Week {index + 1}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {progress}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(achievementDefinitions).map(([id, achievement]) => {
                const isUnlocked = achievements?.some((a: any) => a.achievementId === id);
                const unlockedAchievement = achievements?.find((a: any) => a.achievementId === id);
                
                return (
                  <Card key={id} className={`hover:shadow-lg transition-all duration-300 ${
                    isUnlocked ? 'border-primary/50' : 'opacity-60'
                  }`}>
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${achievement.color} flex items-center justify-center mx-auto mb-4 ${
                        !isUnlocked && 'grayscale'
                      }`}>
                        <span className="text-2xl">{achievement.icon}</span>
                      </div>
                      <h3 className="font-bold text-foreground mb-2">{achievement.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>
                      {isUnlocked ? (
                        <div className="space-y-2">
                          <Badge variant="default" className="bg-success">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Unlocked
                          </Badge>
                          {unlockedAchievement && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(unlockedAchievement.unlockedAt), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">
                          Locked
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-semibold text-foreground">{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Average Session Time</span>
                      <span className="font-semibold text-foreground">
                        {Math.round((stats.totalTimeSpent / (completions?.length || 1)) || 0)} min
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Average Rating</span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${
                              i < Math.round(stats.averageRating) 
                                ? 'text-warning fill-current' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                        ))}
                        <span className="ml-2 font-semibold text-foreground">
                          {stats.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Longest Streak</span>
                      <span className="font-semibold text-foreground">{stats.longestStreak} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Goals & Targets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-6 h-6 mr-2 text-primary" />
                    Goals & Targets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground">Complete 30-Day Challenge</span>
                        <span className="font-semibold text-foreground">{stats.completedDays}/30</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground">Maintain 21-Day Streak</span>
                        <span className="font-semibold text-foreground">{Math.min(stats.currentStreak, 21)}/21</span>
                      </div>
                      <Progress value={(Math.min(stats.currentStreak, 21) / 21) * 100} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground">Total Practice Time (10hrs)</span>
                        <span className="font-semibold text-foreground">{Math.round(stats.totalTimeSpent / 60)}/10</span>
                      </div>
                      <Progress value={(Math.min(stats.totalTimeSpent / 60, 10) / 10) * 100} className="h-2" />
                    </div>

                    <div className="bg-primary/5 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Next Milestone</h4>
                      <p className="text-sm text-muted-foreground">
                        {stats.completedDays < 15 
                          ? `Complete ${15 - stats.completedDays} more days to reach Halfway Hero`
                          : stats.completedDays < 30
                          ? `Complete ${30 - stats.completedDays} more days to become a Quantum Master`
                          : "Congratulations! You've completed all milestones!"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6">
            <div className="space-y-6">
              {[
                { day: 1, title: "First Step", description: "Begin your quantum journey", completed: stats.completedDays >= 1 },
                { day: 7, title: "Week Warrior", description: "Complete your first week", completed: stats.completedDays >= 7 },
                { day: 15, title: "Halfway Hero", description: "Reach the halfway point", completed: stats.completedDays >= 15 },
                { day: 21, title: "Habit Former", description: "Form a lasting habit", completed: stats.completedDays >= 21 },
                { day: 30, title: "Quantum Master", description: "Complete the full transformation", completed: stats.completedDays >= 30 }
              ].map((milestone, index) => (
                <Card key={index} className={`hover:shadow-lg transition-all duration-300 ${
                  milestone.completed ? 'border-success/50 bg-success/5' : 'border-border'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        milestone.completed 
                          ? 'bg-gradient-to-r from-success to-green-400' 
                          : 'bg-muted'
                      }`}>
                        {milestone.completed ? (
                          <CheckCircle className="w-8 h-8 text-white" />
                        ) : (
                          <span className="text-2xl font-bold text-muted-foreground">{milestone.day}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-2">{milestone.title}</h3>
                        <p className="text-muted-foreground mb-2">{milestone.description}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant={milestone.completed ? "default" : "outline"} className={
                            milestone.completed ? "bg-success" : ""
                          }>
                            {milestone.completed ? "Completed" : `Day ${milestone.day}`}
                          </Badge>
                          {milestone.completed && (
                            <span className="text-sm text-success">🎉</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
