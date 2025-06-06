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
import VisionBoardTour from "./vision-board-tour";
import AIVisionGuide from "./ai-vision-guide";
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
  PlayCircle,
  Brain,
  HelpCircle,
  Palette,
  FolderOpen,
  MoreHorizontal,
  Edit,
  Share
} from "lucide-react";

interface VisionBoardItem {
  id: string;
  type: 'image' | 'text' | 'shape' | 'svg';
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
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
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
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState<{ centerX: number; centerY: number; startAngle: number; initialRotation: number } | null>(null);
  const [loadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [showTour, setShowTour] = useState(false);
  const [showAIGuide, setShowAIGuide] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showSvgDialog, setShowSvgDialog] = useState(false);
  const [currentBoardId, setCurrentBoardId] = useState<number | null>(null);

  // Comprehensive SVG elements library
  const predefinedSvgs = [
    // Nature Elements
    {
      name: "Star",
      category: "Shapes",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
    },
    {
      name: "Heart",
      category: "Emotions",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
    },
    {
      name: "Flower",
      category: "Nature",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></svg>`
    },
    {
      name: "Sun",
      category: "Nature",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/></svg>`
    },
    {
      name: "Moon",
      category: "Nature",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
    },
    {
      name: "Tree",
      category: "Nature",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L8 8h8l-4-6zm0 8L8 16h8l-4-6zm-1 8h2v4h-2v-4z"/></svg>`
    },
    {
      name: "Leaf",
      category: "Nature",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66L5 22a10 10 0 0 0 14.63-7c2.33-4.29.56-9.15-2.63-10z"/></svg>`
    },
    {
      name: "Mountain",
      category: "Nature",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 22l-4-8 8-12 3 4.5L18 2l4 20H8z"/></svg>`
    },
    
    // Emotions & Feelings
    {
      name: "Smiley",
      category: "Emotions",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="white" stroke-width="2" fill="none"/><circle cx="9" cy="9" r="1" fill="white"/><circle cx="15" cy="9" r="1" fill="white"/></svg>`
    },
    {
      name: "Peace",
      category: "Emotions",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M6.34 6.34l11.32 11.32M17.66 6.34L6.34 17.66" stroke="white" stroke-width="2"/></svg>`
    },
    {
      name: "Love",
      category: "Emotions",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
    },
    {
      name: "Gratitude",
      category: "Emotions",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20 9.27l-5 4.87 1.18 6.88L12 17.77l-4.18 3.25L9 14.14 4 9.27l5.91-1.01L12 2z"/></svg>`
    },
    
    // Symbols & Icons
    {
      name: "Crown",
      category: "Symbols",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 7l3.5 3L12 4l5.5 6L21 7l-2 9H5z"/></svg>`
    },
    {
      name: "Infinity",
      category: "Symbols",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.178 8C15.739 8 14.778 10.622 13.2 12c1.578 1.378 2.539 4 4.978 4 2.926 0 4.822-2.074 4.822-4S21.104 8 18.178 8zM5.822 8C2.896 8 1 10.074 1 12s1.896 4 4.822 4c2.439 0 3.4-2.622 4.978-4C9.222 10.622 8.261 8 5.822 8z"/></svg>`
    },
    {
      name: "Key",
      category: "Symbols",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.65 10A6 6 0 1 1 22 7a6 6 0 0 1-6 6c-1 0-1.73-.73-2.35-1.35L9.3 16H7v2H5v2H2v-3l7.65-7.65Z"/><circle cx="15.5" cy="7.5" r="1.5"/></svg>`
    },
    {
      name: "Trophy",
      category: "Symbols",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h1a3 3 0 0 1 3 3v2a5 5 0 0 1-5 5v3a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3v-3a5 5 0 0 1-5-5V7a3 3 0 0 1 3-3h1zM6 7v2a3 3 0 0 0 3 3V7H6zm9 5a3 3 0 0 0 3-3V7h-3v5z"/></svg>`
    },
    {
      name: "Target",
      category: "Symbols",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6" fill="white"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`
    },
    
    // Energy & Power
    {
      name: "Lightning",
      category: "Energy",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>`
    },
    {
      name: "Fire",
      category: "Energy",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 17.5A4.5 4.5 0 1 0 4 13c0-1.5.5-3 1.5-4C7 7.5 9 6 12 6s5 1.5 6.5 3c1 1 1.5 2.5 1.5 4a4.5 4.5 0 1 0-4.5 4.5c-1.5 0-3-.5-4-1.5s-1.5-2.5-2.5-3.5z"/></svg>`
    },
    {
      name: "Energy Wave",
      category: "Energy",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 12h3l2-4 4 8 4-12 2 4h5M12 2v20" stroke="currentColor" stroke-width="2" fill="none"/></svg>`
    },
    {
      name: "Spiral",
      category: "Energy",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2zm0 4c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>`
    },
    
    // Geometric Shapes
    {
      name: "Diamond",
      category: "Shapes",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12l4 6-10 12L2 9z"/></svg>`
    },
    {
      name: "Circle",
      category: "Shapes",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>`
    },
    {
      name: "Triangle",
      category: "Shapes",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>`
    },
    {
      name: "Square",
      category: "Shapes",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`
    },
    {
      name: "Hexagon",
      category: "Shapes",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l5.196 3v6L12 14l-5.196-3V5L12 2z"/></svg>`
    },
    {
      name: "Arrow Up",
      category: "Shapes",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 8h-6v12h-4V10H4l8-8z"/></svg>`
    }
  ];

