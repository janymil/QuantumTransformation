import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Brain, Heart, Sparkles, Target, Star } from 'lucide-react';

interface AssessmentData {
  personalityResponses: any[];
  traumaAssessment: any[];
  goalsAndIntentions: any[];
  preferredApproach: 'scientific' | 'spiritual' | 'mixed';
  communicationStyle: 'gentle' | 'direct' | 'motivational';
}

const assessmentSteps = [
  {
    id: 'welcome',
    title: 'Welcome to AI Couch',
    description: 'Your personal transformation companion'
  },
  {
    id: 'approach',
    title: 'Your Preferred Approach',
    description: 'How would you like to work together?'
  },
  {
    id: 'personality',
    title: 'Personality Assessment',
    description: 'Understanding your unique patterns'
  },
  {
    id: 'healing',
    title: 'Healing Assessment',
    description: 'Identifying areas for growth'
  },
  {
    id: 'goals',
    title: 'Goals & Intentions',
    description: 'What you want to achieve'
  },
  {
    id: 'communication',
    title: 'Communication Style',
    description: 'How you prefer to receive guidance'
  },
  {
    id: 'complete',
    title: 'Profile Complete',
    description: 'Ready to begin your journey'
  }
];

export default function AiCouchOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    personalityResponses: [],
    traumaAssessment: [],
    goalsAndIntentions: [],
    preferredApproach: 'mixed',
    communicationStyle: 'gentle'
  });
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createProfileMutation = useMutation({
    mutationFn: async (data: AssessmentData) => {
      return await apiRequest('POST', '/api/ai-couch/assessment', data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Created Successfully",
        description: "Your AI Couch profile is ready. Let's begin your personalized journey!",
      });
      setLocation('/ai-couch-dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Profile",
        description: error.message || "Failed to create your profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleNext = () => {
    if (currentStep < assessmentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      createProfileMutation.mutate(assessmentData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateAssessmentData = (field: keyof AssessmentData, value: any) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderStep = () => {
    const step = assessmentSteps[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Brain className="w-16 h-16 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Welcome to AI Couch</h2>
              <p className="text-gray-600 mb-6">
                AI Couch is your sophisticated personal transformation companion, combining the wisdom of:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <span>Quantum Consciousness (Joe Dispenza)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  <span>Manifestation (Neville Goddard)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>Trauma-Informed Therapy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  <span>Access Consciousness</span>
                </div>
              </div>
              <p className="text-gray-600 mt-6">
                This assessment will create your personalized coaching profile for truly adaptive challenges.
              </p>
            </div>
          </div>
        );

      case 'approach':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">How would you like to approach your transformation?</h2>
            <RadioGroup 
              value={assessmentData.preferredApproach} 
              onValueChange={(value) => updateAssessmentData('preferredApproach', value)}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="scientific" id="scientific" />
                  <Label htmlFor="scientific" className="flex-1">
                    <div className="font-medium">Scientific Approach</div>
                    <div className="text-sm text-gray-600">Evidence-based psychology, neuroscience, and therapeutic techniques</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="spiritual" id="spiritual" />
                  <Label htmlFor="spiritual" className="flex-1">
                    <div className="font-medium">Spiritual Approach</div>
                    <div className="text-sm text-gray-600">Quantum consciousness, manifestation, and energy work</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="mixed" id="mixed" />
                  <Label htmlFor="mixed" className="flex-1">
                    <div className="font-medium">Integrated Approach</div>
                    <div className="text-sm text-gray-600">Balanced combination of science and spirituality</div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        );

      case 'personality':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Understanding Your Patterns</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="learning-style">How do you best learn and process information?</Label>
                <RadioGroup 
                  value={assessmentData.personalityResponses[0] || ''} 
                  onValueChange={(value) => {
                    const responses = [...assessmentData.personalityResponses];
                    responses[0] = value;
                    updateAssessmentData('personalityResponses', responses);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="visual" id="visual" />
                    <Label htmlFor="visual">Visual (images, diagrams, visualization)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auditory" id="auditory" />
                    <Label htmlFor="auditory">Auditory (listening, discussion, music)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="kinesthetic" id="kinesthetic" />
                    <Label htmlFor="kinesthetic">Kinesthetic (movement, hands-on experience)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reading" id="reading" />
                    <Label htmlFor="reading">Reading/Writing (text, journaling, analysis)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="decision-making">How do you typically make important decisions?</Label>
                <RadioGroup 
                  value={assessmentData.personalityResponses[1] || ''} 
                  onValueChange={(value) => {
                    const responses = [...assessmentData.personalityResponses];
                    responses[1] = value;
                    updateAssessmentData('personalityResponses', responses);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="logical" id="logical" />
                    <Label htmlFor="logical">Logical analysis and research</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="intuitive" id="intuitive" />
                    <Label htmlFor="intuitive">Gut feeling and intuition</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="emotional" id="emotional" />
                    <Label htmlFor="emotional">How I feel about it emotionally</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="collaborative" id="collaborative" />
                    <Label htmlFor="collaborative">Seeking advice from others</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="stress-response">When facing challenges or stress, you tend to:</Label>
                <Textarea
                  placeholder="Describe how you typically respond to stress or challenges..."
                  value={assessmentData.personalityResponses[2] || ''}
                  onChange={(e) => {
                    const responses = [...assessmentData.personalityResponses];
                    responses[2] = e.target.value;
                    updateAssessmentData('personalityResponses', responses);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'healing':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Areas for Growth & Healing</h2>
            <p className="text-gray-600">This helps us understand where to focus your personalized program.</p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="healing-readiness">How ready do you feel to work on deep personal transformation? (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={assessmentData.traumaAssessment[0] || ''}
                  onChange={(e) => {
                    const assessment = [...assessmentData.traumaAssessment];
                    assessment[0] = parseInt(e.target.value);
                    updateAssessmentData('traumaAssessment', assessment);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="current-challenges">What are your biggest current challenges or patterns you'd like to change?</Label>
                <Textarea
                  placeholder="Describe the patterns, beliefs, or challenges you're experiencing..."
                  value={assessmentData.traumaAssessment[1] || ''}
                  onChange={(e) => {
                    const assessment = [...assessmentData.traumaAssessment];
                    assessment[1] = e.target.value;
                    updateAssessmentData('traumaAssessment', assessment);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="resistance-areas">Are there any areas where you feel resistance or have tried to change before but struggled?</Label>
                <Textarea
                  placeholder="What feels difficult or where do you get stuck?"
                  value={assessmentData.traumaAssessment[2] || ''}
                  onChange={(e) => {
                    const assessment = [...assessmentData.traumaAssessment];
                    assessment[2] = e.target.value;
                    updateAssessmentData('traumaAssessment', assessment);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="support-needs">What kind of support feels most helpful to you?</Label>
                <Textarea
                  placeholder="Gentle encouragement, direct feedback, practical tools, emotional support, etc."
                  value={assessmentData.traumaAssessment[3] || ''}
                  onChange={(e) => {
                    const assessment = [...assessmentData.traumaAssessment];
                    assessment[3] = e.target.value;
                    updateAssessmentData('traumaAssessment', assessment);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Your Goals & Intentions</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="primary-goals">What are your main goals for personal transformation?</Label>
                <Textarea
                  placeholder="What do you most want to achieve or become?"
                  value={assessmentData.goalsAndIntentions[0] || ''}
                  onChange={(e) => {
                    const goals = [...assessmentData.goalsAndIntentions];
                    goals[0] = e.target.value;
                    updateAssessmentData('goalsAndIntentions', goals);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="ideal-life">Describe your ideal life 6 months from now:</Label>
                <Textarea
                  placeholder="How would you feel, what would you be doing, how would your relationships be?"
                  value={assessmentData.goalsAndIntentions[1] || ''}
                  onChange={(e) => {
                    const goals = [...assessmentData.goalsAndIntentions];
                    goals[1] = e.target.value;
                    updateAssessmentData('goalsAndIntentions', goals);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="motivation">What motivates you most to change and grow?</Label>
                <Textarea
                  placeholder="What drives your desire for transformation?"
                  value={assessmentData.goalsAndIntentions[2] || ''}
                  onChange={(e) => {
                    const goals = [...assessmentData.goalsAndIntentions];
                    goals[2] = e.target.value;
                    updateAssessmentData('goalsAndIntentions', goals);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="life-context">Tell us about your current life context:</Label>
                <Textarea
                  placeholder="Age range, relationship status, work situation, health, living situation - anything relevant"
                  value={assessmentData.goalsAndIntentions[3] || ''}
                  onChange={(e) => {
                    const goals = [...assessmentData.goalsAndIntentions];
                    goals[3] = e.target.value;
                    updateAssessmentData('goalsAndIntentions', goals);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'communication':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">How You Prefer to Receive Guidance</h2>
            
            <RadioGroup 
              value={assessmentData.communicationStyle} 
              onValueChange={(value) => updateAssessmentData('communicationStyle', value)}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="gentle" id="gentle" />
                  <Label htmlFor="gentle" className="flex-1">
                    <div className="font-medium">Gentle & Nurturing</div>
                    <div className="text-sm text-gray-600">Compassionate, supportive, and encouraging</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="direct" id="direct" />
                  <Label htmlFor="direct" className="flex-1">
                    <div className="font-medium">Direct & Practical</div>
                    <div className="text-sm text-gray-600">Clear, straightforward, and action-oriented</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="motivational" id="motivational" />
                  <Label htmlFor="motivational" className="flex-1">
                    <div className="font-medium">Motivational & Inspiring</div>
                    <div className="text-sm text-gray-600">Energizing, empowering, and uplifting</div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Target className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Profile Complete!</h2>
              <p className="text-gray-600 mb-6">
                Your AI Couch profile has been created. You're now ready to begin your personalized transformation journey with:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <strong>Adaptive Challenges</strong><br />
                  Personalized daily activities that evolve with your progress
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <strong>AI Coaching Sessions</strong><br />
                  Deep conversations that understand your unique patterns
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <strong>Emotional Intelligence</strong><br />
                  AI that recognizes and adapts to your emotional state
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <strong>Continuous Learning</strong><br />
                  System that learns from your responses and grows with you
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    const step = assessmentSteps[currentStep];
    
    switch (step.id) {
      case 'welcome':
        return true;
      case 'approach':
        return assessmentData.preferredApproach !== '' && 
               (assessmentData.preferredApproach === 'mixed' || 
                assessmentData.preferredApproach === 'scientific' || 
                assessmentData.preferredApproach === 'spiritual');
      case 'personality':
        return assessmentData.personalityResponses.length >= 3 && 
               assessmentData.personalityResponses.every(r => r !== '');
      case 'healing':
        return assessmentData.traumaAssessment.length >= 4 && 
               assessmentData.traumaAssessment.every(r => r !== '');
      case 'goals':
        return assessmentData.goalsAndIntentions.length >= 4 && 
               assessmentData.goalsAndIntentions.every(r => r !== '');
      case 'communication':
        return assessmentData.communicationStyle !== '' && 
               (assessmentData.communicationStyle === 'gentle' || 
                assessmentData.communicationStyle === 'direct' || 
                assessmentData.communicationStyle === 'motivational');
      case 'complete':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Progress value={(currentStep / (assessmentSteps.length - 1)) * 100} className="w-full" />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>Step {currentStep + 1} of {assessmentSteps.length}</span>
          <span>{Math.round((currentStep / (assessmentSteps.length - 1)) * 100)}% Complete</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{assessmentSteps[currentStep].title}</CardTitle>
          <p className="text-gray-600">{assessmentSteps[currentStep].description}</p>
        </CardHeader>
        <CardContent>
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!canProceed() || createProfileMutation.isPending}
            >
              {currentStep === assessmentSteps.length - 1 ? 
                (createProfileMutation.isPending ? 'Creating Profile...' : 'Complete Setup') : 
                'Next'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}