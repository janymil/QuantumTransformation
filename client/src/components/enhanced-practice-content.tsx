import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Sunrise, 
  Sun, 
  Moon, 
  Quote, 
  Lightbulb, 
  Brain,
  Clock,
  CheckCircle
} from "lucide-react";

interface PracticeSection {
  title: string;
  quote?: string;
  steps: string[];
  whyItWorks?: string;
  scientificBasis?: string;
}

interface PracticeContent {
  morning?: PracticeSection;
  daytime?: PracticeSection;
  evening?: PracticeSection;
  tips?: string[];
  insights?: string[];
}

interface EnhancedPracticeContentProps {
  practice: PracticeContent;
  duration: string;
}

export default function EnhancedPracticeContent({ practice, duration }: EnhancedPracticeContentProps) {
  const renderPracticeSection = (section: PracticeSection, icon: React.ReactNode, color: string) => (
    <Card className={`border-l-4 border-l-${color}-500`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          {icon}
          <span className="ml-2">{section.title}</span>
          <Badge variant="outline" className="ml-auto">
            <Clock className="w-3 h-3 mr-1" />
            {Math.round(parseInt(duration) / 3)} min
          </Badge>
        </CardTitle>
        {section.quote && (
          <div className={`bg-${color}-50 dark:bg-${color}-950/30 rounded-lg p-4 border-l-4 border-l-${color}-400`}>
            <Quote className={`w-4 h-4 text-${color}-600 mb-2`} />
            <p className={`italic text-${color}-700 dark:text-${color}-300 font-medium`}>
              "{section.quote}"
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Step-by-Step Instructions
          </h4>
          {section.steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className={`text-xs font-bold text-${color}-600 dark:text-${color}-400`}>
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-foreground leading-relaxed">
                  {renderStepWithHighlights(step)}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {section.whyItWorks && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center">
                <Lightbulb className="w-4 h-4 mr-2" />
                Why This Works
              </h4>
              <p className="text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-4">
                {section.whyItWorks}
              </p>
            </div>
          </>
        )}
        
        {section.scientificBasis && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center">
              <Brain className="w-4 h-4 mr-2" />
              Scientific Basis
            </h4>
            <p className="text-muted-foreground leading-relaxed bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border-l-4 border-l-blue-400">
              {section.scientificBasis}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStepWithHighlights = (step: string) => {
    // Highlight affirmations in quotes
    const parts = step.split(/("[^"]*")/g);
    return parts.map((part, index) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        return (
          <span 
            key={index} 
            className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded font-medium text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const renderTipsAndInsights = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {practice.tips && practice.tips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-700 dark:text-green-300">
              <CheckCircle className="w-5 h-5 mr-2" />
              Helpful Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {practice.tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <p className="text-muted-foreground leading-relaxed">{tip}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {practice.insights && practice.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-purple-700 dark:text-purple-300">
              <Lightbulb className="w-5 h-5 mr-2" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {practice.insights.map((insight, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                  <p className="text-muted-foreground leading-relaxed">{insight}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {practice.morning && renderPracticeSection(
        practice.morning, 
        <Sunrise className="w-5 h-5 text-orange-500" />, 
        'orange'
      )}
      
      {practice.daytime && renderPracticeSection(
        practice.daytime, 
        <Sun className="w-5 h-5 text-yellow-500" />, 
        'yellow'
      )}
      
      {practice.evening && renderPracticeSection(
        practice.evening, 
        <Moon className="w-5 h-5 text-blue-500" />, 
        'blue'
      )}
      
      {((practice.tips && practice.tips.length > 0) || (practice.insights && practice.insights.length > 0)) && (
        <>
          <Separator className="my-8" />
          {renderTipsAndInsights()}
        </>
      )}
    </div>
  );
}