import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Edit3, Trash2, Share2, Copy } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { VisionBoard } from "./vision-board-types";

interface BoardEditorProps {
  isOpen: boolean;
  onClose: () => void;
  board: VisionBoard;
  onBoardUpdated: (board: VisionBoard) => void;
  onBoardDeleted: () => void;
}

export default function BoardEditor({
  isOpen,
  onClose,
  board,
  onBoardUpdated,
  onBoardDeleted
}: BoardEditorProps) {
  const [editData, setEditData] = useState({
    title: board.title || "",
    description: board.description || "",
    isPublic: board.isPublic || false,
    tags: board.tags?.join(", ") || "",
    templateCategory: board.templateCategory || "personal"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update board mutation
  const updateBoardMutation = useMutation({
    mutationFn: async (boardData: VisionBoard) => {
      const response = await fetch(`/api/vision-boards/${board.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(boardData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update vision board');
      }

      return response.json();
    },
    onSuccess: (result) => {
      const updatedBoard = { ...board, ...editData, tags: editData.tags.split(",").map(tag => tag.trim()).filter(Boolean) };
      onBoardUpdated(updatedBoard);
      queryClient.invalidateQueries({ queryKey: ['/api/vision-boards'] });
      onClose();
      
      toast({
        title: "Vision Board Updated",
        description: `"${editData.title}" has been updated successfully`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete board mutation
  const deleteBoardMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/vision-boards/${board.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete vision board');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vision-boards'] });
      onBoardDeleted();
      onClose();
      
      toast({
        title: "Vision Board Deleted",
        description: "Vision board has been deleted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Duplicate board mutation
  const duplicateBoardMutation = useMutation({
    mutationFn: async () => {
      const duplicateBoard = {
        ...board,
        id: undefined,
        title: `${board.title} (Copy)`,
        isPublic: false,
        createdAt: undefined,
        updatedAt: undefined
      };

      const response = await fetch('/api/vision-boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(duplicateBoard)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to duplicate vision board');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vision-boards'] });
      
      toast({
        title: "Vision Board Duplicated",
        description: "A copy of your vision board has been created"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Duplication Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!editData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your vision board",
        variant: "destructive"
      });
      return;
    }

    const updatedBoard: VisionBoard = {
      ...board,
      title: editData.title,
      description: editData.description,
      isPublic: editData.isPublic,
      tags: editData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      templateCategory: editData.templateCategory
    };

    updateBoardMutation.mutate(updatedBoard);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${board.title}"? This action cannot be undone.`)) {
      deleteBoardMutation.mutate();
    }
  };

  const handleDuplicate = () => {
    duplicateBoardMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: board.title,
          text: board.description || 'Check out my vision board!',
          url: window.location.href
        });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Vision board link copied to clipboard"
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Vision board link copied to clipboard"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-600" />
            Edit Vision Board
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Board Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Board Information</CardTitle>
              <CardDescription>
                Update your vision board details and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter vision board title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your vision board and its purpose..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={editData.tags}
                  onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="wealth, goals, manifestation, health"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={editData.templateCategory}
                  onChange={(e) => setEditData(prev => ({ ...prev, templateCategory: e.target.value }))}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="personal">Personal Growth</option>
                  <option value="wealth">Wealth & Abundance</option>
                  <option value="health">Health & Wellness</option>
                  <option value="career">Career & Success</option>
                  <option value="relationships">Love & Relationships</option>
                  <option value="lifestyle">Lifestyle & Travel</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Make Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to view and get inspired by your vision board
                  </p>
                </div>
                <Switch
                  checked={editData.isPublic}
                  onCheckedChange={(checked) => 
                    setEditData(prev => ({ ...prev, isPublic: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Board Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Board Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {board.canvasData?.items?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Elements</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {board.canvasData?.items?.filter(item => item.type === 'image').length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Images</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {board.canvasData?.items?.filter(item => item.type === 'text').length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Text</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">
                    {board.tags?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Tags</div>
                </div>
              </div>

              {board.createdAt && (
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <div>Created: {formatDate(board.createdAt)}</div>
                  {board.updatedAt && board.updatedAt !== board.createdAt && (
                    <div>Updated: {formatDate(board.updatedAt)}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button 
              onClick={handleSave}
              disabled={updateBoardMutation.isPending || !editData.title.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateBoardMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>

            <Button
              onClick={handleDuplicate}
              disabled={duplicateBoardMutation.isPending}
              variant="outline"
            >
              {duplicateBoardMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Duplicate
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>

            <Button
              onClick={handleDelete}
              disabled={deleteBoardMutation.isPending}
              variant="destructive"
            >
              {deleteBoardMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Board
            </Button>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}