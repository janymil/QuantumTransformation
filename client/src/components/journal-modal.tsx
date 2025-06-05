import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, BookOpen, Heart, Lightbulb, Target, Loader2 } from "lucide-react";

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: number;
  title?: string;
  challengeType?: string;
}

interface JournalEntry {
  id: number;
  day: number;
  experience: string;
  insights: string;
  intention: string;
  createdAt: string;
  updatedAt: string;
}

export default function JournalModal({ 
  isOpen, 
  onClose, 
  day, 
  title,
  challengeType = "general_quantum"
}: JournalModalProps) {
  const { toast } = useToast();
  const [experience, setExperience] = useState("");
  const [insights, setInsights] = useState("");
  const [intention, setIntention] = useState("");

  // Clear form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExperience("");
      setInsights("");
      setIntention("");
    }
  }, [isOpen]);

  const { data: existingEntry, isLoading } = useQuery<JournalEntry>({
    queryKey: ["/api/journal/entry", challengeType, day],
    queryFn: async () => {
      console.log(`Fetching journal entry for challenge: ${challengeType}, day: ${day}`);
      const response = await fetch(`/api/journal?day=${day}&challengeType=${challengeType}`, {
        credentials: "include",
      });
      if (response.status === 404) {
        console.log(`No existing entry found for ${challengeType} day ${day}`);
        return null;
      }
      if (!response.ok) throw new Error("Failed to fetch journal entry");
      const data = await response.json();
      console.log(`Loaded existing entry for ${challengeType} day ${day}:`, data);
      return data;
    },
    enabled: isOpen,
  });

  // Populate form with fresh data when entry loads
  useEffect(() => {
    if (isOpen) {
      if (existingEntry) {
        console.log(`Populating form with existing entry:`, existingEntry);
        setExperience(existingEntry.experience || "");
        setInsights(existingEntry.insights || "");
        setIntention(existingEntry.intention || "");
      } else if (!isLoading) {
        console.log(`No existing entry - clearing form for ${challengeType} day ${day}`);
        setExperience("");
        setInsights("");
        setIntention("");
      }
    }
  }, [existingEntry, isLoading, isOpen, challengeType, day]);

  const saveMutation = useMutation({
    mutationFn: async (data: { experience: string; insights: string; intention: string }) => {
      console.log("Journal Modal - Saving entry for day:", day, "with data:", data);
      const result = await apiRequest("POST", "/api/journal", {
        day,
        challengeType,
        ...data,
      });
      console.log("Journal Modal - Save result:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal", day] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal", day, challengeType] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal/analyze"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal/archived"] });
      toast({
        title: "Journal Saved",
        description: "Your journal entry has been saved successfully.",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });



  const handleSave = () => {
    saveMutation.mutate({
      experience,
      insights,
      intention,
    });
  };

  const handleClose = () => {
    onClose();
    // Reset form after a delay to avoid visual glitch
    setTimeout(() => {
      setExperience("");
      setInsights("");
      setIntention("");
    }, 300);
  };

  const hasContent = experience.trim() || insights.trim() || intention.trim();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mr-3">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              Daily Journal - Day {day}
            </div>
            {title && (
              <Badge variant="outline" className="ml-2 text-xs">
                {title}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading journal entry...</span>
          </div>
        ) : (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            
            {/* Experience Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <label className="text-sm font-medium text-foreground">
                  How did today's practice feel?
                </label>
              </div>
              <Textarea
                placeholder="Describe your experience with today's quantum practice. How did your body feel? What emotions came up? Any physical sensations or energy shifts?"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={4}
                className="resize-none focus-ring"
              />
              <p className="text-xs text-muted-foreground">
                Reflect on the physical and emotional aspects of your practice
              </p>
            </div>

            <Separator />

            {/* Insights Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <label className="text-sm font-medium text-foreground">
                  What insights did you gain?
                </label>
              </div>
              <Textarea
                placeholder="Share your realizations, breakthroughs, or 'aha' moments. What new understanding emerged? How did the concepts resonate with you?"
                value={insights}
                onChange={(e) => setInsights(e.target.value)}
                rows={4}
                className="resize-none focus-ring"
              />
              <p className="text-xs text-muted-foreground">
                Capture any mental shifts, realizations, or new perspectives
              </p>
            </div>

            <Separator />

            {/* Intention Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <label className="text-sm font-medium text-foreground">
                  Intention for tomorrow
                </label>
              </div>
              <Textarea
                placeholder="Set your intention for the next day. What do you want to focus on? How will you apply today's learnings? What energy do you want to cultivate?"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                rows={3}
                className="resize-none focus-ring"
              />
              <p className="text-xs text-muted-foreground">
                Create a clear intention to bridge today's practice with tomorrow's
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            {existingEntry && (
              <Badge variant="outline" className="text-xs">
                Last saved: {new Date(existingEntry.updatedAt).toLocaleDateString()}
              </Badge>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending || !hasContent}
              className="min-w-[100px]"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Entry
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Helpful Tips */}
        {!hasContent && !isLoading && (
          <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary">
            <h4 className="font-medium text-foreground mb-2">Journaling Tips:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Be honest and authentic in your reflections</li>
              <li>• Notice both challenges and successes</li>
              <li>• Write as if you're talking to a trusted friend</li>
              <li>• Don't worry about perfect grammar or spelling</li>
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
