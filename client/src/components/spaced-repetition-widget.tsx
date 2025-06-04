import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Target,
  TrendingUp,
  Star,
  AlertCircle
} from "lucide-react";

interface ConceptToReview {
  concept: {
    id: number;
    conceptKey: string;
    conceptTitle: string;
    conceptContent: string;
    sourceDay: number;
    difficultyLevel: number;
  };
  isOverdue: boolean;
  daysSinceLastReview: number;
  priority: number;
}

interface MasteryStats {
  totalConcepts: number;
  masteredConcepts: number;
  reviewingConcepts: number;
  strugglingConcepts: number;
  averageEasinessFactor: number;
}

interface SpacedRepetitionWidgetProps {
  challengeType: string;
  onReviewComplete?: () => void;
}

export default function SpacedRepetitionWidget({ 
  challengeType, 
  onReviewComplete 
}: SpacedRepetitionWidgetProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewStartTime, setReviewStartTime] = useState<Date | null>(null);

  // Fetch concepts due for review
  const { data: dueReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['/api/spaced-repetition/due-reviews', challengeType],
    enabled: isAuthenticated,
  });

  // Fetch mastery statistics
  const { data: masteryStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/spaced-repetition/mastery-stats', challengeType],
    enabled: isAuthenticated,
  });

  // Record review mutation
  const recordReviewMutation = useMutation({
    mutationFn: async ({ conceptId, quality, responseTime, wasSuccessful }: {
      conceptId: number;
      quality: number;
      responseTime: number;
      wasSuccessful: boolean;
    }) => {
      return await apiRequest('/api/spaced-repetition/record-review', {
        method: 'POST',
        body: JSON.stringify({ conceptId, quality, responseTime, wasSuccessful }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaced-repetition/due-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/spaced-repetition/mastery-stats'] });
      
      if (currentReviewIndex < (dueReviews?.length || 0) - 1) {
        setCurrentReviewIndex(prev => prev + 1);
        setShowAnswer(false);
        setReviewStartTime(new Date());
      } else {
        toast({
          title: "Review Session Complete!",
          description: "Great job reinforcing your quantum consciousness knowledge.",
        });
        onReviewComplete?.();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record review. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleQualityRating = (quality: number) => {
    if (!dueReviews || !reviewStartTime) return;

    const currentConcept = dueReviews[currentReviewIndex];
    const responseTime = Math.floor((new Date().getTime() - reviewStartTime.getTime()) / 1000);
    
    recordReviewMutation.mutate({
      conceptId: currentConcept.concept.id,
      quality,
      responseTime,
      wasSuccessful: quality >= 3
    });
  };

  const startReview = () => {
    setCurrentReviewIndex(0);
    setShowAnswer(false);
    setReviewStartTime(new Date());
  };

  useEffect(() => {
    if (dueReviews && dueReviews.length > 0 && !reviewStartTime) {
      setReviewStartTime(new Date());
    }
  }, [dueReviews, reviewStartTime]);

  if (!isAuthenticated) return null;

  if (reviewsLoading || statsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 animate-pulse" />
            <span>Loading spaced repetition data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentConcept = dueReviews?.[currentReviewIndex];
  const hasReviews = dueReviews && dueReviews.length > 0;

  return (
    <div className="space-y-6">
      {/* Mastery Statistics */}
      {masteryStats && masteryStats.totalConcepts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Learning Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {masteryStats.masteredConcepts}
                </div>
                <div className="text-sm text-gray-600">Mastered</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {masteryStats.reviewingConcepts}
                </div>
                <div className="text-sm text-gray-600">Learning</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-600">
                  {masteryStats.strugglingConcepts}
                </div>
                <div className="text-sm text-gray-600">Struggling</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-600">
                  {masteryStats.totalConcepts}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mastery Progress</span>
                <span>{Math.round((masteryStats.masteredConcepts / masteryStats.totalConcepts) * 100)}%</span>
              </div>
              <Progress 
                value={(masteryStats.masteredConcepts / masteryStats.totalConcepts) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Session */}
      {hasReviews ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-blue-500" />
                <span>Spaced Repetition Review</span>
              </div>
              <Badge variant="outline">
                {currentReviewIndex + 1} of {dueReviews.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentConcept && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={currentConcept.isOverdue ? "destructive" : "secondary"}
                      className="flex items-center space-x-1"
                    >
                      {currentConcept.isOverdue ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>
                        {currentConcept.isOverdue 
                          ? `${currentConcept.daysSinceLastReview} days overdue` 
                          : "Due today"}
                      </span>
                    </Badge>
                    <Badge variant="outline">
                      Day {currentConcept.concept.sourceDay}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">
                      {currentConcept.concept.conceptTitle}
                    </h3>
                    
                    {!showAnswer ? (
                      <div className="space-y-4">
                        <p className="text-gray-600">
                          Try to recall this quantum consciousness concept:
                        </p>
                        <Button 
                          onClick={() => setShowAnswer(true)}
                          className="w-full"
                          variant="outline"
                        >
                          Show Answer
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-800">
                            {currentConcept.concept.conceptContent}
                          </p>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <p className="font-medium text-center">
                            How well did you recall this concept?
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <Button
                              onClick={() => handleQualityRating(0)}
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              disabled={recordReviewMutation.isPending}
                            >
                              No recall
                            </Button>
                            <Button
                              onClick={() => handleQualityRating(2)}
                              variant="outline"
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              disabled={recordReviewMutation.isPending}
                            >
                              Difficult
                            </Button>
                            <Button
                              onClick={() => handleQualityRating(3)}
                              variant="outline"
                              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                              disabled={recordReviewMutation.isPending}
                            >
                              Hesitant
                            </Button>
                            <Button
                              onClick={() => handleQualityRating(4)}
                              variant="outline"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              disabled={recordReviewMutation.isPending}
                            >
                              Good
                            </Button>
                            <Button
                              onClick={() => handleQualityRating(5)}
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              disabled={recordReviewMutation.isPending}
                            >
                              Perfect
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">All Caught Up!</h3>
              <p className="text-gray-600">
                No concepts are due for review today. Great job staying on top of your quantum consciousness learning!
              </p>
              {masteryStats && masteryStats.totalConcepts === 0 && (
                <p className="text-sm text-gray-500">
                  Complete some challenge days to start building your spaced repetition library.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}