import OpenAI from "openai";
import { db } from "./db";
import { responseQualityTiering } from './response-quality-tiering';
import { 
  journalingThreads, 
  threadExchanges, 
  psychologicalProfile, 
  emotionalStateHistory,
  type JournalingThread,
  type ThreadExchange,
  type PsychologicalProfile
} from "@shared/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  suggestions?: string[];
  emotionalState: {
    primaryEmotion: string;
    intensity: number;
    clarity: number;
  };
  cost: number;
  remainingRequests?: number;
}

export class DeepJournalingEngine {
  
  /**
   * Main entry point for deep journaling interactions
   */
  async processJournalingRequest(request: DeepJournalingRequest): Promise<DeepJournalingResponse> {
    const startTime = Date.now();
    
    // Get or create thread
    let thread = await this.getOrCreateThread(request.userId, request.threadId);
    
    // Get user's psychological profile and history
    const userProfile = await this.getUserPsychologicalProfile(request.userId);
    const threadHistory = await this.getThreadHistory(thread.id);
    const userContext = await this.getUserContext(request.userId);
    
    // Determine exchange order
    const exchangeOrder = threadHistory.length + 1;
    
    // Generate AI response based on action type
    let aiResponse;
    if (request.actionType === 'new_direction') {
      aiResponse = await this.generateNewDirectionResponse(request, thread, userProfile, userContext);
    } else if (request.actionType === 'customize_response' && threadHistory.length > 0) {
      aiResponse = await this.generateCustomizedResponse(request, thread, threadHistory[threadHistory.length - 1], userProfile);
    } else {
      aiResponse = await this.generateDeepAnalysisResponse(request, thread, threadHistory, userProfile, userContext);
    }
    
    const processingTime = Date.now() - startTime;
    
    // Save exchange to database
    const [savedExchange] = await db.insert(threadExchanges).values({
      threadId: thread.id,
      exchangeOrder,
      userInput: request.userInput,
      userWordCount: request.userInput.split(' ').length,
      wasVoiceInput: request.wasVoiceInput || false,
      voiceTranscriptionQuality: request.voiceTranscriptionQuality,
      aiAnalysis: aiResponse.analysis,
      aiQuestion: aiResponse.question,
      aiPatternInsights: aiResponse.patternInsights,
      aiEmotionalAssessment: aiResponse.emotionalAssessment,
      responseMode: request.customizations?.mode || 'conversational',
      responseTone: request.customizations?.tone || 'supportive',
      responsePerspective: request.customizations?.perspective || 'psychologist',
      customResponseInstructions: request.customizations?.customInstructions,
      modelUsed: 'gpt-4o',
      processingTime,
      tokenCount: aiResponse.tokenCount,
      cost: aiResponse.cost
    }).returning();
    
    // Update thread metadata
    await this.updateThreadMetadata(thread.id, aiResponse.emotionalState, request.userInput);
    
    // Track emotional state
    await this.trackEmotionalState(request.userId, thread.id, savedExchange.id, aiResponse.emotionalState);
    
    // Update psychological profile
    await this.updatePsychologicalProfile(request.userId, request.userInput, aiResponse, userProfile);
    
    return {
      threadId: thread.id,
      exchangeId: savedExchange.id,
      analysis: {
        emotionalAssessment: aiResponse.emotionalAssessment,
        patternInsights: aiResponse.patternInsights,
        professionalAnalysis: aiResponse.analysis.professionalAnalysis
      },
      question: aiResponse.question,
      suggestions: aiResponse.suggestions,
      emotionalState: aiResponse.emotionalState,
      cost: aiResponse.cost,
      remainingRequests: aiResponse.remainingRequests
    };
  }

  /**
   * Generate deep therapeutic analysis and questioning with quality tiering optimization
   */
  private async generateDeepAnalysisResponse(
    request: DeepJournalingRequest, 
    thread: JournalingThread, 
    history: ThreadExchange[], 
    userProfile: PsychologicalProfile | null,
    userContext: any
  ) {
    const mode = request.customizations?.mode || thread.preferredMode || 'conversational';
    const tone = request.customizations?.tone || thread.preferredTone || 'supportive';
    const perspective = request.customizations?.perspective || thread.preferredPerspective || 'psychologist';

    const systemPrompt = this.buildTherapeuticSystemPrompt(mode, tone, perspective, request.customizations?.customInstructions);
    const contextPrompt = this.buildContextPrompt(thread, history, userProfile, userContext);
    const analysisPrompt = this.buildAnalysisPrompt(request.userInput, request.actionType);

    try {
      // Apply quality tiering optimization for deep journaling
      const qualityOptimization = await responseQualityTiering.optimizeWithQualityTiering(
        request.userInput,
        'deep-journaling', // discipline ID for deep journaling
        request.userId
      );

      const selectedModel = qualityOptimization.recommendedModel;
      
      const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: `${contextPrompt}\n\n${analysisPrompt}` }
      ];

