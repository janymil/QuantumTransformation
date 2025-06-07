import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, Target, Zap, Eye, Heart, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProgressPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('week')

  // Mock progress data - would come from API
  const progressData = {
    week: {
      visualizations: 5,
      affirmations: 28,
      rituals: 7,
      totalMinutes: 84
    },
    month: {
      visualizations: 22,
      affirmations: 124,
      rituals: 30,
      totalMinutes: 360
    },
    quarter: {
      visualizations: 68,
      affirmations: 372,
      rituals: 90,
      totalMinutes: 1080
    }
  }

  const currentData = progressData[selectedTimeframe]

  const lifeAreaProgress = [
    { area: 'Health', progress: 78, color: 'text-green-400', bgColor: 'bg-green-400/20' },
    { area: 'Finances', progress: 65, color: 'text-yellow-400', bgColor: 'bg-yellow-400/20' },
    { area: 'Relationships', progress: 82, color: 'text-pink-400', bgColor: 'bg-pink-400/20' },
    { area: 'Career', progress: 71, color: 'text-blue-400', bgColor: 'bg-blue-400/20' },
    { area: 'Spirituality', progress: 88, color: 'text-purple-400', bgColor: 'bg-purple-400/20' }
  ]

  const weeklyStats = [
    { day: 'Mon', visualizations: 1, rituals: 1 },
    { day: 'Tue', visualizations: 0, rituals: 1 },
    { day: 'Wed', visualizations: 1, rituals: 1 },
    { day: 'Thu', visualizations: 1, rituals: 1 },
    { day: 'Fri', visualizations: 1, rituals: 1 },
    { day: 'Sat', visualizations: 0, rituals: 1 },
    { day: 'Sun', visualizations: 1, rituals: 1 }
  ]

  return (
    <div className="min-h-screen pt-20 md:pt-32">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient-primary mb-4">
            Your Transformation Progress
          </h1>
          <p className="text-xl text-muted-foreground">
            Track your journey to manifesting your dream life
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex justify-center mb-8">
          <div className="card-holographic p-2 flex rounded-2xl">
            {(['week', 'month', 'quarter'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={cn(
                  "px-6 py-3 rounded-xl transition-all duration-300 focus-quantum capitalize",
                  selectedTimeframe === timeframe
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-holographic p-6 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-primary-glow" />
            </div>
            <div className="text-2xl font-bold text-primary-glow mb-2">
              {currentData.visualizations}
            </div>
            <div className="text-sm text-muted-foreground">Visualizations</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-holographic p-6 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-accent" />
            </div>
            <div className="text-2xl font-bold text-accent mb-2">
              {currentData.affirmations}
            </div>
            <div className="text-sm text-muted-foreground">Affirmations</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-holographic p-6 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-secondary" />
            </div>
            <div className="text-2xl font-bold text-secondary mb-2">
              {currentData.rituals}
            </div>
            <div className="text-sm text-muted-foreground">Rituals</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-holographic p-6 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-400/20 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400 mb-2">
              {currentData.totalMinutes}m
            </div>
            <div className="text-sm text-muted-foreground">Total Time</div>
          </motion.div>
        </div>

        {/* Life Areas Progress */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="card-holographic p-6">
            <h2 className="text-xl font-display font-semibold mb-6">Life Areas Progress</h2>
            <div className="space-y-4">
              {lifeAreaProgress.map((area, index) => (
                <motion.div
                  key={area.area}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{area.area}</span>
                    <span className={cn("text-sm font-medium", area.color)}>
                      {area.progress}%
                    </span>
                  </div>
                  <div className="progress-energy">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${area.progress}%` }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                      className={cn("h-full rounded-full", area.bgColor)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Weekly Activity Chart */}
          <div className="card-holographic p-6">
            <h2 className="text-xl font-display font-semibold mb-6">Weekly Activity</h2>
            <div className="flex items-end justify-between h-40">
              {weeklyStats.map((day, index) => (
                <motion.div
                  key={day.day}
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="flex flex-col items-center space-y-2"
                >
                  <div className="flex flex-col space-y-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${day.visualizations * 30 + 20}px` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                      className="w-6 bg-primary/60 rounded-t"
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${day.rituals * 25 + 15}px` }}
                      transition={{ delay: index * 0.1 + 0.6, duration: 0.6 }}
                      className="w-6 bg-accent/60 rounded-b"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-primary/60 rounded" />
                <span>Visualizations</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-accent/60 rounded" />
                <span>Rituals</span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="card-holographic p-6 mb-8">
          <h2 className="text-xl font-display font-semibold mb-6">Recent Achievements</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: '7-Day Streak',
                description: 'Completed daily rituals for a week',
                icon: Calendar,
                color: 'text-green-400',
                bgColor: 'bg-green-400/20'
              },
              {
                title: 'Vision Master',
                description: 'Completed 25 visualization sessions',
                icon: Eye,
                color: 'text-blue-400',
                bgColor: 'bg-blue-400/20'
              },
              {
                title: 'Mindset Shifter',
                description: 'Practiced 100 affirmations',
                icon: Brain,
                color: 'text-purple-400',
                bgColor: 'bg-purple-400/20'
              }
            ].map((achievement, index) => (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border border-white/10 text-center",
                  achievement.bgColor
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4",
                  achievement.bgColor
                )}>
                  <achievement.icon className={cn("w-6 h-6", achievement.color)} />
                </div>
                <h3 className="font-semibold mb-2">{achievement.title}</h3>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="card-holographic p-6">
          <h2 className="text-xl font-display font-semibold mb-6">Transformation Insights</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <TrendingUp className="w-4 h-4 text-primary-glow" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Consistency Improving</h3>
                  <p className="text-sm text-muted-foreground">
                    Your daily ritual completion rate increased by 23% this week
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Target className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Goal Alignment</h3>
                  <p className="text-sm text-muted-foreground">
                    Your visualization focus is strongly aligned with your stated goals
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Zap className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Energy Boost</h3>
                  <p className="text-sm text-muted-foreground">
                    Morning rituals are showing positive impact on your daily energy
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-purple-400/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Brain className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Mindset Shift</h3>
                  <p className="text-sm text-muted-foreground">
                    Affirmation practice is creating measurable changes in self-talk patterns
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}