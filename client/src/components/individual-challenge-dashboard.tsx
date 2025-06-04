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

            {/* Days Grid */}
            <div className="grid grid-cols-6 gap-3">
              {weeks
                .find(w => w.week === selectedWeek)
                ?.days.map((day: any) => (
                  <div
                    key={day.day}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
                      ${day.isCompleted 
                        ? 'border-green-500 bg-green-50' 
                        : day.isCurrent 
                          ? 'border-blue-500 bg-blue-50' 
                          : day.isUpcoming 
                            ? 'border-gray-200 bg-gray-50' 
                            : 'border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Day {day.day}</span>
                      {day.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : day.isCurrent ? (
                        <Circle className="w-4 h-4 text-blue-600 fill-current" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    
                    {day.completion && (
                      <div className="text-xs text-gray-600">
                        ⭐ {day.completion.rating}/5
                      </div>
                    )}
                    
                    {day.isCurrent && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Completions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Recent Completions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completions.slice(0, 5).map((completion: any) => (
              <div key={completion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">Day {completion.day}</span>
                  <p className="text-sm text-gray-600">{completion.timeSpent} minutes</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < completion.rating ? "text-yellow-400" : "text-gray-300"}>
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(completion.completedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            
            {completions.length === 0 && (
              <p className="text-sm text-gray-500">No completed days yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}