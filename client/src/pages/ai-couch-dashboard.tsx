import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Brain, 
  MessageSquare, 
  Target, 
  Calendar, 
  Sparkles, 
  TrendingUp,
  Heart,
  Settings,
  Play,
  CheckCircle,
  Edit3,
  Save,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AiCouchDashboard() {
  const [chatInput, setChatInput] = useState('');
  const [selectedSessionType, setSelectedSessionType] = useState<'daily_checkin' | 'crisis_support' | 'progress_review'>('daily_checkin');
  const [emotionalState, setEmotionalState] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();

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

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['/api/ai-couch/profile'],
    retry: false,
  }) as { data: any };

  // Fetch personalized plans
  const { data: plans } = useQuery({
    queryKey: ['/api/ai-couch/plans'],
    retry: false,
  }) as { data: any[] };

  // Fetch recent sessions
  const { data: recentSessions } = useQuery({
    queryKey: ['/api/ai-couch/sessions'],
    retry: false,
  }) as { data: any[] };

  // Update profile form when profile data loads
  useEffect(() => {
    if (profile && !isEditingProfile) {
      setProfileForm({
        primaryGoals: Array.isArray(profile?.primaryGoals) ? profile.primaryGoals : [],
        currentChallenges: Array.isArray(profile?.currentChallenges) ? profile.currentChallenges : [],
        healingReadiness: profile?.healingReadiness || 5,
        preferredMode: profile?.preferredMode || 'mixed',
        communicationStyle: profile?.communicationStyle || 'gentle',
        learningStyle: profile?.learningStyle || 'visual',
        traumaHistory: profile?.traumaHistory || '',
        spiritualBackground: profile?.spiritualBackground || '',
        mentalHealthHistory: profile?.mentalHealthHistory || '',
        lifeContext: (typeof profile?.lifeContext === 'string') ? profile.lifeContext : ''
      });
    }
  }, [profile, isEditingProfile]);

  // AI Coaching session mutation
  const sessionMutation = useMutation({
    mutationFn: async (data: {
      userInput: string;
      sessionType: string;
      emotionalState?: string;
      sessionGoal?: string;
    }) => {
      return await apiRequest('POST', '/api/ai-couch/session', data);
    },
    onSuccess: () => {
      setChatInput('');
      setEmotionalState('');
      queryClient.invalidateQueries({ queryKey: ['/api/ai-couch/sessions'] });
      toast({
        title: "Session Complete",
        description: "Your AI Couch session has been saved to your history.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Session Error",
        description: error.message || "Failed to complete session. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Generate personalized plan mutation
  const generatePlanMutation = useMutation({
    mutationFn: async (data: {
      baseChallengeType: string;
      userSpecificNeeds?: string[];
    }) => {
      return await apiRequest('POST', '/api/ai-couch/generate-plan', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-couch/plans'] });
      toast({
        title: "Personalized Plan Created",
        description: "Your AI-generated challenge plan is ready!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Plan Generation Error",
        description: error.message || "Failed to generate plan. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: typeof profileForm) => {
      return apiRequest("PUT", "/api/ai-couch/profile", updatedProfile);
    },
    onSuccess: () => {
      setIsEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['/api/ai-couch/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-couch/sessions'] });
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

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;

    sessionMutation.mutate({
      userInput: chatInput,
      sessionType: selectedSessionType,
      emotionalState: emotionalState || undefined,
      sessionGoal: `${selectedSessionType.replace('_', ' ')} session`
    });
  };

  const handleGeneratePlan = (challengeType: string) => {
    generatePlanMutation.mutate({
      baseChallengeType: challengeType,
      userSpecificNeeds: (profile?.primaryGoals || []) as string[]
    });
  };

  const activePlan = (plans || []).find((plan: any) => plan.status === 'active');

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold mb-2">AI Couch Profile Required</h2>
            <p className="text-gray-600 mb-4">
              Complete your AI Couch assessment to access personalized coaching.
            </p>
            <Button onClick={() => window.location.href = '/ai-couch-onboarding'}>
              Complete Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Couch Dashboard</h1>
          <p className="text-gray-600">Your personalized transformation companion</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {profile?.preferredMode || 'mixed'} mode
        </Badge>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">
            <Brain className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="coaching">
            <MessageSquare className="w-4 h-4 mr-2" />
            Coaching
          </TabsTrigger>
          <TabsTrigger value="profile">
            <Settings className="w-4 h-4 mr-2" />
            Profile Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Healing Readiness</Label>
              <div className="text-2xl font-bold text-primary">{profile?.healingReadiness || 5}/10</div>
            </div>
            <div>
              <Label className="text-sm font-medium">Communication Style</Label>
              <div className="text-lg capitalize">{profile?.communicationStyle || 'balanced'}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">Learning Style</Label>
              <div className="text-lg capitalize">{profile?.learningStyle || 'mixed'}</div>
            </div>
          </div>
          
          {profile?.primaryGoals && Array.isArray(profile.primaryGoals) && profile.primaryGoals.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-medium">Primary Goals</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.primaryGoals.slice(0, 3).map((goal: string, index: number) => (
                  <Badge key={index} variant="secondary">{goal}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Plan */}
      {activePlan ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Current Personalized Challenge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{activePlan.planName}</h3>
                <p className="text-gray-600">Based on {activePlan.baseChallengeType.replace('_', ' ')}</p>
              </div>
              <Badge variant="outline">
                Day {activePlan.currentDay}/{activePlan.totalDays}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Difficulty Level</Label>
                <div className="text-lg">{activePlan.difficultyLevel}/10</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Intensity Level</Label>
                <div className="text-lg">{activePlan.intensityLevel}/10</div>
              </div>
            </div>

            <Button className="mt-4" onClick={() => window.location.href = `/ai-couch-plan/${activePlan.id}`}>
              <Play className="w-4 h-4 mr-2" />
              Continue Challenge
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Create Personalized Challenge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Choose a base challenge type to generate your personalized transformation program:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 'money_blocks_clearing', name: 'Money Blocks Clearing', icon: '💰' },
                { id: 'general_quantum', name: 'Quantum Consciousness', icon: '🧠' },
                { id: 'quantum_relationships', name: 'Relationships', icon: '❤️' },
                { id: 'quantum_health', name: 'Health & Vitality', icon: '🌱' },
                { id: 'money_manifestation', name: 'Money Manifestation', icon: '✨' }
              ].map((challenge) => (
                <Button
                  key={challenge.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => handleGeneratePlan(challenge.id)}
                  disabled={generatePlanMutation.isPending}
                >
                  <span className="text-2xl">{challenge.icon}</span>
                  <span className="text-sm text-center">{challenge.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Coaching Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            AI Coaching Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session-type">Session Type</Label>
              <select
                id="session-type"
                value={selectedSessionType}
                onChange={(e) => setSelectedSessionType(e.target.value as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="daily_checkin">Daily Check-in</option>
                <option value="crisis_support">Crisis Support</option>
                <option value="progress_review">Progress Review</option>
              </select>
            </div>
            <div>
              <Label htmlFor="emotional-state">Current Emotional State (optional)</Label>
              <Input
                id="emotional-state"
                placeholder="e.g., anxious, excited, stuck, motivated..."
                value={emotionalState}
                onChange={(e) => setEmotionalState(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="chat-input">What's on your mind?</Label>
            <Textarea
              id="chat-input"
              placeholder="Share what you're experiencing, thinking, or feeling. Ask questions or describe any challenges you're facing..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              rows={4}
            />
          </div>
          
          <Button 
            onClick={handleChatSubmit}
            disabled={!chatInput.trim() || sessionMutation.isPending}
            className="w-full"
          >
            {sessionMutation.isPending ? 'Processing...' : 'Start AI Coaching Session'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      {recentSessions && Array.isArray(recentSessions) && recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.slice(0, 5).map((session: any) => (
                <div key={session.id} className="flex justify-between items-start p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {session.sessionType.replace('_', ' ')}
                      </Badge>
                      {session.emotionalTone && (
                        <Badge variant="secondary" className="text-xs">
                          {session.emotionalTone}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {session.userInput}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 ml-4">
                    {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => window.location.href = '/ai-couch-history'}>
              View All Sessions
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{recentSessions?.length || 0}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{plans?.length || 0}</div>
            <div className="text-sm text-gray-600">Plans Created</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{profile.healingReadiness}</div>
            <div className="text-sm text-gray-600">Readiness Level</div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="coaching" className="space-y-6 mt-6">
          {/* AI Coaching Session Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                AI Coaching Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Session Type Selection */}
                <div>
                  <Label htmlFor="sessionType" className="text-sm font-medium">Session Type</Label>
                  <div className="flex gap-2 mt-2">
                    {[
                      { value: 'daily_checkin', label: 'Daily Check-in' },
                      { value: 'crisis_support', label: 'Crisis Support' },
                      { value: 'progress_review', label: 'Progress Review' }
                    ].map((type) => (
                      <Button
                        key={type.value}
                        variant={selectedSessionType === type.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSessionType(type.value as any)}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Emotional State Input */}
                <div>
                  <Label htmlFor="emotionalState" className="text-sm font-medium">Current Emotional State (Optional)</Label>
                  <Input
                    id="emotionalState"
                    placeholder="How are you feeling right now?"
                    value={emotionalState}
                    onChange={(e) => setEmotionalState(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* Main Input */}
                <div>
                  <Label htmlFor="chatInput" className="text-sm font-medium">What would you like to discuss?</Label>
                  <Textarea
                    id="chatInput"
                    placeholder="Share what's on your mind, describe your challenges, or ask for guidance..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="mt-2 h-32"
                  />
                </div>

                <Button 
                  onClick={handleChatSubmit} 
                  disabled={sessionMutation.isPending || !chatInput.trim()}
                  className="w-full"
                >
                  {sessionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start AI Coaching Session
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6 mt-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Profile Settings
                </div>
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
                        if (profile) {
                          setProfileForm({
                            primaryGoals: Array.isArray(profile?.primaryGoals) ? profile.primaryGoals : [],
                            currentChallenges: Array.isArray(profile?.currentChallenges) ? profile.currentChallenges : [],
                            healingReadiness: profile?.healingReadiness || 5,
                            preferredMode: profile?.preferredMode || 'mixed',
                            communicationStyle: profile?.communicationStyle || 'gentle',
                            learningStyle: profile?.learningStyle || 'visual',
                            traumaHistory: profile?.traumaHistory || '',
                            spiritualBackground: profile?.spiritualBackground || '',
                            mentalHealthHistory: profile?.mentalHealthHistory || '',
                            lifeContext: (typeof profile?.lifeContext === 'string') ? profile.lifeContext : ''
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Primary Goals</Label>
                    {isEditingProfile ? (
                      <Textarea
                        placeholder="What are your main transformation goals?"
                        value={profileForm.primaryGoals.join(', ')}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          primaryGoals: e.target.value.split(',').map(g => g.trim()).filter(Boolean)
                        })}
                        className="h-20 text-sm mt-2"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground mt-2">
                        {profileForm.primaryGoals.length > 0 ? profileForm.primaryGoals.join(', ') : 'Not specified'}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Healing Readiness</Label>
                    {isEditingProfile ? (
                      <div className="mt-2">
                        <div className="text-sm mb-2">{profileForm.healingReadiness}/10</div>
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
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground mt-2">
                        Level {profileForm.healingReadiness} - Ready for transformation
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Preferred Mode</Label>
                    {isEditingProfile ? (
                      <select
                        value={profileForm.preferredMode}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          preferredMode: e.target.value as 'scientific' | 'spiritual' | 'mixed'
                        })}
                        className="w-full text-sm border border-gray-300 rounded-md p-2 mt-2"
                      >
                        <option value="scientific">Scientific</option>
                        <option value="spiritual">Spiritual</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    ) : (
                      <div className="text-sm text-muted-foreground capitalize mt-2">
                        {profileForm.preferredMode}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Communication Style</Label>
                    {isEditingProfile ? (
                      <select
                        value={profileForm.communicationStyle}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          communicationStyle: e.target.value as 'gentle' | 'direct' | 'motivational'
                        })}
                        className="w-full text-sm border border-gray-300 rounded-md p-2 mt-2"
                      >
                        <option value="gentle">Gentle</option>
                        <option value="direct">Direct</option>
                        <option value="motivational">Motivational</option>
                      </select>
                    ) : (
                      <div className="text-sm text-muted-foreground capitalize mt-2">
                        {profileForm.communicationStyle}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Learning Style</Label>
                    {isEditingProfile ? (
                      <select
                        value={profileForm.learningStyle}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          learningStyle: e.target.value as 'visual' | 'auditory' | 'kinesthetic' | 'reading'
                        })}
                        className="w-full text-sm border border-gray-300 rounded-md p-2 mt-2"
                      >
                        <option value="visual">Visual</option>
                        <option value="auditory">Auditory</option>
                        <option value="kinesthetic">Kinesthetic</option>
                        <option value="reading">Reading/Writing</option>
                      </select>
                    ) : (
                      <div className="text-sm text-muted-foreground capitalize mt-2">
                        {profileForm.learningStyle}
                      </div>
                    )}
                  </div>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}