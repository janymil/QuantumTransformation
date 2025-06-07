import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target, Heart, Brain, Zap, Calendar, TrendingUp, ExternalLink } from "lucide-react";

export default function VisionApp() {
  const [isLaunching, setIsLaunching] = useState(false);

  const features = [
    {
      icon: Target,
      title: "AI-Powered Goals",
      description: "Intelligent analysis of your aspirations to create personalized vision boards",
      color: "bg-blue-100 text-blue-800"
    },
    {
      icon: Brain,
      title: "Subconscious Programming",
      description: "Daily visualization rituals designed to reprogram your subconscious mind",
      color: "bg-purple-100 text-purple-800"
    },
    {
      icon: Zap,
      title: "Quantum Transformation",
      description: "Harness quantum physics principles to manifest your dreams into reality",
      color: "bg-yellow-100 text-yellow-800"
    },
    {
      icon: Heart,
      title: "Emotional Alignment",
      description: "Connect with the feeling state of your desired outcomes",
      color: "bg-pink-100 text-pink-800"
    },
    {
      icon: Calendar,
      title: "Daily Rituals",
      description: "Structured morning and evening practices for consistent transformation",
      color: "bg-green-100 text-green-800"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Monitor your manifestation journey with detailed analytics",
      color: "bg-indigo-100 text-indigo-800"
    }
  ];

  const handleLaunchApp = () => {
    setIsLaunching(true);
    // Open in new window to maintain independence
    window.open('https://48e7b684-1ce1-40c4-9e42-9081d4bf4a6f-00-1rkf0kgz1yr92.riker.replit.dev:3001', '_blank');
    setTimeout(() => setIsLaunching(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Vision Transform
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Independent AI-powered vision board platform designed for quantum transformation and manifestation
          </p>
          <Badge variant="secondary" className="mt-4">
            <Zap className="w-3 h-3 mr-1" />
            Hybrid Federated Architecture
          </Badge>
        </div>

        {/* Launch Button */}
        <div className="text-center mb-16">
          <Button 
            onClick={handleLaunchApp}
            disabled={isLaunching}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isLaunching ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Launching Vision App...
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5 mr-2" />
                Launch Vision Transform App
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Opens in a new window • Fully independent application
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Philosophy */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Core Philosophy</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg font-medium mb-4">
              "Less Design, More Transformation"
            </p>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Unlike traditional design-focused vision boards, Vision Transform prioritizes the psychological and energetic aspects of manifestation. 
              Our AI-powered platform guides you through daily visualization rituals and subconscious reprogramming techniques that create real, 
              measurable changes in your life.
            </p>
          </CardContent>
        </Card>

        {/* Architecture Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Built with hybrid federated architecture • Maintains complete independence while integrating seamlessly with Quantum Challenge platform
          </p>
        </div>
      </div>
    </div>
  );
}