import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Play, 
  Award,
  ChevronRight,
  ChevronLeft,
  Clock,
  Flame,
  Lock,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { CHALLENGE_TYPES, getChallengeType, getChallengeUrl } from "@shared/challenge-types";
import type { UserProgress, ChallengeCompletion } from "@shared/schema";

export interface IndividualChallengeDashboardProps {
  challengeType: string;
}

export default function IndividualChallengeDashboard({ challengeType }: IndividualChallengeDashboardProps) {
  const { user } = useAuth();
  const challengeData = getChallengeType(challengeType);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Fetch user progress for this specific challenge
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress", challengeType],
    enabled: !!user,
  });

  // Fetch completions for this challenge
  const { data: completions, isLoading: completionsLoading } = useQuery({
    queryKey: ["/api/challenges/completions", challengeType],
    enabled: !!user,
  });

  if (!challengeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Challenge not found</h1>
          <Link href="/">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentDay = (progress as any)?.currentDay || 1;
  const completedDays = (completions as any)?.filter((c: ChallengeCompletion) => c.challengeType === challengeType).length || 0;
  const streakCount = (progress as any)?.streakCount || 0;
  const progressPercent = (completedDays / 21) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  ← Back to All Challenges
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full ${challengeData.gradient} flex items-center justify-center text-white text-xl font-bold`}>
                  {challengeData.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {challengeData.title}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {challengeData.subtitle}
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {challengeData.difficulty}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Day</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {currentDay}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {completedDays}/21
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Flame className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Streak</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {streakCount} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {Math.round(progressPercent)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>21-Day Challenge Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {completedDays} of 21 days completed
            </p>
          </CardContent>
        </Card>

        {/* Horizontal Day Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Daily Progress
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const container = document.getElementById('days-container');
                    if (container) {
                      container.scrollBy({ left: -200, behavior: 'smooth' });
                    }
                  }}
                  disabled={scrollPosition <= 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const container = document.getElementById('days-container');
                    if (container) {
                      container.scrollBy({ left: 200, behavior: 'smooth' });
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              id="days-container"
              className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
            >
              {Array.from({ length: 21 }, (_, i) => {
                const day = i + 1;
                const isCompleted = (completions as any)?.some((c: ChallengeCompletion) => 
                  c.challengeType === challengeType && c.day === day
                );
                const isCurrent = day === currentDay;
                const isAccessible = day <= currentDay;
                const isFuture = day > currentDay;
                const isPast = day < currentDay;

                // Generate day content based on challenge type and day
                const getDayDescription = (dayNum: number, challengeType: string) => {
                  const descriptions: Record<string, Record<number, string>> = {
                    'general_quantum': {
                      1: 'Setting Quantum Intentions',
                      2: 'Observer Effect Practice',
                      3: 'Coherent Heart States',
                      4: 'Present Moment Awareness',
                      5: 'Energy Field Expansion',
                      6: 'Emotional State Mastery',
                      7: 'Weekly Reflection & Integration'
                    },
                    'money_blocks_clearing': {
                      1: 'Identifying Money Blocks',
                      2: 'Childhood Money Stories',
                      3: 'Scarcity vs Abundance',
                      4: 'Worth & Value Recognition',
                      5: 'Financial Fear Release',
                      6: 'Money Flow Visualization',
                      7: 'Weekly Progress Review'
                    },
                    'self_love': {
                      1: 'Self-Compassion Foundation',
                      2: 'Inner Critic Awareness',
                      3: 'Body Appreciation',
                      4: 'Boundary Setting',
                      5: 'Self-Care Rituals',
                      6: 'Forgiveness Practice',
                      7: 'Weekly Self-Love Reflection'
                    },
                    'anxiety_relief': {
                      1: 'Breath Awareness Basics',
                      2: 'Anxiety Trigger Mapping',
                      3: 'Grounding Techniques',
                      4: 'Mindful Observation',
                      5: 'Progressive Relaxation',
                      6: 'Calming Visualization',
                      7: 'Weekly Anxiety Review'
                    },
                    'productivity_focus': {
                      1: 'Focus Foundation Setup',
                      2: 'Distraction Elimination',
                      3: 'Deep Work Blocks',
                      4: 'Energy Management',
                      5: 'Flow State Practice',
                      6: 'Priority Clarity',
                      7: 'Weekly Productivity Review'
                    }
                  };

                  const challengeDescriptions = descriptions[challengeType] || descriptions['general_quantum'];
                  const weekPattern = ((dayNum - 1) % 7) + 1;
                  return challengeDescriptions[weekPattern] || `Day ${dayNum} Practice`;
                };

                const dayDescription = getDayDescription(day, challengeType);

                return (
                  <div
                    key={day}
                    className={`
                      flex-shrink-0 w-40 h-48 rounded-lg border-2 transition-all duration-200
                      ${isCompleted 
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' 
                        : isCurrent 
                        ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600' 
                        : isFuture 
                        ? 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 opacity-60' 
                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-600'
                      }
                      ${isAccessible ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed'}
                    `}
                  >
                    {isAccessible ? (
                      <Link href={`/${getChallengeUrl(challengeType)}/day/${day}`}>
                        <div className="h-full p-4 flex flex-col justify-between">
                          <div className="text-center">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2
                              ${isCompleted 
                                ? 'bg-green-500 text-white' 
                                : isCurrent 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                              }
                            `}>
                              {isCompleted ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                day
                              )}
                            </div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                              Day {day}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-tight">
                              {dayDescription}
                            </p>
                          </div>
                          
                          <div className="text-center space-y-2">
                            {isCompleted && (
                              <>
                                <Badge variant="secondary" className="text-xs">
                                  Completed
                                </Badge>
                                {isPast && (
                                  <div>
                                    <Link href={`/${getChallengeUrl(challengeType)}/day/${day}`}>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs px-2 py-1 h-auto"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                        }}
                                      >
                                        Review
                                      </Button>
                                    </Link>
                                  </div>
                                )}
                              </>
                            )}
                            {isCurrent && !isCompleted && (
                              <Badge variant="default" className="text-xs">
                                Start Today
                              </Badge>
                            )}
                            {isPast && !isCompleted && (
                              <Badge variant="outline" className="text-xs">
                                Missed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="h-full p-4 flex flex-col justify-between">
                        <div className="text-center">
                          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mb-2">
                            <Lock className="h-5 w-5 text-gray-500" />
                          </div>
                          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                            Day {day}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                            {dayDescription}
                          </p>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs text-gray-400">
                            Locked
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href={`/${getChallengeUrl(challengeType)}/day/${currentDay}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full ${challengeData.gradient} flex items-center justify-center`}>
                      <Play className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Continue Day {currentDay}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Today's practice
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href={`/${getChallengeUrl(challengeType)}/journal`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Journal
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track insights
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Link href={`/${getChallengeUrl(challengeType)}/progress`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Progress
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View achievements
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Challenge Description */}
        <Card>
          <CardHeader>
            <CardTitle>About This Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {challengeData.description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Benefits</h4>
                <ul className="space-y-1">
                  {challengeData.benefits.map((benefit, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Focus Areas</h4>
                <ul className="space-y-1">
                  {challengeData.focusAreas.map((area, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}