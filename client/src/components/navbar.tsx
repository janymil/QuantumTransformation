import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Settings, LogOut, User as UserIcon, BookOpen, BarChart3, Target, Sparkles, Heart, Brain, Zap, MessageSquare, MessageCircle, Palette, ExternalLink, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import OnboardingTour from "@/components/onboarding-tour";
import MoodThemeSwitcher from "@/components/mood-theme-switcher";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isOpeningVisionBoard, setIsOpeningVisionBoard] = useState(false);

  const handleVisionBoardClick = async () => {
    if (!user) return;
    
    setIsOpeningVisionBoard(true);
    try {
      const response = await fetch('/api/auth/generate-vision-token', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const { token, redirectUrl } = await response.json();
        const visionBoardUrl = `${redirectUrl}?token=${encodeURIComponent(token)}`;
        window.open(visionBoardUrl, '_blank');
      } else {
        console.error('Failed to generate vision board token');
      }
    } catch (error) {
      console.error('Error opening Vision Board:', error);
    } finally {
      setIsOpeningVisionBoard(false);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Challenges", href: "/challenges", icon: Target },
    { name: "Journal", href: "/journal", icon: BookOpen },
    { name: "Progress", href: "/progress", icon: BarChart3 },
  ];

  const getUserInitials = (user: User | undefined | null) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = (user: User | undefined | null) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email;
    }
    return "User";
  };

  return (
    <div>
      <nav className="bg-white dark:bg-background shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg mr-3 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-poppins font-bold text-xl text-foreground">
                Quantum Challenge
              </span>
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
            
            {/* Advanced Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Sparkles className="w-4 h-4" />
                  <span>Advanced</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem asChild>
                  <Link href="/ai-coaching">
                    <Brain className="mr-2 h-4 w-4" />
                    <span>AI Coach</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/therapeutic-chat">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Therapeutic Chat</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleVisionBoardClick} disabled={isOpeningVisionBoard}>
                  <Palette className="mr-2 h-4 w-4" />
                  <span>{isOpeningVisionBoard ? 'Opening...' : 'Vision Board'}</span>
                  <ExternalLink className="ml-auto h-3 w-3" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            
            {/* Mood Theme Switcher */}
            <MoodThemeSwitcher />
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt={getUserDisplayName(user || null)} />
                    <AvatarFallback className="bg-gradient-primary text-white text-sm">
                      {getUserInitials(user || null)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getUserDisplayName(user || null)}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/saved-affirmations">
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Saved Affirmations</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const tourElement = document.querySelector('[data-start-tour]') as HTMLElement;
                  tourElement?.click();
                }}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>Tour Guide</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => window.location.href = '/api/logout'}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-border">
          <div className="flex items-center justify-around py-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg cursor-pointer ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.name}</span>
                  </div>
                </Link>
              );
            })}
            
            {/* Advanced Dropdown Menu - Mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-muted-foreground">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs font-medium">Advanced</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem asChild>
                  <Link href="/ai-coaching">
                    <Brain className="mr-2 h-4 w-4" />
                    <span>AI Coach</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/therapeutic-chat">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Therapeutic Chat</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleVisionBoardClick} disabled={isOpeningVisionBoard}>
                  <Palette className="mr-2 h-4 w-4" />
                  <span>{isOpeningVisionBoard ? 'Opening...' : 'Vision Board'}</span>
                  <ExternalLink className="ml-auto h-3 w-3" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      </nav>
      
      {/* Onboarding Tour */}
      <OnboardingTour />
    </div>
  );
}
