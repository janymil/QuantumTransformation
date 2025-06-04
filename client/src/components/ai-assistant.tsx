import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Send, 
  Lightbulb, 
  BookOpen, 
  Target, 
  Zap,
  MessageCircle,
  Loader2
} from "lucide-react";

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  day: number;
  topic: string;
  context?: string;
}

interface AIResponse {
  explanation: string;
  relatedConcepts: string[];
  practicalTips: string[];
  scientificBacking?: string;
}

export default function AIAssistant({ 
  isOpen, 
  onClose, 
  day, 
  topic, 
  context 
}: AIAssistantProps) {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'ai';
    content: string | AIResponse;
    timestamp: Date;
  }>>([]);

  const explanationMutation = useMutation({
    mutationFn: async (data: { userQuestion?: string }) => {
      const response = await apiRequest("POST", "/api/ai/explain", {
        topic,
        day,
        userQuestion: data.userQuestion,
        context,
      });
      return response.json();
    },
    onSuccess: (data: AIResponse) => {
      setConversation(prev => [
        ...prev,
        {
          type: 'ai',
          content: data,
          timestamp: new Date()
        }
      ]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to get AI explanation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuickQuestion = (questionText: string) => {
    setConversation(prev => [
      ...prev,
      {
        type: 'user',
        content: questionText,
        timestamp: new Date()
      }
    ]);
    explanationMutation.mutate({ userQuestion: questionText });
  };

  const handleCustomQuestion = () => {
    if (!question.trim()) return;
    
    setConversation(prev => [
      ...prev,
      {
        type: 'user',
        content: question,
        timestamp: new Date()
      }
    ]);
    explanationMutation.mutate({ userQuestion: question });
    setQuestion("");
  };

  const quickQuestions = [
    {
      icon: Lightbulb,
      text: `Explain ${topic} in simple terms`,
      color: "text-yellow-500"
    },
    {
      icon: Brain,
      text: "How does consciousness affect reality?",
      color: "text-purple-500"
    },
    {
      icon: Target,
      text: "Tips for deeper meditation practice",
      color: "text-blue-500"
    },
    {
      icon: BookOpen,
      text: "Scientific backing for these concepts",
      color: "text-green-500"
    }
  ];

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomQuestion();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mr-3">
              <Brain className="w-5 h-5 text-white" />
            </div>
            AI Quantum Guide
            <Badge variant="outline" className="ml-2">
              Day {day}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[60vh]">
          
          {/* Conversation Area */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              
              {/* Welcome Message */}
              {conversation.length === 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium mb-1">AI Quantum Guide</p>
                        <p className="text-muted-foreground text-sm">
                          I'm here to help explain quantum concepts and answer your questions about Day {day}: {topic}. 
                          What would you like to explore?
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conversation Messages */}
              {conversation.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'user' ? (
                    <div className="bg-primary text-white rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">{message.content as string}</p>
                    </div>
                  ) : (
                    <Card className="max-w-[90%] bg-muted/30">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-foreground mb-2 flex items-center">
                              <Brain className="w-4 h-4 mr-2 text-primary" />
                              Explanation
                            </h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {(message.content as AIResponse).explanation}
                            </p>
                          </div>

                          {(message.content as AIResponse).relatedConcepts.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-2 flex items-center">
                                <Zap className="w-4 h-4 mr-2 text-secondary" />
                                Related Concepts
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {(message.content as AIResponse).relatedConcepts.map((concept, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {concept}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {(message.content as AIResponse).practicalTips.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-2 flex items-center">
                                <Target className="w-4 h-4 mr-2 text-blue-500" />
                                Practical Tips
                              </h4>
                              <ul className="space-y-1">
                                {(message.content as AIResponse).practicalTips.map((tip, i) => (
                                  <li key={i} className="text-muted-foreground text-sm flex items-start">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-2 mr-2"></span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {(message.content as AIResponse).scientificBacking && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-2 flex items-center">
                                <BookOpen className="w-4 h-4 mr-2 text-green-500" />
                                Scientific Backing
                              </h4>
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {(message.content as AIResponse).scientificBacking}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {explanationMutation.isPending && (
                <div className="flex justify-start">
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Questions */}
          {conversation.length === 0 && (
            <div className="border-t border-border pt-4 mb-4">
              <h4 className="text-sm font-medium text-foreground mb-3">Quick Questions:</h4>
              <div className="space-y-2">
                {quickQuestions.map((q, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => handleQuickQuestion(q.text)}
                    disabled={explanationMutation.isPending}
                  >
                    <q.icon className={`w-4 h-4 mr-2 ${q.color}`} />
                    <span className="text-sm">{q.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-border pt-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Ask me anything about quantum consciousness..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={explanationMutation.isPending}
                className="flex-1"
              />
              <Button 
                onClick={handleCustomQuestion}
                disabled={explanationMutation.isPending || !question.trim()}
                size="sm"
              >
                {explanationMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
