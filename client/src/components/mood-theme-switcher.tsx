import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Palette, Sun, Moon, Heart, Zap, Leaf, Waves, Mountain, Flame } from 'lucide-react';

interface MoodTheme {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    card: string;
    border: string;
  };
  darkColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    card: string;
    border: string;
  };
  mood: string;
  benefits: string[];
}

const moodThemes: MoodTheme[] = [
  {
    id: 'energetic',
    name: 'Energetic',
    description: 'Bright, vibrant colors to boost motivation and energy',
    icon: <Zap className="w-4 h-4" />,
    mood: 'energetic',
    benefits: ['Increases motivation', 'Enhances focus', 'Boosts confidence'],
    colors: {
      primary: '25 95% 53%', // Bright orange
      secondary: '45 100% 51%', // Golden yellow
      accent: '15 100% 55%', // Red-orange
      background: '0 0% 100%',
      foreground: '240 10% 15%',
      muted: '0 0% 96.1%',
      card: '0 0% 100%',
      border: '0 0% 89.8%'
    },
    darkColors: {
      primary: '25 95% 53%',
      secondary: '45 100% 51%',
      accent: '15 100% 55%',
      background: '210 11% 18%',
      foreground: '0 0% 98%',
      muted: '210 11% 28%',
      card: '210 11% 18%',
      border: '210 11% 28%'
    }
  },
  {
    id: 'calm',
    name: 'Calm',
    description: 'Soothing blues and greens for peace and tranquility',
    icon: <Waves className="w-4 h-4" />,
    mood: 'calm',
    benefits: ['Reduces stress', 'Promotes relaxation', 'Enhances clarity'],
    colors: {
      primary: '200 100% 50%', // Calm blue
      secondary: '180 100% 40%', // Teal
      accent: '210 100% 60%', // Light blue
      background: '0 0% 100%',
      foreground: '240 10% 15%',
      muted: '0 0% 96.1%',
      card: '0 0% 100%',
      border: '0 0% 89.8%'
    },
    darkColors: {
      primary: '200 100% 50%',
      secondary: '180 100% 40%',
      accent: '210 100% 60%',
      background: '210 11% 18%',
      foreground: '0 0% 98%',
      muted: '210 11% 28%',
      card: '210 11% 18%',
      border: '210 11% 28%'
    }
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Earth tones and greens for grounding and balance',
    icon: <Leaf className="w-4 h-4" />,
    mood: 'grounded',
    benefits: ['Promotes balance', 'Connects with nature', 'Reduces anxiety'],
    colors: {
      primary: '120 60% 40%', // Forest green
      secondary: '80 50% 50%', // Lime green
      accent: '35 80% 50%', // Earth brown
      background: '0 0% 100%',
      foreground: '240 10% 15%',
      muted: '0 0% 96.1%',
      card: '0 0% 100%',
      border: '0 0% 89.8%'
    },
    darkColors: {
      primary: '120 60% 40%',
      secondary: '80 50% 50%',
      accent: '35 80% 50%',
      background: '210 11% 18%',
      foreground: '0 0% 98%',
      muted: '210 11% 28%',
      card: '210 11% 18%',
      border: '210 11% 28%'
    }
  },
  {
    id: 'passionate',
    name: 'Passionate',
    description: 'Warm reds and purples for passion and creativity',
    icon: <Flame className="w-4 h-4" />,
    mood: 'passionate',
    benefits: ['Sparks creativity', 'Increases passion', 'Enhances courage'],
    colors: {
      primary: '340 75% 50%', // Deep pink
      secondary: '270 75% 60%', // Purple
      accent: '10 80% 55%', // Red
      background: '0 0% 100%',
      foreground: '240 10% 15%',
      muted: '0 0% 96.1%',
      card: '0 0% 100%',
      border: '0 0% 89.8%'
    },
    darkColors: {
      primary: '340 75% 50%',
      secondary: '270 75% 60%',
      accent: '10 80% 55%',
      background: '210 11% 18%',
      foreground: '0 0% 98%',
      muted: '210 11% 28%',
      card: '210 11% 18%',
      border: '210 11% 28%'
    }
  },
  {
    id: 'focused',
    name: 'Focused',
    description: 'Clean grays and blues for concentration and clarity',
    icon: <Mountain className="w-4 h-4" />,
    mood: 'focused',
    benefits: ['Improves concentration', 'Reduces distractions', 'Enhances productivity'],
    colors: {
      primary: '220 14.3% 41.2%', // Slate blue
      secondary: '210 40% 60%', // Light blue
      accent: '220 8.9% 46.1%', // Gray blue
      background: '0 0% 100%',
      foreground: '240 10% 15%',
      muted: '0 0% 96.1%',
      card: '0 0% 100%',
      border: '0 0% 89.8%'
    },
    darkColors: {
      primary: '220 14.3% 41.2%',
      secondary: '210 40% 60%',
      accent: '220 8.9% 46.1%',
      background: '210 11% 18%',
      foreground: '0 0% 98%',
      muted: '210 11% 28%',
      card: '210 11% 18%',
      border: '210 11% 28%'
    }
  },
  {
    id: 'loving',
    name: 'Loving',
    description: 'Soft pinks and warm tones for compassion and self-love',
    icon: <Heart className="w-4 h-4" />,
    mood: 'loving',
    benefits: ['Promotes self-love', 'Increases compassion', 'Enhances empathy'],
    colors: {
      primary: '330 80% 70%', // Soft pink
      secondary: '20 100% 80%', // Peach
      accent: '350 100% 85%', // Light rose
      background: '0 0% 100%',
      foreground: '240 10% 15%',
      muted: '0 0% 96.1%',
      card: '0 0% 100%',
      border: '0 0% 89.8%'
    },
    darkColors: {
      primary: '330 80% 70%',
      secondary: '20 100% 80%',
      accent: '350 100% 85%',
      background: '240 10% 9%',
      foreground: '0 0% 98%',
      muted: '240 4% 20%',
      card: '240 10% 9%',
      border: '240 4% 20%'
    }
  }
];

