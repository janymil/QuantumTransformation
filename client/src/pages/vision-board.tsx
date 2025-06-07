import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EnhancedVisionBoard from "@/components/vision-board/enhanced-vision-board";
import { Palette, Star, Target, Sparkles } from "lucide-react";

export default function VisionBoardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950 dark:via-pink-950 dark:to-indigo-950">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Palette className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Vision Board Creator
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Create powerful visual representations of your financial goals and dreams. 
            Capture, edit, and arrange images with text to manifest your abundant future.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Screen Capture</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Capture your screen, webcam, or upload images directly to your vision board
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-pink-200 dark:border-pink-800">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-pink-600" />
              </div>
              <CardTitle className="text-lg">Image Editing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Adjust brightness, contrast, crop, and rotate your images for perfect vision board elements
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle className="text-lg">Text & Design</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add inspiring text, affirmations, and arrange elements to create your perfect vision
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Vision Board Component */}
        <EnhancedVisionBoard />

        {/* Tips Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-xl">Vision Board Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-purple-700 dark:text-purple-300">Be Specific</h4>
                <p className="text-sm text-muted-foreground">
                  Include specific financial goals, dates, and amounts to make your vision concrete
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-pink-700 dark:text-pink-300">Use Emotions</h4>
                <p className="text-sm text-muted-foreground">
                  Choose images that evoke strong positive emotions and feelings of abundance
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-indigo-700 dark:text-indigo-300">Daily Viewing</h4>
                <p className="text-sm text-muted-foreground">
                  Place your vision board where you'll see it daily to reinforce your goals
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-purple-700 dark:text-purple-300">Regular Updates</h4>
                <p className="text-sm text-muted-foreground">
                  Update your board as goals are achieved and new dreams emerge
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}