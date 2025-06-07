import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, FolderOpen, Trash2, Eye, Lock, Unlock, Calendar, Edit3, Settings } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { VisionBoard } from "./vision-board-types";
import BoardEditor from "./board-editor";

interface SaveLoadManagerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
  currentBoard: VisionBoard;
  onBoardLoaded: (board: VisionBoard) => void;
  onBoardSaved: (boardId: number) => void;
}

export default function SaveLoadManager({
  isOpen,
  onClose,
  mode,
  currentBoard,
  onBoardLoaded,
  onBoardSaved
}: SaveLoadManagerProps) {
  const [saveData, setSaveData] = useState({
    title: currentBoard.title || "My Vision Board",
    description: currentBoard.description || "",
    isPublic: currentBoard.isPublic || false,
    tags: currentBoard.tags?.join(", ") || ""
  });
  const [editingBoard, setEditingBoard] = useState<VisionBoard | null>(null);
  const [showBoardEditor, setShowBoardEditor] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load saved vision boards
  const { data: savedBoards = [], isLoading: loadingBoards } = useQuery({
    queryKey: ['/api/vision-boards'],
    enabled: isOpen && mode === 'load'
  });

  // Save vision board mutation
  const saveBoardMutation = useMutation({
    mutationFn: async (boardData: VisionBoard) => {
      const response = await fetch('/api/vision-boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(boardData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save vision board');
      }

      return response.json();
    },
    onSuccess: (result) => {
      onBoardSaved(result.id);
      queryClient.invalidateQueries({ queryKey: ['/api/vision-boards'] });
      onClose();
      
      toast({
        title: "Vision Board Saved",
        description: `"${saveData.title}" has been saved successfully`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update vision board mutation
  const updateBoardMutation = useMutation({
    mutationFn: async ({ id, boardData }: { id: number; boardData: VisionBoard }) => {
      const response = await fetch(`/api/vision-boards/${id}`, {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vision-boards'] });
      onClose();
      
      toast({
        title: "Vision Board Updated",
        description: `"${saveData.title}" has been updated successfully`
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

  // Delete vision board mutation
  const deleteBoardMutation = useMutation({
    mutationFn: async (boardId: number) => {
      const response = await fetch(`/api/vision-boards/${boardId}`, {
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

  const handleSave = () => {
    const boardToSave: VisionBoard = {
      ...currentBoard,
      title: saveData.title,
      description: saveData.description,
      isPublic: saveData.isPublic,
      tags: saveData.tags.split(",").map(tag => tag.trim()).filter(Boolean)
    };

    if (currentBoard.id) {
      updateBoardMutation.mutate({ id: currentBoard.id, boardData: boardToSave });
    } else {
      saveBoardMutation.mutate(boardToSave);
    }
  };

  const handleLoad = (board: VisionBoard) => {
    onBoardLoaded(board);
    onClose();
    
    toast({
      title: "Vision Board Loaded",
      description: `"${board.title}" has been loaded`
    });
  };

  const handleDelete = (boardId: number) => {
    if (confirm("Are you sure you want to delete this vision board? This action cannot be undone.")) {
      deleteBoardMutation.mutate(boardId);
    }
  };

  const handleEdit = (board: VisionBoard) => {
    setEditingBoard(board);
    setShowBoardEditor(true);
  };

  const handleBoardUpdated = (updatedBoard: VisionBoard) => {
    setShowBoardEditor(false);
    setEditingBoard(null);
    queryClient.invalidateQueries({ queryKey: ['/api/vision-boards'] });
    toast({
      title: "Vision Board Updated",
      description: `"${updatedBoard.title}" has been updated successfully`
    });
  };

  const handleBoardDeleted = () => {
    setShowBoardEditor(false);
    setEditingBoard(null);
    queryClient.invalidateQueries({ queryKey: ['/api/vision-boards'] });
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'save' ? (
              <>
                <Save className="w-5 h-5 text-green-600" />
                Save Vision Board
              </>
            ) : (
              <>
                <FolderOpen className="w-5 h-5 text-blue-600" />
                Load Vision Board
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {mode === 'save' ? (
            // Save mode
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={saveData.title}
                    onChange={(e) => setSaveData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter vision board title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={saveData.tags}
                    onChange={(e) => setSaveData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="wealth, goals, manifestation"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={saveData.description}
                  onChange={(e) => setSaveData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your vision board and its purpose..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Make Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to view and get inspired by your vision board
                  </p>
                </div>
                <Switch
                  checked={saveData.isPublic}
                  onCheckedChange={(checked) => 
                    setSaveData(prev => ({ ...prev, isPublic: checked }))
                  }
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 text-green-900">Board Statistics:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {currentBoard.canvasData.items.length}
                    </div>
                    <div className="text-xs text-green-800">Elements</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {currentBoard.canvasData.items.filter(item => item.type === 'image').length}
                    </div>
                    <div className="text-xs text-green-800">Images</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {currentBoard.canvasData.items.filter(item => item.type === 'text').length}
                    </div>
                    <div className="text-xs text-green-800">Text</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {currentBoard.tags?.length || 0}
                    </div>
                    <div className="text-xs text-green-800">Tags</div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSave}
                disabled={saveBoardMutation.isPending || updateBoardMutation.isPending || !saveData.title.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {(saveBoardMutation.isPending || updateBoardMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {currentBoard.id ? 'Update' : 'Save'} Vision Board
              </Button>
            </div>
          ) : (
            // Load mode
            <div className="space-y-4">
              {loadingBoards ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : savedBoards.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No Saved Vision Boards</h3>
                  <p className="text-muted-foreground">
                    Create and save your first vision board to see it here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedBoards.map((board: any) => (
                    <Card key={board.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {board.isPublic ? (
                                <Unlock className="w-4 h-4 text-green-600" />
                              ) : (
                                <Lock className="w-4 h-4 text-gray-600" />
                              )}
                              {board.title}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {board.description || "No description"}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Board preview */}
                          <div 
                            className="w-full h-24 border rounded-lg relative overflow-hidden cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: board.canvasData?.backgroundColor || '#ffffff' }}
                            onClick={() => handleLoad(board)}
                          >
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                              {board.canvasData?.items?.length || 0} elements
                            </div>
                          </div>

                          {/* Tags */}
                          {board.tags && board.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {board.tags.slice(0, 3).map((tag: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {board.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{board.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {formatDate(board.updatedAt || board.createdAt)}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleLoad(board)}
                              size="sm"
                              className="flex-1"
                            >
                              <Eye className="w-3 h-3 mr-2" />
                              Load
                            </Button>
                            <Button
                              onClick={() => handleEdit(board)}
                              size="sm"
                              variant="outline"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(board.id)}
                              size="sm"
                              variant="outline"
                              disabled={deleteBoardMutation.isPending}
                            >
                              {deleteBoardMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Board Editor Modal */}
      {editingBoard && (
        <BoardEditor
          isOpen={showBoardEditor}
          onClose={() => setShowBoardEditor(false)}
          board={editingBoard}
          onBoardUpdated={handleBoardUpdated}
          onBoardDeleted={handleBoardDeleted}
        />
      )}
    </Dialog>
  );
}