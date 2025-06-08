import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { lazy, Suspense } from "react";

// Eager load only critical components
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/navbar";

// Lazy load heavy components
const ChallengeDay = lazy(() => import("@/pages/challenge-day"));
const Journal = lazy(() => import("@/pages/journal"));
const Progress = lazy(() => import("@/pages/progress"));
const Challenges = lazy(() => import("@/pages/challenges"));
const ChallengeProgress = lazy(() => import("@/pages/challenge-progress"));
const SavedAffirmations = lazy(() => import("@/pages/saved-affirmations"));
const AICoaching = lazy(() => import("@/pages/ai-coaching"));
const AIConversationHistory = lazy(() => import("@/pages/ai-conversation-history"));
const DeepJournaling = lazy(() => import("@/pages/deep-journaling"));
const TherapeuticChat = lazy(() => import("@/pages/therapeutic-chat"));
const TherapeuticAnalytics = lazy(() => import("@/pages/therapeutic-analytics"));
const AdminAnalytics = lazy(() => import("@/pages/admin-analytics"));
const AdminUnlockDays = lazy(() => import("@/pages/admin-unlock-days"));
const AiCouchOnboarding = lazy(() => import("@/pages/ai-couch-onboarding"));
const AiCouchNewDashboard = lazy(() => import("@/pages/ai-couch-new-dashboard"));
const VisionBoard = lazy(() => import("@/pages/vision-board"));
const ElevenLabsVoiceTest = lazy(() => import("@/components/voice/elevenlabs-voice-test").then(m => ({ default: m.ElevenLabsVoiceTest })));

// Challenge-specific components - lazy loaded
const QuantumDashboard = lazy(() => import("@/pages/challenges/quantum-consciousness/dashboard"));
const QuantumJournal = lazy(() => import("@/pages/challenges/quantum-consciousness/journal"));
const QuantumProgress = lazy(() => import("@/pages/challenges/quantum-consciousness/progress"));
const QuantumDay = lazy(() => import("@/pages/challenges/quantum-consciousness/day"));

const MoneyDashboard = lazy(() => import("@/pages/challenges/money-blocks/dashboard"));
const MoneyJournal = lazy(() => import("@/pages/challenges/money-blocks/journal"));
const MoneyProgress = lazy(() => import("@/pages/challenges/money-blocks/progress"));
const MoneyDay = lazy(() => import("@/pages/challenges/money-blocks/day"));

const MoneyBlocksClearingDashboard = lazy(() => import("@/pages/challenges/money-blocks-clearing/dashboard"));
const MoneyBlocksClearingJournal = lazy(() => import("@/pages/challenges/money-blocks-clearing/journal"));
const MoneyBlocksClearingProgress = lazy(() => import("@/pages/challenges/money-blocks-clearing/progress"));
const MoneyBlocksClearingDay = lazy(() => import("@/pages/challenges/money-blocks-clearing/day"));

const MoneyManifestationDashboard = lazy(() => import("@/pages/challenges/money-manifestation/dashboard"));
const MoneyManifestationJournal = lazy(() => import("@/pages/challenges/money-manifestation/journal"));
const MoneyManifestationProgress = lazy(() => import("@/pages/challenges/money-manifestation/progress"));
const MoneyManifestationDay = lazy(() => import("@/pages/challenges/money-manifestation/day"));

const RelationshipsDashboard = lazy(() => import("@/pages/challenges/relationships/dashboard"));
const RelationshipsJournal = lazy(() => import("@/pages/challenges/relationships/journal"));
const RelationshipsProgress = lazy(() => import("@/pages/challenges/relationships/progress"));
const RelationshipsDay = lazy(() => import("@/pages/challenges/relationships/day"));

const HealthDashboard = lazy(() => import("@/pages/challenges/health-transformation/dashboard"));
const HealthJournal = lazy(() => import("@/pages/challenges/health-transformation/journal"));
const HealthProgress = lazy(() => import("@/pages/challenges/health-transformation/progress"));
const HealthDay = lazy(() => import("@/pages/challenges/health-transformation/day"));



const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Critical debugging
  console.log("Router - isAuthenticated:", isAuthenticated, "isLoading:", isLoading);

  if (isLoading) {
    console.log("Router - Showing loading state");
    return <LoadingFallback />;
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
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
        {/* Main shared routes */}
        <Route path="/" component={Dashboard} />
        <Route path="/challenges" component={Challenges} />
        <Route path="/ai-coaching" component={AICoaching} />
        <Route path="/ai-conversation-history" component={AIConversationHistory} />
        <Route path="/deep-journaling" component={DeepJournaling} />
        <Route path="/therapeutic-chat" component={TherapeuticChat} />
        <Route path="/therapeutic-analytics" component={TherapeuticAnalytics} />
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
      </Suspense>
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
