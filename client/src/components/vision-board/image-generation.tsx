import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, Sparkles, Upload, Camera } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { VisionBoardItem, AIImageGenerationResult } from "./vision-board-types";

interface ImageGenerationProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (item: VisionBoardItem) => void;
  onImageUploaded: (item: VisionBoardItem) => void;
  onScreenCapture: () => void;
  isCapturingScreen: boolean;
}

export default function ImageGeneration({
  isOpen,
  onClose,
  onImageGenerated,
  onImageUploaded,
  onScreenCapture,
  isCapturingScreen
}: ImageGenerationProps) {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("standard");
  const [style, setStyle] = useState("vivid");
  const { toast } = useToast();

  // AI Image Generation using existing backend endpoint
  const generateImageMutation = useMutation({
    mutationFn: async (params: { prompt: string; size: string; quality: string; style: string }) => {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate image');
      }

      return response.json() as Promise<AIImageGenerationResult>;
    },
    onSuccess: (result) => {
      const newItem: VisionBoardItem = {
        id: Date.now().toString(),
        type: 'image',
        content: result.imageUrl,
        x: 150,
        y: 150,
        width: 250,
        height: 250,
        opacity: 1,
        zIndex: 1,
        visible: true,
        locked: false
      };

      onImageGenerated(newItem);
      setPrompt("");
      onClose();

      toast({
        title: "Image Generated Successfully",
        description: `Used ${result.model} - ${result.remainingRequests} requests remaining`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Image Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // File upload with BunnyCDN integration
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      return response.json();
    },
    onSuccess: (result) => {
      const newItem: VisionBoardItem = {
        id: Date.now().toString(),
        type: 'image',
        content: result.url,
        x: 150,
        y: 150,
        width: 250,
        height: 200,
        opacity: 1,
        zIndex: 1,
        visible: true,
        locked: false
      };

      onImageUploaded(newItem);
      onClose();

      toast({
        title: "Image Uploaded Successfully",
        description: "Image saved to BunnyCDN"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 10MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      uploadImageMutation.mutate(file);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for your image",
        variant: "destructive"
      });
      return;
    }

    generateImageMutation.mutate({
      prompt: prompt.trim(),
      size,
      quality,
      style
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            Add Images to Vision Board
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Image Generation Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-lg">AI Image Generation</h3>
              <Badge variant="secondary" className="text-xs">DALL-E 3</Badge>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt">Describe your vision</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A serene mountain landscape at sunrise with golden light reflecting on a calm lake, photorealistic style..."
                  className="mt-1 min-h-[100px]"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Image Size</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                      <SelectItem value="1024x1792">Portrait (1024×1792)</SelectItem>
                      <SelectItem value="1792x1024">Landscape (1792×1024)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quality</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="hd">HD (Higher Cost)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vivid">Vivid</SelectItem>
                      <SelectItem value="natural">Natural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 text-purple-900">Tips for better results:</h4>
                <ul className="text-xs text-purple-800 space-y-1">
                  <li>• Be specific about style, colors, and mood</li>
                  <li>• Include details like lighting, perspective, or art style</li>
                  <li>• Use descriptive adjectives (vibrant, ethereal, modern)</li>
                  <li>• Mention desired composition (close-up, wide shot, etc.)</li>
                </ul>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={generateImageMutation.isPending || !prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {generateImageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Image
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-sm text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Upload & Capture Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Upload or Capture</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-4">
                  Upload from device (Max 10MB)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploadImageMutation.isPending}
                >
                  {uploadImageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Choose File
                </Button>
              </div>

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-4">
                  Capture screen content
                </p>
                <Button 
                  variant="outline"
                  onClick={onScreenCapture}
                  disabled={isCapturingScreen}
                >
                  {isCapturingScreen ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  Screen Capture
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}