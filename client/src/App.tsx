import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard-simple";
import ChallengeDay from "@/pages/challenge-day";
import Journal from "@/pages/journal-new";
import Progress from "@/pages/progress";
import Challenges from "@/pages/challenges";
import ChallengeProgress from "@/pages/challenge-progress";
import SavedAffirmations from "@/pages/saved-affirmations";
import AICoaching from "@/pages/ai-coaching";
import AIConversationHistory from "@/pages/ai-conversation-history";
import AdminAnalytics from "@/pages/admin-analytics";
import AiCouchOnboarding from "@/pages/ai-couch-onboarding";
import AiCouchDashboard from "@/pages/ai-couch-dashboard";

import NotFound from "@/pages/not-found";
import Navbar from "@/components/navbar";

// Challenge-specific components
import QuantumDashboard from "@/pages/challenges/quantum-consciousness/dashboard";
import QuantumJournal from "@/pages/challenges/quantum-consciousness/journal";
import QuantumProgress from "@/pages/challenges/quantum-consciousness/progress";
import QuantumDay from "@/pages/challenges/quantum-consciousness/day";

import MoneyDashboard from "@/pages/challenges/money-blocks/dashboard";
import MoneyJournal from "@/pages/challenges/money-blocks/journal";
import MoneyProgress from "@/pages/challenges/money-blocks/progress";
import MoneyDay from "@/pages/challenges/money-blocks/day";

import MoneyBlocksClearingDashboard from "@/pages/challenges/money-blocks-clearing/dashboard";
import MoneyBlocksClearingJournal from "@/pages/challenges/money-blocks-clearing/journal";
import MoneyBlocksClearingProgress from "@/pages/challenges/money-blocks-clearing/progress";
import MoneyBlocksClearingDay from "@/pages/challenges/money-blocks-clearing/day";

import MoneyManifestationDashboard from "@/pages/challenges/money-manifestation/dashboard";
import MoneyManifestationJournal from "@/pages/challenges/money-manifestation/journal";
import MoneyManifestationProgress from "@/pages/challenges/money-manifestation/progress";
import MoneyManifestationDay from "@/pages/challenges/money-manifestation/day";

import RelationshipsDashboard from "@/pages/challenges/relationships/dashboard";
import RelationshipsJournal from "@/pages/challenges/relationships/journal";
import RelationshipsProgress from "@/pages/challenges/relationships/progress";
import RelationshipsDay from "@/pages/challenges/relationships/day";

import HealthDashboard from "@/pages/challenges/health-transformation/dashboard";
import HealthJournal from "@/pages/challenges/health-transformation/journal";
import HealthProgress from "@/pages/challenges/health-transformation/progress";
import HealthDay from "@/pages/challenges/health-transformation/day";



function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Critical debugging
  console.log("Router - isAuthenticated:", isAuthenticated, "isLoading:", isLoading);

  if (isLoading) {
    console.log("Router - Showing loading state");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading your quantum journey...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Router - User not authenticated, showing Landing");
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  console.log("Router - User authenticated, showing Dashboard and other routes");
  return (
    <>
      <Navbar />
      <Switch>
        {/* Main shared routes */}
        <Route path="/" component={Dashboard} />
        <Route path="/challenges" component={Challenges} />
        <Route path="/ai-coaching" component={AICoaching} />
        <Route path="/ai-conversation-history" component={AIConversationHistory} />
        <Route path="/admin-analytics" component={AdminAnalytics} />
        <Route path="/journal" component={() => <Journal />} />
        <Route path="/progress" component={Progress} />
        <Route path="/saved-affirmations" component={SavedAffirmations} />
        
        {/* AI Couch Premium System */}
        <Route path="/ai-couch" component={AICoaching} />
        <Route path="/ai-couch-onboarding" component={AiCouchOnboarding} />
        <Route path="/ai-couch-dashboard" component={AiCouchDashboard} />
        
        {/* Legacy challenge routes - keep for backwards compatibility */}
        <Route path="/challenge/:day" component={() => <ChallengeDay />} />
        <Route path="/challenge-day" component={() => <ChallengeDay />} />
        <Route path="/challenge-progress" component={() => <ChallengeProgress />} />
        
        {/* Quantum Consciousness Challenge */}
        <Route path="/quantum-consciousness" component={QuantumDashboard} />
        <Route path="/quantum-consciousness/journal" component={QuantumJournal} />
        <Route path="/quantum-consciousness/progress" component={QuantumProgress} />
        <Route path="/quantum-consciousness/day/:day" component={QuantumDay} />
        
        {/* Money Blocks Challenge */}
        <Route path="/money-blocks" component={MoneyDashboard} />
        <Route path="/money-blocks/journal" component={MoneyJournal} />
        <Route path="/money-blocks/progress" component={MoneyProgress} />
        <Route path="/money-blocks/day/:day" component={MoneyDay} />
        <Route path="/money-blocks-clearing" component={MoneyBlocksClearingDashboard} />
        <Route path="/money-blocks-clearing/journal" component={MoneyBlocksClearingJournal} />
        <Route path="/money-blocks-clearing/progress" component={MoneyBlocksClearingProgress} />
        <Route path="/money-blocks-clearing/day/:day" component={MoneyBlocksClearingDay} />
        
        {/* Money Manifestation Challenge */}
        <Route path="/money-manifestation" component={MoneyManifestationDashboard} />
        <Route path="/money-manifestation/journal" component={MoneyManifestationJournal} />
        <Route path="/money-manifestation/progress" component={MoneyManifestationProgress} />
        <Route path="/money-manifestation/day/:day" component={MoneyManifestationDay} />
        
        {/* Relationships Challenge */}
        <Route path="/relationships" component={RelationshipsDashboard} />
        <Route path="/relationships/journal" component={RelationshipsJournal} />
        <Route path="/relationships/progress" component={RelationshipsProgress} />
        <Route path="/relationships/day/:day" component={RelationshipsDay} />
        
        {/* Health Transformation Challenge */}
        <Route path="/health-transformation" component={HealthDashboard} />
        <Route path="/health-transformation/journal" component={HealthJournal} />
        <Route path="/health-transformation/progress" component={HealthProgress} />
        <Route path="/health-transformation/day/:day" component={HealthDay} />
        

        
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
