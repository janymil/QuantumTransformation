import { Route, Switch } from 'wouter'
import { Toaster } from '@/components/ui/toaster'
import LandingPage from '@/pages/LandingPage'
import OnboardingPage from '@/pages/OnboardingPage'
import VisionBoardPage from '@/pages/VisionBoardPage'
import AffirmationsPage from '@/pages/AffirmationsPage'
import DailyRitualPage from '@/pages/DailyRitualPage'
import ProgressPage from '@/pages/ProgressPage'
import Navigation from '@/components/Navigation'

function App() {
  return (
    <div className="min-h-screen bg-background neural-grid">
      <div className="relative z-10">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Switch>
            <Route path="/" component={LandingPage} />
            <Route path="/onboarding" component={OnboardingPage} />
            <Route path="/vision-board" component={VisionBoardPage} />
            <Route path="/affirmations" component={AffirmationsPage} />
            <Route path="/daily-ritual" component={DailyRitualPage} />
            <Route path="/progress" component={ProgressPage} />
            <Route>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gradient-primary mb-4">
                  Page Not Found
                </h1>
                <p className="text-muted-foreground">
                  The page you're looking for doesn't exist.
                </p>
              </div>
            </Route>
          </Switch>
        </main>
        <Toaster />
      </div>
    </div>
  )
}

export default App