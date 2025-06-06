import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Upload, 
  Type, 
  RotateCw, 
  Move, 
  Eye,
  Palette,
  Save,
  Image,
  MousePointer2
} from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number; // seconds
  instructions: string[];
  demonstration?: string;
  tips?: string[];
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Vision Board Creator',
    description: 'Create powerful visual representations of your goals and dreams',
    icon: <Eye className="w-6 h-6" />,
    duration: 8,
    instructions: [
      'Vision boards help manifest your goals through visual representation',
      'Combine images, text, and creative layouts to build your dream board',
      'Use mood themes to align your board with your emotional state'
    ],
    tips: ['Start with a clear intention for your vision board', 'Choose images that evoke strong positive emotions']
  },
  {
    id: 'upload',
    title: 'Uploading Images',
    description: 'Add meaningful images to your vision board',
    icon: <Upload className="w-6 h-6" />,
    duration: 12,
    instructions: [
      'Click the "Upload Image" button in the toolbar',
      'Select high-quality images that represent your goals',
      'Images are automatically compressed and optimized',
      'Uploaded images appear on your canvas ready for positioning'
    ],
    demonstration: 'Click the upload button → Select image → Image appears on canvas',
    tips: [
      'Use clear, high-resolution images for best results',
      'Choose images that make you feel inspired and motivated',
      'Consider the emotional impact of each image'
    ]
  },
  {
    id: 'positioning',
    title: 'Moving and Positioning',
    description: 'Arrange elements exactly where you want them',
    icon: <Move className="w-6 h-6" />,
    duration: 10,
    instructions: [
      'Click and drag any image or text to move it',
      'Position elements to create visual flow and balance',
      'Overlap elements for creative layering effects',
      'Use the canvas space efficiently'
    ],
    demonstration: 'Click image → Drag to new position → Release to place',
    tips: [
      'Create visual hierarchy with positioning',
      'Group related elements together',
      'Leave some white space for breathing room'
    ]
  },
  {
    id: 'resizing',
    title: 'Resizing Elements',
    description: 'Adjust the size of images for perfect composition',
    icon: <MousePointer2 className="w-6 h-6" />,
    duration: 15,
    instructions: [
      'Select an image by clicking on it',
      'Blue resize handles appear at the corners and edges',
      'Drag corner handles to resize proportionally',
      'Drag edge handles to stretch in one direction',
      'Handles are large (20px) for easy interaction'
    ],
    demonstration: 'Select image → Drag blue corner handle → Resize proportionally',
    tips: [
      'Use corner handles to maintain aspect ratio',
      'Make important elements larger to draw attention',
      'Size elements relative to their importance in your goals'
    ]
  },
  {
    id: 'rotation',
    title: 'Rotating Images',
    description: 'Add dynamic angles to your visual composition',
    icon: <RotateCw className="w-6 h-6" />,
    duration: 12,
    instructions: [
      'Select an image to see the green rotation handle',
      'The rotation handle appears above the image',
      'Click and drag the green handle to rotate',
      'Rotation is smooth and real-time',
      'Large hit area (25px zone) for easy interaction'
    ],
    demonstration: 'Select image → Find green rotation handle above → Drag to rotate',
    tips: [
      'Slight rotations can add visual interest',
      'Align rotated elements with the overall design flow',
      'Use rotation sparingly for best effect'
    ]
  },
  {
    id: 'text',
    title: 'Adding Text and Affirmations',
    description: 'Include powerful words and affirmations',
    icon: <Type className="w-6 h-6" />,
    duration: 15,
    instructions: [
      'Click "Add Text" to create text elements',
      'Type your affirmations, goals, or inspirational quotes',
      'Customize font size, color, and alignment',
      'Choose fonts that match your board\'s mood',
      'Text elements can be moved and positioned like images'
    ],
    demonstration: 'Click Add Text → Type message → Customize styling → Position on board',
    tips: [
      'Use positive, present-tense affirmations',
      'Keep text concise and impactful',
      'Choose colors that complement your images',
      'Consider text as a design element, not just information'
    ]
  },
  {
    id: 'themes',
    title: 'Mood-Based Themes',
    description: 'Set the emotional tone with color themes',
    icon: <Palette className="w-6 h-6" />,
    duration: 10,
    instructions: [
      'Click the theme selector to browse mood themes',
      'Choose themes that match your current emotional state',
      'Themes affect the entire interface and canvas background',
      'Switch between light and dark modes',
      'Each theme is designed for specific moods and goals'
    ],
    demonstration: 'Click theme selector → Choose mood → See instant color change',
    tips: [
      'Energetic themes boost motivation and action',
      'Calm themes promote reflection and clarity',
      'Nature themes enhance grounding and balance'
    ]
  },
  {
    id: 'capture',
    title: 'Capturing Your Vision',
    description: 'Save and share your completed vision board',
    icon: <Image className="w-6 h-6" />,
    duration: 8,
    instructions: [
      'Click "Capture Vision Board" when you\'re satisfied',
      'High-quality PNG image is generated automatically',
      'Image is optimized and compressed for sharing',
      'Download or save to your device',
      'Use your vision board as wallpaper or print it'
    ],
    demonstration: 'Complete board → Click Capture → Download high-quality image',
    tips: [
      'Capture when your board feels complete and inspiring',
      'Save multiple versions as your goals evolve',
      'Print and place where you\'ll see it daily'
    ]
  },
  {
    id: 'best-practices',
    title: 'Vision Board Best Practices',
    description: 'Maximize the power of your vision board',
    icon: <Save className="w-6 h-6" />,
    duration: 12,
    instructions: [
      'Focus on feelings, not just objects',
      'Include images of yourself achieving goals',
      'Add deadline or timeline elements',
      'Review and update your board regularly',
      'Take action inspired by your visual goals'
    ],
    tips: [
      'Place your board where you\'ll see it daily',
      'Spend time visualizing with your board',
      'Update as you achieve goals and set new ones',
      'Trust the process and stay committed to your vision'
    ]
  }
];

