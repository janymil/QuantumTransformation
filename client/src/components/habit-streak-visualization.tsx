import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Flame, 
  Calendar, 
  Target, 
  TrendingUp, 
  Award,
  Zap,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  completedDays: number[];
  totalDays: number;
  weeklyGoal: number;
  monthlyGoal: number;
}

interface HabitStreakVisualizationProps {
  streakData: StreakData;
  className?: string;
}

// Animated progress ring component
function AnimatedProgressRing({ 
  percentage, 
  size = 120, 
  strokeWidth = 8, 
  color = "#3B82F6",
  label,
  value,
  animate = true 
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  value: string | number;
  animate?: boolean;
}) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setAnimatedPercentage(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedPercentage(percentage);
    }
  }, [percentage, animate]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500 text-center">{Math.round(animatedPercentage)}%</div>
        </div>
      </div>
      <div className="text-sm font-medium text-gray-700 text-center">{label}</div>
    </div>
  );
}

// Streak flame animation
function StreakFlame({ days }: { days: number }) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [days]);

  const getFlameColor = (days: number) => {
    if (days >= 21) return "text-purple-500";
    if (days >= 14) return "text-blue-500";
    if (days >= 7) return "text-orange-500";
    return "text-red-500";
  };

  const getFlameSize = (days: number) => {
    if (days >= 21) return "text-6xl";
    if (days >= 14) return "text-5xl";
    if (days >= 7) return "text-4xl";
    return "text-3xl";
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className={`${getFlameColor(days)} ${getFlameSize(days)} ${
        isAnimating ? "animate-pulse scale-110" : ""
      } transition-all duration-300`}>
        <Flame className="w-full h-full" />
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{days}</div>
        <div className="text-sm text-gray-600">Day Streak</div>
      </div>
    </div>
  );
}

// Calendar heatmap component
function StreakCalendar({ completedDays }: { completedDays: number[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), currentMonth, 1).getDay();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDayStatus = (day: number) => {
    if (completedDays.includes(day)) return "completed";
    if (day === today.getDate() && currentMonth === today.getMonth()) return "today";
    if (day < today.getDate() && currentMonth === today.getMonth()) return "missed";
    return "upcoming";
  };

  const getDayColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500 text-white";
      case "today": return "bg-blue-500 text-white ring-2 ring-blue-300";
      case "missed": return "bg-red-100 text-red-500";
      default: return "bg-gray-100 text-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{monthNames[currentMonth]} Progress</h3>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
            disabled={currentMonth === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(Math.min(11, currentMonth + 1))}
            disabled={currentMonth === 11}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center font-medium text-gray-500 p-1">
            {day}
          </div>
        ))}
        
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const status = getDayStatus(day);
          return (
            <div
              key={day}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                transition-all duration-200 hover:scale-110
                ${getDayColor(status)}
              `}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-100"></div>
          <span>Missed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-gray-100"></div>
          <span>Upcoming</span>
        </div>
      </div>
    </div>
  );
}

export default function HabitStreakVisualization({ 
  streakData, 
  className = "" 
}: HabitStreakVisualizationProps) {
  const weeklyProgress = (streakData.completedDays.length % 7) / 7 * 100;
  const monthlyProgress = streakData.completedDays.length / streakData.monthlyGoal * 100;
  const overallProgress = streakData.completedDays.length / streakData.totalDays * 100;

  const getStreakLevel = (streak: number) => {
    if (streak >= 21) return { name: "Quantum Master", color: "text-purple-600", icon: Award };
    if (streak >= 14) return { name: "Consciousness Explorer", color: "text-blue-600", icon: Star };
    if (streak >= 7) return { name: "Awareness Seeker", color: "text-green-600", icon: Zap };
    return { name: "Beginning Journey", color: "text-gray-600", icon: Target };
  };

  const streakLevel = getStreakLevel(streakData.currentStreak);
  const LevelIcon = streakLevel.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Streak Display */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span>Habit Streak Visualization</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Streak Flame and Level */}
          <div className="flex items-center justify-between">
            <StreakFlame days={streakData.currentStreak} />
            
            <div className="text-center space-y-2">
              <Badge variant="secondary" className={`${streakLevel.color} font-semibold`}>
                <LevelIcon className="w-3 h-3 mr-1" />
                {streakLevel.name}
              </Badge>
              <div className="text-sm text-gray-600">
                Longest: {streakData.longestStreak} days
              </div>
            </div>
          </div>

          {/* Progress Rings */}
          <div className="grid grid-cols-3 gap-4">
            <AnimatedProgressRing
              percentage={weeklyProgress}
              color="#10B981"
              label="This Week"
              value={`${streakData.completedDays.length % 7}/7`}
            />
            <AnimatedProgressRing
              percentage={monthlyProgress}
              color="#3B82F6"
              label="This Month"
              value={`${streakData.completedDays.length}/${streakData.monthlyGoal}`}
            />
            <AnimatedProgressRing
              percentage={overallProgress}
              color="#8B5CF6"
              label="Overall"
              value={`${streakData.completedDays.length}/${streakData.totalDays}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Monthly Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StreakCalendar completedDays={streakData.completedDays} />
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Streak Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(overallProgress)}%
              </div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {streakData.completedDays.length}
              </div>
              <div className="text-sm text-gray-600">Days Completed</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Weekly Goal Progress</span>
              <span>{Math.round(weeklyProgress)}%</span>
            </div>
            <Progress value={weeklyProgress} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monthly Goal Progress</span>
              <span>{Math.round(monthlyProgress)}%</span>
            </div>
            <Progress value={monthlyProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}