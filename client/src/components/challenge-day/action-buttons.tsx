import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, BookOpen, Brain } from "lucide-react";

interface ActionButtonsProps {
  isCompleted: boolean;
  isCompletePending: boolean;
  onComplete: () => void;
  onOpenJournal: () => void;
  onOpenAI: () => void;
}

export default function ActionButtons({
  isCompleted,
  isCompletePending,
  onComplete,
  onOpenJournal,
  onOpenAI
}: ActionButtonsProps) {
  return (
    <Card className="mt-8">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {!isCompleted ? (
            <Button 
              size="lg"
              className="flex-1"
              onClick={onComplete}
              disabled={isCompletePending}
            >
              {isCompletePending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Mark as Complete
                </>
              )}
            </Button>
          ) : (
            <Button size="lg" variant="outline" className="flex-1" disabled>
              <CheckCircle className="w-5 h-5 mr-2 text-success" />
              Completed
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={onOpenJournal}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Open Journal
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={onOpenAI}
          >
            <Brain className="w-5 h-5 mr-2" />
            AI Assistant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}