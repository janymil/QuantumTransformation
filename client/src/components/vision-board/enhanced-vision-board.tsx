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
import { ImageCompressor, ExternalHostingUploader } from "@/lib/image-compression";
import { getActiveHostingConfig } from "@/lib/hosting-config";
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
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Queries
  const { data: savedBoards } = useQuery({
    queryKey: ['/api/vision-boards'],
    enabled: false // Only load when user wants to see saved boards
  });

  const saveBoardMutation = useMutation({
    mutationFn: async (boardData: VisionBoard) => {
      const hostingConfig = getActiveHostingConfig();
      
      // Compress all images before saving
      const compressedItems = await ImageCompressor.compressVisionBoardImages(
        boardData.canvasData.items
      );
      
      // Upload images to BunnyCDN and replace with URLs
      const uploadedItems = await Promise.all(
        compressedItems.map(async (item) => {
          if (item.type === 'image' && item.content.startsWith('data:') && hostingConfig.provider === 'bunnycdn') {
            try {
              const filename = `visionboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
              const imageUrl = await ExternalHostingUploader.uploadToBunnyCDN(
                item.content,
                filename,
                hostingConfig.config
              );
              
              return { ...item, content: imageUrl };
            } catch (error) {
              console.warn('Upload failed, keeping local:', error);
              return item;
            }
          }
          return item;
        })
      );

      const finalBoard = {
        ...boardData,
        canvasData: {
          ...boardData.canvasData,
          items: uploadedItems
        }
      };

      // Calculate total size for reporting
      const totalSize = compressedItems
        .filter(item => item.type === 'image' && item.content.startsWith('data:'))
        .reduce((sum, item) => sum + ImageCompressor.getImageSizeKB(item.content), 0);

      console.log(`Vision board total size: ${totalSize.toFixed(1)}KB uploaded to BunnyCDN`);

      // Save metadata to localStorage (URLs instead of base64)
      const savedBoards = JSON.parse(localStorage.getItem('visionBoards') || '[]');
      const newBoard = { 
        ...finalBoard, 
        id: Date.now(),
        createdAt: new Date().toISOString(),
        totalSizeKB: totalSize,
        hostingProvider: hostingConfig.provider
      };
      savedBoards.push(newBoard);
      localStorage.setItem('visionBoards', JSON.stringify(savedBoards));

      return newBoard;
    },
    onSuccess: (data) => {
      toast({ 
        title: "Vision board saved to BunnyCDN!", 
        description: `${data.totalSizeKB.toFixed(1)}KB uploaded successfully`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vision-boards'] });
    },
    onError: (error) => {
      console.error('Save error:', error);
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
        
        // Add background for text for better visibility and dragging
        if (selectedItem === item.id || draggedItem === item.id) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
          ctx.fillRect(item.x, item.y, item.width, item.height);
        }
        
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'top';
        
        // Handle multi-line text (split by \n)
        const lines = item.content.split('\n');
        const lineHeight = fontSize * 1.2;
        
        lines.forEach((line, index) => {
          const y = item.y + (index * lineHeight) + 5; // Add padding
          
          // Word wrap for long lines
          const words = line.split(' ');
          let currentLine = '';
          let currentY = y;

          for (let n = 0; n < words.length; n++) {
            const testLine = currentLine + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > (item.width - 10) && n > 0) {
              ctx.fillText(currentLine, item.x + 5, currentY);
              currentLine = words[n] + ' ';
              currentY += lineHeight;
            } else {
              currentLine = testLine;
            }
          }
          ctx.fillText(currentLine, item.x + 5, currentY);
        });
      }

      // Draw selection border and resize handles
      if (selectedItem === item.id) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(item.x, item.y, item.width, item.height);
        ctx.setLineDash([]);
        
        // Draw resize handles for images
        if (item.type === 'image') {
          const handleSize = 12;
          ctx.fillStyle = '#3b82f6';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          
          // Corner handles
          const handles = [
            { x: item.x - handleSize/2, y: item.y - handleSize/2, cursor: 'nw-resize' }, // top-left
            { x: item.x + item.width - handleSize/2, y: item.y - handleSize/2, cursor: 'ne-resize' }, // top-right
            { x: item.x - handleSize/2, y: item.y + item.height - handleSize/2, cursor: 'sw-resize' }, // bottom-left
            { x: item.x + item.width - handleSize/2, y: item.y + item.height - handleSize/2, cursor: 'se-resize' } // bottom-right
          ];
          
          handles.forEach(handle => {
            ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
            ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
          });
        }
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

  const handleImageEdit = async (editedImageUrl: string) => {
    try {
      // Compress image before adding to board
      const compressedImage = await ImageCompressor.compressImage(editedImageUrl, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.75,
        format: 'jpeg'
      });

      const originalSize = ImageCompressor.getImageSizeKB(editedImageUrl);
      const compressedSize = ImageCompressor.getImageSizeKB(compressedImage);
      
      console.log(`Image compressed: ${originalSize.toFixed(1)}KB → ${compressedSize.toFixed(1)}KB`);

      // Add compressed image to board
      const newItem: VisionBoardItem = {
        id: Date.now().toString(),
        type: 'image',
        content: compressedImage,
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
      toast({ 
        title: "Image added to vision board!", 
        description: `Compressed from ${originalSize.toFixed(1)}KB to ${compressedSize.toFixed(1)}KB`
      });
    } catch (error) {
      console.error('Image compression failed:', error);
      toast({ title: "Failed to add image", variant: "destructive" });
    }
  };

  const calculateTextDimensions = (text: string, fontSize: number, fontFamily: string = 'Arial'): { width: number; height: number } => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = `${fontSize}px ${fontFamily}`;
    
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const height = lines.length * lineHeight;
    
    return {
      width: Math.max(maxWidth + 20, 100), // Add padding
      height: Math.max(height + 10, 30)
    };
  };

  const handleAddText = () => {
    if (!newText.content.trim()) return;

    const dimensions = calculateTextDimensions(newText.content, newText.fontSize);
    
    const textItem: VisionBoardItem = {
      id: Date.now().toString(),
      type: 'text',
      content: newText.content,
      x: 100,
      y: 100,
      width: dimensions.width,
      height: dimensions.height,
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
    
    // Account for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Find clicked item (from top to bottom)
    const sortedItems = [...board.canvasData.items].sort((a, b) => b.zIndex - a.zIndex);
    const clickedItem = sortedItems.find(item => 
      x >= item.x && x <= item.x + item.width &&
      y >= item.y && y <= item.y + item.height
    );

    if (clickedItem) {
      setSelectedItem(clickedItem.id);
      
      // Check if clicking on resize handle for images
      if (clickedItem.type === 'image') {
        const handleSize = 12; // Increased handle size for easier clicking
        const handles = [
          { id: 'nw', x: clickedItem.x - handleSize/2, y: clickedItem.y - handleSize/2, cursor: 'nw-resize' },
          { id: 'ne', x: clickedItem.x + clickedItem.width - handleSize/2, y: clickedItem.y - handleSize/2, cursor: 'ne-resize' },
          { id: 'sw', x: clickedItem.x - handleSize/2, y: clickedItem.y + clickedItem.height - handleSize/2, cursor: 'sw-resize' },
          { id: 'se', x: clickedItem.x + clickedItem.width - handleSize/2, y: clickedItem.y + clickedItem.height - handleSize/2, cursor: 'se-resize' }
        ];
        
        const clickedHandle = handles.find(handle => 
          x >= handle.x && x <= handle.x + handleSize &&
          y >= handle.y && y <= handle.y + handleSize
        );
        
        if (clickedHandle) {
          event.preventDefault();
          event.stopPropagation();
          setIsResizing(true);
          setResizeHandle(clickedHandle.id);
          setResizeStart({ 
            x: clickedItem.x, 
            y: clickedItem.y, 
            width: clickedItem.width, 
            height: clickedItem.height 
          });
          canvas.style.cursor = clickedHandle.cursor;
          console.log('Starting resize with handle:', clickedHandle.id);
          return;
        }
      }
      
      // Regular dragging
      setDraggedItem(clickedItem.id);
      setDragStart({ x: x - clickedItem.x, y: y - clickedItem.y });
      setIsDragging(true);
      canvas.style.cursor = 'grabbing';
    } else {
      setSelectedItem(null);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    
    // Account for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    if (isResizing && selectedItem) {
      // Handle resizing
      handleResize(event);
    } else if (isDragging && draggedItem) {
      // Handle dragging
      handleMouseMove(event);
    } else {
      // Check if hovering over resize handles or items
      const selectedItemData = board.canvasData.items.find(item => item.id === selectedItem);
      
      if (selectedItemData?.type === 'image') {
        const handleSize = 12;
        const handles = [
          { id: 'nw', x: selectedItemData.x - handleSize/2, y: selectedItemData.y - handleSize/2, cursor: 'nw-resize' },
          { id: 'ne', x: selectedItemData.x + selectedItemData.width - handleSize/2, y: selectedItemData.y - handleSize/2, cursor: 'ne-resize' },
          { id: 'sw', x: selectedItemData.x - handleSize/2, y: selectedItemData.y + selectedItemData.height - handleSize/2, cursor: 'sw-resize' },
          { id: 'se', x: selectedItemData.x + selectedItemData.width - handleSize/2, y: selectedItemData.y + selectedItemData.height - handleSize/2, cursor: 'se-resize' }
        ];
        
        const hoveredHandle = handles.find(handle => 
          x >= handle.x && x <= handle.x + handleSize &&
          y >= handle.y && y <= handle.y + handleSize
        );
        
        if (hoveredHandle) {
          canvas.style.cursor = hoveredHandle.cursor;
          return;
        }
      }
      
      // Check if hovering over an item
      const sortedItems = [...board.canvasData.items].sort((a, b) => b.zIndex - a.zIndex);
      const hoveredItem = sortedItems.find(item => 
        x >= item.x && x <= item.x + item.width &&
        y >= item.y && y <= item.y + item.height
      );

      // Change cursor based on hover state
      canvas.style.cursor = hoveredItem ? 'grab' : 'default';
    }
  };

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedItem || !isDragging) return;
    
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    
    // Account for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

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

  const handleResize = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isResizing || !selectedItem || !resizeHandle || !resizeStart) return;
    
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    console.log('Resizing:', { handle: resizeHandle, x, y, resizeStart });

    setBoard(prev => ({
      ...prev,
      canvasData: {
        ...prev.canvasData,
        items: prev.canvasData.items.map(item => {
          if (item.id !== selectedItem) return item;
          
          let newX = resizeStart.x;
          let newY = resizeStart.y;
          let newWidth = resizeStart.width;
          let newHeight = resizeStart.height;
          
          const aspectRatio = resizeStart.width / resizeStart.height;
          
          switch (resizeHandle) {
            case 'nw':
              const deltaX_nw = x - resizeStart.x;
              const deltaY_nw = y - resizeStart.y;
              newWidth = Math.max(50, resizeStart.width - deltaX_nw);
              newHeight = newWidth / aspectRatio;
              newX = resizeStart.x + resizeStart.width - newWidth;
              newY = resizeStart.y + resizeStart.height - newHeight;
              break;
            case 'ne':
              const deltaX_ne = x - (resizeStart.x + resizeStart.width);
              newWidth = Math.max(50, resizeStart.width + deltaX_ne);
              newHeight = newWidth / aspectRatio;
              newX = resizeStart.x;
              newY = resizeStart.y + resizeStart.height - newHeight;
              break;
            case 'sw':
              const deltaX_sw = x - resizeStart.x;
              newWidth = Math.max(50, resizeStart.width - deltaX_sw);
              newHeight = newWidth / aspectRatio;
              newX = resizeStart.x + resizeStart.width - newWidth;
              newY = resizeStart.y;
              break;
            case 'se':
              const deltaX_se = x - (resizeStart.x + resizeStart.width);
              newWidth = Math.max(50, resizeStart.width + deltaX_se);
              newHeight = newWidth / aspectRatio;
              newX = resizeStart.x;
              newY = resizeStart.y;
              break;
          }
          
          return {
            ...item,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
          };
        })
      }
    }));
  }, [isResizing, selectedItem, resizeHandle, resizeStart]);

  const handleMouseUp = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
    setDraggedItem(null);
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
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
              onClick={() => fileInputRef.current?.click()}
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
            className="border rounded-lg max-w-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleCanvasMouseMove}
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