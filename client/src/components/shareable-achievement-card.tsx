import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Share2, 
  Download, 
  Copy, 
  Twitter, 
  Facebook, 
  Instagram,
  Award,
  Sparkles,
  CheckCircle,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: string;
  category: string;
}

interface ShareableAchievementCardProps {
  achievement: Achievement;
  userInfo: {
    name: string;
    streakCount: number;
    totalDays: number;
  };
}

export default function ShareableAchievementCard({ 
  achievement, 
  userInfo 
}: ShareableAchievementCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("inspiration");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const templates = {
    inspiration: `🌟 Just unlocked "${achievement.title}" on my quantum consciousness journey! ${customMessage || 'Every day brings new growth and awareness.'} #QuantumTransformation #PersonalGrowth`,
    milestone: `🎯 Achievement unlocked: ${achievement.title}! Day ${userInfo.totalDays} of my 30-day quantum challenge. ${customMessage || 'The journey of a thousand miles begins with a single step.'} #QuantumChallenge #Mindfulness`,
    motivational: `💫 "${achievement.title}" - another step in my consciousness evolution! ${customMessage || 'What we think, we become. What we feel, we attract.'} #QuantumHealing #Manifestation`,
    gratitude: `🙏 Grateful for this milestone: ${achievement.title}. ${customMessage || 'Every challenge is an opportunity to grow stronger.'} #Gratitude #QuantumJourney #PersonalDevelopment`
  };

  const generateImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, achievement.color.includes('blue') ? '#3B82F6' : '#8B5CF6');
    gradient.addColorStop(1, achievement.color.includes('blue') ? '#1E40AF' : '#6D28D9');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add geometric patterns
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 50 + 10,
        0,
        2 * Math.PI
      );
      ctx.stroke();
    }

    // Add achievement content
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Achievement Unlocked!', canvas.width / 2, 120);

    // Achievement icon (emoji)
    ctx.font = '80px Arial';
    ctx.fillText(achievement.icon, canvas.width / 2, 220);

    // Achievement title
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText(achievement.title, canvas.width / 2, 300);

    // Achievement description
    ctx.font = '24px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const words = achievement.description.split(' ');
    let line = '';
    let y = 350;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > 600 && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += 30;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    // User info
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(`${userInfo.name} • ${userInfo.streakCount} day streak`, canvas.width / 2, y + 80);

    // Date
    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(new Date(achievement.unlockedAt).toLocaleDateString(), canvas.width / 2, y + 110);

    // Branding
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Quantum Consciousness Challenge', canvas.width / 2, canvas.height - 30);
  };

  const downloadImage = async () => {
    await generateImage();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `achievement-${achievement.id}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({
      title: "Image Downloaded",
      description: "Your achievement card has been saved to your device.",
    });
  };

  const copyToClipboard = () => {
    const text = templates[selectedTemplate as keyof typeof templates];
    navigator.clipboard.writeText(text);
    
    toast({
      title: "Copied to Clipboard",
      description: "Achievement message copied successfully.",
    });
  };

  const shareToSocial = (platform: string) => {
    const text = encodeURIComponent(templates[selectedTemplate as keyof typeof templates]);
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${text}`,
      instagram: `https://www.instagram.com/` // Instagram doesn't support direct sharing with text
    };

    if (platform === 'instagram') {
      toast({
        title: "Instagram Sharing",
        description: "Download the image and share it manually on Instagram.",
      });
      downloadImage();
    } else {
      window.open(urls[platform as keyof typeof urls], '_blank');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Share Your Achievement</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Achievement Preview */}
            <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <h3 className="text-xl font-bold mb-2">{achievement.title}</h3>
                <p className="text-muted-foreground mb-4">{achievement.description}</p>
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <Badge variant="secondary">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </Badge>
                  <Badge variant="secondary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {userInfo.streakCount} day streak
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Message Templates */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Choose a message style:</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries({
                  inspiration: "Inspirational",
                  milestone: "Milestone",
                  motivational: "Motivational", 
                  gratitude: "Gratitude"
                }).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={selectedTemplate === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTemplate(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add your personal touch:</label>
              <Textarea
                placeholder="Add your own message (optional)"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[60px]"
              />
            </div>

            {/* Preview Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview:</label>
              <div className="p-3 bg-muted rounded-lg text-sm">
                {templates[selectedTemplate as keyof typeof templates]}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              
              <Button onClick={downloadImage} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Image
              </Button>
              
              <Button onClick={() => shareToSocial('twitter')} variant="outline" size="sm">
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              
              <Button onClick={() => shareToSocial('facebook')} variant="outline" size="sm">
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
              
              <Button onClick={() => shareToSocial('instagram')} variant="outline" size="sm">
                <Instagram className="w-4 h-4 mr-2" />
                Instagram
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}