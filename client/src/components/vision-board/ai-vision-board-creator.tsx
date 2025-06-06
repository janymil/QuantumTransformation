import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Target, Heart, Banknote, Home, Users, Plane, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AIVisionBoardCreatorProps {
  onVisionBoardGenerated: (visionBoardData: any) => void;
}

interface VisionBoardElement {
  id: string;
  type: 'text' | 'image' | 'icon';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
  };
  reasoning: string;
}

interface GeneratedVisionBoard {
  title: string;
  theme: string;
  backgroundColor: string;
  elements: VisionBoardElement[];
  personalizedInsights: string[];
  goalCategories: string[];
  manifestationTips: string[];
}

const GOAL_CATEGORIES = [
  { id: 'financial', name: 'Financial', icon: Banknote, color: 'bg-green-100 text-green-800' },
  { id: 'career', name: 'Career', icon: Trophy, color: 'bg-blue-100 text-blue-800' },
  { id: 'health', name: 'Health', icon: Heart, color: 'bg-red-100 text-red-800' },
  { id: 'relationships', name: 'Relationships', icon: Users, color: 'bg-purple-100 text-purple-800' },
  { id: 'personal', name: 'Personal Growth', icon: Target, color: 'bg-orange-100 text-orange-800' },
  { id: 'travel', name: 'Travel & Adventure', icon: Plane, color: 'bg-cyan-100 text-cyan-800' },
  { id: 'lifestyle', name: 'Lifestyle', icon: Home, color: 'bg-yellow-100 text-yellow-800' }
];

export default function AIVisionBoardCreator({ onVisionBoardGenerated }: AIVisionBoardCreatorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedBoard, setGeneratedBoard] = useState<GeneratedVisionBoard | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const analyzeUserData = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStep('Analyzing your journal entries...');
    
    try {
      // Step 1: Analyze journal entries
      setAnalysisProgress(20);
      setCurrentStep('Reviewing your affirmations...');
      
      // Step 2: Process affirmations
      setAnalysisProgress(40);
      setCurrentStep('Examining your goals and challenges...');
      
      // Step 3: Analyze goals and challenges
      setAnalysisProgress(60);
      setCurrentStep('Creating personalized vision board...');
      
      // Step 4: Generate vision board
      const response = await fetch('/api/ai/generate-vision-board', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          includeJournals: true,
          includeAffirmations: true,
          includeChallenges: true,
          includeUserProfile: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate vision board');
      }

      const data = await response.json();

      setAnalysisProgress(80);
      setCurrentStep('Finalizing your personalized board...');
      
      if (response.visionBoard) {
        setGeneratedBoard(response.visionBoard);
        setAnalysisProgress(100);
        setCurrentStep('Complete! Your AI-generated vision board is ready.');
        
        toast({
          title: "Vision Board Generated!",
          description: "AI has created a personalized vision board based on your data."
        });
      } else {
        throw new Error('No vision board data received');
      }
      
    } catch (error: any) {
      console.error('Error generating AI vision board:', error);
      
      if (error.message?.includes('429') || error.message?.includes('limit')) {
        toast({
          title: "Usage Limit Reached",
          description: "You've reached your daily AI limit. This feature requires premium access.",
          variant: "destructive"
        });
      } else if (error.message?.includes('insufficient data')) {
        toast({
          title: "More Data Needed",
          description: "Please add more journal entries, affirmations, or goals for better AI analysis.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Generation Failed", 
          description: "Failed to generate vision board. Please try again.",
          variant: "destructive"
        });
      }
      
      setCurrentStep('');
      setAnalysisProgress(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyGeneratedBoard = () => {
    if (!generatedBoard) return;
    
    onVisionBoardGenerated(generatedBoard);
    setIsOpen(false);
    
    toast({
      title: "Vision Board Applied",
      description: "Your AI-generated vision board has been loaded into the editor."
    });
  };

  const regenerateBoard = () => {
    setGeneratedBoard(null);
    analyzeUserData();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Brain className="w-4 h-4" />
          AI Create Board
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Vision Board Creator
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!isAnalyzing && !generatedBoard && (
            <div className="space-y-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold">Create Your Perfect Vision Board</h3>
                <p className="text-muted-foreground">
                  AI will analyze your journal entries, affirmations, goals, and personal data to create 
                  a completely personalized vision board designed specifically for your aspirations.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">What AI Will Analyze</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Journal Entries
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      Saved Affirmations
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      Challenge Progress
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      Personal Goals
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={analyzeUserData}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                <Brain className="w-4 h-4 mr-2" />
                Analyze My Data & Create Board
              </Button>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold">AI is Analyzing Your Data</h3>
                <p className="text-muted-foreground">{currentStep}</p>
              </div>

              <div className="space-y-2">
                <Progress value={analysisProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {analysisProgress}% Complete
                </p>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted rounded">
                <p>🧠 AI is processing your personal data to understand your goals</p>
                <p>🎯 Identifying patterns in your aspirations and motivations</p>
                <p>🎨 Creating a personalized visual representation of your dreams</p>
              </div>
            </div>
          )}

          {generatedBoard && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">{generatedBoard.title}</h3>
                <Badge variant="secondary">{generatedBoard.theme}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Goal Categories Identified</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {generatedBoard.goalCategories.map((category, index) => {
                        const categoryInfo = GOAL_CATEGORIES.find(c => c.id === category);
                        const Icon = categoryInfo?.icon || Target;
                        return (
                          <Badge key={index} variant="outline" className={categoryInfo?.color}>
                            <Icon className="w-3 h-3 mr-1" />
                            {categoryInfo?.name || category}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Board Elements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {generatedBoard.elements.length} personalized elements
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {generatedBoard.elements.slice(0, 6).map((element, index) => (
                          <div 
                            key={index}
                            className="h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded text-xs flex items-center justify-center"
                          >
                            {element.type}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Personalized Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generatedBoard.personalizedInsights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button 
                  onClick={applyGeneratedBoard}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  Apply This Board
                </Button>
                <Button 
                  onClick={regenerateBoard}
                  variant="outline"
                  className="flex-1"
                >
                  Generate New Board
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted rounded">
            <p>🎯 <strong>Premium Feature:</strong> AI vision board generation uses advanced analysis</p>
            <p>📊 Requires sufficient personal data for accurate personalization</p>
            <p>🔄 You can regenerate boards with different styles and focuses</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}