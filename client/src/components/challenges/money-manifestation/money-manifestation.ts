// Money Manifestation Challenge - 30 Day Content
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

export function getMoneyManifestationContent(day: number): DayContent {
  const progressiveContent: Record<number, any> = {
    1: { title: 'Abundance Awakening', subtitle: 'Awakening to your natural abundance', practice: 'Basic abundance meditation to connect with your inherent worthiness' },
    2: { title: 'Money Mindset Foundation', subtitle: 'Building positive money beliefs', practice: 'Identifying and transforming limiting money beliefs through conscious awareness' },
    3: { title: 'Wealth Consciousness', subtitle: 'Embodying the frequency of wealth', practice: 'Meditation to embody the emotional frequency of financial abundance' },
    4: { title: 'Gratitude Amplification', subtitle: 'Amplifying abundance through gratitude', practice: 'Advanced gratitude practice for current and future financial blessings' },
    5: { title: 'Money Magnet Activation', subtitle: 'Becoming a magnet for financial opportunities', practice: 'Energy work to activate your natural money magnetism' },
    6: { title: 'Prosperity Visualization', subtitle: 'Detailed visualization of financial success', practice: 'Multi-sensory visualization of your ideal financial life' },
    7: { title: 'Weekly Abundance Integration', subtitle: 'Integrating week one abundance principles', practice: 'Integration meditation combining all foundation abundance practices' }
  };

  const baseContent = progressiveContent[day] || progressiveContent[1];

  return {
    day,
    title: `Day ${day}: ${baseContent.title}`,
    subtitle: baseContent.subtitle,
    description: "Cultivate wealth consciousness and attract financial abundance through elevated states",
    duration: "15-20 minutes",
    topic: "Abundance Manifestation",
    science: "Studies show that visualization combined with elevated emotions activates the same neural networks as actual experiences, programming the subconscious for abundance.",
    practice: {
      steps: [
        "Sit in meditation posture and connect with your heart center",
        "Breathe deeply and feel gratitude for all current abundance",
        "Visualize yourself living in complete financial freedom",
        "Feel the emotions of having abundant wealth flowing to you",
        "See money coming to you from multiple sources with ease",
        "Anchor these feelings in your body and nervous system"
      ],
      tips: [
        "Focus on the feeling of abundance, not lack",
        "Visualize with all your senses engaged",
        "Practice gratitude for money already in your life"
      ],
      insights: [
        "Abundance is your natural state of being",
        "Money is energy that flows where it's welcomed",
        "Your vibration determines your financial reality"
      ]
    },
    affirmation: "I am a magnet for money and abundance flows to me easily and effortlessly."
  };
}