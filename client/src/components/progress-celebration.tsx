import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Star, 
  Zap, 
  Sparkles, 
  Award,
  Target,
  Calendar,
  Flame
} from "lucide-react";

interface ProgressCelebrationProps {
  isVisible: boolean;
  onClose: () => void;
  achievementType: 'day_completed' | 'streak_milestone' | 'week_completed' | 'challenge_started' | 'level_up';
  details: {
    day?: number;
    streak?: number;
    week?: number;
    challengeName?: string;
    level?: string;
  };
}

export default function ProgressCelebration({ 
  isVisible, 
  onClose, 
  achievementType, 
  details 
}: ProgressCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const getAchievementConfig = () => {
    switch (achievementType) {
      case 'day_completed':
        return {
          icon: Target,
          title: `Day ${details.day} Complete!`,
          message: "You're building quantum momentum. Each day brings you closer to transformation.",
          color: "from-green-400 to-emerald-600",
          iconColor: "text-green-600",
          particles: "🌟"
        };
      case 'streak_milestone':
        return {
          icon: Flame,
          title: `${details.streak} Day Streak!`,
          message: "Your consistency is creating powerful quantum coherence. Keep the energy flowing!",
          color: "from-orange-400 to-red-600",
          iconColor: "text-orange-600",
          particles: "🔥"
        };
      case 'week_completed':
        return {
          icon: Calendar,
          title: `Week ${details.week} Mastered!`,
          message: "You've completed another week of quantum consciousness expansion. Your dedication is remarkable!",
          color: "from-purple-400 to-indigo-600",
          iconColor: "text-purple-600",
          particles: "✨"
        };
      case 'challenge_started':
        return {
          icon: Zap,
          title: "New Journey Begins!",
          message: `Welcome to the ${details.challengeName} challenge. Your quantum transformation starts now!`,
          color: "from-blue-400 to-cyan-600",
          iconColor: "text-blue-600",
          particles: "⚡"
        };
      case 'level_up':
        return {
          icon: Award,
          title: "Level Up!",
          message: `You've advanced to ${details.level} level. Your quantum mastery is expanding!`,
          color: "from-yellow-400 to-amber-600",
          iconColor: "text-yellow-600",
          particles: "🏆"
        };
      default:
        return {
          icon: Star,
          title: "Achievement Unlocked!",
          message: "You're making incredible progress on your quantum journey!",
          color: "from-pink-400 to-rose-600",
          iconColor: "text-pink-600",
          particles: "⭐"
        };
    }
  };

  const config = getAchievementConfig();
  const IconComponent = config.icon;

  // Confetti particles animation
  const confettiParticles = Array.from({ length: 20 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute text-2xl pointer-events-none"
      initial={{ 
        x: Math.random() * 400 - 200,
        y: -50,
        opacity: 1,
        scale: 0
      }}
      animate={showConfetti ? {
        y: [0, -100, 400],
        x: [0, Math.random() * 200 - 100],
        rotate: [0, 360, 720],
        scale: [0, 1, 0],
        opacity: [0, 1, 0]
      } : {}}
      transition={{
        duration: 3,
        delay: Math.random() * 0.5,
        ease: "easeOut"
      }}
    >
      {config.particles}
    </motion.div>
  ));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Confetti Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confettiParticles}
          </div>

          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ 
              type: "spring", 
              damping: 15, 
              stiffness: 300 
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative"
          >
            <Card className="w-96 overflow-hidden shadow-2xl">
              {/* Animated Background */}
              <div className={`h-32 bg-gradient-to-br ${config.color} relative overflow-hidden`}>
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  animate={{
                    x: [-100, 400],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    clipPath: "polygon(0% 0%, 100% 0%, 80% 100%, 0% 100%)"
                  }}
                />
                
                {/* Floating particles */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white/40 rounded-full"
                    animate={{
                      y: [0, -20, 0],
                      x: [0, Math.sin(i) * 10, 0],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    style={{
                      left: `${10 + (i * 10)}%`,
                      top: `${20 + Math.random() * 60}%`
                    }}
                  />
                ))}

                {/* Main Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                    className="bg-white/20 rounded-full p-4"
                  >
                    <IconComponent className="w-12 h-12 text-white" />
                  </motion.div>
                </div>
              </div>

              <CardContent className="p-6 text-center space-y-4">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-gray-600 leading-relaxed">{config.message}</p>
                </motion.div>

                {/* Stats Display */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex justify-center space-x-6 py-4"
                >
                  {details.day && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{details.day}</div>
                      <div className="text-xs text-gray-500">Day</div>
                    </div>
                  )}
                  {details.streak && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{details.streak}</div>
                      <div className="text-xs text-gray-500">Streak</div>
                    </div>
                  )}
                  {details.week && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{details.week}</div>
                      <div className="text-xs text-gray-500">Week</div>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <Button 
                    onClick={onClose}
                    className={`bg-gradient-to-r ${config.color} text-white hover:shadow-lg transition-all duration-200`}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Continue Journey
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}