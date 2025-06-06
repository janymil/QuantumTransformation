import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { screenCaptureService, CaptureResult } from "@/services/screen-capture";
import ImageEditor from "@/components/image-editor/image-editor";
import { apiRequest } from "@/lib/queryClient";
import {
  Monitor,
  Camera,
  Upload,
  Type,
  Save,
  Eye,
  Plus,
  Trash2,
  Move,
  RotateCw,
  Copy,
  Settings,
  Download,
  Grid,
  Palette
} from "lucide-react";

interface VisionBoardItem {
  id: string;
  type: 'image' | 'text' | 'shape';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  styling: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    textAlign?: 'left' | 'center' | 'right';
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
  };
}

interface VisionBoard {
  id?: number;
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
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [board, setBoard] = useState<VisionBoard>({
    title: "My Vision Board",
    description: "",
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
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureMode, setCaptureMode] = useState<'screen' | 'webcam' | 'upload'>('screen');
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [newText, setNewText] = useState({ content: '', fontSize: 24, color: '#000000' });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Queries
  const { data: savedBoards } = useQuery({
    queryKey: ['/api/vision-boards'],
    enabled: false // Only load when user wants to see saved boards
  });

  const saveBoardMutation = useMutation({
    mutationFn: async (boardData: VisionBoard) => {
      const response = await fetch('/api/vision-boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(boardData)
      });
      if (!response.ok) {
        throw new Error('Failed to save vision board');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Vision board saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/vision-boards'] });
    },
    onError: () => {
      toast({ title: "Failed to save vision board", variant: "destructive" });
    }
  });

  // Canvas drawing
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const { canvasWidth, canvasHeight, backgroundColor, items } = board.canvasData;

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear and set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Sort items by zIndex
    const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

    // Draw each item
    sortedItems.forEach(item => {
      ctx.save();
      ctx.globalAlpha = item.opacity;

      // Apply transformations
      const centerX = item.x + item.width / 2;
      const centerY = item.y + item.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((item.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      if (item.type === 'image') {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, item.x, item.y, item.width, item.height);
        };
        img.src = item.content;
      } else if (item.type === 'text') {
        const { fontSize = 24, fontFamily = 'Arial', color = '#000000', textAlign = 'left', fontWeight = 'normal', fontStyle = 'normal' } = item.styling;
        
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'top';
        
        // Word wrap for text
        const words = item.content.split(' ');
        const lineHeight = fontSize * 1.2;
        let line = '';
        let y = item.y;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth > item.width && n > 0) {
            ctx.fillText(line, item.x, y);
            line = words[n] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, item.x, y);
      }

      // Draw selection border
      if (selectedItem === item.id) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(item.x, item.y, item.width, item.height);
        ctx.setLineDash([]);
      }

      ctx.restore();
    });
  }, [board.canvasData, selectedItem]);

  // Redraw canvas when board changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Screen capture
  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      let result: CaptureResult;

      switch (captureMode) {
        case 'screen':
          if (!screenCaptureService.isScreenCaptureSupported()) {
            throw new Error('Screen capture not supported in this browser');
          }
          result = await screenCaptureService.captureScreen();
          break;
        case 'webcam':
          if (!screenCaptureService.isWebcamSupported()) {
            throw new Error('Webcam not supported in this browser');
          }
          result = await screenCaptureService.captureWebcam();
          break;
        case 'upload':
          fileInputRef.current?.click();
          return;
        default:
          throw new Error('Invalid capture mode');
      }

      // Open image editor
      setEditingImage(result.dataUrl);
    } catch (error) {
      toast({
        title: "Capture failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    try {
      const result = await screenCaptureService.processUpload(file);
      setEditingImage(result.dataUrl);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleImageEdit = (editedImageUrl: string) => {
    // Add image to board
    const newItem: VisionBoardItem = {
      id: Date.now().toString(),
      type: 'image',
      content: editedImageUrl,
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      rotation: 0,
      opacity: 1,
      zIndex: board.canvasData.items.length,
      styling: {}
    };

    setBoard(prev => ({
      ...prev,
      canvasData: {
        ...prev.canvasData,
        items: [...prev.canvasData.items, newItem]
      }
    }));

    setEditingImage(null);
    toast({ title: "Image added to vision board!" });
  };

  const handleAddText = () => {
    if (!newText.content.trim()) return;

    const textItem: VisionBoardItem = {
      id: Date.now().toString(),
      type: 'text',
      content: newText.content,
      x: 100,
      y: 100,
      width: 300,
      height: 100,
      rotation: 0,
      opacity: 1,
      zIndex: board.canvasData.items.length,
      styling: {
        fontSize: newText.fontSize,
        color: newText.color,
        fontFamily: 'Arial',
        textAlign: 'left',
        fontWeight: 'normal',
        fontStyle: 'normal'
      }
    };

    setBoard(prev => ({
      ...prev,
      canvasData: {
        ...prev.canvasData,
        items: [...prev.canvasData.items, textItem]
      }
    }));

    setNewText({ content: '', fontSize: 24, color: '#000000' });
    setShowTextDialog(false);
    toast({ title: "Text added to vision board!" });
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked item (from top to bottom)
    const sortedItems = [...board.canvasData.items].sort((a, b) => b.zIndex - a.zIndex);
    const clickedItem = sortedItems.find(item => 
      x >= item.x && x <= item.x + item.width &&
      y >= item.y && y <= item.y + item.height
    );

    if (clickedItem) {
      setSelectedItem(clickedItem.id);
      setDraggedItem(clickedItem.id);
      setDragStart({ x: x - clickedItem.x, y: y - clickedItem.y });
      setIsDragging(true);
    } else {
      setSelectedItem(null);
    }
  };

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedItem || !isDragging) return;
    
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newX = Math.max(0, x - dragStart.x);
    const newY = Math.max(0, y - dragStart.y);

    setBoard(prev => ({
      ...prev,
      canvasData: {
        ...prev.canvasData,
        items: prev.canvasData.items.map(item =>
          item.id === draggedItem ? { ...item, x: newX, y: newY } : item
        )
      }
    }));
  }, [draggedItem, isDragging, dragStart]);

  const handleMouseUp = () => {
    setDraggedItem(null);
    setIsDragging(false);
  };

  const deleteSelectedItem = () => {
    if (!selectedItem) return;

    setBoard(prev => ({
      ...prev,
      canvasData: {
        ...prev.canvasData,
        items: prev.canvasData.items.filter(item => item.id !== selectedItem)
      }
    }));

    setSelectedItem(null);
    toast({ title: "Item deleted" });
  };

  const downloadBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${board.title}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const saveBoard = () => {
    saveBoardMutation.mutate(board);
  };

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <Input
              value={board.title}
              onChange={(e) => setBoard(prev => ({ ...prev, title: e.target.value }))}
              className="text-xl font-bold border-none p-0 h-auto"
              placeholder="Vision Board Title"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Create your financial abundance vision board
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadBoard} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            <Button onClick={saveBoard} size="sm" disabled={saveBoardMutation.isPending}>
              <Save className="w-4 h-4 mr-1" />
              {saveBoardMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
          <div className="flex gap-2">
            <Button
              onClick={() => { setCaptureMode('screen'); handleCapture(); }}
              disabled={isCapturing}
              size="sm"
            >
              <Monitor className="w-4 h-4 mr-1" />
              Screen Capture
            </Button>
            <Button
              onClick={() => { setCaptureMode('webcam'); handleCapture(); }}
              disabled={isCapturing}
              variant="outline"
              size="sm"
            >
              <Camera className="w-4 h-4 mr-1" />
              Webcam
            </Button>
            <Button
              onClick={() => { setCaptureMode('upload'); handleCapture(); }}
              variant="outline"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
          </div>

          <div className="w-px bg-border" />

          <Button
            onClick={() => setShowTextDialog(true)}
            variant="outline"
            size="sm"
          >
            <Type className="w-4 h-4 mr-1" />
            Add Text
          </Button>

          {selectedItem && (
            <>
              <div className="w-px bg-border" />
              <Button
                onClick={deleteSelectedItem}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </>
          )}
        </div>

        {/* Canvas */}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="border rounded-lg cursor-pointer max-w-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ maxHeight: '600px' }}
          />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </CardContent>

      {/* Image Editor Dialog */}
      {editingImage && (
        <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
          <DialogContent className="max-w-7xl">
            <DialogHeader>
              <DialogTitle>Edit Image</DialogTitle>
            </DialogHeader>
            <ImageEditor
              imageUrl={editingImage}
              onSave={handleImageEdit}
              onCancel={() => setEditingImage(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Add Text Dialog */}
      <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Text</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Text Content</Label>
              <Textarea
                value={newText.content}
                onChange={(e) => setNewText(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your text..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Font Size</Label>
                <Input
                  type="number"
                  value={newText.fontSize}
                  onChange={(e) => setNewText(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 24 }))}
                  min="8"
                  max="72"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={newText.color}
                  onChange={(e) => setNewText(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowTextDialog(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleAddText}>
                Add Text
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}