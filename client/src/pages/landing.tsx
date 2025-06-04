import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Target, Users, Star, BookOpen } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Brain,
      title: "Quantum Consciousness",
      description: "Learn to harness the power of consciousness to shape your reality through proven scientific principles."
    },
    {
      icon: Zap,
      title: "30-Day Transformation",
      description: "A structured journey designed to create lasting change in how you think, feel, and experience life."
    },
    {
      icon: Target,
      title: "Personalized Practice",
      description: "AI-powered guidance adapts to your progress and provides insights tailored to your unique journey."
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Connect with like-minded individuals on the same transformational path towards conscious creation."
    },
    {
      icon: Star,
      title: "Achievement System",
      description: "Gamified experience with badges, streaks, and milestones to keep you motivated and engaged."
    },
    {
      icon: BookOpen,
      title: "Integrated Journaling",
      description: "Track your insights, experiences, and growth with our comprehensive journaling system."
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Entrepreneur",
      content: "This challenge completely transformed how I approach my goals. The quantum principles actually work!",
      rating: 5
    },
    {
      name: "Michael R.",
      role: "Teacher",
      content: "I've tried many programs, but this one combines science with spirituality in a way that just makes sense.",
      rating: 5
    },
    {
      name: "Lisa K.",
      role: "Artist",
      content: "The daily practices are simple but powerful. I'm seeing real changes in my life after just 2 weeks.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 text-sm font-medium px-4 py-2">
              ✨ Transform Your Reality in 30 Days
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              The <span className="text-gradient">Quantum Challenge</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Master the art of conscious creation through a scientifically-backed 30-day journey 
              combining quantum physics with the teachings of Joe Dispenza and Neville Goddard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary text-white hover:opacity-90 transition-all duration-300 px-8 py-4 text-lg font-semibold"
                onClick={() => window.location.href = '/api/login'}
              >
                Start Your Transformation
              </Button>
              <p className="text-sm text-muted-foreground">
                No credit card required • Join 10,000+ quantum creators
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why the Quantum Challenge Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Combining cutting-edge neuroscience with ancient wisdom to create measurable transformation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-muted/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your 30-Day Journey
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Each day builds upon the last, creating a powerful momentum towards transformation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { week: 1, title: "Foundation", description: "Build awareness and understand quantum principles" },
              { week: 2, title: "Integration", description: "Apply concepts through daily practices and meditation" },
              { week: 3, title: "Manifestation", description: "Learn to consciously create your desired reality" },
              { week: 4, title: "Mastery", description: "Solidify your new way of being and thinking" }
            ].map((phase, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">W{phase.week}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{phase.title}</h3>
                <p className="text-muted-foreground">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Real Transformations
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what others have achieved on their quantum journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-warning fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-primary py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Reality?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of others who have discovered the power of quantum consciousness. 
            Your transformation begins with a single step.
          </p>
          <Button 
            size="lg"
            variant="secondary"
            className="bg-white text-primary hover:bg-white/90 transition-all duration-300 px-8 py-4 text-lg font-semibold"
            onClick={() => window.location.href = '/api/login'}
          >
            Begin Your Quantum Journey
          </Button>
        </div>
      </div>
    </div>
  );
}
