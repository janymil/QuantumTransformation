import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Check, Play, Calendar, Timer, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DailyRitualPage() {
  const [selectedRitual, setSelectedRitual] = useState<'morning' | 'evening'>('morning')
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [isRitualActive, setIsRitualActive] = useState(false)

  const morningRitual = [
    { id: 'gratitude', title: 'Gratitude Practice', duration: '2 min', description: 'Write 3 things you\'re grateful for' },
    { id: 'visualization', title: 'Vision Board Meditation', duration: '5 min', description: 'Focus on your vision board with guided breathing' },
    { id: 'affirmations', title: 'Personal Affirmations', duration: '3 min', description: 'Repeat your customized affirmations' },
    { id: 'intention', title: 'Daily Intention', duration: '2 min', description: 'Set your intention for the day' }
  ]

  const eveningRitual = [
    { id: 'reflection', title: 'Day Reflection', duration: '3 min', description: 'Review your day and progress' },
    { id: 'visualization', title: 'Future Self Meditation', duration: '5 min', description: 'Connect with your future self' },
    { id: 'release', title: 'Release & Forgive', duration: '2 min', description: 'Let go of today\'s stress and challenges' },
    { id: 'gratitude', title: 'Evening Gratitude', duration: '2 min', description: 'Appreciate today\'s wins and lessons' }
  ]

  const currentRitual = selectedRitual === 'morning' ? morningRitual : eveningRitual

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    )
  }

  const startRitual = () => {
    setIsRitualActive(true)
    setCompletedSteps([])
  }

  return (
    <div className="min-h-screen pt-20 md:pt-32">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient-primary mb-4">
            Daily Ritual
          </h1>
          <p className="text-xl text-muted-foreground">
            Transform your mind through consistent daily practices
          </p>
        </div>

        {/* Ritual Selector */}
        <div className="flex justify-center mb-8">
          <div className="card-holographic p-2 flex rounded-2xl">
            <button
              onClick={() => setSelectedRitual('morning')}
              className={cn(
                "flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 focus-quantum",
                selectedRitual === 'morning'
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="w-5 h-5" />
              <span className="font-medium">Morning Ritual</span>
            </button>
            <button
              onClick={() => setSelectedRitual('evening')}
              className={cn(
                "flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 focus-quantum",
                selectedRitual === 'evening'
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className="w-5 h-5" />
              <span className="font-medium">Evening Ritual</span>
            </button>
          </div>
        </div>

        {/* Ritual Content */}
        <div className="card-holographic p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-display font-semibold mb-2">
                {selectedRitual === 'morning' ? 'Morning' : 'Evening'} Transformation Ritual
              </h2>
              <p className="text-muted-foreground">
                {selectedRitual === 'morning' 
                  ? 'Start your day with intention and clarity'
                  : 'End your day with reflection and gratitude'
                }
              </p>
            </div>
            
            <motion.button
              onClick={startRitual}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-quantum flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Start Ritual</span>
            </motion.button>
          </div>

          {/* Ritual Steps */}
          <div className="space-y-4">
            {currentRitual.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id)
              const isActive = isRitualActive && !isCompleted && 
                (index === 0 || completedSteps.includes(currentRitual[index - 1].id))

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-6 rounded-xl border transition-all duration-300",
                    isCompleted
                      ? "bg-primary/10 border-primary/30"
                      : isActive
                      ? "bg-accent/10 border-accent/30 ring-2 ring-accent/20"
                      : "bg-surface border-white/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleStep(step.id)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                          isCompleted
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground hover:border-primary"
                        )}
                      >
                        {isCompleted && <Check className="w-4 h-4" />}
                      </button>
                      
                      <div>
                        <h3 className={cn(
                          "font-semibold",
                          isCompleted ? "text-primary" : "text-foreground"
                        )}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Timer className="w-4 h-4" />
                        <span>{step.duration}</span>
                      </div>
                      
                      {isActive && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-3 h-3 rounded-full bg-accent"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Progress */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedSteps.length} of {currentRitual.length} steps
              </span>
            </div>
            <div className="progress-energy">
              <div 
                className="h-full bg-gradient-to-r from-primary-glow to-accent rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps.length / currentRitual.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card-holographic p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-primary-glow" />
            </div>
            <div className="text-2xl font-bold text-primary-glow mb-2">7</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>
          
          <div className="card-holographic p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div className="text-2xl font-bold text-accent mb-2">42</div>
            <div className="text-sm text-muted-foreground">Total Rituals</div>
          </div>
          
          <div className="card-holographic p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <Timer className="w-6 h-6 text-secondary" />
            </div>
            <div className="text-2xl font-bold text-secondary mb-2">12m</div>
            <div className="text-sm text-muted-foreground">Avg Duration</div>
          </div>
        </div>

        {/* Completion Celebration */}
        {completedSteps.length === currentRitual.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-holographic p-8 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-glow to-accent flex items-center justify-center mx-auto mb-6"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            
            <h3 className="text-2xl font-display font-bold text-gradient-primary mb-4">
              Ritual Complete!
            </h3>
            <p className="text-muted-foreground mb-6">
              You've successfully completed your {selectedRitual} transformation ritual. 
              Your subconscious mind is now aligned with your vision.
            </p>
            
            <motion.button
              onClick={() => {
                setCompletedSteps([])
                setIsRitualActive(false)
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-quantum"
            >
              Start Another Ritual
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}