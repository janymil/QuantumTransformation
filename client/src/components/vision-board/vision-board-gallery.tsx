import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Eye, Download, Share } from "lucide-react";
import VisionBoard from "../practice-tools/vision-board";

interface VisionBoardItem {
  id: number;
  title: string;
  description: string;
  thumbnailUrl?: string;
  templateCategory: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  canvasData?: {
    elements: any[];
    backgroundColor: string;
  };
}

export default function VisionBoardGallery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingBoard, setEditingBoard] = useState<VisionBoardItem | null>(null);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's vision boards
  const { data: visionBoards = [], isLoading } = useQuery({
    queryKey: ['/api/vision-boards'],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/vision-board/categories'],
  });

  // Delete vision board mutation
  const deleteVisionBoardMutation = useMutation({
    mutationFn: async (boardId: number) => {
      const response = await fetch(`/api/vision-boards/${boardId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete vision board');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Vision board deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/vision-boards'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete vision board", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter boards based on search and category
  const filteredBoards = visionBoards.filter((board: VisionBoardItem) => {
    const matchesSearch = board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         board.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || board.templateCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEditBoard = (board: VisionBoardItem) => {
    setEditingBoard(board);
  };

  const handleDeleteBoard = (boardId: number) => {
    if (confirm("Are you sure you want to delete this vision board?")) {
      deleteVisionBoardMutation.mutate(boardId);
    }
  };

  const handleShareBoard = async (board: VisionBoardItem) => {
    try {
      await navigator.clipboard.writeText(`Check out my vision board: ${board.title}`);
      toast({ title: "Share link copied to clipboard!" });
    } catch {
      toast({ 
        title: "Failed to copy share link",
        variant: "destructive"
      });
    }
  };

  if (editingBoard) {
    return (
      <VisionBoard
        boardId={editingBoard.id.toString()}
        initialItems={editingBoard.canvasData?.elements || []}
        onClose={() => setEditingBoard(null)}
      />
    );
  }

  if (creatingBoard) {
    return (
      <VisionBoard
        onClose={() => setCreatingBoard(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Vision Boards</h1>
          <p className="text-muted-foreground">Create and manage your personal vision boards</p>
        </div>
        <Button onClick={() => setCreatingBoard(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Create New Board
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vision boards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All
          </Button>
          {categories.map((category: any) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.icon} {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Vision Boards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBoards.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No vision boards found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Create your first vision board to get started"
                }
              </p>
            </div>
            {!searchTerm && selectedCategory === "all" && (
              <Button onClick={() => setCreatingBoard(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Vision Board
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoards.map((board: VisionBoardItem) => (
            <Card key={board.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{board.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {board.description || "No description"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {board.templateCategory}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Thumbnail Preview */}
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {board.thumbnailUrl ? (
                    <img 
                      src={board.thumbnailUrl} 
                      alt={board.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Eye className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Preview</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditBoard(board)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShareBoard(board)}
                  >
                    <Share className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteBoard(board.id)}
                    disabled={deleteVisionBoardMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Metadata */}
                <div className="text-xs text-muted-foreground">
                  <p>Created: {new Date(board.createdAt).toLocaleDateString()}</p>
                  <p>Updated: {new Date(board.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}