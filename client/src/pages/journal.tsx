import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  Calendar, 
  FileText, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Save, 
  BookOpen, 
  MessageSquare, 
  ChevronDown, 
  ChevronRight,
  Brain,
  TrendingUp,
  Heart,
  Target,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface JournalEntry {
  id: number;
  day: number | null;
  challengeType: string | null;
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

const challengeContent = [
  { day: 1, title: "Quantum Initiation: Opening the Field of Possibility", type: "quantum_field_activation" },
  { day: 2, title: "Breaking Old Patterns: Identifying and Reframing Limiting Beliefs", type: "money_blocks_clearing" },
  { day: 3, title: "Abundance Activation: Aligning with Flow", type: "abundance_mindset" },
  { day: 4, title: "Energy Mastery: Raising Your Vibration", type: "energy_alignment" },
  { day: 5, title: "Manifestation Mechanics: Creating from the Quantum Field", type: "manifestation" },
  { day: 6, title: "Self-Worth Revolution: Claiming Your Value", type: "self_worth" },
  { day: 7, title: "Integration: Embodying Your New Reality", type: "integration" }
];

export default function Journal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  
  // Free-form entry mode
  const [entryMode, setEntryMode] = useState<"free" | "challenge">("challenge");
  const [freeFormExperience, setFreeFormExperience] = useState("");
  const [freeFormInsights, setFreeFormInsights] = useState("");
  const [freeFormIntention, setFreeFormIntention] = useState("");

  const toggleEntryExpansion = (entryId: string | number) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  // Data queries
  const { data: entriesData = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['/api/journal'],
  });

  const { data: reflectionsData = [], isLoading: reflectionsLoading } = useQuery({
    queryKey: ['/api/assessment-reflections'],
  });

  const { data: analysisData, isLoading: analysisLoading } = useQuery({
    queryKey: ['/api/journal/analyze'],
    enabled: entriesData.length > 0,
  });

  const { data: aiResponses = [], isLoading: aiResponsesLoading } = useQuery({
    queryKey: ['/api/ai/responses'],
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      toast({
        title: "Entry saved successfully",
        description: "Your journal entry has been saved.",
      });
      // Clear form fields
      if (entryMode === "free") {
        setFreeFormExperience("");
        setFreeFormInsights("");
        setFreeFormIntention("");
      } else {
        setExperience("");
        setInsights("");
        setIntention("");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error saving entry",
        description: error.message || "Failed to save journal entry.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/journal/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      setEditingEntry(null);
      toast({
        title: "Entry updated successfully",
        description: "Your journal entry has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating entry",
        description: error.message || "Failed to update journal entry.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/journal/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting entry",
        description: error.message || "Failed to delete journal entry.",
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleFreeFormSave = () => {
    if (!freeFormExperience.trim() && !freeFormInsights.trim() && !freeFormIntention.trim()) {
      toast({
        title: "Empty entry",
        description: "Please write something before saving.",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      experience: freeFormExperience,
      insights: freeFormInsights,
      intention: freeFormIntention,
      // No day or challengeType for free-form entries
    });
  };

  const handleChallengeSave = () => {
    if (!selectedDay) {
      toast({
        title: "No day selected",
        description: "Please select a challenge day first.",
        variant: "destructive",
      });
      return;
    }

    if (!experience.trim() && !insights.trim() && !intention.trim()) {
      toast({
        title: "Empty entry",
        description: "Please write something before saving.",
        variant: "destructive",
      });
      return;
    }

    const challengeType = challengeContent.find(c => c.day === selectedDay)?.type || "general";

    saveMutation.mutate({
      day: selectedDay,
      challengeType,
      experience,
      insights,
      intention,
    });
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditExperience(entry.experience);
    setEditInsights(entry.insights);
    setEditIntention(entry.intention);
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;

    updateMutation.mutate({
      id: editingEntry.id,
      data: {
        experience: editExperience,
        insights: editInsights,
        intention: editIntention,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditExperience("");
    setEditInsights("");
    setEditIntention("");
  };

  // Filter entries and reflections
  const filteredEntries = Array.isArray(entriesData) ? entriesData.filter((entry: JournalEntry) => {
    const matchesSearch = searchTerm === "" || 
      entry.experience.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.insights.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.intention.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) : [];

  const filteredReflections = Array.isArray(reflectionsData) ? reflectionsData.filter((reflection: AssessmentReflection) => {
    const matchesSearch = searchTerm === "" ||
      reflection.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reflection.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) : [];

  const groupedReflections = filteredReflections.reduce((acc: { [key: string]: AssessmentReflection[] }, reflection: AssessmentReflection) => {
    const type = reflection.reflectionType || 'general';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(reflection);
    return acc;
  }, {});

  const filteredAIResponses = Array.isArray(aiResponses) ? aiResponses.filter((response: any) => {
    if (selectedInsightType === 'all') return true;
    return response.sessionType === selectedInsightType;
  }) : [];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Personal Journal</h1>
        <p className="text-muted-foreground">
          Capture your thoughts, track your progress, and gain insights from your journey.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="write">Write Entry</TabsTrigger>
          <TabsTrigger value="history">Entry History</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="write" className="space-y-6">
          {/* Entry Mode Toggle */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Journal Entry Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={entryMode === "free" ? "default" : "outline"}
                  onClick={() => setEntryMode("free")}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Free Journal
                </Button>
                <Button
                  variant={entryMode === "challenge" ? "default" : "outline"}
                  onClick={() => setEntryMode("challenge")}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Challenge Entry
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {entryMode === "free" 
                  ? "Write freely about anything on your mind - thoughts, experiences, reflections, or goals."
                  : "Write an entry for a specific challenge day with guided prompts."
                }
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Editor */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {entryMode === "free" ? (
                        <>
                          <FileText className="w-5 h-5 mr-2 inline" />
                          Free Journal Entry
                        </>
                      ) : selectedDay ? (
                        <>
                          <Calendar className="w-5 h-5 mr-2 inline" />
                          Day {selectedDay} Journal Entry
                        </>
                      ) : (
                        "Select a Day to Begin"
                      )}
                    </span>
                    {entryMode === "challenge" && selectedDay && (
                      <Badge variant="outline">
                        {challengeContent.find(c => c.day === selectedDay)?.title || `Day ${selectedDay}`}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {entryMode === "free" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Today's Experience
                        </label>
                        <Textarea
                          placeholder="Write about your day, feelings, experiences, or anything on your mind..."
                          value={freeFormExperience}
                          onChange={(e) => setFreeFormExperience(e.target.value)}
                          rows={6}
                          className="resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Insights & Reflections
                        </label>
                        <Textarea
                          placeholder="Any realizations, learnings, or thoughts you'd like to capture..."
                          value={freeFormInsights}
                          onChange={(e) => setFreeFormInsights(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Intentions & Goals
                        </label>
                        <Textarea
                          placeholder="What are you focusing on? What do you want to work towards?"
                          value={freeFormIntention}
                          onChange={(e) => setFreeFormIntention(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          onClick={handleFreeFormSave}
                          disabled={saveMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          {saveMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Entry
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : selectedDay ? (
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

                      <div className="flex justify-end">
                        <Button 
                          onClick={handleChallengeSave}
                          disabled={saveMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          {saveMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Entry
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Choose a Challenge Day</h3>
                      <p className="text-muted-foreground mb-4">
                        Select a day from the sidebar to begin your guided journal entry.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            {entryMode === "challenge" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Challenge Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {challengeContent.map((content) => (
                      <Button
                        key={content.day}
                        variant={selectedDay === content.day ? "default" : "outline"}
                        className="w-full text-left justify-start h-auto p-3"
                        onClick={() => setSelectedDay(content.day)}
                      >
                        <div>
                          <div className="font-medium">Day {content.day}</div>
                          <div className="text-xs opacity-70 mt-1">{content.title}</div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search your entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={reflectionFilter} onValueChange={setReflectionFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entries</SelectItem>
                <SelectItem value="journal_only">Journal Only</SelectItem>
                <SelectItem value="reflections_only">Reflections Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6">
            {/* Show filtered journal entries */}
            {(reflectionFilter === 'all' || reflectionFilter === 'journal_only') && filteredEntries.length > 0 && 
              filteredEntries
                .sort((a, b) => (b.day || 0) - (a.day || 0))
                .map((entry) => {
                  const content = challengeContent.find(c => c.day === entry.day);
                  return (
                    <Card key={`journal-${entry.id}`} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => toggleEntryExpansion(entry.id)}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <div className="p-1 h-auto">
                              {entry.day ? (
                                <Badge variant="secondary" className="text-xs">
                                  Day {entry.day}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Free Entry
                                </Badge>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {entry.day && content ? content.title : "Personal Journal Entry"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {expandedEntries.has(entry.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        {expandedEntries.has(entry.id) && (
                          <CardContent className="pt-4">
                            <div className="space-y-4">
                              {entry.experience && (
                                <div>
                                  <h4 className="font-medium text-foreground mb-2">Experience</h4>
                                  <p className="text-muted-foreground text-sm leading-relaxed">{entry.experience}</p>
                                </div>
                              )}
                              {entry.insights && (
                                <div>
                                  <h4 className="font-medium text-foreground mb-2">Insights</h4>
                                  <p className="text-muted-foreground text-sm leading-relaxed">{entry.insights}</p>
                                </div>
                              )}
                              {entry.intention && (
                                <div>
                                  <h4 className="font-medium text-foreground mb-2">Intentions</h4>
                                  <p className="text-muted-foreground text-sm leading-relaxed">{entry.intention}</p>
                                </div>
                              )}
                              <div className="flex justify-end space-x-2 pt-2 border-t">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectEntry(entry);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMutation.mutate(entry.id);
                                  }}
                                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </CardHeader>
                    </Card>
                  );
                })
            }

            {/* Show filtered assessment reflections */}
            {(reflectionFilter === 'all' || reflectionFilter !== 'journal_only') && Object.entries(groupedReflections).map(([type, reflections]) => (
              <div key={type} className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground capitalize">
                    {type.replace(/_/g, ' ')}
                  </h3>
                  <Badge variant="secondary" className="ml-auto">
                    {reflections.length}
                  </Badge>
                </div>
                
                {reflections.map((reflection: AssessmentReflection) => (
                  <Card key={`reflection-${reflection.id}`} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => toggleEntryExpansion(`reflection-${reflection.id}`)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div className="p-1 h-auto">
                            <Badge variant="outline" className="text-xs">
                              {reflection.challengeType && reflection.day ? `${reflection.challengeType} - Day ${reflection.day}` : 'Assessment'}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{reflection.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(reflection.createdAt), "MMM d, yyyy 'at' h:mm a")} • {reflection.wordCount} words
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {expandedEntries.has(`reflection-${reflection.id}`) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      {expandedEntries.has(`reflection-${reflection.id}`) && (
                        <CardContent className="pt-4">
                          <div className="space-y-4">
                            {reflection.questionPrompt && (
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <h4 className="font-medium text-foreground mb-2">Prompt</h4>
                                <p className="text-muted-foreground text-sm leading-relaxed italic">{reflection.questionPrompt}</p>
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Response</h4>
                              <p className="text-muted-foreground text-sm leading-relaxed">{reflection.content}</p>
                            </div>
                            {reflection.metadata && Object.keys(reflection.metadata).length > 0 && (
                              <div className="text-xs text-muted-foreground pt-2 border-t">
                                <strong>Context:</strong> {JSON.stringify(reflection.metadata, null, 2)}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ))}

            {/* No entries message */}
            {filteredEntries.length === 0 && Object.keys(groupedReflections).length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No entries found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || reflectionFilter !== 'all' 
                      ? "Try adjusting your search or filter settings." 
                      : "Start your journaling journey by writing your first entry."
                    }
                  </p>
                  <Button onClick={() => setActiveTab("write")}>
                    Write Your First Entry
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* AI Analysis */}
              {analysisData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      Journal Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Overall Progress
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{analysisData.overallProgress}</p>
                    </div>
                    
                    {analysisData.patterns && analysisData.patterns.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2 flex items-center">
                          <Target className="w-4 h-4 mr-2" />
                          Patterns Identified
                        </h4>
                        <ul className="space-y-2">
                          {analysisData.patterns.map((pattern: string, index: number) => (
                            <li key={index} className="text-muted-foreground text-sm leading-relaxed flex items-start">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {pattern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisData.recommendations && analysisData.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {analysisData.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="text-muted-foreground text-sm leading-relaxed flex items-start">
                              <span className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisData.emotionalTrends && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2 flex items-center">
                          <Heart className="w-4 h-4 mr-2" />
                          Emotional Trends
                        </h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">{analysisData.emotionalTrends}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* AI Coaching Responses */}
              {filteredAIResponses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      AI Coaching Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredAIResponses.map((response: any, index: number) => (
                      <div key={index} className="border-l-4 border-primary pl-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {response.sessionType?.replace(/_/g, ' ') || 'General'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(response.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {response.aiResponse?.personalizedMessage?.substring(0, 300)}
                          {response.aiResponse?.personalizedMessage?.length > 300 && "..."}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar for insights */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Filter Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedInsightType} onValueChange={setSelectedInsightType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Insights</SelectItem>
                      <SelectItem value="advanced_coaching">Advanced Coaching</SelectItem>
                      <SelectItem value="general_coaching">General Coaching</SelectItem>
                      <SelectItem value="daily_assessment">Daily Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => handleCancelEdit()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Experience
                </label>
                <Textarea
                  value={editExperience}
                  onChange={(e) => setEditExperience(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Insights
                </label>
                <Textarea
                  value={editInsights}
                  onChange={(e) => setEditInsights(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Intentions
                </label>
                <Textarea
                  value={editIntention}
                  onChange={(e) => setEditIntention(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}