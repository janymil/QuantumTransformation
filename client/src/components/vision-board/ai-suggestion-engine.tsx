import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Target, Heart, Lightbulb, TrendingUp, Brain } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VisionBoardItem {
  id: string;
  type: 'image' | 'text' | 'shape' | 'svg';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  styling: any;
}

interface VisionBoard {
  title: string;
  description: string;
  canvasData: {
    items: VisionBoardItem[];
    canvasWidth: number;
    canvasHeight: number;
    backgroundColor: string;
  };
  templateCategory: string;
}

interface AISuggestion {
  type: 'text' | 'image' | 'element' | 'color' | 'layout';
  title: string;
  description: string;
  content: string;
  reasoning: string;
  confidence: number;
  category: string;
  preview?: string;
}

interface AISuggestionEngineProps {
  board: VisionBoard;
  onAddSuggestion: (suggestion: AISuggestion) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function AISuggestionEngine({ 
  board, 
  onAddSuggestion, 
  onClose, 
  isOpen 
}: AISuggestionEngineProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [userGoals, setUserGoals] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const focusAreas = [
    { id: 'financial', label: 'Financial Abundance', icon: TrendingUp },
    { id: 'career', label: 'Career Success', icon: Target },
    { id: 'relationships', label: 'Love & Relationships', icon: Heart },
    { id: 'health', label: 'Health & Wellness', icon: Sparkles },
    { id: 'personal', label: 'Personal Growth', icon: Brain },
    { id: 'creative', label: 'Creative Expression', icon: Lightbulb }
  ];

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      // Analyze current board content
      const currentContent = analyzeCurrentBoard();
      
      // Create AI prompt for suggestions
      const prompt = createSuggestionPrompt(currentContent);
      
      // Call AI service
      const response = await fetch('/api/ai/vision-board-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardData: {
            title: board.title,
            description: board.description,
            items: board.canvasData.items,
            backgroundColor: board.canvasData.backgroundColor
          },
          userGoals,
          focusArea,
          currentContent: prompt
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const aiSuggestions = await response.json();
      setSuggestions(aiSuggestions.suggestions);
      setAnalysisComplete(true);
    } catch (error) {
      toast({
        title: "Suggestion Generation Failed",
        description: "Unable to generate AI suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeCurrentBoard = () => {
    const items = board.canvasData.items;
    const textItems = items.filter(item => item.type === 'text').map(item => item.content);
    const imageCount = items.filter(item => item.type === 'image').length;
    const svgElements = items.filter(item => item.type === 'svg').length;
    
    return {
      totalItems: items.length,
      textContent: textItems.join(' '),
      imageCount,
      svgElements,
      backgroundColor: board.canvasData.backgroundColor,
      title: board.title,
      description: board.description,
      isEmpty: items.length === 0
    };
  };

  const createSuggestionPrompt = (content: any) => {
    return `
      Vision Board Analysis:
      - Title: ${content.title}
      - Description: ${content.description}
      - Current items: ${content.totalItems}
      - Text content: ${content.textContent}
      - Images: ${content.imageCount}
      - SVG elements: ${content.svgElements}
      - Background: ${content.backgroundColor}
      - User goals: ${userGoals}
      - Focus area: ${focusArea}
      - Is empty: ${content.isEmpty}
    `;
  };

  const applySuggestion = (suggestion: AISuggestion) => {
    onAddSuggestion(suggestion);
    toast({
      title: "Suggestion Applied",
      description: `Added ${suggestion.type}: ${suggestion.title}`,
    });
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'text': return '💬';
      case 'image': return '🖼️';
      case 'element': return '⭐';
      case 'color': return '🎨';
      case 'layout': return '📐';
      default: return '✨';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Vision Board Suggestions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Goal Input Section */}
          {!analysisComplete && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tell AI About Your Vision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="goals">What are your main goals and aspirations?</Label>
                  <Textarea
                    id="goals"
                    placeholder="Describe your dreams, goals, and what you want to manifest in your life..."
                    value={userGoals}
                    onChange={(e) => setUserGoals(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Primary Focus Area</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {focusAreas.map((area) => {
                      const Icon = area.icon;
                      return (
                        <button
                          key={area.id}
                          onClick={() => setFocusArea(area.id)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                            focusArea === area.id
                              ? 'bg-purple-100 border-purple-300 text-purple-700'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4 mx-auto mb-1" />
                          {area.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button 
                  onClick={generateSuggestions}
                  disabled={loading || !userGoals.trim() || !focusArea}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing & Generating Suggestions...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate AI Suggestions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Suggestions Display */}
          {analysisComplete && suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">AI Recommendations ({suggestions.length})</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setAnalysisComplete(false);
                    setSuggestions([]);
                  }}
                >
                  Generate New Suggestions
                </Button>
              </div>

              <div className="grid gap-4">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                            <h4 className="font-semibold">{suggestion.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.category}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}
                            >
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.description}
                          </p>
                          
                          <p className="text-xs text-gray-500 italic">
                            AI Reasoning: {suggestion.reasoning}
                          </p>
                          
                          {suggestion.preview && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              Preview: {suggestion.preview}
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                          className="ml-4"
                        >
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {analysisComplete && suggestions.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Suggestions Generated
              </h3>
              <p className="text-gray-500 mb-4">
                Try providing more details about your goals or selecting a different focus area.
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setAnalysisComplete(false);
                  setSuggestions([]);
                }}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}