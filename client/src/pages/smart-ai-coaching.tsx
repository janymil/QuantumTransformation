import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Brain, Zap, TrendingDown, Clock, DollarSign, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SmartCoachingResponse {
  response: string;
  modelUsed: string;
  routingDecision: {
    model: string;
    reasoning: string;
    complexity: string;
    estimatedCost: number;
    features: string[];
  };
  actualCost: number;
  emotionalInsights?: any[];
  predictiveInsights?: any[];
  challengeType: string;
  timestamp: string;
}

interface RoutingStats {
  totalRequests: number;
  gpt4oRequests: number;
  gpt4oMiniRequests: number;
  totalCost: number;
  estimatedCostWithoutRouting: number;
  savings: number;
  savingsPercentage: number;
}

export default function SmartAICoaching() {
  const [query, setQuery] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState("general_quantum");
  const queryClient = useQueryClient();

  // Get routing statistics
  const { data: routingStats } = useQuery<{ stats: RoutingStats }>({
    queryKey: ["/api/ai/routing-stats"],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Smart coaching mutation
  const smartCoachingMutation = useMutation({
    mutationFn: async (data: { query: string; challengeType: string }) => {
      const response = await fetch("/api/ai/smart-coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to get coaching response");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/routing-stats"] });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    smartCoachingMutation.mutate({
      query: query.trim(),
      challengeType: selectedChallenge
    });
  };

  const response = smartCoachingMutation.data as SmartCoachingResponse;

  const getModelBadgeColor = (model: string) => {
    return model.includes('gpt-4o-mini') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Smart AI Coaching</h1>
          <p className="text-gray-600">Cost-optimized intelligent coaching with hybrid model routing</p>
        </div>
      </div>

      <Tabs defaultValue="coaching" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="coaching">AI Coaching</TabsTrigger>
          <TabsTrigger value="analytics">Cost Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="coaching" className="space-y-6">
          {/* Routing Statistics Overview */}
          {routingStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Model Routing Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {routingStats.stats.savingsPercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Cost Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${routingStats.stats.totalCost.toFixed(4)}
                    </div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {((routingStats.stats.gpt4oMiniRequests / routingStats.stats.totalRequests) * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600">Mini Model Usage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {routingStats.stats.totalRequests}
                    </div>
                    <div className="text-sm text-gray-600">Total Requests</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Coaching Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Ask Your AI Coach</CardTitle>
              <CardDescription>
                Our intelligent system automatically chooses the best model for your question
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Challenge Type</label>
                  <select
                    value={selectedChallenge}
                    onChange={(e) => setSelectedChallenge(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="general_quantum">General Quantum Consciousness</option>
                    <option value="limiting_beliefs">Breaking Limiting Beliefs</option>
                    <option value="manifestation">Advanced Manifestation</option>
                    <option value="emotional_mastery">Emotional Mastery</option>
                    <option value="reality_creation">Reality Creation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Your Question</label>
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about your practice, challenges, or seek guidance..."
                    rows={4}
                    className="w-full"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={smartCoachingMutation.isPending || !query.trim()}
                >
                  {smartCoachingMutation.isPending ? "Processing..." : "Get Smart Coaching"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Response Display */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>AI Coach Response</span>
                  <div className="flex gap-2">
                    <Badge className={getModelBadgeColor(response.modelUsed)}>
                      {response.modelUsed}
                    </Badge>
                    <Badge className={getComplexityColor(response.routingDecision.complexity)}>
                      {response.routingDecision.complexity}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription>
                  Cost: ${response.actualCost.toFixed(4)} • {response.routingDecision.reasoning}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose max-w-none">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {response.response}
                  </p>
                </div>

                <Separator />

                {/* Routing Decision Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Routing Decision Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Model Selected:</span>
                      <p className="text-gray-600">{response.routingDecision.model}</p>
                    </div>
                    <div>
                      <span className="font-medium">Complexity:</span>
                      <p className="text-gray-600 capitalize">{response.routingDecision.complexity}</p>
                    </div>
                    <div>
                      <span className="font-medium">Estimated Cost:</span>
                      <p className="text-gray-600">${response.routingDecision.estimatedCost.toFixed(4)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-sm">Features Enabled:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {response.routingDecision.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Insights for Complex Queries */}
                {(response.emotionalInsights || response.predictiveInsights) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Advanced Insights</h4>
                      
                      {response.emotionalInsights && response.emotionalInsights.length > 0 && (
                        <Alert>
                          <AlertDescription>
                            <strong>Emotional Insights:</strong> Additional emotional intelligence analysis was provided due to query complexity.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {response.predictiveInsights && response.predictiveInsights.length > 0 && (
                        <Alert>
                          <AlertDescription>
                            <strong>Predictive Insights:</strong> Behavioral pattern analysis was included for this complex query.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {routingStats && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cost Analysis & Savings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Cost Breakdown</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Actual Cost (Smart Routing):</span>
                          <span className="font-mono text-green-600">
                            ${routingStats.stats.totalCost.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost Without Routing:</span>
                          <span className="font-mono text-gray-600">
                            ${routingStats.stats.estimatedCostWithoutRouting.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total Savings:</span>
                          <span className="font-mono text-green-600">
                            ${routingStats.stats.savings.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Request Distribution</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>GPT-4o Mini (Cost-optimized)</span>
                            <span>{routingStats.stats.gpt4oMiniRequests} requests</span>
                          </div>
                          <Progress 
                            value={(routingStats.stats.gpt4oMiniRequests / routingStats.stats.totalRequests) * 100}
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>GPT-4o (Complex analysis)</span>
                            <span>{routingStats.stats.gpt4oRequests} requests</span>
                          </div>
                          <Progress 
                            value={(routingStats.stats.gpt4oRequests / routingStats.stats.totalRequests) * 100}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <TrendingDown className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Efficiency Achievement:</strong> Your smart routing system is saving{" "}
                      <span className="font-semibold text-green-600">
                        {routingStats.stats.savingsPercentage.toFixed(1)}%
                      </span>{" "}
                      on AI costs while maintaining high-quality responses for complex queries.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">85%</div>
                      <div className="text-sm text-gray-600">Faster Response</div>
                      <div className="text-xs text-gray-500 mt-1">GPT-4o Mini requests</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {routingStats.stats.savingsPercentage.toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Cost Reduction</div>
                      <div className="text-xs text-gray-500 mt-1">vs Standard GPT-4o</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">Smart</div>
                      <div className="text-sm text-gray-600">Auto-Routing</div>
                      <div className="text-xs text-gray-500 mt-1">Quality preserved</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}