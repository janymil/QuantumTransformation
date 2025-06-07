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
import { Save, FolderOpen, Plus, Download, Upload, Trash2, Type, Image as ImageIcon, Loader2 } from "lucide-react";

interface VisionBoardItem {
  id: string;
  type: 'image' | 'text';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
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
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [currentBoardId, setCurrentBoardId] = useState<number | null>(null);

  // Fetch saved boards
  const { data: savedBoards = [], refetch: refetchBoards } = useQuery({
    queryKey: ['/api/vision-boards'],
    enabled: showLoadDialog
  });

  // Add text item functionality
  const addTextItem = () => {
    if (!newText.trim()) return;
    
    const newItem: VisionBoardItem = {
      id: Date.now().toString(),
      type: 'text',
      content: newText,
      x: 50,
      y: 50,
      width: 200,
      height: 50,
      fontSize: 16,
      color: '#000000'
    };
    
    setBoard(prev => ({
      ...prev,
      canvasData: {
        ...prev.canvasData,
        items: [...prev.canvasData.items, newItem]
      }
    }));
    setNewText("");
  };

  // Handle image upload functionality
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      
      const newItem: VisionBoardItem = {
        id: Date.now().toString(),
        type: 'image',
        content: data.url,
        x: 100,
        y: 100,
        width: 150,
        height: 150
      };
      
