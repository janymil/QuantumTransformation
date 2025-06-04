import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import ChallengeSelection from "@/components/challenge-selection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Clock, 
  CheckCircle,
  Trophy,
  Target,
  BookOpen,
  Brain
} from "lucide-react";

export default function ChallengesPage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedChallenge, setSelectedChallenge] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch user's challenges
  const { data: userChallenges, isLoading: challengesLoading } = useQuery({
    queryKey: ['/api/challenges/user-challenges'],
    enabled: isAuthenticated,
  });

  // Fetch available challenge types
  const { data: challengeTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['/api/challenges/types'],
  });

  // Start new challenge mutation
  const startChallengeMutation = useMutation({
    mutationFn: async (challengeType: string) => {
      return await apiRequest('/api/challenges/select', {
        method: 'POST',
        body: JSON.stringify({ challengeType }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/user-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/all'] });
      toast({
        title: "Challenge Started!",
        description: "You can now access this challenge from your dashboard.",
      });
      
      // Navigate back to dashboard to show the new challenge
      setTimeout(() => {
        setLocation('/');
      }, 1500);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start challenge. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSelectChallenge = (challengeId: string) => {
    setSelectedChallenge(challengeId);
    startChallengeMutation.mutate(challengeId);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access challenges</h1>
          <Button onClick={() => window.location.href = '/api/login'}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Quantum Consciousness Challenges
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Transform your reality through scientifically-backed quantum consciousness practices. 
          Choose from specialized 30-day challenges designed to elevate your awareness and manifest your highest potential.
        </p>
      </div>

      {/* User's Active Challenges */}
      {userChallenges && userChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Your Active Challenges</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userChallenges.map((challenge: any) => {
                const challengeType = challengeTypes?.find((type: any) => type.id === challenge.challengeType);
                if (!challengeType) return null;

                const progress = ((challenge.completedDays?.length || 0) / 30) * 100;
                
                return (
                  <Card key={challenge.id} className="relative overflow-hidden">
                    <div className={`h-16 bg-gradient-to-br ${challengeType.gradient} relative`}>
                      <div className="absolute bottom-2 left-4 text-white">
                        <div className="text-xl">{challengeType.icon}</div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          Day {challenge.currentDay}/30
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">
                          {challengeType.title}
                        </h3>
                        <p className="text-sm text-gray-600">{challengeType.subtitle}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                          <span>{challenge.completedDays?.length || 0} completed</span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => setLocation(`/challenge/${challenge.currentDay}?type=${challenge.challengeType}`)}
                          className="flex items-center space-x-1"
                        >
                          <span>Continue</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Challenge Selection */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">
          {userChallenges && userChallenges.length > 0 ? 'Start Another Challenge' : 'Choose Your First Challenge'}
        </h2>
        
        {typesLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200"></div>
                <CardContent className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : challengeTypes ? (
          <ChallengeSelection 
            onSelectChallenge={handleSelectChallenge}
            selectedChallenge={selectedChallenge}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Unable to load challenges. Please try again later.</p>
          </div>
        )}
      </div>

      {/* Feature Highlights */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold text-center mb-6">What Makes Our Challenges Special</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-blue-500 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold">AI-Powered Personalization</h4>
              <p className="text-sm text-gray-600">
                Content adapts to your progress, goals, and unique journey using advanced AI coaching.
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-purple-500 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold">Quantum Science-Based</h4>
              <p className="text-sm text-gray-600">
                Practices rooted in Joe Dispenza and Neville Goddard's proven quantum consciousness methods.
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold">Progressive Learning</h4>
              <p className="text-sm text-gray-600">
                30-day structured programs that build momentum and create lasting transformation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}