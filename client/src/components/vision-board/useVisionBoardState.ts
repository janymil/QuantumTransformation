import { useState, useRef, useCallback } from "react";
import { VisionBoard, VisionBoardItem, Tool, ViewMode } from "./vision-board-types";

export function useVisionBoardState() {
  // Main state
  const [board, setBoard] = useState<VisionBoard>({
    title: "My Vision Board",
    description: "",
    canvasData: {
      items: [],
      canvasWidth: 800,
      canvasHeight: 600,
      backgroundColor: "#ffffff",
      gridVisible: false,
      snapToGrid: false
    },
    templateCategory: "personal",
    tags: [],
    isPublic: false
  });

  // UI state
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
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
  const [showMobileWallpaperDialog, setShowMobileWallpaperDialog] = useState(false);
  const [showElementEditor, setShowElementEditor] = useState(false);
  const [showVirtualTour, setShowVirtualTour] = useState(false);
  const [showPersonalizedSuggestions, setShowPersonalizedSuggestions] = useState(false);
  const [showIconsPicker, setShowIconsPicker] = useState(false);
  const [showBoardEditor, setShowBoardEditor] = useState(false);
  const [editingBoard, setEditingBoard] = useState<VisionBoard | null>(null);

  // Working states
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<VisionBoard[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);

  // History management
  const addToHistory = useCallback((newBoard: VisionBoard) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newBoard)));
    
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBoard(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBoard(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  }, [history, historyIndex]);

  // Element management
  const addElement = useCallback((element: VisionBoardItem) => {
    const newBoard = {
      ...board,
      canvasData: {
        ...board.canvasData,
        items: [...board.canvasData.items, element]
      }
    };
    setBoard(newBoard);
    addToHistory(newBoard);
  }, [board, addToHistory]);

  const updateElement = useCallback((elementId: string, updates: Partial<VisionBoardItem>) => {
    const newBoard = {
      ...board,
      canvasData: {
        ...board.canvasData,
        items: board.canvasData.items.map(item =>
          item.id === elementId ? { ...item, ...updates } : item
        )
      }
    };
    setBoard(newBoard);
    addToHistory(newBoard);
  }, [board, addToHistory]);

  const deleteElement = useCallback((elementId: string) => {
    const newBoard = {
      ...board,
      canvasData: {
        ...board.canvasData,
        items: board.canvasData.items.filter(item => item.id !== elementId)
      }
    };
    setBoard(newBoard);
    addToHistory(newBoard);
    if (selectedItem === elementId) {
      setSelectedItem(null);
    }
  }, [board, selectedItem, addToHistory]);

  const getSelectedElement = useCallback(() => {
    if (!selectedItem) return null;
    return board.canvasData.items.find(item => item.id === selectedItem) || null;
  }, [selectedItem, board.canvasData.items]);

  return {
    // State
    board,
    setBoard,
    selectedItem,
    setSelectedItem,
    activeTool,
    setActiveTool,
    viewMode,
    setViewMode,
    zoomLevel,
    setZoomLevel,
    currentBoardId,
    setCurrentBoardId,

    // Dialog states
    showSaveDialog,
    setShowSaveDialog,
    showLoadDialog,
    setShowLoadDialog,
    showExportDialog,
    setShowExportDialog,
    showAIDialog,
    setShowAIDialog,
    showTemplateDialog,
    setShowTemplateDialog,
    showSuggestionsDialog,
    setShowSuggestionsDialog,
    showScreenCaptureDialog,
    setShowScreenCaptureDialog,
    showMobileWallpaperDialog,
    setShowMobileWallpaperDialog,
    showElementEditor,
    setShowElementEditor,
    showVirtualTour,
    setShowVirtualTour,
    showPersonalizedSuggestions,
    setShowPersonalizedSuggestions,
    showIconsPicker,
    setShowIconsPicker,
    showBoardEditor,
    setShowBoardEditor,
    editingBoard,
    setEditingBoard,

    // Working states
    isCapturingScreen,
    setIsCapturingScreen,
    isSaving,
    setIsSaving,

    // Refs
    canvasRef,

    // History
    history,
    addToHistory,
    undo,
    redo,
    historyIndex,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,

    // Element management
    addElement,
    updateElement,
    deleteElement,
    getSelectedElement
  };
}