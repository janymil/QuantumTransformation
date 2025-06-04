import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Trophy, 
  Star, 
  Flame, 
  Target, 
  Zap, 
  Crown,
  Sparkles,
  TrendingUp,
  Award,
  Medal
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProgressAnimationsProps {
  currentDay: number;
  completedDays: number[];
  streakCount: number;
  totalDays: number;
  onDayComplete?: (day: number) => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export default function ProgressAnimations({ 
  currentDay, 
  completedDays, 
  streakCount, 
  totalDays,
  onDayComplete 
}: ProgressAnimationsProps) {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  const completionPercentage = (completedDays.length / totalDays) * 100;
  const level = Math.floor(completedDays.length / 5) + 1;
  const progressToNextLevel = (completedDays.length % 5) / 5 * 100;

  const achievements: Achievement[] = [
    {
      id: "first_step",
      title: "First Step",
      description: "Complete your first day",
      icon: Target,
      color: "text-green-500",
      unlocked: completedDays.length >= 1
    },
    {
      id: "streak_master",
      title: "Streak Master",
      description: "Maintain a 7-day streak",
      icon: Flame,
      color: "text-orange-500",
      unlocked: streakCount >= 7
    },
    {
      id: "quantum_novice",
      title: "Quantum Novice",
      description: "Complete 5 days",
      icon: Star,
      color: "text-blue-500",
      unlocked: completedDays.length >= 5
    },
    {
      id: "consciousness_explorer",
      title: "Consciousness Explorer",
      description: "Complete 10 days",
      icon: Sparkles,
      color: "text-purple-500",
      unlocked: completedDays.length >= 10
    },
    {
      id: "reality_architect",
      title: "Reality Architect",
      description: "Complete 20 days",
      icon: Crown,
      color: "text-yellow-500",
      unlocked: completedDays.length >= 20
    },
    {
      id: "quantum_master",
      title: "Quantum Master",
      description: "Complete all 30 days",
      icon: Trophy,
      color: "text-gold-500",
      unlocked: completedDays.length >= 30
    }
  ];

  useEffect(() => {
    const prevCompletedCount = completedDays.length - 1;
    const newLevel = Math.floor(completedDays.length / 5) + 1;
    const prevLevel = Math.floor(prevCompletedCount / 5) + 1;

    if (newLevel > prevLevel) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }

    if (streakCount > 0 && streakCount % 3 === 0) {
      setShowStreak(true);
      setTimeout(() => setShowStreak(false), 2500);
    }

    // Check for new achievements
    const unlockedAchievements = achievements.filter(a => a.unlocked);
    setNewAchievements(unlockedAchievements.slice(-1)); // Show only latest achievement
  }, [completedDays.length, streakCount]);

  const DayCircle = ({ day, isCompleted, isCurrent }: { day: number; isCompleted: boolean; isCurrent: boolean }) => (
    <motion.div
      key={day}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer
        ${isCompleted 
          ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-500 text-white' 
          : isCurrent 
            ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500'
        }
      `}
      onClick={() => isCurrent && onDayComplete?.(day)}
    >
      <span className="text-sm font-bold">{day}</span>
      {isCompleted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center"
        >
          <Star size={12} className="text-yellow-800" />
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Level and XP Display */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
              >
                <Crown className="text-white" size={20} />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold">Level {level}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quantum Consciousness Explorer</p>
              </div>
            </div>
            <Badge variant="outline" className="text-purple-600 border-purple-300">
              {completedDays.length}/{totalDays} Days
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {level + 1}</span>
              <span>{Math.round(progressToNextLevel)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextLevel}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Display */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ 
                  scale: streakCount > 0 ? [1, 1.2, 1] : 1,
                  rotate: streakCount > 0 ? [0, 10, -10, 0] : 0
                }}
                transition={{ 
                  duration: 0.6, 
                  repeat: streakCount > 0 ? Infinity : 0,
                  repeatDelay: 2
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  streakCount > 0 
                    ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <Flame className={streakCount > 0 ? 'text-white' : 'text-gray-500'} size={20} />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold">{streakCount} Day Streak</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Keep the momentum going!</p>
              </div>
            </div>
            {streakCount >= 7 && (
              <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                🔥 On Fire!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Visualization */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4">30-Day Journey</h3>
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
              <DayCircle
                key={day}
                day={day}
                isCompleted={completedDays.includes(day)}
                isCurrent={day === currentDay}
              />
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-bold">{Math.round(completionPercentage)}%</span>
            </div>
            <div className="w-full bg-white dark:bg-gray-800 rounded-full h-2 mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4">Achievements</h3>
          <div className="grid grid-cols-2 gap-4">
            {achievements.map(achievement => {
              const Icon = achievement.icon;
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0.5, scale: 0.95 }}
                  animate={{ 
                    opacity: achievement.unlocked ? 1 : 0.5,
                    scale: achievement.unlocked ? 1 : 0.95
                  }}
                  whileHover={{ scale: achievement.unlocked ? 1.05 : 0.95 }}
                  className={`
                    p-3 rounded-lg border transition-all
                    ${achievement.unlocked 
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon 
                      size={20} 
                      className={achievement.unlocked ? achievement.color : 'text-gray-400'} 
                    />
                    <span className={`text-sm font-medium ${achievement.unlocked ? '' : 'text-gray-500'}`}>
                      {achievement.title}
                    </span>
                  </div>
                  <p className={`text-xs ${achievement.unlocked ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}>
                    {achievement.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Floating Notifications */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ scale: 0, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, y: -50, opacity: 0 }}
            className="fixed top-20 right-4 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg shadow-lg"
          >
            <div className="flex items-center space-x-2">
              <TrendingUp size={24} />
              <div>
                <h4 className="font-bold">Level Up!</h4>
                <p className="text-sm">You reached Level {level}</p>
              </div>
            </div>
          </motion.div>
        )}

        {showStreak && (
          <motion.div
            initial={{ scale: 0, x: 50, opacity: 0 }}
            animate={{ scale: 1, x: 0, opacity: 1 }}
            exit={{ scale: 0, x: 50, opacity: 0 }}
            className="fixed top-36 right-4 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg shadow-lg"
          >
            <div className="flex items-center space-x-2">
              <Flame size={24} />
              <div>
                <h4 className="font-bold">Streak Milestone!</h4>
                <p className="text-sm">{streakCount} days in a row!</p>
              </div>
            </div>
          </motion.div>
        )}

        {newAchievements.map(achievement => (
          <motion.div
            key={achievement.id}
            initial={{ scale: 0, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, y: -100, opacity: 0 }}
            className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-lg max-w-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Trophy size={20} />
              </div>
              <div>
                <h4 className="font-bold">Achievement Unlocked!</h4>
                <p className="text-sm">{achievement.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}