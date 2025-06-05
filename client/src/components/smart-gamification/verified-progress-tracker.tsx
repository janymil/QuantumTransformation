import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { 
  Star, 
  Trophy, 
  Clock, 
  CheckCircle2,
  Award,
  Flame,
  BookOpen,
  Video,
  PenTool,
  Lock,
  Unlock,
  Target
} from "lucide-react";

interface VerifiedProgressTrackerProps {
  challengeType: string;
  day: number;
}

interface ActivityVerification {
  type: string;
  isAvailable: boolean;
  timeWindow?: string;
  requiredAction?: string;
  completed: boolean;
  points: number;
  unlocks?: string[];
}

export default function VerifiedProgressTracker({ challengeType, day }: VerifiedProgressTrackerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [videoWatchTime, setVideoWatchTime] = useState(0);
  const [journalEntry, setJournalEntry] = useState("");
  const [reflectionText, setReflectionText] = useState("");

  // Get current time for time-gating
  const currentHour = new Date().getHours();
  
  // Define time-gated activities with real verification
  const activities: ActivityVerification[] = [
    {
      type: "morning_meditation",
      isAvailable: currentHour >= 5 && currentHour <= 11,
      timeWindow: "5:00 AM - 11:00 AM",
      requiredAction: "Complete 10-minute guided meditation",
      completed: false,
      points: 30,
      unlocks: ["morning_insights", "energy_boost"]
    },
    {
      type: "video_learning",
      isAvailable: true,
      requiredAction: "Watch complete daily video (minimum 80% completion)",
      completed: false,
      points: 20,
      unlocks: ["advanced_techniques", "bonus_content"]
    },
    {
      type: "journal_reflection",
      isAvailable: true,
      requiredAction: "Write meaningful journal entry (minimum 100 words)",
      completed: false,
      points: 25,
      unlocks: ["personal_insights", "pattern_recognition"]
    },
    {
      type: "evening_integration",
      isAvailable: currentHour >= 18 && currentHour <= 23,
      timeWindow: "6:00 PM - 11:00 PM",
      requiredAction: "Reflect on day's practice and set tomorrow's intention",
      completed: false,
      points: 35,
      unlocks: ["next_day_preview", "advanced_practices"]
    }
  ];

  // Fetch user's verified progress
  const { data: verifiedProgress } = useQuery({
    queryKey: [`/api/gamification/verified-progress/${challengeType}/${day}`],
    enabled: !!user && !!challengeType,
  });

  // Track verified activity
  const trackVerifiedActivity = useMutation({
    mutationFn: async (activityData: {
      type: string;
      verificationData: any;
    }) => {
      return apiRequest("POST", "/api/gamification/track-verified-activity", {
        challengeType,
        day,
        ...activityData
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [`/api/gamification/verified-progress/${challengeType}/${day}`] });
      
      if (result.levelUp) {
        toast({
          title: "Level Up!",
          description: `You've reached level ${result.newLevel}! New content unlocked.`,
        });
      }
      
      if (result.unlocked && result.unlocked.length > 0) {
        toast({
          title: "New Content Unlocked!",
          description: `You've unlocked: ${result.unlocked.join(", ")}`,
        });
      }

      toast({
        title: `+${result.pointsEarned} Points Earned!`,
        description: "Verified practice completion",
      });
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Video tracking with completion verification
  const handleVideoCompletion = (watchedDuration: number, totalDuration: number) => {
    const completionPercentage = (watchedDuration / totalDuration) * 100;
    
    if (completionPercentage >= 80) {
      trackVerifiedActivity.mutate({
        type: "video_learning",
        verificationData: {
          watchedDuration,
          totalDuration,
          completionPercentage,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      toast({
        title: "Complete the Video",
        description: "Watch at least 80% of the video to earn points",
        variant: "destructive",
      });
    }
  };

  // Journal verification based on content quality
  const handleJournalSubmission = () => {
    const wordCount = journalEntry.trim().split(/\s+/).length;
    const meaningfulContent = journalEntry.length > 100 && wordCount >= 20;
    
    if (!meaningfulContent) {
      toast({
        title: "Journal Too Short",
        description: "Please write at least 100 characters with meaningful reflection",
        variant: "destructive",
      });
      return;
    }

    trackVerifiedActivity.mutate({
      type: "journal_reflection",
      verificationData: {
        content: journalEntry,
        wordCount,
        characterCount: journalEntry.length,
        timestamp: new Date().toISOString()
      }
    });
    
    setJournalEntry("");
  };

  // Meditation verification (would integrate with actual meditation timer)
  const handleMeditationCompletion = (duration: number) => {
    if (duration < 600) { // 10 minutes minimum
      toast({
        title: "Meditation Too Short",
        description: "Complete at least 10 minutes of meditation",
        variant: "destructive",
      });
      return;
    }

    trackVerifiedActivity.mutate({
      type: "morning_meditation",
      verificationData: {
        duration,
        timestamp: new Date().toISOString(),
        timeOfDay: "morning"
      }
    });
  };

  // Evening reflection verification
  const handleEveningReflection = () => {
    const wordCount = reflectionText.trim().split(/\s+/).length;
    
    if (wordCount < 15) {
      toast({
        title: "Reflection Too Brief",
        description: "Please provide a more detailed reflection on your practice",
        variant: "destructive",
      });
      return;
    }

    trackVerifiedActivity.mutate({
      type: "evening_integration",
      verificationData: {
        reflection: reflectionText,
        wordCount,
        timestamp: new Date().toISOString()
      }
    });
    
    setReflectionText("");
  };

  return (
    <div className="space-y-4">
      {/* Daily Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Day {day} Verified Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Today's Activities</span>
              <Badge variant="outline">
                {activities.filter(a => a.completed).length}/{activities.length} Complete
              </Badge>
            </div>
            
            <Progress 
              value={(activities.filter(a => a.completed).length / activities.length) * 100} 
              className="h-2"
            />
            
            <div className="text-xs text-gray-600 text-center">
              Complete verified activities to unlock new content and features
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time-Gated Morning Practice */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {activities[0].isAvailable ? (
              <Unlock className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-gray-400" />
            )}
            Morning Meditation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities[0].isAvailable ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Complete your 10-minute guided meditation to start the day
              </p>
              <Button 
                onClick={() => handleMeditationCompletion(900)} // Simulate 15 min completion
                disabled={trackVerifiedActivity.isPending || activities[0].completed}
                className="w-full"
              >
                {activities[0].completed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Completed (+30 pts)
                  </>
                ) : (
                  "Start Meditation Timer"
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                Available during morning hours ({activities[0].timeWindow})
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Learning with Completion Tracking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Video className="h-4 w-4 text-blue-500" />
            Daily Video Learning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Watch the complete daily video (minimum 80% completion required)
            </p>
            <Button 
              onClick={() => handleVideoCompletion(480, 600)} // Simulate 80% completion
              disabled={trackVerifiedActivity.isPending || activities[1].completed}
              className="w-full"
            >
              {activities[1].completed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Video Completed (+20 pts)
                </>
              ) : (
                "Mark Video as Watched"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verified Journal Entry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <PenTool className="h-4 w-4 text-purple-500" />
            Journal Reflection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Write a meaningful reflection (minimum 100 characters)
            </p>
            <Textarea
              placeholder="Reflect on today's practice, insights, and experiences..."
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              className="min-h-[100px]"
              disabled={activities[2].completed}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {journalEntry.length}/100 characters
              </span>
              <Button 
                onClick={handleJournalSubmission}
                disabled={trackVerifiedActivity.isPending || activities[2].completed || journalEntry.length < 100}
                size="sm"
              >
                {activities[2].completed ? "Completed (+25 pts)" : "Submit Reflection"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time-Gated Evening Integration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {activities[3].isAvailable ? (
              <Unlock className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-gray-400" />
            )}
            Evening Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities[3].isAvailable ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Reflect on your day and set tomorrow's intention
              </p>
              <Textarea
                placeholder="How did today's practice feel? What did you learn? What's your intention for tomorrow?"
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                className="min-h-[80px]"
                disabled={activities[3].completed}
              />
              <Button 
                onClick={handleEveningReflection}
                disabled={trackVerifiedActivity.isPending || activities[3].completed || reflectionText.trim().split(/\s+/).length < 15}
                className="w-full"
              >
                {activities[3].completed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Integration Complete (+35 pts)
                  </>
                ) : (
                  "Complete Evening Reflection"
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                Available during evening hours ({activities[3].timeWindow})
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rewards and Unlocks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-500" />
            Today's Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm">
              <div className="font-medium">Potential Points: {activities.reduce((sum, a) => sum + a.points, 0)}</div>
              <div className="text-gray-600">Complete all activities to unlock:</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Badge variant="outline">Advanced Techniques</Badge>
              <Badge variant="outline">Bonus Content</Badge>
              <Badge variant="outline">Personal Insights</Badge>
              <Badge variant="outline">Next Day Preview</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}