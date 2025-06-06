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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  Edit,
  FileText,
  ChevronDown,
  ChevronRight,
  MessageSquare
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

interface AssessmentReflection {
  id: number;
  assessmentId: string;
  reflectionType: string;
  title: string;
  content: string;
  questionPrompt?: string;
  wordCount: number;
  characterCount: number;
  challengeType?: string;
  day?: number;
  metadata: any;
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
  const [reflectionFilter, setReflectionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedEntries, setExpandedEntries] = useState<Set<string | number>>(new Set());
  const [activeTab, setActiveTab] = useState("write");
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editExperience, setEditExperience] = useState("");
  const [editInsights, setEditInsights] = useState("");
  const [editIntention, setEditIntention] = useState("");
  const [selectedInsightType, setSelectedInsightType] = useState<string | null>(null);

  const toggleEntryExpansion = (entryId: string | number) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

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

  // Fetch AI coaching responses for insights
  const { data: aiResponses, isLoading: aiResponsesLoading } = useQuery<any[]>({
    queryKey: ["/api/ai/responses"],
  });

  useEffect(() => {
    console.log("Analysis Data:", analysis);
    console.log("Analysis Loading:", analysisLoading);
    console.log("AI Responses Data:", aiResponses);
  }, [analysis, analysisLoading, aiResponses]);

  const { data: progressData } = useQuery({
    queryKey: ["/api/progress"],
  });

  // Fetch assessment reflections
  const { data: reflectionsData = [], isLoading: reflectionsLoading, error: reflectionsError } = useQuery<AssessmentReflection[]>({
    queryKey: ['/api/assessment-reflections'],
    enabled: isAuthenticated && !!user,
    retry: 1,
  });

  useEffect(() => {
    console.log("Assessment Reflections - Data:", reflectionsData);
    console.log("Assessment Reflections - Loading:", reflectionsLoading);
    console.log("Assessment Reflections - Error:", reflectionsError);
  }, [reflectionsData, reflectionsLoading, reflectionsError]);

  const saveMutation = useMutation({
    mutationFn: async (data: { day: number; challengeType?: string; experience: string; insights: string; intention: string }) => {
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
    setEditingEntry(entry);
    setEditExperience(entry.experience || "");
    setEditInsights(entry.insights || "");
    setEditIntention(entry.intention || "");
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;
    
    saveMutation.mutate({
      day: editingEntry.day,
      challengeType: editingEntry.challengeType,
      experience: editExperience,
      insights: editInsights,
      intention: editIntention,
    });
    
    setEditingEntry(null);
    setEditExperience("");
    setEditInsights("");
    setEditIntention("");
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditExperience("");
    setEditInsights("");
    setEditIntention("");
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

  const completedDays = [];
  const availableDays = Array.from({ length: 30 }, (_, i) => i + 1);

  const filteredEntries = entries?.filter(entry => {
    const matchesFilter = filterDay === "all" || entry.day.toString() === filterDay;
    const matchesSearch = searchQuery === "" || 
      entry.experience?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.insights?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.intention?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  // Filter reflections by type and search
  const filteredReflections = Array.isArray(reflectionsData) ? reflectionsData.filter((reflection: AssessmentReflection) => {
    const matchesFilter = reflectionFilter === 'all' || 
                         reflectionFilter === 'reflections_only' ||
                         reflection.reflectionType === reflectionFilter;
    const matchesSearch = searchTerm === '' || 
      reflection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reflection.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }) : [];

  // Group reflections by type
  const groupedReflections = filteredReflections.reduce((acc: { [key: string]: AssessmentReflection[] }, reflection: AssessmentReflection) => {
    if (!acc[reflection.reflectionType]) {
      acc[reflection.reflectionType] = [];
    }
    acc[reflection.reflectionType].push(reflection);
    return acc;
  }, {});

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
            
            <Select value={reflectionFilter} onValueChange={setReflectionFilter}>
              <SelectTrigger className="w-48">
                <FileText className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="journal_only">Journal Entries Only</SelectItem>
                <SelectItem value="reflections_only">Assessment Reflections Only</SelectItem>
                <SelectItem value="journal_reflection">Journal Reflections</SelectItem>
                <SelectItem value="evening_integration">Evening Integration</SelectItem>
                <SelectItem value="exercise_reflection">Exercise Reflections</SelectItem>
                <SelectItem value="daily_assessment">Daily Assessments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
              {/* Show filtered journal entries */}
              {(reflectionFilter === 'all' || reflectionFilter === 'journal_only') && filteredEntries.length > 0 && 
                filteredEntries
                  .sort((a, b) => b.day - a.day)
                  .map((entry) => {
                    const content = challengeContent.find(c => c.day === entry.day);
                    return (
                      <Card key={`journal-${entry.id}`} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => toggleEntryExpansion(entry.id)}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <div className="p-1 h-auto">
                                {expandedEntries.has(entry.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </div>
                              <CardTitle className="flex items-center truncate">
                                <Calendar className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
                                <span className="truncate">
                                  Day {entry.day}: {content?.title || `Challenge Day ${entry.day}`}
                                </span>
                              </CardTitle>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <Badge variant="outline" className="whitespace-nowrap">
                                {format(new Date(entry.updatedAt), 'MMM d, yyyy')}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectEntry(entry);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
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
                        {expandedEntries.has(entry.id) && (
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
                        )}
                      </Card>
                    );
                  })}
              
              {/* Show filtered assessment reflections */}
              {(reflectionFilter === 'all' || reflectionFilter === 'reflections_only' || 
                reflectionFilter === 'journal_reflection' || reflectionFilter === 'evening_integration' ||
                reflectionFilter === 'exercise_reflection' || reflectionFilter === 'daily_assessment') && 
                filteredReflections.length > 0 && 
                filteredReflections.map((reflection) => (
                  <Card key={`reflection-${reflection.id}`} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => toggleEntryExpansion(`reflection-${reflection.id}`)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div className="p-1 h-auto">
                            {expandedEntries.has(`reflection-${reflection.id}`) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                          <CardTitle className="flex items-center truncate">
                            <FileText className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
                            <span className="truncate">{reflection.title}</span>
                          </CardTitle>
                        </div>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {reflection.reflectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                      {reflection.day && (
                        <p className="text-sm text-muted-foreground">Day {reflection.day}</p>
                      )}
                    </CardHeader>
                    {expandedEntries.has(`reflection-${reflection.id}`) && (
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-muted-foreground leading-relaxed">{reflection.content}</p>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{reflection.wordCount} words</span>
                            <span>{format(new Date(reflection.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}

              {/* Show no content message */}
              {((reflectionFilter === 'journal_only' && filteredEntries.length === 0) ||
                (reflectionFilter === 'reflections_only' && filteredReflections.length === 0) ||
                (reflectionFilter === 'all' && filteredEntries.length === 0 && filteredReflections.length === 0)) ? (
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
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {(analysisLoading || aiResponsesLoading) ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your AI insights...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Journal Analysis Insights */}
                <Card className="flex flex-col">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <Brain className="w-5 h-5 mr-2 text-blue-500" />
                      Journal Analysis
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      AI analysis of your personal journal entries
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {analysis ? (
                      <div className="space-y-3 flex-1">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Overall Progress:</p>
                          <p className="text-sm leading-relaxed line-clamp-4">{analysis.overallProgress}</p>
                        </div>
                        {analysis.patterns && analysis.patterns.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Key Patterns:</p>
                            <ul className="space-y-1">
                              {analysis.patterns.slice(0, 2).map((pattern, index) => (
                                <li key={index} className="text-sm flex items-start space-x-2">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                  <span className="line-clamp-2">{pattern}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center py-8">
                        <div className="text-center">
                          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No journal entries yet</p>
                        </div>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => setSelectedInsightType('journal')}
                      disabled={!analysis}
                    >
                      Read All
                    </Button>
                  </CardContent>
                </Card>

                {/* AI Coaching Insights */}
                <Card className="flex flex-col">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <MessageSquare className="w-5 h-5 mr-2 text-green-500" />
                      AI Coaching Sessions
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Personalized coaching insights and guidance
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {aiResponses && Array.isArray(aiResponses) && aiResponses.length > 0 ? (
                      <div className="space-y-3 flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                          {aiResponses.length} coaching session{aiResponses.length !== 1 ? 's' : ''} completed
                        </p>
                        <div className="space-y-2">
                          {aiResponses.slice(0, 3).map((response: any, index: number) => (
                            <div key={index} className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">
                                {response.sessionType?.replace('_', ' ') || 'Coaching Session'}
                              </p>
                              <p className="text-sm line-clamp-3">
                                {typeof response.aiResponse === 'string' 
                                  ? response.aiResponse 
                                  : response.aiResponse?.personalizedMessage?.slice(0, 150) + '...' || 
                                    response.aiResponse?.response?.slice(0, 150) + '...' ||
                                    'AI coaching insights available'
                                }
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center py-8">
                        <div className="text-center">
                          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No coaching sessions yet</p>
                        </div>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => setSelectedInsightType('coaching')}
                      disabled={!aiResponses || !Array.isArray(aiResponses) || aiResponses.length === 0}
                    >
                      Read All
                    </Button>
                  </CardContent>
                </Card>

                {/* Assessment Reflections */}
                <Card className="flex flex-col">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <FileText className="w-5 h-5 mr-2 text-purple-500" />
                      Assessment Reflections
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Daily assessment insights and reflections
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {reflectionsData && reflectionsData.length > 0 ? (
                      <div className="space-y-3 flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                          {reflectionsData.length} reflection{reflectionsData.length !== 1 ? 's' : ''} recorded
                        </p>
                        <div className="space-y-2">
                          {reflectionsData.slice(0, 3).map((reflection: any, index: number) => (
                            <div key={index} className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">
                                {reflection.title || 'Assessment Reflection'}
                              </p>
                              <p className="text-sm line-clamp-3">
                                {reflection.content?.slice(0, 150) + '...' || 'Reflection content available'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center py-8">
                        <div className="text-center">
                          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No reflections yet</p>
                        </div>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => setSelectedInsightType('reflections')}
                      disabled={!reflectionsData || reflectionsData.length === 0}
                    >
                      Read All
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* AI Insights Modal */}
        <Dialog open={!!selectedInsightType} onOpenChange={(open) => !open && setSelectedInsightType(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {selectedInsightType === 'journal' && (
                  <>
                    <Brain className="w-6 h-6 mr-2 text-blue-500" />
                    Complete Journal Analysis
                  </>
                )}
                {selectedInsightType === 'coaching' && (
                  <>
                    <MessageSquare className="w-6 h-6 mr-2 text-green-500" />
                    All AI Coaching Sessions
                  </>
                )}
                {selectedInsightType === 'reflections' && (
                  <>
                    <FileText className="w-6 h-6 mr-2 text-purple-500" />
                    All Assessment Reflections
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {selectedInsightType === 'journal' && analysis && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Overall Progress</h3>
                    <p className="text-muted-foreground leading-relaxed">{analysis.overallProgress}</p>
                  </div>

                  {analysis.emotionalTrends && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Emotional Trends
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">{analysis.emotionalTrends}</p>
                    </div>
                  )}

                  {analysis.patterns && analysis.patterns.length > 0 && (
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

                  {analysis.recommendations && analysis.recommendations.length > 0 && (
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
              )}

              {selectedInsightType === 'coaching' && aiResponses && Array.isArray(aiResponses) && (
                <div className="space-y-4">
                  {aiResponses.map((response: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{response.sessionType?.replace('_', ' ') || 'Coaching Session'}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(response.createdAt).toLocaleDateString()}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Your Input:</p>
                            <p className="text-sm bg-muted p-3 rounded-lg">{response.userInput}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">AI Coaching Response:</p>
                            <div className="text-sm leading-relaxed">
                              {typeof response.aiResponse === 'string' ? (
                                <p>{response.aiResponse}</p>
                              ) : (
                                <div className="space-y-3">
                                  {response.aiResponse?.personalizedMessage && (
                                    <div className="whitespace-pre-wrap">{response.aiResponse.personalizedMessage}</div>
                                  )}
                                  {response.aiResponse?.response && (
                                    <div className="whitespace-pre-wrap">{response.aiResponse.response}</div>
                                  )}
                                  {response.aiResponse?.modalities_used && response.aiResponse.modalities_used.length > 0 && (
                                    <div>
                                      <p className="font-medium text-muted-foreground mb-2">Therapeutic Approaches Used:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {response.aiResponse.modalities_used.map((modality: string, idx: number) => (
                                          <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                            {modality}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedInsightType === 'reflections' && reflectionsData && (
                <div className="space-y-4">
                  {reflectionsData.map((reflection: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{reflection.title}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(reflection.createdAt).toLocaleDateString()}
                          </span>
                        </CardTitle>
                        {reflection.challengeType && (
                          <p className="text-sm text-muted-foreground">
                            Challenge: {reflection.challengeType.replace('_', ' ')} • Day {reflection.day}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {reflection.questionPrompt && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Question:</p>
                              <p className="text-sm bg-muted p-3 rounded-lg">{reflection.questionPrompt}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Your Reflection:</p>
                            <p className="text-sm leading-relaxed">{reflection.content}</p>
                          </div>
                          <div className="flex text-xs text-muted-foreground space-x-4">
                            <span>{reflection.wordCount} words</span>
                            <span>{reflection.characterCount} characters</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Journal Entry Modal */}
        <Dialog open={!!editingEntry} onOpenChange={(open) => !open && handleCancelEdit()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Edit Day {editingEntry?.day} Journal Entry
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  How did today's practice feel?
                </label>
                <Textarea
                  placeholder="Describe your experience with today's practice..."
                  value={editExperience}
                  onChange={(e) => setEditExperience(e.target.value)}
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
                  value={editInsights}
                  onChange={(e) => setEditInsights(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tomorrow's intention
                </label>
                <Textarea
                  placeholder="What do you intend to focus on tomorrow?"
                  value={editIntention}
                  onChange={(e) => setEditIntention(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={saveMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {saveMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
