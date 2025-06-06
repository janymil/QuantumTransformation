import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { 
  DollarSign, 
  TrendingDown, 
  Settings, 
  Mic, 
  BarChart3, 
  Calculator,
  Zap,
  Shield,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface CostSavingsReport {
  totalRequests: number;
  totalCost: number;
  estimatedCostWithoutOptimization: number;
  totalSavings: number;
  savingsPercentage: number;
  topSavingStrategies: Array<{
    strategy: string;
    savings: number;
    count: number;
  }>;
}

interface OptimizationStatus {
  config: any;
  activeStrategies: Array<{
    name: string;
    description: string;
    estimatedSavings: number;
    active: boolean;
  }>;
}

export default function CostOptimizationDashboard() {
  const [selectedDays, setSelectedDays] = useState(30);
  const [voiceText, setVoiceText] = useState("");
  const [voiceTier, setVoiceTier] = useState("free");
  const [voiceCostEstimate, setVoiceCostEstimate] = useState(null);

  // Fetch cost savings report
  const { data: savingsReport, isLoading: savingsLoading } = useQuery<CostSavingsReport>({
    queryKey: ['/api/ai-cost-optimization/savings-report', selectedDays],
    enabled: true
  });

  // Fetch optimization status
  const { data: optimizationStatus, isLoading: statusLoading } = useQuery<OptimizationStatus>({
    queryKey: ['/api/ai-cost-optimization/status'],
    enabled: true
  });

  // Calculate ElevenLabs voice cost
  const calculateVoiceCost = async () => {
    if (!voiceText.trim()) return;

    try {
      const response = await apiRequest('/api/elevenlabs/cost-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voiceText,
          subscription_tier: voiceTier
        })
      });

      setVoiceCostEstimate(response);
    } catch (error) {
      console.error('Error calculating voice cost:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  const elevenlabsPricing = {
    free: { monthlyPrice: 0, characters: 10000 },
    starter: { monthlyPrice: 5, characters: 30000 },
    creator: { monthlyPrice: 22, characters: 100000 },
    pro: { monthlyPrice: 99, characters: 500000 }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Cost Optimization Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and optimize your AI usage costs across all systems
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Zap className="w-3 h-3 mr-1" />
          Optimization Active
        </Badge>
      </div>

      {/* Cost Savings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {savingsReport ? formatCurrency(savingsReport.totalSavings) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {selectedDays} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {savingsReport ? `${savingsReport.savingsPercentage.toFixed(1)}%` : '-'}
            </div>
            <Progress 
              value={savingsReport?.savingsPercentage || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {savingsReport ? savingsReport.totalRequests.toLocaleString() : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Optimized requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {savingsReport ? formatCurrency(savingsReport.totalCost) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              After optimization
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Optimization Strategies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Active Cost Savings Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {optimizationStatus?.activeStrategies.map((strategy, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{strategy.name}</h4>
                    {strategy.active ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{strategy.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {strategy.estimatedSavings}%
                  </div>
                  <p className="text-xs text-muted-foreground">Est. savings</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ElevenLabs Voice Cost Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              ElevenLabs Voice Cost Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="voice-tier">Subscription Tier</Label>
              <Select value={voiceTier} onValueChange={setVoiceTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free - 10K chars/month</SelectItem>
                  <SelectItem value="starter">Starter - $5/month (30K chars)</SelectItem>
                  <SelectItem value="creator">Creator - $22/month (100K chars)</SelectItem>
                  <SelectItem value="pro">Pro - $99/month (500K chars)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="voice-text">Text to Convert</Label>
              <Textarea
                id="voice-text"
                placeholder="Enter text to estimate voice generation cost..."
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Characters: {voiceText.length}
              </p>
            </div>

            <Button onClick={calculateVoiceCost} className="w-full">
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Cost
            </Button>

            {voiceCostEstimate && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Characters:</span>
                  <span className="font-mono">{voiceCostEstimate.characterCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Limit:</span>
                  <span className="font-mono">{voiceCostEstimate.monthlyLimit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Within Limit:</span>
                  <span className={voiceCostEstimate.withinLimit ? "text-green-600" : "text-red-600"}>
                    {voiceCostEstimate.withinLimit ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Estimated Cost:</span>
                  <span className="text-lg">
                    {formatCurrency(voiceCostEstimate.estimatedCost)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ElevenLabs Pricing Overview */}
      <Card>
        <CardHeader>
          <CardTitle>ElevenLabs Pricing Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Compare subscription tiers and estimate monthly costs for voice generation
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(elevenlabsPricing).map(([tier, pricing]) => (
              <div 
                key={tier}
                className={`p-4 border rounded-lg ${voiceTier === tier ? 'border-blue-500 bg-blue-50' : ''}`}
              >
                <h3 className="font-semibold capitalize">{tier}</h3>
                <div className="text-2xl font-bold text-blue-600">
                  {pricing.monthlyPrice === 0 ? 'Free' : `$${pricing.monthlyPrice}/mo`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {pricing.characters.toLocaleString()} characters/month
                </div>
                <div className="text-xs mt-2">
                  ~{Math.floor(pricing.characters / 600)} minutes of speech
                </div>
                {voiceTier === tier && (
                  <Badge className="mt-2">Selected</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Savings Strategies */}
      {savingsReport?.topSavingStrategies && (
        <Card>
          <CardHeader>
            <CardTitle>Top Cost Saving Strategies (Last {selectedDays} Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savingsReport.topSavingStrategies.map((strategy, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{strategy.strategy}</h4>
                    <p className="text-sm text-muted-foreground">
                      Used {strategy.count} times
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(strategy.savings)}
                    </div>
                    <p className="text-xs text-muted-foreground">Saved</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Tracking Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>What is Progress Tracking?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Progress tracking monitors how users engage with their vision boards and goals over time:
          </p>
          <ul className="text-sm space-y-2 ml-4">
            <li>• Track which vision board elements users interact with most</li>
            <li>• Monitor completion rates of goals represented on boards</li>
            <li>• Measure time spent viewing specific vision board sections</li>
            <li>• Generate insights about which visual elements correlate with goal achievement</li>
            <li>• Create progress reports showing evolution of user's vision boards</li>
            <li>• Suggest updates based on achieved goals vs. stagnant areas</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}