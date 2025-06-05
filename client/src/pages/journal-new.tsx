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
  ChevronRight
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

interface ChallengeJournalGroup {
  challengeType: string;
  entries: JournalEntry[];
}

interface JournalAnalysis {
  overallProgress: string;
  patterns: string[];
  recommendations: string[];
  emotionalTrends: string;
}

// Collapsible Journal Entry Component
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
            <Calendar className="h-4 w-4 text-blue-600" />
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
        <CardContent className="space-y-3">
          {entry.experience && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Experience</h4>
              <p className="text-sm">{entry.experience}</p>
            </div>
          )}
          {entry.insights && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Insights</h4>
              <p className="text-sm">{entry.insights}</p>
            </div>
          )}
          {entry.intention && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Intention</h4>
              <p className="text-sm">{entry.intention}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

interface JournalNewProps {
  challengeType?: string;
}

export default function JournalNew({ challengeType }: JournalNewProps = {}) {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [newEntry, setNewEntry] = useState({
    day: 1,
    challengeType: "general_quantum",
    experience: "",
    insights: "",
    intention: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);

  // Fetch active challenge journal entries (only challenges with entries)
  const { data: activeChallengeEntries, isLoading: activeLoading } = useQuery<ChallengeJournalGroup[]>({
    queryKey: ["/api/journal/active"],
    enabled: isAuthenticated && !!user,
  });

  // Fetch archived journal entries (from quit challenges)
  const { data: archivedEntries, isLoading: archivedLoading } = useQuery<ChallengeJournalGroup[]>({
    queryKey: ["/api/journal/archived"],
    enabled: isAuthenticated && !!user,
  });

  // Save new journal entry
  const saveEntryMutation = useMutation({
    mutationFn: async (entryData: typeof newEntry) => {
      return await apiRequest("POST", "/api/journal", entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal/archived"] });
      toast({
        title: "Journal Entry Saved",
        description: "Your journal entry has been saved successfully.",
      });
      setShowNewEntryForm(false);
      setNewEntry({
        day: 1,
        challengeType: "general_quantum",
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

  const getChallengeDisplayName = (challengeType: string) => {
    const challenge = CHALLENGE_TYPES[challengeType];
    return challenge ? challenge.title : challengeType.replace('_', ' ').toUpperCase();
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Journal
          </h1>
          <p className="text-gray-600 mt-2">
            Track your insights and progress across all challenges
          </p>
        </div>
        
        <Button 
          onClick={() => setShowNewEntryForm(!showNewEntryForm)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </div>

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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Challenge Type</label>
                <select 
                  value={newEntry.challengeType}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, challengeType: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  {Object.entries(CHALLENGE_TYPES).map(([key, challenge]) => (
                    <option key={key} value={key}>{challenge.title}</option>
                  ))}
                </select>
              </div>
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
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Experience</label>
              <Textarea
                placeholder="How was your practice today? What did you experience?"
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
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveEntry}
                disabled={saveEntryMutation.isPending}
                className="flex items-center gap-2"
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

      {/* Dynamic Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Active Challenges ({activeChallengeEntries?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archived ({archivedEntries?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Active Challenges Tab */}
        <TabsContent value="active" className="space-y-6">
          {activeLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading active challenge entries...</p>
            </div>
          ) : activeChallengeEntries && activeChallengeEntries.length > 0 ? (
            <Tabs defaultValue={activeChallengeEntries[0].challengeType}>
              <TabsList className="grid w-full gap-2 mb-6" style={{ gridTemplateColumns: `repeat(${activeChallengeEntries.length}, 1fr)` }}>
                {activeChallengeEntries.map((challengeGroup) => (
                  <TabsTrigger 
                    key={challengeGroup.challengeType}
                    value={challengeGroup.challengeType}
                    className="flex flex-col items-center p-3"
                  >
                    <div className="text-center">
                      <div className="font-medium text-sm">
                        {getChallengeDisplayName(challengeGroup.challengeType)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {challengeGroup.entries.length} entries
                      </div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="w-full">
                {activeChallengeEntries.map((challengeGroup) => (
                  <TabsContent key={challengeGroup.challengeType} value={challengeGroup.challengeType}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">
                          {getChallengeDisplayName(challengeGroup.challengeType)}
                        </h3>
                        <Badge variant="outline">
                          {challengeGroup.entries.length} entries
                        </Badge>
                      </div>
                      
                      <div className="grid gap-4">
                        {filterEntries(challengeGroup.entries).map((entry) => (
                          <CollapsibleJournalEntry key={entry.id} entry={entry} />
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Challenge Entries</h3>
              <p className="text-gray-500 mb-4">
                Start writing journal entries in your active challenges to see them here.
              </p>
              <Button onClick={() => setShowNewEntryForm(true)}>
                Write Your First Entry
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Archived Tab */}
        <TabsContent value="archive" className="space-y-6">
          {archivedLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading archived entries...</p>
            </div>
          ) : archivedEntries && archivedEntries.length > 0 ? (
            <div className="space-y-6">
              {archivedEntries.map((challengeGroup) => (
                <Card key={challengeGroup.challengeType}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Archive className="h-5 w-5 text-gray-500" />
                        <CardTitle>{getChallengeDisplayName(challengeGroup.challengeType)}</CardTitle>
                      </div>
                      <Badge variant="secondary">
                        {challengeGroup.entries.length} archived entries
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {filterEntries(challengeGroup.entries).map((entry) => (
                        <div key={entry.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">Day {entry.day}</span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(entry.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            {entry.experience && <p><strong>Experience:</strong> {entry.experience}</p>}
                            {entry.insights && <p><strong>Insights:</strong> {entry.insights}</p>}
                            {entry.intention && <p><strong>Intention:</strong> {entry.intention}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Archive className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Archived Entries</h3>
              <p className="text-gray-500">
                Journal entries from quit challenges will appear here.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}