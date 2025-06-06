import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Crop, 
  RotateCcw, 
  RotateCw, 
  Palette, 
  Type, 
  Square, 
  Circle, 
  ArrowRight,
  Check,
  X,
  Download
} from "lucide-react";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

interface EditingState {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  cropArea: { x: number; y: number; width: number; height: number } | null;
}

export default function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mode, setMode] = useState<'adjust' | 'crop' | 'annotate'>('adjust');
  const [editing, setEditing] = useState<EditingState>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    rotation: 0,
    cropArea: null
  });

  const [cropSelection, setCropSelection] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isSelecting: boolean;
  } | null>(null);

  // Load and draw initial image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (canvasRef.current) {
        drawImage();
        setIsLoaded(true);
      }
    };
    img.src = imageUrl;
    // Store reference to image
    imageRef.current = img;
  }, [imageUrl]);

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size
    canvas.width = Math.min(800, img.width);
    canvas.height = Math.min(600, img.height);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations
    ctx.save();
    
    // Move to center for rotation
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((editing.rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // Apply filters
    ctx.filter = `
      brightness(${editing.brightness}%) 
      contrast(${editing.contrast}%) 
      saturate(${editing.saturation}%)
    `;
    
    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    ctx.restore();
    
    // Draw crop overlay if in crop mode
    if (mode === 'crop' && editing.cropArea) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        editing.cropArea.x,
        editing.cropArea.y,
        editing.cropArea.width,
        editing.cropArea.height
      );
    }
  }, [editing, mode]);

  // Redraw when editing state changes
  useEffect(() => {
    if (isLoaded) {
      drawImage();
    }
  }, [editing, isLoaded, drawImage]);

  const handleSliderChange = (property: keyof EditingState, value: number[]) => {
    setEditing(prev => ({ ...prev, [property]: value[0] }));
  };

  const handleRotate = (direction: 'left' | 'right') => {
    const delta = direction === 'left' ? -90 : 90;
    setEditing(prev => ({ ...prev, rotation: prev.rotation + delta }));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'crop') return;
    
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCropSelection({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      isSelecting: true
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'crop' || !cropSelection?.isSelecting) return;
    
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCropSelection(prev => prev ? { ...prev, endX: x, endY: y } : null);
    
    // Update crop area for preview
    if (cropSelection) {
      const minX = Math.min(cropSelection.startX, x);
      const minY = Math.min(cropSelection.startY, y);
      const width = Math.abs(x - cropSelection.startX);
      const height = Math.abs(y - cropSelection.startY);
      
      setEditing(prev => ({
        ...prev,
        cropArea: { x: minX, y: minY, width, height }
      }));
    }
  };

  const handleMouseUp = () => {
    if (cropSelection) {
      setCropSelection(prev => prev ? { ...prev, isSelecting: false } : null);
    }
  };

  const applyCrop = () => {
    if (!editing.cropArea || !canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const { x, y, width, height } = editing.cropArea;
    
    // Create new canvas with cropped dimensions
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d')!;
    
    croppedCanvas.width = width;
    croppedCanvas.height = height;
    
    // Get image data from crop area
    const imageData = ctx.getImageData(x, y, width, height);
    croppedCtx.putImageData(imageData, 0, 0);
    
    // Update main canvas
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(imageData, 0, 0);
    
    // Reset crop area
    setEditing(prev => ({ ...prev, cropArea: null }));
    setMode('adjust');
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const editedImageUrl = canvas.toDataURL('image/png');
    onSave(editedImageUrl);
  };

  const resetEdits = () => {
    setEditing({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      cropArea: null
    });
    setMode('adjust');
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Image Editor</span>
          <div className="flex gap-2">
            <Button onClick={resetEdits} variant="outline" size="sm">
              Reset
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} size="sm">
              <Check className="w-4 h-4 mr-1" />
              Apply
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-2">
          <Button
            onClick={() => setMode('adjust')}
            variant={mode === 'adjust' ? 'default' : 'outline'}
            size="sm"
          >
            <Palette className="w-4 h-4 mr-1" />
            Adjust
          </Button>
          <Button
            onClick={() => setMode('crop')}
            variant={mode === 'crop' ? 'default' : 'outline'}
            size="sm"
          >
            <Crop className="w-4 h-4 mr-1" />
            Crop
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Canvas */}
          <div className="flex-1">
            <canvas
              ref={canvasRef}
              className="border rounded-lg cursor-crosshair max-w-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ maxHeight: '500px' }}
            />
          </div>

          {/* Controls */}
          <div className="w-80 space-y-4">
            {mode === 'adjust' && (
              <>
                {/* Brightness */}
                <div className="space-y-2">
                  <Label>Brightness: {editing.brightness}%</Label>
                  <Slider
                    value={[editing.brightness]}
                    onValueChange={(value) => handleSliderChange('brightness', value)}
                    min={0}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-2">
                  <Label>Contrast: {editing.contrast}%</Label>
                  <Slider
                    value={[editing.contrast]}
                    onValueChange={(value) => handleSliderChange('contrast', value)}
                    min={0}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-2">
                  <Label>Saturation: {editing.saturation}%</Label>
                  <Slider
                    value={[editing.saturation]}
                    onValueChange={(value) => handleSliderChange('saturation', value)}
                    min={0}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Rotation */}
                <div className="space-y-2">
                  <Label>Rotation</Label>
                  <div className="flex gap-2">
                    <Button onClick={() => handleRotate('left')} variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => handleRotate('right')} variant="outline" size="sm">
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground py-2">
                      {editing.rotation}°
                    </span>
                  </div>
                </div>
              </>
            )}

            {mode === 'crop' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Click and drag on the image to select the area to crop.
                </p>
                {editing.cropArea && (
                  <Button onClick={applyCrop} className="w-full">
                    Apply Crop
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}