import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Star, 
  Archive, 
  Edit3, 
  Eye,
  MessageSquare,
  Heart,
  Save,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AiResponse {
  id: number;
  userInput: string;
  aiResponse: any;
  sessionType: string;
  challengeType?: string;
  day?: number;
  isFavorited: boolean;
  rating?: number;
  isArchived: boolean;
  createdAt: string;
}

export default function AiConversationHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionTypeFilter, setSessionTypeFilter] = useState("all");
  const [challengeTypeFilter, setChallengeTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedResponse, setSelectedResponse] = useState<AiResponse | null>(null);
  const [editingResponse, setEditingResponse] = useState<AiResponse | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  // Fetch AI responses
  const { data: responses, isLoading } = useQuery({
    queryKey: ['/api/ai/responses'],
    retry: false,
  });

  // Update response mutation
  const updateResponseMutation = useMutation({
    mutationFn: async ({ id, userInput }: { id: number; userInput: string }) => {
      return await apiRequest(`/api/ai/responses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ userInput })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/responses'] });
      setEditingResponse(null);
      toast({
        title: "Response updated",
        description: "Your question has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update response.",
        variant: "destructive",
      });
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorited }: { id: number; isFavorited: boolean }) => {
      return await apiRequest(`/api/ai/responses/${id}/favorite`, {
        method: 'PATCH',
        body: JSON.stringify({ isFavorited })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/responses'] });
    },
  });

  // Toggle archive mutation
  const toggleArchiveMutation = useMutation({
    mutationFn: async ({ id, isArchived }: { id: number; isArchived: boolean }) => {
      return await apiRequest(`/api/ai/responses/${id}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ isArchived })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/responses'] });
    },
  });

  // Helper function to safely parse and format text for human reading
  const formatText = (text: any): string => {
    if (typeof text === 'string') {
      try {
        // Try to parse if it's JSON
        const parsed = JSON.parse(text);
        if (typeof parsed === 'string') {
          return parsed;
        }
        // If it's an object, extract readable content
        if (typeof parsed === 'object' && parsed !== null) {
          if (Array.isArray(parsed)) {
            return parsed.map(item => typeof item === 'string' ? item : formatObjectContent(item)).join('\n\n');
          }
          return formatObjectContent(parsed);
        }
        return String(parsed);
      } catch {
        // If not JSON, return as is
        return text;
      }
    }
    if (typeof text === 'object' && text !== null) {
      return formatObjectContent(text);
    }
    return String(text || '');
  };

  // Helper function to format object content in a human-readable way
  const formatObjectContent = (obj: any): string => {
    if (!obj || typeof obj !== 'object') return String(obj);
    
    // Handle specific AI response structure
    if (obj.personalizedMessage) {
      let result = obj.personalizedMessage + '\n\n';
      
      if (obj.energyAlignment) {
        result += `Energy Alignment: ${obj.energyAlignment}\n\n`;
      }
      
      if (obj.challengeSupport) {
        result += `Challenge Support: ${obj.challengeSupport}\n\n`;
      }
      
      if (obj.nextStepsGuidance) {
        result += `Next Steps: ${obj.nextStepsGuidance}\n\n`;
      }
      
      if (obj.motivationalInsight) {
        result += `Insight: ${obj.motivationalInsight}\n\n`;
      }
      
      if (obj.practiceAdjustments && Array.isArray(obj.practiceAdjustments)) {
        result += `Practice Adjustments:\n${obj.practiceAdjustments.map((item: string, index: number) => `${index + 1}. ${item}`).join('\n')}\n\n`;
      }
      
      if (obj.progressRecognition) {
        result += `Progress Recognition: ${obj.progressRecognition}\n\n`;
      }
      
      if (obj.todaysRecommendation) {
        result += `Today's Recommendation: ${obj.todaysRecommendation}`;
      }
      
      return result.trim();
    }
    
    // Handle user question structure
    if (obj.challengeType || obj.currentDay || obj.userGoals) {
      let result = '';
      
      if (obj.challengeType) {
        result += `Challenge: ${obj.challengeType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}\n`;
      }
      
      if (obj.currentDay) {
        result += `Day: ${obj.currentDay}\n`;
      }
      
      if (obj.userGoals) {
        result += `Goals: ${obj.userGoals}\n`;
      }
      
      if (obj.mood) {
        result += `Mood Level: ${obj.mood}/10\n`;
      }
      
      if (obj.currentChallenges && Array.isArray(obj.currentChallenges) && obj.currentChallenges.length > 0) {
        result += `Current Challenges: ${obj.currentChallenges.join(', ')}\n`;
      }
      
      return result.trim();
    }
    
    // Handle simple key-value objects
    const entries = Object.entries(obj);
    if (entries.length <= 3) {
      return entries
        .filter(([key, value]) => key !== 'userId' && key !== 'userTier')
        .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`)
        .join('\n');
    }
    
    // Fallback for complex objects
    return Object.entries(obj)
      .filter(([key, value]) => key !== 'userId' && key !== 'userTier' && value)
      .map(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (Array.isArray(value)) {
          return `${formattedKey}:\n${value.map((item, index) => `  ${index + 1}. ${item}`).join('\n')}`;
        }
        return `${formattedKey}: ${value}`;
      })
      .join('\n\n');
  };

  // Filter logic
  const filteredResponses = useMemo(() => {
    if (!responses) return [];
    
    return (responses as AiResponse[]).filter((response: AiResponse) => {
      const matchesSearch = !searchTerm || 
        response.userInput.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatText(response.aiResponse).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSessionType = sessionTypeFilter === 'all' || response.sessionType === sessionTypeFilter;
      const matchesChallengeType = challengeTypeFilter === 'all' || response.challengeType === challengeTypeFilter;
      const matchesArchived = !showArchived || response.isArchived;
      const matchesFavorited = !showFavorites || response.isFavorited;
      
      const responseDate = new Date(response.createdAt);
      const matchesDateRange = !dateRange.from || !dateRange.to || 
        (responseDate >= dateRange.from && responseDate <= dateRange.to);
      
      return matchesSearch && matchesSessionType && matchesChallengeType && 
             matchesArchived && matchesFavorited && matchesDateRange;
    });
  }, [responses, searchTerm, sessionTypeFilter, challengeTypeFilter, showArchived, showFavorites, dateRange]);

  const quickFilters = [
    { label: "Last 7 Days", onClick: () => setDateRange({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: "Last 30 Days", onClick: () => setDateRange({ from: subDays(new Date(), 30), to: new Date() }) },
    { label: "Clear All", onClick: () => {
      setSearchTerm("");
      setSessionTypeFilter("all");
      setChallengeTypeFilter("all");
      setDateRange({});
      setShowArchived(false);
      setShowFavorites(false);
    }}
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading your chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/ai-coaching')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to AI Coach</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Chat History</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {filteredResponses.length} conversation{filteredResponses.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <CardTitle className="text-lg">Search & Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search questions and responses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sessions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="breakthrough">Breakthrough</SelectItem>
                </SelectContent>
              </Select>

              <Select value={challengeTypeFilter} onValueChange={setChallengeTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Challenges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Challenges</SelectItem>
                  <SelectItem value="money_blocks_clearing">Money Blocks Clearing</SelectItem>
                  <SelectItem value="quantum_consciousness">Quantum Consciousness</SelectItem>
                  <SelectItem value="relationships">Relationships</SelectItem>
                  <SelectItem value="health_vitality">Health & Vitality</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd")} -{" "}
                          {format(dateRange.to, "LLL dd")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange as any}
                    onSelect={setDateRange as any}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <div className="flex gap-2">
                <Button
                  variant={showFavorites ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFavorites(!showFavorites)}
                  className="flex items-center gap-1"
                >
                  <Star className="w-3 h-3" />
                  Favorites
                </Button>
                <Button
                  variant={showArchived ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-1"
                >
                  <Archive className="w-3 h-3" />
                  Archived
                </Button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              {quickFilters.map((filter, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={filter.onClick}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredResponses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No conversations found</h3>
              <p className="text-muted-foreground">
                {searchTerm || sessionTypeFilter !== 'all' || challengeTypeFilter !== 'all' || dateRange.from
                  ? "Try adjusting your filters to see more results."
                  : "Start a conversation with the AI Coach to see your history here."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResponses.map((response) => (
              <Card key={response.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {response.sessionType}
                        </Badge>
                        {response.challengeType && (
                          <Badge variant="outline" className="text-xs">
                            Day {response.day}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(response.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavoriteMutation.mutate({ 
                          id: response.id, 
                          isFavorited: !response.isFavorited 
                        })}
                        className="h-8 w-8 p-0"
                      >
                        <Star className={`w-3 h-3 ${response.isFavorited ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingResponse(response)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">Your Question:</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {formatText(response.userInput)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">AI Response:</h4>
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {formatText(response.aiResponse)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View Full
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Conversation Details</DialogTitle>
                            <DialogDescription>
                              {format(new Date(response.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Your Question:</h4>
                              <div className="bg-muted p-4 rounded-lg">
                                <p className="whitespace-pre-wrap">{formatText(response.userInput)}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">AI Response:</h4>
                              <div className="bg-muted p-4 rounded-lg">
                                <p className="whitespace-pre-wrap">{formatText(response.aiResponse)}</p>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleArchiveMutation.mutate({ 
                          id: response.id, 
                          isArchived: !response.isArchived 
                        })}
                      >
                        <Archive className="w-3 h-3 mr-1" />
                        {response.isArchived ? 'Unarchive' : 'Archive'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        {editingResponse && (
          <Dialog open={!!editingResponse} onOpenChange={() => setEditingResponse(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Question</DialogTitle>
                <DialogDescription>
                  Modify your original question below.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={editingResponse.userInput}
                  onChange={(e) => setEditingResponse({ ...editingResponse, userInput: e.target.value })}
                  rows={4}
                  placeholder="Enter your question..."
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingResponse(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => updateResponseMutation.mutate({ 
                      id: editingResponse.id, 
                      userInput: editingResponse.userInput 
                    })}
                    disabled={updateResponseMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}