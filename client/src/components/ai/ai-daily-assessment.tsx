import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Brain, Lightbulb, Target, Clock, CheckCircle, Loader2 } from 'lucide-react';

interface Exercise {
  id: string;
  type: string;
  title: string;
  description: string;
  duration: number;
  instructions: string[];
  therapeuticBasis: string;
}

interface DailyAssessment {
  id: string;
  title: string;
  description: string;
  currentFocus: string;
  reasoning: string;
  exercises: Exercise[];
  reflectionQuestions: string[];
  completionCriteria: string[];
  isCompleted: boolean;
}

interface AiDailyAssessmentProps {
  assessment: DailyAssessment;
  onComplete: (responses: any) => void;
  isSubmitting: boolean;
}

export function AiDailyAssessment({ assessment, onComplete, isSubmitting }: AiDailyAssessmentProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseResponses, setExerciseResponses] = useState<Record<string, any>>({});
  const [reflectionResponses, setReflectionResponses] = useState<Record<string, string>>({});

  const currentExercise = assessment.exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === assessment.exercises.length - 1;
  const totalSteps = assessment.exercises.length + 1; // +1 for final reflection
  const currentStep = currentExerciseIndex + 1;

  const handleExerciseResponse = (key: string, value: any) => {
    setExerciseResponses(prev => ({
      ...prev,
      [currentExercise.id]: {
        ...prev[currentExercise.id],
        [key]: value
      }
    }));
  };

  const handleNextStep = () => {
    if (isLastExercise) {
      // Move to reflection phase
      setCurrentExerciseIndex(assessment.exercises.length);
    } else {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handleComplete = () => {
    const responses = {
      exercises: exerciseResponses,
      reflections: reflectionResponses,
      overallExperience: reflectionResponses.overall || '',
      completedAt: new Date().toISOString()
    };
    onComplete(responses);
  };

  if (assessment.isCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Today's Assessment Completed
          </CardTitle>
          <CardDescription>
            Great work! Your AI coach is analyzing your responses to adapt tomorrow's content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800 font-medium">Focus Area: {assessment.currentFocus}</p>
              <p className="text-green-700 text-sm mt-1">{assessment.reasoning}</p>
            </div>
            <p className="text-muted-foreground text-sm">
              Return tomorrow for your next personalized session based on today's insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show reflection phase
  if (currentExerciseIndex >= assessment.exercises.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Reflection & Integration
          </CardTitle>
          <CardDescription>
            Take a moment to reflect on today's exercises and insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {assessment.reflectionQuestions.map((question, index) => (
              <div key={index} className="space-y-2">
                <Label className="text-sm font-medium">{question}</Label>
                <Textarea
                  placeholder="Share your thoughts and insights..."
                  value={reflectionResponses[`question_${index}`] || ''}
                  onChange={(e) => setReflectionResponses(prev => ({
                    ...prev,
                    [`question_${index}`]: e.target.value
                  }))}
                  className="min-h-[80px]"
                />
              </div>
            ))}
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Overall Experience Today</Label>
              <Textarea
                placeholder="How was your overall experience with today's exercises?"
                value={reflectionResponses.overall || ''}
                onChange={(e) => setReflectionResponses(prev => ({
                  ...prev,
                  overall: e.target.value
                }))}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <Button 
            onClick={handleComplete} 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Completing Assessment...
              </>
            ) : (
              'Complete Today\'s Assessment'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show current exercise
  return (
    <div className="space-y-6">
      {/* AI Reasoning Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Today's AI-Recommended Focus
          </CardTitle>
          <CardDescription>
            Your AI coach analyzed your journal entries, saved affirmations, and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900">{assessment.currentFocus}</h3>
              <p className="text-blue-800 text-sm mt-2">{assessment.reasoning}</p>
            </div>
            <div className="flex items-center gap-4">
              <Progress value={(currentStep / totalSteps) * 100} className="flex-1" />
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Exercise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            {currentExercise.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-4">
            <span>{currentExercise.description}</span>
            <Badge variant="outline" className="ml-auto">
              <Clock className="w-3 h-3 mr-1" />
              {currentExercise.duration} min
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Instructions</h4>
              <ol className="space-y-2">
                {currentExercise.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                      {index + 1}
                    </span>
                    <span className="text-sm">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Therapeutic Basis:</strong> {currentExercise.therapeuticBasis}
              </p>
            </div>
          </div>

          {/* Exercise Response Area */}
          <div className="space-y-4">
            <h4 className="font-medium">Your Experience</h4>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm">How did this exercise feel for you?</Label>
                <RadioGroup
                  value={exerciseResponses[currentExercise.id]?.feeling || ''}
                  onValueChange={(value) => handleExerciseResponse('feeling', value)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="challenging" id="challenging" />
                    <Label htmlFor="challenging" className="text-sm">Challenging</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="neutral" id="neutral" />
                    <Label htmlFor="neutral" className="text-sm">Neutral</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="helpful" id="helpful" />
                    <Label htmlFor="helpful" className="text-sm">Helpful</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="transformative" id="transformative" />
                    <Label htmlFor="transformative" className="text-sm">Transformative</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm">Share any insights or observations</Label>
                <Textarea
                  placeholder="What did you notice during this exercise? Any thoughts, feelings, or realizations?"
                  value={exerciseResponses[currentExercise.id]?.insights || ''}
                  onChange={(e) => handleExerciseResponse('insights', e.target.value)}
                  className="mt-2 min-h-[100px]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
              disabled={currentExerciseIndex === 0}
            >
              Previous
            </Button>
            <Button onClick={handleNextStep}>
              {isLastExercise ? 'Continue to Reflection' : 'Next Exercise'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}