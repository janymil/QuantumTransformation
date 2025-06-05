import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Brain, Lightbulb, Quote } from "lucide-react";

interface ChallengeContentProps {
  content: {
    title: string;
    subtitle: string;
    description: string;
    duration: string;
    topic: string;
    science: string;
    practice: {
      steps: string[];
      tips: string[];
      insights: string[];
    };
    affirmation: string;
  };
}

export default function ChallengeContent({ content }: ChallengeContentProps) {
  return (
    <div className="space-y-6">
      {/* Content Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                {content.title}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {content.subtitle}
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {content.duration}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300">
            {content.description}
          </p>
        </CardContent>
      </Card>

      {/* Science Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Scientific Foundation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300">
            {content.science}
          </p>
        </CardContent>
      </Card>

      {/* Practice Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Practice Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {content.practice.steps.map((step: string, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Tips for Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {content.practice.tips.map((tip: string, index: number) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-green-600" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {content.practice.insights.map((insight: string, index: number) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Affirmation */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Quote className="w-5 h-5 text-purple-600" />
            Today's Affirmation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200 italic text-center">
            "{content.affirmation}"
          </p>
        </CardContent>
      </Card>
    </div>
  );
}