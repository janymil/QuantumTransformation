import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Calendar, 
  Target, 
  Flame,
  Trophy,
  Clock,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowLeft
} from "lucide-react";
import { CHALLENGE_TYPES } from "@shared/challenge-types";
import { Link } from "wouter";

interface IndividualChallengeDashboardProps {
  challengeType: string;
}

export default function IndividualChallengeDashboard({ challengeType }: IndividualChallengeDashboardProps) {
  const [selectedWeek, setSelectedWeek] = useState(1);

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress", challengeType],
  });

  const { data: completionsData, isLoading: completionsLoading } = useQuery({
    queryKey: ["/api/challenges/completions", challengeType],
  });

  if (progressLoading || completionsLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const progress = progressData?.progress;
  const completions = completionsData || [];
  const challengeInfo = CHALLENGE_TYPES[challengeType];

  if (!progress || !challengeInfo) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <p className="text-gray-500">Challenge not found or no progress available.</p>
      </div>
    );
  }

  const currentDay = progress.currentDay || 1;
  const completedDays = progress.completedDays || [];
  const streakCount = progress.streakCount || 0;
  const progressPercentage = (completedDays.length / 30) * 100;

  // Calculate weekly progress
  const weeks = Array.from({ length: 5 }, (_, weekIndex) => {
    const weekNumber = weekIndex + 1;
    const weekDays = Array.from({ length: 6 }, (_, dayIndex) => {
      const dayNumber = weekIndex * 6 + dayIndex + 1;
      if (dayNumber > 30) return null;
      
      const isCompleted = completedDays.includes(dayNumber);
      const isCurrent = dayNumber === currentDay;
      const isUpcoming = dayNumber > currentDay;
      
      return {
        day: dayNumber,
        isCompleted,
        isCurrent,
        isUpcoming,
        completion: completions.find((c: any) => c.day === dayNumber)
      };
    }).filter(Boolean);
    
    return {
      week: weekNumber,
      days: weekDays,
      completedCount: weekDays.filter(d => d?.isCompleted).length
    };
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Hero Header */}
      <Card className="relative overflow-hidden border-0">
        <div className={`bg-gradient-to-br ${challengeInfo.gradient} text-white relative`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
            {/* Floating particles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
                style={{
                  left: `${10 + (i * 12)}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-black/20"></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Day {currentDay} of 30
                </Badge>
                <div className="flex items-center space-x-2 text-white/90">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{challengeInfo.duration}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center mb-4">
              <div className="text-5xl mr-4">{challengeInfo.icon}</div>
              <div>
                <div className="flex items-center space-x-2 text-white/90 mb-2">
                  <Badge className="bg-white/20 text-white">{challengeInfo.difficulty}</Badge>
                  <span className="text-sm">• {challengeInfo.duration}</span>
                </div>
                <h1 className="text-4xl font-bold mb-2">{challengeInfo.title}</h1>
                <p className="text-white/90 text-xl leading-relaxed">{challengeInfo.subtitle}</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="bg-white/20 rounded-full h-3 mb-4">
              <div 
                className="bg-white rounded-full h-3 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-white/90 text-sm">
              <span>{completedDays.length} days completed</span>
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>
            
            <div className="flex items-center space-x-4 mt-6">
              <Link href={`/challenge-day?type=${challengeType}&day=${currentDay}`}>
                <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90">
                  <Play className="w-5 h-5 mr-2" />
                  Continue Day {currentDay}
                </Button>
              </Link>
              <Link href={`/journal?challenge=${challengeType}`}>
                <Button variant="ghost" size="lg" className="text-white border-white/30 hover:bg-white/10">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Open Journal
                </Button>
              </Link>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Target className="w-4 h-4 mr-2" />
              Overall Progress
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span className="font-medium">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Flame className="w-4 h-4 mr-2" />
              Current Streak
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {streakCount} days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Trophy className="w-4 h-4 mr-2" />
              Completed Days
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {completedDays.length}/30
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Link href={`/challenge-day?type=${challengeType}&day=${currentDay}`}>
              <Button className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Continue Day {currentDay}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            30-Day Challenge Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Week Navigation */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {weeks.map((week) => (
                <Button
                  key={week.week}
                  variant={selectedWeek === week.week ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWeek(week.week)}
                  className="whitespace-nowrap"
                >
                  Week {week.week}
                  <Badge variant="secondary" className="ml-2">
                    {week.completedCount}/6
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Selected Week Details */}
            {weeks
              .filter(week => week.week === selectedWeek)
              .map((week) => (
                <div key={week.week} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Week {week.week}</h3>
                    <div className="text-sm text-gray-600">
                      {week.completedCount} of {week.days.length} days completed
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {week.days.map((day: any) => (
                      <Card 
                        key={day.day} 
                        className={`
                          relative cursor-pointer transition-all duration-200 hover:shadow-md
                          ${day.isCompleted 
                            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                            : day.isCurrent 
                              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                              : day.isUpcoming 
                                ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
                                : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full">
                              {day.isCompleted ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                              ) : day.isCurrent ? (
                                <Circle className="w-6 h-6 text-blue-600 fill-current" />
                              ) : (
                                <Circle className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="text-sm font-medium">Day {day.day}</div>
                            {day.isCompleted && day.completion && (
                              <div className="text-xs text-gray-500">
                                {new Date(day.completion.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Progress Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Completion Rate</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Days Remaining</span>
              <span className="font-medium">{30 - currentDay + 1}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Average per Week</span>
              <span className="font-medium">
                {Math.round((completedDays.length / Math.ceil(currentDay / 7)) * 10) / 10}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/journal?challenge=${challengeType}`}>
              <Button variant="outline" size="sm" className="w-full justify-start">
                View Journal Entries
              </Button>
            </Link>
            <Link href={`/progress?challenge=${challengeType}`}>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Detailed Progress
              </Button>
            </Link>
            <Link href="/challenges">
              <Button variant="outline" size="sm" className="w-full justify-start">
                All Challenges
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completions
              .slice(-3)
              .reverse()
              .map((completion: any) => (
                <div key={completion.id} className="flex items-center justify-between text-sm">
                  <span>Day {completion.day}</span>
                  <span className="text-gray-500">
                    {new Date(completion.completedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            {completions.length === 0 && (
              <p className="text-sm text-gray-500">No completed days yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}