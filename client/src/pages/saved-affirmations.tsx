import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Search, 
  Filter, 
  Trash2, 
  Share2, 
  Copy,
  Twitter,
  Facebook,
  Quote,
  Calendar,
  Tag
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SavedAffirmations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: savedPhrases = [], isLoading } = useQuery({
    queryKey: ["/api/saved-phrases"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (phraseId: number) => {
      return apiRequest(`/api/saved-phrases/${phraseId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-phrases"] });
      toast({
        title: "Affirmation deleted",
        description: "Removed from your collection",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting affirmation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleShare = (phrase: string, platform?: string) => {
    const text = `"${phrase}" - From my transformation journey`;
    const url = window.location.origin;

    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
    } else {
      navigator.clipboard.writeText(text).then(() => {
        toast({
          title: "Copied to clipboard!",
          description: "Share your affirmation anywhere",
        });
      });
    }
  };

  // Filter and search logic
  const filteredPhrases = savedPhrases.filter((phrase: any) => {
    const matchesSearch = phrase.phrase?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || phrase.category === categoryFilter;
    const matchesSource = sourceFilter === "all" || phrase.source === sourceFilter;
    
    return matchesSearch && matchesCategory && matchesSource;
  });

  // Get unique categories and sources for filters
  const categories = [...new Set(savedPhrases.map((p: any) => p.category).filter(Boolean))];
  const sources = [...new Set(savedPhrases.map((p: any) => p.source).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Heart className="w-8 h-8 mr-3 text-pink-500" />
            Saved Affirmations
          </h1>
          <p className="text-muted-foreground mt-2">
            Your personal collection of powerful affirmations ({filteredPhrases.length} saved)
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search affirmations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <Tag className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setSourceFilter("all");
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Affirmations Grid */}
      {filteredPhrases.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Quote className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No affirmations found</h3>
            <p className="text-muted-foreground">
              {savedPhrases.length === 0 
                ? "Start saving affirmations from your daily practices to build your personal collection."
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPhrases.map((phrase: any) => (
            <Card key={phrase.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <blockquote className="text-lg font-medium text-foreground leading-relaxed mb-3">
                      "{phrase.phrase}"
                    </blockquote>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {phrase.category && (
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {phrase.category}
                        </Badge>
                      )}
                      {phrase.source && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {phrase.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Saved {new Date(phrase.createdAt).toLocaleDateString()}
                  </p>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleShare(phrase.phrase)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy to Clipboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(phrase.phrase, "twitter")}>
                          <Twitter className="w-4 h-4 mr-2" />
                          Share on Twitter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(phrase.phrase, "facebook")}>
                          <Facebook className="w-4 h-4 mr-2" />
                          Share on Facebook
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(phrase.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}