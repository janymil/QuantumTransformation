import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Clock, 
  DollarSign,
  TrendingUp,
  Activity,
  Database,
  CheckCircle2,
  AlertCircle,
  Timer
} from "lucide-react";

interface CacheTestResult {
  question: string;
  responseTime: number;
  fromCache: boolean;
  cacheType?: string;
  cost: number;
  quality: 'high' | 'medium' | 'template';
}

const TEST_QUESTIONS = [
  "How long should I practice today's meditation?",
  "What if I'm having trouble with this exercise?", 
  "How does this connect to quantum physics?",
  "What is Day 1 about?",
  "Explain the science behind quantum consciousness",
  "What should I focus on during visualization?",
  "How does this help rewire my brain?",
  "What are the benefits of coherent brain states?"
];

export default function CacheTestingDashboard() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<CacheTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);

  // Get cache analytics
  const { data: cacheAnalytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ["/api/ai/cache-analytics"],
    refetchInterval: 5000
  });

  // Initialize cache system
  const initializeCacheMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/initialize-cache", {}),
    onSuccess: () => {
      toast({
        title: "Cache Initialized",
        description: "Enhanced caching system is now ready for testing",
      });
      refetchAnalytics();
    },
    onError: () => {
      toast({
        title: "Initialization Failed",
        description: "Could not initialize caching system",
        variant: "destructive",
      });
    }
  });

  // Test AI request with timing
  const testAIRequest = async (question: string, challengeType: string = "general_quantum", day: number = 1): Promise<CacheTestResult> => {
    const startTime = performance.now();
    
    try {
      const response = await apiRequest("POST", "/api/ai/explain", {
        userQuestion: question,
        challengeType,
        day,
        userTier: 'basic'
      });
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      return {
        question,
        responseTime,
        fromCache: response.fromCache || false,
        cacheType: response.cacheType || response.cacheStrategy,
        cost: response.fromCache ? 0 : 0.02,
        quality: response.cacheType === 'template' ? 'template' : 
                response.cacheType === 'pregenerated' ? 'high' : 'medium'
      };
    } catch (error) {
      throw new Error(`Failed to test question: ${question}`);
    }
  };

  // Run comprehensive cache tests
  const runCacheTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    setCurrentTestIndex(0);
    
    try {
      for (let i = 0; i < TEST_QUESTIONS.length; i++) {
        setCurrentTestIndex(i);
        
        // Test each question twice to see caching effect
        const firstResult = await testAIRequest(TEST_QUESTIONS[i]);
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
        const secondResult = await testAIRequest(TEST_QUESTIONS[i]);
        
        setTestResults(prev => [...prev, firstResult, secondResult]);
        
        // Refresh analytics after each test
        refetchAnalytics();
      }
      
      toast({
        title: "Cache Tests Complete",
        description: `Tested ${TEST_QUESTIONS.length} questions with caching validation`,
      });
      
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Some cache tests could not complete",
        variant: "destructive",
      });
    } finally {
      setIsRunningTests(false);
      setCurrentTestIndex(0);
    }
  };

  // Calculate test statistics
  const testStats = {
    totalTests: testResults.length,
    cacheHits: testResults.filter(r => r.fromCache).length,
    avgResponseTime: testResults.length > 0 ? 
      Math.round(testResults.reduce((sum, r) => sum + r.responseTime, 0) / testResults.length) : 0,
    totalCostSaved: testResults.filter(r => r.fromCache).length * 0.02,
    cacheHitRate: testResults.length > 0 ? 
      Math.round((testResults.filter(r => r.fromCache).length / testResults.length) * 100) : 0
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Cache Testing Dashboard
          <Badge variant="outline">Enhanced System</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="testing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="testing">Live Testing</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="testing" className="space-y-4">
            {/* Control Panel */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => initializeCacheMutation.mutate()}
                disabled={initializeCacheMutation.isPending}
                variant="outline"
              >
                {initializeCacheMutation.isPending ? "Initializing..." : "Initialize Cache"}
              </Button>
              
              <Button
                onClick={runCacheTests}
                disabled={isRunningTests}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunningTests ? "Running Tests..." : "Run Cache Tests"}
              </Button>
            </div>

            {/* Test Progress */}
            {isRunningTests && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Testing Progress</span>
                  <span>{currentTestIndex + 1}/{TEST_QUESTIONS.length}</span>
                </div>
                <Progress value={(currentTestIndex / TEST_QUESTIONS.length) * 100} />
                <div className="text-xs text-gray-600">
                  Current: {TEST_QUESTIONS[currentTestIndex]}
                </div>
              </div>
            )}

            {/* Quick Test Stats */}
            {testResults.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{testStats.cacheHitRate}%</div>
                  <div className="text-xs text-gray-600">Cache Hit Rate</div>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{testStats.avgResponseTime}ms</div>
                  <div className="text-xs text-gray-600">Avg Response</div>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{testStats.cacheHits}</div>
                  <div className="text-xs text-gray-600">Cache Hits</div>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">${testStats.totalCostSaved.toFixed(2)}</div>
                  <div className="text-xs text-gray-600">Cost Saved</div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            {cacheAnalytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Cache Performance</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{cacheAnalytics.hitRate}%</div>
                    <div className="text-sm text-gray-600">Overall Hit Rate</div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Cached Responses</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{cacheAnalytics.cacheComposition?.totalCached || 0}</div>
                    <div className="text-sm text-gray-600">Total in Cache</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Cache Composition</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Pre-Generated Content:</span>
                      <span>{cacheAnalytics.cacheComposition?.preGenerated || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User-Generated Responses:</span>
                      <span>{cacheAnalytics.cacheComposition?.userGenerated || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Template Responses:</span>
                      <span>{cacheAnalytics.cacheComposition?.templateResponses || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                Loading cache analytics...
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="results" className="space-y-4">
            {testResults.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{result.question.slice(0, 40)}...</div>
                      <div className="text-xs text-gray-500">{result.responseTime}ms response</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.fromCache ? "default" : "outline"}>
                        {result.fromCache ? (
                          <>
                            <Zap className="h-3 w-3 mr-1" />
                            {result.cacheType || 'Cached'}
                          </>
                        ) : (
                          <>
                            <Timer className="h-3 w-3 mr-1" />
                            Fresh
                          </>
                        )}
                      </Badge>
                      <div className="text-xs">
                        {result.fromCache ? '$0.00' : '$0.02'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No test results yet. Run cache tests to see performance data.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}