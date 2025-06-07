import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Plus, Edit, Trash2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Affirmation {
  id: string
  content: string
  lifeArea: string
  emotionalTone: string
  isActive: boolean
}

export default function AffirmationsPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAffirmation, setCurrentAffirmation] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  
  // Mock affirmations data - would come from API
  const [affirmations] = useState<Affirmation[]>([
    {
      id: '1',
      content: 'I am living my healthiest, most vibrant life',
      lifeArea: 'health',
      emotionalTone: 'energetic',
      isActive: true
    },
    {
      id: '2', 
      content: 'Money flows to me easily and abundantly',
      lifeArea: 'finances',
      emotionalTone: 'confident',
      isActive: true
    },
    {
      id: '3',
      content: 'I attract loving, supportive relationships',
      lifeArea: 'relationships',
      emotionalTone: 'loving',
      isActive: true
    },
    {
      id: '4',
      content: 'Every day I grow stronger and more resilient',
      lifeArea: 'personal_growth',
      emotionalTone: 'empowering',
      isActive: true
    },
    {
      id: '5',
      content: 'I am grateful for all the abundance in my life',
      lifeArea: 'spirituality',
      emotionalTone: 'grateful',
      isActive: false
    }
  ])

  const activeAffirmations = affirmations.filter(a => a.isActive)

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const getLifeAreaColor = (lifeArea: string) => {
    const colors = {
      health: 'text-green-400 bg-green-400/20',
      finances: 'text-yellow-400 bg-yellow-400/20', 
      relationships: 'text-pink-400 bg-pink-400/20',
      personal_growth: 'text-purple-400 bg-purple-400/20',
      spirituality: 'text-blue-400 bg-blue-400/20',
      career: 'text-orange-400 bg-orange-400/20'
    }
    return colors[lifeArea as keyof typeof colors] || 'text-gray-400 bg-gray-400/20'
  }

  return (
    <div className="min-h-screen pt-20 md:pt-32">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient-primary mb-4">
            Your Affirmations
          </h1>
          <p className="text-xl text-muted-foreground">
            Personalized affirmations based on your journal entries and goals
          </p>
        </div>

        {/* Affirmation Player */}
        <div className="card-holographic p-8 mb-8">
          <div className="text-center">
            
            {/* Current Affirmation Display */}
            <motion.div
              key={currentAffirmation}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="mb-4">
                <span className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                  getLifeAreaColor(activeAffirmations[currentAffirmation]?.lifeArea || '')
                )}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  {activeAffirmations[currentAffirmation]?.lifeArea?.replace('_', ' ') || 'Personal Growth'}
                </span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-display font-semibold mb-6 leading-relaxed">
                "{activeAffirmations[currentAffirmation]?.content || 'Loading your affirmation...'}"
              </h2>
              
              <div className="text-sm text-muted-foreground">
                Affirmation {currentAffirmation + 1} of {activeAffirmations.length}
              </div>
            </motion.div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center space-x-6 mb-6">
              <button
                onClick={() => setCurrentAffirmation(Math.max(0, currentAffirmation - 1))}
                disabled={currentAffirmation === 0}
                className={cn(
                  "p-3 rounded-full transition-all duration-200 focus-quantum",
                  currentAffirmation === 0 
                    ? "opacity-50 cursor-not-allowed bg-surface" 
                    : "bg-surface hover:bg-surface-elevated border border-white/10"
                )}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              <motion.button
                onClick={togglePlayback}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-quantum w-16 h-16 rounded-full flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </motion.button>

              <button
                onClick={() => setCurrentAffirmation(Math.min(activeAffirmations.length - 1, currentAffirmation + 1))}
                disabled={currentAffirmation === activeAffirmations.length - 1}
                className={cn(
                  "p-3 rounded-full transition-all duration-200 focus-quantum",
                  currentAffirmation === activeAffirmations.length - 1
                    ? "opacity-50 cursor-not-allowed bg-surface"
                    : "bg-surface hover:bg-surface-elevated border border-white/10"
                )}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>

            {/* Additional Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg bg-surface hover:bg-surface-elevated border border-white/10 transition-colors focus-quantum"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              <div className="text-sm text-muted-foreground">
                Auto-play enabled
              </div>
            </div>
          </div>
        </div>

        {/* Affirmations List */}
        <div className="card-holographic p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-semibold">All Affirmations</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-quantum flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Generate More</span>
            </motion.button>
          </div>

          <div className="space-y-4">
            {affirmations.map((affirmation, index) => (
              <motion.div
                key={affirmation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-200",
                  affirmation.isActive
                    ? "bg-surface-elevated border-white/20"
                    : "bg-surface/50 border-white/10 opacity-60"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getLifeAreaColor(affirmation.lifeArea)
                      )}>
                        {affirmation.lifeArea.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {affirmation.emotionalTone}
                      </span>
                    </div>
                    <p className="text-foreground font-medium leading-relaxed">
                      {affirmation.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setCurrentAffirmation(index)}
                      className="p-2 rounded-lg hover:bg-surface transition-colors focus-quantum"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-surface transition-colors focus-quantum">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-surface transition-colors focus-quantum">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card-holographic p-6 text-center">
            <div className="text-2xl font-bold text-primary-glow mb-2">
              {activeAffirmations.length}
            </div>
            <div className="text-sm text-muted-foreground">Active Affirmations</div>
          </div>
          
          <div className="card-holographic p-6 text-center">
            <div className="text-2xl font-bold text-accent mb-2">7</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>
          
          <div className="card-holographic p-6 text-center">
            <div className="text-2xl font-bold text-secondary mb-2">3</div>
            <div className="text-sm text-muted-foreground">Life Areas</div>
          </div>
        </div>
      </div>
    </div>
  )
}