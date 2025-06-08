import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Download, Share2, Plus, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VisionBoardItem {
  id: string
  type: 'image' | 'text'
  content: string
  x: number
  y: number
  width: number
  height: number
  lifeArea: string
}

export default function VisionBoardPage() {
  const [isVisualizationMode, setIsVisualizationMode] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  
  // Mock vision board data - this would come from the API
  const [visionBoardItems] = useState<VisionBoardItem[]>([
    {
      id: '1',
      type: 'image',
      content: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      x: 50,
      y: 50,
      width: 280,
      height: 200,
      lifeArea: 'health'
    },
    {
      id: '2',
      type: 'image', 
      content: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop',
      x: 350,
      y: 50,
      width: 280,
      height: 200,
      lifeArea: 'finances'
    },
    {
      id: '3',
      type: 'image',
      content: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=300&fit=crop',
      x: 650,
      y: 50,
      width: 280,
      height: 200,
      lifeArea: 'relationships'
    },
    {
      id: '4',
      type: 'text',
      content: 'I am living my healthiest, most vibrant life',
      x: 50,
      y: 280,
      width: 280,
      height: 80,
      lifeArea: 'health'
    },
    {
      id: '5',
      type: 'text',
      content: 'Money flows to me easily and abundantly',
      x: 350,
      y: 280,
      width: 280,
      height: 80,
      lifeArea: 'finances'
    },
    {
      id: '6',
      type: 'text',
      content: 'I attract loving, supportive relationships',
      x: 650,
      y: 280,
      width: 280,
      height: 80,
      lifeArea: 'relationships'
    }
  ])

  const startVisualization = () => {
    setIsVisualizationMode(true)
  }

  const stopVisualization = () => {
    setIsVisualizationMode(false)
  }

  if (isVisualizationMode) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="relative w-full h-full overflow-hidden">
          {/* Ambient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-teal-900/30" />
          
          {/* Floating Particles */}
          <div className="absolute inset-0">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                animate={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                transition={{
                  duration: 10 + Math.random() * 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            ))}
          </div>

          {/* Vision Board Items in Fullscreen */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="grid grid-cols-3 gap-8 max-w-6xl w-full">
              {visionBoardItems.filter(item => item.type === 'image').map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.5, duration: 1 }}
                  className="relative rounded-2xl overflow-hidden shadow-2xl"
                >
                  <img 
                    src={item.content} 
                    alt={`Vision for ${item.lifeArea}`}
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.5 + 0.5, duration: 0.8 }}
                    className="absolute bottom-4 left-4 right-4"
                  >
                    <p className="text-white text-lg font-medium capitalize">
                      {item.lifeArea} Vision
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Affirmations Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 1 }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center"
          >
            <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-2xl">
              <motion.p
                key={Math.floor(Date.now() / 5000)} // Changes every 5 seconds
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-2xl text-white font-medium"
              >
                {visionBoardItems.find(item => item.type === 'text')?.content}
              </motion.p>
            </div>
          </motion.div>

          {/* Controls */}
          <div className="absolute top-8 right-8 flex items-center space-x-4">
            <button
              onClick={stopVisualization}
              className="p-3 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              <Pause className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 md:pt-32">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient-primary mb-2">
              Your Vision Board
            </h1>
            <p className="text-muted-foreground">
              Personalized for Health, Finances & Relationships
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="p-3 rounded-xl bg-surface hover:bg-surface-elevated border border-white/10 transition-colors focus-quantum">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-xl bg-surface hover:bg-surface-elevated border border-white/10 transition-colors focus-quantum">
              <Download className="w-5 h-5" />
            </button>
            <motion.button
              onClick={startVisualization}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-quantum flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Start Visualization</span>
            </motion.button>
          </div>
        </div>

        {/* Vision Board Canvas */}
        <div className="card-holographic p-8 mb-8">
          <div className="relative w-full h-96 bg-gradient-to-br from-surface to-surface-elevated rounded-xl overflow-hidden border border-white/10">
            
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="grid grid-cols-12 grid-rows-8 h-full">
                {Array.from({ length: 96 }).map((_, i) => (
                  <div key={i} className="border border-white/10" />
                ))}
              </div>
            </div>

            {/* Vision Board Items */}
            {visionBoardItems.map((item) => (
              <motion.div
                key={item.id}
                className={cn(
                  "absolute cursor-pointer group transition-all duration-200",
                  selectedItem === item.id && "ring-2 ring-primary shadow-glow"
                )}
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  height: item.height
                }}
                onClick={() => setSelectedItem(item.id)}
                whileHover={{ scale: 1.02 }}
                drag
                dragMomentum={false}
              >
                {item.type === 'image' ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <img 
                      src={item.content} 
                      alt={`${item.lifeArea} vision`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Edit3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-center text-center">
                    <p className="text-sm font-medium text-primary-glow">
                      {item.content}
                    </p>
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Edit3 className="w-4 h-4 text-primary-glow" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Add New Item Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-glow hover:bg-primary/30 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card-holographic p-6 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Daily Ritual</h3>
                <p className="text-sm text-muted-foreground">Start your morning visualization</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card-holographic p-6 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-primary-glow" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Add Images</h3>
                <p className="text-sm text-muted-foreground">Upload or generate new vision images</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card-holographic p-6 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <RotateCcw className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Regenerate</h3>
                <p className="text-sm text-muted-foreground">Create new AI-generated board</p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Affirmations Preview */}
        <div className="card-holographic p-6">
          <h2 className="text-xl font-display font-semibold mb-4">Today's Affirmations</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {visionBoardItems.filter(item => item.type === 'text').map((affirmation) => (
              <div key={affirmation.id} className="bg-surface/50 rounded-lg p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <span className="text-sm text-muted-foreground capitalize">{affirmation.lifeArea}</span>
                </div>
                <p className="text-sm font-medium">{affirmation.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}