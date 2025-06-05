import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, DollarSign, Target } from "lucide-react";
import { format } from "date-fns";

export default function MoneyBlocksJournal() {
  const { isAuthenticated } = useAuth();

  const { data: journalEntries, isLoading } = useQuery({
    queryKey: ["/api/journal", { challengeType: "money_blocks" }],
    enabled: isAuthenticated,
  });

  const { data: progressData } = useQuery({
    queryKey: ["/api/progress/all"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading your financial journal...</p>
        </div>
      </div>
    );
  }

  const allProgress = (progressData as any)?.allProgress || [];
  const challengeProgress = allProgress.find((p: any) => p.challengeType === 'money_blocks');
  const completedDays = (challengeProgress?.completedDays as number[]) || [];
  const currentDay = challengeProgress?.currentDay || 1;
  const entries = (journalEntries as any) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Money Blocks Journal
            </h1>
            <p className="text-muted-foreground text-lg">
              Transform your relationship with abundance and prosperity
            </p>
          </div>

          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-5 w-5 text-green-600" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{currentDay}</div>
                  <div className="text-sm text-muted-foreground">Current Day</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">{completedDays.length}</div>
                  <div className="text-sm text-muted-foreground">Days Completed</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{entries.length}</div>
                  <div className="text-sm text-muted-foreground">Journal Entries</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {entries.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Journal Entries Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start your financial transformation by completing daily challenges
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/money-blocks'}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    Begin Your Journey
                  </Button>
                </CardContent>
              </Card>
            ) : (
              entries.map((entry: any) => (
                <Card key={entry.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-green-600" />
                        Day {entry.day}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                        </Badge>
                        {completedDays.includes(entry.day) && (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entry.experience && (
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">Today's Experience</h4>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-gray-700">{entry.experience}</p>
                        </div>
                      </div>
                    )}
                    
                    {entry.insights && (
                      <div>
                        <h4 className="font-semibold text-emerald-700 mb-2">Financial Insights</h4>
                        <div className="p-4 bg-emerald-50 rounded-lg">
                          <p className="text-gray-700">{entry.insights}</p>
                        </div>
                      </div>
                    )}
                    
                    {entry.intention && (
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">Abundance Intention</h4>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-gray-700">{entry.intention}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}