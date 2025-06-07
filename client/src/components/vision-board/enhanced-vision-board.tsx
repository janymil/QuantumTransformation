import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, FolderOpen, Plus, Download } from "lucide-react";

interface VisionBoardItem {
  id: string;
  type: 'image' | 'text' | 'svg';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  fontSize?: number;
  color?: string;
  styling?: any;
}

interface VisionBoard {
  title: string;
  description: string;
  canvasData: {
    items: VisionBoardItem[];
    canvasWidth: number;
    canvasHeight: number;
    backgroundColor: string;
  };
  templateCategory: string;
}

export default function EnhancedVisionBoard() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [board, setBoard] = useState<VisionBoard>({
    title: "My Vision Board",
    description: "A personalized vision board for achieving my goals",
    canvasData: {
      items: [],
      canvasWidth: 1200,
      canvasHeight: 800,
      backgroundColor: "#ffffff"
    },
    templateCategory: "financial"
  });

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [currentBoardId, setCurrentBoardId] = useState<number | null>(null);

  // Fetch saved boards
  const { data: savedBoards = [], refetch: refetchBoards } = useQuery({
    queryKey: ['/api/vision-boards'],
    enabled: showLoadDialog
  });

  // Load board functionality
  const loadVisionBoard = async (boardId: number) => {
    try {
      const response = await fetch(`/api/vision-boards/${boardId}`);
      if (response.ok) {
        const loadedBoard = await response.json();
        setBoard({
          title: loadedBoard.title,
          description: loadedBoard.description,
          canvasData: loadedBoard.canvasData,
          templateCategory: loadedBoard.templateCategory
        });
        setCurrentBoardId(loadedBoard.id);
        setShowLoadDialog(false);
        
        toast({
          title: "Vision Board Loaded!",
          description: `${loadedBoard.title} has been loaded successfully.`,
        });
      } else {
        throw new Error('Failed to load');
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load vision board. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Save board functionality
  const saveVisionBoard = async () => {
    try {
      const boardData = {
        title: board.title,
        description: board.description,
        canvasData: board.canvasData,
        templateCategory: board.templateCategory
      };

      const url = currentBoardId ? `/api/vision-boards/${currentBoardId}` : '/api/vision-boards';
      const method = currentBoardId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boardData)
      });

      if (response.ok) {
        const savedBoard = await response.json();
        setCurrentBoardId(savedBoard.id);
        toast({
          title: "Vision Board Saved!",
          description: `${board.title} has been saved successfully.`,
        });
        setShowSaveDialog(false);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save vision board. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Duplicate board functionality
  const duplicateBoard = async () => {
    try {
      const duplicatedBoard = {
        title: `${board.title} (Copy)`,
        description: board.description,
        canvasData: board.canvasData,
        templateCategory: board.templateCategory
      };

      const response = await fetch('/api/vision-boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedBoard)
      });

      if (response.ok) {
        toast({
          title: "Board Duplicated!",
          description: "A copy of your vision board has been created.",
        });
        refetchBoards();
      }
    } catch (error) {
      toast({
        title: "Duplication Failed",
        description: "Failed to duplicate vision board.",
        variant: "destructive"
      });
    }
  };

  // Delete board functionality
  const deleteBoard = async (boardId: number) => {
    try {
      const response = await fetch(`/api/vision-boards/${boardId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Board Deleted",
          description: "Vision board has been permanently deleted.",
        });
        refetchBoards();
      } else {
        const errorData = await response.json();
        toast({
          title: "Deletion Failed",
          description: errorData.message || "Failed to delete vision board.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete vision board.",
        variant: "destructive"
      });
    }
  };

  // Export board functionality
  const exportBoard = async (format: 'png' | 'jpg' | 'pdf') => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current as HTMLCanvasElement;
      const dataUrl = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : format}`);
      
      const link = document.createElement('a');
      link.download = `${board.title || 'vision-board'}.${format}`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Export Successful",
        description: `Vision board exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export vision board. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Enhanced Vision Board Creator</span>
          <div className="flex gap-2">
            <Button onClick={() => setShowSaveDialog(true)} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={() => setShowLoadDialog(true)} variant="outline">
              <FolderOpen className="w-4 h-4 mr-2" />
              Load
            </Button>
            <Button onClick={() => exportBoard('png')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <canvas
            ref={canvasRef}
            width={board.canvasData.canvasWidth}
            height={board.canvasData.canvasHeight}
            className="border border-gray-300 rounded-lg mx-auto block"
            style={{ backgroundColor: board.canvasData.backgroundColor }}
          />
        </div>
      </CardContent>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Vision Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="save-title">Title</Label>
              <Input
                id="save-title"
                value={board.title}
                onChange={(e) => setBoard(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter board title..."
              />
            </div>
            <div>
              <Label htmlFor="save-description">Description</Label>
              <Textarea
                id="save-description"
                value={board.description}
                onChange={(e) => setBoard(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter board description..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="save-category">Category</Label>
              <Select 
                value={board.templateCategory} 
                onValueChange={(value) => setBoard(prev => ({ ...prev, templateCategory: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="health">Health & Wellness</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="relationships">Relationships</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowSaveDialog(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={saveVisionBoard}>
                {currentBoardId ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Load Vision Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(savedBoards as any[]).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No saved vision boards found.</p>
                <p className="text-sm">Create and save your first vision board to see it here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {(savedBoards as any[]).map((savedBoard: any) => (
                  <div 
                    key={savedBoard.id} 
                    className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => loadVisionBoard(savedBoard.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{savedBoard.title}</h3>
                        {savedBoard.description && (
                          <p className="text-muted-foreground text-sm mt-1">{savedBoard.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                            {savedBoard.templateCategory}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(savedBoard.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-sm text-muted-foreground">
                          {savedBoard.canvasData?.items?.length || 0} items
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadVisionBoard(savedBoard.id)}
                          >
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              loadVisionBoard(savedBoard.id);
                              setTimeout(() => duplicateBoard(), 100);
                            }}
                          >
                            Duplicate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportBoard('png')}
                          >
                            Export
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBoard(savedBoard.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setShowLoadDialog(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}