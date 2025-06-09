import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX,
  Settings,
  Star,
  RotateCcw
} from "lucide-react";

interface SoundscapeParameters {
  id: string;
  name: string;
  description: string;
  binauralFrequency: number;
  baseFrequency: number;
  beatType: string;
  ambientLayers: AmbientLayer[];
  volume: number;
  fadeInDuration: number;
  totalDuration: number;
  emotionalTarget: string;
  purpose: string;
}

interface AmbientLayer {
  type: string;
  volume: number;
  frequency?: number;
}

export default function SoundscapePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentParameters, setCurrentParameters] = useState<SoundscapeParameters | null>(null);
  const [volume, setVolume] = useState([0.7]);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState('relaxation');
  
  const { toast } = useToast();
  
  // Web Audio API references
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);
  const noiseBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const startTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<number | null>(null);

  const purposes = [
    { value: 'meditation', label: 'Meditation', emoji: '🧘' },
    { value: 'sleep', label: 'Sleep', emoji: '😴' },
    { value: 'focus', label: 'Focus', emoji: '🎯' },
    { value: 'relaxation', label: 'Relaxation', emoji: '🌊' },
    { value: 'energy', label: 'Energy', emoji: '⚡' }
  ];

  // Initialize Web Audio API
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Generate AI-powered soundscape parameters
  const generateSoundscape = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/soundscape/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: selectedPurpose,
          currentEmotionalState: 'neutral' // Could be detected from user input
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      setCurrentParameters(data);
      toast({
        title: "Soundscape Generated",
        description: `Created personalized ${selectedPurpose} soundscape`,
      });
    } catch (error) {
      console.error('Error generating soundscape:', error);
      // Use fallback parameters for demo
      const fallbackParameters = createFallbackParameters(selectedPurpose);
      setCurrentParameters(fallbackParameters);
      toast({
        title: "Using Default Soundscape",
        description: "AI generation unavailable, using optimized defaults",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Create fallback parameters when AI is unavailable
  const createFallbackParameters = (purpose: string): SoundscapeParameters => {
    const configs = {
      meditation: {
        binauralFrequency: 8,
        baseFrequency: 440,
        beatType: 'alpha',
        ambientLayers: [
          { type: 'forest', volume: 0.6 },
          { type: 'brown_noise', volume: 0.3, frequency: 200 }
        ]
      },
      sleep: {
        binauralFrequency: 3,
        baseFrequency: 200,
        beatType: 'delta',
        ambientLayers: [
          { type: 'rain', volume: 0.5 },
          { type: 'brown_noise', volume: 0.4, frequency: 150 }
        ]
      },
      focus: {
        binauralFrequency: 15,
        baseFrequency: 528,
        beatType: 'beta',
        ambientLayers: [
          { type: 'white_noise', volume: 0.4, frequency: 1000 },
          { type: 'ocean', volume: 0.3 }
        ]
      }
    };

    const config = configs[purpose as keyof typeof configs] || configs.meditation;
    
    return {
      id: `soundscape_${Date.now()}`,
      name: `${config.beatType} ${purpose} Soundscape`,
      description: `Personalized ${purpose} audio experience`,
      ...config,
      volume: 0.7,
      fadeInDuration: 10,
      totalDuration: 15,
      emotionalTarget: 'calm',
      purpose
    };
  };

  // Generate noise buffer for ambient sounds
  const createNoiseBuffer = (type: string, frequency?: number): AudioBuffer | null => {
    if (!audioContextRef.current) return null;

    const bufferSize = audioContextRef.current.sampleRate * 2; // 2 seconds
    const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      switch (type) {
        case 'white_noise':
          output[i] = Math.random() * 2 - 1;
          break;
        case 'brown_noise':
          output[i] = (Math.random() * 2 - 1) * Math.pow(i / bufferSize, 0.5);
          break;
        case 'pink_noise':
          output[i] = (Math.random() * 2 - 1) * Math.pow(i / bufferSize, 0.25);
          break;
        case 'rain':
          output[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.01);
          break;
        case 'ocean':
          output[i] = Math.sin(i * 0.001) * (Math.random() * 0.5 + 0.5);
          break;
        default:
          output[i] = Math.random() * 2 - 1;
      }
    }

    return buffer;
  };

  // Start playing the soundscape
  const startSoundscape = () => {
    if (!currentParameters || !audioContextRef.current) return;

    initAudioContext();
    
    const ctx = audioContextRef.current;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(
      currentParameters.volume * volume[0], 
      ctx.currentTime + currentParameters.fadeInDuration
    );

    // Create binaural beats
    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();

    leftOsc.frequency.setValueAtTime(currentParameters.baseFrequency, ctx.currentTime);
    rightOsc.frequency.setValueAtTime(
      currentParameters.baseFrequency + currentParameters.binauralFrequency, 
      ctx.currentTime
    );

    leftGain.gain.setValueAtTime(0.3, ctx.currentTime);
    rightGain.gain.setValueAtTime(0.3, ctx.currentTime);

    // Connect binaural beats
    const merger = ctx.createChannelMerger(2);
    leftOsc.connect(leftGain).connect(merger, 0, 0);
    rightOsc.connect(rightGain).connect(merger, 0, 1);
    merger.connect(masterGain);

    oscillatorsRef.current = [leftOsc, rightOsc];
    gainNodesRef.current = [masterGain];

    // Add ambient layers
    currentParameters.ambientLayers.forEach((layer) => {
      if (layer.type.includes('noise') || ['rain', 'ocean', 'forest'].includes(layer.type)) {
        const buffer = createNoiseBuffer(layer.type, layer.frequency);
        if (buffer) {
          const source = ctx.createBufferSource();
          const layerGain = ctx.createGain();
          
          source.buffer = buffer;
          source.loop = true;
          layerGain.gain.setValueAtTime(layer.volume, ctx.currentTime);
          
          source.connect(layerGain).connect(masterGain);
          source.start();
        }
      }
    });

    // Start oscillators
    leftOsc.start();
    rightOsc.start();

    setIsPlaying(true);
    startTimeRef.current = ctx.currentTime;
    startProgressTracking();
  };

  // Stop the soundscape
  const stopSoundscape = () => {
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
    });
    
    oscillatorsRef.current = [];
    gainNodesRef.current = [];
    setIsPlaying(false);
    setProgress(0);
    stopProgressTracking();
  };

  // Track playback progress
  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(() => {
      if (audioContextRef.current && currentParameters) {
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        const progressPercent = (elapsed / (currentParameters.totalDuration * 60)) * 100;
        
        setProgress(Math.min(progressPercent, 100));
        
        if (progressPercent >= 100) {
          stopSoundscape();
        }
      }
    }, 1000);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSoundscape();
      stopProgressTracking();
    };
  }, []);

  // Volume control
  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (isPlaying && gainNodesRef.current.length > 0) {
      gainNodesRef.current.forEach(gain => {
        gain.gain.setValueAtTime(
          (currentParameters?.volume || 1) * newVolume[0], 
          audioContextRef.current?.currentTime || 0
        );
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (gainNodesRef.current.length > 0) {
      const targetVolume = isMuted ? volume[0] : 0;
      gainNodesRef.current.forEach(gain => {
        gain.gain.setValueAtTime(
          targetVolume, 
          audioContextRef.current?.currentTime || 0
        );
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎵 Comfort Soundscape
          {currentParameters && (
            <Badge variant="secondary">{currentParameters.beatType}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Purpose Selection */}
        <div className="grid grid-cols-3 gap-2">
          {purposes.map((purpose) => (
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
        {currentParameters && (
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm">{currentParameters.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {currentParameters.description}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {currentParameters.binauralFrequency}Hz
              </Badge>
              <Badge variant="outline" className="text-xs">
                {currentParameters.totalDuration}min
              </Badge>
            </div>
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={isPlaying ? "destructive" : "default"}
            size="sm"
            onClick={isPlaying ? stopSoundscape : startSoundscape}
            disabled={!currentParameters}
          >
            {isPlaying ? (
              <Square className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          
          <div className="flex-1">
            <Slider
              value={volume}
              onValueChange={handleVolumeChange}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Progress Bar */}
        {isPlaying && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}