import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Smile, 
  Meh, 
  Frown, 
  Zap, 
  Battery, 
  BatteryLow,
  Heart,
  Brain,
  Sparkles
} from "lucide-react";

interface MoodEnergyData {
  mood: number;
  energy: number;
  timestamp: Date;
  note?: string;
}

interface MoodEnergyWidgetProps {
  onMoodEnergyChange?: (data: MoodEnergyData) => void;
  currentMood?: number;
  currentEnergy?: number;
}

export default function MoodEnergyWidget({ 
  onMoodEnergyChange, 
  currentMood = 5, 
  currentEnergy = 5 
}: MoodEnergyWidgetProps) {
  const [mood, setMood] = useState(currentMood);
  const [energy, setEnergy] = useState(currentEnergy);
  const [isTracking, setIsTracking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const moodEmojis = [
    { icon: Frown, color: "text-red-500", label: "Low", bg: "bg-red-50 dark:bg-red-950" },
    { icon: Frown, color: "text-orange-500", label: "Poor", bg: "bg-orange-50 dark:bg-orange-950" },
    { icon: Meh, color: "text-yellow-500", label: "Okay", bg: "bg-yellow-50 dark:bg-yellow-950" },
    { icon: Meh, color: "text-lime-500", label: "Good", bg: "bg-lime-50 dark:bg-lime-950" },
    { icon: Smile, color: "text-green-500", label: "Great", bg: "bg-green-50 dark:bg-green-950" },
    { icon: Smile, color: "text-emerald-500", label: "Amazing", bg: "bg-emerald-50 dark:bg-emerald-950" },
    { icon: Smile, color: "text-teal-500", label: "Fantastic", bg: "bg-teal-50 dark:bg-teal-950" },
    { icon: Smile, color: "text-cyan-500", label: "Incredible", bg: "bg-cyan-50 dark:bg-cyan-950" },
    { icon: Smile, color: "text-blue-500", label: "Blissful", bg: "bg-blue-50 dark:bg-blue-950" },
    { icon: Smile, color: "text-purple-500", label: "Transcendent", bg: "bg-purple-50 dark:bg-purple-950" }
  ];

  const energyLevels = [
    { icon: BatteryLow, color: "text-red-500", label: "Drained", fill: 10 },
    { icon: BatteryLow, color: "text-orange-500", label: "Low", fill: 20 },
    { icon: Battery, color: "text-yellow-500", label: "Tired", fill: 30 },
    { icon: Battery, color: "text-lime-500", label: "Okay", fill: 40 },
    { icon: Battery, color: "text-green-500", label: "Good", fill: 50 },
    { icon: Battery, color: "text-emerald-500", label: "Strong", fill: 60 },
    { icon: Zap, color: "text-teal-500", label: "Energized", fill: 70 },
    { icon: Zap, color: "text-cyan-500", label: "Vibrant", fill: 80 },
    { icon: Zap, color: "text-blue-500", label: "Dynamic", fill: 90 },
    { icon: Zap, color: "text-purple-500", label: "Radiant", fill: 100 }
  ];

  const handleSubmit = () => {
    setIsTracking(true);
    
    const data: MoodEnergyData = {
      mood,
      energy,
      timestamp: new Date()
    };

    setTimeout(() => {
      setIsTracking(false);
      setShowSuccess(true);
      onMoodEnergyChange?.(data);
      
      setTimeout(() => setShowSuccess(false), 2000);
    }, 1000);
  };

  const getMoodVisualization = () => {
    const moodData = moodEmojis[mood - 1];
    const Icon = moodData.icon;
    
    return (
      <motion.div
        key={mood}
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.5, rotate: 10 }}
        className={`flex items-center justify-center w-16 h-16 rounded-full ${moodData.bg} ${moodData.color}`}
      >
        <Icon size={32} />
      </motion.div>
    );
  };

  const getEnergyVisualization = () => {
    const energyData = energyLevels[energy - 1];
    const Icon = energyData.icon;
    
    return (
      <motion.div
        key={energy}
        initial={{ scale: 0.5, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className={`flex flex-col items-center justify-center ${energyData.color}`}
      >
        <Icon size={32} />
        <motion.div
          className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className={`h-full bg-gradient-to-r from-current to-current`}
            initial={{ width: 0 }}
            animate={{ width: `${energyData.fill}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </motion.div>
      </motion.div>
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Heart className="text-pink-500" size={20} />
          Mood & Energy Check-in
          <Brain className="text-purple-500" size={20} />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Mood Tracking */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">How are you feeling?</h3>
            <Badge variant="outline" className={moodEmojis[mood - 1].color}>
              {moodEmojis[mood - 1].label}
            </Badge>
          </div>
          
          <div className="flex justify-center mb-4">
            <AnimatePresence mode="wait">
              {getMoodVisualization()}
            </AnimatePresence>
          </div>
          
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, 
                  #ef4444 0%, #f97316 20%, #eab308 40%, 
                  #84cc16 60%, #22c55e 80%, #8b5cf6 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Energy Tracking */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">What's your energy level?</h3>
            <Badge variant="outline" className={energyLevels[energy - 1].color}>
              {energyLevels[energy - 1].label}
            </Badge>
          </div>
          
          <div className="flex justify-center mb-4">
            <AnimatePresence mode="wait">
              {getEnergyVisualization()}
            </AnimatePresence>
          </div>
          
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  #ef4444 0%, #f97316 20%, #eab308 40%, 
                  #84cc16 60%, #22c55e 80%, #8b5cf6 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Drained</span>
              <span>Balanced</span>
              <span>Radiant</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center justify-center py-3 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-lg"
            >
              <Sparkles className="mr-2" size={16} />
              Energy tracked! 
            </motion.div>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isTracking}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isTracking ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <Sparkles size={16} />
                </motion.div>
              ) : (
                <Heart className="mr-2" size={16} />
              )}
              {isTracking ? "Syncing your energy..." : "Track my vibe"}
            </Button>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}