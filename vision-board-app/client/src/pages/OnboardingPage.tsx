import { useState } from 'react'
import { Link } from 'wouter'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, Heart, DollarSign, Users, Briefcase, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const LIFE_AREAS = [
  { id: 'health', label: 'Health', icon: Heart, description: 'Physical wellness, fitness, nutrition' },
  { id: 'finances', label: 'Finances', icon: DollarSign, description: 'Money, abundance, financial freedom' },
  { id: 'relationships', label: 'Relationships', icon: Users, description: 'Love, family, friendships' },
  { id: 'career', label: 'Career', icon: Briefcase, description: 'Work, purpose, professional growth' },
  { id: 'spirituality', label: 'Spirituality', icon: Sparkles, description: 'Inner peace, connection, meaning' },
  { id: 'personal_growth', label: 'Personal Growth', icon: User, description: 'Learning, skills, self-development' },
]

export default function OnboardingPage() {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const toggleLifeArea = (areaId: string) => {
    setSelectedAreas(prev => {
      if (prev.includes(areaId)) {
        return prev.filter(id => id !== areaId)
      } else if (prev.length < 3) {
        return [...prev, areaId]
      }
      return prev
    })
  }

  const handleNext = async () => {
    if (selectedAreas.length === 0) return
    
    setIsLoading(true)
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Navigate to vision board creation
    window.location.href = '/vision-board'
  }

  return (
    <div className="min-h-screen pt-20 md:pt-32">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                  step <= currentStep
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-surface border border-white/20 text-muted-foreground"
                )}
              >
                {step < currentStep ? <Check className="w-5 h-5" /> : step}
              </div>
            ))}
          </div>
          <div className="progress-energy w-full max-w-md mx-auto">
            <div 
              className="h-full bg-gradient-to-r from-primary-glow to-accent rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-gradient-primary">
                Set Your Life Areas
              </h1>
              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                Which areas do you want to work on? Choose up to 3 areas where you desire transformation.
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {LIFE_AREAS.map((area) => {
                  const Icon = area.icon
                  const isSelected = selectedAreas.includes(area.id)
                  const isDisabled = !isSelected && selectedAreas.length >= 3

                  return (
                    <motion.button
                      key={area.id}
                      onClick={() => !isDisabled && toggleLifeArea(area.id)}
                      disabled={isDisabled}
                      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                      className={cn(
                        "card-holographic p-6 text-left transition-all duration-300 focus-quantum",
                        isSelected
                          ? "ring-2 ring-primary shadow-glow bg-primary/10"
                          : isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-surface-elevated/50"
                      )}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface-elevated text-muted-foreground"
                        )}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{area.label}</h3>
                          <p className="text-sm text-muted-foreground">{area.description}</p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              <div className="flex flex-col items-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedAreas.length}/3 areas
                </p>
                
                <motion.button
                  onClick={() => selectedAreas.length > 0 && setCurrentStep(2)}
                  disabled={selectedAreas.length === 0}
                  whileHover={{ scale: selectedAreas.length > 0 ? 1.05 : 1 }}
                  whileTap={{ scale: selectedAreas.length > 0 ? 0.95 : 1 }}
                  className={cn(
                    "btn-quantum group flex items-center space-x-2 transition-all duration-300",
                    selectedAreas.length === 0 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-gradient-primary">
                AI is Analyzing Your Data
              </h1>
              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                We're connecting to your Quantum Challenges journey to create a deeply personalized vision board experience.
              </p>

              <div className="card-holographic p-12 mb-12">
                <div className="flex flex-col items-center space-y-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-4 border-primary/30 border-t-primary"
                  />
                  
                  <div className="space-y-4 text-center">
                    <h3 className="text-xl font-semibold">Personalizing Your Experience</h3>
                    <div className="space-y-2 text-muted-foreground">
                      <p>✓ Analyzing your journal entries</p>
                      <p>✓ Understanding your goals</p>
                      <p>✓ Matching your communication style</p>
                      <p>✓ Creating custom affirmations</p>
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={handleNext}
                disabled={isLoading}
                whileHover={{ scale: !isLoading ? 1.05 : 1 }}
                whileTap={{ scale: !isLoading ? 0.95 : 1 }}
                className={cn(
                  "btn-quantum group flex items-center space-x-2 mx-auto",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <span>{isLoading ? 'Creating Your Vision Board...' : 'Create My Vision Board'}</span>
                {!isLoading && <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to Quantum Challenges Link */}
        <div className="text-center mt-16">
          <Link 
            href="http://localhost:5000"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to Quantum Challenges
          </Link>
        </div>
      </div>
    </div>
  )
}