      const response = await openai.chat.completions.create({
        model: selectedModel === 'gpt-4o-mini' ? 'gpt-4o-mini' : 'gpt-4o',
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: selectedModel === 'gpt-4o-mini' ? 1500 : 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const tokenCount = response.usage?.total_tokens || 0;
      const cost = this.calculateCost(tokenCount, selectedModel === 'gpt-4o-mini' ? 'gpt-4o-mini' : 'gpt-4o');

      // Assess response quality for learning
      const qualityMetrics = await responseQualityTiering.assessResponseQuality(
        request.userInput,
        result.analysis?.professionalAnalysis || '',
        'deep-journaling',
        selectedModel
      );

      return {
        analysis: result.analysis || {},
        question: result.question || "What would you like to explore further?",
        patternInsights: result.patternInsights || {},
        emotionalAssessment: result.emotionalAssessment || {},
        emotionalState: result.emotionalState || { primaryEmotion: 'neutral', intensity: 0.5, clarity: 0.5 },
        suggestions: result.suggestions || [],
        tokenCount,
        cost,
        remainingRequests: undefined,
        qualityTier: qualityOptimization.recommendedTier.tier,
        qualityConfidence: qualityOptimization.qualityConfidence,
        qualityScore: qualityMetrics.overallQuality,
        additionalSavings: qualityOptimization.expectedSavings
      };
      
    } catch (error) {
      console.error('Quality tiering error in deep journaling:', error);
      
      // Fallback to standard approach
      const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: `${contextPrompt}\n\n${analysisPrompt}` }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const tokenCount = response.usage?.total_tokens || 0;
      const cost = this.calculateCost(tokenCount, 'gpt-4o');

      return {
        analysis: result.analysis || {},
        question: result.question || "What would you like to explore further?",
        patternInsights: result.patternInsights || {},
        emotionalAssessment: result.emotionalAssessment || {},
        emotionalState: result.emotionalState || { primaryEmotion: 'neutral', intensity: 0.5, clarity: 0.5 },
        suggestions: result.suggestions || [],
        tokenCount,
        cost,
        remainingRequests: undefined
      };
    }
  }

  /**
   * Generate new direction response with different questioning approach
   */
  private async generateNewDirectionResponse(
    request: DeepJournalingRequest,
    thread: JournalingThread,
    userProfile: PsychologicalProfile | null,
    userContext: any
  ) {
    const systemPrompt = `You are an expert therapeutic AI designed to help users explore their thoughts and emotions from new perspectives. 

When generating a "new direction" response:
1. Take a completely different approach from typical therapeutic questioning
2. Explore alternative angles, metaphors, or frameworks
3. Use creative, thought-provoking questions that open new pathways of thinking
4. Consider somatic, philosophical, or spiritual dimensions
5. Challenge assumptions with gentle curiosity

Response format (JSON):
{
  "analysis": {
    "professionalAnalysis": "Brief professional assessment of the user's writing",
    "newPerspective": "The alternative angle you're taking",
    "potentialBreakthroughs": "Areas where this new direction might lead to insights"
  },
  "question": "A single, powerful question from this new direction",
  "emotionalAssessment": {
    "primaryEmotion": "detected emotion",
    "underlyingEmotions": ["secondary emotions"],
    "emotionalComplexity": "assessment of emotional layers"
  },
  "emotionalState": {
    "primaryEmotion": "primary emotion detected",
    "intensity": 0.0-1.0,
    "clarity": 0.0-1.0
  },
  "patternInsights": {
    "newPatternsPotential": "What new patterns this direction might reveal",
    "alternativeFrameworks": ["Different ways to view their situation"]
  },
  "suggestions": ["Alternative exploration topics"]
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `User's current writing: "${request.userInput}"\n\nGenerate a completely new direction for exploration that differs from typical therapeutic approaches.` }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.8, // Higher temperature for creativity
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const tokenCount = response.usage?.total_tokens || 0;
    const cost = this.calculateCost(tokenCount, 'gpt-4o');

    return {
      analysis: result.analysis || {},
      question: result.question || "What if we explored this from a completely different angle?",
      patternInsights: result.patternInsights || {},
      emotionalAssessment: result.emotionalAssessment || {},
      emotionalState: result.emotionalState || { primaryEmotion: 'curious', intensity: 0.6, clarity: 0.7 },
      suggestions: result.suggestions || [],
      tokenCount,
      cost,
      remainingRequests: undefined
    };
  }

  /**
   * Generate customized response based on user preferences
   */
  private async generateCustomizedResponse(
    request: DeepJournalingRequest,
    thread: JournalingThread,
    lastExchange: ThreadExchange,
    userProfile: PsychologicalProfile | null
  ) {
    const mode = request.customizations?.mode || 'conversational';
    const tone = request.customizations?.tone || 'supportive';
    const perspective = request.customizations?.perspective || 'psychologist';
    const customInstructions = request.customizations?.customInstructions || '';

    const systemPrompt = `You are a therapeutic AI that adapts responses based on specific customization requests.

Current customization settings:
- Mode: ${mode}
- Tone: ${tone}  
- Perspective: ${perspective}
- Custom instructions: ${customInstructions}

Regenerate your response to the user's writing using these specific parameters. Maintain therapeutic value while adapting to the requested style.

Response format (JSON):
{
  "analysis": {
    "professionalAnalysis": "Analysis tailored to the specified perspective",
    "customizationApplication": "How you applied the requested customizations"
  },
  "question": "Question reflecting the requested tone and perspective",
  "emotionalAssessment": {
    "primaryEmotion": "detected emotion",
    "responseToCustomization": "How customization affects emotional exploration"
  },
  "emotionalState": {
    "primaryEmotion": "primary emotion",
    "intensity": 0.0-1.0,
    "clarity": 0.0-1.0
  },
  "patternInsights": {
    "customizedInsights": "Insights from the specified perspective"
  }
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Original user input: "${request.userInput}"\n\nPrevious AI response: "${lastExchange.aiQuestion}"\n\nGenerate a new response using the specified customizations.` }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const tokenCount = response.usage?.total_tokens || 0;
    const cost = this.calculateCost(tokenCount, 'gpt-4o');

    return {
      analysis: result.analysis || {},
      question: result.question || "How does this perspective change your understanding?",
      patternInsights: result.patternInsights || {},
      emotionalAssessment: result.emotionalAssessment || {},
      emotionalState: result.emotionalState || { primaryEmotion: 'reflective', intensity: 0.5, clarity: 0.6 },
      suggestions: [],
      tokenCount,
      cost,
      remainingRequests: undefined
    };
  }

  /**
   * Build therapeutic system prompt with specific frameworks
   */
  private buildTherapeuticSystemPrompt(mode: string, tone: string, perspective: string, customInstructions?: string): string {
    const basePrompt = `You are an advanced therapeutic AI specializing in deep psychological exploration and self-discovery. Your role is to help users explore their thoughts, emotions, and experiences through professional-grade questioning and analysis.

CORE THERAPEUTIC FRAMEWORKS:
1. **Socratic Questioning**: Guide users to discover insights through carefully crafted questions
2. **Cognitive Behavioral Therapy (CBT)**: Identify thought patterns, cognitive distortions, and behavioral connections
3. **Solution-Focused Therapy**: Help users identify strengths and resources they already possess
4. **Emotional Regulation**: Help users understand and process complex emotional states
5. **Mindfulness & Present-Moment Awareness**: Guide attention to current experience
6. **Pattern Recognition**: Identify recurring themes, behaviors, and emotional patterns

RESPONSE GUIDELINES:
- Ask ONE meaningful question at a time
- Build on previous responses and conversations
- Help identify patterns, emotions, and underlying beliefs
- Guide toward self-discovery rather than giving direct advice
- Use a ${tone} tone with ${perspective} perspective in ${mode} mode
- Be non-judgmental and create a safe space for exploration
- Focus on depth over breadth

${customInstructions ? `\nCUSTOM INSTRUCTIONS: ${customInstructions}` : ''}

RESPONSE FORMAT (JSON):
{
  "analysis": {
    "professionalAnalysis": "Brief psychological assessment of the user's writing",
    "cognitivePatterns": "Identified thought patterns or cognitive themes",
    "emotionalUndercurrents": "Deeper emotional themes beneath surface expressions"
  },
  "question": "A single, powerful therapeutic question designed to go deeper",
  "emotionalAssessment": {
    "primaryEmotion": "primary detected emotion",
    "secondaryEmotions": ["list of secondary emotions"],
    "emotionalIntensity": "0.0-1.0 scale",
    "emotionalClarity": "how clearly emotions are expressed/understood"
  },
  "emotionalState": {
    "primaryEmotion": "primary emotion (lowercase)",
    "intensity": 0.0-1.0,
    "clarity": 0.0-1.0
  },
  "patternInsights": {
    "identifiedPatterns": ["patterns noticed in this exchange"],
    "comparisonToPrevious": "how this compares to previous exchanges",
    "developmentalThemes": "growth or regression themes"
  },
  "suggestions": ["2-3 alternative exploration directions"]
}`;

    return basePrompt;
  }

  /**
   * Build context prompt with user history and profile
   */
  private buildContextPrompt(
    thread: JournalingThread, 
    history: ThreadExchange[], 
    userProfile: PsychologicalProfile | null,
    userContext: any
  ): string {
    let context = `CONVERSATION CONTEXT:\n`;
    context += `Thread: ${thread.title}\n`;
    context += `Thread Type: ${thread.threadType}\n`;
    
    if (thread.currentEmotionalState) {
      context += `Current Emotional State: ${thread.currentEmotionalState}\n`;
    }
    
    if (thread.currentTopic) {
      context += `Current Topic: ${thread.currentTopic}\n`;
    }

    if (history.length > 0) {
      context += `\nRECENT CONVERSATION HISTORY:\n`;
      history.slice(-3).forEach((exchange, index) => {
        context += `Exchange ${exchange.exchangeOrder}:\n`;
        context += `User: ${exchange.userInput}\n`;
        context += `AI: ${exchange.aiQuestion}\n\n`;
      });
    }

    if (userProfile) {
      context += `\nUSER PSYCHOLOGICAL PROFILE:\n`;
      if (userProfile.emotionalPatterns) {
        context += `Emotional Patterns: ${JSON.stringify(userProfile.emotionalPatterns)}\n`;
      }
      if (userProfile.recurringConcerns && Array.isArray(userProfile.recurringConcerns)) {
        context += `Recurring Concerns: ${userProfile.recurringConcerns.join(', ')}\n`;
      }
      if (userProfile.communicationStyle) {
        context += `Communication Style: ${userProfile.communicationStyle}\n`;
      }
    }

    if (userContext && userContext.journalEntries && userContext.journalEntries.length > 0) {
      context += `\nRECENT JOURNAL CONTEXT:\n`;
      userContext.journalEntries.slice(-2).forEach((entry: any) => {
        context += `Day ${entry.day}: ${entry.experience || entry.insights}\n`;
      });
    }

    return context;
  }

  /**
   * Build analysis prompt for the specific user input
   */
  private buildAnalysisPrompt(userInput: string, actionType?: string): string {
    let prompt = `USER'S NEW WRITING:\n"${userInput}"\n\n`;
    
    if (actionType === 'go_deeper') {
      prompt += `The user clicked "Go Deeper" - they want you to analyze their writing and ask a question that helps them explore this topic more deeply. Focus on:
- Underlying emotions and motivations
- Patterns and connections they might not see
- Root causes or deeper layers of their experience
- Questions that promote self-discovery and insight`;
    } else {
      prompt += `Analyze this writing and provide a therapeutic response that helps the user explore their thoughts and emotions more deeply.`;
    }
    
    prompt += `\n\nGenerate your response in the specified JSON format.`;
    
    return prompt;
  }

  /**
   * Get or create a journaling thread
   */
  private async getOrCreateThread(userId: string, threadId?: number): Promise<JournalingThread> {
    if (threadId) {
      const [existingThread] = await db
        .select()
        .from(journalingThreads)
        .where(and(eq(journalingThreads.id, threadId), eq(journalingThreads.userId, userId)));
      
      if (existingThread) {
        return existingThread;
      }
    }

    // Create new thread
    const [newThread] = await db.insert(journalingThreads).values({
      userId,
      title: `Journaling Session ${new Date().toLocaleDateString()}`,
      threadType: 'free_writing',
      isActive: true
    }).returning();

    return newThread;
  }

  /**
   * Get thread conversation history
   */
  private async getThreadHistory(threadId: number): Promise<ThreadExchange[]> {
    return await db
      .select()
      .from(threadExchanges)
      .where(eq(threadExchanges.threadId, threadId))
      .orderBy(threadExchanges.exchangeOrder);
  }

  /**
   * Get user's psychological profile
   */
  private async getUserPsychologicalProfile(userId: string): Promise<PsychologicalProfile | null> {
    const [profile] = await db
      .select()
      .from(psychologicalProfile)
      .where(eq(psychologicalProfile.userId, userId));
    
    return profile || null;
  }

  /**
   * Get broader user context (journal entries, challenges, etc.)
   */
  private async getUserContext(userId: string) {
    // This would fetch recent journal entries, challenges, etc.
    // Simplified for now
    return {
      journalEntries: [],
      challenges: [],
      affirmations: []
    };
  }

  /**
   * Update thread metadata
   */
  private async updateThreadMetadata(threadId: number, emotionalState: any, userInput: string) {
    // Get current exchange count
    const exchangeCount = await db
      .select({ count: sql`COUNT(*)`.as('count') })
      .from(threadExchanges)
      .where(eq(threadExchanges.threadId, threadId));
    
    const totalExchanges = exchangeCount[0]?.count || 0;
    
    await db
      .update(journalingThreads)
      .set({
        currentEmotionalState: emotionalState.primaryEmotion,
        lastActiveAt: new Date(),
        totalExchanges: Number(totalExchanges),
        updatedAt: new Date()
      })
      .where(eq(journalingThreads.id, threadId));
  }

  /**
   * Track emotional state history
   */
  private async trackEmotionalState(userId: string, threadId: number, exchangeId: number, emotionalState: any) {
    await db.insert(emotionalStateHistory).values({
      userId,
      threadId,
      exchangeId,
      primaryEmotion: emotionalState.primaryEmotion,
      emotionalIntensity: emotionalState.intensity,
      emotionalClarity: emotionalState.clarity,
      detectionMethod: 'ai_analysis',
      confidenceScore: 0.8
    });
  }

  /**
   * Update user's psychological profile
   */
  private async updatePsychologicalProfile(
    userId: string, 
    userInput: string, 
    aiResponse: any, 
    existingProfile: PsychologicalProfile | null
  ) {
    // This would implement sophisticated profile updating logic
    // For now, simplified implementation
    if (!existingProfile) {
      await db.insert(psychologicalProfile).values({
        userId,
        totalDataPoints: 1,
        lastFullAnalysisAt: new Date()
      });
    } else {
      await db
        .update(psychologicalProfile)
        .set({
          totalDataPoints: (existingProfile.totalDataPoints || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(psychologicalProfile.userId, userId));
    }
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(tokens: number, model: string): number {
    const pricing = {
      'gpt-4o': { input: 0.0025, output: 0.01 }, // per 1K tokens
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
    };
    
    const rate = pricing[model as keyof typeof pricing] || pricing['gpt-4o'];
    return (tokens / 1000) * ((rate.input + rate.output) / 2); // Simplified average
  }

  /**
   * Get user's active threads
   */
  async getUserThreads(userId: string): Promise<JournalingThread[]> {
    return await db
      .select()
      .from(journalingThreads)
      .where(and(eq(journalingThreads.userId, userId), eq(journalingThreads.isActive, true)))
      .orderBy(desc(journalingThreads.lastActiveAt));
  }

  /**
   * Get thread with exchanges
   */
  async getThreadWithExchanges(userId: string, threadId: number) {
    const [thread] = await db
      .select()
      .from(journalingThreads)
      .where(and(eq(journalingThreads.id, threadId), eq(journalingThreads.userId, userId)));

    if (!thread) {
      throw new Error('Thread not found');
    }

    const exchanges = await db
      .select()
      .from(threadExchanges)
      .where(eq(threadExchanges.threadId, threadId))
      .orderBy(threadExchanges.exchangeOrder);

    return {
      thread,
      exchanges
    };
  }

  /**
   * Archive a thread
   */
  async archiveThread(userId: string, threadId: number) {
    await db
      .update(journalingThreads)
      .set({
        isArchived: true,
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(eq(journalingThreads.id, threadId), eq(journalingThreads.userId, userId)));
  }

  /**
   * Update thread customization preferences
   */
  async updateThreadPreferences(userId: string, threadId: number, preferences: {
    mode?: string;
    tone?: string;
    perspective?: string;
    customInstructions?: string;
  }) {
    await db
      .update(journalingThreads)
      .set({
        preferredMode: preferences.mode,
        preferredTone: preferences.tone,
        preferredPerspective: preferences.perspective,
        customInstructions: preferences.customInstructions,
        updatedAt: new Date()
      })
      .where(and(eq(journalingThreads.id, threadId), eq(journalingThreads.userId, userId)));
  }
}

export const deepJournalingEngine = new DeepJournalingEngine();