import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2, Clock, Target, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PracticeSession {
  id: string;
  type: string;
  duration: number;
  date: Date;
  completed: boolean;
}

interface PracticeTrackerProps {
  onClose?: () => void;
}

export default function PracticeTracker({ onClose }: PracticeTrackerProps) {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [weeklyGoal] = useState(5); // sessions per week
  const [todayCompleted, setTodayCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load practice data from localStorage
    const savedSessions = localStorage.getItem('practice-sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions).map((s: any) => ({
        ...s,
        date: new Date(s.date)
      }));
      setSessions(parsed);
    }
    
    calculateStats();
  }, []);

  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if practiced today
    const todaySession = sessions.find(s => {
      const sessionDate = new Date(s.date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime() && s.completed;
    });
    setTodayCompleted(!!todaySession);

    // Calculate streak
    let streak = 0;
    const sortedSessions = sessions
      .filter(s => s.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedSessions.length > 0) {
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      
      for (const session of sortedSessions) {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        
        if (sessionDate.getTime() === checkDate.getTime()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (sessionDate.getTime() < checkDate.getTime()) {
          break;
        }
      }
    }
    setCurrentStreak(streak);
  };

  const recordPractice = (type: string, duration: number) => {
    const newSession: PracticeSession = {
      id: Date.now().toString(),
      type,
      duration,
      date: new Date(),
      completed: true
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    localStorage.setItem('practice-sessions', JSON.stringify(updatedSessions));
    
    setTodayCompleted(true);
    setCurrentStreak(prev => prev + 1);
    
    toast({
      title: "Practice Recorded!",
      description: `Great job completing ${type} for ${duration} minutes!`,
    });
  };

  const getWeeklyProgress = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekSessions = sessions.filter(s => 
      s.completed && new Date(s.date) >= oneWeekAgo
    );
    
    return Math.min((weekSessions.length / weeklyGoal) * 100, 100);
  };

  const getTotalMinutes = () => {
    return sessions
      .filter(s => s.completed)
      .reduce((total, s) => total + s.duration, 0);
  };

  const getRecentSessions = () => {
    return sessions
      .filter(s => s.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const practiceTypes = [
    { name: "Meditation", duration: 10, icon: "🧘" },
    { name: "Visualization", duration: 15, icon: "✨" },
    { name: "Affirmations", duration: 5, icon: "💭" },
    { name: "Breathing", duration: 8, icon: "🌬️" },
    { name: "Journaling", duration: 20, icon: "📝" }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Practice Tracker</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Track your daily practice and build consistent habits
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{currentStreak}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{getTotalMinutes()}</div>
                <div className="text-xs text-muted-foreground">Total Minutes</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{sessions.filter(s => s.completed).length}</div>
                <div className="text-xs text-muted-foreground">Sessions</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className={`w-5 h-5 ${todayCompleted ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <div className="text-lg font-bold">{todayCompleted ? 'Done' : 'Pending'}</div>
                <div className="text-xs text-muted-foreground">Today</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Weekly Goal Progress */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Weekly Goal Progress</span>
              <span className="text-sm text-muted-foreground">
                {sessions.filter(s => {
                  const oneWeekAgo = new Date();
                  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                  return s.completed && new Date(s.date) >= oneWeekAgo;
                }).length} / {weeklyGoal} sessions
              </span>
            </div>
            <Progress value={getWeeklyProgress()} className="h-2" />
          </div>
        </Card>

        {/* Quick Practice Buttons */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Practice</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {practiceTypes.map((practice) => (
              <Button
                key={practice.name}
                onClick={() => recordPractice(practice.name, practice.duration)}
                variant="outline"
                className="h-auto p-4 flex flex-col space-y-2"
                disabled={todayCompleted}
              >
                <span className="text-2xl">{practice.icon}</span>
                <span className="text-sm font-medium">{practice.name}</span>
                <span className="text-xs text-muted-foreground">{practice.duration} min</span>
              </Button>
            ))}
          </div>
          {todayCompleted && (
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 dark:text-green-300 font-medium">
                Excellent! You've completed your practice for today.
              </p>
              <p className="text-green-600 dark:text-green-400 text-sm">
                Keep up the momentum tomorrow!
              </p>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        {getRecentSessions().length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Sessions</h3>
            <div className="space-y-2">
              {getRecentSessions().map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{session.type}</span>
                    <Badge variant="secondary">{session.duration} min</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {session.date.toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {onClose && (
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}