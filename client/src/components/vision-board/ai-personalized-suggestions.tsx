import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Brain, BookOpen, Target, Lightbulb, TrendingUp, Heart, Sparkles, CheckCircle, Plus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { VisionBoard, VisionBoardItem, AISuggestion } from "./vision-board-types";

interface AIPersonalizedSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoard: VisionBoard;
  onApplySuggestion: (suggestion: AISuggestion) => void;
  onAddElement: (element: VisionBoardItem) => void;
}

interface UserDataAnalysis {
  journalInsights: string[];
  progressPatterns: string[];
  affirmationThemes: string[];
  reflectionTrends: string[];
  emotionalState: string;
  goalAlignment: number;
  recommendedFocus: string[];
}

interface PersonalizedSuggestion extends AISuggestion {
  dataSource: 'journal' | 'progress' | 'affirmation' | 'reflection' | 'combined';
  confidence: number;
  userRelevance: number;
  implementationSteps: string[];
  relatedGoals: string[];
}

export default function AIPersonalizedSuggestions({
  isOpen,
  onClose,
  currentBoard,
  onApplySuggestion,
  onAddElement
}: AIPersonalizedSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<PersonalizedSuggestion[]>([]);
  const [userAnalysis, setUserAnalysis] = useState<UserDataAnalysis | null>(null);
  const [dataSourceSettings, setDataSourceSettings] = useState({
    includeJournals: true,
    includeProgress: true,
    includeAffirmations: true,
    includeReflections: true,
    includeChallenges: true,
    timeRange: '30' // days
  });
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const { toast } = useToast();

  // Generate personalized suggestions using existing backend endpoint with enhanced analysis
  const generateSuggestionsMutation = useMutation({
    mutationFn: async (settings: typeof dataSourceSettings) => {
      setAnalysisStep('Analyzing your personal data...');
      
      const response = await fetch('/api/ai/get-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          visionBoard: currentBoard,
          analysisType: 'personalized_deep',
          includeUserData: true,
          dataSourceSettings: settings,
          enhancedAnalysis: {
            includeJournals: settings.includeJournals,
            includeProgress: settings.includeProgress,
            includeAffirmations: settings.includeAffirmations,
            includeReflections: settings.includeReflections,
            includeChallenges: settings.includeChallenges,
            timeRangeDays: parseInt(settings.timeRange),
            analysisDepth: 'comprehensive'
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate personalized suggestions');
      }

      return response.json();
    },
    onSuccess: (result) => {
      setUserAnalysis(result.userAnalysis || null);
      setSuggestions(result.suggestions || []);
      setAnalysisStep('');
      
      toast({
        title: "Personalized Analysis Complete",
        description: `Generated ${result.suggestions?.length || 0} suggestions based on your personal data`
      });
    },
    onError: (error: Error) => {
      setAnalysisStep('');
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Auto-generate suggestions when dialog opens
  useEffect(() => {
    if (isOpen) {
      generateSuggestionsMutation.mutate(dataSourceSettings);
    }
  }, [isOpen]);

  const handleRefreshAnalysis = () => {
    generateSuggestionsMutation.mutate(dataSourceSettings);
  };

  const getDataSourceIcon = (source: string) => {
    switch (source) {
      case 'journal':
        return <BookOpen className="w-4 h-4" />;
      case 'progress':
        return <TrendingUp className="w-4 h-4" />;
      case 'affirmation':
        return <Heart className="w-4 h-4" />;
      case 'reflection':
        return <Lightbulb className="w-4 h-4" />;
      case 'combined':
        return <Brain className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getSuggestionPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const handleApplySuggestion = (suggestion: PersonalizedSuggestion) => {
    if (suggestion.type === 'element') {
      // Create a new vision board element based on the suggestion
      const newElement: VisionBoardItem = {
        id: Date.now().toString(),
        type: 'text',
        content: suggestion.title,
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
        width: 250,
        height: 40,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563EB',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 8,
        opacity: 1,
        zIndex: 1,
        visible: true,
        locked: false
      };
      onAddElement(newElement);
    } else {
      onApplySuggestion(suggestion);
    }

    toast({
      title: "Suggestion Applied",
      description: suggestion.title
    });
  };

  const renderUserAnalysis = () => {
    if (!userAnalysis) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Personal Data Analysis
          </CardTitle>
          <CardDescription>
            AI insights based on your journals, progress, affirmations, and reflections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Goal Alignment Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Goal Alignment Score</Label>
              <Badge variant="outline">{Math.round(userAnalysis.goalAlignment)}%</Badge>
            </div>
            <Progress value={userAnalysis.goalAlignment} className="h-2" />
          </div>

          {/* Current Emotional State */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <Label className="text-sm font-semibold text-blue-900">Current Emotional State</Label>
            <p className="text-sm text-blue-800 mt-1">{userAnalysis.emotionalState}</p>
          </div>

          {/* Key Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userAnalysis.journalInsights.length > 0 && (
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Journal Insights
                </Label>
                <ul className="text-xs mt-2 space-y-1">
                  {userAnalysis.journalInsights.slice(0, 3).map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {userAnalysis.affirmationThemes.length > 0 && (
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Affirmation Themes
                </Label>
                <ul className="text-xs mt-2 space-y-1">
                  {userAnalysis.affirmationThemes.slice(0, 3).map((theme, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-pink-600 rounded-full mt-2 flex-shrink-0" />
                      {theme}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommended Focus Areas */}
          {userAnalysis.recommendedFocus.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Recommended Focus Areas</Label>
              <div className="flex flex-wrap gap-2">
                {userAnalysis.recommendedFocus.map((focus, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {focus}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Personalized Suggestions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Source Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Settings</CardTitle>
              <CardDescription>
                Choose which personal data to include in the AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Journal Entries</Label>
                  <Switch
                    checked={dataSourceSettings.includeJournals}
                    onCheckedChange={(checked) => 
                      setDataSourceSettings(prev => ({ ...prev, includeJournals: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Progress Data</Label>
                  <Switch
                    checked={dataSourceSettings.includeProgress}
                    onCheckedChange={(checked) => 
                      setDataSourceSettings(prev => ({ ...prev, includeProgress: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Affirmations</Label>
                  <Switch
                    checked={dataSourceSettings.includeAffirmations}
                    onCheckedChange={(checked) => 
                      setDataSourceSettings(prev => ({ ...prev, includeAffirmations: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Reflections</Label>
                  <Switch
                    checked={dataSourceSettings.includeReflections}
                    onCheckedChange={(checked) => 
                      setDataSourceSettings(prev => ({ ...prev, includeReflections: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Challenges</Label>
                  <Switch
                    checked={dataSourceSettings.includeChallenges}
                    onCheckedChange={(checked) => 
                      setDataSourceSettings(prev => ({ ...prev, includeChallenges: checked }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label className="text-sm">Time Range:</Label>
                <select
                  value={dataSourceSettings.timeRange}
                  onChange={(e) => setDataSourceSettings(prev => ({ ...prev, timeRange: e.target.value }))}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
                <Button
                  onClick={handleRefreshAnalysis}
                  disabled={generateSuggestionsMutation.isPending}
                  size="sm"
                  variant="outline"
                >
                  {generateSuggestionsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Refresh Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading state */}
          {generateSuggestionsMutation.isPending && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                <p className="text-lg font-medium">Analyzing Your Personal Data</p>
                <p className="text-sm text-muted-foreground">{analysisStep}</p>
              </div>
            </div>
          )}

          {/* User Analysis Summary */}
          {renderUserAnalysis()}

          {/* Personalized Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Personalized Suggestions</h3>
                <Badge variant="outline">
                  {suggestions.length} suggestions
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getDataSourceIcon(suggestion.dataSource)}
                          <CardTitle className="text-base">{suggestion.title}</CardTitle>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant="outline" 
                            className={getSuggestionPriorityColor(suggestion.priority)}
                          >
                            {suggestion.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="text-sm">
                        {suggestion.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0 space-y-3">
                      {/* Data Source and Reasoning */}
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <strong>Based on your {suggestion.dataSource}:</strong> {suggestion.reasoning}
                      </div>

                      {/* Implementation Steps */}
                      {suggestion.implementationSteps && suggestion.implementationSteps.length > 0 && (
                        <div className="text-xs">
                          <strong className="text-muted-foreground">How to implement:</strong>
                          <ul className="mt-1 space-y-1">
                            {suggestion.implementationSteps.slice(0, 2).map((step, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0" />
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Related Goals */}
                      {suggestion.relatedGoals && suggestion.relatedGoals.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {suggestion.relatedGoals.map((goal, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Action Button */}
                      {suggestion.actionable && (
                        <Button
                          size="sm"
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="w-full"
                        >
                          <Plus className="w-3 h-3 mr-2" />
                          Apply to Vision Board
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!generateSuggestionsMutation.isPending && suggestions.length === 0 && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No Personal Data Found</h3>
              <p className="text-muted-foreground mb-4">
                Add some journal entries, affirmations, or track your progress to get personalized suggestions
              </p>
              <Button onClick={handleRefreshAnalysis} variant="outline">
                Try Analysis Again
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}