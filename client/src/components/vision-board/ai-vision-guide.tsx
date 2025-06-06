import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Target, 
  Lightbulb, 
  Layout, 
  Palette,
  Image,
  Type,
  Clock,
  CheckCircle,
  Loader2,
  Brain,
  Heart,
  Star
} from 'lucide-react';

interface VisionGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PersonalizedGuide {
  goalAnalysis: {
    primaryGoals: string[];
    timeframe: string;
    motivationType: string;
    emotionalTheme: string;
  };
  imageRecommendations: {
    category: string;
    suggestions: string[];
    reasoning: string;
  }[];
  layoutSuggestions: {
    style: string;
    description: string;
    positioning: string[];
  };
  textElements: {
    affirmations: string[];
    powerWords: string[];
    deadlines: string[];
  };
  colorTheme: {
    recommended: string;
    reasoning: string;
    alternatives: string[];
  };
  manifestationTips: string[];
  actionSteps: string[];
}

export default function AIVisionGuide({ isOpen, onClose }: VisionGuideProps) {
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [personalizedGuide, setPersonalizedGuide] = useState<PersonalizedGuide | null>(null);
  const [activeTab, setActiveTab] = useState('input');

  const generatePersonalizedGuide = async () => {
    if (!userInput.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/vision-board-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userGoals: userInput,
          requestType: 'vision_board_guide'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate personalized guide');
      }

      const data = await response.json();
      setPersonalizedGuide(data.guide);
      setActiveTab('guide');
    } catch (error) {
      console.error('Error generating guide:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetGuide = () => {
    setPersonalizedGuide(null);
    setUserInput('');
    setActiveTab('input');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">AI Vision Board Guide</CardTitle>
              <p className="text-muted-foreground text-sm">
                Get personalized recommendations powered by GPT-4o
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="input" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Share Your Goals
              </TabsTrigger>
              <TabsTrigger value="guide" disabled={!personalizedGuide} className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Your Personalized Guide
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tell me about your goals and dreams</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Share your aspirations, goals, timeline, and what success means to you. 
                    The more specific you are, the better I can customize your vision board guidance.
                  </p>
                </div>

                <Textarea
                  placeholder="Example: I want to start my own sustainable fashion business within 2 years. I'm passionate about environmental impact and want to create clothing that makes people feel confident while helping the planet. My goal is to launch with an online store, build a community of 10,000 followers, and eventually open a physical store in my city. I value creativity, authenticity, and making a positive difference..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="min-h-[200px] resize-none"
                />

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="w-4 h-4" />
                  <span>Include: Goals, timeline, values, emotions, and specific achievements you want</span>
                </div>

                <Button 
                  onClick={generatePersonalizedGuide}
                  disabled={!userInput.trim() || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      AI is analyzing your goals...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate My Personalized Guide
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="guide" className="mt-6">
              {personalizedGuide && (
                <div className="space-y-6">
                  {/* Goal Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Your Goal Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Primary Goals</h4>
                          <div className="flex flex-wrap gap-1">
                            {personalizedGuide.goalAnalysis.primaryGoals.map((goal, index) => (
                              <Badge key={index} variant="secondary">{goal}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Timeframe & Style</h4>
                          <p className="text-sm text-muted-foreground">
                            {personalizedGuide.goalAnalysis.timeframe} • {personalizedGuide.goalAnalysis.motivationType}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommended Theme */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Recommended Theme
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{personalizedGuide.colorTheme.recommended}</Badge>
                          <span className="text-sm text-muted-foreground">Best match for your goals</span>
                        </div>
                        <p className="text-sm">{personalizedGuide.colorTheme.reasoning}</p>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Alternative Themes</h4>
                          <div className="flex flex-wrap gap-1">
                            {personalizedGuide.colorTheme.alternatives.map((theme, index) => (
                              <Badge key={index} variant="outline">{theme}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Image Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        Image Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {personalizedGuide.imageRecommendations.map((category, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">{category.category}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{category.reasoning}</p>
                            <div className="space-y-1">
                              {category.suggestions.map((suggestion, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                                  {suggestion}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Layout Suggestions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layout className="w-5 h-5" />
                        Layout & Composition
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">{personalizedGuide.layoutSuggestions.style}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {personalizedGuide.layoutSuggestions.description}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Positioning Tips</h4>
                        <ul className="space-y-1">
                          {personalizedGuide.layoutSuggestions.positioning.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Text Elements */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Type className="w-5 h-5" />
                        Personalized Text Elements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            Affirmations
                          </h4>
                          <ul className="space-y-1">
                            {personalizedGuide.textElements.affirmations.map((affirmation, index) => (
                              <li key={index} className="text-sm italic">"{affirmation}"</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Power Words
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {personalizedGuide.textElements.powerWords.map((word, index) => (
                              <Badge key={index} variant="outline" className="text-xs">{word}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Key Dates
                          </h4>
                          <ul className="space-y-1">
                            {personalizedGuide.textElements.deadlines.map((deadline, index) => (
                              <li key={index} className="text-sm font-medium">{deadline}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Manifestation Tips */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Manifestation & Action Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">Manifestation Techniques</h4>
                          <ul className="space-y-2">
                            {personalizedGuide.manifestationTips.map((tip, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3">Next Action Steps</h4>
                          <ul className="space-y-2">
                            {personalizedGuide.actionSteps.map((step, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <Badge variant="outline" className="mt-0.5 text-xs px-2">
                                  {index + 1}
                                </Badge>
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={resetGuide} variant="outline">
                      Create New Guide
                    </Button>
                    <Button onClick={onClose} className="flex-1">
                      Start Creating My Vision Board
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}