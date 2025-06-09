import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Volume2, Waves, Brain, Heart, Moon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SoundscapeConfig {
  name: string;
  description: string;
  binauralFrequency: number;
  baseFrequency: number;
  beatType: string;
  ambientRecommendations: Array<{
    type: string;
    volume: number;
    reasoning: string;
  }>;
  totalDuration: number;
}

interface AudioContextState {
  context: AudioContext | null;
  gainNode: GainNode | null;
  oscillators: (OscillatorNode | AudioBufferSourceNode)[];
  analyser: AnalyserNode | null;
}

export default function AdvancedSoundscapePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionType, setSessionType] = useState<string>("meditation");
  const [volume, setVolume] = useState([0.3]);
  const [duration, setDuration] = useState([20]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentConfig, setCurrentConfig] = useState<SoundscapeConfig | null>(null);
  
  const audioContextRef = useRef<AudioContextState>({
    context: null,
    gainNode: null,
    oscillators: [],
    analyser: null
  });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch AI-generated soundscape configuration
  const { data: soundscapeConfig, isLoading, refetch } = useQuery({
    queryKey: ['/api/soundscape/generate', sessionType],
    enabled: false,
  });

  // Session type configurations with icons
  const sessionTypes = [
    { value: "meditation", label: "Meditation", icon: Brain, color: "bg-purple-500" },
    { value: "sleep", label: "Sleep", icon: Moon, color: "bg-indigo-500" },
    { value: "focus", label: "Focus", icon: Waves, color: "bg-blue-500" },
    { value: "anxiety_relief", label: "Anxiety Relief", icon: Heart, color: "bg-green-500" }
  ];

  const currentSessionType = sessionTypes.find(type => type.value === sessionType);

  // Initialize Web Audio API
  const initializeAudioContext = () => {
    if (audioContextRef.current.context) return;

    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gainNode = context.createGain();
    const analyser = context.createAnalyser();
    
    gainNode.connect(analyser);
    analyser.connect(context.destination);
    gainNode.gain.value = volume[0];

    audioContextRef.current = {
      context,
      gainNode,
      oscillators: [],
      analyser
    };
  };

  // Generate binaural beats with Web Audio API
  const generateBinauralBeats = (leftFreq: number, rightFreq: number) => {
    const { context, gainNode } = audioContextRef.current;
    if (!context || !gainNode) return [];

    // Create stereo oscillators for binaural effect
    const leftOscillator = context.createOscillator();
    const rightOscillator = context.createOscillator();
    const leftGain = context.createGain();
    const rightGain = context.createGain();
    const merger = context.createChannelMerger(2);

    // Configure left channel
    leftOscillator.frequency.value = leftFreq;
    leftOscillator.type = 'sine';
    leftGain.gain.value = 0.5;
    
    // Configure right channel  
    rightOscillator.frequency.value = rightFreq;
    rightOscillator.type = 'sine';
    rightGain.gain.value = 0.5;

    // Connect audio graph
    leftOscillator.connect(leftGain);
    rightOscillator.connect(rightGain);
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);
    merger.connect(gainNode);

    return [leftOscillator, rightOscillator];
  };

  // Add ambient white noise layer
  const generateWhiteNoise = (noiseVolume: number = 0.1) => {
    const { context, gainNode } = audioContextRef.current;
    if (!context || !gainNode) return null;

    const bufferSize = context.sampleRate * 2;
    const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = context.createBufferSource();
    const noiseGain = context.createGain();
    
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    noiseGain.gain.value = noiseVolume;
    
    noiseSource.connect(noiseGain);
    noiseGain.connect(gainNode);

    return noiseSource;
  };

  // Start soundscape generation
  const startSoundscape = async () => {
    try {
      initializeAudioContext();
      
      // Resume audio context if suspended (required by browsers)
      if (audioContextRef.current.context?.state === 'suspended') {
        await audioContextRef.current.context.resume();
      }

      let config = currentConfig;
      
      // Generate AI configuration if not available
      if (!config) {
        await refetch();
        config = soundscapeConfig as SoundscapeConfig;
      }

      if (!config) {
        // Fallback configuration for immediate playback
        config = {
          name: `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session`,
          description: `Binaural beats optimized for ${sessionType}`,
          binauralFrequency: sessionType === 'meditation' ? 8 : sessionType === 'focus' ? 15 : 4,
          baseFrequency: 200,
          beatType: 'alpha',
          ambientRecommendations: [{ type: 'white_noise', volume: 0.1, reasoning: 'Ambient masking' }],
          totalDuration: duration[0] * 60
        };
      }

      setCurrentConfig(config);

      // Generate binaural beats
      const leftFreq = config.baseFrequency;
      const rightFreq = config.baseFrequency + config.binauralFrequency;
      const oscillators = generateBinauralBeats(leftFreq, rightFreq);
      
      // Add ambient white noise
      const whiteNoise = generateWhiteNoise(0.05);
      
      // Start all audio sources
      const allSources: (OscillatorNode | AudioBufferSourceNode)[] = [...oscillators];
      if (whiteNoise) allSources.push(whiteNoise);
      
      allSources.forEach(source => source.start());
      audioContextRef.current.oscillators = allSources;

      setIsPlaying(true);
      setTimeRemaining(duration[0] * 60);

      // Session timer
      sessionTimerRef.current = setTimeout(() => {
        stopSoundscape();
      }, duration[0] * 60 * 1000);

      // Countdown timer
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopSoundscape();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting soundscape:', error);
    }
  };

  // Stop soundscape
  const stopSoundscape = () => {
    // Stop all oscillators
    audioContextRef.current.oscillators.forEach(source => {
      try {
        if ('stop' in source) {
          source.stop();
        }
      } catch (e) {
        // Source already stopped
      }
    });
    
    audioContextRef.current.oscillators = [];
    
    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    setIsPlaying(false);
    setTimeRemaining(0);
  };

  // Update volume in real-time
  useEffect(() => {
    if (audioContextRef.current.gainNode) {
      audioContextRef.current.gainNode.gain.value = volume[0];
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSoundscape();
      if (audioContextRef.current.context) {
        audioContextRef.current.context.close();
      }
    };
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const Icon = currentSessionType?.icon || Brain;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg ${currentSessionType?.color} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">AI Binaural Soundscape</CardTitle>
              <CardDescription>
                {currentConfig?.description || "Personalized binaural beats and ambient soundscapes"}
              </CardDescription>
            </div>
          </div>
          {currentConfig && (
            <Badge variant="secondary" className="text-xs">
              {currentConfig.binauralFrequency}Hz {currentConfig.beatType}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Session Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Session Type</label>
          <Select value={sessionType} onValueChange={setSessionType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sessionTypes.map((type) => {
                const TypeIcon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <TypeIcon className="w-4 h-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center">
              <Volume2 className="w-4 h-4 mr-2" />
              Volume
            </label>
            <span className="text-sm text-muted-foreground">{Math.round(volume[0] * 100)}%</span>
          </div>
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={1}
            min={0}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Duration Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Duration</label>
            <span className="text-sm text-muted-foreground">{duration[0]} minutes</span>
          </div>
          <Slider
            value={duration}
            onValueChange={setDuration}
            max={60}
            min={5}
            step={5}
            className="w-full"
            disabled={isPlaying}
          />
        </div>

        {/* Time Display */}
        {timeRemaining > 0 && (
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-primary">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-muted-foreground">remaining</div>
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            size="lg"
            onClick={isPlaying ? stopSoundscape : startSoundscape}
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <><Square className="w-4 h-4 mr-2" /> Stop Session</>
            ) : (
              <><Play className="w-4 h-4 mr-2" /> Start Session</>
            )}
          </Button>
        </div>

        {/* Current Configuration Info */}
        {currentConfig && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Current Configuration</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Base Frequency: {currentConfig.baseFrequency}Hz</div>
              <div>Binaural Beat: {currentConfig.binauralFrequency}Hz ({currentConfig.beatType} waves)</div>
              <div>Ambient Layers: {currentConfig.ambientRecommendations.map(a => a.type).join(', ')}</div>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200/50 dark:border-amber-800/50">
          <div className="text-sm space-y-2">
            <div className="font-medium text-amber-900 dark:text-amber-100">For Best Results:</div>
            <ul className="text-amber-800 dark:text-amber-200 space-y-1 text-xs">
              <li>• Use headphones for optimal binaural beat experience</li>
              <li>• Find a quiet, comfortable environment</li>
              <li>• Close your eyes and focus on your breathing</li>
              <li>• Allow 10-15 minutes for brain entrainment to take effect</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}