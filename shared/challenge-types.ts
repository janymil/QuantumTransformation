export interface ChallengeType {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  durationDays: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: string;
  color: string;
  gradient: string;
  tags: string[];
  benefits: string[];
  focusAreas: string[];
}

export const CHALLENGE_TYPES: Record<string, ChallengeType> = {
  general_quantum: {
    id: 'general_quantum',
    title: 'Quantum Consciousness Foundation',
    subtitle: 'Master the fundamentals of quantum reality',
    description: 'A comprehensive introduction to quantum consciousness principles combining Joe Dispenza\'s neuroscience with Neville Goddard\'s manifestation techniques. Perfect for beginners ready to transform their reality.',
    duration: '30 days',
    durationDays: 30,
    difficulty: 'Beginner',
    icon: '🧠',
    color: 'blue',
    gradient: 'from-blue-500 to-purple-600',
    tags: ['Foundation', 'Consciousness', 'Quantum Physics', 'Meditation'],
    benefits: [
      'Understand quantum consciousness principles',
      'Develop daily meditation practice',
      'Learn reality creation fundamentals',
      'Build mindfulness and awareness'
    ],
    focusAreas: ['Consciousness', 'Awareness', 'Foundation', 'Meditation']
  },

  money_manifestation: {
    id: 'money_manifestation',
    title: 'Quantum Money Manifestation',
    subtitle: 'Align with abundance consciousness',
    description: 'Transform your relationship with money using quantum field principles. Learn to operate from abundance consciousness and attract financial prosperity through elevated emotional states.',
    duration: '30 days',
    durationDays: 30,
    difficulty: 'Intermediate',
    icon: '💰',
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    tags: ['Abundance', 'Wealth', 'Manifestation', 'Money Mindset'],
    benefits: [
      'Develop abundance consciousness',
      'Transform money beliefs',
      'Attract financial opportunities',
      'Master wealth manifestation'
    ],
    focusAreas: ['Abundance', 'Wealth Creation', 'Financial Freedom', 'Prosperity']
  },

  quantum_health: {
    id: 'quantum_health',
    title: 'Quantum Health Transformation',
    subtitle: 'Heal from the quantum field',
    description: 'Harness the power of quantum healing to transform your physical and mental well-being. Use consciousness to influence your biology and create optimal health from within.',
    duration: '30 days',
    durationDays: 30,
    difficulty: 'Intermediate',
    icon: '🌱',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    tags: ['Healing', 'Wellness', 'Biology', 'Health'],
    benefits: [
      'Activate self-healing mechanisms',
      'Improve physical vitality',
      'Balance emotional well-being',
      'Enhance mind-body connection'
    ],
    focusAreas: ['Physical Health', 'Mental Wellness', 'Healing', 'Vitality']
  },

  quantum_relationships: {
    id: 'quantum_relationships',
    title: 'Quantum Relationships',
    subtitle: 'Connect from higher consciousness',
    description: 'Transform all your relationships through quantum consciousness. Learn to attract and maintain harmonious connections by operating from love, authenticity, and elevated emotional states.',
    duration: '7 days',
    durationDays: 7,
    difficulty: 'Advanced',
    icon: '💝',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    tags: ['Love', 'Connection', 'Communication', 'Relationships'],
    benefits: [
      'Attract meaningful relationships',
      'Improve communication skills',
      'Heal relationship patterns',
      'Deepen existing connections'
    ],
    focusAreas: ['Love', 'Connection', 'Communication', 'Intimacy']
  },

  money_blocks_clearing: {
    id: 'money_blocks_clearing',
    title: 'Money Blocks Clearing',
    subtitle: 'Release subconscious money limitations',
    description: 'Identify and dissolve deep-rooted money blocks, limiting beliefs, and subconscious patterns that prevent financial abundance. Clear generational money trauma and reprogram your relationship with wealth.',
    duration: '21 days',
    durationDays: 21,
    difficulty: 'Advanced',
    icon: '🔓',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    tags: ['Blocks', 'Limiting Beliefs', 'Subconscious', 'Healing'],
    benefits: [
      'Identify hidden money blocks',
      'Clear limiting beliefs',
      'Heal money trauma',
      'Reprogram wealth consciousness'
    ],
    focusAreas: ['Block Clearing', 'Belief Change', 'Trauma Healing', 'Reprogramming']
  }
};

