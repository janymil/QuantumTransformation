import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Waves, Brain, Heart } from "lucide-react";
import AdvancedSoundscapePlayer from "@/components/advanced-soundscape-player";

function SoundscapePlayer() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg mr-4 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Personalized Soundscape Generator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Experience AI-generated binaural beats and ambient soundscapes designed specifically for your emotional state and therapeutic needs. 
            Our advanced Web Audio API creates real-time, personalized audio environments to enhance meditation, focus, and relaxation.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <Brain className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">AI-Powered Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Advanced AI analyzes your emotional state and therapeutic needs to generate optimal sound frequencies and binaural beat patterns.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <Waves className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Real-Time Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Web Audio API creates binaural beats, ambient layers, and therapeutic frequencies in real-time for maximum effectiveness.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Personalized Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Each soundscape is uniquely crafted based on your specific emotional needs, session purpose, and therapeutic goals.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Main Soundscape Player */}
        <div className="max-w-4xl mx-auto">
          <AdvancedSoundscapePlayer />
        </div>

        {/* Usage Guidelines */}
        <Card className="mt-8 border-amber-200/50 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-800 dark:text-amber-200">
              <Zap className="w-5 h-5 mr-2" />
              Optimal Usage Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Best Practices:</h4>
                <ul className="space-y-1 text-amber-800 dark:text-amber-200">
                  <li>• Use headphones for optimal binaural beat experience</li>
                  <li>• Start with lower volumes and adjust gradually</li>
                  <li>• Choose a quiet, comfortable environment</li>
                  <li>• Allow 10-20 minutes for full therapeutic effect</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Session Types:</h4>
                <ul className="space-y-1 text-amber-800 dark:text-amber-200">
                  <li>• <strong>Meditation:</strong> Deep relaxation and mindfulness</li>
                  <li>• <strong>Focus:</strong> Enhanced concentration and productivity</li>
                  <li>• <strong>Sleep:</strong> Gentle transition to restful sleep</li>
                  <li>• <strong>Anxiety Relief:</strong> Calming frequencies for stress reduction</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SoundscapePlayer;