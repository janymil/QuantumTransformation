import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Lightbulb, 
  Target, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Book,
  MessageCircle
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MicroLearningContent {
  title: string;
  insight: string;
  practicalTip: string;
  scienceConnection: string;
  reflectionQuestion: string;
  duration: number;
}

interface MicroLearningCardProps {
  day: number;
  topic: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export default function MicroLearningCard({ day, topic, userLevel = 'beginner' }: MicroLearningCardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const { data: content, isLoading } = useQuery({
    queryKey: ['/api/micro-learning', day, topic, userLevel],
    enabled: !!day && !!topic
  });

  const completeStepMutation = useMutation({
    mutationFn: async (stepData: any) => {
      return apiRequest('/api/micro-learning/complete', {
        method: 'POST',
        body: JSON.stringify(stepData)
      });
    }
  });

  const microContent: MicroLearningContent = content || {
    title: "The Observer Effect in Daily Life",
    insight: "Every time you consciously observe your thoughts without judgment, you're activating the quantum observer effect. This simple act of awareness begins to collapse limiting patterns and opens space for new possibilities.",
    practicalTip: "Set three random phone alarms today. When they ring, pause and observe your current thoughts without changing them.",
    scienceConnection: "Neuroscience shows that mindful observation activates the prefrontal cortex, literally rewiring your brain for greater self-awareness and emotional regulation.",
    reflectionQuestion: "What patterns do you notice when you observe your thoughts throughout the day?",
    duration: 3
  };

  const steps = [
    {
      icon: Brain,
      title: "Key Insight",
      content: microContent.insight,
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Target,
      title: "Practice This",
      content: microContent.practicalTip,
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Lightbulb,
      title: "The Science",
      content: microContent.scienceConnection,
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: MessageCircle,
      title: "Reflect",
      content: microContent.reflectionQuestion,
      color: "from-orange-500 to-red-500"
    }
  ];

  useEffect(() => {
    if (currentStep === 0 && !startTime) {
      setStartTime(new Date());
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
      if (startTime) {
        const completionTime = new Date();
        const timeSpent = Math.round((completionTime.getTime() - startTime.getTime()) / 1000 / 60);
        
        completeStepMutation.mutate({
          day,
          topic,
          timeSpent,
          completed: true
        });
      }
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsCompleted(false);
    setStartTime(new Date());
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="text-purple-500" size={20} />
            </motion.div>
            <span className="text-gray-600 dark:text-gray-400">Loading your micro-lesson...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Book className="text-purple-500" size={20} />
          <CardTitle className="text-lg">Daily Micro-Learning</CardTitle>
        </div>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock size={14} />
            <span>{microContent.duration} min</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Day {day}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>{isCompleted ? 'Complete!' : `${currentStep + 1}/${steps.length}`}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${isCompleted ? 100 : ((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {!isCompleted ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[200px]"
              >
                <div className={`p-4 rounded-lg bg-gradient-to-br ${steps[currentStep].color} text-white mb-4`}>
                  <div className="flex items-center space-x-2 mb-3">
                    {React.createElement(steps[currentStep].icon, { size: 20 })}
                    <h3 className="font-semibold">{steps[currentStep].title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed opacity-95">
                    {steps[currentStep].content}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index <= currentStep 
                            ? 'bg-purple-500' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <Button
                    onClick={handleNext}
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                    <ArrowRight size={14} className="ml-1" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="text-white" size={32} />
                </motion.div>
                
                <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">
                  Micro-Learning Complete!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  You've absorbed today's quantum consciousness insight. 
                  Integration begins now.
                </p>
                
                <div className="space-y-2">
                  <Button
                    onClick={handleRestart}
                    variant="outline"
                    size="sm"
                    className="mr-2"
                  >
                    <Brain size={14} className="mr-1" />
                    Review Again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}