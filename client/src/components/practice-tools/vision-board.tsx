import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download, Trash2, Plus, Type, Image as ImageIcon, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import VisionBoardCanvas from "@/components/vision-board/vision-board-canvas";

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

interface VisionBoardProps {
  onSave?: (items: VisionBoardItem[]) => void;
  initialItems?: VisionBoardItem[];
  onClose?: () => void;
  boardId?: string;
}

export default function VisionBoard({ onSave, initialItems = [], onClose, boardId }: VisionBoardProps) {
  const [items, setItems] = useState<VisionBoardItem[]>(initialItems);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [boardTitle, setBoardTitle] = useState("");
  const [boardDescription, setBoardDescription] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing vision boards
  const { data: visionBoards, isLoading: boardsLoading } = useQuery({
    queryKey: ['/api/vision-boards'],
    enabled: !boardId
  });

  // Fetch specific board if boardId provided
  const { data: currentBoard, isLoading: currentBoardLoading } = useQuery({
    queryKey: ['/api/vision-boards', boardId],
    enabled: !!boardId
  });

  // Save vision board mutation
  const saveVisionBoardMutation = useMutation({
    mutationFn: async (boardData: any) => {
      const response = await fetch('/api/vision-boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boardData)
      });
      if (!response.ok) throw new Error('Failed to save vision board');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Vision board saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/vision-boards'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to save vision board", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update vision board mutation
  const updateVisionBoardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await fetch(`/api/vision-boards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update vision board');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Vision board updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/vision-boards'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update vision board", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Load board data when currentBoard changes
  useEffect(() => {
    if (currentBoard && typeof currentBoard === 'object') {
      setBoardTitle((currentBoard as any)?.title || "");
      setBoardDescription((currentBoard as any)?.description || "");
      const canvasData = (currentBoard as any)?.canvasData;
      if (canvasData && canvasData.elements && Array.isArray(canvasData.elements)) {
        setItems(canvasData.elements);
      }
    }
  }, [currentBoard]);

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
    
    setItems(prev => [...prev, newItem]);
    setNewText("");
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload file to server
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
      
      setItems(prev => [...prev, newItem]);
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
      
      setItems(prev => [...prev, newItem]);
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

  // Save vision board function
  const saveVisionBoard = async () => {
    if (!boardTitle.trim()) {
      toast({ 
        title: "Title required", 
        description: "Please enter a title for your vision board",
        variant: "destructive"
      });
      return;
    }

    const boardData = {
      title: boardTitle,
      description: boardDescription,
      canvasData: {
        elements: items,
        backgroundColor: '#ffffff'
      },
      templateCategory: 'custom',
      tags: [],
      isPublic: false
    };

    if (boardId) {
      updateVisionBoardMutation.mutate({ id: boardId, data: boardData });
    } else {
      saveVisionBoardMutation.mutate(boardData);
    }
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setSelectedItem(null);
  };

  const updateItem = (id: string, updates: Partial<VisionBoardItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

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

  const exportBoard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Note: This is a simplified export. Full implementation would need
    // proper image loading and text rendering
    const link = document.createElement('a');
    link.download = 'vision-board.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const selectedItemData = items.find(item => item.id === selectedItem);

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Vision Board Creator</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Create and arrange your vision board to manifest your dreams
        </p>
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
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="board-description" className="text-sm font-medium">Description (Optional)</Label>
              <Input
                id="board-description"
                placeholder="Describe your vision..."
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              onClick={saveVisionBoard} 
              disabled={saveVisionBoardMutation.isPending || updateVisionBoardMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {(saveVisionBoardMutation.isPending || updateVisionBoardMutation.isPending) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {boardId ? 'Update Board' : 'Save Board'}
            </Button>
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
            
            <Button onClick={exportBoard} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
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
              {items.map((item) => (
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
              
              {items.length === 0 && (
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

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {items.length} items • Click items to select and drag to move
          </div>
          <div className="space-x-2">
            {onSave && (
              <Button onClick={() => onSave(items)} variant="default">
                Save Vision Board
              </Button>
            )}
            {onClose && (
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}