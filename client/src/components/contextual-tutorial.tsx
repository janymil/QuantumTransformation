import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Lightbulb,
  Play,
  Target,
  BookOpen,
  Trophy,
  Brain,
  Sparkles
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  icon: any;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

interface ContextualTutorialProps {
  isVisible: boolean;
  onClose: () => void;
  tutorialType: 'first_login' | 'challenge_start' | 'dashboard_tour' | 'progress_tracking';
  onComplete?: () => void;
}

export default function ContextualTutorial({ 
  isVisible, 
  onClose, 
  tutorialType,
  onComplete 
}: ContextualTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const getTutorialSteps = (): TutorialStep[] => {
    switch (tutorialType) {
      case 'first_login':
        return [
          {
            id: 'welcome',
            title: 'Welcome to Your Quantum Journey',
            content: 'Welcome to the quantum consciousness platform! This brief tour will help you understand how to transform your reality through focused practice.',
            icon: Sparkles,
            action: 'Get Started'
          },
          {
            id: 'dashboard',
            title: 'Your Personal Dashboard',
            content: 'This is your command center. Here you can see all your active challenges, track your progress, and access your daily practices.',
            icon: Target,
            targetElement: '.dashboard-overview',
            position: 'bottom'
          },
          {
            id: 'challenges',
            title: 'Choose Your Path',
            content: 'Select from 5 different quantum consciousness challenges. Each is designed to develop specific aspects of your awareness and manifestation abilities.',
            icon: Brain,
            action: 'Explore Challenges'
          },
          {
            id: 'daily_practice',
            title: 'Daily Practice Sessions',
            content: 'Each day includes guided meditation, journaling prompts, and consciousness exercises. Consistency is key to quantum transformation.',
            icon: Play,
            action: 'Start Today'
          }
        ];
      
      case 'challenge_start':
        return [
          {
            id: 'day_overview',
            title: 'Understanding Your Daily Practice',
            content: 'Each day is carefully structured with meditation, reflection, and action steps. Take your time with each component.',
            icon: BookOpen
          },
          {
            id: 'journaling',
            title: 'The Power of Journaling',
            content: 'Your journal captures insights and tracks your inner transformation. Be honest and detailed in your reflections.',
            icon: BookOpen,
            action: 'Open Journal'
          },
          {
            id: 'progress_tracking',
            title: 'Track Your Evolution',
            content: 'Watch your progress unfold through streaks, achievements, and personal insights. Every step matters in your quantum journey.',
            icon: Trophy
          }
        ];
      
      case 'dashboard_tour':
        return [
          {
            id: 'active_challenges',
            title: 'Active Challenges',
            content: 'View all your current challenges, see your progress, and continue your daily practices from here.',
            icon: Target,
            targetElement: '.challenge-cards',
            position: 'right'
          },
          {
            id: 'progress_stats',
            title: 'Progress Statistics',
            content: 'Track your streaks, completed days, and overall progress. These metrics help maintain momentum and motivation.',
            icon: Trophy,
            targetElement: '.progress-stats',
            position: 'top'
          },
          {
            id: 'quick_actions',
            title: 'Quick Actions',
            content: 'Access your journal, view detailed progress, or start today\'s practice with one click.',
            icon: Lightbulb,
            targetElement: '.action-buttons',
            position: 'left'
          }
        ];
      
      case 'progress_tracking':
        return [
          {
            id: 'progress_overview',
            title: 'Your Progress Dashboard',
            content: 'This detailed view shows your journey through each challenge, including completion rates and growth patterns.',
            icon: Target
          },
          {
            id: 'achievements',
            title: 'Achievements & Milestones',
            content: 'Unlock achievements as you progress. These recognize your dedication and mark important transformation milestones.',
            icon: Trophy,
            targetElement: '.achievements-section',
            position: 'bottom'
          },
          {
            id: 'insights',
            title: 'Personal Insights',
            content: 'Review patterns in your practice, identify areas of growth, and see how your consciousness is expanding over time.',
            icon: Brain
          }
        ];
      
      default:
        return [];
    }
  };

  const steps = getTutorialSteps();

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      setIsCompleted(false);
    }
  }, [isVisible, tutorialType]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 1000);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    onClose();
  };

  if (!isVisible || steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Tutorial Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-md shadow-2xl">
              <CardContent className="p-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 rounded-full p-2">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{currentStepData.title}</h3>
                        <p className="text-sm text-purple-100">
                          Step {currentStep + 1} of {steps.length}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipTutorial}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="bg-white/20 rounded-full h-2">
                      <motion.div
                        className="bg-white rounded-full h-2"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    {currentStepData.content}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="flex items-center"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>

                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        onClick={skipTutorial}
                        className="text-gray-500"
                      >
                        Skip Tour
                      </Button>
                      
                      <Button
                        onClick={nextStep}
                        className="flex items-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
                      >
                        {currentStep === steps.length - 1 ? (
                          'Finish'
                        ) : (
                          <>
                            {currentStepData.action || 'Next'}
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Completion Animation */}
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="fixed inset-0 z-60 flex items-center justify-center"
              >
                <div className="bg-white rounded-full p-8 shadow-2xl">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1 }}
                  >
                    <Trophy className="w-16 h-16 text-yellow-500" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}