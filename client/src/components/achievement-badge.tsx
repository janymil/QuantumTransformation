import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AchievementBadgeProps {
  achievementId: string;
  unlockedAt?: string;
  size?: "sm" | "md" | "lg";
  showDate?: boolean;
}

const achievementDefinitions = {
  "first_step": {
    name: "First Step",
    description: "Completed your first quantum challenge",
    icon: "🌟",
    color: "from-blue-500 to-purple-500"
  },
  "week_warrior": {
    name: "Week Warrior", 
    description: "Completed 7 days of challenges",
    icon: "⚡",
    color: "from-purple-500 to-pink-500"
  },
  "halfway_hero": {
    name: "Halfway Hero",
    description: "Reached the halfway point (15 days)",
    icon: "🚀", 
    color: "from-pink-500 to-red-500"
  },
  "quantum_master": {
    name: "Quantum Master",
    description: "Completed the full 30-day challenge",
    icon: "👑",
    color: "from-yellow-500 to-orange-500"
  },
  "streak_3": {
    name: "3-Day Streak",
    description: "Maintained a 3-day practice streak", 
    icon: "🔥",
    color: "from-orange-500 to-red-500"
  },
  "streak_7": {
    name: "7-Day Streak",
    description: "Maintained a 7-day practice streak",
    icon: "💫",
    color: "from-red-500 to-purple-500"
  },
  "streak_21": {
    name: "Habit Master",
    description: "Maintained a 21-day practice streak",
    icon: "💎",
    color: "from-indigo-500 to-blue-500"
  }
};

export default function AchievementBadge({ 
  achievementId, 
  unlockedAt, 
  size = "md",
  showDate = true 
}: AchievementBadgeProps) {
  const achievement = achievementDefinitions[achievementId as keyof typeof achievementDefinitions];
  
  if (!achievement) {
    return null;
  }

  const sizeClasses = {
    sm: "w-10 h-10 text-lg",
    md: "w-12 h-12 text-xl", 
    lg: "w-16 h-16 text-2xl"
  };

  const badgeContent = (
    <div className="text-center">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r ${achievement.color} flex items-center justify-center mx-auto mb-2 shadow-lg hover:scale-105 transition-transform duration-200`}>
        <span>{achievement.icon}</span>
      </div>
      <p className={`font-medium text-foreground ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
        {achievement.name}
      </p>
      {showDate && unlockedAt && (
        <p className={`text-muted-foreground ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
          {format(new Date(unlockedAt), 'MMM d')}
        </p>
      )}
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-pointer">
          {badgeContent}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-center">
          <p className="font-medium">{achievement.name}</p>
          <p className="text-sm text-muted-foreground">{achievement.description}</p>
          {unlockedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Unlocked {format(new Date(unlockedAt), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
