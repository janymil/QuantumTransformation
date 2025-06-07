export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  emotionalTone?: string;
}

export interface ConversationSession {
  id: number;
  title: string;
  messages: Message[];
  lastMessage: string;
  createdAt: string;
  emotionalJourney: string[];
}

export interface TherapeuticResponse {
  response: string;
  followUpQuestion: string;
  emotionalInsight: string;
  nextSteps?: string[];
  sessionId: number;
  messageId: string;
  analysis?: {
    emotionalAssessment: any;
    patternInsights: any;
    professionalAnalysis: string;
  };
  suggestions?: string[];
  emotionalState?: {
    primaryEmotion: string;
    intensity: number;
    clarity: number;
  };
}