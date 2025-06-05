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
    subtitle: "Beginning to see your money patterns",
    practice: {
      morning: {
        title: "Money Awareness Check-In",
        steps: [
          "Begin your day with 3 deep breaths and center yourself",
          "Set an intention to observe money thoughts with curiosity",
          "Notice your first money-related thought of the day",
          "Ask yourself: 'What emotion comes with this thought?'"
        ]
      },
      daytime: {
        title: "Money Emotion Tracking",
        steps: [
          "When money comes up in conversation or thought, pause",
          "Take a breath and notice what you feel in your body",
          "Observe without judging - just be aware",
          "Make a mental note of the pattern"
        ]
      },
      evening: {
        title: "Daily Money Pattern Review",
        steps: [
          "Reflect on money thoughts and emotions from today",
          "Journal: 'What patterns did I notice about my money beliefs?'",
          "Send love to any parts of you that feel anxious about money",
          "End with gratitude for your growing awareness"
        ]
      },
      tips: [
        "Be gentle and non-judgmental with yourself",
        "Awareness alone begins the transformation",
        "Notice patterns without trying to change them yet"
      ],
      insights: [
        "Awareness is the first step to freedom",
        "Your money patterns were learned and can be unlearned",
        "Observing without judgment creates space for change"
      ]
    }
  },
  2: {
    title: "Day 2: Childhood Money Messages",
    subtitle: "Exploring early money programming",
    practice: {
      morning: {
        title: "Childhood Memory Exploration",
        steps: [
          "Sit quietly and breathe deeply to center yourself",
          "Ask: 'What was my earliest memory about money?'",
          "Notice what images, sounds, or feelings come up",
          "Hold any emotions that arise with compassion"
        ]
      },
      daytime: {
        title: "Family Money Messages",
        steps: [
          "Throughout the day, notice phrases about money in your mind",
          "Ask: 'Did I hear this from my family growing up?'",
          "Observe how these messages feel in your body",
          "Remind yourself: 'This was their belief, not mine'"
        ]
      },
      evening: {
        title: "Rewriting Money Stories",
        steps: [
          "Journal about the money messages you inherited",
          "Write: 'The money story I inherited is...'",
          "Then write: 'The money story I choose now is...'",
          "Feel the difference between the old and new stories"
        ]
      },
      tips: [
        "Childhood messages are not facts about money",
        "You can honor your family while choosing new beliefs",
        "Compassion for your younger self accelerates healing"
      ],
      insights: [
        "Your family's money struggles were not your fault",
        "You have the power to create a new money legacy",
        "Understanding the source of blocks dissolves their power"
      ]
    }
  },
  3: {
    title: "Day 3: Fear-Based Beliefs",
    subtitle: "Identifying and dissolving money fears",
    practice: {
      morning: {
        title: "Fear Identification",
        steps: [
          "Place your hand on your heart and breathe deeply",
          "Ask: 'What do I fear most about money?'",
          "Notice where you feel this fear in your body",
          "Send breath and love to that area"
        ]
      },
      daytime: {
        title: "Fear Response Awareness",
        steps: [
          "When money anxiety arises, pause and breathe",
          "Ask: 'What am I afraid will happen?'",
          "Notice if this fear is based on past experience or future worry",
          "Remind yourself: 'I am safe in this moment'"
        ]
      },
      evening: {
        title: "Fear Transformation",
        steps: [
          "Journal about your money fears without censoring",
          "For each fear, write: 'What would I do if this fear wasn't real?'",
          "Visualize yourself confidently handling money situations",
          "End with: 'I am learning to trust myself with money'"
        ]
      },
      tips: [
        "Fear is information, not instruction",
        "Most money fears are about safety and survival",
        "You can acknowledge fear while choosing courage"
      ],
      insights: [
        "Fear loses power when brought into the light",
        "Your worth is not determined by your bank account",
        "You have survived every financial challenge so far"
      ]
    }
  },
  4: {
    title: "Day 4: Worthiness Wounds",
    subtitle: "Healing feelings of unworthiness around money",
    practice: {
      morning: {
        title: "Worthiness Affirmation",
        steps: [
          "Look at yourself in the mirror with kindness",
          "Say: 'I am worthy of abundance simply because I exist'",
          "Notice any resistance and breathe through it",
          "Repeat until you feel a softening"
        ]
      },
      daytime: {
        title: "Worthiness Challenges",
        steps: [
          "When you judge yourself about money, pause",
          "Ask: 'Would I say this to someone I love?'",
          "Replace the judgment with: 'I am learning and growing'",
          "Practice self-compassion throughout the day"
        ]
      },
      evening: {
        title: "Worthiness Integration",
        steps: [
          "List 5 ways you added value to the world today",
          "Reflect on how your unique gifts deserve compensation",
          "Write: 'I deserve abundance because...'",
          "End with gratitude for your inherent worth"
        ]
      },
      tips: [
        "Worthiness is not earned, it's inherent",
        "Your value exists beyond your productivity",
        "Self-love attracts abundance"
      ],
      insights: [
        "You were born worthy of all good things",
        "Money flows more easily to those who feel deserving",
        "Your worthiness is not up for debate"
      ]
    }
  },
  5: {
    title: "Day 5: Scarcity Programming",
    subtitle: "Transforming scarcity into abundance mindset",
    practice: {
      morning: {
        title: "Abundance Awareness",
        steps: [
          "Look around and notice 10 things you're grateful for",
          "Feel the abundance that already exists in your life",
          "Say: 'I live in an abundant universe'",
          "Set intention to notice abundance throughout the day"
        ]
      },
      daytime: {
        title: "Scarcity Thought Interruption",
        steps: [
          "When scarcity thoughts arise, stop and breathe",
          "Ask: 'Is this thought based on current reality or past conditioning?'",
          "Replace with: 'There is more than enough for everyone'",
          "Look for evidence of abundance around you"
        ]
      },
      evening: {
        title: "Abundance Reinforcement",
        steps: [
          "Journal about all the abundance you noticed today",
          "Write: 'Ways abundance showed up in my life today...'",
          "Visualize abundance flowing to you from all directions",
          "End with: 'I am a magnet for abundance'"
        ]
      },
      tips: [
        "Abundance is a perspective, not just a bank balance",
        "What you focus on expands",
        "Gratitude is the gateway to abundance"
      ],
      insights: [
        "The universe is infinitely abundant",
        "Scarcity is a learned limitation, not reality",
        "Your abundance doesn't take away from others"
      ]
    }
  }
  // Continue with days 6-30 following this pattern
};