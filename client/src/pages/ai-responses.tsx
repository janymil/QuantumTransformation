import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Calendar, MessageSquare, TrendingUp, BarChart3, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AIResponse {
  id: string;
  userId: string;
  sessionType: string;
  userInput: string;
  aiResponse: string;
  modelUsed: string;
  responseTime: number;
  tokenCount: number;
  cost: number;
  challengeType: string;
  day: number;
  createdAt: string;
  responseQuality: number;
  userFeedback?: string;
}

interface FilterOptions {
  challengeType: string;
  modelUsed: string;
  sessionType: string;
  dateRange: string;
  qualityMin: number;
}

export default function AIResponsesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    challengeType: "all",
    modelUsed: "all", 
    sessionType: "all",
    dateRange: "all",
    qualityMin: 1
  });
  const [selectedResponse, setSelectedResponse] = useState<AIResponse | null>(null);

  // Fetch AI responses
  const { data: responses, isLoading } = useQuery({
    queryKey: ["/api/ai/responses", filters, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filters.challengeType !== "all") params.append("challengeType", filters.challengeType);
      if (filters.modelUsed !== "all") params.append("modelUsed", filters.modelUsed);
      if (filters.sessionType !== "all") params.append("sessionType", filters.sessionType);
      if (filters.dateRange !== "all") params.append("dateRange", filters.dateRange);
      params.append("qualityMin", filters.qualityMin.toString());
      
      const response = await fetch(`/api/ai/responses?${params}`);
      if (!response.ok) throw new Error("Failed to fetch AI responses");
      return response.json();
    }
  });

  // Fetch analytics data
  const { data: analytics } = useQuery({
    queryKey: ["/api/ai/analytics"],
    queryFn: async () => {
      const response = await fetch("/api/ai/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    }
  });

  const filteredResponses = responses?.filter((response: AIResponse) => {
    if (searchTerm && !response.userInput.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !response.aiResponse.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  const getModelBadgeColor = (model: string) => {
    switch (model) {
      case "gpt-4o": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "gpt-4o-mini": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "claude-3-sonnet": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getCostColor = (cost: number) => {
    if (cost < 0.01) return "text-green-600 dark:text-green-400";
    if (cost < 0.05) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Response Analytics</h1>
            <p className="text-muted-foreground">
              Search, filter, and analyze AI coaching responses and performance metrics
            </p>
          </div>
          
          {analytics && (
            <div className="flex gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Responses</p>
                    <p className="text-2xl font-bold">{analytics.totalResponses}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Quality</p>
                    <p className="text-2xl font-bold">{analytics.avgQuality}/10</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cost Savings</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.costSavings}%</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search responses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filters.challengeType} onValueChange={(value) => setFilters({...filters, challengeType: value})}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Challenge Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Challenges</SelectItem>
                <SelectItem value="money_blocks_clearing">Money Blocks</SelectItem>
                <SelectItem value="relationship_magnetism">Relationships</SelectItem>
                <SelectItem value="health_vitality">Health & Vitality</SelectItem>
                <SelectItem value="career_purpose">Career Purpose</SelectItem>
                <SelectItem value="quantum_manifestation">Manifestation</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.modelUsed} onValueChange={(value) => setFilters({...filters, modelUsed: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="AI Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="claude-3-sonnet">Claude Sonnet</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.sessionType} onValueChange={(value) => setFilters({...filters, sessionType: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Session Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="coaching">Coaching</SelectItem>
                <SelectItem value="explanation">Explanation</SelectItem>
                <SelectItem value="guidance">Guidance</SelectItem>
                <SelectItem value="breakthrough">Breakthrough</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="responses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="responses">Response History</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          <TabsTrigger value="trends">Cost & Quality Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response List */}
            <ScrollArea className="h-[700px]">
              <div className="space-y-4">
                {filteredResponses.map((response: AIResponse) => (
                  <Card 
                    key={response.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedResponse?.id === response.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => setSelectedResponse(response)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{response.challengeType.replace('_', ' ')}</Badge>
                          <Badge variant="outline">Day {response.day}</Badge>
                          <Badge className={getModelBadgeColor(response.modelUsed)}>
                            {response.modelUsed}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">User Question:</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {response.userInput}
                        </p>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-4">
                            <span>Quality: {response.responseQuality}/10</span>
                            <span>Tokens: {response.tokenCount}</span>
                            <span className={getCostColor(response.cost)}>
                              Cost: ${response.cost.toFixed(4)}
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            {response.responseTime}ms
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Response Detail */}
            <div className="space-y-4">
              {selectedResponse ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Response Details
                    </CardTitle>
                    <CardDescription>
                      Generated on {new Date(selectedResponse.createdAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">User Input:</h4>
                      <p className="text-sm bg-muted p-3 rounded-lg">
                        {selectedResponse.userInput}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">AI Response:</h4>
                      <ScrollArea className="h-96">
                        <div className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                          {typeof selectedResponse.aiResponse === 'string' 
                            ? selectedResponse.aiResponse 
                            : JSON.stringify(selectedResponse.aiResponse, null, 2)
                          }
                        </div>
                      </ScrollArea>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">PERFORMANCE</p>
                        <div className="space-y-1">
                          <p className="text-sm">Model: <Badge className={getModelBadgeColor(selectedResponse.modelUsed)}>{selectedResponse.modelUsed}</Badge></p>
                          <p className="text-sm">Response Time: {selectedResponse.responseTime}ms</p>
                          <p className="text-sm">Quality Score: {selectedResponse.responseQuality}/10</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">METRICS</p>
                        <div className="space-y-1">
                          <p className="text-sm">Tokens: {selectedResponse.tokenCount}</p>
                          <p className={`text-sm ${getCostColor(selectedResponse.cost)}`}>
                            Cost: ${selectedResponse.cost.toFixed(4)}
                          </p>
                          <p className="text-sm">Challenge: {selectedResponse.challengeType}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Select a response to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Model Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.modelDistribution && Object.entries(analytics.modelDistribution).map(([model, count]: [string, any]) => (
                        <div key={model} className="flex justify-between text-sm">
                          <span>{model}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Response Times</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>GPT-4o</span>
                        <span className="font-medium">{analytics.avgResponseTime?.["gpt-4o"] || 0}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>GPT-4o Mini</span>
                        <span className="font-medium">{analytics.avgResponseTime?.["gpt-4o-mini"] || 0}ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average Quality</span>
                        <span className="font-medium">{analytics.avgQuality}/10</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>High Quality (8+)</span>
                        <span className="font-medium">{analytics.highQualityPercentage}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Cost Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Cost</span>
                        <span className="font-medium">${analytics.totalCost?.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg per Response</span>
                        <span className="font-medium">${analytics.avgCostPerResponse?.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Cost Savings</span>
                        <span className="font-medium text-green-600">{analytics.costSavings}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon: Interactive Charts</CardTitle>
              <CardDescription>
                Detailed cost and quality trend analysis with interactive visualizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <BarChart3 className="h-16 w-16" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}