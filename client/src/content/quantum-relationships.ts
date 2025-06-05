// Quantum Relationships Challenge - 30 Day Content
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

export function getQuantumRelationshipsContent(day: number): DayContent {
  return {
    day,
    title: `Day ${day}: Heart Coherence`,
    subtitle: "Connect from higher consciousness",
    description: "Transform all your relationships through quantum consciousness and elevated emotional states",
    duration: "20-25 minutes",
    topic: "Relationship Transformation",
    science: "Heart coherence research shows that when we maintain coherent heart rhythms, we positively influence the electromagnetic fields of those around us.",
    practice: {
      steps: [
        "Place your hand on your heart and breathe deeply",
        "Generate feelings of love and appreciation",
        "Extend this energy to your relationships",
        "Visualize harmonious connections with others",
        "Send love to challenging relationships",
        "Anchor this energy in your heart center"
      ],
      tips: [
        "Start with self-love before extending to others",
        "Practice compassion for difficult relationships",
        "Focus on connection rather than control"
      ],
      insights: [
        "Love is the most powerful force for transformation",
        "Your energy field affects all your relationships",
        "Authentic connection begins with inner harmony"
      ]
    },
    affirmation: "I attract and maintain loving, harmonious relationships through my elevated consciousness."
  };
}