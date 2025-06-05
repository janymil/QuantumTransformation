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
import { Input } from "@/components/ui/input";
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
  Archive,
  Plus,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Edit,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { CHALLENGE_TYPES } from "@shared/challenge-types";

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

export default function MoneyBlocksJournal() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editForm, setEditForm] = useState({
    experience: "",
    insights: "",
    intention: ""
  });

  const { data: journalEntries, isLoading } = useQuery({
    queryKey: ["/api/journal", { challengeType: "money_blocks_clearing" }],
    enabled: isAuthenticated,
  });

  const { data: progressData } = useQuery({
    queryKey: ["/api/progress/all"],
    enabled: isAuthenticated,
  });

  // Update entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async (data: { entryId: number; updates: any }) => {
      return apiRequest("PATCH", `/api/journal/${data.entryId}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      setEditingEntry(null);
      toast({
        title: "Entry updated",
        description: "Your journal entry has been updated successfully.",
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
        title: "Error updating entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: number) => {
      return apiRequest("DELETE", `/api/journal/${entryId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({
        title: "Entry deleted",
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
        title: "Error deleting entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditForm({
      experience: entry.experience,
      insights: entry.insights,
      intention: entry.intention
    });
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;
    
    updateEntryMutation.mutate({
      entryId: editingEntry.id,
      updates: editForm
    });
  };

  const handleDeleteEntry = (entryId: number) => {
    if (window.confirm("Are you sure you want to delete this journal entry? This action cannot be undone.")) {
      deleteEntryMutation.mutate(entryId);
    }
  };

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
  const challengeProgress = allProgress.find((p: any) => p.challengeType === 'money_blocks_clearing');
  const completedDays = (challengeProgress?.completedDays as number[]) || [];
  const currentDay = challengeProgress?.currentDay || 1;
  const entries = (journalEntries as any) || [];

  const filteredEntries = entries.filter((entry: JournalEntry) =>
    entry.experience.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.insights.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.intention.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

          {/* Search and Filter */}
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search your entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {filteredEntries.length} entries
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Stats */}
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="h-5 w-5 text-green-600" />
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

          {/* Journal Entries */}
          <div className="space-y-6">
            {filteredEntries.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {searchTerm ? "No matching entries found" : "No Journal Entries Yet"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm 
                      ? "Try adjusting your search terms"
                      : "Start your financial transformation by completing daily challenges"
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => window.location.href = '/money-blocks-clearing'}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      Begin Your Journey
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredEntries.map((entry: JournalEntry) => (
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
                        {editingEntry?.id === entry.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={updateEntryMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              {updateEntryMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingEntry(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditEntry(entry)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteEntry(entry.id)}
                              disabled={deleteEntryMutation.isPending}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editingEntry?.id === entry.id ? (
                      /* Edit Mode */
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Experience
                          </label>
                          <Textarea
                            value={editForm.experience}
                            onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                            placeholder="Describe your experience..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Insights
                          </label>
                          <Textarea
                            value={editForm.insights}
                            onChange={(e) => setEditForm(prev => ({ ...prev, insights: e.target.value }))}
                            placeholder="What insights did you gain..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Intention
                          </label>
                          <Textarea
                            value={editForm.intention}
                            onChange={(e) => setEditForm(prev => ({ ...prev, intention: e.target.value }))}
                            placeholder="Set your intention..."
                            rows={2}
                          />
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Experience
                          </h4>
                          <p className="text-foreground leading-relaxed">{entry.experience}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Insights
                          </h4>
                          <p className="text-foreground leading-relaxed">{entry.insights}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Intention
                          </h4>
                          <p className="text-foreground leading-relaxed">{entry.intention}</p>
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