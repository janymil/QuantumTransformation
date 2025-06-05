import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Calendar, 
  Brain, 
  TrendingUp, 
  Star,
  Save,
  Search,
  Filter,
  BarChart3,
  Lightbulb,
  Trash2,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { challengeContent } from "@/data/challenge-content";

interface JournalEntry {
  id: number;
  day: number;
  challengeType: string;
  experience: string;
  insights: string;
  intention: string;
  createdAt: string;
  updatedAt: string;
}

interface JournalAnalysis {
  overallProgress: string;
  patterns: string[];
  recommendations: string[];
  emotionalTrends: string;
}

export default function Journal() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedChallengeType, setSelectedChallengeType] = useState<string | null>(null);
  const [experience, setExperience] = useState("");
  const [insights, setInsights] = useState("");
  const [intention, setIntention] = useState("");
  const [filterDay, setFilterDay] = useState<string>("all");
  const [filterChallengeType, setFilterChallengeType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Add debugging for journal data
  const { data: entries, isLoading: entriesLoading, error: entriesError } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
    retry: 1,
    enabled: isAuthenticated && !!user,
  });

  useEffect(() => {
    console.log("Journal - Entries Data:", entries);
    console.log("Journal - Is Loading:", entriesLoading);
    console.log("Journal - Error:", entriesError);
  }, [entries, entriesLoading, entriesError]);

  const { data: analysis, isLoading: analysisLoading } = useQuery<JournalAnalysis>({
    queryKey: ["/api/journal/analyze"],
    enabled: entries && entries.length > 0,
  });

  const { data: progressData } = useQuery({
    queryKey: ["/api/progress"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { day: number; experience: string; insights: string; intention: string }) => {
      return await apiRequest("POST", "/api/journal", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal/analyze"] });
      toast({
        title: "Journal Saved",
        description: "Your journal entry has been saved successfully.",
      });
      setSelectedDay(null);
      setExperience("");
      setInsights("");
      setIntention("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: number) => {
      return await apiRequest("DELETE", `/api/journal/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal/analyze"] });
      toast({
        title: "Journal Deleted",
        description: "Your journal entry has been deleted successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!entriesLoading && !entries) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [entries, entriesLoading, toast]);

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedDay(entry.day);
    setExperience(entry.experience || "");
    setInsights(entry.insights || "");
    setIntention(entry.intention || "");
  };

  const handleNewEntry = (day: number) => {
    setSelectedDay(day);
    setExperience("");
    setInsights("");
    setIntention("");
  };

  const handleSave = () => {
    if (!selectedDay) return;
    
    saveMutation.mutate({
      day: selectedDay,
      experience,
      insights,
      intention,
    });
  };

  const completedDays = (progressData?.progress?.completedDays as number[]) || [];
  const availableDays = Array.from({ length: 30 }, (_, i) => i + 1)
    .filter(day => day <= (progressData?.progress?.currentDay || 1) || completedDays.includes(day));

  const filteredEntries = entries?.filter(entry => {
    const matchesFilter = filterDay === "all" || entry.day.toString() === filterDay;
    const matchesSearch = searchQuery === "" || 
      entry.experience?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.insights?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.intention?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  if (entriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="loading-shimmer h-12 w-64 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="loading-shimmer h-96 rounded-xl"></div>
              </div>
              <div className="space-y-6">
                <div className="loading-shimmer h-48 rounded-xl"></div>
                <div className="loading-shimmer h-64 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Quantum Journal</h1>
              <p className="text-muted-foreground">Track your transformation journey</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search entries..."
                className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterDay} onValueChange={setFilterDay}>
              <SelectTrigger className="w-32">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                {availableDays.map(day => (
                  <SelectItem key={day} value={day.toString()}>Day {day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="write" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="write">Write Entry</TabsTrigger>
            <TabsTrigger value="history">Entry History</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="write" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Editor */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        {selectedDay ? (
                          <>
                            <Calendar className="w-5 h-5 mr-2 inline" />
                            Day {selectedDay} Journal Entry
                          </>
                        ) : (
                          "Select a Day to Begin"
                        )}
                      </span>
                      {selectedDay && (
                        <Badge variant="outline">
                          {challengeContent.find(c => c.day === selectedDay)?.title || `Day ${selectedDay}`}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedDay ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            How did today's practice feel?
                          </label>
                          <Textarea
                            placeholder="Describe your experience with today's practice..."
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            rows={4}
                            className="resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            What insights did you gain?
                          </label>
                          <Textarea
                            placeholder="Share your realizations and breakthroughs..."
                            value={insights}
                            onChange={(e) => setInsights(e.target.value)}
                            rows={4}
                            className="resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Intention for tomorrow
                          </label>
                          <Textarea
                            placeholder="What do you want to focus on in your next practice?"
                            value={intention}
                            onChange={(e) => setIntention(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                        </div>

                        <div className="flex justify-end space-x-3">
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedDay(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSave}
                            disabled={saveMutation.isPending || (!experience && !insights && !intention)}
                          >
                            {saveMutation.isPending ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Entry
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Journal?</h3>
                        <p className="text-muted-foreground mb-6">
                          Select a day from the sidebar to start writing your journal entry.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                
                {/* Available Days */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableDays.map(day => {
                        const hasEntry = entries?.some(e => e.day === day);
                        const content = challengeContent.find(c => c.day === day);
                        
                        return (
                          <button
                            key={day}
                            onClick={() => {
                              const existingEntry = entries?.find(e => e.day === day);
                              if (existingEntry) {
                                handleSelectEntry(existingEntry);
                              } else {
                                handleNewEntry(day);
                              }
                            }}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedDay === day 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-foreground">Day {day}</span>
                              {hasEntry && (
                                <Badge variant="secondary" className="text-xs">
                                  Written
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {content?.title || `Challenge Day ${day}`}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Journal Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entries Written</span>
                        <span className="font-semibold text-foreground">
                          {entries?.length || 0} / {availableDays.length}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${availableDays.length > 0 ? ((entries?.length || 0) / availableDays.length) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completion Rate</span>
                        <span className="font-semibold text-primary">
                          {availableDays.length > 0 ? Math.round(((entries?.length || 0) / availableDays.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="grid gap-6">
              {filteredEntries.length > 0 ? (
                filteredEntries
                  .sort((a, b) => b.day - a.day)
                  .map((entry) => {
                    const content = challengeContent.find(c => c.day === entry.day);
                    return (
                      <Card key={entry.id} className="hover:shadow-lg transition-shadow duration-300">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center">
                              <Calendar className="w-5 h-5 mr-2 text-primary" />
                              Day {entry.day}: {content?.title || `Challenge Day ${entry.day}`}
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {format(new Date(entry.updatedAt), 'MMM d, yyyy')}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSelectEntry(entry)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
                                    deleteMutation.mutate(entry.id);
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {entry.experience && (
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Experience</h4>
                              <p className="text-muted-foreground">{entry.experience}</p>
                            </div>
                          )}
                          {entry.insights && (
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Insights</h4>
                              <p className="text-muted-foreground">{entry.insights}</p>
                            </div>
                          )}
                          {entry.intention && (
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Intention</h4>
                              <p className="text-muted-foreground">{entry.intention}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Entries Found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || filterDay !== "all" 
                        ? "Try adjusting your search or filter criteria."
                        : "Start writing your first journal entry to track your quantum journey."
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {analysisLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Analyzing your journal entries...</p>
                  </div>
                </CardContent>
              </Card>
            ) : analysis ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="w-6 h-6 mr-2 text-primary" />
                      AI Analysis of Your Journey
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">Overall Progress</h3>
                        <p className="text-muted-foreground leading-relaxed">{analysis.overallProgress}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-foreground mb-3 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2" />
                          Emotional Trends
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">{analysis.emotionalTrends}</p>
                      </div>

                      {analysis.patterns.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-foreground mb-3">Patterns Identified</h3>
                          <ul className="space-y-2">
                            {analysis.patterns.map((pattern, index) => (
                              <li key={index} className="flex items-start space-x-3">
                                <Star className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{pattern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.recommendations.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-foreground mb-3 flex items-center">
                            <Lightbulb className="w-5 h-5 mr-2" />
                            Recommendations
                          </h3>
                          <ul className="space-y-2">
                            {analysis.recommendations.map((recommendation, index) => (
                              <li key={index} className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                                <span className="text-muted-foreground">{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : entries && entries.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Analysis Available</h3>
                  <p className="text-muted-foreground">
                    Write a few journal entries to get AI-powered insights about your journey.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
