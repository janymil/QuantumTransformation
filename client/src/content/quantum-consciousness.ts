// Quantum Consciousness Foundation Challenge - 30 Day Content
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

export function getQuantumConsciousnessContent(day: number): DayContent {
  const phase = getPhase(day);
  const phaseContent = {
    foundation: {
      topics: ['Consciousness Basics', 'Present Moment Awareness', 'Breath Mastery', 'Energy Fields', 'Intention Setting', 'Mind-Body Connection', 'Elevated Emotions'],
      focus: 'Building foundational awareness and basic quantum principles'
    },
    deepening: {
      topics: ['Quantum Field Theory', 'Timeline Shifting', 'Parallel Realities', 'Coherence States', 'Advanced Visualization', 'Energy Manipulation', 'Future Self Connection'],
      focus: 'Deepening practice and exploring advanced concepts'
    },
    integration: {
      topics: ['Reality Creation', 'Manifestation Mastery', 'Quantum Healing', 'Timeline Navigation', 'Dimensional Awareness', 'Unity Consciousness', 'Energy Mastery'],
      focus: 'Integrating quantum principles into daily life'
    },
    mastery: {
      topics: ['Quantum Mastery', 'Reality Design', 'Consciousness Evolution', 'Dimensional Travel', 'Quantum Leadership', 'Teaching Others', 'Living Quantum', 'Transcendence', 'Unity']
    }
  };

  const progressiveContent: Record<number, any> = {
    1: { title: 'Quantum Awakening', subtitle: 'Opening to infinite possibilities', practice: 'Basic breath awareness meditation to connect with the quantum field' },
    2: { title: 'Observer Consciousness', subtitle: 'Understanding your role as reality creator', practice: 'Meditation on collapsing quantum possibilities through observation' },
    3: { title: 'Elevated Emotions', subtitle: 'Accessing higher frequencies of being', practice: 'Heart coherence meditation to generate elevated emotional states' },
    4: { title: 'Present Moment Mastery', subtitle: 'Anchoring awareness in the eternal now', practice: 'Advanced present moment awareness and time transcendence meditation' },
    5: { title: 'Energy Field Activation', subtitle: 'Awakening to your electromagnetic nature', practice: 'Energy field expansion meditation and aura awareness exercises' },
    6: { title: 'Intention Programming', subtitle: 'Learning to program the quantum field', practice: 'Clear intention setting and quantum field programming meditation' },
    7: { title: 'Weekly Integration', subtitle: 'Integrating week one quantum foundations', practice: 'Integration meditation combining all foundation practices' }
  };

  const baseContent = progressiveContent[day] || progressiveContent[1];
  const topicIndex = (day - 1) % phaseContent[phase as keyof typeof phaseContent].topics.length;
  const currentTopic = phaseContent[phase as keyof typeof phaseContent].topics[topicIndex];

  return {
    day,
    title: baseContent.title.replace('Day X', `Day ${day}`),
    subtitle: baseContent.subtitle,
    description: `Explore ${currentTopic.toLowerCase()} and deepen your quantum consciousness practice`,
    duration: "15-20 minutes",
    topic: currentTopic,
    science: "Quantum mechanics shows that consciousness plays a fundamental role in the collapse of quantum possibilities into experienced reality.",
    practice: {
      steps: [
        "Sit comfortably and close your eyes",
        "Connect with your breath and center yourself",
        "Set a clear intention for your practice",
        "Visualize yourself as a quantum being of infinite possibility",
        "Feel elevated emotions of gratitude, joy, or love",
        "Program your quantum field with your desired reality"
      ],
      tips: [
        "Focus on feeling rather than thinking",
        "Practice regularly for best results",
        "Trust in your natural quantum abilities"
      ],
      insights: [
        "You are consciousness having a human experience",
        "Your thoughts and emotions create your reality",
        "The quantum field responds to your energy and intention"
      ]
    },
    affirmation: "I am a quantum conscious being, actively creating my reality through elevated awareness."
  };
}

function getPhase(day: number) {
  if (day <= 7) return 'foundation';
  if (day <= 14) return 'deepening';
  if (day <= 21) return 'integration';
  return 'mastery';
}