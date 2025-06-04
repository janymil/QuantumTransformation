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
  Lock,
  Eye,
  Star
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

  // Generate day content based on challenge type
  const generateDayContent = (day: number) => {
    return {
      title: `Day ${day}: Quantum Consciousness Foundation`,
      subtitle: "Master the fundamentals of quantum reality",
      description: "Elevate your consciousness and align with quantum possibilities",
      duration: "15-20 minutes",
      topic: "Quantum Consciousness",
      practice: "Quantum Meditation"
    };
  };

  // Calculate weekly progress - 5 weeks with 7 days each (30 days total, last week has 2 days)
  const weeks = Array.from({ length: 5 }, (_, weekIndex) => {
    const weekNumber = weekIndex + 1;
    const daysInWeek = weekNumber === 5 ? 2 : 7; // Last week has only 2 days (29, 30)
    const weekDays = Array.from({ length: daysInWeek }, (_, dayIndex) => {
      const dayNumber = weekIndex * 7 + dayIndex + 1;
      if (dayNumber > 30) return null;
      
      const isCompleted = completedDays.includes(dayNumber);
      const isCurrent = dayNumber === currentDay;
      const isUpcoming = dayNumber > currentDay;
      const dayContent = generateDayContent(dayNumber);
      
      return {
        day: dayNumber,
        isCompleted,
        isCurrent,
        isUpcoming,
        completion: completions.find((c: any) => c.day === dayNumber),
        content: dayContent
      };
    }).filter(Boolean);
    
    return {
      week: weekNumber,
      days: weekDays,
      completedCount: weekDays.filter(d => d?.isCompleted).length,
      totalDays: daysInWeek
    };
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <Card className="relative overflow-hidden">
        <div className={`h-32 bg-gradient-to-br ${challengeInfo.gradient} relative`}>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 h-full flex items-center justify-between p-6 text-white">
            <div>
              <div className="text-4xl mb-2">{challengeInfo.icon}</div>
              <h1 className="text-2xl font-bold">{challengeInfo.title}</h1>
              <p className="text-white/90">{challengeInfo.subtitle}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">Day {currentDay}</div>
              <p className="text-white/90">of 30</p>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Flame className="w-4 h-4 mr-2" />
                Current Streak
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {streakCount} days
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Trophy className="w-4 h-4 mr-2" />
                Completed Days
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {completedDays.length}/30
              </div>
            </div>

            <div className="space-y-2">
              <Link href={`/challenge-day?type=${challengeType}&day=${currentDay}`}>
                <Button className="w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Continue Day {currentDay}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    {week.completedCount}/{week.totalDays}
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
                  
                  <div className="grid grid-cols-7 gap-2 md:gap-4">
                    {week.days.map((day: any) => (
                      <Card 
                        key={day.day} 
                        className={`
                          relative cursor-pointer transition-all duration-200 hover:shadow-md min-h-[120px]
                          ${day.isCompleted 
                            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                            : day.isCurrent 
                              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                              : day.isUpcoming 
                                ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 opacity-60' 
                                : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <CardContent className="p-2 md:p-3">
                          <div className="flex flex-col items-center space-y-1 md:space-y-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full">
                              {day.isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                              ) : day.isCurrent ? (
                                <Play className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                              ) : day.isUpcoming ? (
                                <Lock className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                              ) : (
                                <Circle className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                              )}
                            </div>
                            
                            <div className="text-xs md:text-sm font-medium text-center">
                              Day {day.day}
                            </div>
                            
                            {/* Challenge content preview */}
                            <div className="text-xs text-center text-gray-600 hidden md:block">
                              {day.content.practice}
                            </div>
                            
                            {/* Duration */}
                            <div className="text-xs text-gray-500 hidden md:block">
                              {day.content.duration}
                            </div>
                            
                            {/* Action button */}
                            {day.isCompleted && (
                              <Link href={`/challenge-day?type=${challengeType}&day=${day.day}`}>
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Review
                                </Button>
                              </Link>
                            )}
                            
                            {day.isCurrent && (
                              <Link href={`/challenge-day?type=${challengeType}&day=${day.day}`}>
                                <Button size="sm" className="h-6 px-2 text-xs">
                                  <Play className="w-3 h-3 mr-1" />
                                  Start
                                </Button>
                              </Link>
                            )}
                            
                            {day.isCompleted && day.completion && (
                              <div className="text-xs text-gray-500 hidden md:block">
                                <Star className="w-3 h-3 inline mr-1" />
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