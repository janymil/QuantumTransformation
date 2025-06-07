import { Link } from 'wouter'
import { ArrowRight, Sparkles, Brain, Target, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LandingPage() {
  return (
    <div className="min-h-screen pt-20 md:pt-32">
      {/* Hero Section */}
      <section className="relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto px-4"
        >
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-6 py-3 mb-8"
            >
              <Sparkles className="w-5 h-5 text-primary-glow" />
              <span className="text-primary-glow font-medium">AI-Powered Transformation</span>
            </motion.div>
          </div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight"
          >
            Your New Life
            <br />
            <span className="text-gradient-cosmic">Begins Here</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Create a clear vision and reprogram your subconscious daily.
            <br />
            Transform thoughts into reality with AI-guided visualization.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link 
              href="/onboarding"
              className="btn-quantum group flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <button className="px-8 py-4 rounded-xl border border-white/20 text-foreground hover:bg-surface-elevated/50 transition-all duration-300 focus-quantum">
              Watch Demo
            </button>
          </motion.div>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-primary-glow/20 to-accent/20 blur-xl"
          />
          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-accent/20 to-secondary/20 blur-xl"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto px-4"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-gradient-primary">
              Less Design, More Transformation
            </h2>
            <p className="text-xl text-muted-foreground">
              Unlike other apps, we focus on your inner transformation, not design skills
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Guided Process",
                description: "No blank canvas paralysis. AI analyzes your goals and creates personalized vision boards automatically.",
                delay: 0.2
              },
              {
                icon: Target,
                title: "Daily Transformation",
                description: "Built-in morning rituals and evening reflections to rewire your subconscious mind consistently.",
                delay: 0.4
              },
              {
                icon: Zap,
                title: "Instant Personalization",
                description: "Connects to your Quantum Challenges data for deeply personalized content that speaks to your soul.",
                delay: 0.6
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: feature.delay, duration: 0.6 }}
                viewport={{ once: true }}
                className="card-holographic group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-glow to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center px-4"
        >
          <div className="card-holographic p-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-gradient-cosmic">
              Ready to Transform Your Reality?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start your personalized vision board journey in less than 5 minutes
            </p>
            <Link 
              href="/onboarding"
              className="btn-quantum group inline-flex items-center space-x-2"
            >
              <span>Begin Transformation</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}