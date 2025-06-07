import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Smartphone, Tablet, Download, Eye, Palette } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { VisionBoard } from "./vision-board-types";

interface MobileWallpaperProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoard: VisionBoard;
}

interface WallpaperSettings {
  deviceType: 'iphone' | 'android' | 'ipad';
  style: 'modern' | 'classic' | 'minimal' | 'vibrant';
  includeText: boolean;
  includeImages: boolean;
  backgroundType: 'solid' | 'gradient' | 'image';
}

export default function MobileWallpaper({
  isOpen,
  onClose,
  currentBoard
}: MobileWallpaperProps) {
  const [settings, setSettings] = useState<WallpaperSettings>({
    deviceType: 'iphone',
    style: 'modern',
    includeText: true,
    includeImages: true,
    backgroundType: 'gradient'
  });
  const [generatedWallpaper, setGeneratedWallpaper] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate mobile wallpaper using existing backend endpoint
  const generateWallpaperMutation = useMutation({
    mutationFn: async (params: { visionBoard: VisionBoard; settings: WallpaperSettings }) => {
      const response = await fetch('/api/vision-board/generate-mobile-wallpaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          visionBoard: params.visionBoard,
          deviceType: params.settings.deviceType,
          style: params.settings.style,
          includeText: params.settings.includeText,
          includeImages: params.settings.includeImages,
          backgroundType: params.settings.backgroundType
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate wallpaper');
      }

      return response.json();
    },
    onSuccess: (result) => {
      setGeneratedWallpaper(result.wallpaperUrl);
      toast({
        title: "Wallpaper Generated",
        description: `Created ${settings.deviceType} wallpaper in ${settings.style} style`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGenerate = () => {
    if (currentBoard.canvasData.items.length === 0) {
      toast({
        title: "No Content",
        description: "Add some elements to your vision board first",
        variant: "destructive"
      });
      return;
    }

    generateWallpaperMutation.mutate({
      visionBoard: currentBoard,
      settings
    });
  };

  const downloadWallpaper = async () => {
    if (!generatedWallpaper) return;

    try {
      const response = await fetch(generatedWallpaper);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `vision-board-wallpaper-${settings.deviceType}-${Date.now()}.png`;
      link.click();
      
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Wallpaper saved to your device"
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download wallpaper",
        variant: "destructive"
      });
    }
  };

  const getDeviceInfo = (deviceType: string) => {
    switch (deviceType) {
      case 'iphone':
        return { name: 'iPhone', resolution: '1170×2532', icon: <Smartphone className="w-4 h-4" /> };
      case 'android':
        return { name: 'Android', resolution: '1080×2340', icon: <Smartphone className="w-4 h-4" /> };
      case 'ipad':
        return { name: 'iPad', resolution: '1620×2160', icon: <Tablet className="w-4 h-4" /> };
      default:
        return { name: 'Device', resolution: '', icon: <Smartphone className="w-4 h-4" /> };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-600" />
            Mobile Wallpaper Generator
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Device Settings
                </CardTitle>
                <CardDescription>
                  Choose your target device and style preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Device Type</Label>
                  <Select 
                    value={settings.deviceType} 
                    onValueChange={(value: 'iphone' | 'android' | 'ipad') => 
                      setSettings(prev => ({ ...prev, deviceType: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iphone">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          iPhone (1170×2532)
                        </div>
                      </SelectItem>
                      <SelectItem value="android">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Android (1080×2340)
                        </div>
                      </SelectItem>
                      <SelectItem value="ipad">
                        <div className="flex items-center gap-2">
                          <Tablet className="w-4 h-4" />
                          iPad (1620×2160)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Visual Style</Label>
                  <Select 
                    value={settings.style} 
                    onValueChange={(value: 'modern' | 'classic' | 'minimal' | 'vibrant') => 
                      setSettings(prev => ({ ...prev, style: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern & Clean</SelectItem>
                      <SelectItem value="classic">Classic & Elegant</SelectItem>
                      <SelectItem value="minimal">Minimal & Simple</SelectItem>
                      <SelectItem value="vibrant">Vibrant & Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Background Type</Label>
                  <Select 
                    value={settings.backgroundType} 
                    onValueChange={(value: 'solid' | 'gradient' | 'image') => 
                      setSettings(prev => ({ ...prev, backgroundType: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid Color</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="image">Original Background</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Content Options
                </CardTitle>
                <CardDescription>
                  Choose what to include in your wallpaper
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Include Text Elements</Label>
                  <Switch
                    checked={settings.includeText}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, includeText: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Include Images</Label>
                  <Switch
                    checked={settings.includeImages}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, includeImages: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button 
                onClick={handleGenerate}
                disabled={generateWallpaperMutation.isPending || currentBoard.canvasData.items.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {generateWallpaperMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Smartphone className="w-4 h-4 mr-2" />
                )}
                Generate Wallpaper
              </Button>

              {generatedWallpaper && (
                <Button 
                  onClick={downloadWallpaper}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Wallpaper
                </Button>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview
                </CardTitle>
                <CardDescription>
                  {getDeviceInfo(settings.deviceType).name} wallpaper preview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Device frame */}
                    <div className={`
                      relative border-4 border-gray-800 rounded-[2rem] overflow-hidden
                      ${settings.deviceType === 'ipad' ? 'w-64 h-80' : 'w-48 h-96'}
                    `}>
                      {generatedWallpaper ? (
                        <img
                          src={generatedWallpaper}
                          alt="Generated wallpaper"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-center p-4"
                          style={{ backgroundColor: currentBoard.canvasData.backgroundColor }}
                        >
                          <div className="text-gray-600">
                            <Smartphone className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Generate wallpaper to see preview</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Device info badge */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <Badge variant="secondary" className="text-xs">
                        {getDeviceInfo(settings.deviceType).icon}
                        <span className="ml-1">{getDeviceInfo(settings.deviceType).resolution}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generation info */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-2 text-purple-900">Wallpaper Features:</h4>
              <ul className="text-xs text-purple-800 space-y-1">
                <li>• Optimized for {getDeviceInfo(settings.deviceType).name} screens</li>
                <li>• High-resolution output ({getDeviceInfo(settings.deviceType).resolution})</li>
                <li>• Maintains aspect ratio and clarity</li>
                <li>• Includes your vision board elements</li>
                <li>• Ready for instant download and use</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}