import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Brain,
  MessageSquare,
  Star,
  Clock,
  Zap,
  Shield,
  Activity,
  Database,
  UserCheck,
  Target,
  Calendar,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminAnalytics() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState("ai-usage");

  const correctPassword = "quantum2025admin";

  // Analytics query - only run if authenticated
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['/api/admin/analytics'],
    retry: false,
    enabled: isAuthenticated,
  });

  // User statistics query - only run if authenticated
  const { data: userStats, isLoading: userStatsLoading, error: userStatsError } = useQuery({
    queryKey: ['/api/admin/user-statistics'],
    retry: false,
    enabled: isAuthenticated,
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthAttempted(true);
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the admin analytics dashboard.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Password entry screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Admin Access Required</CardTitle>
            <CardDescription>
              Enter the admin password to access analytics dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center"
              />
              <Button type="submit" className="w-full">
                Access Dashboard
              </Button>
              {authAttempted && password !== correctPassword && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Invalid password. Please contact the system administrator for access.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Database className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Failed to Load Analytics</h3>
            <p className="text-muted-foreground">
              Unable to fetch analytics data. Please check the server connection.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(4)}`;
  const formatPercentage = (value: number) => `${value}%`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Comprehensive insights into AI usage, costs, and user engagement
              </p>
            </div>
          </div>
          
          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              This dashboard contains sensitive analytics data. Access is restricted to authorized administrators only.
            </AlertDescription>
          </Alert>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active platform users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalResponses || 0}</div>
              <p className="text-xs text-muted-foreground">
                AI conversations generated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.totalCost || 0)}</div>
              <p className="text-xs text-muted-foreground">
                API usage costs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatPercentage(analytics?.costSavings || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Through intelligent routing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Model Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Model Usage
              </CardTitle>
              <CardDescription>
                Distribution of GPT-4o vs GPT-4o-mini usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics?.modelDistribution?.map((model: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{model.model}</span>
                    <span className="text-sm text-muted-foreground">
                      {model.count} requests ({formatPercentage(model.percentage)})
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        model.model === 'gpt-4o-mini' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${model.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cost: {formatCurrency(model.cost || 0)}
                  </div>
                </div>
              )) || []}
            </CardContent>
          </Card>

          {/* Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Quality Metrics
              </CardTitle>
              <CardDescription>
                Response quality and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Quality Rating</span>
                  <span className="text-lg font-bold">{(analytics?.averageQuality || 0).toFixed(1)}/10</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-yellow-500"
                    style={{ width: `${((analytics?.averageQuality || 0) / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">High Quality Responses</span>
                  <span className="text-lg font-bold">{formatPercentage(analytics?.highQualityPercentage || 0)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${analytics?.highQualityPercentage || 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Response Time</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-sm">{(analytics?.averageResponseTime || 0)}ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Challenge Types and User Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Challenge Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Popular Challenge Types
              </CardTitle>
              <CardDescription>
                Most frequently used challenge categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topChallengeTypes?.slice(0, 5).map((challenge: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">
                          {challenge.name?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {challenge.value || challenge.count || 0} uses
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full bg-purple-500"
                            style={{ 
                              width: `${((challenge.value || challenge.count || 0) / (analytics?.topChallengeTypes?.[0]?.value || analytics?.topChallengeTypes?.[0]?.count || 1)) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(challenge.avgQuality || 8).toFixed(1)}★
                        </span>
                      </div>
                    </div>
                  </div>
                )) || []}
              </div>
            </CardContent>
          </Card>

          {/* User Engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                User Engagement
              </CardTitle>
              <CardDescription>
                Platform engagement and usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics?.userEngagement?.activeUsers || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics?.userEngagement?.avgResponsesPerUser || 0}</div>
                  <div className="text-sm text-muted-foreground">Avg Responses/User</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Return Rate</span>
                  <span className="text-lg font-bold">{formatPercentage(analytics?.userEngagement?.returnRate || 0)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${analytics?.userEngagement?.returnRate || 0}%` }}
                  />
                </div>
              </div>

              <Alert>
                <TrendingUp className="w-4 h-4" />
                <AlertDescription>
                  Platform showing strong user engagement with {formatPercentage(analytics?.costSavings || 0)} cost optimization through intelligent AI routing.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}