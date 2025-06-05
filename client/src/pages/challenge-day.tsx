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
import VideoMeditationGuide from "@/components/video-meditation-guide";
import ProgressCelebration from "@/components/progress-celebration";
import ContextualTutorial from "@/components/contextual-tutorial";

export default function ChallengeDay() {
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

  // Get challenge type from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const challengeType = urlParams.get('type') || 'general_quantum';

  // Generate dynamic content based on challenge type
  const generateChallengeContent = (day: number, type: string) => {
    const contentMap: Record<string, any> = {
      general_quantum: {
        day,
        title: `Day ${day}: Quantum Consciousness Foundation`,
        subtitle: "Master the fundamentals of quantum reality and consciousness elevation",
        description: "Master the fundamentals of quantum reality and consciousness elevation",
        duration: "15-20 minutes",
        topic: "Quantum Consciousness",
        science: "Neuroscience research shows that elevated emotional states create new neural pathways and increase brain coherence, supporting the quantum field theory of consciousness.",
        practice: {
          name: "Quantum Meditation",
          description: "A guided meditation to elevate your consciousness and align with quantum possibilities",
          steps: [
            "Find a quiet space and sit comfortably with your spine straight",
            "Begin with heart coherence breathing - 5 seconds in, 5 seconds out",
            "Cultivate elevated emotions of gratitude, love, and joy",
            "Visualize your future self living your desired reality",
            "Feel the emotions of having already achieved your goals",
            "Connect with the quantum field of infinite possibilities",
            "Set your intention for the day with elevated energy"
          ],
          tips: [
            "Practice at the same time each day to build consistency",
            "Start with 10-15 minutes and gradually increase duration",
            "Focus on feeling the emotions, not just visualizing",
            "Keep a journal nearby to capture insights"
          ]
        },
        keyPrinciples: ["Consciousness Elevation", "Quantum Field Access", "Reality Creation", "Mind-Matter Interface"],
        techniques: ["Heart Coherence Breathing", "Elevated Emotion Cultivation", "Future Self Visualization", "Quantum Field Connection"],
        insights: [
          "Your thoughts and emotions directly influence your reality",
          "Elevated states create new neural pathways for transformation",
          "The quantum field responds to coherent heart-brain states"
        ],
        affirmation: "I am the creator of my reality, aligned with infinite possibilities and elevated consciousness.",
        quote: {
          text: "The moment you change your energy, you change your life.",
          author: "Dr. Joe Dispenza"
        }
      },
      money_blocks_clearing: {
        day,
        title: `Day ${day}: Money Blocks Clearing`,
        subtitle: "Identify and dissolve limiting beliefs and subconscious blocks around money and abundance",
        description: "Identify and dissolve limiting beliefs and subconscious blocks around money and abundance",
        duration: "20-25 minutes",
        topic: "Money Blocks Clearing",
        science: "Neuroscience shows that limiting beliefs create neural pathways that can be rewired through conscious awareness and emotional healing practices.",
        practice: {
          name: "Block Clearing Meditation",
          description: "A powerful session to uncover and release deep-rooted money blocks and limiting beliefs",
          steps: [
            "Create a safe, sacred space for deep inner work",
            "Begin with grounding breaths to center yourself",
            "Scan your body for tension or resistance around money topics",
            "Bring to mind your earliest money memories and observe without judgment",
            "Notice what limiting beliefs arise about money and worthiness",
            "Send love and compassion to these wounded parts of yourself",
            "Visualize golden light dissolving these blocks and limitations",
            "Affirm your natural worthiness and right to abundance"
          ],
          tips: [
            "Go gently with yourself - deep healing takes time",
            "Write down any limiting beliefs that surface during practice",
            "If emotions arise, allow them to flow without resistance",
            "Practice daily for 21 days to create lasting change"
          ]
        },
        keyPrinciples: ["Block Identification", "Belief Archaeology", "Trauma Healing", "Subconscious Reprogramming"],
        techniques: ["Shadow Work Exploration", "Belief Identification", "Energy Clearing", "Subconscious Reprogramming"],
        insights: [
          "Money blocks often stem from childhood experiences and family beliefs",
          "Clearing blocks requires both awareness and emotional healing",
          "Your worthiness is not determined by your financial status"
        ],
        affirmation: "I release all limiting beliefs about money and embrace my natural abundance and worth.",
        quote: {
          text: "Your relationship with money is a reflection of your relationship with yourself.",
          author: "Louise Hay"
        }
      },
      money_manifestation: {
        day,
        title: `Day ${day}: Abundance Manifestation`,
        subtitle: "Cultivate wealth consciousness and attract financial abundance through elevated states",
        description: "Cultivate wealth consciousness and attract financial abundance through elevated states",
        duration: "15-20 minutes",
        topic: "Abundance Manifestation",
        science: "Studies show that visualization combined with elevated emotions activates the same neural networks as actual experiences, programming the subconscious for abundance.",
        practice: {
          name: "Abundance Meditation",
          description: "A manifestation practice to align with abundance and attract financial prosperity",
          steps: [
            "Sit in meditation posture and connect with your heart center",
            "Breathe deeply and feel gratitude for all current abundance",
            "Visualize yourself living in complete financial freedom",
            "Feel the emotions of having unlimited resources",
            "See money flowing to you easily and effortlessly",
            "Embody the energy of someone who is naturally abundant",
            "Set intentions for specific financial goals with elevated emotion"
          ],
          tips: [
            "Feel the emotions as if your abundance is already here",
            "Visualize specific amounts and sources of income",
            "Practice gratitude for money before it arrives",
            "Maintain elevated emotions throughout the day"
          ]
        },
        keyPrinciples: ["Abundance Mindset", "Wealth Consciousness", "Financial Alignment", "Prosperity Vibration"],
        techniques: ["Abundance Visualization", "Gratitude Amplification", "Wealth Frequency Attunement", "Prosperity Anchoring"],
        insights: [
          "Abundance is a state of being, not something you acquire",
          "Your emotional frequency attracts corresponding financial experiences",
          "Gratitude amplifies your magnetic field for prosperity"
        ],
        affirmation: "I am a powerful money magnet, attracting abundance with ease and grace.",
        quote: {
          text: "Abundance is not something we acquire, it is something we tune into.",
          author: "Wayne Dyer"
        }
      },
      quantum_health: {
        day,
        title: `Day ${day}: Quantum Health Transformation`,
        subtitle: "Harness the power of consciousness to heal and transform your physical body",
        description: "Harness the power of consciousness to heal and transform your physical body",
        duration: "20-25 minutes",
        topic: "Quantum Health",
        science: "Epigenetic research demonstrates that consciousness and emotional states can directly influence gene expression and cellular regeneration processes.",
        practice: {
          name: "Healing Meditation",
          description: "A transformational practice to activate your body's natural healing intelligence",
          steps: [
            "Lie down comfortably and scan your entire body",
            "Send breath and awareness to any areas needing healing",
            "Visualize healing light flowing through every cell",
            "Communicate with your body's innate intelligence",
            "See yourself in perfect health and vitality",
            "Feel gratitude for your body's natural healing abilities",
            "Program new instructions for optimal health and wellness"
          ],
          tips: [
            "Trust your body's innate wisdom to heal itself",
            "Speak to your cells with love and appreciation",
            "Visualize healing light in colors that feel right to you",
            "Practice consistently for 21 days to see results"
          ]
        },
        keyPrinciples: ["Self-Healing", "Biological Transformation", "Mind-Body Unity", "Cellular Regeneration"],
        techniques: ["Body Scan Healing", "Cellular Communication", "Energy Medicine", "Biological Reprogramming"],
        insights: [
          "Your body is constantly regenerating and can heal itself",
          "Consciousness directly influences cellular behavior and gene expression",
          "Love and appreciation are powerful healing frequencies"
        ],
        affirmation: "My body knows how to heal, and I trust its infinite wisdom and regenerative power.",
        quote: {
          text: "The body is the servant of the mind. It obeys the operations of the mind.",
          author: "James Allen"
        }
      },
      quantum_relationships: {
        day,
        title: `Day ${day}: Heart-Centered Connection`,
        subtitle: "Develop authentic, conscious relationships through heart coherence and love",
        description: "Develop authentic, conscious relationships through heart coherence and love",
        duration: "15-20 minutes",
        topic: "Quantum Relationships",
        science: "HeartMath research shows that heart coherence creates a measurable electromagnetic field that influences others, promoting deeper connection and empathy.",
        practice: {
          name: "Heart Coherence Practice",
          description: "A heart-opening practice to cultivate love, compassion, and authentic connection",
          steps: [
            "Place your hand on your heart and breathe deeply",
            "Focus your attention on your heart center",
            "Cultivate feelings of appreciation and gratitude",
            "Send love to yourself unconditionally",
            "Expand this love to include your relationships",
            "Visualize harmonious connections with all people",
            "Set intentions for authentic, loving communication"
          ],
          tips: [
            "Start by loving yourself first before extending to others",
            "Practice heart coherence breathing: 5 seconds in, 5 seconds out",
            "Send loving thoughts to difficult people in your life",
            "Notice how your energy shifts when you focus on love"
          ]
        },
        keyPrinciples: ["Heart Intelligence", "Authentic Love", "Conscious Communication", "Energetic Resonance"],
        techniques: ["Heart Coherence Breathing", "Love Field Activation", "Compassion Cultivation", "Authentic Expression"],
        insights: [
          "Your heart generates a powerful electromagnetic field that affects others",
          "Love is the highest frequency and most transformative force",
          "Authentic relationships begin with a loving relationship with yourself"
        ],
        affirmation: "I am love, I give love, and I attract loving, authentic relationships into my life.",
        quote: {
          text: "Love is the bridge between two hearts.",
          author: "Rumi"
        }
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
        challengeType: challengeType,
        timeSpent: data.timeSpent || timeSpent,
        rating: data.rating,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/completion"] });
      setIsCompleted(true);
      
      // Trigger celebration animation
      setCelebrationType('day_completed');
      setShowCelebration(true);
      
      // Check for milestone celebrations
      if (currentDay % 7 === 0) {
        setTimeout(() => {
          setCelebrationType('week_completed');
          setShowCelebration(true);
        }, 2000);
      }
      
      toast({
        title: "Challenge Complete!",
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

        {/* Video Meditation Guide */}
        <div className="mt-8">
          <VideoMeditationGuide 
            challengeType={challengeType}
            day={currentDay}
          />
        </div>

      {/* Modals */}
      <JournalModal 
        key={`${challengeType}-${currentDay}`}
        isOpen={showJournal}
        onClose={() => setShowJournal(false)}
        day={currentDay}
        title={content.title}
        challengeType={challengeType}
      />

      <AIAssistant
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        day={currentDay}
        topic={content.topic}
        context={content.title}
      />

      {/* Progress Celebration */}
      <ProgressCelebration
        isVisible={showCelebration}
        onClose={() => setShowCelebration(false)}
        achievementType={celebrationType}
        details={{
          day: currentDay,
          week: Math.ceil(currentDay / 7),
          challengeName: challengeType.replace('_', ' ').toUpperCase()
        }}
      />

      {/* Contextual Tutorial */}
      <ContextualTutorial
        isVisible={showTutorial}
        onClose={() => setShowTutorial(false)}
        tutorialType="challenge_start"
        onComplete={() => setShowTutorial(false)}
      />
    </div>
  );
}
