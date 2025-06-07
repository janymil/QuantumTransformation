import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Brain, Lightbulb, TrendingUp, Palette, Type, Image, Layout } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { AISuggestion, VisionBoard, VisionBoardItem } from "./vision-board-types";

interface AISuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoard: VisionBoard;
  onApplySuggestion: (suggestion: AISuggestion) => void;
}

export default function AISuggestions({
  isOpen,
  onClose,
  currentBoard,
  onApplySuggestion
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const { toast } = useToast();

  // Generate AI suggestions using existing backend endpoint
  const generateSuggestionsMutation = useMutation({
    mutationFn: async (board: VisionBoard) => {
      const response = await fetch('/api/ai/get-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          visionBoard: board,
          analysisType: 'comprehensive',
          includeUserData: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate suggestions');
      }

      return response.json();
    },
    onSuccess: (result) => {
      setSuggestions(result.suggestions || []);
      toast({
        title: "AI Analysis Complete",
        description: `Generated ${result.suggestions?.length || 0} personalized suggestions`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Auto-generate suggestions when dialog opens
  useEffect(() => {
    if (isOpen && currentBoard.canvasData.items.length > 0) {
      generateSuggestionsMutation.mutate(currentBoard);
    }
  }, [isOpen, currentBoard]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'element':
        return <Lightbulb className="w-4 h-4" />;
      case 'layout':
        return <Layout className="w-4 h-4" />;
      case 'color':
        return <Palette className="w-4 h-4" />;
      case 'text':
        return <Type className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
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
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    onApplySuggestion(suggestion);
    toast({
      title: "Suggestion Applied",
      description: suggestion.title
    });
  };

  const handleRefreshSuggestions = () => {
    if (currentBoard.canvasData.items.length > 0) {
      generateSuggestionsMutation.mutate(currentBoard);
    } else {
      toast({
        title: "Add Content First",
        description: "Add some elements to your vision board to get AI suggestions",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI Vision Board Suggestions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with refresh button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Personalized suggestions based on your vision board content and goals
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSuggestions}
              disabled={generateSuggestionsMutation.isPending}
            >
              {generateSuggestionsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Refresh Analysis
            </Button>
          </div>

          {/* Loading state */}
          {generateSuggestionsMutation.isPending && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-lg font-medium">Analyzing Your Vision Board</p>
                <p className="text-sm text-muted-foreground">
                  AI is studying your content, goals, and personal patterns...
                </p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!generateSuggestionsMutation.isPending && suggestions.length === 0 && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No Suggestions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add some elements to your vision board to get AI-powered suggestions
              </p>
              <Button onClick={handleRefreshSuggestions} variant="outline">
                Analyze Board
              </Button>
            </div>
          )}

          {/* Suggestions grid */}
          {suggestions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getSuggestionIcon(suggestion.type)}
                        <CardTitle className="text-base">{suggestion.title}</CardTitle>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getSuggestionPriorityColor(suggestion.priority)}
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {suggestion.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <strong>Why this suggestion:</strong> {suggestion.reasoning}
                      </div>
                      
                      {suggestion.actionable && (
                        <Button
                          size="sm"
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="w-full"
                        >
                          <TrendingUp className="w-3 h-3 mr-2" />
                          Apply Suggestion
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* AI insights footer */}
          {suggestions.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-2 text-blue-900">AI Analysis Summary:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {suggestions.filter(s => s.priority === 'high').length}
                  </div>
                  <div className="text-blue-800">High Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {suggestions.filter(s => s.actionable).length}
                  </div>
                  <div className="text-purple-800">Actionable</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {suggestions.filter(s => s.type === 'element').length}
                  </div>
                  <div className="text-green-800">Content Ideas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {suggestions.filter(s => s.type === 'layout').length}
                  </div>
                  <div className="text-orange-800">Layout Tips</div>
                </div>
              </div>
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