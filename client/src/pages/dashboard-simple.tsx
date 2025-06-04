import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, BookOpen, Brain, Calendar, Target, Zap, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { challengeContent } from "@/data/challenge-content";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Show Day 1 content by default for new users
  const currentDay = 1;
  const currentContent = challengeContent[0]; // Day 1 content
  const completedDays: number[] = [];
  const streakCount = 0;
  const completionPercentage = 0;

  const stats = [
    {
      label: "Current Day",
      value: currentDay,
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "from-blue-500/10 to-indigo-500/10"
    },
    {
      label: "Days Completed",
      value: completedDays.length,
      suffix: "/30",
      icon: Target,
      color: "text-green-500", 
      bgColor: "from-green-500/10 to-emerald-500/10"
    },
    {
      label: "Current Streak",
      value: streakCount,
      suffix: "days",
      icon: Zap,
      color: "text-orange-500",
      bgColor: "from-orange-500/10 to-red-500/10"
    },
    {
      label: "Progress",
      value: completionPercentage,
      suffix: "%",
      icon: Brain,
      color: "text-purple-500",
      bgColor: "from-purple-500/10 to-pink-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Your Quantum Journey
          </h1>
          <p className="text-muted-foreground">
            Transform your reality through quantum consciousness principles
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                      {stat.suffix && <span className="text-lg text-muted-foreground"> {stat.suffix}</span>}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.bgColor} flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Today's Challenge */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-foreground">Today's Challenge</CardTitle>
                    <p className="text-sm text-muted-foreground">Day {currentDay} • {currentContent.duration}</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{currentContent.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{currentContent.subtitle}</p>
                  <p className="text-foreground leading-relaxed">{currentContent.description}</p>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-foreground mb-2">Today's Practice</h4>
                  <p className="text-sm text-muted-foreground mb-3">{currentContent.practice.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/challenge/${currentDay}`}>
                      <Button className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Start Practice
                      </Button>
                    </Link>
                    <Link href="/journal">
                      <Button variant="outline" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Journal
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantum Science Insight */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Quantum Science Insight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{currentContent.science}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/challenge/${currentDay}`}>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Begin Day {currentDay}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/journal">
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Open Journal
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/progress">
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      View Progress
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Challenge Timeline Preview */}
            <Card>
              <CardHeader>
                <CardTitle>30-Day Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {challengeContent.slice(0, 5).map((day) => (
                    <div key={day.day} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        day.day === currentDay 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {day.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{day.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{day.topic}</p>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground">...and 25 more days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Affirmation */}
            {currentContent.affirmation && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">Today's Affirmation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground italic leading-relaxed">"{currentContent.affirmation}"</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}