      setBoard(prev => ({
        ...prev,
        canvasData: {
          ...prev.canvasData,
          items: [...prev.canvasData.items, newItem]
        }
      }));
      toast({ title: "Image uploaded successfully!" });
    } catch (error) {
      toast({ 
        title: "Failed to upload image", 
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Generate AI image function
  const generateAIImage = async (prompt: string) => {
    if (!prompt.trim()) return;
    
    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          size: "1024x1024",
          quality: "standard"
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate image');
      
      const data = await response.json();
      
      const newItem: VisionBoardItem = {
        id: Date.now().toString(),
        type: 'image',
        content: data.imageUrl,
        x: 100,
        y: 100,
        width: 200,
        height: 200
      };
      
      setBoard(prev => ({
        ...prev,
        canvasData: {
          ...prev.canvasData,
          items: [...prev.canvasData.items, newItem]
        }
      }));
      toast({ title: "AI image generated successfully!" });
    } catch (error) {
      toast({ 
        title: "Failed to generate AI image", 
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

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

  // Delete item functionality
  const deleteItem = (id: string) => {
    setBoard(prev => ({
      ...prev,
      canvasData: {
        ...prev.canvasData,
        items: prev.canvasData.items.filter(item => item.id !== id)
      }
    }));
    setSelectedItem(null);
  };

  // Update item functionality
  const updateItem = (id: string, updates: Partial<VisionBoardItem>) => {
    setBoard(prev => ({
      ...prev,
      canvasData: {
        ...prev.canvasData,
        items: prev.canvasData.items.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      }
    }));
  };

  // Mouse interaction handlers
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    setDraggedItem(itemId);
    setSelectedItem(itemId);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedItem) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    updateItem(draggedItem, { x: Math.max(0, x - 75), y: Math.max(0, y - 25) });
  }, [draggedItem]);

  const handleMouseUp = () => {
    setDraggedItem(null);
  };

  // Export board functionality
  const exportBoard = async (format: 'png' | 'jpg' | 'pdf') => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 800;
      canvas.height = 600;
      ctx.fillStyle = board.canvasData.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const link = document.createElement('a');
      link.download = `${board.title || 'vision-board'}.${format}`;
      link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : format}`);
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

  const selectedItemData = board.canvasData.items.find(item => item.id === selectedItem);

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
      
      <CardContent className="space-y-6">
        {/* Board Settings */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="board-title" className="text-sm font-medium">Vision Board Title</Label>
              <Input
                id="board-title"
                placeholder="My Vision Board"
                value={board.title}
                onChange={(e) => setBoard(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="board-description" className="text-sm font-medium">Description (Optional)</Label>
              <Input
                id="board-description"
                placeholder="Describe your vision..."
                value={board.description}
                onChange={(e) => setBoard(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Add text to your vision board..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="w-64"
                onKeyPress={(e) => e.key === 'Enter' && addTextItem()}
              />
              <Button onClick={addTextItem} size="sm">
                <Type className="w-4 h-4 mr-1" />
                Add Text
              </Button>
            </div>
            
            <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline">
              <ImageIcon className="w-4 h-4 mr-1" />
              Upload Image
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* AI Image Generation */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
            <h3 className="text-sm font-semibold mb-2 text-purple-700">AI Image Generator</h3>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Describe the image you want to generate..."
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    generateAIImage((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button 
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  generateAIImage(input.value);
                  input.value = '';
                }}
                disabled={isGeneratingImage}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4 mr-1" />
                )}
                Generate
              </Button>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Create custom images using AI to enhance your vision board
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Canvas */}
          <div className="flex-1">
            <div
              ref={canvasRef}
              className="relative bg-white border-2 border-dashed border-muted-foreground/30 rounded-lg"
              style={{ width: '600px', height: '450px' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {board.canvasData.items.map((item) => (
                <div
                  key={item.id}
                  className={`absolute cursor-move select-none ${
                    selectedItem === item.id ? 'ring-2 ring-primary' : ''
                  }`}
                  style={{
                    left: item.x,
                    top: item.y,
                    width: item.width,
                    height: item.height
                  }}
                  onMouseDown={(e) => handleMouseDown(e, item.id)}
                >
                  {item.type === 'text' ? (
                    <div
                      className="w-full h-full flex items-center justify-center p-2 bg-white/80 rounded border"
                      style={{
                        fontSize: item.fontSize,
                        color: item.color
                      }}
                    >
                      {item.content}
                    </div>
                  ) : (
                    <img
                      src={item.content}
                      alt="Vision board item"
                      className="w-full h-full object-cover rounded border"
                      draggable={false}
                    />
                  )}
                </div>
              ))}
              
              {board.canvasData.items.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Start adding images and text to create your vision board</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Properties Panel */}
          {selectedItemData && (
            <div className="w-64 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Item Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedItemData.type === 'text' && (
                    <>
                      <div>
                        <Label htmlFor="text-content" className="text-xs">Text</Label>
                        <Textarea
                          id="text-content"
                          value={selectedItemData.content}
                          onChange={(e) => updateItem(selectedItemData.id, { content: e.target.value })}
                          className="text-xs"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="font-size" className="text-xs">Font Size</Label>
                        <Input
                          id="font-size"
                          type="number"
                          value={selectedItemData.fontSize}
                          onChange={(e) => updateItem(selectedItemData.id, { fontSize: parseInt(e.target.value) })}
                          className="text-xs"
                          min="8"
                          max="72"
                        />
                      </div>
                      <div>
                        <Label htmlFor="text-color" className="text-xs">Color</Label>
                        <Input
                          id="text-color"
                          type="color"
                          value={selectedItemData.color}
                          onChange={(e) => updateItem(selectedItemData.id, { color: e.target.value })}
                          className="h-8"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="width" className="text-xs">Width</Label>
                      <Input
                        id="width"
                        type="number"
                        value={selectedItemData.width}
                        onChange={(e) => updateItem(selectedItemData.id, { width: parseInt(e.target.value) })}
                        className="text-xs"
                        min="50"
                        max="400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-xs">Height</Label>
                      <Input
                        id="height"
                        type="number"
                        value={selectedItemData.height}
                        onChange={(e) => updateItem(selectedItemData.id, { height: parseInt(e.target.value) })}
                        className="text-xs"
                        min="30"
                        max="300"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => deleteItem(selectedItemData.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="text-sm text-muted-foreground">
          {board.canvasData.items.length} items • Click items to select and drag to move
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