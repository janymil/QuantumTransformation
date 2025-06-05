import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Heart, Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PersonalizedAffirmationsProps {
  day?: number;
  challengeType?: string;
  onClose?: () => void;
}

export default function PersonalizedAffirmations({ day = 1, challengeType = "general", onClose }: PersonalizedAffirmationsProps) {
  const [userGoals, setUserGoals] = useState("");
  const [challenges, setChallenges] = useState("");
  const [mood, setMood] = useState<number>(5);
  const [progressLevel, setProgressLevel] = useState("beginner");
  const [generatedAffirmation, setGeneratedAffirmation] = useState("");
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/ai/personalized-affirmation", "POST", data);
    },
    onSuccess: (data) => {
      setGeneratedAffirmation(data.affirmation);
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Unable to generate personalized affirmation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveAffirmationMutation = useMutation({
    mutationFn: async (affirmation: string) => {
      return await apiRequest("/api/saved-phrases", "POST", {
        phrase: affirmation,
        category: "personalized",
        source: `Day ${day} - Personalized`
      });
    },
    onSuccess: () => {
      toast({
        title: "Saved!",
        description: "Affirmation saved to your collection.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Unable to save affirmation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generatePersonalizedAffirmation = () => {
    const recentInsights = challenges ? [challenges] : [];
    const currentChallenges = challenges ? challenges.split(',').map(c => c.trim()) : [];

    generateMutation.mutate({
      day,
      userGoals: userGoals || undefined,
      currentChallenges: currentChallenges.length > 0 ? currentChallenges : undefined,
      recentInsights: recentInsights.length > 0 ? recentInsights : undefined,
      mood,
      progressLevel
    });
  };

  const copyToClipboard = async () => {
    if (!generatedAffirmation) return;
    
    try {
      await navigator.clipboard.writeText(generatedAffirmation);
      toast({
        title: "Copied!",
        description: "Affirmation copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const shareAffirmation = async () => {
    if (!generatedAffirmation) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Personal Affirmation",
          text: generatedAffirmation,
        });
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const saveAffirmation = () => {
    if (!generatedAffirmation) return;
    saveAffirmationMutation.mutate(generatedAffirmation);
  };

  // Auto-generate initial affirmation
  useEffect(() => {
    generatePersonalizedAffirmation();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Personalized Affirmations</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Create affirmations tailored specifically to your goals and current state
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="goals">Your Current Goals</Label>
            <Textarea
              id="goals"
              placeholder="What are you working towards? (e.g., financial freedom, better relationships, health improvement)"
              value={userGoals}
              onChange={(e) => setUserGoals(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="challenges">Current Challenges</Label>
            <Input
              id="challenges"
              placeholder="What obstacles are you facing? (separate with commas)"
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mood">Current Mood (1-10)</Label>
              <Select value={mood.toString()} onValueChange={(value) => setMood(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} - {num <= 3 ? 'Low' : num <= 6 ? 'Moderate' : 'High'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="progress">Progress Level</Label>
              <Select value={progressLevel} onValueChange={setProgressLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={generatePersonalizedAffirmation}
            disabled={generateMutation.isPending}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New Affirmation
              </>
            )}
          </Button>
        </div>

        {/* Generated Affirmation */}
        {generatedAffirmation && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border-2 border-primary/20">
              <h3 className="text-lg font-semibold mb-3 text-center">Your Personalized Affirmation</h3>
              <p className="text-lg text-center leading-relaxed font-medium">
                "{generatedAffirmation}"
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-3">
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
              <Button onClick={shareAffirmation} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button 
                onClick={saveAffirmation} 
                variant="outline" 
                size="sm"
                disabled={saveAffirmationMutation.isPending}
              >
                {saveAffirmationMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Heart className="w-4 h-4 mr-1" />
                )}
                Save
              </Button>
            </div>

            {/* Tips */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">💡 How to Use Your Affirmation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Repeat it 3 times every morning</li>
                <li>• Say it with conviction and feeling</li>
                <li>• Visualize it as already true while speaking</li>
                <li>• Use it during challenging moments</li>
                <li>• Write it down and place it where you'll see it daily</li>
              </ul>
            </div>
          </div>
        )}

        {onClose && (
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}