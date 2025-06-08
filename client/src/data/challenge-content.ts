export interface ChallengeContent {
  day: number;
  title: string;
  topic: string;
  subtitle: string;
  duration: string;
  description: string;
  science: string;
  practice: {
    name: string;
    description: string;
    steps: string[];
    tips: string[];
  };
  insights: string[];
  quote?: {
    text: string;
    author: string;
  };
  affirmation?: string;
}

export const challengeContent: ChallengeContent[] = [
  {
    day: 1,
    title: "Setting Quantum Intentions",
    topic: "Intention Setting",
    subtitle: "Activate your quantum field through clear intention",
    duration: "20 minutes",
    description: "Begin your quantum journey by setting powerful intentions that align with your desired future state.",
    science: "Quantum physics shows that observation affects reality. Your focused intention acts as the observer, collapsing infinite possibilities into your chosen reality.",
    practice: {
      name: "Quantum Intention Meditation",
      description: "A guided meditation to set clear, elevated intentions for your transformation.",
      steps: [
        "Find a quiet space and sit comfortably",
        "Close your eyes and focus on your breath",
        "Visualize your desired future self",
        "Feel the emotions of already having achieved your goals",
        "Set a clear intention for your transformation"
      ],
      tips: [
        "Use present tense language",
        "Focus on feelings, not just outcomes",
        "Be specific about what you want to create"
      ]
    },
    insights: [
      "Intention shapes reality at the quantum level",
      "Elevated emotions amplify manifestation power",
      "Clarity of vision accelerates transformation"
    ],
    quote: {
      text: "The quantum field responds not to what we want; it responds to who we are being.",
      author: "Joe Dispenza"
    },
    affirmation: "I am the conscious creator of my reality. My intentions shape my quantum field."
  },
  {
    day: 2,
    title: "Observer Effect Practice",
    topic: "Consciousness",
    subtitle: "Become the observer of your thoughts and patterns",
    duration: "25 minutes",
    description: "Learn to observe your thoughts without judgment, creating space for new possibilities to emerge.",
    science: "The observer effect in quantum mechanics demonstrates that consciousness affects physical reality. By becoming aware of your thoughts, you can change your neural patterns.",
    practice: {
      name: "Mindful Observation",
      description: "Practice observing your thoughts and emotions without attachment.",
      steps: [
        "Sit in meditation posture",
        "Notice thoughts as they arise",
        "Label them as 'thinking' without judgment",
        "Return attention to breath",
        "Observe patterns in your thinking"
      ],
      tips: [
        "Don't try to stop thoughts",
        "Maintain curious, non-judgmental awareness",
        "Notice recurring thought patterns"
      ]
    },
    insights: [
      "Awareness creates the possibility for change",
      "Observing thoughts reduces their power over you",
      "Consciousness is the foundation of transformation"
    ],
    quote: {
      text: "You are not your thoughts; you are the observer of your thoughts.",
      author: "Eckhart Tolle"
    },
    affirmation: "I observe my thoughts with awareness and compassion. I am consciousness itself."
  }
];