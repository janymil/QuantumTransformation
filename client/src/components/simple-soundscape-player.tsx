import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Square, 
  Volume2,
  Star,
  RotateCcw
} from "lucide-react";

export default function SimpleSoundscapePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState('relaxation');
  const [currentSoundscape, setCurrentSoundscape] = useState(null);
  const { toast } = useToast();

  const purposes = [
    { value: 'meditation', label: 'Meditation', emoji: '🧘' },
    { value: 'sleep', label: 'Sleep', emoji: '😴' },
    { value: 'focus', label: 'Focus', emoji: '🎯' },
    { value: 'relaxation', label: 'Relaxation', emoji: '🌊' },
    { value: 'energy', label: 'Energy', emoji: '⚡' }
  ];

  const generateSoundscape = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/soundscape/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: selectedPurpose,
          currentEmotionalState: 'neutral'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSoundscape(data);
        toast({
          title: "Soundscape Generated",
          description: `Created personalized ${selectedPurpose} soundscape`,
        });
      } else {
        // Use fallback for demo
        setCurrentSoundscape({
          id: `demo_${Date.now()}`,
          name: `${selectedPurpose} Soundscape`,
          description: `Personalized ${selectedPurpose} audio experience`,
          binauralFrequency: selectedPurpose === 'focus' ? 15 : 8,
          beatType: selectedPurpose === 'focus' ? 'beta' : 'alpha',
          totalDuration: 15
        });
        toast({
          title: "Demo Soundscape Generated",
          description: "Using default parameters for demonstration",
        });
      }
    } catch (error) {
      console.error('Error generating soundscape:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate soundscape. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    if (!currentSoundscape) {
      toast({
        title: "No Soundscape",
        description: "Generate a soundscape first",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      toast({
        title: "Soundscape Stopped",
        description: "Audio playback stopped",
      });
    } else {
      setIsPlaying(true);
      toast({
        title: "Soundscape Playing",
        description: `Playing ${currentSoundscape.name}`,
      });
      
      // Simulate playback duration
      setTimeout(() => {
        setIsPlaying(false);
        toast({
          title: "Session Complete",
          description: "Soundscape session finished",
        });
      }, 10000); // 10 second demo
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎵 Comfort Soundscape
          {currentSoundscape && (
            <Badge variant="secondary">{currentSoundscape.beatType}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Purpose Selection */}
        <div className="grid grid-cols-2 gap-2">
          {purposes.slice(0, 4).map((purpose) => (
            <Button
              key={purpose.value}
              variant={selectedPurpose === purpose.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPurpose(purpose.value)}
              className="text-xs"
            >
              {purpose.emoji} {purpose.label}
            </Button>
          ))}
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generateSoundscape} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Star className="w-4 h-4 mr-2" />
              Generate Soundscape
            </>
          )}
        </Button>

        {/* Current Soundscape Info */}
        {currentSoundscape && (
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm">{currentSoundscape.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {currentSoundscape.description}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {currentSoundscape.binauralFrequency}Hz
              </Badge>
              <Badge variant="outline" className="text-xs">
                {currentSoundscape.totalDuration}min
              </Badge>
            </div>
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={isPlaying ? "destructive" : "default"}
            size="sm"
            onClick={togglePlayback}
            disabled={!currentSoundscape}
            className="flex-1"
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Play
              </>
            )}
          </Button>
          
          <Button variant="ghost" size="sm">
            <Volume2 className="w-4 h-4" />
          </Button>
        </div>

        {isPlaying && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Playing personalized {selectedPurpose} soundscape...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}