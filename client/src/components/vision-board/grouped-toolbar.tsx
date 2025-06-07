import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Type, Upload, Save, FolderOpen, Download, Brain, Sparkles, Layout,
  Undo, Redo, ZoomIn, ZoomOut, Grid3X3, Camera, Smartphone, Play,
  Star, Palette, Settings, MousePointer, Square
} from "lucide-react";

interface GroupedToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  gridVisible: boolean;
  onGridToggle: () => void;
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onAIGenerate: () => void;
  onImageGenerate: () => void;
  onTemplateSelect: () => void;
  onImageAdd: (item: any) => void;
  elementCount: number;
  isSaving?: boolean;
  onAISuggestions?: () => void;
  onScreenCapture?: () => void;
  onMobileWallpaper?: () => void;
  onVirtualTour?: () => void;
  onPersonalizedSuggestions?: () => void;
  onIconsPicker?: () => void;
  onBoardEditor?: () => void;
}

export default function GroupedToolbar({
  activeTool,
  onToolChange,
  zoomLevel,
  onZoomChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  gridVisible,
  onGridToggle,
  onSave,
  onLoad,
  onExport,
  onAIGenerate,
  onImageGenerate,
  onTemplateSelect,
  onImageAdd,
  elementCount,
  isSaving,
  onAISuggestions,
  onScreenCapture,
  onMobileWallpaper,
  onVirtualTour,
  onPersonalizedSuggestions,
  onIconsPicker,
  onBoardEditor
}: GroupedToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const loadingToast = document.createElement('div');
    loadingToast.textContent = 'Uploading image...';
    loadingToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
    document.body.appendChild(loadingToast);

    fetch('/api/bunnycdn/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })
    .then(response => response.json())
    .then(result => {
      document.body.removeChild(loadingToast);
      
      if (result.success) {
        const newImageElement = {
          id: `image-${Date.now()}`,
          type: 'image' as const,
          content: result.url,
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          rotation: 0,
          opacity: 1,
          zIndex: 1
        };
        onImageAdd(newImageElement);
        
        const successToast = document.createElement('div');
        successToast.textContent = 'Image uploaded successfully!';
        successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        document.body.appendChild(successToast);
        setTimeout(() => {
          if (document.body.contains(successToast)) {
            document.body.removeChild(successToast);
          }
        }, 3000);
      } else {
        const errorToast = document.createElement('div');
        errorToast.textContent = `Upload failed: ${result.error || 'Unknown error'}`;
        errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
        document.body.appendChild(errorToast);
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 5000);
      }
    })
    .catch(error => {
      document.body.removeChild(loadingToast);
      
      const errorToast = document.createElement('div');
      errorToast.textContent = 'Network error. Please check your connection.';
      errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
      document.body.appendChild(errorToast);
      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 5000);
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Basic Tools Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Basic Tools
          </h3>
          <div className="space-y-2">
            <Button
              variant={activeTool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToolChange('text')}
              className="w-full justify-start"
            >
              <Type className="w-4 h-4 mr-2" />
              Add Text
            </Button>
            
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full justify-start"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
          </div>
        </div>

        {/* File Operations Box */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
            <Save className="w-4 h-4" />
            File Operations
          </h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="w-full justify-start"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Board'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onLoad}
              className="w-full justify-start"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Load Board
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* AI Tools Box */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Tools
          </h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAIGenerate}
              className="w-full justify-start"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Generate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onImageGenerate}
              className="w-full justify-start"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Image
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onTemplateSelect}
              className="w-full justify-start"
            >
              <Layout className="w-4 h-4 mr-2" />
              Templates
            </Button>
            {onAISuggestions && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAISuggestions}
                className="w-full justify-start"
              >
                <Star className="w-4 h-4 mr-2" />
                AI Suggestions
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Features Box */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
          <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Advanced Features
          </h3>
          <div className="space-y-2">
            {onScreenCapture && (
              <Button
                variant="outline"
                size="sm"
                onClick={onScreenCapture}
                className="w-full justify-start"
              >
                <Camera className="w-4 h-4 mr-2" />
                Screen Capture
              </Button>
            )}
            {onMobileWallpaper && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMobileWallpaper}
                className="w-full justify-start"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile Wallpaper
              </Button>
            )}
            {onVirtualTour && (
              <Button
                variant="outline"
                size="sm"
                onClick={onVirtualTour}
                className="w-full justify-start"
              >
                <Play className="w-4 h-4 mr-2" />
                Virtual Tour
              </Button>
            )}
            {onIconsPicker && (
              <Button
                variant="outline"
                size="sm"
                onClick={onIconsPicker}
                className="w-full justify-start"
              >
                <Palette className="w-4 h-4 mr-2" />
                Elements Picker
              </Button>
            )}
            {onBoardEditor && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBoardEditor}
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Board Editor
              </Button>
            )}
          </div>
        </div>

        {/* View Controls Box */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
            <ZoomIn className="w-4 h-4" />
            View Controls
          </h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
                className="flex-1"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                className="flex-1"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onZoomChange(Math.max(0.1, zoomLevel - 0.1))}
                className="flex-1"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <div className="flex-1 text-xs text-center py-2 px-2 bg-white dark:bg-gray-800 rounded border">
                {Math.round(zoomLevel * 100)}%
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onZoomChange(Math.min(3, zoomLevel + 0.1))}
                className="flex-1"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onGridToggle}
              className={cn("w-full justify-start", gridVisible && "bg-orange-100 dark:bg-orange-800")}
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Grid
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 flex justify-between">
        <span>Elements: {elementCount}</span>
        <span>Active Tool: {activeTool === 'text' ? 'Text' : 'None'}</span>
      </div>
    </div>
  );
}