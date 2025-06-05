import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  MessageSquare,
  Activity,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface AdminAnalyticsData {
  totalResponses: number;
  totalUsers: number;
  totalCost: number;
  averageQuality: number;
  averageResponseTime: number;
  modelDistribution: { model: string; count: number; percentage: number; cost: number }[];
  costSavings: number;
  highQualityPercentage: number;
  dailyUsage: { date: string; responses: number; cost: number; users: number }[];
  topChallengeTypes: { challengeType: string; count: number; avgQuality: number }[];
  userEngagement: {
    activeUsers: number;
    avgResponsesPerUser: number;
    returnRate: number;
  };
}

export default function AdminAnalytics() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Password authentication
  const handleLogin = () => {
    // Simple password check - in production, use proper authentication
    if (password === "quantum2025admin") {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the admin analytics dashboard.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid password. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch admin analytics data
  const { data: analytics, isLoading } = useQuery<AdminAnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>
              Enter password to access analytics dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <Button onClick={handleLogin} className="w-full">
              Access Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading analytics data...</div>
      </div>
    );
  }

  const getCostColor = (savings: number) => {
    if (savings >= 80) return "text-green-600";
    if (savings >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Admin Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights into AI usage, costs, and user engagement
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsAuthenticated(false)}
        >
          <Lock className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {analytics && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="costs">Costs & Models</TabsTrigger>
            <TabsTrigger value="usage">Usage Patterns</TabsTrigger>
            <TabsTrigger value="users">User Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalResponses.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics.totalCost.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getCostColor(analytics.costSavings)}`}>
                    {analytics.costSavings}%
                  </div>
                  <p className="text-xs text-muted-foreground">vs GPT-4o only</p>
                </CardContent>
              </Card>
            </div>

            {/* Quality Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Quality</CardTitle>
                  <CardDescription>Average AI response quality score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Average Quality</span>
                      <span className="font-bold">{analytics.averageQuality.toFixed(1)}/10</span>
                    </div>
                    <Progress value={analytics.averageQuality * 10} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>High Quality Responses</span>
                      <span>{analytics.highQualityPercentage}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Response time and efficiency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Avg Response Time</span>
                      <span className="font-bold">{analytics.averageResponseTime.toFixed(0)}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Responses per User</span>
                      <span className="font-bold">{analytics.userEngagement.avgResponsesPerUser.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>User Return Rate</span>
                      <span className="font-bold">{analytics.userEngagement.returnRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Costs & Models Tab */}
          <TabsContent value="costs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Model Distribution</CardTitle>
                  <CardDescription>Usage breakdown by AI model</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.modelDistribution.map((model) => (
                      <div key={model.model} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{model.model}</span>
                          <div className="text-right">
                            <div className="font-bold">{model.percentage}%</div>
                            <div className="text-sm text-muted-foreground">
                              ${model.cost.toFixed(3)}
                            </div>
                          </div>
                        </div>
                        <Progress value={model.percentage} className="h-2" />
                        <div className="text-sm text-muted-foreground">
                          {model.count.toLocaleString()} requests
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Challenge Performance</CardTitle>
                  <CardDescription>Popular challenges and quality scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topChallengeTypes.map((challenge) => (
                      <div key={challenge.challengeType} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {challenge.challengeType?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "General"}
                          </span>
                          <div className="text-right">
                            <div className="font-bold">{challenge.count}</div>
                            <div className="text-sm text-muted-foreground">
                              {challenge.avgQuality.toFixed(1)}/10
                            </div>
                          </div>
                        </div>
                        <Progress value={challenge.avgQuality * 10} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Usage Patterns Tab */}
          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Usage Trends</CardTitle>
                <CardDescription>AI requests, costs, and user activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.dailyUsage.slice(-7).map((day) => (
                    <div key={day.date} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div>
                        <div className="text-sm text-muted-foreground">Date</div>
                        <div className="font-medium">{format(new Date(day.date), "MMM dd")}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Responses</div>
                        <div className="font-medium">{day.responses}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Cost</div>
                        <div className="font-medium">${day.cost.toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Users</div>
                        <div className="font-medium">{day.users}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Analytics Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Active Users</span>
                      <span className="font-bold">{analytics.userEngagement.activeUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Responses/User</span>
                      <span className="font-bold">{analytics.userEngagement.avgResponsesPerUser.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Return Rate</span>
                      <span className="font-bold">{analytics.userEngagement.returnRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Cost per Response</span>
                      <span className="font-bold">
                        ${(analytics.totalCost / analytics.totalResponses).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost per User</span>
                      <span className="font-bold">
                        ${(analytics.totalCost / analytics.totalUsers).toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Savings Rate</span>
                      <span className={`font-bold ${getCostColor(analytics.costSavings)}`}>
                        {analytics.costSavings}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Avg Quality</span>
                      <span className="font-bold">{analytics.averageQuality.toFixed(1)}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High Quality %</span>
                      <span className="font-bold">{analytics.highQualityPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Response Time</span>
                      <span className="font-bold">{analytics.averageResponseTime.toFixed(0)}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}