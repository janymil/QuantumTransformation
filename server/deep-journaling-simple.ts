import OpenAI from 'openai';
import { db } from './db';
import { journalingThreads, threadExchanges, emotionalStateHistory } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DeepJournalingRequest {
  userId: string;
  threadId?: number;
  userInput: string;
  wasVoiceInput?: boolean;
  customizations?: {
    mode?: 'conversational' | 'therapeutic' | 'analytical';
    tone?: 'supportive' | 'challenging' | 'neutral' | 'empathetic';
    perspective?: 'psychologist' | 'life_coach' | 'cbt_therapist' | 'philosopher' | 'stoic';
    customInstructions?: string;
  };
  actionType?: 'go_deeper' | 'new_direction' | 'customize_response';
}

interface DeepJournalingResponse {
  threadId: number;
  exchangeId: number;
  analysis: {
    emotionalAssessment: any;
    patternInsights: any;
    professionalAnalysis: string;
  };
  question: string;
  suggestions?: string[];
  emotionalState: {
    primaryEmotion: string;
    intensity: number;
    clarity: number;
  };
  cost: number;
  remainingRequests?: number;
}

export async function processDeepJournalingRequest(request: DeepJournalingRequest): Promise<DeepJournalingResponse> {
  const startTime = Date.now();
  
  // Get or create thread
  let thread;
  if (request.threadId) {
    const existingThreads = await db.select().from(journalingThreads).where(eq(journalingThreads.id, request.threadId));
    thread = existingThreads[0];
  }
  
  if (!thread) {
    // Create new thread
    const [newThread] = await db.insert(journalingThreads).values({
      userId: request.userId,
      title: `Reflection - ${new Date().toLocaleDateString()}`,
      currentEmotionalState: 'exploring',
      currentTopic: 'self-discovery',
      exchangeCount: 0,
      preferredMode: request.customizations?.mode || 'conversational',
      preferredTone: request.customizations?.tone || 'supportive',
      preferredPerspective: request.customizations?.perspective || 'psychologist',
    }).returning();
    thread = newThread;
  }

  // Get exchange order
  const exchangeOrder = thread.exchangeCount + 1;

  // Generate AI response
  const aiResponse = await generateTherapeuticResponse(request, thread);
  
  // Calculate cost (simplified)
  const tokenCount = aiResponse.tokenCount || 1000;
  const cost = (tokenCount / 1000) * 0.01; // $0.01 per 1K tokens

  const processingTime = Date.now() - startTime;
  
  // Save exchange to database
  const [savedExchange] = await db.insert(threadExchanges).values({
    threadId: thread.id,
    exchangeOrder,
    userInput: request.userInput,
    userWordCount: request.userInput.split(' ').length,
    wasVoiceInput: request.wasVoiceInput || false,
    aiAnalysis: aiResponse.analysis,
    aiQuestion: aiResponse.question,
    aiPatternInsights: aiResponse.patternInsights,
    aiEmotionalAssessment: aiResponse.emotionalAssessment,
    responseMode: request.customizations?.mode || 'conversational',
    responseTone: request.customizations?.tone || 'supportive',
    responsePerspective: request.customizations?.perspective || 'psychologist',
    modelUsed: 'gpt-4o',
    processingTime,
    tokenCount,
    cost: cost.toString(),
  }).returning();

  // Update thread
  await db.update(journalingThreads)
    .set({
      exchangeCount: exchangeOrder,
      lastActiveAt: new Date(),
      currentEmotionalState: aiResponse.emotionalState.primaryEmotion,
    })
    .where(eq(journalingThreads.id, thread.id));

  // Save emotional state
  await db.insert(emotionalStateHistory).values({
    userId: request.userId,
    threadId: thread.id,
    exchangeId: savedExchange.id,
    primaryEmotion: aiResponse.emotionalState.primaryEmotion,
    emotionalIntensity: aiResponse.emotionalState.intensity,
    emotionalClarity: aiResponse.emotionalState.clarity,
    triggerContext: request.userInput,
  });

  return {
    threadId: thread.id,
    exchangeId: savedExchange.id,
    analysis: aiResponse.analysis,
    question: aiResponse.question,
    suggestions: aiResponse.suggestions,
    emotionalState: aiResponse.emotionalState,
    cost,
  };
}

async function generateTherapeuticResponse(request: DeepJournalingRequest, thread: any) {
  const systemPrompt = `You are a compassionate AI therapist specializing in deep self-reflection and emotional exploration. Your role is to:

1. Listen thoughtfully to the user's writing
2. Ask ONE meaningful question that promotes deeper self-discovery
3. Provide professional psychological analysis
4. Assess emotional state with empathy

Always respond with genuine curiosity and non-judgmental support. Focus on helping the user explore their inner world.

Respond in JSON format:
{
  "analysis": {
    "emotionalAssessment": "Brief emotional state assessment",
    "patternInsights": "Any patterns or themes noticed",
    "professionalAnalysis": "Professional therapeutic perspective"
  },
  "question": "One thoughtful question for deeper exploration",
  "suggestions": ["Optional alternative exploration topics"],
  "emotionalState": {
    "primaryEmotion": "primary emotion detected",
    "intensity": 0.7,
    "clarity": 0.8
  }
}`;

  const userPrompt = `User's reflection: "${request.userInput}"

Context: This is exchange ${thread.exchangeCount + 1} in their journaling journey.
Preferred tone: ${request.customizations?.tone || 'supportive'}
Preferred perspective: ${request.customizations?.perspective || 'psychologist'}

Generate a therapeutic response that promotes deeper self-discovery.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const tokenCount = response.usage?.total_tokens || 0;

    return {
      analysis: result.analysis || {
        emotionalAssessment: "Exploring your inner landscape",
        patternInsights: "Developing self-awareness",
        professionalAnalysis: "This reflection shows courage in self-exploration"
      },
      question: result.question || "What emotions are arising as you reflect on this?",
      suggestions: result.suggestions || ["Explore your feelings further", "Consider what this means for you"],
      emotionalState: result.emotionalState || {
        primaryEmotion: "contemplative",
        intensity: 0.5,
        clarity: 0.6
      },
      patternInsights: result.analysis?.patternInsights || {},
      emotionalAssessment: result.analysis?.emotionalAssessment || {},
      tokenCount
    };
  } catch (error) {
    console.error('Error generating therapeutic response:', error);
    
    // Fallback response
    return {
      analysis: {
        emotionalAssessment: "I sense you're exploring something meaningful",
        patternInsights: "Every reflection is a step toward deeper understanding",
        professionalAnalysis: "Your willingness to explore your inner world shows emotional courage"
      },
      question: "What feels most important to explore right now?",
      suggestions: ["Share more about your feelings", "Explore what this means to you"],
      emotionalState: {
        primaryEmotion: "reflective",
        intensity: 0.5,
        clarity: 0.5
      },
      patternInsights: {},
      emotionalAssessment: {},
      tokenCount: 500
    };
  }
}