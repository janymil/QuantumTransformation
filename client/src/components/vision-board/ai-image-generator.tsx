import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Wand2, Download, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AIImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
}

const STYLE_PRESETS = [
  { id: 'realistic', name: 'Realistic', prompt: 'photorealistic, high quality, detailed' },
  { id: 'artistic', name: 'Artistic', prompt: 'artistic, creative, beautiful composition' },
  { id: 'minimalist', name: 'Minimalist', prompt: 'minimalist, clean, simple, modern' },
  { id: 'inspirational', name: 'Inspirational', prompt: 'uplifting, motivational, bright, positive energy' },
  { id: 'luxury', name: 'Luxury', prompt: 'luxurious, elegant, high-end, sophisticated' },
  { id: 'nature', name: 'Nature', prompt: 'natural, organic, peaceful, serene landscape' }
];

const QUICK_PROMPTS = [
  'Successful person in modern office',
  'Beautiful luxury home with garden',
  'Person exercising and healthy lifestyle',
  'Financial success and wealth symbols',
  'Happy family spending time together',
  'Travel destination paradise beach',
  'Professional achievement celebration',
  'Peaceful meditation and wellness'
];

export default function AIImageGenerator({ onImageGenerated }: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('inspirational');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Enter Description",
        description: "Please describe the image you want to generate.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const stylePreset = STYLE_PRESETS.find(s => s.id === selectedStyle);
      const fullPrompt = `${prompt}, ${stylePreset?.prompt || ''}`;
      
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          size: '1024x1024',
          quality: 'standard'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();

      if (data.imageUrl) {
        setGeneratedImages(prev => [data.imageUrl, ...prev]);
        toast({
          title: "Image Generated!",
          description: "Your custom image is ready to use."
        });
      } else {
        throw new Error('No image URL received');
      }
      
    } catch (error: any) {
      console.error('Error generating image:', error);
      
      if (error.message?.includes('429') || error.message?.includes('limit')) {
        toast({
          title: "Usage Limit Reached",
          description: "You've reached your daily AI image generation limit. Upgrade to premium for more generations.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "Failed to generate image. Please try again with a different description.",
          variant: "destructive"
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const addImageToBoard = (imageUrl: string) => {
    onImageGenerated(imageUrl);
    setIsOpen(false);
    toast({
      title: "Image Added",
      description: "AI-generated image added to your vision board."
    });
  };

  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "AI-generated image is downloading."
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wand2 className="w-4 h-4" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            AI Image Generator
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Describe Your Vision</label>
            <Textarea 
              placeholder="Describe the image you want to create (e.g., 'A person achieving their dream job', 'Luxury house with ocean view')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Quick Prompts */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quick Ideas</label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((quickPrompt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto p-2 text-left justify-start"
                  onClick={() => setPrompt(quickPrompt)}
                >
                  {quickPrompt}
                </Button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Art Style</label>
            <div className="grid grid-cols-3 gap-2">
              {STYLE_PRESETS.map((style) => (
                <Button
                  key={style.id}
                  variant={selectedStyle === style.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStyle(style.id)}
                  className="text-xs"
                >
                  {style.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateImage} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Image...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Generate Image ($0.04)
              </div>
            )}
          </Button>

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-3 block">Generated Images</label>
              <div className="grid grid-cols-1 gap-4">
                {generatedImages.map((imageUrl, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <img 
                          src={imageUrl} 
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-48 object-cover rounded border"
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => addImageToBoard(imageUrl)}
                            className="flex-1 gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add to Board
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => downloadImage(imageUrl)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Usage Info */}
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted rounded">
            <p>💡 <strong>Tips for better results:</strong></p>
            <p>• Be specific about details (colors, setting, mood)</p>
            <p>• Include emotional words (happy, confident, peaceful)</p>
            <p>• Mention the context (office, home, nature, etc.)</p>
            <p>• Each generation costs $0.04 and counts toward your daily AI limit</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}