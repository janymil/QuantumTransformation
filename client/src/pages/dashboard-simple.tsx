import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Brain, Calendar, Target, TrendingUp, Zap, BookOpen, Users, Heart, DollarSign, Sparkles, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";

// Lazy load heavy components
const SpacedRepetitionWidget = lazy(() => import("@/components/spaced-repetition-widget"));

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between" data-tour-target="dashboard-header">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {(user as any)?.firstName || "Transformer"}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your active quantum consciousness challenges
              </p>
            </div>
            <Link href="/challenges">
              <Button data-tour-target="challenges-section">
                <Play className="w-4 h-4 mr-2" />
                Start New Challenge
              </Button>
            </Link>
          </div>

          {/* Multi-Challenge Dashboard */}
          <div data-tour-target="practice-area">
            {/* MultiChallengeDashboard Component */}
          </div>

          {/* Additional Learning Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spaced Repetition Widget */}
            <Suspense fallback={
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading spaced repetition...</p>
                  </div>
                </CardContent>
              </Card>
            }>
              <SpacedRepetitionWidget challengeType="general_quantum" />
            </Suspense>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Learning Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/journal">
                  <Button variant="outline" size="sm" className="w-full" data-tour-target="journal-section">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Journal Insights
                  </Button>
                </Link>
                <Link href="/progress">
                  <Button variant="outline" size="sm" className="w-full" data-tour-target="progress-section">
                    <Target className="w-4 h-4 mr-2" />
                    Progress Analytics
                  </Button>
                </Link>
                <Link href="/challenges">
                  <Button variant="outline" size="sm" className="w-full">
                    <Brain className="w-4 h-4 mr-2" />
                    Explore More Challenges
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


    </div>
  );
}