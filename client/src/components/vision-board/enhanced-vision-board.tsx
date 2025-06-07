import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, FolderOpen, Download, Upload, Trash2, Type, Image as ImageIcon, 
  Loader2, Plus, Move, RotateCw, Copy, Palette, Layers, Settings,
  ZoomIn, ZoomOut, Grid, Eye, EyeOff, Lock, Unlock, Camera,
  Wand2, Sparkles, Target, Heart, Trophy, Home, Plane, Users,
  Play, Pause, Undo, Redo, AlignCenter, AlignLeft, AlignRight,
  Bold, Italic, Underline, PaintBucket, Crop, FlipHorizontal,
  FlipVertical, CornerUpRight, MousePointer, Hand, Square, Lightbulb
} from "lucide-react";

interface VisionBoardItem {
  id: string;
  type: 'image' | 'text' | 'shape' | 'sticker';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  shadow?: boolean;
  locked?: boolean;
  visible?: boolean;
  effects?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
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
    backgroundImage?: string;
    gridVisible?: boolean;
    snapToGrid?: boolean;
  };
  templateCategory: string;
  tags: string[];
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type Tool = 'select' | 'text' | 'image' | 'shape' | 'hand';
type ViewMode = 'normal' | 'preview' | 'presentation';

const CANVAS_PRESETS = [
  { name: "Desktop Wallpaper", width: 1920, height: 1080 },
  { name: "Mobile Wallpaper", width: 1080, height: 1920 },
  { name: "Instagram Post", width: 1080, height: 1080 },
  { name: "Pinterest Pin", width: 735, height: 1102 },
  { name: "Vision Board", width: 1200, height: 800 },
  { name: "Custom", width: 0, height: 0 }
];

const FONT_FAMILIES = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", 
  "Poppins", "Source Sans Pro", "Oswald", "Raleway", "Ubuntu"
];

