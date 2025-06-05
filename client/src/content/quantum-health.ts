// Quantum Health Challenge - 30 Day Content
export interface DayContent {
  day: number;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  topic: string;
  science: string;
  practice: {
    steps: string[];
    tips: string[];
    insights: string[];
  };
  affirmation: string;
  quote?: {
    text: string;
    author: string;
  };
}

export function getQuantumHealthContent(day: number): DayContent {
  return {
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
  };
}