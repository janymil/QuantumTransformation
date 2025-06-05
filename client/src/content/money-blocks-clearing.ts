// Money Blocks Clearing Challenge - 30 Day Content
export interface DayContent {
  day: number;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  topic: string;
  science: string;
  practice: {
    morning?: {
      title: string;
      steps: string[];
    };
    daytime?: {
      title: string;
      steps: string[];
    };
    evening?: {
      title: string;
      steps: string[];
    };
    steps?: string[];
    tips: string[];
    insights: string[];
  };
  affirmation: string;
  quote?: {
    text: string;
    author: string;
  };
}

export function getMoneyBlocksClearingContent(day: number): DayContent {
  const baseContent: Omit<DayContent, 'day'> = {
    title: `Day ${day}: Money Block Identification`,
    subtitle: "Discover and dissolve limiting money beliefs",
    description: "Identify deep-rooted money blocks and begin the process of clearing them from your subconscious",
    duration: "25-30 minutes",
    topic: "Money Blocks Clearing",
    science: "Neuroscience shows that limiting beliefs create neural pathways that can be rewired through conscious awareness and emotional clearing techniques.",
    practice: {
      morning: {
        title: "Morning Practice",
        steps: [
          "Begin your day with gratitude for your current financial situation",
          "Set an intention to notice money-related thoughts and emotions",
          "Practice deep breathing to center yourself"
        ]
      },
      daytime: {
        title: "During the Day",
        steps: [
          "Notice when money thoughts trigger emotional reactions",
          "Pause and breathe when you feel money anxiety",
          "Observe without judgment - just awareness"
        ]
      },
      evening: {
        title: "Evening Practice",
        steps: [
          "Reflect on money-related emotions that arose today",
          "Journal about any limiting beliefs you noticed",
          "Send love and acceptance to the parts of you that carry these beliefs"
        ]
      },
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
  };

  // Apply day-specific overrides if they exist
  const daySpecific = moneyBlocksClearingDayContent[day];
  if (daySpecific) {
    return {
      day,
      ...baseContent,
      ...daySpecific
    };
  }

  return {
    day,
    ...baseContent
  };
}

// Day-specific content - customize each day here
export const moneyBlocksClearingDayContent: Record<number, Partial<DayContent>> = {
  1: {
    title: "Day 1: Awareness Awakening",
    subtitle: "Beginning to see your money patterns"
  },
  2: {
    title: "Day 2: Childhood Money Messages", 
    subtitle: "Exploring early money programming"
  }
  // Add your specific content for each day here
  // You can override any part of the base content for specific days
};