const GOAL_CATEGORIES = [
  { id: 'financial', name: 'Financial Freedom', icon: Trophy, color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'career', name: 'Career Growth', icon: Target, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'health', name: 'Health & Fitness', icon: Heart, color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'relationships', name: 'Relationships', icon: Users, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'travel', name: 'Travel & Adventure', icon: Plane, color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { id: 'lifestyle', name: 'Lifestyle', icon: Home, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'personal', name: 'Personal Growth', icon: Sparkles, color: 'bg-pink-100 text-pink-800 border-pink-200' }
];

export default function EnhancedVisionBoard() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Core state
  const [board, setBoard] = useState<VisionBoard>({
    title: "My Vision Board",
    description: "Create your dreams and manifest your goals",
    canvasData: {
      items: [],
      canvasWidth: 1200,
      canvasHeight: 800,
      backgroundColor: "#ffffff",
      gridVisible: false,
      snapToGrid: false
    },
    templateCategory: "financial",
    tags: [],
    isPublic: false
  });

  // UI state
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentBoardId, setCurrentBoardId] = useState<number | null>(null);

  // Dialog states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);
  const [showScreenCaptureDialog, setShowScreenCaptureDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Working states
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingBoard, setIsGeneratingBoard] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newText, setNewText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // History for undo/redo
  const [history, setHistory] = useState<VisionBoard[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Fetch saved boards
  const { data: savedBoards = [], refetch: refetchBoards } = useQuery({
    queryKey: ['/api/vision-boards'],
    enabled: showLoadDialog
  });

  // Auto-save functionality
  useEffect(() => {
    if (currentBoardId && board.canvasData.items.length > 0) {
      const timeoutId = setTimeout(() => {
        saveVisionBoard(true); // Auto-save
      }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [board, currentBoardId]);

  // Add to history
  const addToHistory = useCallback((newBoard: VisionBoard) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newBoard)));
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setBoard(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setBoard(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            break;
          case 's':
            e.preventDefault();
            saveVisionBoard();
            break;
          case 'c':
            if (selectedItem) {
              e.preventDefault();
              duplicateItem(selectedItem);
            }
            break;
          case 'Delete':
          case 'Backspace':
            if (selectedItem) {
              e.preventDefault();
              deleteItem(selectedItem);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, undo, redo]);

  // Core functions
  const addTextItem = useCallback(() => {
    if (!newText.trim()) return;
    
    const newItem: VisionBoardItem = {
      id: Date.now().toString(),
      type: 'text',
      content: newText,
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      fontSize: 24,
      fontFamily: "Inter",
      fontWeight: "normal",
      textAlign: "center",
      color: '#000000',
      backgroundColor: 'transparent',
      opacity: 1,
      zIndex: board.canvasData.items.length + 1,
      visible: true,
      locked: false
    };
    
    const newBoard = {
      ...board,
      canvasData: {
        ...board.canvasData,
        items: [...board.canvasData.items, newItem]
      }
    };
    
    setBoard(newBoard);
    addToHistory(newBoard);
    setNewText("");
    setSelectedItem(newItem.id);
    setActiveTool('select');
  }, [newText, board, addToHistory]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        x: 150,
        y: 150,
        width: 200,
        height: 200,
        opacity: 1,
        zIndex: board.canvasData.items.length + 1,
        visible: true,
        locked: false
      };
      
      const newBoard = {
        ...board,
        canvasData: {
          ...board.canvasData,
          items: [...board.canvasData.items, newItem]
        }
      };
      
      setBoard(newBoard);
      addToHistory(newBoard);
      setSelectedItem(newItem.id);
      toast({ title: "Image uploaded successfully!" });
    } catch (error) {
      toast({ 
        title: "Failed to upload image", 
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [board, addToHistory, toast]);

  const generateAIImage = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          size: "1024x1024",
          quality: "standard",
          userTier: "basic"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error(errorData.error || 'Usage limit reached. This feature requires premium access.');
        }
        throw new Error(errorData.error || 'Failed to generate image');
      }
      
      const data = await response.json();
      
      const newItem: VisionBoardItem = {
        id: Date.now().toString(),
        type: 'image',
        content: data.imageUrl,
        x: 200,
        y: 200,
        width: 250,
        height: 250,
        opacity: 1,
        zIndex: board.canvasData.items.length + 1,
        visible: true,
        locked: false
      };
      
      const newBoard = {
        ...board,
        canvasData: {
          ...board.canvasData,
          items: [...board.canvasData.items, newItem]
        }
      };
      
      setBoard(newBoard);
      addToHistory(newBoard);
      setSelectedItem(newItem.id);
      setShowAIDialog(false);
      setAiPrompt("");
      toast({ 
        title: "AI image generated successfully!",
        description: `Remaining requests: ${data.remainingRequests || 'Unknown'}`
      });
    } catch (error: any) {
      toast({ 
        title: "Failed to generate AI image", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  }, [aiPrompt, board, addToHistory, toast]);

  // Generate AI Vision Board based on user data
  const generateAIVisionBoard = useCallback(async () => {
    setIsGeneratingBoard(true);
    try {
      const response = await fetch('/api/ai/generate-vision-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeJournals: true,
          includeAffirmations: true,
          includeChallenges: true,
          includeUserProfile: true,
          userTier: "basic"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error(errorData.error || 'Usage limit reached.');
        }
        if (errorData.error === 'insufficient data') {
          throw new Error('Please add more journal entries, affirmations, or goals for better AI analysis.');
        }
        throw new Error(errorData.error || 'Failed to generate vision board');
      }
      
      const data = await response.json();
      
      if (data.visionBoard && data.visionBoard.elements) {
        const aiItems: VisionBoardItem[] = data.visionBoard.elements.map((element: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          type: element.type === 'image' ? 'image' : 'text',
          content: element.content || element.text || '',
          x: element.position?.x || (index % 3) * 200 + 50,
          y: element.position?.y || Math.floor(index / 3) * 150 + 50,
          width: element.style?.width || (element.type === 'image' ? 200 : 250),
          height: element.style?.height || (element.type === 'image' ? 200 : 60),
          fontSize: element.style?.fontSize || 18,
          fontFamily: element.style?.fontFamily || "Inter",
          fontWeight: element.style?.fontWeight || "normal",
          textAlign: element.style?.textAlign || "center",
          color: element.style?.color || '#000000',
          backgroundColor: element.style?.backgroundColor || 'transparent',
          opacity: 1,
          zIndex: index + 1,
          visible: true,
          locked: false
        }));

        const newBoard = {
          ...board,
          title: data.visionBoard.title || "AI Generated Vision Board",
          description: data.visionBoard.description || "Created by AI based on your goals and aspirations",
          canvasData: {
            ...board.canvasData,
            items: aiItems
          }
        };

        setBoard(newBoard);
        addToHistory(newBoard);
        setShowTemplateDialog(false);
        
        toast({ 
          title: "AI Vision Board Generated!",
          description: `Created ${aiItems.length} elements. Remaining requests: ${data.remainingRequests || 'Unknown'}`
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Failed to generate AI vision board", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingBoard(false);
    }
  }, [board, addToHistory, toast]);

  // Get AI suggestions for current board
  const getAISuggestions = useCallback(async () => {
    if (board.canvasData.items.length === 0) {
      toast({
        title: "No content to analyze",
        description: "Add some elements to your vision board first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const response = await fetch('/api/ai/vision-board-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardData: board.canvasData,
          userGoals: `Financial freedom and ${board.templateCategory} goals`,
          focusArea: board.templateCategory,
          currentContent: board.canvasData.items.map(item => item.content).join(', '),
          userTier: "basic"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get suggestions');
      }
      
      const data = await response.json();
      setAiSuggestions(data.suggestions || []);
      
      toast({ 
        title: "AI Suggestions Generated!",
        description: `Found ${data.suggestions?.length || 0} suggestions to improve your board`
      });
    } catch (error: any) {
      toast({ 
        title: "Failed to get AI suggestions", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [board, toast]);

  // Screen capture functionality
  const captureScreen = useCallback(async () => {
    setIsCapturingScreen(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/png');
          setCapturedImage(dataUrl);
          
          // Stop the stream
          stream.getTracks().forEach(track => track.stop());
          
          setShowScreenCaptureDialog(true);
        });
      } else {
        throw new Error('Screen capture not supported in this browser');
      }
    } catch (error: any) {
      toast({
        title: "Screen Capture Failed",
        description: error.message || "Unable to capture screen. Please try uploading an image instead.",
        variant: "destructive"
      });
    } finally {
      setIsCapturingScreen(false);
    }
  }, [toast]);

  // Add captured image to board
  const addCapturedImage = useCallback(() => {
    if (!capturedImage) return;
    
    const newItem: VisionBoardItem = {
      id: Date.now().toString(),
      type: 'image',
      content: capturedImage,
      x: 150,
      y: 150,
      width: 250,
      height: 200,
      opacity: 1,
      zIndex: board.canvasData.items.length + 1,
      visible: true,
      locked: false
    };
    
    const newBoard = {
      ...board,
      canvasData: {
        ...board.canvasData,
        items: [...board.canvasData.items, newItem]
      }
    };
    
    setBoard(newBoard);
    addToHistory(newBoard);
    setSelectedItem(newItem.id);
    setShowScreenCaptureDialog(false);
    setCapturedImage(null);
    
    toast({ title: "Screen capture added to vision board!" });
  }, [capturedImage, board, addToHistory, toast]);

  const deleteItem = useCallback((id: string) => {
    const newBoard = {
      ...board,
      canvasData: {
        ...board.canvasData,
        items: board.canvasData.items.filter(item => item.id !== id)
      }
    };
    
    setBoard(newBoard);
    addToHistory(newBoard);
    setSelectedItem(null);
  }, [board, addToHistory]);

  const duplicateItem = useCallback((id: string) => {
    const item = board.canvasData.items.find(item => item.id === id);
    if (!item) return;

    const duplicatedItem: VisionBoardItem = {
      ...item,
      id: Date.now().toString(),
      x: item.x + 20,
      y: item.y + 20,
      zIndex: board.canvasData.items.length + 1
    };

    const newBoard = {
      ...board,
      canvasData: {
        ...board.canvasData,
        items: [...board.canvasData.items, duplicatedItem]
      }
    };

    setBoard(newBoard);
    addToHistory(newBoard);
    setSelectedItem(duplicatedItem.id);
  }, [board, addToHistory]);

  const updateItem = useCallback((id: string, updates: Partial<VisionBoardItem>) => {
    const newBoard = {
      ...board,
      canvasData: {
        ...board.canvasData,
        items: board.canvasData.items.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      }
    };
    
    setBoard(newBoard);
  }, [board]);

  const bringToFront = useCallback((id: string) => {
    const maxZ = Math.max(...board.canvasData.items.map(item => item.zIndex || 0));
    updateItem(id, { zIndex: maxZ + 1 });
  }, [board.canvasData.items, updateItem]);

  const sendToBack = useCallback((id: string) => {
    const minZ = Math.min(...board.canvasData.items.map(item => item.zIndex || 0));
    updateItem(id, { zIndex: minZ - 1 });
  }, [board.canvasData.items, updateItem]);

  // Mouse interaction handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, itemId: string) => {
    if (activeTool !== 'select') return;
    
    e.stopPropagation();
    setDraggedItem(itemId);
    setSelectedItem(itemId);
    bringToFront(itemId);
  }, [activeTool, bringToFront]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedItem || activeTool !== 'select') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    updateItem(draggedItem, { 
      x: Math.max(0, x - 100), 
      y: Math.max(0, y - 25) 
    });
  }, [draggedItem, activeTool, zoomLevel, updateItem]);

  const handleMouseUp = useCallback(() => {
    if (draggedItem) {
      addToHistory(board);
      setDraggedItem(null);
    }
  }, [draggedItem, board, addToHistory]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedItem(null);
      setSelectedItems([]);
    }
  }, []);

  // Save/Load functions
  const saveVisionBoard = useCallback(async (isAutoSave = false) => {
    if (!isAutoSave && !board.title.trim()) {
      toast({ 
        title: "Title required", 
        description: "Please enter a title for your vision board",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const boardData = {
        title: board.title,
        description: board.description,
        canvasData: board.canvasData,
        templateCategory: board.templateCategory,
        tags: board.tags,
        isPublic: board.isPublic
      };

      const url = currentBoardId ? `/api/vision-boards/${currentBoardId}` : '/api/vision-boards';
      const method = currentBoardId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boardData)
      });

      if (!response.ok) throw new Error('Failed to save');

      const savedBoard = await response.json();
      setCurrentBoardId(savedBoard.id);
      
      if (!isAutoSave) {
        toast({
          title: "Vision Board Saved!",
          description: `${board.title} has been saved successfully.`,
        });
        setShowSaveDialog(false);
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save vision board. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [board, currentBoardId, toast]);

  const loadVisionBoard = useCallback(async (boardId: number) => {
    try {
      const response = await fetch(`/api/vision-boards/${boardId}`);
      if (!response.ok) throw new Error('Failed to load');
      
      const loadedBoard = await response.json();
      const newBoard: VisionBoard = {
        id: loadedBoard.id,
        title: loadedBoard.title,
        description: loadedBoard.description,
        canvasData: loadedBoard.canvasData,
        templateCategory: loadedBoard.templateCategory,
        tags: loadedBoard.tags || [],
        isPublic: loadedBoard.isPublic || false,
        createdAt: loadedBoard.createdAt,
        updatedAt: loadedBoard.updatedAt
      };
      
      setBoard(newBoard);
      setCurrentBoardId(loadedBoard.id);
      setShowLoadDialog(false);
      setHistory([newBoard]);
      setHistoryIndex(0);
      
      toast({
        title: "Vision Board Loaded!",
        description: `${loadedBoard.title} has been loaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load vision board. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const duplicateBoard = useCallback(async (boardId: number) => {
    try {
      const response = await fetch(`/api/vision-boards/${boardId}`);
      if (!response.ok) throw new Error('Failed to load');
      
      const originalBoard = await response.json();
      const duplicatedBoard = {
        title: `${originalBoard.title} (Copy)`,
        description: originalBoard.description,
        canvasData: originalBoard.canvasData,
        templateCategory: originalBoard.templateCategory,
        tags: originalBoard.tags || [],
        isPublic: false
      };

      const saveResponse = await fetch('/api/vision-boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedBoard)
      });

      if (!saveResponse.ok) throw new Error('Failed to duplicate');

      toast({
        title: "Board Duplicated!",
        description: "A copy of your vision board has been created.",
      });
      refetchBoards();
    } catch (error) {
      toast({
        title: "Duplication Failed",
        description: "Failed to duplicate vision board.",
        variant: "destructive"
      });
    }
  }, [toast, refetchBoards]);

  const deleteBoard = useCallback(async (boardId: number) => {
    try {
      const response = await fetch(`/api/vision-boards/${boardId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete');
      }

      toast({
        title: "Board Deleted",
        description: "Vision board has been permanently deleted.",
      });
      refetchBoards();
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete vision board.",
        variant: "destructive"
      });
    }
  }, [toast, refetchBoards]);

  const exportBoard = useCallback(async (format: 'png' | 'jpg' | 'pdf' | 'svg') => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = 2; // High DPI
      canvas.width = board.canvasData.canvasWidth * scale;
      canvas.height = board.canvasData.canvasHeight * scale;
      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = board.canvasData.backgroundColor;
      ctx.fillRect(0, 0, board.canvasData.canvasWidth, board.canvasData.canvasHeight);

      // Sort items by z-index
      const sortedItems = [...board.canvasData.items]
        .filter(item => item.visible !== false)
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      // Render items
      for (const item of sortedItems) {
        ctx.save();
        ctx.globalAlpha = item.opacity || 1;
        
        if (item.rotation) {
          ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.translate(-item.width / 2, -item.height / 2);
        } else {
          ctx.translate(item.x, item.y);
        }

        if (item.type === 'text') {
          ctx.fillStyle = item.color || '#000000';
          ctx.font = `${item.fontWeight || 'normal'} ${item.fontSize || 16}px ${item.fontFamily || 'Inter'}`;
          ctx.textAlign = (item.textAlign as CanvasTextAlign) || 'center';
          ctx.textBaseline = 'middle';
          
          if (item.backgroundColor && item.backgroundColor !== 'transparent') {
            ctx.fillStyle = item.backgroundColor;
            ctx.fillRect(0, 0, item.width, item.height);
          }
          
          ctx.fillStyle = item.color || '#000000';
          const lines = item.content.split('\n');
          const lineHeight = (item.fontSize || 16) * 1.2;
          const startY = item.height / 2 - ((lines.length - 1) * lineHeight) / 2;
          
          lines.forEach((line, index) => {
            ctx.fillText(line, item.width / 2, startY + index * lineHeight);
          });
        } else if (item.type === 'image') {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0, item.width, item.height);
              resolve(null);
            };
            img.onerror = resolve;
            img.src = item.content;
          });
        }
        
        ctx.restore();
      }

      // Export
      const dataUrl = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : format}`, 0.95);
      const link = document.createElement('a');
      link.download = `${board.title || 'vision-board'}.${format}`;
      link.href = dataUrl;
      link.click();
      
      setShowExportDialog(false);
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
  }, [board, toast]);

  const selectedItemData = board.canvasData.items.find(item => item.id === selectedItem);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-4 space-y-4">
        {/* Top Toolbar */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-6 h-6 text-indigo-600" />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Vision Board Studio
                  </h1>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={undo}
                    disabled={!canUndo}
                    className="h-8 px-2"
                  >
                    <Undo className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={redo}
                    disabled={!canRedo}
                    className="h-8 px-2"
                  >
                    <Redo className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={isSaving}
                  className="h-8"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLoadDialog(true)}
                  className="h-8"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Load
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExportDialog(true)}
                  className="h-8"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-200px)] lg:h-[calc(100vh-200px)]">
          {/* Mobile Tools Bar */}
          <div className="lg:hidden mb-4">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-3">
                <Tabs defaultValue="tools" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-3">
                    <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
                    <TabsTrigger value="elements" className="text-xs">Add</TabsTrigger>
                    <TabsTrigger value="templates" className="text-xs">AI</TabsTrigger>
                  </TabsList>
                  
                  {/* Mobile Tools Content - Horizontal Layout */}
                  <TabsContent value="tools" className="mt-0">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      <Button
                        variant={activeTool === 'select' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTool('select')}
                        className="h-8 text-xs flex-shrink-0"
                      >
                        <MousePointer className="w-3 h-3 mr-1" />
                        Select
                      </Button>
                      <Button
                        variant={activeTool === 'hand' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTool('hand')}
                        className="h-8 text-xs flex-shrink-0"
                      >
                        <Hand className="w-3 h-3 mr-1" />
                        Pan
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        className="h-8 text-xs flex-shrink-0"
                      >
                        <Undo className="w-3 h-3 mr-1" />
                        Undo
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                        className="h-8 text-xs flex-shrink-0"
                      >
                        <Redo className="w-3 h-3 mr-1" />
                        Redo
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="elements" className="mt-0">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      <Button
                        onClick={() => setShowUploadDialog(true)}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs flex-shrink-0"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Upload
                      </Button>
                      <Button
                        onClick={captureScreen}
                        disabled={isCapturingScreen}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs flex-shrink-0"
                      >
                        {isCapturingScreen ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Camera className="w-3 h-3 mr-1" />
                        )}
                        Capture
                      </Button>
                      <Button
                        onClick={() => setShowAIDialog(true)}
                        size="sm"
                        className="h-8 text-xs flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        <Wand2 className="w-3 h-3 mr-1" />
                        AI Image
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="templates" className="mt-0">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      <Button
                        onClick={generateAIVisionBoard}
                        disabled={isGeneratingBoard}
                        size="sm"
                        className="h-8 text-xs flex-shrink-0 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                      >
                        {isGeneratingBoard ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 mr-1" />
                        )}
                        AI Board
                      </Button>
                      <Button
                        onClick={() => {
                          getAISuggestions();
                          setShowSuggestionsDialog(true);
                        }}
                        disabled={isGeneratingSuggestions || board.canvasData.items.length === 0}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs flex-shrink-0"
                      >
                        {isGeneratingSuggestions ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3 mr-1" />
                        )}
                        Suggestions
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Left Sidebar - Tools */}
          <Card className="hidden lg:block lg:col-span-2 shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4 h-full">
              <Tabs defaultValue="tools" className="h-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
                  <TabsTrigger value="elements" className="text-xs">Add</TabsTrigger>
                  <TabsTrigger value="templates" className="text-xs">AI</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tools" className="space-y-3 mt-0">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">SELECTION</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        variant={activeTool === 'select' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTool('select')}
                        className="h-8 text-xs"
                      >
                        <MousePointer className="w-3 h-3 mr-1" />
                        Select
                      </Button>
                      <Button
                        variant={activeTool === 'hand' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTool('hand')}
                        className="h-8 text-xs"
                      >
                        <Hand className="w-3 h-3 mr-1" />
                        Pan
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">VIEW</Label>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Zoom: {zoomLevel}%</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
                          className="h-6 w-6 p-0"
                        >
                          <ZoomOut className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setZoomLevel(Math.min(400, zoomLevel + 25))}
                          className="h-6 w-6 p-0"
                        >
                          <ZoomIn className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <Slider
                      value={[zoomLevel]}
                      onValueChange={([value]) => setZoomLevel(value)}
                      min={25}
                      max={400}
                      step={25}
                      className="w-full"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">CANVAS</Label>
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBoard(prev => ({
                          ...prev,
                          canvasData: {
                            ...prev.canvasData,
                            gridVisible: !prev.canvasData.gridVisible
                          }
                        }))}
                        className="w-full h-7 text-xs justify-start"
                      >
                        <Grid className="w-3 h-3 mr-2" />
                        {board.canvasData.gridVisible ? 'Hide Grid' : 'Show Grid'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBoard(prev => ({
                          ...prev,
                          canvasData: {
                            ...prev.canvasData,
                            snapToGrid: !prev.canvasData.snapToGrid
                          }
                        }))}
                        className="w-full h-7 text-xs justify-start"
                      >
                        <Target className="w-3 h-3 mr-2" />
                        {board.canvasData.snapToGrid ? 'Snap Off' : 'Snap On'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="elements" className="space-y-3 mt-0">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">ADD TEXT</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter text..."
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTextItem()}
                        className="h-8 text-xs"
                      />
                      <Button
                        onClick={addTextItem}
                        size="sm"
                        className="w-full h-7 text-xs"
                        disabled={!newText.trim()}
                      >
                        <Type className="w-3 h-3 mr-2" />
                        Add Text
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">ADD IMAGES</Label>
                    <div className="grid grid-cols-1 gap-1">
                      <Button
                        onClick={() => setShowUploadDialog(true)}
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs justify-start"
                      >
                        <Upload className="w-3 h-3 mr-2" />
                        Upload from Device
                      </Button>
                      <Button
                        onClick={captureScreen}
                        disabled={isCapturingScreen}
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs justify-start"
                      >
                        {isCapturingScreen ? (
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                          <Camera className="w-3 h-3 mr-2" />
                        )}
                        Screen Capture
                      </Button>
                      <Button
                        onClick={() => setShowAIDialog(true)}
                        size="sm"
                        className="w-full h-8 text-xs justify-start bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        <Wand2 className="w-3 h-3 mr-2" />
                        AI Generate
                      </Button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </TabsContent>

                <TabsContent value="templates" className="space-y-3 mt-0">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">AI FEATURES</Label>
                    <div className="space-y-1">
                      <Button
                        onClick={generateAIVisionBoard}
                        disabled={isGeneratingBoard}
                        size="sm"
                        className="w-full h-8 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                      >
                        {isGeneratingBoard ? (
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 mr-2" />
                        )}
                        Generate Board
                      </Button>
                      
                      <Button
                        onClick={() => {
                          getAISuggestions();
                          setShowSuggestionsDialog(true);
                        }}
                        disabled={isGeneratingSuggestions || board.canvasData.items.length === 0}
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs justify-start"
                      >
                        {isGeneratingSuggestions ? (
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3 mr-2" />
                        )}
                        Get AI Suggestions
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">CATEGORIES</Label>
                    <div className="space-y-1">
                      {GOAL_CATEGORIES.slice(0, 4).map((category) => {
                        const Icon = category.icon;
                        return (
                          <Button
                            key={category.id}
                            variant={board.templateCategory === category.id ? "default" : "ghost"}
                            size="sm"
                            className="w-full h-8 text-xs justify-start"
                            onClick={() => setBoard(prev => ({ ...prev, templateCategory: category.id }))}
                          >
                            <Icon className="w-3 h-3 mr-2" />
                            {category.name.split(' ')[0]}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {aiSuggestions.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">AI SUGGESTIONS</Label>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {aiSuggestions.slice(0, 3).map((suggestion, index) => (
                            <div key={index} className="p-2 bg-muted/50 rounded text-xs">
                              {suggestion.description || suggestion.text || suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Main Canvas Area */}
          <Card className="col-span-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4 h-full">
              <div className="h-full flex flex-col">
                {/* Canvas Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={board.title}
                      onChange={(e) => setBoard(prev => ({ ...prev, title: e.target.value }))}
                      className="h-8 text-sm font-semibold bg-transparent border-0 focus-visible:ring-1 px-2"
                      placeholder="Vision Board Title"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {board.canvasData.items.length} items
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {board.canvasData.canvasWidth} × {board.canvasData.canvasHeight}
                    </Badge>
                    {currentBoardId && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                        Saved
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Canvas */}
                <div 
                  className="flex-1 overflow-auto rounded-lg border-2 border-dashed border-gray-200 bg-gray-50"
                  style={{ minHeight: '400px' }}
                >
                  <div
                    ref={canvasRef}
                    className="relative mx-auto shadow-lg"
                    style={{
                      width: `${board.canvasData.canvasWidth * (zoomLevel / 100)}px`,
                      height: `${board.canvasData.canvasHeight * (zoomLevel / 100)}px`,
                      backgroundColor: board.canvasData.backgroundColor,
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'top left',
                      backgroundImage: board.canvasData.gridVisible 
                        ? 'radial-gradient(circle, #ccc 1px, transparent 1px)'
                        : 'none',
                      backgroundSize: board.canvasData.gridVisible ? '20px 20px' : 'auto',
                      cursor: activeTool === 'hand' ? 'grab' : 'default'
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={handleCanvasClick}
                  >
                    {/* Render items sorted by z-index */}
                    {board.canvasData.items
                      .filter(item => item.visible !== false)
                      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                      .map((item) => (
                        <div
                          key={item.id}
                          className={`absolute select-none transition-all duration-150 ${
                            activeTool === 'select' ? 'cursor-move' : 'cursor-default'
                          } ${
                            selectedItem === item.id 
                              ? 'ring-2 ring-indigo-500 ring-offset-2' 
                              : 'hover:ring-1 hover:ring-indigo-300'
                          } ${item.locked ? 'cursor-not-allowed opacity-75' : ''}`}
                          style={{
                            left: item.x,
                            top: item.y,
                            width: item.width,
                            height: item.height,
                            transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                            opacity: item.opacity || 1,
                            zIndex: item.zIndex || 0
                          }}
                          onMouseDown={(e) => !item.locked && handleMouseDown(e, item.id)}
                        >
                          {item.type === 'text' ? (
                            <div
                              className="w-full h-full flex items-center justify-center p-2 rounded"
                              style={{
                                fontSize: item.fontSize || 16,
                                fontFamily: item.fontFamily || 'Inter',
                                fontWeight: item.fontWeight || 'normal',
                                textAlign: (item.textAlign as any) || 'center',
                                color: item.color || '#000000',
                                backgroundColor: item.backgroundColor && item.backgroundColor !== 'transparent' 
                                  ? item.backgroundColor 
                                  : 'transparent',
                                borderRadius: item.borderRadius || 0,
                                boxShadow: item.shadow ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
                              }}
                            >
                              {item.content}
                            </div>
                          ) : item.type === 'image' ? (
                            <img
                              src={item.content}
                              alt="Vision board item"
                              className="w-full h-full object-cover rounded"
                              draggable={false}
                              style={{
                                borderRadius: item.borderRadius || 0,
                                filter: item.effects ? [
                                  `brightness(${item.effects.brightness || 100}%)`,
                                  `contrast(${item.effects.contrast || 100}%)`,
                                  `saturate(${item.effects.saturation || 100}%)`,
                                  `blur(${item.effects.blur || 0}px)`
                                ].join(' ') : 'none',
                                boxShadow: item.shadow ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
                              }}
                            />
                          ) : null}
                          
                          {/* Selection indicators */}
                          {selectedItem === item.id && (
                            <>
                              {/* Corner handles */}
                              <div className="absolute -top-1 -left-1 w-2 h-2 bg-indigo-500 rounded-full cursor-nw-resize" />
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full cursor-ne-resize" />
                              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-500 rounded-full cursor-sw-resize" />
                              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full cursor-se-resize" />
                              
                              {/* Rotation handle */}
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full cursor-grab">
                                <div className="absolute top-2 left-1/2 -translate-x-0.5 w-0.5 h-4 bg-green-500" />
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                    {/* Empty state */}
                    {board.canvasData.items.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <h3 className="text-xl font-semibold mb-2">Create Your Vision</h3>
                          <p className="text-sm">Add text, images, or use AI to bring your dreams to life</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Sidebar - Properties */}
          <Card className="col-span-2 shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4 h-full">
              {selectedItemData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Properties</h3>
                    <Badge variant="secondary" className="text-xs">
                      {selectedItemData.type}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Transform */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground">TRANSFORM</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedItemData.x)}
                          onChange={(e) => updateItem(selectedItemData.id, { x: parseInt(e.target.value) || 0 })}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedItemData.y)}
                          onChange={(e) => updateItem(selectedItemData.id, { y: parseInt(e.target.value) || 0 })}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">W</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedItemData.width)}
                          onChange={(e) => updateItem(selectedItemData.id, { width: Math.max(10, parseInt(e.target.value) || 10) })}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">H</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedItemData.height)}
                          onChange={(e) => updateItem(selectedItemData.id, { height: Math.max(10, parseInt(e.target.value) || 10) })}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Text Properties */}
                  {selectedItemData.type === 'text' && (
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-muted-foreground">TEXT</Label>
                      <Textarea
                        value={selectedItemData.content}
                        onChange={(e) => updateItem(selectedItemData.id, { content: e.target.value })}
                        className="text-xs min-h-[60px]"
                        placeholder="Enter text..."
                      />
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Font</Label>
                            <Select
                              value={selectedItemData.fontFamily || 'Inter'}
                              onValueChange={(value) => updateItem(selectedItemData.id, { fontFamily: value })}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FONT_FAMILIES.map(font => (
                                  <SelectItem key={font} value={font} className="text-xs">
                                    {font}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Size</Label>
                            <Input
                              type="number"
                              value={selectedItemData.fontSize || 16}
                              onChange={(e) => updateItem(selectedItemData.id, { fontSize: Math.max(8, parseInt(e.target.value) || 8) })}
                              className="h-7 text-xs"
                              min="8"
                              max="144"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant={selectedItemData.fontWeight === 'bold' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => updateItem(selectedItemData.id, { 
                              fontWeight: selectedItemData.fontWeight === 'bold' ? 'normal' : 'bold' 
                            })}
                            className="h-7 px-2"
                          >
                            <Bold className="w-3 h-3" />
                          </Button>
                          <Button
                            variant={selectedItemData.textAlign === 'left' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => updateItem(selectedItemData.id, { textAlign: 'left' })}
                            className="h-7 px-2"
                          >
                            <AlignLeft className="w-3 h-3" />
                          </Button>
                          <Button
                            variant={selectedItemData.textAlign === 'center' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => updateItem(selectedItemData.id, { textAlign: 'center' })}
                            className="h-7 px-2"
                          >
                            <AlignCenter className="w-3 h-3" />
                          </Button>
                          <Button
                            variant={selectedItemData.textAlign === 'right' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => updateItem(selectedItemData.id, { textAlign: 'right' })}
                            className="h-7 px-2"
                          >
                            <AlignRight className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Text Color</Label>
                            <div className="flex items-center gap-1">
                              <Input
                                type="color"
                                value={selectedItemData.color || '#000000'}
                                onChange={(e) => updateItem(selectedItemData.id, { color: e.target.value })}
                                className="h-7 w-12 p-1"
                              />
                              <Input
                                value={selectedItemData.color || '#000000'}
                                onChange={(e) => updateItem(selectedItemData.id, { color: e.target.value })}
                                className="h-7 text-xs flex-1"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Background</Label>
                            <div className="flex items-center gap-1">
                              <Input
                                type="color"
                                value={selectedItemData.backgroundColor || '#ffffff'}
                                onChange={(e) => updateItem(selectedItemData.id, { backgroundColor: e.target.value })}
                                className="h-7 w-12 p-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateItem(selectedItemData.id, { backgroundColor: 'transparent' })}
                                className="h-7 px-2 text-xs"
                              >
                                Clear
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Style Properties */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground">STYLE</Label>
                    
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Opacity</Label>
                        <Slider
                          value={[(selectedItemData.opacity || 1) * 100]}
                          onValueChange={([value]) => updateItem(selectedItemData.id, { opacity: value / 100 })}
                          min={0}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {Math.round((selectedItemData.opacity || 1) * 100)}%
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Rotation</Label>
                        <Slider
                          value={[selectedItemData.rotation || 0]}
                          onValueChange={([value]) => updateItem(selectedItemData.id, { rotation: value })}
                          min={-180}
                          max={180}
                          step={15}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {selectedItemData.rotation || 0}°
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Corner Radius</Label>
                        <Slider
                          value={[selectedItemData.borderRadius || 0]}
                          onValueChange={([value]) => updateItem(selectedItemData.id, { borderRadius: value })}
                          min={0}
                          max={50}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {selectedItemData.borderRadius || 0}px
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">ACTIONS</Label>
                    
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateItem(selectedItemData.id)}
                        className="h-7 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateItem(selectedItemData.id, { locked: !selectedItemData.locked })}
                        className="h-7 text-xs"
                      >
                        {selectedItemData.locked ? (
                          <Unlock className="w-3 h-3 mr-1" />
                        ) : (
                          <Lock className="w-3 h-3 mr-1" />
                        )}
                        {selectedItemData.locked ? 'Unlock' : 'Lock'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => bringToFront(selectedItemData.id)}
                        className="h-7 text-xs"
                      >
                        <Layers className="w-3 h-3 mr-1" />
                        Front
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => sendToBack(selectedItemData.id)}
                        className="h-7 text-xs"
                      >
                        <Layers className="w-3 h-3 mr-1" />
                        Back
                      </Button>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteItem(selectedItemData.id)}
                      className="w-full h-7 text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground space-y-4 mt-12">
                  <MousePointer className="w-12 h-12 mx-auto opacity-50" />
                  <div>
                    <h3 className="text-sm font-semibold mb-1">No Selection</h3>
                    <p className="text-xs">Click on an item to edit its properties</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Save Vision Board
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="save-title">Title</Label>
              <Input
                id="save-title"
                value={board.title}
                onChange={(e) => setBoard(prev => ({ ...prev, title: e.target.value }))}
                placeholder="My Vision Board"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="save-description">Description</Label>
              <Textarea
                id="save-description"
                value={board.description}
                onChange={(e) => setBoard(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your vision..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="save-category">Category</Label>
              <Select 
                value={board.templateCategory} 
                onValueChange={(value) => setBoard(prev => ({ ...prev, templateCategory: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="public"
                checked={board.isPublic}
                onChange={(e) => setBoard(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="public" className="text-sm">
                Make this vision board public
              </Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                onClick={() => setShowSaveDialog(false)} 
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => saveVisionBoard()}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {currentBoardId ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Load Vision Board
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(savedBoards as any[]).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No saved vision boards</h3>
                <p className="text-sm">Create and save your first vision board to see it here.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {(savedBoards as any[]).map((savedBoard: any) => (
                  <Card 
                    key={savedBoard.id} 
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-indigo-200"
                    onClick={() => loadVisionBoard(savedBoard.id)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{savedBoard.title}</h3>
                            {savedBoard.description && (
                              <p className="text-muted-foreground text-sm line-clamp-2">
                                {savedBoard.description}
                              </p>
                            )}
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="ml-2 text-xs"
                          >
                            {savedBoard.templateCategory}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{savedBoard.canvasData?.items?.length || 0} items</span>
                          <span>{new Date(savedBoard.updatedAt).toLocaleDateString()}</span>
                        </div>

                        <div 
                          className="flex gap-2" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            onClick={() => loadVisionBoard(savedBoard.id)}
                            className="flex-1"
                          >
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => duplicateBoard(savedBoard.id)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportBoard('png')}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBoard(savedBoard.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Vision Board
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your vision board as a high-quality image.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => exportBoard('png')}
                variant="outline"
                className="h-12 flex-col"
              >
                <ImageIcon className="w-5 h-5 mb-1" />
                PNG
              </Button>
              <Button
                onClick={() => exportBoard('jpg')}
                variant="outline"
                className="h-12 flex-col"
              >
                <ImageIcon className="w-5 h-5 mb-1" />
                JPG
              </Button>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowExportDialog(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Image
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop an image here, or click to browse
              </p>
              <Button 
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowUploadDialog(false);
                }}
                variant="outline"
              >
                Choose File
              </Button>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowUploadDialog(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screen Capture Dialog */}
      <Dialog open={showScreenCaptureDialog} onOpenChange={setShowScreenCaptureDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Screen Capture Preview
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {capturedImage && (
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={capturedImage} 
                  alt="Screen capture preview"
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button 
                onClick={() => setShowScreenCaptureDialog(false)} 
                variant="outline"
              >
                Cancel
              </Button>
              <Button onClick={addCapturedImage}>
                <Plus className="w-4 h-4 mr-2" />
                Add to Board
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Suggestions Dialog */}
      <Dialog open={showSuggestionsDialog} onOpenChange={setShowSuggestionsDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              AI Suggestions for Your Vision Board
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {aiSuggestions.length > 0 ? (
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">
                          {suggestion.title || `Suggestion ${index + 1}`}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {suggestion.description || suggestion.text || suggestion}
                        </p>
                        {suggestion.actionable && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 text-xs"
                            onClick={() => {
                              // Apply suggestion logic here
                              toast({ title: "Suggestion applied!" });
                            }}
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No suggestions available. Add some content to your vision board first.</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowSuggestionsDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Image Generator Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              AI Image Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-prompt">Describe your image</Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="A beautiful mountain landscape at sunset with golden light..."
                className="mt-1 min-h-[100px]"
                rows={4}
              />
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg">
              <h4 className="text-sm font-semibold mb-2 text-purple-900">Tips for better results:</h4>
              <ul className="text-xs text-purple-800 space-y-1">
                <li>• Be specific about style, colors, and mood</li>
                <li>• Include details like lighting, perspective, or art style</li>
                <li>• Use descriptive adjectives (vibrant, ethereal, modern)</li>
              </ul>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowAIDialog(false)} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={generateAIImage}
                disabled={isGeneratingImage || !aiPrompt.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Vision Board Generator Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              AI Vision Board Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-indigo-900">Personalized Board Creation</h4>
              <p className="text-sm text-indigo-800 mb-3">
                Create a vision board based on your journal entries, affirmations, and goals. 
                The AI will analyze your personal data to create meaningful visual elements.
              </p>
              <div className="space-y-2 text-xs text-indigo-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <span>Analyzes your journal entries for themes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <span>Incorporates your personal affirmations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <span>Considers your challenge progress</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowTemplateDialog(false)} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={generateAIVisionBoard}
                disabled={isGeneratingBoard}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isGeneratingBoard ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Board
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}