import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Volume2, DollarSign, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function ElevenLabsVoiceTest() {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voices, setVoices] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [costEstimate, setCostEstimate] = useState<any>(null);
  const { toast } = useToast();

  // Load available voices
  const loadVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const response = await apiRequest('/api/elevenlabs/voices');
      setVoices(response.voices || []);
      
      // Set default voice if available
      if (response.voices && response.voices.length > 0) {
        setSelectedVoice(response.voices[0].voice_id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load voices. Please check your ElevenLabs API key.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // Load usage statistics
  const loadUsageStats = async () => {
    try {
      const stats = await apiRequest('/api/elevenlabs/usage-stats');
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  // Estimate cost for current text
  const estimateCost = async () => {
    if (!text.trim()) return;
    
    try {
      const estimate = await apiRequest('/api/elevenlabs/cost-estimate', {
        method: 'POST',
        body: JSON.stringify({
          text: text.trim(),
          voice_id: selectedVoice,
          subscription_tier: 'free'
        }),
      });
      setCostEstimate(estimate);
    } catch (error) {
      console.error('Error estimating cost:', error);
    }
  };

  // Generate affirmation audio
  const generateAffirmationAudio = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to convert to speech.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVoice) {
      toast({
        title: "Error",
        description: "Please select a voice.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/elevenlabs/generate-affirmation', {
        method: 'POST',
        body: JSON.stringify({
          text: text.trim(),
          voice_id: selectedVoice
        }),
      });

      if (response.success) {
        setGeneratedAudio(response.audioData);
        toast({
          title: "Success",
          description: `Audio generated! Cost: $${response.cost.toFixed(4)}, Characters: ${response.charactersUsed}`,
        });
        
        // Refresh usage stats
        loadUsageStats();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate audio.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Play generated audio
  const playAudio = () => {
    if (generatedAudio) {
      const audio = new Audio(generatedAudio);
      audio.play().catch(console.error);
    }
  };

  // Load voices on component mount
  useEffect(() => {
    loadVoices();
    loadUsageStats();
  }, []);

  // Update cost estimate when text changes
  useEffect(() => {
    if (text.trim()) {
      estimateCost();
    }
  }, [text, selectedVoice]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            ElevenLabs Voice Test
          </CardTitle>
          <CardDescription>
            Test ElevenLabs voice cloning and text-to-speech for affirmations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Selection */}
          <div className="space-y-2">
            <Label htmlFor="voice-select">Select Voice</Label>
            <div className="flex gap-2">
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choose a voice..." />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.voice_id} value={voice.voice_id}>
                      {voice.name} ({voice.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={loadVoices}
                disabled={isLoadingVoices}
              >
                {isLoadingVoices && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Refresh
              </Button>
            </div>
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="text-input">Affirmation Text</Label>
            <Textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your affirmation text here... (e.g., 'I am confident and capable of achieving my financial goals.')"
              className="min-h-[100px]"
              maxLength={5000}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{text.length}/5000 characters</span>
              {costEstimate && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Est. Cost: ${costEstimate.estimatedCost.toFixed(4)}
                </Badge>
              )}
            </div>
          </div>

          {/* Cost Estimate Details */}
          {costEstimate && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Characters</div>
                    <div className="text-muted-foreground">{costEstimate.characterCount}</div>
                  </div>
                  <div>
                    <div className="font-medium">Monthly Limit</div>
                    <div className="text-muted-foreground">{costEstimate.monthlyLimit.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Within Limit</div>
                    <div className={costEstimate.withinLimit ? "text-green-600" : "text-red-600"}>
                      {costEstimate.withinLimit ? "Yes" : "No"}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Cost per Char</div>
                    <div className="text-muted-foreground">${costEstimate.costPerCharacter.toFixed(6)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button 
            onClick={generateAffirmationAudio}
            disabled={isGenerating || !text.trim() || !selectedVoice}
            className="w-full"
          >
            {isGenerating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Generate Affirmation Audio
          </Button>

          {/* Generated Audio */}
          {generatedAudio && (
            <Card className="bg-green-50 dark:bg-green-950">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Audio Generated Successfully
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Your affirmation is ready to play
                    </p>
                  </div>
                  <Button onClick={playAudio} variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Play Audio
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      {usageStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Statistics (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{usageStats.charactersUsed.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Characters Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">${usageStats.totalCost.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{usageStats.requestCount}</div>
                <div className="text-sm text-muted-foreground">Requests Made</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}