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
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

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

function CollapsibleJournalEntry({ entry }: { entry: JournalEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader 
        className="pb-3 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-600" />
            <span className="font-medium">Day {entry.day}</span>
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 text-gray-500" /> : 
              <ChevronRight className="h-4 w-4 text-gray-500" />
            }
          </div>
          <span className="text-sm text-gray-500">
            {format(new Date(entry.createdAt), "MMM d, yyyy")}
          </span>
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

export default function MoneyBlocksClearingJournal() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [newEntry, setNewEntry] = useState({
    day: 1,
    challengeType: "money_blocks_clearing",
    experience: "",
    insights: "",
    intention: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);

  // Fetch journal entries for money blocks clearing challenge
  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal", "money_blocks_clearing"],
    enabled: isAuthenticated && !!user,
  });

  // Save new journal entry
  const saveEntryMutation = useMutation({
    mutationFn: async (entryData: typeof newEntry) => {
      return await apiRequest("POST", "/api/journal", entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal", "money_blocks_clearing"] });
      toast({
        title: "Journal Entry Saved",
        description: "Your journal entry has been saved successfully.",
      });
      setShowNewEntryForm(false);
      setNewEntry({
        day: 1,
        challengeType: "money_blocks_clearing",
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p>Loading journal...</p>
        </div>
      </div>
    );
  }

  const filteredEntries = filterEntries(entries || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/money-blocks-clearing">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <BookOpen className="h-6 w-6 text-amber-600" />
                  Money Blocks Clearing Journal
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Track your money blocks clearing journey and insights
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowNewEntryForm(!showNewEntryForm)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
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
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Experience</label>
                <Textarea
                  placeholder="What blocks or resistance did you encounter today? How did you work through them?"
                  value={newEntry.experience}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, experience: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Insights</label>
                <Textarea
                  placeholder="What did you discover about your money blocks? What patterns became clear?"
                  value={newEntry.insights}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, insights: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Intention</label>
                <Textarea
                  placeholder="What new beliefs or intentions are you setting around money?"
                  value={newEntry.intention}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, intention: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveEntry}
                  disabled={saveEntryMutation.isPending}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Save className="h-4 w-4" />
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

        {/* Journal Entries */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p>Loading journal entries...</p>
            </div>
          ) : filteredEntries.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Money Blocks Clearing Journey
                </h2>
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  {filteredEntries.length} entries
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {filteredEntries.map((entry) => (
                  <CollapsibleJournalEntry key={entry.id} entry={entry} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Journal Entries Yet</h3>
              <p className="text-gray-500 mb-4">
                Start documenting your money blocks clearing journey.
              </p>
              <Button onClick={() => setShowNewEntryForm(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
                Write Your First Entry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}