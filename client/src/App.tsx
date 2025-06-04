import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard-simple";
import ChallengeDay from "@/pages/challenge-day";
import Journal from "@/pages/journal";
import Progress from "@/pages/progress";
import Challenges from "@/pages/challenges";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/navbar";

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
        <Route path="/" component={Dashboard} />
        <Route path="/challenges" component={Challenges} />
        <Route path="/challenge/:day" component={ChallengeDay} />
        <Route path="/journal" component={Journal} />
        <Route path="/progress" component={Progress} />
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
