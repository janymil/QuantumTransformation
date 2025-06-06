import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Brain, 
  Heart, 
  Target, 
  Lightbulb, 
  MessageSquare,
  Sparkles,
  TrendingUp,
  Clock,
  Star,
  Send,
  Loader2,
  Zap,
  BookOpen,
  Settings,
  Edit3,
  Save,
  RotateCcw
} from "lucide-react";

interface AICoachingHubProps {
  challengeType: string;
  currentDay: number;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
  prefilledQuestion?: string;
  shouldFocusGoals?: boolean;
  shouldFocusChallenges?: boolean;
}

export default function AICoachingHub({ 
  challengeType, 
  currentDay, 
  initialTab = "coaching", 
  onTabChange,
  prefilledQuestion = "",
  shouldFocusGoals = false,
  shouldFocusChallenges = false
}: AICoachingHubProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [question, setQuestion] = useState(prefilledQuestion);
  const [goals, setGoals] = useState("");
  const [challenges, setChallenges] = useState("");
  const [mood, setMood] = useState(5);
  const [coachingResponse, setCoachingResponse] = useState<any>(null);
  const [explanationResponse, setExplanationResponse] = useState<any>(null);
  
  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    primaryGoals: [] as string[],
    currentChallenges: [] as string[],
    healingReadiness: 5,
    preferredMode: 'mixed' as 'scientific' | 'spiritual' | 'mixed',
    communicationStyle: 'gentle' as 'gentle' | 'direct' | 'motivational',
    learningStyle: 'visual' as 'visual' | 'auditory' | 'kinesthetic' | 'reading',
    traumaHistory: '',
    spiritualBackground: '',
    mentalHealthHistory: '',
    lifeContext: ''
  });

  // Update question when prefilledQuestion changes
  useEffect(() => {
    if (prefilledQuestion) {
      setQuestion(prefilledQuestion);
    }
  }, [prefilledQuestion]);

  // Handle focus actions for quick action buttons
  useEffect(() => {
    if (shouldFocusGoals) {
      // Focus on goals textarea when quick action is triggered
      setTimeout(() => {
        const goalsTextarea = document.querySelector('textarea[placeholder*="working to achieve"]') as HTMLTextAreaElement;
        if (goalsTextarea) {
          goalsTextarea.focus();
        }
      }, 100);
    }
  }, [shouldFocusGoals]);

  useEffect(() => {
    if (shouldFocusChallenges) {
      // Focus on challenges input when quick action is triggered
      setTimeout(() => {
        const challengesInput = document.querySelector('input[placeholder*="obstacles are you facing"]') as HTMLInputElement;
        if (challengesInput) {
          challengesInput.focus();
        }
      }, 100);
    }
  }, [shouldFocusChallenges]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Get AI usage stats
  const { data: usageStats } = useQuery({
    queryKey: ["/api/ai/usage-stats"],
    retry: false,
  }) as { data?: { dailyUsage: string; monthlyUsage: string; totalRequests: string } };

  // Get AI Couch profile
  const { data: aiProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["/api/ai-couch/profile"],
    retry: false,
  });

  // Update profile form when profile data loads
  useEffect(() => {
    if (aiProfile && !isEditingProfile) {
      setProfileForm({
        primaryGoals: Array.isArray(aiProfile.primaryGoals) ? aiProfile.primaryGoals : [],
        currentChallenges: Array.isArray(aiProfile.currentChallenges) ? aiProfile.currentChallenges : [],
        healingReadiness: aiProfile.healingReadiness || 5,
        preferredMode: aiProfile.personalityType || 'mixed',
        communicationStyle: aiProfile.communicationStyle || 'gentle',
        learningStyle: aiProfile.learningStyle || 'visual',
        traumaHistory: aiProfile.traumaHistory || '',
        spiritualBackground: aiProfile.spiritualBackground || '',
        mentalHealthHistory: aiProfile.mentalHealthHistory || '',
        lifeContext: aiProfile.lifeContext || ''
      });
    }
  }, [aiProfile, isEditingProfile]);

  // Personalized coaching mutation
  const coachingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ai/coaching", {
        currentDay,
        challengeType,
        userGoals: goals,
        currentChallenges: challenges.split(',').map(c => c.trim()).filter(Boolean),
        mood,
        userTier: 'basic'
      });
    },
    onSuccess: (data) => {
      setCoachingResponse(data);
      queryClient.invalidateQueries({ queryKey: ["/api/ai/usage-stats"] });
      toast({
        title: "Coaching Generated",
        description: "Your personalized guidance is ready!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate coaching",
        variant: "destructive",
      });
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: typeof profileForm) => {
      return apiRequest("PUT", "/api/ai-couch/profile", updatedProfile);
    },
    onSuccess: () => {
      setIsEditingProfile(false);
      refetchProfile();
      queryClient.invalidateQueries({ queryKey: ["/api/ai-couch/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-couch/sessions"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated and AI coaching will adapt to your changes.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // AI explanation mutation
  const explanationMutation = useMutation({
    mutationFn: async (questionText: string) => {
      return apiRequest("POST", "/api/ai/explain", {
        topic: `Day ${currentDay} - ${challengeType}`,
        day: currentDay,
        userQuestion: questionText,
        context: challengeType
      });
    },
    onSuccess: (data) => {
      setExplanationResponse(data);
      setQuestion("");
      queryClient.invalidateQueries({ queryKey: ["/api/ai/usage-stats"] });
      toast({
        title: "Answer Generated",
        description: "Your question has been answered!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI explanation",
        variant: "destructive",
      });
    },
  });

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    explanationMutation.mutate(question);
  };

  const quickQuestions = [
    "How can I deepen my practice today?",
    "What's the science behind today's exercises?",
    "Help me overcome resistance to change",
    "Explain quantum consciousness simply",
    "Tips for maintaining focus during meditation"
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
            <Brain className="w-5 h-5 text-white" />
          </div>
          AI Personal Coach
          <Badge variant="secondary" className="ml-2">
            Day {currentDay}
          </Badge>
        </CardTitle>
        {usageStats && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Zap className="w-4 h-4 mr-1" />
            {usageStats.requestsToday || 0}/{usageStats.dailyLimit || 10} requests today
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="coaching" className="text-xs">
              <Heart className="w-4 h-4 mr-1" />
              Coaching
            </TabsTrigger>
            <TabsTrigger value="questions" className="text-xs">
              <MessageSquare className="w-4 h-4 mr-1" />
              Ask AI
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">
              <Lightbulb className="w-4 h-4 mr-1" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs">
              <Settings className="w-4 h-4 mr-1" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coaching" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Goals
                </label>
                <Textarea
                  placeholder="What are you working to achieve?"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="h-20 text-sm"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Challenges
                </label>
                <Input
                  placeholder="What obstacles are you facing? (comma-separated)"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Energy Level: {mood}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <Button 
                onClick={() => coachingMutation.mutate()}
                disabled={coachingMutation.isPending}
                className="w-full"
              >
                {coachingMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Coaching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Personalized Coaching
                  </>
                )}
              </Button>
            </div>

            {(coachingMutation.data || coachingResponse) && (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-700">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center">
                        <Heart className="w-4 h-4 mr-2" />
                        Personal Message
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {(coachingMutation.data || coachingResponse)?.personalizedMessage || "No response available"}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        Today's Recommendation
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {(coachingMutation.data || coachingResponse)?.todaysRecommendation || "No recommendation available"}
                      </p>
                    </div>

                    {(coachingMutation.data || coachingResponse)?.practiceAdjustments && (
                      <div>
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Practice Adjustments
                        </h4>
                        <ul className="space-y-1">
                          {((coachingMutation.data || coachingResponse)?.practiceAdjustments || []).map((adjustment: string, index: number) => (
                            <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-start">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-2 mr-2"></span>
                              {adjustment}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask me anything about your practice..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                  disabled={explanationMutation.isPending}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAskQuestion}
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

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick questions:</p>
                <div className="space-y-1">
                  {quickQuestions.map((q, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2 px-3 text-xs"
                      onClick={() => explanationMutation.mutate(q)}
                      disabled={explanationMutation.isPending}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {(explanationMutation.data || explanationResponse) && (
              <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 border-blue-200 dark:border-blue-700">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-2" />
                        AI Response
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                        {(explanationMutation.data || explanationResponse)?.explanation || "No response available"}
                      </p>
                    </div>

                    {((explanationMutation.data || explanationResponse)?.practicalTips?.length > 0) && (
                      <div>
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Practical Tips
                        </h4>
                        <ul className="space-y-1">
                          {((explanationMutation.data || explanationResponse)?.practicalTips || []).map((tip: string, index: number) => (
                            <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-start">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-2 mr-2"></span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-700">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                        Daily AI Insight
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Your quantum field is constantly responding to your thoughts and emotions. 
                        Today's practice helps you become more conscious of this creative process.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {usageStats && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Your AI Usage
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Today's requests:</span>
                        <span className="font-medium">{usageStats.dailyUsage || 0}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">This week:</span>
                        <span className="font-medium">{usageStats.monthlyUsage || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total questions:</span>
                        <span className="font-medium">{usageStats.totalRequests || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Profile Settings
                </h4>
                {!isEditingProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingProfile(false);
                        if (aiProfile) {
                          setProfileForm({
                            primaryGoals: Array.isArray(aiProfile.primaryGoals) ? aiProfile.primaryGoals : [],
                            currentChallenges: Array.isArray(aiProfile.currentChallenges) ? aiProfile.currentChallenges : [],
                            healingReadiness: aiProfile.healingReadiness || 5,
                            preferredMode: aiProfile.personalityType || 'mixed',
                            communicationStyle: aiProfile.communicationStyle || 'gentle',
                            learningStyle: aiProfile.learningStyle || 'visual',
                            traumaHistory: aiProfile.traumaHistory || '',
                            spiritualBackground: aiProfile.spiritualBackground || '',
                            mentalHealthHistory: aiProfile.mentalHealthHistory || '',
                            lifeContext: aiProfile.lifeContext || ''
                          });
                        }
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateProfileMutation.mutate(profileForm)}
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>

              {aiProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Primary Goals
                      </label>
                      {isEditingProfile ? (
                        <Textarea
                          placeholder="What are your main transformation goals?"
                          value={profileForm.primaryGoals.join(', ')}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            primaryGoals: e.target.value.split(',').map(g => g.trim()).filter(Boolean)
                          })}
                          className="h-20 text-sm"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {profileForm.primaryGoals.length > 0 ? profileForm.primaryGoals.join(', ') : 'Not specified'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Current Challenges
                      </label>
                      {isEditingProfile ? (
                        <Textarea
                          placeholder="What obstacles are you facing?"
                          value={profileForm.currentChallenges.join(', ')}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            currentChallenges: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                          })}
                          className="h-20 text-sm"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {profileForm.currentChallenges.length > 0 ? profileForm.currentChallenges.join(', ') : 'Not specified'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Healing Readiness: {profileForm.healingReadiness}/10
                      </label>
                      {isEditingProfile ? (
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={profileForm.healingReadiness}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            healingReadiness: parseInt(e.target.value)
                          })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Level {profileForm.healingReadiness} - Ready for transformation
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Preferred Mode
                      </label>
                      {isEditingProfile ? (
                        <select
                          value={profileForm.preferredMode}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            preferredMode: e.target.value as 'scientific' | 'spiritual' | 'mixed'
                          })}
                          className="w-full text-sm border border-gray-300 rounded-md p-2"
                        >
                          <option value="scientific">Scientific</option>
                          <option value="spiritual">Spiritual</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      ) : (
                        <div className="text-sm text-muted-foreground capitalize">
                          {profileForm.preferredMode}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Communication Style
                      </label>
                      {isEditingProfile ? (
                        <select
                          value={profileForm.communicationStyle}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            communicationStyle: e.target.value as 'gentle' | 'direct' | 'motivational'
                          })}
                          className="w-full text-sm border border-gray-300 rounded-md p-2"
                        >
                          <option value="gentle">Gentle</option>
                          <option value="direct">Direct</option>
                          <option value="motivational">Motivational</option>
                        </select>
                      ) : (
                        <div className="text-sm text-muted-foreground capitalize">
                          {profileForm.communicationStyle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Learning Style
                      </label>
                      {isEditingProfile ? (
                        <select
                          value={profileForm.learningStyle}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            learningStyle: e.target.value as 'visual' | 'auditory' | 'kinesthetic' | 'reading'
                          })}
                          className="w-full text-sm border border-gray-300 rounded-md p-2"
                        >
                          <option value="visual">Visual</option>
                          <option value="auditory">Auditory</option>
                          <option value="kinesthetic">Kinesthetic</option>
                          <option value="reading">Reading/Writing</option>
                        </select>
                      ) : (
                        <div className="text-sm text-muted-foreground capitalize">
                          {profileForm.learningStyle}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Spiritual Background
                      </label>
                      {isEditingProfile ? (
                        <Input
                          placeholder="Your spiritual background"
                          value={profileForm.spiritualBackground}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            spiritualBackground: e.target.value
                          })}
                          className="text-sm"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {profileForm.spiritualBackground || 'Not specified'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Life Context
                    </label>
                    {isEditingProfile ? (
                      <Textarea
                        placeholder="Your current life situation and context"
                        value={profileForm.lifeContext}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          lifeContext: e.target.value
                        })}
                        className="h-20 text-sm"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {profileForm.lifeContext || 'Not specified'}
                      </div>
                    )}
                  </div>

                  {isEditingProfile && (
                    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-700">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Brain className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                              AI Reassessment
                            </h5>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              When you save changes to your profile, the AI coaching system will automatically reassess your needs and adapt all future coaching sessions to your updated preferences and goals.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Complete your AI Couch assessment to view and edit your profile.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}