interface MoodThemeSwitcherProps {
  onThemeChange?: (theme: MoodTheme) => void;
}

export default function MoodThemeSwitcher({ onThemeChange }: MoodThemeSwitcherProps) {
  const [currentTheme, setCurrentTheme] = useState<MoodTheme>(moodThemes[0]);
  const [isDark, setIsDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Check for saved theme and dark mode preference
  useEffect(() => {
    const savedThemeId = localStorage.getItem('mood-theme');
    const savedDarkMode = localStorage.getItem('dark-mode') === 'true';
    
    if (savedThemeId) {
      const savedTheme = moodThemes.find(theme => theme.id === savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }
    
    setIsDark(savedDarkMode);
  }, []);

  // Apply theme colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    if (isDark) {
      // NEVER use black backgrounds in dark mode - always use grey
      const forcedGreyColors = {
        background: '210 11% 18%',  // Force grey background
        foreground: '0 0% 95%',
        muted: '210 11% 28%',      
        card: '210 11% 18%',       
        border: '210 11% 28%',     
        primary: currentTheme.darkColors.primary,
        secondary: currentTheme.darkColors.secondary,
        accent: '210 11% 22%'  // Also force grey accent
      };
      
      // Force apply these with !important equivalent
      Object.entries(forcedGreyColors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value, 'important');
      });
      
      document.documentElement.classList.add('dark');
    } else {
      const colors = currentTheme.colors;
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
      
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme, isDark]);

  const handleThemeSelect = (theme: MoodTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('mood-theme', theme.id);
    setIsOpen(false);
    
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem('dark-mode', newDarkMode.toString());
  };

  return (
    <div className="flex items-center gap-2">
      {/* Dark/Light Mode Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleDarkMode}
        className="p-2 bg-background hover:bg-muted border-border"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>

      {/* Mood Theme Selector */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {currentTheme.icon}
            <span className="hidden sm:inline">{currentTheme.name}</span>
            <Palette className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Choose Your Mood Theme</h3>
              <p className="text-sm text-muted-foreground">
                Select a color theme that matches your current emotional state
              </p>
            </div>
            
            <div className="grid gap-3">
              {moodThemes.map((theme) => (
                <Card 
                  key={theme.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    currentTheme.id === theme.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-muted">
                        {theme.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{theme.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {theme.mood}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {theme.description}
                        </p>
                        <div className="flex gap-1">
                          {Object.entries(theme.colors).slice(0, 4).map(([key, value]) => (
                            <div
                              key={key}
                              className="w-4 h-4 rounded-sm border border-border"
                              style={{ backgroundColor: `hsl(${value})` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Current benefits:</p>
              <ul className="space-y-0.5">
                {currentTheme.benefits.map((benefit, index) => (
                  <li key={index}>• {benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}