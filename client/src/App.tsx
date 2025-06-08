import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard-simple";
import ChallengeDay from "@/pages/challenge-day";
import Journal from "@/pages/journal";
import Progress from "@/pages/progress";
import Challenges from "@/pages/challenges";
import ChallengeProgress from "@/pages/challenge-progress";
import SavedAffirmations from "@/pages/saved-affirmations";
import AICoaching from "@/pages/ai-coaching";
import AIConversationHistory from "@/pages/ai-conversation-history";
import DeepJournaling from "@/pages/deep-journaling";
import TherapeuticChat from "@/pages/therapeutic-chat";
import TherapeuticAnalytics from "@/pages/therapeutic-analytics";
import TherapeuticStylesDemo from "@/pages/therapeutic-styles-demo";
import AdminAnalytics from "@/pages/admin-analytics";
import AdminUnlockDays from "@/pages/admin-unlock-days";
import AiCouchOnboarding from "@/pages/ai-couch-onboarding";
import AiCouchNewDashboard from "@/pages/ai-couch-new-dashboard";
import VisionBoard from "@/pages/vision-board";
import { ElevenLabsVoiceTest } from "@/components/voice/elevenlabs-voice-test";

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
  try {
    const { isAuthenticated, isLoading, error } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-red-600">Authentication Error</h2>
            <p className="text-muted-foreground">Please try refreshing the page</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <Switch>
          <Route path="/" component={Landing} />
          <Route component={NotFound} />
        </Switch>
      );
    }

    return (
      <>
        <Navbar />
        <Switch>
          {/* Main shared routes */}
          <Route path="/" component={Dashboard} />
          <Route path="/challenges" component={Challenges} />
          <Route path="/ai-coaching" component={AICoaching} />
          <Route path="/ai-conversation-history" component={AIConversationHistory} />
          <Route path="/deep-journaling" component={DeepJournaling} />
          <Route path="/therapeutic-chat" component={TherapeuticChat} />
          <Route path="/therapeutic-analytics" component={TherapeuticAnalytics} />
          <Route path="/therapeutic-styles-demo" component={TherapeuticStylesDemo} />
          <Route path="/admin-analytics" component={AdminAnalytics} />
          <Route path="/admin-unlock-days" component={AdminUnlockDays} />
          <Route path="/journal" component={() => <Journal />} />
          <Route path="/progress" component={Progress} />
          <Route path="/saved-affirmations" component={SavedAffirmations} />
          <Route path="/vision-board" component={VisionBoard} />
          <Route path="/voice-test" component={ElevenLabsVoiceTest} />
          
          {/* AI Couch Premium System */}
          <Route path="/ai-couch" component={AiCouchNewDashboard} />
          <Route path="/ai-couch-onboarding" component={AiCouchOnboarding} />
          <Route path="/ai-couch-dashboard" component={AiCouchNewDashboard} />
          
          {/* Legacy challenge routes */}
          <Route path="/challenge/:day" component={() => <ChallengeDay />} />
          <Route path="/challenge-day" component={() => <ChallengeDay />} />
          <Route path="/challenge-progress" component={() => <ChallengeProgress />} />
          
          {/* Challenge routes */}
          <Route path="/quantum-consciousness" component={QuantumDashboard} />
          <Route path="/quantum-consciousness/journal" component={QuantumJournal} />
          <Route path="/quantum-consciousness/progress" component={QuantumProgress} />
          <Route path="/quantum-consciousness/day/:day" component={QuantumDay} />
          
          <Route path="/money-blocks" component={MoneyDashboard} />
          <Route path="/money-blocks/journal" component={MoneyJournal} />
          <Route path="/money-blocks/progress" component={MoneyProgress} />
          <Route path="/money-blocks/day/:day" component={MoneyDay} />
          
          <Route path="/money-blocks-clearing" component={MoneyBlocksClearingDashboard} />
          <Route path="/money-blocks-clearing/journal" component={MoneyBlocksClearingJournal} />
          <Route path="/money-blocks-clearing/progress" component={MoneyBlocksClearingProgress} />
          <Route path="/money-blocks-clearing/day/:day" component={MoneyBlocksClearingDay} />
          
          <Route path="/money-manifestation" component={MoneyManifestationDashboard} />
          <Route path="/money-manifestation/journal" component={MoneyManifestationJournal} />
          <Route path="/money-manifestation/progress" component={MoneyManifestationProgress} />
          <Route path="/money-manifestation/day/:day" component={MoneyManifestationDay} />
          
          <Route path="/relationships" component={RelationshipsDashboard} />
          <Route path="/relationships/journal" component={RelationshipsJournal} />
          <Route path="/relationships/progress" component={RelationshipsProgress} />
          <Route path="/relationships/day/:day" component={RelationshipsDay} />
          
          <Route path="/health-transformation" component={HealthDashboard} />
          <Route path="/health-transformation/journal" component={HealthJournal} />
          <Route path="/health-transformation/progress" component={HealthProgress} />
          <Route path="/health-transformation/day/:day" component={HealthDay} />
          
          <Route component={NotFound} />
        </Switch>
      </>
    );
  } catch (error) {
    console.error("Router error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-red-600">Application Error</h2>
          <p className="text-muted-foreground">Please refresh the page to continue</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error("React Error Boundary caught error:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error details:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
            <p className="text-muted-foreground">The application encountered an error.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;