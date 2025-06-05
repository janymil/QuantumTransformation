import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import IndividualChallengeDashboard from "@/components/individual-challenge-dashboard";

export default function QuantumConsciousnessDashboard() {
  const { user, isAuthenticated } = useAuth();

  const { data: progressData, isLoading } = useQuery({
    queryKey: ["/api/progress/all"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading your quantum journey...</p>
        </div>
      </div>
    );
  }

  // Find the progress for quantum consciousness challenge
  const allProgress = (progressData as any)?.allProgress || [];
  const challengeProgress = allProgress.find((p: any) => p.challengeType === 'general_quantum');

  if (!challengeProgress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Quantum Consciousness Challenge</h1>
          <p className="text-muted-foreground mb-6">You haven't started this challenge yet.</p>
          <a href="/challenges" className="text-primary hover:underline">Go to Challenges</a>
        </div>
      </div>
    );
  }

  // Map URL path to challenge type ID
  const challengeTypeId = "general_quantum"; // quantum-consciousness maps to general_quantum

  return (
    <IndividualChallengeDashboard 
      challengeType={challengeTypeId}
    />
  );
}