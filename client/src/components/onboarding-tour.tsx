import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, ArrowRight, ArrowLeft, Sparkles, Target, BookOpen, TrendingUp, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ReactNode;
  action?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Transformation Journey',
    description: 'Discover personalized challenges designed to unlock your potential through quantum consciousness principles and practical mindfulness.',
    target: 'dashboard-header',
    position: 'bottom',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: 'challenges',
    title: 'Explore Challenge Types',
    description: 'Choose from 5 transformative challenges: Quantum Consciousness, Money Blocks Clearing, Health Transformation, Relationships, and Creativity Flow.',
    target: 'challenges-section',
    position: 'top',
    icon: <Target className="w-5 h-5" />,
    action: 'Navigate to Challenges page to see all options'
  },
  {
    id: 'daily-practice',
    title: 'Daily Practice Structure',
    description: 'Each day includes guided practices, journaling prompts, and AI-powered insights to deepen your transformation.',
    target: 'practice-area',
    position: 'right',
    icon: <Play className="w-5 h-5" />,
  },
  {
    id: 'journal',
    title: 'Capture Your Insights',
    description: 'Reflect on your experiences, track breakthroughs, and receive personalized AI analysis of your progress patterns.',
    target: 'journal-section',
    position: 'left',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    id: 'progress',
    title: 'Track Your Growth',
    description: 'Monitor your consistency, unlock achievements, and see detailed analytics of your transformation journey.',
    target: 'progress-section',
    position: 'top',
    icon: <TrendingUp className="w-5 h-5" />,
  }
];

export default function OnboardingTour() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Remove auto-trigger - tour is now manually started only

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    setIsVisible(false);
    localStorage.setItem('onboarding-tour-completed', 'true');
  };

  const completeTour = () => {
    setIsActive(false);
    setIsVisible(false);
    localStorage.setItem('onboarding-tour-completed', 'true');
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
    setIsVisible(true);
  };

  if (!isVisible || !isActive) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={restartTour}
        className="fixed bottom-4 right-4 z-50 shadow-lg bg-white/90 backdrop-blur-sm border-purple-200 text-purple-600 hover:bg-purple-50"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Tour Guide
      </Button>
    );
  }

  const step = tourSteps[currentStep];
  const progressPercentage = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      
      {/* Tour Card */}
      <Card className="fixed z-50 w-80 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                {step.icon}
              </div>
              <Badge variant="secondary" className="text-xs">
                Step {currentStep + 1} of {tourSteps.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={skipTour}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Content */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {step.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {step.description}
            </p>
            {step.action && (
              <div className="mt-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                <p className="text-xs text-purple-700 font-medium">
                  💡 {step.action}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={prevStep}
              disabled={currentStep === 0}
              className="text-gray-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={skipTour}>
                Skip Tour
              </Button>
              <Button size="sm" onClick={nextStep} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spotlight effect for targeted elements */}
      <style>{`
        [data-tour-target="${step.target}"] {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.4), 0 0 20px rgba(168, 85, 247, 0.3);
          border-radius: 8px;
          animation: pulse-glow 2s infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.4), 0 0 20px rgba(168, 85, 247, 0.3);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(168, 85, 247, 0.6), 0 0 30px rgba(168, 85, 247, 0.5);
          }
        }
      `}</style>
    </>
  );
}