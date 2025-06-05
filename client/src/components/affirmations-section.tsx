import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Heart, Star, Quote, Copy, Check } from "lucide-react";

interface AffirmationsProps {
  affirmations: string[];
  dayNumber: number;
  challengeType: string;
}

export default function AffirmationsSection({ affirmations, dayNumber, challengeType }: AffirmationsProps) {
  const [savedAffirmations, setSavedAffirmations] = useState<Set<string>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const saveAffirmationMutation = useMutation({
    mutationFn: async (affirmation: string) => {
      return apiRequest("/api/saved-phrases", "POST", {
        phrase: affirmation,
        category: "affirmation",
        source: `Day ${dayNumber} - ${challengeType}`,
        tags: ["affirmation", challengeType, `day-${dayNumber}`]
      });
    },
    onSuccess: (_, affirmation) => {
      setSavedAffirmations(prev => new Set(Array.from(prev).concat(affirmation)));
      toast({
        title: "Affirmation saved!",
        description: "Added to your personal collection",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-phrases"] });
    },
    onError: (error) => {
      toast({
        title: "Error saving affirmation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Affirmation ready to paste",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const extractAffirmations = (content: any): string[] => {
    const affirmations: string[] = [];
    
    // Extract main affirmation
    if (content.affirmation) {
      affirmations.push(content.affirmation);
    }
    
    // Extract affirmations from practice steps
    const searchInSteps = (steps: string[]) => {
      steps.forEach(step => {
        // Look for quoted affirmations
        const quotedMatches = step.match(/"([^"]+)"/g);
        if (quotedMatches) {
          quotedMatches.forEach(match => {
            const clean = match.replace(/"/g, '');
            if (clean.length > 10 && (clean.includes('I am') || clean.includes('I have') || clean.includes('I choose'))) {
              affirmations.push(clean);
            }
          });
        }
        
        // Look for single quoted affirmations
        const singleQuotedMatches = step.match(/'([^']+)'/g);
        if (singleQuotedMatches) {
          singleQuotedMatches.forEach(match => {
            const clean = match.replace(/'/g, '');
            if (clean.length > 10 && (clean.includes('I am') || clean.includes('I have') || clean.includes('I choose'))) {
              affirmations.push(clean);
            }
          });
        }
      });
    };
    
    // Search in practice sections
    if (content.practice) {
      if (content.practice.morning?.steps) searchInSteps(content.practice.morning.steps);
      if (content.practice.daytime?.steps) searchInSteps(content.practice.daytime.steps);
      if (content.practice.evening?.steps) searchInSteps(content.practice.evening.steps);
    }
    
    // Remove duplicates and filter for meaningful affirmations
    return Array.from(new Set(affirmations)).filter(aff => aff.length > 15);
  };

  const allAffirmations = extractAffirmations({ affirmation: affirmations[0], practice: { morning: { steps: affirmations } } });

  if (allAffirmations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Heart className="w-5 h-5 mr-2 text-pink-500" />
        <h3 className="text-lg font-semibold">Today's Affirmations</h3>
        <Badge variant="secondary" className="ml-2">
          {allAffirmations.length} affirmations
        </Badge>
      </div>
      
      <div className="grid gap-4">
        {allAffirmations.map((affirmation, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow border-l-4 border-l-pink-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Quote className="w-4 h-4 text-muted-foreground mb-2" />
                  <p className="text-lg leading-relaxed font-medium text-foreground italic">
                    "{affirmation}"
                  </p>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(affirmation, index)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => saveAffirmationMutation.mutate(affirmation)}
                    disabled={savedAffirmations.has(affirmation) || saveAffirmationMutation.isPending}
                    className="h-8 w-8 p-0"
                  >
                    <Star className={`w-4 h-4 ${savedAffirmations.has(affirmation) ? 'text-yellow-500 fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>Click the star to save affirmations to your personal collection</p>
      </div>
    </div>
  );
}