import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Settings } from "lucide-react";

interface StyleResponse {
  style: string;
  response: string;
  followUpQuestion: string;
  emotionalInsight: string;
  analysis: {
    characteristics: string[];
    responseLength: number;
  };
}

export default function TherapeuticStylesDemo() {
  const [testMessage, setTestMessage] = useState("I keep procrastinating on important tasks and then feel guilty about it later.");
  const [focusArea, setFocusArea] = useState("general");
  const [responseLength, setResponseLength] = useState("balanced");
  const [responses, setResponses] = useState<StyleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const styles = [
    { value: 'socratic', name: 'Socratic Questioning', color: 'bg-blue-100 text-blue-800' },
    { value: 'directive', name: 'Directive', color: 'bg-green-100 text-green-800' },
    { value: 'reflective', name: 'Reflective', color: 'bg-purple-100 text-purple-800' },
    { value: 'collaborative', name: 'Collaborative', color: 'bg-orange-100 text-orange-800' }
  ];

  const testAllStyles = async () => {
    if (!testMessage.trim()) return;
    
    setIsLoading(true);
    setResponses([]);
    
    try {
      const styleResponses: StyleResponse[] = [];
      
      for (const style of styles) {
        const response = await fetch('/api/therapeutic-chat/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            userInput: testMessage,
            conversationStyle: style.value,
            focusArea,
            responseLength
          })
        });

        if (response.ok) {
          const data = await response.json();
          const analysis = analyzeResponse(style.value, data);
          
          styleResponses.push({
            style: style.value,
            response: data.response,
            followUpQuestion: data.followUpQuestion,
            emotionalInsight: data.emotionalInsight,
            analysis
          });
        }
      }
      
      setResponses(styleResponses);
    } catch (error) {
      console.error('Error testing styles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeResponse = (style: string, data: any) => {
    const text = `${data.response} ${data.followUpQuestion}`.toLowerCase();
    const characteristics: string[] = [];
    
    switch(style) {
      case 'socratic':
        if (/what.*?|how.*?/.test(text)) characteristics.push('Uses what/how questioning');
        if ((text.match(/\?/g) || []).length >= 2) characteristics.push('Multiple questions');
        if (!/recommend|should|try this/.test(text)) characteristics.push('Avoids direct advice');
        break;
        
      case 'directive':
        if (/recommend|should|try|do this|approach|strategy/.test(text)) characteristics.push('Gives recommendations');
        if (/step|technique|method/.test(text)) characteristics.push('Offers specific techniques');
        if (/you need|you must|you should/.test(text)) characteristics.push('Uses directive language');
        break;
        
      case 'reflective':
        if (/sounds like|hearing|seem|feeling|experiencing/.test(text)) characteristics.push('Uses reflective language');
        if (/you.*feel|you.*think|you.*experience/.test(text)) characteristics.push('Mirrors feelings/thoughts');
        if (/understanding|acknowledging/.test(text)) characteristics.push('Shows validation');
        break;
        
      case 'collaborative':
        if (/we|us|together|our/.test(text)) characteristics.push('Uses "we" language');
        if (/let's|work together|explore together/.test(text)) characteristics.push('Shows partnership');
        if (/what do you think|how do we/.test(text)) characteristics.push('Invites collaboration');
        break;
    }
    
    return {
      characteristics,
      responseLength: data.response.length
    };
  };

  const getStyleInfo = (style: string) => {
    switch(style) {
      case 'socratic':
        return 'Guides through questioning to help discover insights themselves';
      case 'directive':
        return 'Provides clear advice, strategies, and actionable recommendations';
      case 'reflective':
        return 'Mirrors emotions and thoughts to help gain clarity and understanding';
      case 'collaborative':
        return 'Works as partners, using "we" language and shared responsibility';
      default:
        return '';
    }
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Therapeutic Styles Demonstration</h1>
        <p className="text-gray-600">
          Test how different therapeutic conversation styles produce distinct AI responses
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-message">Test Message</Label>
            <Textarea
              id="test-message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter a message to test with all styles..."
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="focus-area">Focus Area</Label>
              <Select value={focusArea} onValueChange={setFocusArea}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Exploration</SelectItem>
                  <SelectItem value="emotions">Emotional Processing</SelectItem>
                  <SelectItem value="patterns">Pattern Recognition</SelectItem>
                  <SelectItem value="goals">Goal Setting</SelectItem>
                  <SelectItem value="relationships">Relationships</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="response-length">Response Length</Label>
              <Select value={responseLength} onValueChange={setResponseLength}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief & Focused</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="detailed">Detailed & Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={testAllStyles} 
            disabled={isLoading || !testMessage.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing All Styles...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                Test All Therapeutic Styles
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {responses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Style Comparison Results</h2>
          
          <div className="grid gap-6">
            {responses.map((result, index) => {
              const styleConfig = styles.find(s => s.value === result.style);
              return (
                <Card key={result.style} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <Badge className={styleConfig?.color}>
                          {styleConfig?.name}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {result.analysis.responseLength} characters
                        </span>
                      </CardTitle>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getStyleInfo(result.style)}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">AI Response:</Label>
                      <p className="mt-1 p-3 bg-gray-50 rounded-md">
                        "{result.response}"
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Follow-up Question:</Label>
                      <p className="mt-1 p-3 bg-blue-50 rounded-md">
                        "{result.followUpQuestion}"
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Emotional Insight:</Label>
                        <Badge variant="outline" className="ml-2">
                          {result.emotionalInsight}
                        </Badge>
                      </div>
                    </div>
                    
                    {result.analysis.characteristics.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Style Characteristics:</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {result.analysis.characteristics.map((char, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              ✓ {char}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}