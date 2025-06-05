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
  Trash2
} from "lucide-react";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionTypeFilter, setSessionTypeFilter] = useState("all");
  const [challengeTypeFilter, setChallengeTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedResponse, setSelectedResponse] = useState<AiResponse | null>(null);
  const [editingResponse, setEditingResponse] = useState<AiResponse | null>(null);
  const [editedInput, setEditedInput] = useState("");

  // Fetch user's AI conversation history
  const { data: responses = [], isLoading } = useQuery({
    queryKey: ["/api/ai/responses"],
  });

  // Update response mutation
  const updateResponseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/ai/responses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/responses"] });
      toast({
        title: "Updated",
        description: "Your question has been updated successfully.",
      });
      setEditingResponse(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update your question.",
        variant: "destructive",
      });
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorited }: { id: number; isFavorited: boolean }) => {
      return apiRequest(`/api/ai/responses/${id}/favorite`, {
        method: "PATCH",
        body: JSON.stringify({ isFavorited }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/responses"] });
    },
  });

  // Archive response mutation
  const archiveResponseMutation = useMutation({
    mutationFn: async ({ id, isArchived }: { id: number; isArchived: boolean }) => {
      return apiRequest(`/api/ai/responses/${id}/archive`, {
        method: "PATCH",
        body: JSON.stringify({ isArchived }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/responses"] });
      toast({
        title: isArchived ? "Archived" : "Unarchived",
        description: `Question ${isArchived ? "archived" : "restored"} successfully.`,
      });
    },
  });

  // Filter responses based on search and filters
  const filteredResponses = useMemo(() => {
    return responses.filter((response: AiResponse) => {
      // Search filter
      const matchesSearch = 
        response.userInput.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof response.aiResponse === 'string' ? response.aiResponse : JSON.stringify(response.aiResponse))
          .toLowerCase().includes(searchTerm.toLowerCase());

      // Session type filter
      const matchesSessionType = sessionTypeFilter === "all" || response.sessionType === sessionTypeFilter;

      // Challenge type filter
      const matchesChallengeType = challengeTypeFilter === "all" || response.challengeType === challengeTypeFilter;

      // Date range filter
      const responseDate = new Date(response.createdAt);
      const matchesDateRange = 
        (!dateRange.from || responseDate >= dateRange.from) &&
        (!dateRange.to || responseDate <= dateRange.to);

      return matchesSearch && matchesSessionType && matchesChallengeType && matchesDateRange && !response.isArchived;
    });
  }, [responses, searchTerm, sessionTypeFilter, challengeTypeFilter, dateRange]);

  const handleEditSave = () => {
    if (editingResponse) {
      updateResponseMutation.mutate({
        id: editingResponse.id,
        data: { userInput: editedInput }
      });
    }
  };

  const getResponseText = (aiResponse: any) => {
    if (typeof aiResponse === 'string') return aiResponse;
    if (aiResponse?.response) return aiResponse.response;
    if (aiResponse?.content) return aiResponse.content;
    return JSON.stringify(aiResponse);
  };

  const challengeTypes = ["all", "quantum_breakthrough", "reality_creation", "abundance_mindset", "health_transformation", "relationship_mastery"];
  const sessionTypes = ["all", "coaching", "explanation", "guidance", "breakthrough"];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading your conversation history...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          AI Conversation History
        </h1>
        <p className="text-muted-foreground">
          Search, filter, and manage your AI coaching conversations
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions and responses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Session Type Filter */}
            <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Session Type" />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "All Sessions" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Challenge Type Filter */}
            <Select value={challengeTypeFilter} onValueChange={setChallengeTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Challenge Type" />
              </SelectTrigger>
              <SelectContent>
                {challengeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "All Challenges" : type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
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
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange({ from: subDays(new Date(), 7) })}
            >
              Last 7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange({ from: subDays(new Date(), 30) })}
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSessionTypeFilter("all");
                setChallengeTypeFilter("all");
                setDateRange({});
              }}
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {filteredResponses.length} Conversation{filteredResponses.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {filteredResponses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No conversations found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResponses.map((response: AiResponse) => (
              <Card key={response.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {response.sessionType}
                          </Badge>
                          {response.challengeType && (
                            <Badge variant="outline">
                              {response.challengeType.replace(/_/g, " ")}
                            </Badge>
                          )}
                          {response.day && (
                            <Badge variant="outline">
                              Day {response.day}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(response.createdAt), "PPP 'at' p")}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavoriteMutation.mutate({ 
                            id: response.id, 
                            isFavorited: !response.isFavorited 
                          })}
                        >
                          <Heart className={`w-4 h-4 ${response.isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingResponse(response);
                            setEditedInput(response.userInput);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedResponse(response)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => archiveResponseMutation.mutate({ 
                            id: response.id, 
                            isArchived: true 
                          })}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Question */}
                    <div>
                      <h4 className="font-medium mb-2">Your Question:</h4>
                      <p className="text-sm bg-muted p-3 rounded-lg">
                        {response.userInput}
                      </p>
                    </div>

                    {/* AI Response Preview */}
                    <div>
                      <h4 className="font-medium mb-2">AI Response:</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {getResponseText(response.aiResponse)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* View Response Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conversation Details</DialogTitle>
            <DialogDescription>
              {selectedResponse && format(new Date(selectedResponse.createdAt), "PPP 'at' p")}
            </DialogDescription>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Your Question:</h4>
                <div className="bg-muted p-4 rounded-lg">
                  {selectedResponse.userInput}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">AI Response:</h4>
                <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
                  {getResponseText(selectedResponse.aiResponse)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Response Dialog */}
      <Dialog open={!!editingResponse} onOpenChange={() => setEditingResponse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update your original question
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editedInput}
              onChange={(e) => setEditedInput(e.target.value)}
              placeholder="Edit your question..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingResponse(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditSave} disabled={updateResponseMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}