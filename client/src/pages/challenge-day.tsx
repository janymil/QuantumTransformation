import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JournalModal from "@/components/journal-modal";
import AIAssistant from "@/components/ai-assistant";
import { 
  Play, 
  Star, 
  Clock, 
  CheckCircle, 
  BookOpen, 
  Brain,
  Quote,
  Lightbulb,
  ArrowLeft,
  Share,
  Bookmark
} from "lucide-react";
import VideoMeditationGuide from "@/components/video-meditation-guide";
import ProgressCelebration from "@/components/progress-celebration";
import ChallengeHeader from "@/components/challenge-day/challenge-header";
import { generateChallengeContent } from "@/components/challenge-day/challenge-content-generator";
import ChallengeContent from "@/components/challenge-day/challenge-content";
import PracticeToolsHub from "@/components/practice-tools/practice-tools-hub";
import ActionButtons from "@/components/challenge-day/action-buttons";
import ContextualTutorial from "@/components/contextual-tutorial";
import VideoPlayerTab from "@/components/video-player-tab";
import EnhancedAffirmationsSection from "@/components/enhanced-affirmations-section";
import EnhancedPracticeContent from "@/components/enhanced-practice-content";

interface ChallengeDayProps {
  challengeType?: string;
}

export default function ChallengeDay({ challengeType: propChallengeType }: ChallengeDayProps = {}) {
  const { day } = useParams<{ day: string }>();
  const currentDay = parseInt(day || "1");
  const { toast } = useToast();
  
  const [showJournal, setShowJournal] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Determine challenge type from URL or prop
  const urlParts = window.location.pathname.split('/');
  const urlChallengeType = urlParts[1];
  
  // Map URL paths to challenge types
  const challengeTypeMapping: Record<string, string> = {
    'quantum-consciousness': 'general_quantum',
    'money-manifestation': 'money_manifestation', 
    'health-transformation': 'quantum_health',
    'relationships': 'quantum_relationships',
    'money-blocks-clearing': 'money_blocks_clearing'
  };
  
  const challengeType = propChallengeType || challengeTypeMapping[urlChallengeType] || 'general_quantum';
  
  const effectiveDay = currentDay;

  // Fetch user progress data
  const { data: progressData } = useQuery({
    queryKey: ["/api/progress/all"],
  });

  // Fetch completion data for this specific day
  const { data: completionData } = useQuery({
    queryKey: [`/api/challenge/completion/${effectiveDay}`],
  });

  // Generate or fetch challenge content
  const content = generateChallengeContent(effectiveDay, challengeType);

  // Check if day is completed
  useEffect(() => {
    if (completionData) {
      setIsCompleted(true);
    }
  }, [completionData]);

  // Timer for tracking time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const completionMutation = useMutation({
    mutationFn: async (completionData: any) => {
      return apiRequest("/api/challenges/complete", "POST", completionData);
    },
    onSuccess: () => {
      setIsCompleted(true);
      setShowCelebration(true);
      queryClient.invalidateQueries({ queryKey: ["/api/progress/all"] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenge/completion/${effectiveDay}`] });
      toast({
        title: "Day completed!",
        description: "Great job on completing today's practice!",
      });
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
        title: "Error completing day",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleComplete = () => {
    if (isCompleted) return;

    completionMutation.mutate({
      day: effectiveDay,
      challengeType,
      timeSpent,
      rating: 5,
      notes: "",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const allProgress = (progressData as any)?.allProgress || [];
  const userProgress = allProgress.find((p: any) => p.challengeType === challengeType);
  const actualCurrentDay = userProgress?.currentDay || 1;

  // Redirect if accessing future day
  if (effectiveDay > actualCurrentDay) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Day Not Available Yet</h2>
            <p className="text-muted-foreground mb-6">
              You need to complete Day {actualCurrentDay} first before accessing Day {effectiveDay}.
            </p>
            <Link href={`/${challengeType}/day/${actualCurrentDay}`}>
              <Button>Go to Day {actualCurrentDay}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{content.title}</h1>
          <p className="text-muted-foreground">Day {effectiveDay} • {challengeType}</p>
        </div>
        <Link href={challengeType === 'money_blocks_clearing' ? '/money-blocks-clearing' : `/${challengeType}`}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="practice">Practice</TabsTrigger>
              <TabsTrigger value="affirmations">Affirmations</TabsTrigger>
              {content.videoLinks && content.videoLinks.length > 0 && (
                <TabsTrigger value="videos">Videos</TabsTrigger>
              )}
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="tools">Practice Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <BookOpen className="w-6 h-6 mr-2 text-primary" />
                      {content.title}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      <Clock className="w-4 h-4 mr-1" />
                      {content.duration}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground mb-4">{content.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {content.description}
                  </p>
                  
                  {content.expectedResults && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-700">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">Expected Results</h4>
                      <ul className="space-y-2">
                        {content.expectedResults.map((result: string, index: number) => (
                          <li key={index} className="text-green-700 dark:text-green-300 flex items-start">
                            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            {result}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="practice" className="space-y-6">
              <EnhancedPracticeContent 
                practice={content.practice} 
                duration={content.duration} 
              />
            </TabsContent>

            <TabsContent value="affirmations" className="space-y-6">
              <EnhancedAffirmationsSection 
                affirmations={[content.affirmation || ""]}
                dayNumber={currentDay}
                challengeType={challengeType || "general_quantum"}
              />
            </TabsContent>

            {content.videoLinks && content.videoLinks.length > 0 && (
              <TabsContent value="videos" className="space-y-6">
                <VideoPlayerTab videoLinks={content.videoLinks} />
              </TabsContent>
            )}

            <TabsContent value="insights" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-6 h-6 mr-2 text-primary" />
                    Key Insights to Remember
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {content.practice.insights?.map((insight: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools" className="space-y-6">
              <PracticeToolsHub 
                day={currentDay} 
                challengeType={challengeType || "general_quantum"} 
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time Spent</span>
                  <Badge variant="secondary">Time: {formatTime(timeSpent)}</Badge>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={handleComplete}
                    disabled={isCompleted || completionMutation.isPending}
                    className="w-full"
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Completed
                      </>
                    ) : (
                      "Mark as Complete"
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowJournal(true)}
                    className="w-full"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Journal
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAI(true)}
                    className="w-full"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI Assistant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showJournal && (
        <JournalModal
          isOpen={showJournal}
          onClose={() => setShowJournal(false)}
          day={effectiveDay}
          challengeType={challengeType}
        />
      )}

      {showAI && (
        <AIAssistant
          isOpen={showAI}
          onClose={() => setShowAI(false)}
          day={effectiveDay}
          challengeType={challengeType}
        />
      )}

      {showCelebration && (
        <ProgressCelebration
          day={effectiveDay}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
}