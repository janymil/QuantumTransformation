import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Quote, Bookmark, Share2, Copy, Twitter, Facebook, MessageCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EnhancedAffirmationsSectionProps {
  affirmations: string[];
  dayNumber: number;
  challengeType: string;
}

export default function EnhancedAffirmationsSection({ 
  affirmations, 
  dayNumber, 
  challengeType 
}: EnhancedAffirmationsSectionProps) {
  const [savedAffirmations, setSavedAffirmations] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Enhanced affirmations list including your specific one
  const enhancedAffirmations = [
    "I am now living in total financial freedom. Money flows to me easily, frequently, and from multiple sources.",
    ...affirmations.filter(Boolean)
  ];

  const saveMutation = useMutation({
    mutationFn: async (affirmation: string) => {
      return apiRequest("/api/saved-phrases", "POST", {
        text: affirmation,
        category: "affirmation",
        day: dayNumber,
        challengeType
      });
    },
    onSuccess: (_, affirmation) => {
      setSavedAffirmations(prev => new Set(Array.from(prev).concat([affirmation])));
      queryClient.invalidateQueries({ queryKey: ["/api/saved-phrases"] });
      toast({
        title: "Affirmation saved!",
        description: "Added to your personal collection",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving affirmation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = (affirmation: string) => {
    if (!savedAffirmations.has(affirmation)) {
      saveMutation.mutate(affirmation);
    }
  };

  const handleShare = (affirmation: string, platform?: string) => {
    const text = `"${affirmation}" - Day ${dayNumber} of my transformation journey`;
    const url = window.location.href;

    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        toast({
          title: "Copied to clipboard!",
          description: "Share your affirmation anywhere",
        });
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Quote className="w-6 h-6 mr-2 text-primary" />
          Today's Affirmations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {enhancedAffirmations.map((affirmation, index) => (
            <div key={index} className="relative">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <blockquote className="text-lg font-medium text-foreground mb-4 leading-relaxed">
                  "{affirmation}"
                </blockquote>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    Day {dayNumber} • {challengeType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(affirmation)}
                      disabled={savedAffirmations.has(affirmation) || saveMutation.isPending}
                      className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                    >
                      {savedAffirmations.has(affirmation) ? (
                        <>
                          <Heart className="w-4 h-4 mr-1 fill-current" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleShare(affirmation)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy to Clipboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(affirmation, "twitter")}>
                          <Twitter className="w-4 h-4 mr-2" />
                          Share on Twitter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(affirmation, "facebook")}>
                          <Facebook className="w-4 h-4 mr-2" />
                          Share on Facebook
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(affirmation, "whatsapp")}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Share on WhatsApp
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-pink-500" />
              How to Use These Affirmations
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Repeat each affirmation with strong emotion and conviction</li>
              <li>• Visualize the affirmation as already true while saying it</li>
              <li>• Use them during meditation, before sleep, or throughout the day</li>
              <li>• Feel the emotions these statements would create if they were your reality</li>
              <li>• Save your favorites to revisit them anytime</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}