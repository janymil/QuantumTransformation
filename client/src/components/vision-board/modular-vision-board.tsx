import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { VisionBoardItem, AISuggestion } from "./vision-board-types";
import { useVisionBoardState } from "./useVisionBoardState";

// Import all modular components
import VisionBoardToolbar from "./vision-board-toolbar";
import ImageGeneration from "./image-generation";
import AISuggestions from "./ai-suggestions";
import AIBoardGenerator from "./ai-board-generator";
import TemplateSelector from "./template-selector";
import SaveLoadManager from "./save-load-manager";
import ExportManager from "./export-manager";
import MobileWallpaper from "./mobile-wallpaper";
import ScreenCapture from "./screen-capture";
import ElementEditor from "./element-editor";
import VirtualTour from "./virtual-tour";
import AIPersonalizedSuggestions from "./ai-personalized-suggestions";
import IconsElementsPicker from "./icons-elements-picker";
import BoardEditor from "./board-editor";

// Import new modular functionality
import { useDragHandler } from "./drag-handler";
import { useResizeHandler, ResizeHandles } from "./resize-handler";
import { useTextEditor, TextEditor, TextFormattingToolbar } from "./text-editor";
import { ImageUpload, ImageDropZone } from "./image-upload";

export default function ModularVisionBoard() {
  const { toast } = useToast();
  
  // Use the modular state management hook
  const {
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
    canUndo,
    canRedo,
    undo,
    redo,

    // Element management
    addElement,
    updateElement,
    deleteElement,
    getSelectedElement
  } = useVisionBoardState();

  // Initialize modular functionality hooks
  const dragHandler = useDragHandler({
    items: board.canvasData.items,
    selectedItem,
    onUpdateElement: updateElement,
    onSelectElement: setSelectedItem,
    zoomLevel
  });

  const resizeHandler = useResizeHandler({
    selectedItem,
    items: board.canvasData.items,
    onUpdateElement: updateElement,
    zoomLevel
  });

  const textEditor = useTextEditor();

  // Canvas interaction handlers
  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'text') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const newTextElement: VisionBoardItem = {
          id: Date.now().toString(),
          type: 'text',
          content: 'New Text',
          x: x / (zoomLevel / 100),
          y: y / (zoomLevel / 100),
          width: 200,
          height: 30,
          fontSize: 16,
          color: '#000000',
          opacity: 1,
          zIndex: 1,
          visible: true,
          locked: false
        };
        
        addElement(newTextElement);
        setSelectedItem(newTextElement.id);
        setActiveTool('select');
      }
    } else if (activeTool === 'shape') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const newShapeElement: VisionBoardItem = {
          id: Date.now().toString(),
          type: 'shape',
          content: '',
          x: x / (zoomLevel / 100),
          y: y / (zoomLevel / 100),
          width: 100,
          height: 100,
          backgroundColor: '#cccccc',
          borderRadius: 8,
          opacity: 1,
          zIndex: 1,
          visible: true,
          locked: false
        };
        
        addElement(newShapeElement);
        setSelectedItem(newShapeElement.id);
        setActiveTool('select');
      }
    }
  };

  const handleElementClick = (elementId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (activeTool === 'select') {
      setSelectedItem(elementId);
    }
  };

  const handleElementDoubleClick = (elementId: string) => {
    setSelectedItem(elementId);
    setShowElementEditor(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            event.preventDefault();
            break;
          case 's':
            setShowSaveDialog(true);
            event.preventDefault();
            break;
          case 'o':
            setShowLoadDialog(true);
            event.preventDefault();
            break;
        }
      }
      
      if (event.key === 'Delete' && selectedItem) {
        deleteElement(selectedItem);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, deleteElement, undo, redo]);

  // Handler functions for toolbar actions
  const handleImageGenerated = (item: VisionBoardItem) => {
    addElement(item);
    toast({
      title: "Image Added",
      description: "AI-generated image added to your vision board"
    });
  };

  const handleImageUploaded = (item: VisionBoardItem) => {
    addElement(item);
    toast({
      title: "Image Uploaded",
      description: "Image uploaded and added to your vision board"
    });
  };

  const handleImageCaptured = (item: VisionBoardItem) => {
    addElement(item);
    toast({
      title: "Screen Captured",
      description: "Screen capture added to your vision board"
    });
  };

  const handleBoardGenerated = (generatedBoard: typeof board) => {
    setBoard(generatedBoard);
    toast({
      title: "AI Vision Board Created",
      description: "Your personalized vision board has been generated"
    });
  };

  const handleTemplateSelected = (templateBoard: typeof board) => {
    setBoard(templateBoard);
    toast({
      title: "Template Applied",
      description: "Template has been loaded to your vision board"
    });
  };

  const handleBoardLoaded = (loadedBoard: typeof board) => {
    setBoard(loadedBoard);
    setCurrentBoardId(loadedBoard.id || null);
    toast({
      title: "Vision Board Loaded",
      description: `"${loadedBoard.title}" has been loaded`
    });
  };

  const handleBoardSaved = (boardId: number) => {
    setCurrentBoardId(boardId);
    setIsSaving(false);
    toast({
      title: "Vision Board Saved",
      description: "Your vision board has been saved successfully"
    });
  };

  const handleSuggestionApplied = (suggestion: AISuggestion) => {
    // Apply the suggestion based on its type
    if (suggestion.type === 'element') {
      // Add a new element based on suggestion
      const newElement: VisionBoardItem = {
        id: Date.now().toString(),
        type: 'text',
        content: suggestion.title,
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
        width: 200,
        height: 30,
        fontSize: 16,
        color: '#000000',
        opacity: 1,
        zIndex: 1,
        visible: true,
        locked: false
      };
      addElement(newElement);
    }
    // Add more suggestion types handling as needed
  };

  const handleScreenCapture = () => {
    setShowScreenCaptureDialog(true);
  };

  const handleGridToggle = () => {
    setBoard(prev => ({
      ...prev,
      canvasData: {
        ...prev.canvasData,
        gridVisible: !prev.canvasData.gridVisible
      }
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <VisionBoardToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        gridVisible={board.canvasData.gridVisible || false}
        onGridToggle={handleGridToggle}
        onSave={() => setShowSaveDialog(true)}
        onLoad={() => setShowLoadDialog(true)}
        onExport={() => setShowExportDialog(true)}
        onAIGenerate={() => setShowAIDialog(true)}
        onAISuggestions={() => setShowSuggestionsDialog(true)}
        onTemplateSelect={() => setShowTemplateDialog(true)}
        onImageGenerate={() => setShowScreenCaptureDialog(true)}
        onScreenCapture={handleScreenCapture}
        onMobileWallpaper={() => setShowMobileWallpaperDialog(true)}
        onVirtualTour={() => setShowVirtualTour(true)}
        onPersonalizedSuggestions={() => setShowPersonalizedSuggestions(true)}
        onIconsPicker={() => setShowIconsPicker(true)}
        onBoardEditor={() => setShowBoardEditor(true)}
        elementCount={board.canvasData.items.length}
        isSaving={isSaving}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-hidden">
        <div 
          className="w-full h-full overflow-auto"
          style={{ 
            cursor: activeTool === 'hand' ? 'grab' : 'default',
            zoom: `${zoomLevel}%` 
          }}
        >
          <ImageDropZone
            onImageAdd={addElement}
            className="flex justify-center items-start py-8"
          >
            <div
              ref={canvasRef}
              className={`relative shadow-lg border ${
                board.canvasData.gridVisible ? 'bg-grid-pattern' : ''
              }`}
              style={{
                width: board.canvasData.canvasWidth,
                height: board.canvasData.canvasHeight,
                backgroundColor: board.canvasData.backgroundColor,
                cursor: activeTool === 'text' ? 'text' : activeTool === 'shape' ? 'crosshair' : 'default'
              }}
              onClick={handleCanvasClick}
              onMouseMove={dragHandler.handleMouseMove}
              onMouseUp={dragHandler.handleMouseUp}
            >
            {/* Grid overlay */}
            {board.canvasData.gridVisible && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />
            )}

            {/* Render all elements */}
            {board.canvasData.items.map((item) => (
              <div
                key={item.id}
                className={`absolute select-none ${
                  selectedItem === item.id ? 'ring-2 ring-blue-500' : ''
                } ${item.locked ? 'pointer-events-none' : ''}`}
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  height: item.height,
                  transform: `rotate(${item.rotation || 0}deg)`,
                  opacity: item.opacity || 1,
                  zIndex: item.zIndex || 1,
                  display: item.visible === false ? 'none' : 'block',
                  borderRadius: item.borderRadius || 0,
                  backgroundColor: item.backgroundColor || 'transparent',
                  boxShadow: item.shadow ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none'
                }}
                onMouseDown={(e) => dragHandler.handleElementMouseDown(item.id, e)}
                onClick={(e) => handleElementClick(item.id, e)}
              >
                {item.type === 'text' && (
                  <TextEditor
                    item={item}
                    isEditing={textEditor.editingText === item.id}
                    onUpdate={(updates) => updateElement(item.id, updates)}
                    onFinishEditing={textEditor.finishEditing}
                    onStartEditing={() => textEditor.startEditing(item.id, item.content)}
                  />
                )}

                {item.type === 'image' && (
                  <img
                    src={item.content}
                    alt="Vision board element"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                )}

                {item.type === 'shape' && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: item.backgroundColor || '#cccccc',
                      borderRadius: item.borderRadius || 0
                    }}
                  />
                )}

                {/* Resize handles for selected element */}
                <ResizeHandles
                  elementId={item.id}
                  isSelected={selectedItem === item.id}
                  onResizeStart={resizeHandler.handleResizeStart}
                  onRotate={resizeHandler.handleRotate}
                />

                {/* Text formatting toolbar for selected text elements */}
                {selectedItem === item.id && item.type === 'text' && (
                  <TextFormattingToolbar
                    item={item}
                    onUpdate={(updates) => updateElement(item.id, updates)}
                    isVisible={true}
                  />
                )}
              </div>
            ))}
            </div>
          </ImageDropZone>
        </div>
      </div>

      {/* All Dialog Components */}
      <ImageGeneration
        isOpen={showScreenCaptureDialog}
        onClose={() => setShowScreenCaptureDialog(false)}
        onImageGenerated={handleImageGenerated}
        onImageUploaded={handleImageUploaded}
        onScreenCapture={handleScreenCapture}
        isCapturingScreen={isCapturingScreen}
      />

      <AISuggestions
        isOpen={showSuggestionsDialog}
        onClose={() => setShowSuggestionsDialog(false)}
        currentBoard={board}
        onApplySuggestion={handleSuggestionApplied}
      />

      <AIBoardGenerator
        isOpen={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        onBoardGenerated={handleBoardGenerated}
      />

      <TemplateSelector
        isOpen={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onTemplateSelected={handleTemplateSelected}
      />

      <SaveLoadManager
        isOpen={showSaveDialog || showLoadDialog}
        onClose={() => {
          setShowSaveDialog(false);
          setShowLoadDialog(false);
        }}
        mode={showSaveDialog ? 'save' : 'load'}
        currentBoard={board}
        onBoardLoaded={handleBoardLoaded}
        onBoardSaved={handleBoardSaved}
      />

      <ExportManager
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        currentBoard={board}
        canvasRef={canvasRef}
      />

      <MobileWallpaper
        isOpen={showMobileWallpaperDialog}
        onClose={() => setShowMobileWallpaperDialog(false)}
        currentBoard={board}
      />

      <ScreenCapture
        isOpen={showScreenCaptureDialog && isCapturingScreen}
        onClose={() => {
          setShowScreenCaptureDialog(false);
          setIsCapturingScreen(false);
        }}
        onImageCaptured={handleImageCaptured}
        isCapturing={isCapturingScreen}
        setIsCapturing={setIsCapturingScreen}
      />

      <ElementEditor
        isOpen={showElementEditor}
        onClose={() => setShowElementEditor(false)}
        selectedElement={getSelectedElement()}
        onElementUpdate={(element) => updateElement(element.id, element)}
        onElementDelete={deleteElement}
      />

      <VirtualTour
        isOpen={showVirtualTour}
        onClose={() => setShowVirtualTour(false)}
        onStartCreating={() => {
          setShowVirtualTour(false);
          // Focus on canvas for creating
        }}
      />

      <AIPersonalizedSuggestions
        isOpen={showPersonalizedSuggestions}
        onClose={() => setShowPersonalizedSuggestions(false)}
        currentBoard={board}
        onApplySuggestion={handleSuggestionApplied}
        onAddElement={addElement}
      />

      <IconsElementsPicker
        isOpen={showIconsPicker}
        onClose={() => setShowIconsPicker(false)}
        onElementAdded={(element) => {
          addElement(element);
          setShowIconsPicker(false);
        }}
      />

      <BoardEditor
        isOpen={showBoardEditor}
        onClose={() => setShowBoardEditor(false)}
        board={editingBoard || board}
        onBoardUpdated={(updatedBoard) => {
          setBoard(updatedBoard);
          setEditingBoard(null);
          setShowBoardEditor(false);
        }}
        onBoardDeleted={() => {
          setBoard({
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
          setEditingBoard(null);
          setShowBoardEditor(false);
        }}
      />
    </div>
  );
}