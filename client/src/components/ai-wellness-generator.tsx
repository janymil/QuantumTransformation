import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain, 
  Lightbulb, 
  Target, 
  CheckCircle, 
  RefreshCw, 
  Bookmark,
  Share2,
  Clock,
  Zap,
  Heart,
  Sparkles,
  Calendar,
  TrendingUp
} from "lucide-react";

interface WellnessTip {
  id: string;
  category: string;
  title: string;
  description: string;
  scientificBasis: string;
  practicalSteps: string[];
  timeRequired: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: string;
}

interface MicroChallenge {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  duration: number;
  category: string;
  points: number;
  completed: boolean;
  completedAt?: string;
}

interface AIWellnessGeneratorProps {
  currentDay: number;
  userPreferences?: {
    focusAreas: string[];
    availableTime: number;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  };
}

const categories = [
  { name: 'Mindfulness', icon: Brain, color: 'bg-blue-500' },
  { name: 'Energy', icon: Zap, color: 'bg-yellow-500' },
  { name: 'Focus', icon: Target, color: 'bg-green-500' },
  { name: 'Emotional Wellness', icon: Heart, color: 'bg-red-500' },
  { name: 'Productivity', icon: TrendingUp, color: 'bg-purple-500' },
  { name: 'Stress Relief', icon: Sparkles, color: 'bg-pink-500' }
];

export default function AIWellnessGenerator({ 
  currentDay, 
  userPreferences 
}: AIWellnessGeneratorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Mindfulness');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedTips, setSavedTips] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch daily wellness tip
  const { data: dailyTip, isLoading: tipLoading, refetch: refetchTip } = useQuery<WellnessTip>({
    queryKey: ['/api/wellness/daily-tip', currentDay, selectedCategory],
    enabled: !!currentDay,
  });

  // Fetch daily micro-challenges
  const { data: microChallenges, isLoading: challengesLoading } = useQuery<MicroChallenge[]>({
    queryKey: ['/api/wellness/micro-challenges', currentDay],
    enabled: !!currentDay,
  });

  // Generate new tip mutation
  const generateTipMutation = useMutation({
    mutationFn: async (category: string) => {
      setIsGenerating(true);
      return await apiRequest('/api/wellness/generate-tip', {
        method: 'POST',
        body: JSON.stringify({
          category,
          day: currentDay,
          preferences: userPreferences
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wellness/daily-tip'] });
      toast({
        title: "New Tip Generated",
        description: "Your personalized wellness tip has been created.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Unable to generate new tip. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  // Complete micro-challenge mutation
  const completeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      return await apiRequest(`/api/wellness/complete-challenge/${challengeId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wellness/micro-challenges'] });
      toast({
        title: "Challenge Completed!",
        description: "Great job! You've earned wellness points.",
      });
    }
  });

  // Save tip mutation
  const saveTipMutation = useMutation({
    mutationFn: async (tipId: string) => {
      return await apiRequest('/api/wellness/save-tip', {
        method: 'POST',
        body: JSON.stringify({ tipId }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      setSavedTips(prev => [...prev, dailyTip?.id || '']);
      toast({
        title: "Tip Saved",
        description: "Added to your wellness collection.",
      });
    }
  });

  const handleGenerateNew = () => {
    generateTipMutation.mutate(selectedCategory);
  };

  const handleCompleteChallenge = (challengeId: string) => {
    completeMutation.mutate(challengeId);
  };

  const handleSaveTip = () => {
    if (dailyTip) {
      saveTipMutation.mutate(dailyTip.id);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completedChallenges = microChallenges?.filter(c => c.completed).length || 0;
  const totalChallenges = microChallenges?.length || 0;
  const progressPercentage = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Daily Wellness Tip */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <span>AI Wellness Tip</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateNew}
                disabled={isGenerating}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                Generate New
              </Button>
              {dailyTip && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveTip}
                  disabled={savedTips.includes(dailyTip.id)}
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name)}
                  className="flex items-center space-x-1"
                >
                  <IconComponent className="w-3 h-3" />
                  <span>{category.name}</span>
                </Button>
              );
            })}
          </div>

          {tipLoading ? (
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : dailyTip ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{dailyTip.title}</h3>
                <p className="text-gray-600 mt-1">{dailyTip.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={getDifficultyColor(dailyTip.difficulty)}>
                  {dailyTip.difficulty}
                </Badge>
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {dailyTip.timeRequired} min
                </Badge>
                {dailyTip.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>

              <div className="bg-white/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">How to Practice:</h4>
                <ol className="space-y-2">
                  {dailyTip.practicalSteps.map((step, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <details className="bg-white/30 rounded-lg p-3">
                <summary className="cursor-pointer font-medium text-gray-800 hover:text-gray-900">
                  Scientific Background
                </summary>
                <p className="text-sm text-gray-600 mt-2">{dailyTip.scientificBasis}</p>
              </details>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Generate your first personalized wellness tip</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Micro-Challenges */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-500" />
              <span>Daily Micro-Challenges</span>
            </CardTitle>
            <Badge variant="secondary">
              {completedChallenges}/{totalChallenges} completed
            </Badge>
          </div>
          {totalChallenges > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {challengesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : microChallenges && microChallenges.length > 0 ? (
            <div className="space-y-4">
              {microChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className={`border rounded-lg p-4 transition-all ${
                    challenge.completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-medium ${
                          challenge.completed ? 'text-green-800' : 'text-gray-900'
                        }`}>
                          {challenge.title}
                        </h4>
                        {challenge.completed && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      
                      <p className={`text-sm ${
                        challenge.completed ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {challenge.description}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{challenge.duration} min</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Zap className="w-3 h-3" />
                          <span>{challenge.points} points</span>
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {challenge.category}
                        </Badge>
                      </div>
                    </div>

                    {!challenge.completed && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteChallenge(challenge.id)}
                        disabled={completeMutation.isPending}
                      >
                        Complete
                      </Button>
                    )}
                  </div>

                  {challenge.completed && challenge.completedAt && (
                    <div className="mt-2 text-xs text-green-600">
                      Completed on {new Date(challenge.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No challenges available for today</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}