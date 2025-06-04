import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Calendar, 
  Target, 
  Flame,
  Trophy,
  Clock
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CHALLENGE_TYPES } from "@shared/challenge-types";
import { Link } from "wouter";

interface MultiChallengeDashboardProps {}

export default function MultiChallengeDashboard({}: MultiChallengeDashboardProps) {
  const [expandedChallenges, setExpandedChallenges] = useState<string[]>([]);

  const { data: progressData, isLoading } = useQuery({
    queryKey: ["/api/progress/all"],
  });

  const toggleChallenge = (challengeId: string) => {
    setExpandedChallenges(prev => 
      prev.includes(challengeId) 
        ? prev.filter(id => id !== challengeId)
        : [...prev, challengeId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  const allProgress = (progressData as any)?.allProgress || [];
  const completions = (progressData as any)?.completions || [];
  const achievements = (progressData as any)?.achievements || [];

  if (allProgress.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You haven't started any challenges yet. Choose one to begin your transformation journey.
          </p>
          <Link href="/challenges">
            <Button>Browse Challenges</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Active Challenges</h2>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {allProgress.length} Active
        </Badge>
      </div>

      <div className="space-y-4">
        {allProgress.map((progress: any, index: number) => {
          const challengeType = CHALLENGE_TYPES[progress.challengeType];
          const isExpanded = expandedChallenges.includes(progress.challengeType);
          const challengeCompletions = completions.filter(
            (c: any) => c.challengeType === progress.challengeType
          );
          const progressPercentage = (challengeCompletions.length / 30) * 100;
          const currentDay = progress.currentDay || 1;

          return (
            <Card key={`${progress.challengeType}-${progress.id || index}`} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleChallenge(progress.challengeType)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{ background: challengeType?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        >
                          {challengeType?.icon || '🌟'}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{challengeType?.title || 'Unknown Challenge'}</CardTitle>
                          <p className="text-sm text-muted-foreground">{challengeType?.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Day {currentDay} of 30</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Flame className="w-4 h-4" />
                            <span>{progress.streakCount} day streak</span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{challengeCompletions.length}/30 days</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center">
                          <Target className="w-4 h-4 mr-2" />
                          Quick Stats
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Completed Days:</span>
                            <span className="font-medium">{challengeCompletions.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Current Streak:</span>
                            <span className="font-medium">{progress.streakCount} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Activity:</span>
                            <span className="font-medium">
                              {progress.lastActivityDate 
                                ? new Date(progress.lastActivityDate).toLocaleDateString()
                                : 'Never'
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center">
                          <Trophy className="w-4 h-4 mr-2" />
                          Focus Areas
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {challengeType?.focusAreas?.slice(0, 3).map((area) => (
                            <Badge key={area} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {challengeType?.description}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Actions
                        </h4>
                        <div className="space-y-2">
                          <Link href={`/challenge-day?type=${progress.challengeType}&day=${currentDay}`}>
                            <Button size="sm" className="w-full">
                              <Play className="w-4 h-4 mr-2" />
                              Continue Day {currentDay}
                            </Button>
                          </Link>
                          <Link href={`/journal?challenge=${progress.challengeType}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Journal
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {challengeCompletions.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Recent Activity</h4>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: 30 }, (_, i) => {
                            const day = i + 1;
                            const isCompleted = challengeCompletions.some((c: any) => c.day === day);
                            const isCurrent = day === currentDay;
                            
                            return (
                              <div
                                key={day}
                                className={`
                                  w-8 h-8 rounded-sm flex items-center justify-center text-xs font-medium
                                  ${isCompleted 
                                    ? 'bg-primary text-primary-foreground' 
                                    : isCurrent 
                                      ? 'bg-primary/20 text-primary border-2 border-primary' 
                                      : 'bg-muted text-muted-foreground'
                                  }
                                `}
                              >
                                {day}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 5).map((achievement: any) => (
                <Badge key={achievement.id} variant="secondary" className="px-3 py-1">
                  🏆 {achievement.achievementId.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}