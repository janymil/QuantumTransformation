
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Trash2, 
  Edit, 
  Brain,
  Clock,
  User,
  Heart,
  Lightbulb,
  Target
} from "lucide-react";

interface JournalEntry {
  id: number;
  day?: number;
  challengeType: string;
  experience: string;
  insights: string;
  intention: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationSession {
  id: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  analysis?: {
    emotionalState: string;
    keyThemes: string[];
    progressIndicators: string[];
    recommendations: string[];
  };
}

export default function Journal() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Fetch journal entries
  const { data: entries, isLoading: entriesLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
    queryFn: async () => {
      const response = await fetch("/api/journal", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch journal entries");
      return response.json();
    },
  });

  // Fetch conversation sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery<ConversationSession[]>({
    queryKey: ["/api/therapeutic-chat/sessions"],
    queryFn: async () => {
      const response = await fetch("/api/therapeutic-chat/sessions", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch conversation sessions");
      return response.json();
    },
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: async (entryId: number) => {
      return await apiRequest("DELETE", `/api/journal/${entryId}`);
    },
    onSuccess: () => {
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

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest("DELETE", `/api/therapeutic-chat/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapeutic-chat/sessions"] });
      toast({
        title: "Session Deleted",
        description: "Your conversation session has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete conversation session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteEntry = (entryId: number) => {
    setEntryToDelete(entryId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteMutation.mutate(entryToDelete);
      setEntryToDelete(null);
    } else if (sessionToDelete) {
      deleteSessionMutation.mutate(sessionToDelete);
      setSessionToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const filteredEntries = entries?.filter(entry =>
    entry.experience?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.insights?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.intention?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredSessions = sessions?.filter(session =>
    session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (entriesLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Journal</h1>
              <p className="text-muted-foreground">Your transformation journey and conversations</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search entries and conversations..."
                className="pl-10 w-80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <BookOpen className="w-8 h-8 text-blue-500 mr-4" />
              <div>
                <p className="text-2xl font-bold">{entries?.length || 0}</p>
                <p className="text-muted-foreground">Journal Entries</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <User className="w-8 h-8 text-green-500 mr-4" />
              <div>
                <p className="text-2xl font-bold">{sessions?.length || 0}</p>
                <p className="text-muted-foreground">Chat Sessions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="w-8 h-8 text-purple-500 mr-4" />
              <div>
                <p className="text-2xl font-bold">{(entries?.length || 0) + (sessions?.length || 0)}</p>
                <p className="text-muted-foreground">Total Records</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Journal Entries Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-blue-500" />
              Journal Entries
            </h2>
            
            {filteredEntries.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No journal entries found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Try adjusting your search terms" : "Start your journey by writing your first journal entry"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEntries.map((entry) => (
                  <Card key={entry.id} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <CardTitle className="text-lg">
                            {entry.day ? `Day ${entry.day}` : 'Free Entry'}
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Badge variant="outline" className="w-fit">
                        {entry.challengeType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {entry.experience && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Heart className="w-3 h-3 text-red-500" />
                            <p className="text-xs font-medium text-muted-foreground">Experience</p>
                          </div>
                          <p className="text-sm line-clamp-2">{entry.experience}</p>
                        </div>
                      )}
                      {entry.insights && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-3 h-3 text-yellow-500" />
                            <p className="text-xs font-medium text-muted-foreground">Insights</p>
                          </div>
                          <p className="text-sm line-clamp-2">{entry.insights}</p>
                        </div>
                      )}
                      {entry.intention && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Target className="w-3 h-3 text-green-500" />
                            <p className="text-xs font-medium text-muted-foreground">Intention</p>
                          </div>
                          <p className="text-sm line-clamp-2">{entry.intention}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Conversation Sessions Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <User className="w-6 h-6 mr-2 text-green-500" />
              Conversation Sessions
            </h2>
            
            {filteredSessions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No conversation sessions found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Try adjusting your search terms" : "Start a conversation with our AI therapist"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSessions.map((session) => (
                  <div 
                    key={session.id} 
                    className="flip-card h-64"
                  >
                    <div className="flip-card-inner">
                      {/* Front Side */}
                      <Card className="flip-card-front hover:shadow-lg transition-all duration-300 group cursor-pointer">
                        <CardHeader className="pb-3 relative">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1 pr-10">
                              <User className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-base line-clamp-1">{session.title}</CardTitle>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(session.id);
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 absolute top-2 right-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-3">{session.lastMessage}</p>
                          <div className="flex justify-between items-center">
                            <Badge variant="secondary">{session.messageCount} messages</Badge>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Back Side */}
                      <Card className="flip-card-back">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-500" />
                            <CardTitle className="text-base">AI Analysis</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {session.analysis ? (
                            <>
                              <div>
                                <p className="font-medium text-purple-600 mb-1">Emotional State:</p>
                                <p className="text-muted-foreground">{session.analysis.emotionalState}</p>
                              </div>
                              <div>
                                <p className="font-medium text-blue-600 mb-1">Key Themes:</p>
                                <div className="flex flex-wrap gap-1">
                                  {session.analysis.keyThemes.slice(0, 3).map((theme, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{theme}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-green-600 mb-1">Progress:</p>
                                <p className="text-muted-foreground line-clamp-2">
                                  {session.analysis.progressIndicators[0] || 'No specific progress noted'}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="text-center text-muted-foreground">
                              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>Analysis not available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setEntryToDelete(null);
          setSessionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={entryToDelete ? "Delete Journal Entry" : "Delete Conversation Session"}
        description={
          entryToDelete 
            ? "Are you sure you want to delete this journal entry? This action cannot be undone."
            : "Are you sure you want to delete this conversation session? This action cannot be undone."
        }
        isLoading={deleteMutation.isPending || deleteSessionMutation.isPending}
      />
    </div>
  );
}
