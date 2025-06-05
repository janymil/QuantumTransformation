import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Calendar, 
  Save,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { getChallengeUrl, CHALLENGE_TYPES } from "@shared/challenge-types";

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

interface ChallengeJournalTemplateProps {
  challengeType: string;
}

function CollapsibleJournalEntry({ 
  entry, 
  onEdit, 
  onDelete 
}: { 
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader 
        className="pb-3 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium">Day {entry.day}</span>
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 text-gray-500" /> : 
              <ChevronRight className="h-4 w-4 text-gray-500" />
            }
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {format(new Date(entry.createdAt), "MMM d, yyyy")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
                  onDelete(entry.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {entry.experience && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Experience</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  {entry.experience}
                </p>
              </div>
            )}
            {entry.insights && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Insights</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  {entry.insights}
                </p>
              </div>
            )}
            {entry.intention && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Intention</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  {entry.intention}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function ChallengeJournalTemplate({ challengeType }: ChallengeJournalTemplateProps) {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [newEntry, setNewEntry] = useState({
    day: 1,
    challengeType: challengeType,
    experience: "",
    insights: "",
    intention: ""
  });
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);

  const challengeInfo = CHALLENGE_TYPES[challengeType];
  const challengeUrl = getChallengeUrl(challengeType);

  // Fetch journal entries for this challenge
  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal", challengeType],
    queryFn: async () => {
      const response = await fetch(`/api/journal?challengeType=${challengeType}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch journal entries");
      return response.json();
    },
    enabled: isAuthenticated && !!user,
  });

  // Save new journal entry
  const saveEntryMutation = useMutation({
    mutationFn: async (entryData: typeof newEntry) => {
      return await apiRequest("POST", "/api/journal", entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal", challengeType] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({
        title: "Journal Entry Saved",
        description: "Your journal entry has been saved successfully.",
      });
      setShowNewEntryForm(false);
      setNewEntry({
        day: 1,
        challengeType: challengeType,
        experience: "",
        insights: "",
        intention: ""
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
        description: "Failed to save journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update journal entry
  const updateEntryMutation = useMutation({
    mutationFn: async (entryData: JournalEntry) => {
      return await apiRequest("POST", "/api/journal", {
        day: entryData.day,
        challengeType: entryData.challengeType,
        experience: entryData.experience,
        insights: entryData.insights,
        intention: entryData.intention
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal", challengeType] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({
        title: "Journal Entry Updated",
        description: "Your journal entry has been updated successfully.",
      });
      setEditingEntry(null);
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
        description: "Failed to update journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete journal entry
  const deleteMutation = useMutation({
    mutationFn: async (entryId: number) => {
      return await apiRequest("DELETE", `/api/journal/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal", challengeType] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
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

  const handleSaveEntry = () => {
    if (!newEntry.experience.trim() && !newEntry.insights.trim() && !newEntry.intention.trim()) {
      toast({
        title: "Empty Entry",
        description: "Please write something in at least one field.",
        variant: "destructive",
      });
      return;
    }
    saveEntryMutation.mutate(newEntry);
  };

  const handleUpdateEntry = () => {
    if (!editingEntry) return;
    if (!editingEntry.experience.trim() && !editingEntry.insights.trim() && !editingEntry.intention.trim()) {
      toast({
        title: "Empty Entry",
        description: "Please write something in at least one field.",
        variant: "destructive",
      });
      return;
    }
    updateEntryMutation.mutate(editingEntry);
  };

  const filterEntries = (entries: JournalEntry[]) => {
    if (!searchQuery) return entries;
    return entries.filter(entry => 
      entry.experience.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.insights.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.intention.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading journal...</p>
        </div>
      </div>
    );
  }

  const filteredEntries = filterEntries(entries || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/${challengeUrl}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <BookOpen className="h-6 w-6 text-primary" />
                  {challengeInfo?.title || 'Challenge'} Journal
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Track your {challengeInfo?.title.toLowerCase() || 'challenge'} journey and insights
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowNewEntryForm(!showNewEntryForm)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search journal entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* New Entry Form */}
        {showNewEntryForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Journal Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Day</label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={newEntry.day}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, day: parseInt(e.target.value) }))}
                  className="w-32"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Experience</label>
                <Textarea
                  placeholder="Describe your experience with today's practice..."
                  value={newEntry.experience}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, experience: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Insights</label>
                <Textarea
                  placeholder="What insights or realizations did you have?"
                  value={newEntry.insights}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, insights: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Intention</label>
                <Textarea
                  placeholder="What is your intention moving forward?"
                  value={newEntry.intention}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, intention: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveEntry}
                  disabled={saveEntryMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveEntryMutation.isPending ? "Saving..." : "Save Entry"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewEntryForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Entry Form */}
        {editingEntry && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Journal Entry - Day {editingEntry.day}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Experience</label>
                <Textarea
                  placeholder="Describe your experience with today's practice..."
                  value={editingEntry.experience}
                  onChange={(e) => setEditingEntry(prev => prev ? { ...prev, experience: e.target.value } : null)}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Insights</label>
                <Textarea
                  placeholder="What insights or realizations did you have?"
                  value={editingEntry.insights}
                  onChange={(e) => setEditingEntry(prev => prev ? { ...prev, insights: e.target.value } : null)}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Intention</label>
                <Textarea
                  placeholder="What is your intention moving forward?"
                  value={editingEntry.intention}
                  onChange={(e) => setEditingEntry(prev => prev ? { ...prev, intention: e.target.value } : null)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleUpdateEntry}
                  disabled={updateEntryMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateEntryMutation.isPending ? "Updating..." : "Update Entry"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingEntry(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Journal Entries List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading entries...</p>
            </div>
          ) : filteredEntries && filteredEntries.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Journal Entries</h2>
                <Badge variant="outline">{filteredEntries.length} entries</Badge>
              </div>
              {filteredEntries.map((entry) => (
                <CollapsibleJournalEntry 
                  key={entry.id} 
                  entry={entry} 
                  onEdit={setEditingEntry}
                  onDelete={(entryId) => deleteMutation.mutate(entryId)}
                />
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Journal Entries</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? "No entries match your search criteria."
                    : "Start writing your first journal entry to track your journey."
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowNewEntryForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Entry
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}