import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import IndividualChallengeDashboard from "@/components/individual-challenge-dashboard";

export default function MoneyBlocksClearingDashboard() {
  const { user, isAuthenticated } = useAuth();

  const { data: progressData, isLoading } = useQuery({
    queryKey: ["/api/progress/all"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Loading your challenge data</p>
        </div>
      </div>
    );
  }

  const allProgress = (progressData as any)?.allProgress || [];
  const challengeProgress = allProgress.find((p: any) => p.challengeType === 'money_blocks_clearing');

  if (!challengeProgress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Money Blocks Clearing Challenge</h1>
          <p className="text-muted-foreground mb-6">You haven't started this challenge yet.</p>
          <a href="/challenges" className="text-primary hover:underline">Go to Challenges</a>
        </div>
      </div>
    );
  }

  return <IndividualChallengeDashboard challengeType="money_blocks_clearing" />;
}