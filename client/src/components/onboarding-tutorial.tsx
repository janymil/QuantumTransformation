import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Play, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Sparkles, 
  Brain, 
  Target,
  Calendar,
  Book,
  Award,
  X
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: string;
  target?: string;
  icon: any;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Quantum Journey',
    description: 'Discover the power of quantum consciousness transformation',
    content: 'Over the next 30 days, you\'ll embark on a scientifically-backed journey combining Joe Dispenza\'s quantum field theory with Neville Goddard\'s manifestation principles. This platform will guide you through daily practices, track your progress, and provide AI-powered insights.',
    icon: Sparkles,
    position: 'center'
  },
  {
    id: 'dashboard',
    title: 'Your Command Center',
    description: 'Navigate your daily practice from the dashboard',
    content: 'The dashboard shows your current day, progress stats, and today\'s quantum practice. You can see your streak, completed challenges, and quick access to all features.',
    target: '.dashboard-hero',
    icon: Target,
    position: 'bottom-left'
  },
  {
    id: 'daily-practice',
    title: 'Daily Quantum Practices',
    description: 'Each day brings a new consciousness exercise',
    content: 'Every day features a unique practice combining meditation, visualization, and quantum field techniques. Practices are designed to progressively expand your consciousness.',
    target: '.practice-card',
    icon: Brain,
    position: 'top-right'
  },
  {
    id: 'progress-tracking',
    title: 'Track Your Transformation',
    description: 'Monitor your quantum evolution with detailed analytics',
    content: 'Track your streak, completion rate, and personal insights. The progress page shows your journey with beautiful visualizations and achievement unlocks.',
    target: '.sidebar-progress',
    icon: Calendar,
    position: 'top-left'
  },
  {
    id: 'journaling',
    title: 'Quantum Journaling',
    description: 'Document your consciousness shifts',
    content: 'Daily journaling helps you track insights, experiences, and breakthroughs. AI analysis identifies patterns in your growth and provides personalized recommendations.',
    icon: Book,
    position: 'center'
  },
  {
    id: 'achievements',
    title: 'Unlock Your Potential',
    description: 'Celebrate milestones with achievement badges',
    content: 'Earn beautiful achievement badges for consistency, breakthroughs, and milestones. Share your progress and inspire others on their quantum journey.',
    target: '.achievements-section',
    icon: Award,
    position: 'bottom-right'
  }
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingTutorial({ 
  isOpen, 
  onClose, 
  onComplete 
}: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const step = onboardingSteps[currentStep];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  // Highlight target elements
  useEffect(() => {
    if (step.target && isOpen) {
      const element = document.querySelector(step.target);
      if (element) {
        element.classList.add('onboarding-highlight');
        return () => element.classList.remove('onboarding-highlight');
      }
    }
  }, [step.target, isOpen, currentStep]);

  if (!isOpen) return null;

  const IconComponent = step.icon;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Tutorial Card */}
      <div className={`fixed z-50 transition-all duration-300 ${
        step.position === 'center' ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' :
        step.position === 'top-left' ? 'top-20 left-8' :
        step.position === 'top-right' ? 'top-20 right-8' :
        step.position === 'bottom-left' ? 'bottom-20 left-8' :
        step.position === 'bottom-right' ? 'bottom-20 right-8' : ''
      }`}>
        <Card className={`w-96 shadow-2xl border-primary/20 ${
          isAnimating ? 'scale-95 opacity-70' : 'scale-100 opacity-100'
        } transition-all duration-300`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Step {currentStep + 1} of {onboardingSteps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-gray-700 leading-relaxed">{step.content}</p>
            
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>
              
              <div className="flex items-center space-x-2">
                {onboardingSteps.map((_, index) => (
                  <div 
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              <Button onClick={handleNext} className="flex items-center space-x-2">
                <span>{currentStep === onboardingSteps.length - 1 ? 'Start Journey' : 'Next'}</span>
                {currentStep === onboardingSteps.length - 1 ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}