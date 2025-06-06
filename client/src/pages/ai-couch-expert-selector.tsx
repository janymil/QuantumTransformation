import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Brain, Heart, Zap, Shield, Sparkles, Activity, Leaf, Target } from 'lucide-react';

interface ExpertDomain {
  id: string;
  name: string;
  description: string;
  applications: string[];
  techniques: string[];
}

interface ExpertGuidance {
  expert_assessment: string;
  recommended_techniques: string[];
  practice_protocol: string;
  expected_outcomes: string;
  progress_markers: string[];
  integration_notes: string;
  safety_considerations: string;
}

const expertIcons: Record<string, any> = {
  cbt_therapist: Brain,
  trauma_therapist: Shield,
  eft_practitioner: Zap,
  meditation_instructor: Heart,
  nutritional_psychiatrist: Leaf,
  neuroscience_coach: Activity,
  access_consciousness: Sparkles,
  quantum_field_expert: Target
};

export default function AiCouchExpertSelector() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExpert, setSelectedExpert] = useState<string>('');
  const [userIssue, setUserIssue] = useState('');
  const [currentGuidance, setCurrentGuidance] = useState<ExpertGuidance | null>(null);

  // Fetch available expert domains
  const { data: expertDomains, isLoading: domainsLoading } = useQuery({
    queryKey: ['/api/ai-couch/expert-domains'],
    retry: false,
  });

  // Get expert guidance mutation
  const guidanceMutation = useMutation({
    mutationFn: async ({ expertDomain, userIssue }: { expertDomain: string; userIssue: string }) => {
      const response = await fetch('/api/ai-couch/expert-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertDomain, userIssue }),
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setCurrentGuidance(data);
      toast({
        title: "Expert Guidance Received",
        description: "Professional therapeutic guidance has been generated for your situation.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to get expert guidance. Please try again.",
        variant: "destructive",
      });
      console.error('Expert guidance error:', error);
    },
  });

  const handleGetGuidance = () => {
    if (!selectedExpert || !userIssue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select an expert and describe your situation.",
        variant: "destructive",
      });
      return;
    }

    guidanceMutation.mutate({ expertDomain: selectedExpert, userIssue });
  };

  if (domainsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading expert domains...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">AI Couch Expert Consultation</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access specialized guidance from our multidisciplinary team of AI therapeutic experts. 
            Each expert brings decades of professional knowledge and evidence-based interventions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expert Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Your Expert</CardTitle>
                <CardDescription>
                  Choose the therapeutic discipline that best matches your current needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {(expertDomains || []).map((domain: ExpertDomain) => {
                      const IconComponent = expertIcons[domain.id] || Brain;
                      const isSelected = selectedExpert === domain.id;
                      
                      return (
                        <Card
                          key={domain.id}
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : 'hover:shadow-md hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedExpert(domain.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                isSelected ? 'bg-primary/20' : 'bg-muted'
                              }`}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm mb-1">{domain.name}</h3>
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {domain.description}
                                </p>
                                
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                      Specializes in:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {domain.applications.slice(0, 3).map((app, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {app}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                      Key techniques:
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {domain.techniques.slice(0, 2).join(', ')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* User Issue Input */}
            <Card>
              <CardHeader>
                <CardTitle>Describe Your Situation</CardTitle>
                <CardDescription>
                  Share what you're experiencing or what you'd like to work on
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="user-issue">What would you like guidance on?</Label>
                  <Textarea
                    id="user-issue"
                    placeholder="Describe your current situation, challenges, or goals. The more specific you are, the more personalized the guidance will be..."
                    value={userIssue}
                    onChange={(e) => setUserIssue(e.target.value)}
                    rows={6}
                    className="mt-2"
                  />
                </div>
                
                <Button
                  onClick={handleGetGuidance}
                  disabled={!selectedExpert || !userIssue.trim() || guidanceMutation.isPending}
                  className="w-full"
                >
                  {guidanceMutation.isPending ? 'Generating Guidance...' : 'Get Expert Guidance'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Expert Guidance Display */}
          <div>
            {currentGuidance ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedExpert && expertIcons[selectedExpert] && (
                      <div className="p-2 rounded-lg bg-primary/20">
                        {React.createElement(expertIcons[selectedExpert], { className: "h-5 w-5" })}
                      </div>
                    )}
                    Professional Assessment & Guidance
                  </CardTitle>
                  <CardDescription>
                    Evidence-based therapeutic intervention tailored to your needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-6">
                      {/* Expert Assessment */}
                      <div>
                        <h4 className="font-semibold mb-2 text-primary">Professional Assessment</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {currentGuidance.expert_assessment}
                        </p>
                      </div>

                      <Separator />

                      {/* Recommended Techniques */}
                      <div>
                        <h4 className="font-semibold mb-2 text-primary">Recommended Techniques</h4>
                        <ul className="space-y-1">
                          {currentGuidance.recommended_techniques.map((technique, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{technique}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Separator />

                      {/* Practice Protocol */}
                      <div>
                        <h4 className="font-semibold mb-2 text-primary">Practice Protocol</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {currentGuidance.practice_protocol}
                        </p>
                      </div>

                      <Separator />

                      {/* Expected Outcomes */}
                      <div>
                        <h4 className="font-semibold mb-2 text-primary">Expected Outcomes</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {currentGuidance.expected_outcomes}
                        </p>
                      </div>

                      <Separator />

                      {/* Progress Markers */}
                      <div>
                        <h4 className="font-semibold mb-2 text-primary">Progress Indicators</h4>
                        <ul className="space-y-1">
                          {currentGuidance.progress_markers.map((marker, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-green-500 mt-1">✓</span>
                              <span>{marker}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Separator />

                      {/* Integration Notes */}
                      <div>
                        <h4 className="font-semibold mb-2 text-primary">Integration & Next Steps</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {currentGuidance.integration_notes}
                        </p>
                      </div>

                      <Separator />

                      {/* Safety Considerations */}
                      <div>
                        <h4 className="font-semibold mb-2 text-orange-600">Safety Considerations</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {currentGuidance.safety_considerations}
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Expert Guidance Awaits</h3>
                  <p className="text-sm text-muted-foreground">
                    Select an expert and describe your situation to receive personalized therapeutic guidance
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}