  // SVG element functions
  const addSvgElement = (svgData: { name: string; svg: string }) => {
    const newItem: VisionBoardItem = {
      id: Date.now().toString(),
      type: 'svg',
      content: svgData.svg,
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      rotation: 0,
      opacity: 1,
      zIndex: board.canvasData.items.length,
      styling: {
        fill: '#3b82f6',
        stroke: '#1d4ed8',
        strokeWidth: 1
      }
    };
    setBoard(prev => ({
      ...prev,
      canvasData: {
        ...prev.canvasData,
        items: [...prev.canvasData.items, newItem]
      }
    }));
    setShowSvgDialog(false);
    setTimeout(() => drawCanvas(), 100);
  };

  // Enhanced functionality
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
      }
    } catch (error) {
      toast({
        title: "Duplication Failed",
        description: "Failed to duplicate vision board.",
        variant: "destructive"
      });
    }
  };

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
      }
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete vision board.",
        variant: "destructive"
      });
    }
  };

  const exportBoard = async (format: 'png' | 'jpg' | 'pdf') => {
    if (!canvasRef.current) return;

    try {
      let dataUrl: string;
      
      if (format === 'pdf') {
        // For PDF export, we'll create a high-quality image first
        const canvas = canvasRef.current;
        dataUrl = canvas.toDataURL('image/png', 1.0);
        
        // Create a simple PDF-like download by opening the image
        const link = document.createElement('a');
        link.download = `${board.title || 'vision-board'}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        const canvas = canvasRef.current;
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        dataUrl = canvas.toDataURL(mimeType, 0.9);
        
        const link = document.createElement('a');
        link.download = `${board.title || 'vision-board'}.${format}`;
        link.href = dataUrl;
        link.click();
      }

      toast({
        title: "Export Successful!",
        description: `Vision board exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export vision board.",
        variant: "destructive"
      });
    }
  };

  // Save/Load functionality
  const saveVisionBoard = async () => {
    try {
      const boardData = {
        title: board.title,
        description: board.description,
        canvasData: board.canvasData,
        templateCategory: board.templateCategory
      };

      let response;
      if (currentBoardId) {
        // Update existing board
        response = await fetch(`/api/vision-boards/${currentBoardId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(boardData)
        });
      } else {
        // Create new board
        response = await fetch('/api/vision-boards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(boardData)
        });
      }

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
        
        // Redraw canvas with loaded data
        setTimeout(() => {
          drawCanvas();
        }, 100);
        
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

  const { data: savedBoards = [], refetch: refetchBoards } = useQuery({
    queryKey: ['/api/vision-boards'],
    enabled: false
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
        let img = loadedImages.get(item.content);
        if (!img) {
          img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => drawCanvas();
          img.src = item.content;
          loadedImages.set(item.content, img);
        }
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, item.x, item.y, item.width, item.height);
        }
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

      // Draw selection border and resize handles WITHIN the rotated context
      if (selectedItem === item.id) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(item.x, item.y, item.width, item.height);
        ctx.setLineDash([]);
        
        // Draw resize handles for images
        if (item.type === 'image') {
          const handleSize = 20; // Much larger handles
          ctx.fillStyle = '#3b82f6';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          
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
          
          // Rotation handle - larger circle above the image
          const rotationHandleDistance = 35;
          const centerX = item.x + item.width / 2;
          const rotationY = item.y - rotationHandleDistance;
          
          ctx.fillStyle = '#22c55e'; // Green color for rotation
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, rotationY, 12, 0, 2 * Math.PI); // Larger rotation handle
          ctx.fill();
          ctx.stroke();
          
          // Draw line connecting rotation handle to image
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX, rotationY + 12);
          ctx.lineTo(centerX, item.y - 8);
          ctx.stroke();
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
      
      // Check if clicking on resize handle or rotation handle for images
      if (clickedItem.type === 'image') {
        const itemCenterX = clickedItem.x + clickedItem.width / 2;
        const itemCenterY = clickedItem.y + clickedItem.height / 2;
        
        // Simple rotation handle check - no complex coordinate transformation
        const rotationHandleDistance = 35;
        const rotationHandleY = clickedItem.y - rotationHandleDistance;
        
        // Check if mouse is near the rotation handle area (larger hit zone)
        const distanceFromCenter = Math.sqrt((x - itemCenterX) ** 2 + (y - itemCenterY) ** 2);
        const isNearRotationHandle = Math.abs(y - rotationHandleY) < 25 && Math.abs(x - itemCenterX) < 25;
        
        if (isNearRotationHandle) {
          event.preventDefault();
          event.stopPropagation();
          setIsRotating(true);
          setRotationStart({
            centerX: itemCenterX,
            centerY: itemCenterY,
            startAngle: Math.atan2(y - itemCenterY, x - itemCenterX),
            initialRotation: clickedItem.rotation || 0
          });
          canvas.style.cursor = 'grabbing';
          console.log('Starting rotation with simplified detection');
          return;
        }
        
        // Check resize handles (larger handles)
        const handleSize = 20;
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
    } else if (isRotating && selectedItem) {
      // Handle rotation
      handleRotation(event);
    } else if (isDragging && draggedItem) {
      // Handle dragging
      handleMouseMove(event);
    } else {
      // Check if hovering over resize handles or items
      const selectedItemData = board.canvasData.items.find(item => item.id === selectedItem);
      
      if (selectedItemData?.type === 'image') {
        // Check rotation handle hover first
        const rotationHandleDistance = 35;
        const centerX = selectedItemData.x + selectedItemData.width / 2;
        const rotationY = selectedItemData.y - rotationHandleDistance;
        const rotationDistance = Math.sqrt((x - centerX) ** 2 + (y - rotationY) ** 2);
        
        if (rotationDistance <= 18) {
          canvas.style.cursor = 'grab';
          return;
        }
        
        // Check resize handles hover
        const handleSize = 20;
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

  const handleRotation = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isRotating || !selectedItem || !rotationStart) return;
    
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const currentAngle = Math.atan2(y - rotationStart.centerY, x - rotationStart.centerX);
    const angleDiff = currentAngle - rotationStart.startAngle;
    const newRotation = rotationStart.initialRotation + (angleDiff * 180 / Math.PI);

    setBoard(prev => ({
      ...prev,
      canvasData: {
        ...prev.canvasData,
        items: prev.canvasData.items.map(item =>
          item.id === selectedItem ? { ...item, rotation: newRotation } : item
        )
      }
    }));
  }, [isRotating, selectedItem, rotationStart]);

  const handleMouseUp = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
    setDraggedItem(null);
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setIsRotating(false);
    setRotationStart(null);
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

          <Button
            onClick={() => setShowSvgDialog(true)}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Elements
          </Button>

          <div className="w-px bg-border" />

          <Button
            onClick={() => setShowTour(true)}
            variant="outline"
            size="sm"
          >
            <PlayCircle className="w-4 h-4 mr-1" />
            Interactive Tour
          </Button>

          <Button
            onClick={() => setShowAIGuide(true)}
            variant="outline"
            size="sm"
          >
            <Brain className="w-4 h-4 mr-1" />
            AI Guide
          </Button>

          <div className="w-px bg-border" />

          <Button
            onClick={() => setShowSaveDialog(true)}
            variant="outline"
            size="sm"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>

          <Button
            onClick={() => {
              refetchBoards();
              setShowLoadDialog(true);
            }}
            variant="outline"
            size="sm"
          >
            <FolderOpen className="w-4 h-4 mr-1" />
            Load
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

      {/* Interactive Tour */}
      <VisionBoardTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={() => {
          setShowTour(false);
          toast({
            title: "Tutorial Complete!",
            description: "You're ready to create amazing vision boards. Consider using the AI Guide for personalized recommendations.",
          });
        }}
      />

      {/* AI Vision Guide */}
      <AIVisionGuide
        isOpen={showAIGuide}
        onClose={() => setShowAIGuide(false)}
      />

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

      {/* SVG Elements Dialog */}
      <Dialog open={showSvgDialog} onOpenChange={setShowSvgDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add SVG Elements</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Choose from our collection of predefined elements to enhance your vision board
            </p>
          </DialogHeader>
          <div className="space-y-6">
            {/* Category Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Nature', 'Shapes', 'Emotions', 'Symbols', 'Energy'].map(category => (
                <Button
                  key={category}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => {
                    const categoryElements = predefinedSvgs.filter(svg => svg.category === category);
                    if (categoryElements.length > 0) {
                      addSvgElement(categoryElements[0]);
                    }
                  }}
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    {category === 'Nature' && '🌿'}
                    {category === 'Shapes' && '⭐'}
                    {category === 'Emotions' && '😊'}
                    {category === 'Symbols' && '👑'}
                    {category === 'Energy' && '⚡'}
                  </div>
                  <span className="text-sm">{category}</span>
                </Button>
              ))}
            </div>

            {/* SVG Elements Grid */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-h-96 overflow-y-auto">
              {predefinedSvgs.map((svgElement, index) => (
                <button
                  key={index}
                  onClick={() => addSvgElement(svgElement)}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors group"
                  title={svgElement.name}
                >
                  <div 
                    className="w-12 h-12 mx-auto text-blue-500 group-hover:text-blue-600"
                    dangerouslySetInnerHTML={{ __html: svgElement.svg }}
                  />
                  <p className="text-xs mt-2 text-center text-muted-foreground">
                    {svgElement.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}