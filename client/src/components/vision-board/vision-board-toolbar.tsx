import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer, 
  Type, 
  Image, 
  Square, 
  Hand, 
  Save, 
  FolderOpen, 
  Download, 
  Brain, 
  Sparkles, 
  Lightbulb,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid,
  Eye,
  EyeOff,
  Smartphone,
  Camera
} from "lucide-react";
import { Tool, ViewMode } from "./vision-board-types";

interface VisionBoardToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
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
  onAISuggestions: () => void;
  onTemplateSelect: () => void;
  onImageGenerate: () => void;
  onScreenCapture: () => void;
  onMobileWallpaper: () => void;
  onVirtualTour?: () => void;
  onPersonalizedSuggestions?: () => void;
  onIconsPicker?: () => void;
  onBoardEditor?: () => void;
  elementCount: number;
  isSaving?: boolean;
}

export default function VisionBoardToolbar({
  activeTool,
  onToolChange,
  viewMode,
  onViewModeChange,
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
  onAISuggestions,
  onTemplateSelect,
  onImageGenerate,
  onScreenCapture,
  onMobileWallpaper,
  onVirtualTour,
  onPersonalizedSuggestions,
  onIconsPicker,
  onBoardEditor,
  elementCount,
  isSaving = false
}: VisionBoardToolbarProps) {

  const getToolIcon = (tool: Tool) => {
    switch (tool) {
      case 'select':
        return <MousePointer className="w-4 h-4" />;
      case 'text':
        return <Type className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'shape':
        return <Square className="w-4 h-4" />;
      case 'hand':
        return <Hand className="w-4 h-4" />;
      default:
        return <MousePointer className="w-4 h-4" />;
    }
  };

  const getToolLabel = (tool: Tool) => {
    switch (tool) {
      case 'select':
        return 'Select';
      case 'text':
        return 'Text';
      case 'image':
        return 'Image';
      case 'shape':
        return 'Shape';
      case 'hand':
        return 'Pan';
      default:
        return 'Select';
    }
  };

  const tools: Tool[] = ['select', 'text', 'image', 'shape', 'hand'];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Tools Section */}
      <div className="flex items-center gap-1">
        {tools.map((tool) => (
          <Button
            key={tool}
            variant={activeTool === tool ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange(tool)}
            className="flex items-center gap-2"
          >
            {getToolIcon(tool)}
            <span className="hidden sm:inline">{getToolLabel(tool)}</span>
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* File Operations */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onLoad}
          className="flex items-center gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Load</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* AI & Generation Tools */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onAIGenerate}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
        >
          <Brain className="w-4 h-4" />
          <span className="hidden sm:inline">AI Board</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onImageGenerate}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">AI Image</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onAISuggestions}
          className="flex items-center gap-2 text-green-600 hover:text-green-700"
        >
          <Lightbulb className="w-4 h-4" />
          <span className="hidden sm:inline">Suggestions</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onTemplateSelect}
          className="flex items-center gap-2"
        >
          <Square className="w-4 h-4" />
          <span className="hidden sm:inline">Templates</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Capture & Mobile Tools */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onScreenCapture}
          className="flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Capture</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onMobileWallpaper}
          className="flex items-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">Wallpaper</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* History Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-2"
        >
          <Undo className="w-4 h-4" />
          <span className="hidden sm:inline">Undo</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="flex items-center gap-2"
        >
          <Redo className="w-4 h-4" />
          <span className="hidden sm:inline">Redo</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* View Controls */}
      <div className="flex items-center gap-2">
        <Select value={viewMode} onValueChange={(value: ViewMode) => onViewModeChange(value)}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="preview">Preview</SelectItem>
            <SelectItem value="presentation">Present</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={onGridToggle}
          className="flex items-center gap-2"
        >
          <Grid className="w-4 h-4" />
          {gridVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.max(25, zoomLevel - 25))}
            disabled={zoomLevel <= 25}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[3rem] text-center">
            {zoomLevel}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.min(300, zoomLevel + 25))}
            disabled={zoomLevel >= 300}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status Info */}
      <div className="ml-auto flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {elementCount} elements
        </Badge>
        {isSaving && (
          <Badge variant="outline" className="text-xs text-blue-600">
            Saving...
          </Badge>
        )}
      </div>
    </div>
  );
}