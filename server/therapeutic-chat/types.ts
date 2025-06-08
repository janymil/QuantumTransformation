// Type definitions for the deep journaling system

export interface DeepJournalingRequest {
  userId: string;
  threadId?: number;
  userInput: string;
  wasVoiceInput?: boolean;
  voiceTranscriptionQuality?: number;
  customizations?: {
    mode?: 'conversational' | 'therapeutic' | 'analytical';
    tone?: 'supportive' | 'challenging' | 'neutral' | 'empathetic';
    perspective?: 'psychologist' | 'life_coach' | 'cbt_therapist' | 'philosopher' | 'stoic';
    customInstructions?: string;
  };
  actionType?: 'go_deeper' | 'new_direction' | 'customize_response';
}

export interface DeepJournalingResponse {
  threadId: number;
  exchangeId: number;
  analysis: {
    emotionalAssessment: any;
    patternInsights: any;
    professionalAnalysis: string;
  };
  question: string;
  suggestions: string[];
  emotionalState: {
    primaryEmotion: string;
    intensity: number;
    clarity: number;
  };
  cost: number;
  remainingRequests?: number;
}

export interface VoiceTranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
  emotionalTone: {
    primary: string;
    intensity: number;
    confidence: number;
  };
}

export interface PsychologicalAnalysis {
  emotionalPatterns: any;
  cognitivePatterns: string[];
  behavioralInsights: string[];
  growthOpportunities: string[];
  strengthAreas: string[];
  riskFactors: string[];
}

export interface EmotionalStateAnalysis {
  primaryEmotion: string;
  secondaryEmotions: string[];
  intensity: number;
  clarity: number;
  triggers: string[];
  context: string;
}

export interface TherapeuticFramework {
  name: string;
  description: string;
  questioningStyle: string[];
  focusAreas: string[];
  techniques: string[];
}