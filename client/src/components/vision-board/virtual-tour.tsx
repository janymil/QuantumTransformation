import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Pause, RotateCcw, ChevronLeft, ChevronRight, 
  PlayCircle, Book, Lightbulb, Target, Image, 
  Type, Palette, Save, Share2, Sparkles, Crown,
  MousePointer, Camera, Download, Settings, Eye
} from "lucide-react";

interface VirtualTourProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCreating?: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  imageUrl?: string;
  tips: string[];
  category: 'basics' | 'design' | 'advanced' | 'features';
}

export default function VirtualTour({
  isOpen,
  onClose,
  onStartCreating
}: VirtualTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('basics');

  const tourSteps: TourStep[] = [
    // Basics
    {
      id: 'welcome',
      title: 'Welcome to Vision Board Creation',
      description: 'Learn how to create powerful vision boards that manifest your dreams',
      content: 'Vision boards are visual representations of your goals, dreams, and aspirations. They help you clarify your intentions, focus your energy, and attract what you desire into your life.',
      tips: [
        'Start with clear intentions about what you want to achieve',
        'Choose images and words that evoke strong emotions',
        'Place your vision board where you will see it daily',
        'Update it regularly as your goals evolve'
      ],
      category: 'basics'
    },
    {
      id: 'getting-started',
      title: 'Getting Started: Your First Vision Board',
      description: 'Step-by-step process to create your first vision board',
      content: '1. Click "Create New Vision Board" to start\n2. Choose a template or start from scratch\n3. Set your canvas size and background\n4. Begin adding elements that represent your goals',
      tips: [
        'Take time to reflect on your goals before starting',
        'Gather inspiration images beforehand',
        'Start simple - you can always add more later',
        'Focus on one life area at a time if overwhelmed'
      ],
      category: 'basics'
    },
    {
      id: 'canvas-basics',
      title: 'Understanding the Canvas',
      description: 'Navigate and work with your vision board canvas',
      content: 'The canvas is your creative workspace. You can zoom in/out, drag elements around, resize them, and layer multiple items. Use the toolbar for quick actions and the sidebar for detailed editing.',
      tips: [
        'Use zoom to work on detailed arrangements',
        'Hold Shift while resizing to maintain proportions',
        'Right-click elements for more options',
        'Use Ctrl+Z to undo changes'
      ],
      category: 'basics'
    },
    
    // Design
    {
      id: 'adding-images',
      title: 'Adding Powerful Images',
      description: 'Learn how to add and optimize images for maximum impact',
      content: 'Images are the heart of your vision board. You can upload personal photos, generate AI images, capture screenshots, or choose from our library. Each image should represent something you want to achieve or experience.',
      tips: [
        'Choose high-quality, inspiring images',
        'Use images that make you feel excited',
        'Mix personal photos with aspirational images',
        'Consider the emotional impact of each image'
      ],
      category: 'design'
    },
    {
      id: 'text-affirmations',
      title: 'Adding Meaningful Text & Affirmations',
      description: 'Use words and affirmations to amplify your intentions',
      content: 'Text elements help clarify your goals and reinforce positive thinking. Add inspiring quotes, specific goals, affirmations, or key words that resonate with your vision.',
      tips: [
        'Use present tense affirmations ("I am" not "I will")',
        'Keep text clear and readable',
        'Choose fonts that match your vision\'s energy',
        'Include specific numbers and dates for goals'
      ],
      category: 'design'
    },
    {
      id: 'color-psychology',
      title: 'Color Psychology in Vision Boards',
      description: 'Use colors strategically to enhance manifestation',
      content: 'Colors affect our emotions and energy. Red energizes, blue calms, green represents growth, yellow inspires creativity, and purple connects to spirituality. Choose colors that align with your goals.',
      tips: [
        'Red: Passion, energy, action, love',
        'Blue: Peace, trust, communication, clarity',
        'Green: Growth, money, health, harmony',
        'Yellow: Creativity, optimism, confidence',
        'Purple: Spirituality, intuition, luxury'
      ],
      category: 'design'
    },
    {
      id: 'composition-layout',
      title: 'Creating Balanced Compositions',
      description: 'Design principles for visually appealing vision boards',
      content: 'Good composition makes your vision board more powerful and easier to visualize. Use the rule of thirds, create focal points, balance elements, and ensure smooth visual flow.',
      tips: [
        'Place important elements at intersection points',
        'Balance large and small elements',
        'Create visual pathways for the eye to follow',
        'Leave some white space to avoid clutter'
      ],
      category: 'design'
    },

    // Advanced
    {
      id: 'ai-personalization',
      title: 'AI-Powered Personalization',
      description: 'Let AI analyze your goals and suggest improvements',
      content: 'Our AI analyzes your journal entries, progress data, and affirmations to suggest personalized elements for your vision board. This creates a more authentic and powerful manifestation tool.',
      tips: [
        'Keep detailed journal entries for better AI insights',
        'Track your progress regularly',
        'Review and apply AI suggestions that resonate',
        'Combine AI suggestions with your intuition'
      ],
      category: 'advanced'
    },
    {
      id: 'dynamic-elements',
      title: 'Creating Dynamic Vision Boards',
      description: 'Add interactive and evolving elements',
      content: 'Make your vision board come alive with progress trackers, date countdowns, achievement badges, and elements that change as you reach milestones.',
      tips: [
        'Add progress bars for ongoing goals',
        'Include milestone celebration elements',
        'Use layers to show goal evolution',
        'Create seasonal or quarterly updates'
      ],
      category: 'advanced'
    },
    {
      id: 'multi-board-strategy',
      title: 'Multi-Board Strategy',
      description: 'Create specialized boards for different life areas',
      content: 'Create separate vision boards for career, relationships, health, finances, and personal growth. This allows deeper focus on specific areas while maintaining an overall life vision.',
      tips: [
        'Start with one main board, then specialize',
        'Create quarterly or yearly themed boards',
        'Link related goals across different boards',
        'Review all boards regularly for alignment'
      ],
      category: 'advanced'
    },

    // Features
    {
      id: 'templates-library',
      title: 'Using Templates Effectively',
      description: 'Leverage our template library for quick starts',
      content: 'Templates provide structure and inspiration for specific goals like wealth building, health transformation, or career success. Customize them with your personal images and text.',
      tips: [
        'Choose templates that match your primary goals',
        'Customize templates with personal elements',
        'Use templates as starting points, not final products',
        'Mix elements from different templates'
      ],
      category: 'features'
    },
    {
      id: 'mobile-wallpapers',
      title: 'Mobile Wallpaper Generation',
      description: 'Keep your vision with you everywhere',
      content: 'Convert your vision board into mobile wallpapers to keep your goals visible throughout the day. This constant reminder helps maintain focus and motivation.',
      tips: [
        'Create simplified versions for mobile screens',
        'Focus on key elements for mobile wallpapers',
        'Update wallpapers when you achieve goals',
        'Use different wallpapers for lock and home screens'
      ],
      category: 'features'
    },
    {
      id: 'sharing-collaboration',
      title: 'Sharing and Collaboration',
      description: 'Share your vision or create group boards',
      content: 'Share your vision boards with accountability partners, coaches, or create collaborative family/team boards. Sharing amplifies intention and creates support systems.',
      tips: [
        'Share with trusted supporters only',
        'Create family or couple vision boards',
        'Use sharing for accountability',
        'Respect privacy when sharing personal goals'
      ],
      category: 'features'
    },
    {
      id: 'progress-tracking',
      title: 'Progress Tracking Integration',
      description: 'Connect your vision board to real progress',
      content: 'Link your vision board elements to progress tracking, journal entries, and achievements. This creates a dynamic system that evolves with your growth.',
      tips: [
        'Update elements when goals are achieved',
        'Track progress visually on your board',
        'Celebrate milestones by updating your board',
        'Review and adjust goals based on progress'
      ],
      category: 'features'
    }
  ];

  const categories = {
    basics: { label: 'Getting Started', icon: Book, color: 'blue' },
    design: { label: 'Design & Layout', icon: Palette, color: 'green' },
    advanced: { label: 'Advanced Techniques', icon: Crown, color: 'purple' },
    features: { label: 'Platform Features', icon: Settings, color: 'orange' }
  };

  const filteredSteps = tourSteps.filter(step => step.category === selectedCategory);
  const currentStepData = filteredSteps[currentStep];
  const totalSteps = filteredSteps.length;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetTour = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const autoProgress = () => {
    if (isPlaying && currentStep < totalSteps - 1) {
      setTimeout(() => {
        nextStep();
      }, 8000); // 8 seconds per step
    } else if (currentStep === totalSteps - 1) {
      setIsPlaying(false);
    }
  };

  // Auto-progress when playing
  if (isPlaying) {
    autoProgress();
  }

  const getProgressPercentage = () => {
    return ((currentStep + 1) / totalSteps) * 100;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-blue-600" />
            Vision Board Creation Guide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={(value) => {
            setSelectedCategory(value);
            setCurrentStep(0);
            setIsPlaying(false);
          }}>
            <TabsList className="grid w-full grid-cols-4">
              {Object.entries(categories).map(([key, cat]) => {
                const Icon = cat.icon;
                return (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{cat.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.keys(categories).map((category) => (
              <TabsContent key={category} value={category} className="mt-6">
                {currentStepData && (
                  <div className="space-y-6">
                    {/* Progress and Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetTour}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {currentStep + 1} of {totalSteps}
                        </span>
                        <Progress 
                          value={getProgressPercentage()} 
                          className="w-32"
                        />
                      </div>
                    </div>

                    {/* Main Content */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {currentStepData.description}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className={`text-${categories[currentStepData.category].color}-600`}>
                            {categories[currentStepData.category].label}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        {/* Video/Image Placeholder */}
                        <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-200">
                          <div className="text-center">
                            <PlayCircle className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                            <p className="text-lg font-medium text-blue-900">Interactive Demo</p>
                            <p className="text-sm text-blue-700">Step-by-step visual guide</p>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="prose max-w-none">
                          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {currentStepData.content}
                          </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                          <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Pro Tips
                          </h4>
                          <ul className="space-y-2">
                            {currentStepData.tips.map((tip, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-orange-800">
                                <div className="w-1 h-1 bg-orange-600 rounded-full mt-2 flex-shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous
                          </Button>

                          <div className="flex gap-2">
                            {filteredSteps.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                              />
                            ))}
                          </div>

                          <Button
                            onClick={nextStep}
                            disabled={currentStep === totalSteps - 1}
                          >
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Quick Start Actions */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Ready to Create Your Vision Board?
                  </h3>
                  <p className="text-blue-700">
                    Apply what you've learned and start manifesting your dreams today.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    <Book className="w-4 h-4 mr-2" />
                    Continue Learning
                  </Button>
                  {onStartCreating && (
                    <Button onClick={() => {
                      onStartCreating();
                      onClose();
                    }}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Creating
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="p-4">
                <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-semibold mb-1">Goal Setting</h4>
                <p className="text-xs text-muted-foreground">
                  Learn SMART goal techniques
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-4">
                <Image className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold mb-1">Design Tips</h4>
                <p className="text-xs text-muted-foreground">
                  Visual composition guide
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-4">
                <Crown className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-semibold mb-1">Advanced Features</h4>
                <p className="text-xs text-muted-foreground">
                  AI and automation tools
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close Guide
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}