export type ChallengeTypeId = keyof typeof CHALLENGE_TYPES;

export function getChallengeType(id: string): ChallengeType | undefined {
  return CHALLENGE_TYPES[id as ChallengeTypeId];
}

export function getAllChallengeTypes(): ChallengeType[] {
  return Object.values(CHALLENGE_TYPES);
}

// URL mapping for challenge routes
export const CHALLENGE_URL_MAPPING: Record<string, string> = {
  'general_quantum': 'quantum-consciousness',
  'money_manifestation': 'money-blocks',
  'quantum_health': 'health-transformation',
  'quantum_relationships': 'relationships',
  'money_blocks_clearing': 'money-blocks-clearing'
};

export function getChallengeUrl(challengeTypeId: string): string {
  return CHALLENGE_URL_MAPPING[challengeTypeId] || challengeTypeId;
}

export function getChallengeTypeFromUrl(url: string): string | undefined {
  const entry = Object.entries(CHALLENGE_URL_MAPPING).find(([_, urlPath]) => urlPath === url);
  return entry ? entry[0] : undefined;
}

// Challenge-specific content prompts for AI generation
export const CHALLENGE_CONTENT_PROMPTS: Record<string, {
  systemPrompt: string;
  focusAreas: string[];
  keyPrinciples: string[];
}> = {
  general_quantum: {
    systemPrompt: `You are a quantum consciousness coach specializing in Joe Dispenza and Neville Goddard's teachings. Focus on foundational concepts, basic meditation practices, and reality creation principles.`,
    focusAreas: ['Consciousness', 'Awareness', 'Basic Meditation', 'Reality Creation'],
    keyPrinciples: ['Observer Effect', 'Quantum Field', 'Elevated Emotions', 'Present Moment']
  },

  money_manifestation: {
    systemPrompt: `You are a quantum abundance coach specializing in money manifestation through consciousness elevation. Focus on abundance mindset, wealth consciousness, and financial manifestation techniques.`,
    focusAreas: ['Abundance Consciousness', 'Wealth Attraction', 'Money Energy', 'Financial Freedom'],
    keyPrinciples: ['Abundance Mindset', 'Wealth Consciousness', 'Financial Alignment', 'Prosperity Vibration']
  },

  quantum_health: {
    systemPrompt: `You are a quantum healing coach specializing in mind-body healing through consciousness. Focus on self-healing, biological transformation, and wellness manifestation.`,
    focusAreas: ['Self-Healing', 'Biological Change', 'Wellness', 'Mind-Body Connection'],
    keyPrinciples: ['Epigenetics', 'Neuroplasticity', 'Cellular Healing', 'Energy Medicine']
  },

  quantum_relationships: {
    systemPrompt: `You are a quantum relationship coach specializing in conscious connections. Focus on heart coherence, authentic communication, and love-based relationships.`,
    focusAreas: ['Heart Coherence', 'Authentic Love', 'Communication', 'Connection'],
    keyPrinciples: ['Heart Intelligence', 'Unconditional Love', 'Authentic Expression', 'Energetic Resonance']
  },

  money_blocks_clearing: {
    systemPrompt: `You are a quantum healing coach specializing in money blocks and limiting belief clearing. Focus on subconscious reprogramming, trauma healing, and belief transformation.`,
    focusAreas: ['Block Identification', 'Belief Clearing', 'Trauma Healing', 'Subconscious Reprogramming'],
    keyPrinciples: ['Shadow Work', 'Belief Archaeology', 'Trauma Integration', 'Subconscious Healing']
  }
};