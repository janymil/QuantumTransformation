import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Heart, 
  Sparkles, 
  Quote,
  Share,
  BookHeart,
  Wand2
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MotivationQuote {
  text: string;
  theme: string;
  energy: number;
  personalizedFor: string;
}

interface AIMotivationWidgetProps {
  day: number;
  userMood?: number;
  userEnergy?: number;
  userGoals?: string;
  onQuoteSave?: (quote: string) => void;
}

export default function AIMotivationWidget({ 
  day, 
  userMood = 5, 
  userEnergy = 5, 
  userGoals,
  onQuoteSave 
}: AIMotivationWidgetProps) {
  const [currentQuote, setCurrentQuote] = useState<MotivationQuote | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  const generateQuoteMutation = useMutation({
    mutationFn: async (requestData: any) => {
      return apiRequest('/api/ai/affirmation', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data) => {
      setCurrentQuote({
        text: data.affirmation,
        theme: getThemeForMood(userMood),
        energy: userEnergy,
        personalizedFor: userGoals || 'consciousness expansion'
      });
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Error generating quote:', error);
      setIsGenerating(false);
    }
  });

  const getThemeForMood = (mood: number) => {
    if (mood <= 3) return 'Uplifting & Comforting';
    if (mood <= 6) return 'Motivating & Energizing';
    if (mood <= 8) return 'Empowering & Confident';
    return 'Transcendent & Inspiring';
  };

  const getGradientForMood = (mood: number) => {
    if (mood <= 3) return 'from-blue-400 to-cyan-500';
    if (mood <= 6) return 'from-green-400 to-emerald-500';
    if (mood <= 8) return 'from-purple-400 to-pink-500';
    return 'from-orange-400 to-red-500';
  };

  const generateNewQuote = () => {
    setIsGenerating(true);
    
    const recentInsights = [
      'Developing deeper awareness of thought patterns',
      'Understanding the power of conscious observation',
      'Exploring quantum consciousness principles'
    ];

    const currentChallenges = userMood < 5 ? 
      ['Maintaining consistency', 'Finding motivation'] : 
      userMood < 8 ? 
      ['Deepening practice', 'Staying focused'] : 
      ['Transcending limitations', 'Expanding consciousness'];

    generateQuoteMutation.mutate({
      day,
      mood: userMood,
      currentChallenges,
      recentInsights,
      userGoals
    });
  };

  const handleSaveQuote = () => {
    if (currentQuote && onQuoteSave) {
      onQuoteSave(currentQuote.text);
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 2000);
    }
  };

  const handleShareQuote = async () => {
    if (currentQuote && navigator.share) {
      try {
        await navigator.share({
          title: 'Quantum Consciousness Quote',
          text: currentQuote.text,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(currentQuote.text);
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 2000);
      }
    } else if (currentQuote) {
      navigator.clipboard.writeText(currentQuote.text);
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 2000);
    }
  };

  useEffect(() => {
    // Generate initial quote
    generateNewQuote();
  }, [day, userMood, userEnergy]);

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-lg">
          <Wand2 className="text-purple-500" size={20} />
          AI-Powered Daily Inspiration
          <Sparkles className="text-yellow-500" size={20} />
        </CardTitle>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Badge variant="outline" className="text-xs">
            Day {day}
          </Badge>
          <span>•</span>
          <span>{currentQuote?.theme || 'Generating...'}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <Sparkles className="text-purple-500" size={32} />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400">
                Creating your personalized inspiration...
              </p>
            </motion.div>
          ) : currentQuote ? (
            <motion.div
              key="quote"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className={`p-6 rounded-lg bg-gradient-to-br ${getGradientForMood(userMood)} text-white relative overflow-hidden`}>
                <Quote className="absolute top-2 left-2 opacity-20" size={24} />
                <Quote className="absolute bottom-2 right-2 opacity-20 rotate-180" size={24} />
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg leading-relaxed relative z-10 text-center"
                >
                  {currentQuote.text}
                </motion.p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Personalized for: {currentQuote.personalizedFor}</span>
                <div className="flex items-center gap-1">
                  <Heart className="text-red-400" size={12} />
                  <span>Energy: {currentQuote.energy}/10</span>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={generateNewQuote}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RefreshCw size={14} className={`mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            New Quote
          </Button>
          
          {currentQuote && (
            <>
              <Button
                onClick={handleSaveQuote}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <BookHeart size={14} className="mr-1" />
                Save
              </Button>
              
              <Button
                onClick={handleShareQuote}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Share size={14} className="mr-1" />
                Share
              </Button>
            </>
          )}
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {showShareSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center py-2 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-lg text-sm"
            >
              <Sparkles className="inline mr-1" size={14} />
              Quote saved to your inspiration collection!
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}