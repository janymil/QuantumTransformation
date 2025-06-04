import { useParams } from "wouter";
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
  CheckCircle, 
  BookOpen, 
  Brain, 
  Clock, 
  Star, 
  Lightbulb,
  Quote,
  ArrowLeft,
  Share,
  Bookmark
} from "lucide-react";
import { Link } from "wouter";
import { challengeContent } from "@/data/challenge-content";

export default function ChallengeDay() {
  const { day } = useParams<{ day: string }>();
  const currentDay = parseInt(day || "1");
  const { toast } = useToast();
  
  const [showJournal, setShowJournal] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Get challenge type from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const challengeType = urlParams.get('type') || 'general_quantum';

  // Generate dynamic content based on challenge type
  const generateChallengeContent = (day: number, type: string) => {
    const contentMap: Record<string, any> = {
      general_quantum: {
        title: `Day ${day}: Quantum Consciousness Foundation`,
        description: "Master the fundamentals of quantum reality and consciousness elevation",
        practiceTitle: "Quantum Meditation",
        practiceDescription: "A guided meditation to elevate your consciousness and align with quantum possibilities",
        keyPrinciples: ["Consciousness Elevation", "Quantum Field Access", "Reality Creation", "Mind-Matter Interface"],
        techniques: ["Heart Coherence Breathing", "Elevated Emotion Cultivation", "Future Self Visualization", "Quantum Field Connection"],
        affirmation: "I am the creator of my reality, aligned with infinite possibilities and elevated consciousness."
      },
      money_blocks_clearing: {
        title: `Day ${day}: Money Blocks Clearing`,
        description: "Identify and dissolve limiting beliefs and subconscious blocks around money and abundance",
        practiceTitle: "Block Clearing Meditation",
        practiceDescription: "A powerful session to uncover and release deep-rooted money blocks and limiting beliefs",
        keyPrinciples: ["Block Identification", "Belief Archaeology", "Trauma Healing", "Subconscious Reprogramming"],
        techniques: ["Shadow Work Exploration", "Belief Identification", "Energy Clearing", "Subconscious Reprogramming"],
        affirmation: "I release all limiting beliefs about money and embrace my natural abundance and worth."
      },
      money_manifestation: {
        title: `Day ${day}: Abundance Manifestation`,
        description: "Cultivate wealth consciousness and attract financial abundance through elevated states",
        practiceTitle: "Abundance Meditation",
        practiceDescription: "A manifestation practice to align with abundance and attract financial prosperity",
        keyPrinciples: ["Abundance Mindset", "Wealth Consciousness", "Financial Alignment", "Prosperity Vibration"],
        techniques: ["Abundance Visualization", "Gratitude Amplification", "Wealth Frequency Attunement", "Prosperity Anchoring"],
        affirmation: "I am a powerful money magnet, attracting abundance with ease and grace."
      },
      quantum_health: {
        title: `Day ${day}: Quantum Health Transformation`,
        description: "Harness the power of consciousness to heal and transform your physical body",
        practiceTitle: "Healing Meditation",
        practiceDescription: "A transformational practice to activate your body's natural healing intelligence",
        keyPrinciples: ["Self-Healing", "Biological Transformation", "Mind-Body Unity", "Cellular Regeneration"],
        techniques: ["Body Scan Healing", "Cellular Communication", "Energy Medicine", "Biological Reprogramming"],
        affirmation: "My body knows how to heal, and I trust its infinite wisdom and regenerative power."
      },
      quantum_relationships: {
        title: `Day ${day}: Heart-Centered Connection`,
        description: "Develop authentic, conscious relationships through heart coherence and love",
        practiceTitle: "Heart Coherence Practice",
        practiceDescription: "A heart-opening practice to cultivate love, compassion, and authentic connection",
        keyPrinciples: ["Heart Intelligence", "Authentic Love", "Conscious Communication", "Energetic Resonance"],
        techniques: ["Heart Coherence Breathing", "Love Field Activation", "Compassion Cultivation", "Authentic Expression"],
        affirmation: "I am love, I give love, and I attract loving, authentic relationships into my life."
      }
    };

    return contentMap[type] || contentMap.general_quantum;
  };

  const content = generateChallengeContent(currentDay, challengeType);

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: completion, isLoading: completionLoading } = useQuery({
    queryKey: ["/api/challenges/completion", currentDay],
    queryFn: async () => {
      const response = await fetch(`/api/challenges/completion?day=${currentDay}`, {
        credentials: "include",
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch completion");
      return response.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (data: { rating?: number; timeSpent?: number }) => {
      return await apiRequest("POST", "/api/challenges/complete", {
        day: currentDay,
        timeSpent: data.timeSpent || timeSpent,
        rating: data.rating,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      setIsCompleted(true);
      toast({
        title: "Challenge Complete! 🎉",
        description: `Great job on completing Day ${currentDay}. You're building powerful momentum!`,
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
        description: "Failed to complete challenge. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (completion) {
      setIsCompleted(true);
    }
  }, [completion]);

  useEffect(() => {
    if (!progressLoading && !progressData) {
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
  }, [progressData, progressLoading, toast]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 60000); // Increment every minute

    return () => clearInterval(timer);
  }, []);

  if (progressLoading || completionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading challenge content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Day Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The requested challenge day could not be found.
            </p>
            <Link href="/">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = progressData?.progress;
  const completedDays = (progress?.completedDays as number[]) || [];
  const canAccess = currentDay <= (progress?.currentDay || 1) || completedDays.includes(currentDay);

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Day Locked</h1>
            <p className="text-muted-foreground mb-6">
              Complete the previous challenges to unlock Day {currentDay}.
            </p>
            <Link href="/">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <Card className="bg-gradient-primary text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full transform -translate-x-24 translate-y-24"></div>
          <CardContent className="relative z-10 p-8">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Day {currentDay} of 30
              </Badge>
              <div className="flex items-center space-x-4 text-white/90">
                <span className="text-sm flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {content.duration}
                </span>
                {isCompleted && (
                  <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
            <p className="text-white/90 text-lg mb-6">{content.subtitle}</p>
            <div className="flex items-center space-x-4">
              {!isCompleted && (
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                  onClick={() => setShowJournal(true)}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Practice
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="lg"
                className="text-white border-white/30 hover:bg-white/10"
                onClick={() => setShowJournal(true)}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Open Journal
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                className="text-white border-white/30 hover:bg-white/10"
                onClick={() => setShowAI(true)}
              >
                <Brain className="w-5 h-5 mr-2" />
                AI Guide
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="lesson" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lesson">Today's Lesson</TabsTrigger>
            <TabsTrigger value="practice">Practice Guide</TabsTrigger>
            <TabsTrigger value="insights">Key Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="lesson" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-6 h-6 mr-2 text-primary" />
                  Understanding {content.topic}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">Core Concept</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {content.description}
                    </p>
                  </div>

                  {content.quote && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <Quote className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-foreground italic text-lg mb-2">
                              "{content.quote.text}"
                            </p>
                            <p className="text-muted-foreground text-sm">
                              — {content.quote.author}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">Scientific Foundation</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {content.science}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practice" className="space-y-6">
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
                    {content.practice.steps.map((step, index) => (
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
                    {content.practice.tips.map((tip, index) => (
                      <li key={index} className="text-muted-foreground flex items-start">
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2 mr-3"></span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
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
                  {content.insights.map((insight, index) => (
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
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {!isCompleted ? (
                <Button 
                  size="lg"
                  className="flex-1"
                  onClick={() => completeMutation.mutate({})}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Mark as Complete
                    </>
                  )}
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="flex-1" disabled>
                  <CheckCircle className="w-5 h-5 mr-2 text-success" />
                  Completed
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowJournal(true)}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Open Journal
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowAI(true)}
              >
                <Brain className="w-5 h-5 mr-2" />
                AI Explanation
              </Button>
            </div>
            
            {timeSpent > 0 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Time spent today: {timeSpent} minutes
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <JournalModal 
        isOpen={showJournal}
        onClose={() => setShowJournal(false)}
        day={currentDay}
        title={content.title}
      />

      <AIAssistant
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        day={currentDay}
        topic={content.topic}
        context={content.title}
      />
    </div>
  );
}
