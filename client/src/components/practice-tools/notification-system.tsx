import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Clock, Calendar, MapPin, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  motivationalQuotes: boolean;
  streakCelebrations: boolean;
  practiceReminders: boolean;
  practiceInterval: number; // hours
}

interface NotificationSystemProps {
  onClose?: () => void;
}

export default function NotificationSystem({ onClose }: NotificationSystemProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    dailyReminder: true,
    reminderTime: "08:00",
    motivationalQuotes: true,
    streakCelebrations: true,
    practiceReminders: true,
    practiceInterval: 4
  });
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Check current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Not Supported",
        description: "This browser doesn't support notifications.",
        variant: "destructive",
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive practice reminders and motivational messages.",
        });
        
        // Test notification
        new Notification("Quantum Challenge", {
          body: "Notifications are now enabled! 🎉",
          icon: "/favicon.ico"
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive",
      });
    }
  };

  const updateSettings = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('notification-settings', JSON.stringify(newSettings));
  };

  const scheduleNotifications = () => {
    if (!settings.enabled || permission !== 'granted') return;

    // Clear existing timeouts (in a real app, you'd use a service worker)
    // This is a simplified implementation for demonstration

    if (settings.dailyReminder) {
      const now = new Date();
      const [hours, minutes] = settings.reminderTime.split(':').map(Number);
      const reminderTime = new Date(now);
      reminderTime.setHours(hours, minutes, 0, 0);
      
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }
      
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      
      setTimeout(() => {
        new Notification("Daily Practice Reminder", {
          body: "Time for your quantum consciousness practice! 🧘‍♀️",
          icon: "/favicon.ico"
        });
      }, timeUntilReminder);
    }

    if (settings.motivationalQuotes) {
      // Schedule motivational quotes every few hours
      setInterval(() => {
        const quotes = [
          "Your thoughts create your reality. Choose them wisely.",
          "Every moment is a chance to transform your life.",
          "You are already whole, complete, and perfect.",
          "The quantum field responds to your elevated emotions.",
          "Your future self is calling you forward."
        ];
        
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        new Notification("Quantum Wisdom", {
          body: randomQuote,
          icon: "/favicon.ico"
        });
      }, 3 * 60 * 60 * 1000); // Every 3 hours
    }
  };

  useEffect(() => {
    scheduleNotifications();
  }, [settings, permission]);

  const testNotification = () => {
    if (permission === 'granted') {
      new Notification("Test Notification", {
        body: "This is how your practice reminders will look! 🌟",
        icon: "/favicon.ico"
      });
    } else {
      toast({
        title: "Permission Required",
        description: "Please enable notifications first.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>Notification Settings</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Set up reminders to support your daily practice
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5" />
              <div>
                <div className="font-medium">Notification Permission</div>
                <div className="text-sm text-muted-foreground">
                  Status: {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Not Set'}
                </div>
              </div>
            </div>
            {permission !== 'granted' && (
              <Button onClick={requestPermission} size="sm">
                Enable
              </Button>
            )}
          </div>
        </Card>

        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enabled" className="text-base font-medium">
              Enable Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive practice reminders and motivational messages
            </p>
          </div>
          <Switch
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSettings('enabled', checked)}
            disabled={permission !== 'granted'}
          />
        </div>

        {/* Notification Types */}
        {settings.enabled && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notification Types</h3>
            
            {/* Daily Reminder */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4" />
                <div>
                  <Label htmlFor="dailyReminder">Daily Practice Reminder</Label>
                  <p className="text-sm text-muted-foreground">
                    Daily reminder at a specific time
                  </p>
                </div>
              </div>
              <Switch
                id="dailyReminder"
                checked={settings.dailyReminder}
                onCheckedChange={(checked) => updateSettings('dailyReminder', checked)}
              />
            </div>

            {settings.dailyReminder && (
              <div className="ml-7">
                <Label htmlFor="reminderTime">Reminder Time</Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => updateSettings('reminderTime', e.target.value)}
                  className="w-32"
                />
              </div>
            )}

            {/* Motivational Quotes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-4 h-4" />
                <div>
                  <Label htmlFor="motivationalQuotes">Motivational Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Inspiring quotes throughout the day
                  </p>
                </div>
              </div>
              <Switch
                id="motivationalQuotes"
                checked={settings.motivationalQuotes}
                onCheckedChange={(checked) => updateSettings('motivationalQuotes', checked)}
              />
            </div>

            {/* Streak Celebrations */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4" />
                <div>
                  <Label htmlFor="streakCelebrations">Streak Celebrations</Label>
                  <p className="text-sm text-muted-foreground">
                    Celebrate your consistency milestones
                  </p>
                </div>
              </div>
              <Switch
                id="streakCelebrations"
                checked={settings.streakCelebrations}
                onCheckedChange={(checked) => updateSettings('streakCelebrations', checked)}
              />
            </div>

            {/* Practice Reminders */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-4 h-4" />
                <div>
                  <Label htmlFor="practiceReminders">Practice Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Gentle nudges if you haven't practiced
                  </p>
                </div>
              </div>
              <Switch
                id="practiceReminders"
                checked={settings.practiceReminders}
                onCheckedChange={(checked) => updateSettings('practiceReminders', checked)}
              />
            </div>

            {settings.practiceReminders && (
              <div className="ml-7">
                <Label htmlFor="practiceInterval">Reminder Interval</Label>
                <Select 
                  value={settings.practiceInterval.toString()} 
                  onValueChange={(value) => updateSettings('practiceInterval', parseInt(value))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Every 2 hours</SelectItem>
                    <SelectItem value="4">Every 4 hours</SelectItem>
                    <SelectItem value="6">Every 6 hours</SelectItem>
                    <SelectItem value="8">Every 8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Test Button */}
        {settings.enabled && (
          <div className="pt-4 border-t">
            <Button onClick={testNotification} variant="outline" className="w-full">
              Send Test Notification
            </Button>
          </div>
        )}

        {/* Browser Support Info */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">💡 Tips for Best Experience</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Keep this tab open for notifications to work</li>
            <li>• Add this site to your home screen on mobile</li>
            <li>• Check your browser's notification settings if you don't receive them</li>
            <li>• Notifications work best when the app is bookmarked</li>
          </ul>
        </div>

        {onClose && (
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}