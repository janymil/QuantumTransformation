import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Bookmark,
  Sunrise,
  Sun,
  Moon
} from "lucide-react";
import { challengeContent } from "@/data/challenge-content";
import VideoMeditationGuide from "@/components/video-meditation-guide";
import ProgressCelebration from "@/components/progress-celebration";
import ChallengeHeader from "@/components/challenge-day/challenge-header";
import { generateChallengeContent } from "@/components/challenge-day/challenge-content-generator";
import ChallengeContent from "@/components/challenge-day/challenge-content";
import ActionButtons from "@/components/challenge-day/action-buttons";

interface ChallengeDayProps {
  challengeType?: string;
}
import ContextualTutorial from "@/components/contextual-tutorial";

export default function ChallengeDay({ challengeType: propChallengeType }: ChallengeDayProps = {}) {
  const { day } = useParams<{ day: string }>();
  const currentDay = parseInt(day || "1");
  const { toast } = useToast();
  
  const [showJournal, setShowJournal] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'day_completed' | 'streak_milestone' | 'week_completed' | 'challenge_started' | 'level_up'>('day_completed');

  // Get challenge type from prop or URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const challengeType = propChallengeType || urlParams.get('type') || 'general_quantum';

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress/all"],
  });

  // Find the progress for this specific challenge
  const allProgress = (progressData as any)?.allProgress || [];
  const challengeProgress = allProgress.find((p: any) => p.challengeType === challengeType);
  const completedDays = (challengeProgress?.completedDays as number[]) || [];
  const actualCurrentDay = challengeProgress?.currentDay || 1;
  
  // Use the URL day parameter, but validate access permissions
  const effectiveDay = currentDay;
  const canAccess = currentDay <= actualCurrentDay;

  const content = generateChallengeContent(effectiveDay, challengeType);

  const { data: completion, isLoading: completionLoading } = useQuery({
    queryKey: ["/api/challenge/completion", effectiveDay, challengeType],
    queryFn: async () => {
      const response = await fetch(`/api/challenge/completion/${effectiveDay}?challengeType=${challengeType}`, {
        credentials: "include",
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch completion");
      return response.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ day, challengeType, timeSpent }: { day: number; challengeType: string; timeSpent: number }) => {
      const response = await apiRequest(`/api/challenge/complete/${day}`, {
        method: "POST",
        body: { challengeType, timeSpent },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenge/completion", effectiveDay, challengeType] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/all"] });
      setIsCompleted(true);
      
      // Show appropriate celebration
      if (effectiveDay % 7 === 0) {
        setCelebrationType('week_completed');
        setShowCelebration(true);
      } else if (effectiveDay === 1) {
        setCelebrationType('challenge_started');
        setShowCelebration(true);
      } else {
        setCelebrationType('day_completed');
        setShowCelebration(true);
      }
      
      toast({
        title: "Day Completed!",
        description: `You've successfully completed Day ${effectiveDay}!`,
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
        title: "Error",
        description: "Failed to complete the day. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleComplete = () => {
    completeMutation.mutate({
      day: effectiveDay,
      challengeType,
      timeSpent,
    });
  };

  // Auto-mark as completed if completion data exists
  useEffect(() => {
    if (completion && !isCompleted) {
      setIsCompleted(true);
    }
  }, [completion, isCompleted]);

  // Timer for tracking time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (progressLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!canAccess) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Day Not Yet Available</h2>
            <p className="text-muted-foreground mb-6">
              Complete the previous days to unlock Day {effectiveDay}.
            </p>
            <Link href={`/challenge/${actualCurrentDay}?type=${challengeType}`}>
              <Button>Go to Day {actualCurrentDay}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <ChallengeHeader 
        currentDay={effectiveDay}
        challengeType={challengeType}
        content={content}
        completedDays={completedDays}
        onBack={() => window.history.back()}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="practice">Practice</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="science">Science</TabsTrigger>
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="science" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-6 h-6 mr-2 text-primary" />
                    The Science Behind Today's Practice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-6">
                    <p className="text-muted-foreground leading-relaxed">
                      {content.science}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="practice" className="space-y-6">
              {/* Check if challenge has 3-part structure (morning, daytime, evening) */}
              {content.practice.morning || content.practice.daytime || content.practice.evening ? (
                <>
                  {/* Morning Practice */}
                  {content.practice.morning && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Sunrise className="w-6 h-6 mr-2 text-orange-500" />
                          {content.practice.morning.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <ol className="space-y-3">
                            {content.practice.morning.steps.map((step: string, index: number) => (
                              <li key={index} className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-white text-sm font-medium">{index + 1}</span>
                                </div>
                                <p className="text-muted-foreground">{step}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Daytime Practice */}
                  {content.practice.daytime && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Sun className="w-6 h-6 mr-2 text-yellow-500" />
                          {content.practice.daytime.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <ol className="space-y-3">
                            {content.practice.daytime.steps.map((step: string, index: number) => (
                              <li key={index} className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-white text-sm font-medium">{index + 1}</span>
                                </div>
                                <p className="text-muted-foreground">{step}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Evening Practice */}
                  {content.practice.evening && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Moon className="w-6 h-6 mr-2 text-purple-500" />
                          {content.practice.evening.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <ol className="space-y-3">
                            {content.practice.evening.steps.map((step: string, index: number) => (
                              <li key={index} className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-white text-sm font-medium">{index + 1}</span>
                                </div>
                                <p className="text-muted-foreground">{step}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tips and Insights for 3-part structure */}
                  <div className="bg-muted/50 rounded-lg p-6">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-warning" />
                      Practice Tips
                    </h4>
                    <ul className="space-y-2">
                      {content.practice.tips.map((tip: string, index: number) => (
                        <li key={index} className="text-muted-foreground flex items-start">
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2 mr-3"></span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                /* Original single practice format for backward compatibility */
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Play className="w-6 h-6 mr-2 text-primary" />
                      Today's Practice: {content.practice.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-6">{content.practice.description}</p>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Step-by-Step Guide:</h4>
                      <ol className="space-y-3">
                        {content.practice.steps.map((step: string, index: number) => (
                          <li key={index} className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-sm font-medium">{index + 1}</span>
                            </div>
                            <p className="text-muted-foreground">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <Separator className="my-6" />

                    <div className="bg-muted/50 rounded-lg p-6">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-warning" />
                        Practice Tips
                      </h4>
                      <ul className="space-y-2">
                        {content.practice.tips.map((tip: string, index: number) => (
                          <li key={index} className="text-muted-foreground flex items-start">
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2 mr-3"></span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

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
                    {content.practice.insights.map((insight: string, index: number) => (
                      <div key={index} className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-muted-foreground">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {content.affirmation && (
                <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 border-primary/20">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-foreground mb-3">Today's Affirmation</h4>
                    <p className="text-lg text-foreground italic leading-relaxed">
                      "{content.affirmation}"
                    </p>
                  </CardContent>
                </Card>
              )}

              {content.quote && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Quote className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-lg text-foreground italic mb-2">
                          "{content.quote.text}"
                        </p>
                        <p className="text-sm text-muted-foreground">
                          — {content.quote.author}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <ActionButtons
            isCompleted={isCompleted}
            completionLoading={completionLoading}
            onComplete={handleComplete}
            onJournal={() => setShowJournal(true)}
            onAI={() => setShowAI(true)}
            timeSpent={formatTime(timeSpent)}
          />

          <VideoMeditationGuide 
            day={effectiveDay}
            challengeType={challengeType}
          />
        </div>
      </div>

      {showJournal && (
        <JournalModal
          day={effectiveDay}
          challengeType={challengeType}
          onClose={() => setShowJournal(false)}
        />
      )}

      {showAI && (
        <AIAssistant
          day={effectiveDay}
          challengeType={challengeType}
          content={content}
          onClose={() => setShowAI(false)}
        />
      )}

      {showCelebration && (
        <ProgressCelebration
          type={celebrationType}
          day={effectiveDay}
          onClose={() => setShowCelebration(false)}
        />
      )}

      {showTutorial && (
        <ContextualTutorial
          step="challenge_day"
          onClose={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
}