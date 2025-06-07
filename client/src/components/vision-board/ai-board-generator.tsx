import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Brain, Sparkles, Database, User, BookOpen, Target, Lightbulb } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { VisionBoard, AIGenerationResult } from "./vision-board-types";

interface AIBoardGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardGenerated: (board: VisionBoard) => void;
}

interface GenerationSettings {
  includeJournals: boolean;
  includeAffirmations: boolean;
  includeChallenges: boolean;
  includeUserProfile: boolean;
}

export default function AIBoardGenerator({
  isOpen,
  onClose,
  onBoardGenerated
}: AIBoardGeneratorProps) {
  const [settings, setSettings] = useState<GenerationSettings>({
    includeJournals: true,
    includeAffirmations: true,
    includeChallenges: true,
    includeUserProfile: true
  });
  const [generatedResult, setGeneratedResult] = useState<AIGenerationResult | null>(null);
  const { toast } = useToast();

  // Generate AI vision board using existing backend endpoint
  const generateBoardMutation = useMutation({
    mutationFn: async (settings: GenerationSettings) => {
      const response = await fetch('/api/ai/generate-vision-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...settings,
          userTier: 'basic'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate vision board');
      }

      return response.json() as Promise<AIGenerationResult>;
    },
    onSuccess: (result) => {
      setGeneratedResult(result);
      toast({
        title: "AI Vision Board Generated",
        description: `Created "${result.title}" with ${result.elements.length} elements`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGenerate = () => {
    if (!Object.values(settings).some(Boolean)) {
      toast({
        title: "Select Data Sources",
        description: "Please select at least one data source for AI analysis",
        variant: "destructive"
      });
      return;
    }

    generateBoardMutation.mutate(settings);
  };

  const handleUseGenerated = () => {
    if (!generatedResult) return;

    const board: VisionBoard = {
      title: generatedResult.title,
      description: `AI-generated vision board based on your personal data. Theme: ${generatedResult.theme}`,
      canvasData: {
        items: generatedResult.elements,
        canvasWidth: 800,
        canvasHeight: 600,
        backgroundColor: generatedResult.backgroundColor || '#ffffff',
        gridVisible: false,
        snapToGrid: false
      },
      templateCategory: generatedResult.goalCategories[0] || 'personal',
      tags: [...generatedResult.goalCategories, 'ai-generated'],
      isPublic: false
    };

    onBoardGenerated(board);
    onClose();
    setGeneratedResult(null);

    toast({
      title: "Vision Board Created",
      description: "AI-generated vision board loaded successfully"
    });
  };

  const getDataSourceIcon = (source: string) => {
    switch (source) {
      case 'journals':
        return <BookOpen className="w-4 h-4" />;
      case 'affirmations':
        return <Lightbulb className="w-4 h-4" />;
      case 'challenges':
        return <Target className="w-4 h-4" />;
      case 'profile':
        return <User className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI Vision Board Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!generatedResult ? (
            // Generation settings
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Sources for AI Analysis
                  </CardTitle>
                  <CardDescription>
                    Select which personal data to include in the AI analysis for a more personalized vision board
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getDataSourceIcon('journals')}
                        <div>
                          <Label className="font-medium">Journal Entries</Label>
                          <p className="text-xs text-muted-foreground">Recent thoughts and reflections</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.includeJournals}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, includeJournals: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getDataSourceIcon('affirmations')}
                        <div>
                          <Label className="font-medium">Affirmations</Label>
                          <p className="text-xs text-muted-foreground">Personal affirmations and mantras</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.includeAffirmations}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, includeAffirmations: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getDataSourceIcon('challenges')}
                        <div>
                          <Label className="font-medium">Active Challenges</Label>
                          <p className="text-xs text-muted-foreground">Current goals and progress</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.includeChallenges}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, includeChallenges: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getDataSourceIcon('profile')}
                        <div>
                          <Label className="font-medium">User Profile</Label>
                          <p className="text-xs text-muted-foreground">Preferences and stated goals</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.includeUserProfile}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, includeUserProfile: checked }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 text-blue-900">AI Analysis Process:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Analyzes your selected personal data for patterns and themes</li>
                  <li>• Identifies key aspirations and goals from your content</li>
                  <li>• Creates personalized visual elements and motivational text</li>
                  <li>• Suggests optimal colors and layout based on your energy</li>
                  <li>• Provides manifestation tips tailored to your patterns</li>
                </ul>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={generateBoardMutation.isPending || !Object.values(settings).some(Boolean)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {generateBoardMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate AI Vision Board
              </Button>
            </div>
          ) : (
            // Generated result preview
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    {generatedResult.title}
                  </CardTitle>
                  <CardDescription>
                    Theme: {generatedResult.theme}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preview canvas */}
                  <div 
                    className="w-full h-64 border rounded-lg relative overflow-hidden"
                    style={{ backgroundColor: generatedResult.backgroundColor }}
                  >
                    {generatedResult.elements.slice(0, 6).map((element, index) => (
                      <div
                        key={element.id}
                        className="absolute text-xs p-1 border border-gray-300 bg-white/80 rounded"
                        style={{
                          left: `${(element.x / 800) * 100}%`,
                          top: `${(element.y / 600) * 100}%`,
                          fontSize: `${Math.max(8, (element.fontSize || 16) / 2)}px`,
                          color: element.color || '#000000'
                        }}
                      >
                        {element.content.slice(0, 20)}...
                      </div>
                    ))}
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded">
                      <div className="text-lg font-bold text-blue-600">{generatedResult.elements.length}</div>
                      <div className="text-xs text-muted-foreground">Elements</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded">
                      <div className="text-lg font-bold text-green-600">{generatedResult.goalCategories.length}</div>
                      <div className="text-xs text-muted-foreground">Goal Areas</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded">
                      <div className="text-lg font-bold text-purple-600">{generatedResult.personalizedInsights.length}</div>
                      <div className="text-xs text-muted-foreground">Insights</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded">
                      <div className="text-lg font-bold text-orange-600">{generatedResult.manifestationTips.length}</div>
                      <div className="text-xs text-muted-foreground">Tips</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insights and tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personalized Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {generatedResult.personalizedInsights.map((insight, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {index + 1}
                          </Badge>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Manifestation Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {generatedResult.manifestationTips.map((tip, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <Lightbulb className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setGeneratedResult(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Generate New
                </Button>
                <Button
                  onClick={handleUseGenerated}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Use This Vision Board
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}