import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wand2, 
  Sparkles, 
  Download, 
  Upload, 
  Palette, 
  Type, 
  Image as ImageIcon,
  Play,
  Pause,
  Volume2,
  Heart,
  Target,
  Zap,
  Star,
  Moon,
  Sun
} from 'lucide-react';

interface VisionBoardItem {
  id: string;
  type: 'text' | 'image' | 'shape';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: {
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    rotation?: number;
  };
}

export default function VisionTransformPage() {
  const [activeTab, setActiveTab] = useState('create');
  const [visionBoardItems, setVisionBoardItems] = useState<VisionBoardItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [affirmations] = useState([
    "I am manifesting my dream life with ease and joy",
    "Abundance flows to me from all directions",
    "I trust the process of life to bring me everything I desire",
    "My vision is becoming my reality",
    "I am worthy of all the success and happiness I desire"
  ]);

  const [currentAffirmation, setCurrentAffirmation] = useState(0);

  const lifeAreas = [
    { name: 'Health & Wellness', icon: Heart, color: 'bg-green-500' },
    { name: 'Career & Success', icon: Target, color: 'bg-blue-500' },
    { name: 'Relationships', icon: Star, color: 'bg-pink-500' },
    { name: 'Finances', icon: Zap, color: 'bg-yellow-500' },
    { name: 'Personal Growth', icon: Sparkles, color: 'bg-purple-500' },
    { name: 'Travel & Adventure', icon: Moon, color: 'bg-indigo-500' }
  ];

  const addTextElement = () => {
    const newItem: VisionBoardItem = {
      id: Date.now().toString(),
      type: 'text',
      content: 'Your Dream Text',
      x: Math.random() * 300,
      y: Math.random() * 300,
      width: 200,
      height: 50,
      style: {
        fontSize: 18,
        color: '#333333',
        backgroundColor: 'transparent'
      }
    };
    setVisionBoardItems([...visionBoardItems, newItem]);
  };

  const addShapeElement = (shape: string) => {
    const newItem: VisionBoardItem = {
      id: Date.now().toString(),
      type: 'shape',
      content: shape,
      x: Math.random() * 300,
      y: Math.random() * 300,
      width: 100,
      height: 100,
      style: {
        backgroundColor: '#e3f2fd',
        borderRadius: shape === 'circle' ? 50 : 8
      }
    };
    setVisionBoardItems([...visionBoardItems, newItem]);
  };

  const updateItemContent = (id: string, content: string) => {
    setVisionBoardItems(items =>
      items.map(item =>
        item.id === id ? { ...item, content } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setVisionBoardItems(items => items.filter(item => item.id !== id));
    setSelectedItem(null);
  };

  const playAffirmations = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      const interval = setInterval(() => {
        setCurrentAffirmation(prev => (prev + 1) % affirmations.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentAffirmation(prev => (prev + 1) % affirmations.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, affirmations.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-6 py-12 mx-auto max-w-7xl">
          <div className="text-center">
            <Wand2 className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Vision Transform
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Create powerful vision boards that transform your dreams into reality through AI-powered visualization
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 mx-auto max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="affirmations" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Affirmations
            </TabsTrigger>
            <TabsTrigger value="rituals" className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Daily Rituals
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Progress
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Toolbar */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={addTextElement} className="w-full justify-start">
                    <Type className="w-4 h-4 mr-2" />
                    Add Text
                  </Button>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Add Shapes</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addShapeElement('rectangle')}
                      >
                        Rectangle
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addShapeElement('circle')}
                      >
                        Circle
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Life Areas</p>
                    <div className="grid grid-cols-1 gap-2">
                      {lifeAreas.map((area) => (
                        <Badge
                          key={area.name}
                          variant="outline"
                          className="justify-start p-2 cursor-pointer hover:bg-muted"
                        >
                          <area.icon className="w-4 h-4 mr-2" />
                          {area.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full mb-2">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Save Board
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Canvas */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Your Vision Board</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    ref={canvasRef}
                    className="relative w-full h-96 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
                    style={{ minHeight: '400px' }}
                  >
                    {visionBoardItems.map((item) => (
                      <div
                        key={item.id}
                        className={`absolute cursor-pointer border-2 ${
                          selectedItem === item.id ? 'border-blue-500' : 'border-transparent'
                        } hover:border-blue-300 transition-colors`}
                        style={{
                          left: item.x,
                          top: item.y,
                          width: item.width,
                          height: item.height,
                          transform: `rotate(${item.style.rotation || 0}deg)`,
                        }}
                        onClick={() => setSelectedItem(item.id)}
                      >
                        {item.type === 'text' ? (
                          <div
                            className="w-full h-full flex items-center justify-center p-2"
                            style={{
                              fontSize: item.style.fontSize,
                              color: item.style.color,
                              backgroundColor: item.style.backgroundColor,
                              borderRadius: item.style.borderRadius,
                            }}
                          >
                            {selectedItem === item.id ? (
                              <Input
                                value={item.content}
                                onChange={(e) => updateItemContent(item.id, e.target.value)}
                                className="text-center border-none bg-transparent"
                                onBlur={() => setSelectedItem(null)}
                                autoFocus
                              />
                            ) : (
                              item.content
                            )}
                          </div>
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundColor: item.style.backgroundColor,
                              borderRadius: item.style.borderRadius,
                            }}
                          />
                        )}
                        
                        {selectedItem === item.id && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 w-6 h-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item.id);
                            }}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {visionBoardItems.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Start creating your vision board</p>
                          <p className="text-sm">Add text, images, and shapes to visualize your dreams</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Affirmations Tab */}
          <TabsContent value="affirmations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Personalized Affirmations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                  <div className="h-32 flex items-center justify-center">
                    <p className="text-2xl font-medium text-center leading-relaxed max-w-2xl">
                      "{affirmations[currentAffirmation]}"
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <Button
                      onClick={playAffirmations}
                      className="flex items-center gap-2"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isPlaying ? 'Pause' : 'Play'} Affirmations
                    </Button>
                    
                    <div className="flex gap-1">
                      {affirmations.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentAffirmation ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {affirmations.map((affirmation, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <p className="text-sm">{affirmation}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Rituals Tab */}
          <TabsContent value="rituals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="w-5 h-5" />
                    Morning Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Start your day by visualizing your goals and affirming your vision.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">View your vision board for 5 minutes</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Recite your affirmations</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Set intentions for the day</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="w-5 h-5" />
                    Evening Reflection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    End your day by reflecting on progress and setting tomorrow's intentions.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Review today's achievements</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Express gratitude</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Visualize tomorrow's success</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Vision Boards</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-blue-600">3</div>
                  <p className="text-sm text-muted-foreground">Created</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Daily Rituals</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-green-600">7</div>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Goals Achieved</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-purple-600">12</div>
                  <p className="text-sm text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Completed morning visualization routine for 7 days",
                    "Created new career-focused vision board",
                    "Achieved fitness goal visualization",
                    "Maintained daily affirmation practice"
                  ].map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm">{achievement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}