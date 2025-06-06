import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MobileWallpaperGeneratorProps {
  canvasRef: React.RefObject<any>;
}

const WALLPAPER_PRESETS = {
  iphone_14: { width: 1179, height: 2556, name: 'iPhone 14/15' },
  iphone_14_pro: { width: 1290, height: 2796, name: 'iPhone 14/15 Pro' },
  samsung_s23: { width: 1080, height: 2340, name: 'Samsung Galaxy S23' },
  pixel_7: { width: 1080, height: 2400, name: 'Google Pixel 7' },
  custom_9_16: { width: 1080, height: 1920, name: 'Standard 9:16' },
  custom_9_19: { width: 1080, height: 2280, name: 'Extended 9:19.5' }
};

export default function MobileWallpaperGenerator({ canvasRef }: MobileWallpaperGeneratorProps) {
  const [selectedPreset, setSelectedPreset] = useState('iphone_14');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateWallpaper = async () => {
    if (!canvasRef.current) {
      toast({
        title: "Error",
        description: "Vision board not found. Please create a vision board first.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      const preset = WALLPAPER_PRESETS[selectedPreset as keyof typeof WALLPAPER_PRESETS];
      
      // Get current canvas dimensions
      const originalWidth = canvas.getWidth();
      const originalHeight = canvas.getHeight();
      
      // Calculate scaling to fit mobile dimensions while maintaining aspect ratio
      const scaleX = preset.width / originalWidth;
      const scaleY = preset.height / originalHeight;
      const scale = Math.min(scaleX, scaleY);
      
      // Create temporary canvas for wallpaper generation
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = preset.width;
      tempCanvas.height = preset.height;
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not create canvas context');
      
      // Fill background with current canvas background or default
      const backgroundColor = canvas.backgroundColor || '#ffffff';
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, preset.width, preset.height);
      
      // Calculate positioning to center the scaled vision board
      const scaledWidth = originalWidth * scale;
      const scaledHeight = originalHeight * scale;
      const x = (preset.width - scaledWidth) / 2;
      const y = (preset.height - scaledHeight) / 2;
      
      // Get canvas data and draw scaled version
      const canvasDataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 2 // Higher quality
      });
      
      const img = new Image();
      img.onload = () => {
        // Draw the scaled vision board
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Add subtle overlay text for motivation (optional)
        if (preset.height > scaledHeight + 100) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('My Vision', preset.width / 2, y + scaledHeight + 50);
        }
        
        // Convert to blob and create preview
        tempCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setIsGenerating(false);
            
            toast({
              title: "Wallpaper Generated!",
              description: `${preset.name} wallpaper is ready for download.`
            });
          }
        }, 'image/png', 1.0);
      };
      
      img.src = canvasDataURL;
      
    } catch (error) {
      console.error('Error generating wallpaper:', error);
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: "Failed to generate mobile wallpaper. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadWallpaper = () => {
    if (!previewUrl) return;
    
    const preset = WALLPAPER_PRESETS[selectedPreset as keyof typeof WALLPAPER_PRESETS];
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `vision-board-wallpaper-${preset.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: "Your mobile wallpaper is downloading."
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Smartphone className="w-4 h-4" />
          Mobile Wallpaper
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Generate Mobile Wallpaper
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Device Preset</label>
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WALLPAPER_PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {preset.name} ({preset.width}×{preset.height})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={generateWallpaper} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Generate Preview
                </div>
              )}
            </Button>

            {previewUrl && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative max-h-40 overflow-hidden rounded border">
                    <img 
                      src={previewUrl} 
                      alt="Wallpaper preview" 
                      className="w-full h-auto object-contain"
                    />
                  </div>
                  <Button 
                    onClick={downloadWallpaper}
                    className="w-full gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Wallpaper
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>Tip:</strong> Use this wallpaper as your phone background for daily motivation</p>
            <p>🎯 See your goals every time you check your phone</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}