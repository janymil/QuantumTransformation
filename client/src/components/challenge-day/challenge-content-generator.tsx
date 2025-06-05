export function generateChallengeContent(day: number, type: string) {
  const contentMap: Record<string, any> = {
    general_quantum: {
      day,
      title: `Day ${day}: Quantum Consciousness Foundation`,
      subtitle: "Master the fundamentals of quantum reality and consciousness elevation",
      description: "Master the fundamentals of quantum reality and consciousness elevation",
      duration: "15-20 minutes",
      topic: "Quantum Consciousness",
      science: "Neuroscience research shows that elevated emotional states create new neural pathways and increase brain coherence, supporting the quantum field theory of consciousness.",
      practice: {
        steps: [
          "Find a quiet space and sit comfortably",
          "Close your eyes and focus on your breath",
          "Visualize yourself in your ideal future state",
          "Feel the emotions of having achieved your goals",
          "Hold this elevated state for 10-15 minutes",
          "End with gratitude for the experience"
        ],
        tips: [
          "Start with 5 minutes if you're new to meditation",
          "Use background music to enhance focus",
          "Practice at the same time daily for consistency"
        ],
        insights: [
          "Your thoughts create your reality",
          "Elevated emotions signal new genes",
          "Consistent practice rewires your brain"
        ]
      },
      affirmation: "I am the creator of my reality, consciously choosing thoughts and emotions that align with my highest potential."
    },
    money_manifestation: {
      day,
      title: `Day ${day}: Abundance Consciousness`,
      subtitle: "Activate your natural abundance frequency",
      description: "Learn to embody the frequency of abundance and attract wealth through elevated consciousness",
      duration: "20-25 minutes",
      topic: "Money Manifestation",
      science: "Studies in neuroplasticity show that visualization of abundance activates the same brain regions as actual wealth experiences, creating new neural pathways for prosperity.",
      practice: {
        steps: [
          "Sit in meditation posture and breathe deeply",
          "Visualize yourself living in complete financial freedom",
          "Feel the emotions of abundance - gratitude, joy, security",
          "See money flowing to you effortlessly from multiple sources",
          "Experience the feeling of being a money magnet",
          "Anchor this feeling in your body and mind"
        ],
        tips: [
          "Focus on the feeling, not just the visual",
          "Practice abundance mindset throughout the day",
          "Notice and celebrate small financial wins"
        ],
        insights: [
          "Abundance is your natural state",
          "Money is energy in motion",
          "Your beliefs create your financial reality"
        ]
      },
      affirmation: "I am a powerful money magnet, attracting abundance effortlessly and joyfully."
    },
    quantum_health: {
      day,
      title: `Day ${day}: Cellular Regeneration`,
      subtitle: "Activate your body's natural healing intelligence",
      description: "Harness the quantum field to promote healing and vitality in your body",
      duration: "20-30 minutes",
      topic: "Quantum Healing",
      science: "Epigenetic research demonstrates that meditation and visualization can activate healing genes and reduce inflammation markers in the body.",
      practice: {
        steps: [
          "Relax deeply and connect with your breath",
          "Scan your body and send love to each part",
          "Visualize healing light filling every cell",
          "See your body functioning in perfect health",
          "Feel gratitude for your body's wisdom",
          "Program your cells for optimal health and vitality"
        ],
        tips: [
          "Focus on health, not illness",
          "Use specific visualizations for healing",
          "Practice self-love and body appreciation"
        ],
        insights: [
          "Your body has infinite healing capacity",
          "Thoughts and emotions affect cellular health",
          "Love is the most powerful healing force"
        ]
      },
      affirmation: "My body is healing perfectly, and every cell vibrates with health and vitality."
    },
    money_blocks_clearing: {
      day,
      title: `Day ${day}: Money Block Identification`,
      subtitle: "Discover and dissolve limiting money beliefs",
      description: "Identify deep-rooted money blocks and begin the process of clearing them from your subconscious",
      duration: "25-30 minutes",
      topic: "Money Blocks Clearing",
      science: "Neuroscience shows that limiting beliefs create neural pathways that can be rewired through conscious awareness and emotional clearing techniques.",
      practice: {
        steps: [
          "Sit quietly and bring money to mind",
          "Notice what emotions or thoughts arise",
          "Identify the underlying beliefs about money",
          "Feel where these beliefs are stored in your body",
          "Send love and acceptance to these parts",
          "Visualize releasing these old patterns with each exhale"
        ],
        tips: [
          "Be gentle and non-judgmental with yourself",
          "Journal about what comes up during practice",
          "Remember that blocks served a purpose in the past"
        ],
        insights: [
          "Money blocks are learned, not inherent",
          "Awareness is the first step to transformation",
          "You deserve financial abundance and freedom"
        ]
      },
      affirmation: "I release all limiting beliefs about money and embrace my worthiness to receive abundance."
    }
  };

  return contentMap[type] || contentMap.general_quantum;
}