interface VisionBoardTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function VisionBoardTour({ isOpen, onClose, onComplete }: VisionBoardTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const currentTourStep = tourSteps[currentStep];

  useEffect(() => {
    if (!isOpen) return;
    setTimeRemaining(currentTourStep.duration);
    setProgress(0);
  }, [currentStep, isOpen, currentTourStep.duration]);

  useEffect(() => {
    if (!isPlaying || !isOpen) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          if (currentStep < tourSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
          } else {
            onComplete();
          }
          return 0;
        }
        return prev - 1;
      });

      setProgress(prev => {
        const newProgress = prev + (100 / currentTourStep.duration);
        return Math.min(newProgress, 100);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isOpen, currentStep, currentTourStep.duration, onComplete]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setIsPlaying(false);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsPlaying(false);
    }
  };

  const handleStepSelect = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setIsPlaying(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {currentTourStep.icon}
            </div>
            <div>
              <CardTitle className="text-xl">{currentTourStep.title}</CardTitle>
              <p className="text-muted-foreground text-sm">
                Step {currentStep + 1} of {tourSteps.length}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto flex-1">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{currentTourStep.description}</span>
              <span>{timeRemaining}s remaining</span>
            </div>
          </div>

          {/* Video-like Controls */}
          <div className="flex items-center justify-center gap-4 py-4 border-y">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="default" 
              size="lg" 
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNext}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Step Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Instructions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Instructions</h3>
              <ul className="space-y-2">
                {currentTourStep.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5 text-xs px-2">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{instruction}</span>
                  </li>
                ))}
              </ul>

              {currentTourStep.demonstration && (
                <div className="p-3 bg-primary/5 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Quick Demo:</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentTourStep.demonstration}
                  </p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Pro Tips</h3>
              {currentTourStep.tips && (
                <ul className="space-y-2">
                  {currentTourStep.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {tourSteps.map((step, index) => (
              <Button
                key={step.id}
                variant={index === currentStep ? "default" : "outline"}
                size="sm"
                onClick={() => handleStepSelect(index)}
                className="text-xs"
              >
                {index + 1}. {step.title}
              </Button>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Skip Tutorial
            </Button>
            <div className="flex gap-2">
              {currentStep === tourSteps.length - 1 ? (
                <Button onClick={onComplete}>
                  Complete Tutorial
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next Step
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}