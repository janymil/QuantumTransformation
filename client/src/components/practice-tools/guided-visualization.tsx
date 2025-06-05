import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";

interface VisualizationStep {
  id: number;
  title: string;
  text: string;
  duration: number; // seconds
  prompt?: string;
}

interface GuidedVisualizationProps {
  scenario: string;
  onClose?: () => void;
}

export default function GuidedVisualization({ scenario = "Success Achievement", onClose }: GuidedVisualizationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepProgress, setStepProgress] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // Visualization scenarios
  const scenarios = {
    "Success Achievement": [
      {
        id: 1,
        title: "Preparation",
        text: "Find a comfortable position and close your eyes. Take three deep breaths, allowing your body to relax completely with each exhale.",
        duration: 15,
        prompt: "How does your body feel as you relax?"
      },
      {
        id: 2,
        title: "Setting the Scene",
        text: "Imagine yourself one year from now, having achieved your most important goal. See yourself in the environment where this success has manifested.",
        duration: 20,
        prompt: "What do you see around you? Describe the setting in detail."
      },
      {
        id: 3,
        title: "Embodying Success",
        text: "Feel the confidence and joy flowing through your body. Notice how you stand, how you move, the expression on your face. You are the successful version of yourself.",
        duration: 25,
        prompt: "What emotions are you experiencing in this moment?"
      },
      {
        id: 4,
        title: "Connecting with Others",
        text: "See the people around you celebrating your achievement. Feel their genuine joy and support. Notice how your success positively impacts those you care about.",
        duration: 20,
        prompt: "Who is celebrating with you and what are they saying?"
      },
      {
        id: 5,
        title: "Anchoring the Vision",
        text: "Take this feeling of success and breathe it into every cell of your body. Know that this future is not just possible, but inevitable. You are already becoming this person.",
        duration: 15,
        prompt: "What one word captures this feeling of inevitable success?"
      }
    ],
    "Financial Freedom": [
      {
        id: 1,
        title: "Relaxation",
        text: "Breathe deeply and allow yourself to release any tension or worry about money. You are safe and abundant in this moment.",
        duration: 12,
        prompt: "What physical sensations do you notice as you release financial stress?"
      },
      {
        id: 2,
        title: "Abundant Environment",
        text: "Visualize yourself in a beautiful space that represents financial freedom to you. Perhaps it's your dream home, a peaceful garden, or a successful business.",
        duration: 18,
        prompt: "Describe this space in vivid detail."
      },
      {
        id: 3,
        title: "Money Flow",
        text: "See money flowing to you easily and effortlessly from multiple sources. Watch as opportunities, ideas, and resources come to you naturally.",
        duration: 22,
        prompt: "What does this abundant flow look and feel like?"
      },
      {
        id: 4,
        title: "Generous Living",
        text: "Experience the joy of having more than enough - enough to live beautifully, to help others, to make a positive impact. Feel the freedom this abundance brings.",
        duration: 20,
        prompt: "How does it feel to live and give from abundance?"
      },
      {
        id: 5,
        title: "Integration",
        text: "Anchor this feeling of financial freedom in your heart. Know that you are worthy of abundance and that it flows to you naturally and consistently.",
        duration: 13,
        prompt: "What affirmation will you carry with you about your financial abundance?"
      }
    ]
  };

  const steps = scenarios[scenario as keyof typeof scenarios] || scenarios["Success Achievement"];

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isPlaying && currentStep < steps.length) {
      interval = setInterval(() => {
        setStepProgress(prev => {
          const newProgress = prev + 1;
          if (newProgress >= steps[currentStep].duration) {
            // Move to next step
            if (currentStep < steps.length - 1) {
              setCurrentStep(curr => curr + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return steps[currentStep].duration;
            }
          }
          return newProgress;
        });
        setTotalTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentStep, steps]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
      setStepProgress(0);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setStepProgress(0);
    setTotalTime(0);
    setIsPlaying(false);
  };

  const getCurrentProgress = () => {
    return (stepProgress / steps[currentStep].duration) * 100;
  };

  const getOverallProgress = () => {
    const completedSteps = currentStep;
    const currentStepProgress = stepProgress / steps[currentStep].duration;
    return ((completedSteps + currentStepProgress) / steps.length) * 100;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Guided Visualization: {scenario}</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Follow along with this guided journey to manifest your desires
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{currentStep + 1} of {steps.length}</span>
          </div>
          <Progress value={getOverallProgress()} className="h-2" />
        </div>

        {/* Current Step */}
        <div className="bg-muted/50 p-6 rounded-lg space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">{steps[currentStep].title}</h3>
            <div className="text-sm text-muted-foreground mb-4">
              Step {currentStep + 1} • {steps[currentStep].duration} seconds
            </div>
          </div>

          <div className="text-center text-lg leading-relaxed mb-4">
            {steps[currentStep].text}
          </div>

          {steps[currentStep].prompt && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="text-sm font-medium text-primary mb-2">Reflection Prompt:</div>
              <div className="text-sm italic">{steps[currentStep].prompt}</div>
            </div>
          )}

          {/* Step Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step Progress</span>
              <span>{stepProgress}s / {steps[currentStep].duration}s</span>
            </div>
            <Progress value={getCurrentProgress()} className="h-1" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={togglePlay}
            variant={isPlaying ? "secondary" : "default"}
            size="lg"
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Start'}
          </Button>
          
          <Button 
            onClick={nextStep} 
            variant="outline" 
            size="lg"
            disabled={currentStep >= steps.length - 1}
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Next
          </Button>
          
          <Button onClick={reset} variant="outline" size="lg">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Stats */}
        <div className="text-center text-sm text-muted-foreground">
          <div>Total session time: {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}</div>
          {currentStep === steps.length - 1 && stepProgress >= steps[currentStep].duration && (
            <div className="text-primary font-medium mt-2">✨ Visualization Complete! ✨</div>
          )}
        </div>

        {onClose && (
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}