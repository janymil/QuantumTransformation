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
  Clock,
  Flame
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { CHALLENGE_TYPES, getChallengeType } from "@shared/challenge-types";
import type { UserProgress, ChallengeCompletion } from "@shared/schema";

export interface IndividualChallengeDashboardProps {
  challengeType: string;
}

export default function IndividualChallengeDashboard({ challengeType }: IndividualChallengeDashboardProps) {
  const { user } = useAuth();
  const challengeData = getChallengeType(challengeType);

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

  const currentDay = progress?.currentDay || 1;
  const completedDays = completions?.filter((c: ChallengeCompletion) => c.challengeType === challengeType).length || 0;
  const streakCount = progress?.streakCount || 0;
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href={`/${challengeType}/day/${currentDay}`}>
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
            <Link href={`/${challengeType}/journal`}>
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href={`/${challengeType}/progress`}>
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
            </Link>
          </Card>
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