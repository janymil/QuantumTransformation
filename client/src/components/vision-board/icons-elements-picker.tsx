import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, Star, Trophy, Target, Crown, Zap, Sparkles, Sun, Moon, Flame,
  Car, Home, Plane, Camera, Music, Book, Coffee, Gift, Gem, Shield,
  TrendingUp, DollarSign, MapPin, Clock, Calendar, Briefcase, Users, 
  Smile, ThumbsUp, Eye, Brain, Lightbulb, Rocket, Diamond, Medal,
  Mountain, TreePine, Waves, CloudRain, Flower, Leaf, Fish, Bird,
  Circle, Square, Triangle, Hexagon, Octagon, Plus, Minus, X,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronUp, ChevronDown
} from "lucide-react";
import { VisionBoardItem } from "./vision-board-types";

interface IconsElementsPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onElementAdded: (element: VisionBoardItem) => void;
}

interface IconData {
  name: string;
  icon: React.ReactNode;
  category: string;
}

interface ElementTemplate {
  name: string;
  type: 'shape' | 'icon' | 'sticker';
  content: string;
  defaultColor: string;
  category: string;
}

export default function IconsElementsPicker({
  isOpen,
  onClose,
  onElementAdded
}: IconsElementsPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState("goals");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [selectedSize, setSelectedSize] = useState(60);
  const [selectedElement, setSelectedElement] = useState<IconData | ElementTemplate | null>(null);
  const { toast } = useToast();

  // Icon categories and data
  const iconCategories = {
    goals: [
      { name: "Target", icon: <Target className="w-full h-full" />, category: "goals" },
      { name: "Trophy", icon: <Trophy className="w-full h-full" />, category: "goals" },
      { name: "Star", icon: <Star className="w-full h-full" />, category: "goals" },
      { name: "Crown", icon: <Crown className="w-full h-full" />, category: "goals" },
      { name: "Medal", icon: <Medal className="w-full h-full" />, category: "goals" },
      { name: "Diamond", icon: <Diamond className="w-full h-full" />, category: "goals" },
      { name: "Rocket", icon: <Rocket className="w-full h-full" />, category: "goals" },
      { name: "TrendingUp", icon: <TrendingUp className="w-full h-full" />, category: "goals" }
    ],
    lifestyle: [
      { name: "Home", icon: <Home className="w-full h-full" />, category: "lifestyle" },
      { name: "Car", icon: <Car className="w-full h-full" />, category: "lifestyle" },
      { name: "Plane", icon: <Plane className="w-full h-full" />, category: "lifestyle" },
      { name: "Camera", icon: <Camera className="w-full h-full" />, category: "lifestyle" },
      { name: "Music", icon: <Music className="w-full h-full" />, category: "lifestyle" },
      { name: "Coffee", icon: <Coffee className="w-full h-full" />, category: "lifestyle" },
      { name: "Book", icon: <Book className="w-full h-full" />, category: "lifestyle" },
      { name: "Gift", icon: <Gift className="w-full h-full" />, category: "lifestyle" }
    ],
    emotions: [
      { name: "Heart", icon: <Heart className="w-full h-full" />, category: "emotions" },
      { name: "Smile", icon: <Smile className="w-full h-full" />, category: "emotions" },
      { name: "ThumbsUp", icon: <ThumbsUp className="w-full h-full" />, category: "emotions" },
      { name: "Sparkles", icon: <Sparkles className="w-full h-full" />, category: "emotions" },
      { name: "Zap", icon: <Zap className="w-full h-full" />, category: "emotions" },
      { name: "Flame", icon: <Flame className="w-full h-full" />, category: "emotions" },
      { name: "Sun", icon: <Sun className="w-full h-full" />, category: "emotions" },
      { name: "Eye", icon: <Eye className="w-full h-full" />, category: "emotions" }
    ],
    business: [
      { name: "Briefcase", icon: <Briefcase className="w-full h-full" />, category: "business" },
      { name: "DollarSign", icon: <DollarSign className="w-full h-full" />, category: "business" },
      { name: "Users", icon: <Users className="w-full h-full" />, category: "business" },
      { name: "Brain", icon: <Brain className="w-full h-full" />, category: "business" },
      { name: "Lightbulb", icon: <Lightbulb className="w-full h-full" />, category: "business" },
      { name: "Calendar", icon: <Calendar className="w-full h-full" />, category: "business" },
      { name: "Clock", icon: <Clock className="w-full h-full" />, category: "business" },
      { name: "Shield", icon: <Shield className="w-full h-full" />, category: "business" }
    ],
    nature: [
      { name: "TreePine", icon: <TreePine className="w-full h-full" />, category: "nature" },
      { name: "Mountain", icon: <Mountain className="w-full h-full" />, category: "nature" },
      { name: "Waves", icon: <Waves className="w-full h-full" />, category: "nature" },
      { name: "Flower", icon: <Flower className="w-full h-full" />, category: "nature" },
      { name: "Leaf", icon: <Leaf className="w-full h-full" />, category: "nature" },
      { name: "Bird", icon: <Bird className="w-full h-full" />, category: "nature" },
      { name: "Fish", icon: <Fish className="w-full h-full" />, category: "nature" },
      { name: "CloudRain", icon: <CloudRain className="w-full h-full" />, category: "nature" }
    ],
    shapes: [
      { name: "Circle", icon: <Circle className="w-full h-full" />, category: "shapes" },
      { name: "Square", icon: <Square className="w-full h-full" />, category: "shapes" },
      { name: "Triangle", icon: <Triangle className="w-full h-full" />, category: "shapes" },
      { name: "Hexagon", icon: <Hexagon className="w-full h-full" />, category: "shapes" },
      { name: "Plus", icon: <Plus className="w-full h-full" />, category: "shapes" },
      { name: "ArrowUp", icon: <ArrowUp className="w-full h-full" />, category: "shapes" },
      { name: "ArrowRight", icon: <ArrowRight className="w-full h-full" />, category: "shapes" },
      { name: "ChevronUp", icon: <ChevronUp className="w-full h-full" />, category: "shapes" }
    ]
  };

  // Element templates (shapes and special elements)
  const elementTemplates: ElementTemplate[] = [
    { name: "Rectangle", type: "shape", content: "rectangle", defaultColor: "#3B82F6", category: "basic" },
    { name: "Circle", type: "shape", content: "circle", defaultColor: "#10B981", category: "basic" },
    { name: "Rounded Rectangle", type: "shape", content: "rounded-rectangle", defaultColor: "#F59E0B", category: "basic" },
    { name: "Triangle", type: "shape", content: "triangle", defaultColor: "#EF4444", category: "basic" },
    { name: "Diamond", type: "shape", content: "diamond", defaultColor: "#8B5CF6", category: "basic" },
    { name: "Heart Shape", type: "shape", content: "heart", defaultColor: "#EC4899", category: "special" },
    { name: "Star Shape", type: "shape", content: "star", defaultColor: "#F59E0B", category: "special" },
    { name: "Arrow", type: "shape", content: "arrow", defaultColor: "#6B7280", category: "special" }
  ];

  const colorPresets = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899",
    "#06B6D4", "#84CC16", "#F97316", "#DC2626", "#7C3AED", "#DB2777",
    "#000000", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#FFFFFF"
  ];

  const handleIconClick = (iconData: IconData) => {
    const element: VisionBoardItem = {
      id: Date.now().toString(),
      type: 'sticker',
      content: iconData.name,
      x: Math.random() * 300 + 100,
      y: Math.random() * 200 + 100,
      width: selectedSize,
      height: selectedSize,
      color: selectedColor,
      opacity: 1,
      zIndex: 1,
      visible: true,
      locked: false
    };

    onElementAdded(element);
    toast({
      title: "Icon Added",
      description: `${iconData.name} icon added to your vision board`
    });
  };

  const handleElementClick = (elementTemplate: ElementTemplate) => {
    const element: VisionBoardItem = {
      id: Date.now().toString(),
      type: elementTemplate.type === 'shape' ? 'shape' : 'sticker',
      content: elementTemplate.content,
      x: Math.random() * 300 + 100,
      y: Math.random() * 200 + 100,
      width: selectedSize,
      height: selectedSize,
      backgroundColor: selectedColor,
      borderRadius: elementTemplate.content.includes('rounded') ? 12 : 0,
      opacity: 1,
      zIndex: 1,
      visible: true,
      locked: false
    };

    onElementAdded(element);
    toast({
      title: "Element Added",
      description: `${elementTemplate.name} added to your vision board`
    });
  };

  const renderIconGrid = (icons: IconData[]) => (
    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
      {icons.map((iconData, index) => (
        <button
          key={index}
          onClick={() => handleIconClick(iconData)}
          className="aspect-square p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          style={{ color: selectedColor }}
        >
          <div className="w-full h-full flex items-center justify-center">
            {iconData.icon}
          </div>
          <div className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {iconData.name}
          </div>
        </button>
      ))}
    </div>
  );

  const renderElementGrid = (elements: ElementTemplate[]) => (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {elements.map((elementTemplate, index) => (
        <button
          key={index}
          onClick={() => handleElementClick(elementTemplate)}
          className="aspect-square p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
        >
          <div 
            className="w-full h-full rounded"
            style={{ 
              backgroundColor: selectedColor,
              borderRadius: elementTemplate.content.includes('circle') ? '50%' : 
                           elementTemplate.content.includes('rounded') ? '8px' : '0px'
            }}
          />
          <div className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {elementTemplate.name}
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Icons & Elements Library
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customization Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customization</CardTitle>
              <CardDescription>
                Adjust color and size before adding elements to your board
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Color Selection */}
                <div>
                  <Label>Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-12 h-10 p-1 rounded"
                    />
                    <Input
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="flex-1"
                      placeholder="#3B82F6"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded border-2 ${
                          selectedColor === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <Label>Size: {selectedSize}px</Label>
                  <Slider
                    value={[selectedSize]}
                    onValueChange={(value) => setSelectedSize(value[0])}
                    min={20}
                    max={200}
                    step={5}
                    className="mt-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Small (20px)</span>
                    <span>Large (200px)</span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium">Preview:</Label>
                <div 
                  className="flex items-center justify-center border rounded"
                  style={{ 
                    width: Math.min(selectedSize, 60), 
                    height: Math.min(selectedSize, 60),
                    color: selectedColor 
                  }}
                >
                  <Star className="w-full h-full" />
                </div>
                <Badge variant="secondary">
                  {selectedSize}×{selectedSize}px
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Icons and Elements */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
              <TabsTrigger value="emotions">Emotions</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="nature">Nature</TabsTrigger>
              <TabsTrigger value="shapes">Shapes</TabsTrigger>
            </TabsList>

            {Object.entries(iconCategories).map(([category, icons]) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize">{category} Icons</CardTitle>
                    <CardDescription>
                      Click any icon to add it to your vision board
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderIconGrid(icons)}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}

            <TabsContent value="shapes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Shapes</CardTitle>
                  <CardDescription>
                    Add geometric shapes and basic elements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderElementGrid(elementTemplates.filter(e => e.category === 'basic'))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Special Shapes</CardTitle>
                  <CardDescription>
                    Hearts, stars, and decorative elements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderElementGrid(elementTemplates.filter(e => e.category === 'special'))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shape Icons</CardTitle>
                  <CardDescription>
                    Outline shapes and symbols
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderIconGrid(iconCategories.shapes)}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Usage Tips */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold mb-2 text-purple-900">Tips for Using Icons & Elements:</h4>
            <ul className="text-xs text-purple-800 space-y-1">
              <li>• Choose colors that match your vision board theme</li>
              <li>• Use consistent sizes for related elements</li>
              <li>• Mix icons with text and images for visual variety</li>
              <li>• Icons can represent goals, emotions, or aspirations</li>
              <li>• Double-click any element on the board to edit it later</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}