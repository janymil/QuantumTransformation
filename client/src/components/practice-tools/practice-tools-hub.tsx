import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { 
  Waves, 
  Eye, 
  Image, 
  Target, 
  MessageSquare, 
  Bell,
  Play,
  Sparkles
} from "lucide-react";
import BreathingExercise from "./breathing-exercise";
import GuidedVisualization from "./guided-visualization";
import VisionBoard from "./vision-board";
import PracticeTracker from "./practice-tracker";
import PersonalizedAffirmations from "./personalized-affirmations";
import NotificationSystem from "./notification-system";

interface PracticeToolsHubProps {
  day?: number;
  challengeType?: string;
}

export default function PracticeToolsHub({ day = 1, challengeType = "general" }: PracticeToolsHubProps) {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const practiceTools = [
    {
      id: "breathing",
      title: "Breathing Exercise",
      description: "4-7-8 breathing technique for relaxation and focus",
      icon: Waves,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      component: BreathingExercise
    },
    {
      id: "visualization",
      title: "Guided Visualization",
      description: "Step-by-step journey to manifest your desires",
      icon: Eye,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      component: GuidedVisualization
    },
    {
      id: "vision-board",
      title: "Vision Board Creator",
      description: "Create visual representations of your goals",
      icon: Image,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      component: VisionBoard
    },
    {
      id: "tracker",
      title: "Practice Tracker",
      description: "Track your daily practice and build streaks",
      icon: Target,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      component: PracticeTracker
    },
    {
      id: "affirmations",
      title: "Personal Affirmations",
      description: "AI-generated affirmations tailored to your goals",
      icon: MessageSquare,
      color: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-900/20",
      component: PersonalizedAffirmations
    },
    {
      id: "notifications",
      title: "Smart Reminders",
      description: "Set up practice reminders and motivational messages",
      icon: Bell,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      component: NotificationSystem
    }
  ];

  const openDialog = (toolId: string) => {
    setActiveDialog(toolId);
  };

  const closeDialog = () => {
    setActiveDialog(null);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>Practice Tools</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Interactive tools to enhance your real-life practice experience
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {practiceTools.map((tool) => {
          const IconComponent = tool.icon;
          const ToolComponent = tool.component;
          
          return (
            <Dialog key={tool.id} open={activeDialog === tool.id} onOpenChange={(open) => !open && closeDialog()}>
              <DialogTrigger asChild>
                <Card 
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${tool.bgColor} border-2 hover:border-primary/30`}
                  onClick={() => openDialog(tool.id)}
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={`w-12 h-12 mx-auto rounded-full bg-white dark:bg-black/20 flex items-center justify-center ${tool.bgColor}`}>
                      <IconComponent className={`w-6 h-6 ${tool.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{tool.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Start Practice
                    </Button>
                  </CardContent>
                </Card>
              </DialogTrigger>
              
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <VisuallyHidden>
                  <DialogTitle>{tool.title}</DialogTitle>
                  <DialogDescription>{tool.description}</DialogDescription>
                </VisuallyHidden>
                <ToolComponent 
                  day={day}
                  challengeType={challengeType}
                  scenario={challengeType === "money-blocks-clearing" ? "Financial Freedom" : "Success Achievement"}
                  onClose={closeDialog}
                />
              </DialogContent>
            </Dialog>
          );
        })}
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">How Practice Tools Help You</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <strong>During Practice:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Guided breathing keeps you centered</li>
                <li>• Visualization builds neural pathways</li>
                <li>• Vision boards clarify your intentions</li>
              </ul>
            </div>
            <div>
              <strong>Building Habits:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Track consistency and celebrate progress</li>
                <li>• Get personalized encouragement</li>
                <li>• Receive gentle reminders to practice</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}