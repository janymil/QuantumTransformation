import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProgressCircle from "@/components/progress-circle";
import AchievementBadge from "@/components/achievement-badge";
import { Play, BookOpen, Brain, Zap, Target, Calendar } from "lucide-react";
import { Link } from "wouter";

interface SidebarProps {
  progress: any;
  completedDays: number[];
  streakCount: number;
  achievements: any[];
  completionPercentage: number;
}

export default function Sidebar({ 
  progress, 
  completedDays, 
  streakCount, 
  achievements, 
  completionPercentage 
}: SidebarProps) {
  const currentDay = progress?.currentDay || 1;

  return (
    <div className="space-y-6">
      
      {/* Progress Overview Card */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <ProgressCircle 
              percentage={completionPercentage}
              size={120}
              strokeWidth={8}
            />
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-1">
                Day <span className="font-semibold text-primary">{currentDay}</span> of 30
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Streak</span>
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-orange-500">{streakCount} days</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Completed</span>
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4 text-success" />
                <span className="font-semibold text-success">{completedDays.length}/30</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-primary">{completionPercentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href={`/challenge/${currentDay}`}>
            <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
              <Play className="w-4 h-4 mr-2" />
              Continue Day {currentDay}
            </Button>
          </Link>
          
          <Link href="/journal">
            <Button variant="outline" className="w-full">
              <BookOpen className="w-4 h-4 mr-2" />
              Open Journal
            </Button>
          </Link>
          
          <Button variant="outline" className="w-full">
            <Brain className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          {achievements && achievements.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {achievements.slice(0, 6).map((achievement) => (
                <AchievementBadge 
                  key={achievement.id}
                  achievementId={achievement.achievementId}
                  unlockedAt={achievement.unlockedAt}
                  size="sm"
                />
              ))}
              {achievements.length > 6 && (
                <div className="col-span-3 text-center">
                  <Link href="/progress">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All ({achievements.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Complete challenges to earn achievements
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Challenge Calendar Mini */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const day = Math.max(1, currentDay - 3 + i);
              const isCompleted = completedDays.includes(day);
              const isCurrent = day === currentDay;
              const isAccessible = day <= currentDay || completedDays.includes(day);
              
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-primary text-white'
                      : isCompleted
                      ? 'bg-success text-white'
                      : isAccessible
                      ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                      : 'bg-muted/50 text-muted-foreground/50'
                  }`}
                >
                  {day <= 30 ? day : ''}
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-center">
            <Link href="/progress">
              <Button variant="ghost" size="sm" className="text-xs">
                View Full Timeline
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
