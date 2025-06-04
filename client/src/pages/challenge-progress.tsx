import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import IndividualChallengeDashboard from "@/components/individual-challenge-dashboard";

export default function ChallengeProgressPage() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // Extract challenge type from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const challengeType = urlParams.get('type');

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Please log in to view your challenge progress
        </h1>
      </div>
    );
  }

  if (!challengeType) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Challenge not specified
        </h1>
        <p className="text-gray-600">Please select a valid challenge to view progress.</p>
      </div>
    );
  }

  return <IndividualChallengeDashboard challengeType={challengeType} />;
}