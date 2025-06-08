import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Brain, TrendingUp, Lightbulb, Heart } from 'lucide-react';
import { Link } from 'wouter';

interface EmotionalState {
  emotion: string;
  count: number;
  intensity: number;
  relatedEntries: string[];
}

interface HabitStats {
  totalJournalingTime: string;
  longestStreak: number;
  currentStreak: number;
  entriesThisMonth: number;
  calendar: { [date: string]: boolean };
}

interface PersonalityInsight {
  trait: string;
  score: number;
  description: string;
}

interface RecurringTopic {
  topic: string;
  frequency: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  relatedSessions: string[];
}

export default function TherapeuticAnalytics() {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('month');

  // Fetch emotional state data
  const { data: emotionalData, isLoading: emotionalLoading } = useQuery({
    queryKey: ['/api/therapeutic-analytics/emotional-state', timeFilter],
    enabled: true
  });

  // Fetch habit tracking data
  const { data: habitData, isLoading: habitLoading } = useQuery({
    queryKey: ['/api/therapeutic-analytics/habits', timeFilter],
    enabled: true
  });

  // Fetch personality insights
  const { data: personalityData, isLoading: personalityLoading } = useQuery({
    queryKey: ['/api/therapeutic-analytics/personality'],
    enabled: true
  });

  // Fetch recurring topics
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/therapeutic-analytics/topics', timeFilter],
    enabled: true
  });

  // Fetch AI suggestions
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['/api/therapeutic-analytics/suggestions'],
    enabled: true
  });

  const renderEmotionalBubbles = (emotions: EmotionalState[]) => {
    const maxCount = Math.max(...emotions.map(e => e.count));
    
    return (
      <div className="relative w-full h-96 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-8 max-w-2xl">
          {emotions.map((emotion, index) => {
            const size = Math.max(60, (emotion.count / maxCount) * 120);
            const isSelected = selectedEmotion === emotion.emotion;
            
            return (
              <div
                key={emotion.emotion}
                className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
                  isSelected ? 'scale-110' : 'hover:scale-105'
                }`}
                onClick={() => setSelectedEmotion(isSelected ? null : emotion.emotion)}
              >
                <div
                  className={`rounded-full flex items-center justify-center text-white font-medium transition-all duration-300 ${
                    isSelected 
                      ? 'bg-primary shadow-lg' 
                      : 'bg-primary/70 hover:bg-primary/80'
                  }`}
                  style={{ 
                    width: size, 
                    height: size,
                    fontSize: Math.max(12, size / 8)
                  }}
                >
                  <div className="text-center">
                    <div className="font-semibold">{emotion.emotion}</div>
                    <div className="text-xs opacity-90">{emotion.count} entries</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendarHeatmap = (calendar: { [date: string]: boolean }) => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: new Date(d),
        hasEntry: calendar[dateStr] || false,
        day: d.getDate()
      });
    }

    return (
      <div className="grid grid-cols-7 gap-2 max-w-md">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
              day.hasEntry
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {day.day}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/therapeutic-chat">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Therapeutic Analytics</h1>
        <div className="ml-auto">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="emotional" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="emotional" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Emotional State
          </TabsTrigger>
          <TabsTrigger value="habits" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Habit Tracking
          </TabsTrigger>
          <TabsTrigger value="personality" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Personality
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Recurring Topics
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Suggestions
          </TabsTrigger>
        </TabsList>

        {/* Emotional State Tab */}
        <TabsContent value="emotional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Emotional State Analysis
              </CardTitle>
              <p className="text-muted-foreground">
                Click on any emotion bubble to see detailed analysis and related entries
              </p>
            </CardHeader>
            <CardContent>
              {emotionalLoading ? (
                <div className="w-full h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : emotionalData?.emotions ? (
                renderEmotionalBubbles(emotionalData.emotions)
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  No emotional data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Emotion Details */}
          {selectedEmotion && emotionalData?.emotions && (
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{selectedEmotion} Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Summary</h4>
                    <p className="text-muted-foreground">
                      This emotion appeared in {emotionalData.emotions.find(e => e.emotion === selectedEmotion)?.count} entries
                      during the selected period. Analysis shows patterns of {selectedEmotion.toLowerCase()} 
                      related to your therapeutic journey.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Related Insights</h4>
                    <div className="space-y-2">
                      <Badge variant="secondary">Therapeutic Progress</Badge>
                      <Badge variant="secondary">Pattern Recognition</Badge>
                      <Badge variant="secondary">Emotional Growth</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    See Relevant Entries
                  </Button>
                  <Button variant="outline" size="sm">
                    Ask Questions
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Habit Tracking Tab */}
        <TabsContent value="habits" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Journaling Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {habitLoading ? '...' : habitData?.totalJournalingTime || '0 minutes'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Longest Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {habitLoading ? '...' : `${habitData?.longestStreak || 0} days`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {habitLoading ? '...' : habitData?.entriesThisMonth || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <p className="text-muted-foreground">Your therapeutic activity this month</p>
            </CardHeader>
            <CardContent>
              {habitLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : habitData?.calendar ? (
                renderCalendarHeatmap(habitData.calendar)
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  No activity data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs with placeholder content */}
        <TabsContent value="personality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personality Analysis</CardTitle>
              <p className="text-muted-foreground">
                Based on the Big Five personality model and your therapeutic conversations
              </p>
            </CardHeader>
            <CardContent>
              {personalityLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Personality analysis will be available after more therapeutic sessions
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Topics</CardTitle>
              <p className="text-muted-foreground">
                Patterns and themes identified in your therapeutic conversations
              </p>
            </CardHeader>
            <CardContent>
              {topicsLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Topic analysis will be available after more therapeutic sessions
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Suggestions</CardTitle>
              <p className="text-muted-foreground">
                Personalized recommendations based on your therapeutic journey
              </p>
            </CardHeader>
            <CardContent>
              {suggestionsLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  AI suggestions will be generated based on your therapeutic progress
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}