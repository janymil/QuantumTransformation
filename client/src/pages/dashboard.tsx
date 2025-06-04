import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/sidebar";
import ChallengeTimeline from "@/components/challenge-timeline";
import ProgressCircle from "@/components/progress-circle";
import AchievementBadge from "@/components/achievement-badge";
import { Play, BookOpen, Brain, Calendar, Target, Zap } from "lucide-react";
import { Link } from "wouter";
import { challengeContent } from "@/data/challenge-content";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: progressData, isLoading, error } = useQuery({
    queryKey: ["/api/progress"],
    retry: 1,
    enabled: true,
  });

  // Add detailed logging for debugging
  useEffect(() => {
    console.log("Dashboard - Progress Data:", progressData);
    console.log("Dashboard - Is Loading:", isLoading);
    console.log("Dashboard - Error:", error);
  }, [progressData, isLoading, error]);

  useEffect(() => {
    if (error) {
      console.error("Dashboard error:", error);
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      } else {
        // Show other errors to user
        toast({
          title: "Error loading data",
          description: `Failed to load progress: ${(error as Error).message}`,
          variant: "destructive",
        });
      }
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="loading-shimmer h-6 w-32 rounded mb-4"></div>
                  <div className="loading-shimmer h-24 w-24 rounded-full mx-auto mb-4"></div>
                  <div className="space-y-2">
                    <div className="loading-shimmer h-4 w-full rounded"></div>
                    <div className="loading-shimmer h-4 w-3/4 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-3 space-y-8">
              <div className="loading-shimmer h-48 rounded-xl"></div>
              <div className="loading-shimmer h-96 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Provide default data structure for new users
  const defaultProgress = {
    currentDay: 1,
    completedDays: [],
    streakCount: 0,
    lastActivityDate: null
  };

  // Always show dashboard content with meaningful defaults
  const progress = (progressData as any)?.progress || defaultProgress;
  const completions = (progressData as any)?.completions || [];
  const achievements = (progressData as any)?.achievements || [];
  
  const currentDay = (progress as any)?.currentDay || 1;
  const completedDays = ((progress as any)?.completedDays as number[]) || [];
  const streakCount = (progress as any)?.streakCount || 0;
  const currentContent = challengeContent.find(c => c.day === currentDay) || challengeContent[0];

  const completionPercentage = Math.round((completedDays.length / 30) * 100);

  const stats = [
    {
      label: "Current Day",
      value: currentDay,
      total: 30,
      icon: Calendar,
      color: "text-primary"
    },
    {
      label: "Completed",
      value: completedDays.length,
      total: 30,
      icon: Target,
      color: "text-success"
    },
    {
      label: "Streak",
      value: streakCount,
      suffix: "days",
      icon: Zap,
      color: "text-warning"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar 
              progress={progress}
              completedDays={completedDays}
              streakCount={streakCount}
              achievements={achievements}
              completionPercentage={completionPercentage}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Hero Section */}
            <Card className="bg-gradient-primary text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full transform translate-x-32 -translate-y-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full transform -translate-x-24 translate-y-24"></div>
              <CardContent className="relative z-10 p-8">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Day {currentDay} of 30
                  </Badge>
                  <div className="flex items-center space-x-2 text-white/90">
                    <span className="text-sm">⏱️ {currentContent?.duration || "15 mins"}</span>
                  </div>
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {currentContent?.title || `Day ${currentDay}: Quantum Journey Continues`}
                </h1>
                <p className="text-white/90 mb-6 text-lg">
                  {currentContent?.subtitle || "Continue your transformation with today's practice"}
                </p>
                <div className="flex items-center space-x-4">
                  <Link href={`/challenge/${currentDay}`}>
                    <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90">
                      <Play className="w-5 h-5 mr-2" />
                      Start Today's Challenge
                    </Button>
                  </Link>
                  <Link href="/journal">
                    <Button variant="ghost" size="lg" className="text-white border-white/30 hover:bg-white/10">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Open Journal
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
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
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                    {stat.total && (
                      <div className="mt-4">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(stat.value / stat.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Challenge Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-6 h-6 mr-2 text-primary" />
                  Challenge Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChallengeTimeline 
                  currentDay={currentDay}
                  completedDays={completedDays}
                  content={challengeContent}
                />
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            {achievements && achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {achievements.slice(0, 4).map((achievement) => (
                      <AchievementBadge 
                        key={achievement.id}
                        achievementId={achievement.achievementId}
                        unlockedAt={achievement.unlockedAt}
                      />
                    ))}
                  </div>
                  {achievements.length > 4 && (
                    <Link href="/progress">
                      <Button variant="outline" className="w-full mt-4">
                        View All Achievements
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <BookOpen className="w-8 h-8 text-primary mr-3" />
                    <div>
                      <h3 className="font-semibold text-foreground">Journal Insights</h3>
                      <p className="text-sm text-muted-foreground">Reflect on your journey</p>
                    </div>
                  </div>
                  <Link href="/journal">
                    <Button className="w-full">Open Journal</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Brain className="w-8 h-8 text-secondary mr-3" />
                    <div>
                      <h3 className="font-semibold text-foreground">AI Assistant</h3>
                      <p className="text-sm text-muted-foreground">Get personalized guidance</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Ask AI Guide
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
