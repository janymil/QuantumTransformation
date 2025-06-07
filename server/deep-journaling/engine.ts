import { db } from "../db";
import { 
  journalingThreads, 
  threadExchanges, 
  psychologicalProfile, 
  emotionalStateHistory,
  type JournalingThread,
  type ThreadExchange,
  type PsychologicalProfile
} from "@shared/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { DeepJournalingRequest, DeepJournalingResponse } from "./types";
import { buildTherapeuticSystemPrompt, getNewDirectionSystemPrompt, getCustomizationSystemPrompt } from "./therapeutic-frameworks";
import { psychologicalAnalyzer } from "./psychological-analyzer";
import { intelligentModelRouter } from "./intelligent-model-router";
import { advancedCostOptimization } from "./advanced-cost-optimization";

export class DeepJournalingEngine {
  
  /**
   * Main entry point for deep journaling interactions
   */
  async processJournalingRequest(request: DeepJournalingRequest): Promise<DeepJournalingResponse> {
    // Temporarily disable all cost optimization to test AI quality
    // const cachedProfile = await advancedCostOptimization.getCachedUserProfile(request.userId);
    
    // Temporarily disable caching for therapeutic chat to ensure response quality
    // const similarResponse = await advancedCostOptimization.findSimilarResponse(request.userId, request.userInput);
    // if (similarResponse && request.actionType !== 'new_direction') {
    //   return {
    //     ...similarResponse,
    //     isCached: true,
    //     cost: 0,
    //     cacheHit: true
    //   };
    // }
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
   * Generate deep therapeutic analysis and questioning
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

    const systemPrompt = buildTherapeuticSystemPrompt([], request.userInput, { mode, tone, perspective });
    const contextPrompt = this.buildContextPrompt(thread, history, userProfile, userContext);
    const analysisPrompt = this.buildAnalysisPrompt(request.userInput, request.actionType);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: `${contextPrompt}\n\n${analysisPrompt}` }
    ];

    // Direct OpenAI call for maximum quality - bypassing optimization layer
    const openai = new (await import('openai')).default({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${contextPrompt}\n\n${analysisPrompt}` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0].message.content;
      let parsedResponse;
      
      try {
        parsedResponse = JSON.parse(responseContent || '{}');
      } catch (parseError) {
        // Fallback if JSON parsing fails
        parsedResponse = {
          analysis: { professionalAnalysis: responseContent || "Unable to process response" },
          question: "What would you like to explore further?",
          emotionalState: { primaryEmotion: 'neutral', intensity: 0.5, clarity: 0.5 }
        };
      }
      
      const aiResponse = {
        analysis: parsedResponse.analysis || { professionalAnalysis: parsedResponse.professionalAnalysis || "Deep psychological analysis not available" },
        question: parsedResponse.question || parsedResponse.followUpQuestion || "What aspects of this would you like to explore further?",
        patternInsights: parsedResponse.patternInsights || {},
        emotionalAssessment: parsedResponse.emotionalAssessment || {},
        emotionalState: parsedResponse.emotionalState || { primaryEmotion: 'neutral', intensity: 0.5, clarity: 0.5 },
        suggestions: parsedResponse.suggestions || [],
        tokenCount: completion.usage?.total_tokens || 0,
        cost: (completion.usage?.total_tokens || 0) * 0.00001, // Rough cost calculation
        modelUsed: "gpt-4o",
        provider: "openai"
      };
      
      console.log('Direct OpenAI Response Quality Check:', {
        hasAnalysis: !!aiResponse.analysis?.professionalAnalysis,
        analysisLength: aiResponse.analysis?.professionalAnalysis?.length || 0,
        questionQuality: aiResponse.question?.length || 0
      });
      
    } catch (openaiError) {
      console.error('Direct OpenAI call failed:', openaiError);
      // Fallback to original routing
      const aiResponse = await intelligentModelRouter.routeTherapeuticRequest(
        request,
        systemPrompt,
        `${contextPrompt}\n\n${analysisPrompt}`,
        'complex'
      );
      
      return {
        analysis: aiResponse.analysis || {},
        question: aiResponse.question || "What would you like to explore further?",
        patternInsights: aiResponse.patternInsights || {},
        emotionalAssessment: aiResponse.emotionalAssessment || {},
        emotionalState: aiResponse.emotionalState || { primaryEmotion: 'neutral', intensity: 0.5, clarity: 0.5 },
        suggestions: aiResponse.suggestions || [],
        tokenCount: aiResponse.tokenCount,
        cost: aiResponse.cost,
        modelUsed: aiResponse.modelUsed,
        provider: aiResponse.provider,
        remainingRequests: undefined
      };
    }

    return {
      analysis: aiResponse.analysis || {},
      question: aiResponse.question || "What would you like to explore further?",
      patternInsights: aiResponse.patternInsights || {},
      emotionalAssessment: aiResponse.emotionalAssessment || {},
      emotionalState: aiResponse.emotionalState || { primaryEmotion: 'neutral', intensity: 0.5, clarity: 0.5 },
      suggestions: aiResponse.suggestions || [],
      tokenCount: aiResponse.tokenCount,
      cost: aiResponse.cost,
      modelUsed: aiResponse.modelUsed,
      provider: aiResponse.provider,
      remainingRequests: undefined
    };
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
    const systemPrompt = getNewDirectionSystemPrompt({});

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: `User's current writing: "${request.userInput}"\n\nGenerate a completely new direction for exploration that differs from typical therapeutic approaches.` }
    ];

    const aiResponse = await intelligentModelRouter.routeTherapeuticRequest(
      request,
      systemPrompt,
      `User's current writing: "${request.userInput}"\n\nGenerate a completely new direction for exploration that differs from typical therapeutic approaches.`,
      'moderate'
    );

    return {
      analysis: aiResponse.analysis || {},
      question: aiResponse.question || "What if we explored this from a completely different angle?",
      patternInsights: aiResponse.patternInsights || {},
      emotionalAssessment: aiResponse.emotionalAssessment || {},
      emotionalState: aiResponse.emotionalState || { primaryEmotion: 'curious', intensity: 0.6, clarity: 0.7 },
      suggestions: aiResponse.suggestions || [],
      tokenCount: aiResponse.tokenCount,
      cost: aiResponse.cost,
      modelUsed: aiResponse.modelUsed,
      provider: aiResponse.provider,
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

    const systemPrompt = getCustomizationSystemPrompt({ mode, tone, perspective, customInstructions });

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: `Original user input: "${request.userInput}"\n\nPrevious AI response: "${lastExchange.aiQuestion}"\n\nGenerate a new response using the specified customizations.` }
    ];

    const aiResponse = await intelligentModelRouter.routeTherapeuticRequest(
      request,
      systemPrompt,
      `Original user input: "${request.userInput}"\n\nPrevious AI response: "${lastExchange.aiQuestion}"\n\nGenerate a new response using the specified customizations.`,
      'moderate'
    );

    return {
      analysis: aiResponse.analysis || {},
      question: aiResponse.question || "How does this perspective change your understanding?",
      patternInsights: aiResponse.patternInsights || {},
      emotionalAssessment: aiResponse.emotionalAssessment || {},
      emotionalState: aiResponse.emotionalState || { primaryEmotion: 'reflective', intensity: 0.5, clarity: 0.6 },
      suggestions: aiResponse.suggestions || [],
      tokenCount: aiResponse.tokenCount,
      cost: aiResponse.cost,
      modelUsed: aiResponse.modelUsed,
      provider: aiResponse.provider,
      remainingRequests: undefined
    };
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
    await db
      .update(journalingThreads)
      .set({
        currentEmotionalState: emotionalState.primaryEmotion,
        lastActiveAt: new Date(),
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

  /**
   * Determine request complexity for optimal model routing
   */
  private determineComplexity(request: DeepJournalingRequest, thread: JournalingThread): 'simple' | 'moderate' | 'complex' {
    let complexityScore = 0;
    
    // Input length complexity
    if (request.userInput.length > 500) complexityScore += 2;
    else if (request.userInput.length > 200) complexityScore += 1;
    
    // Action type complexity
    if (request.actionType === 'go_deeper') complexityScore += 2;
    else if (request.actionType === 'customize_response') complexityScore += 1;
    
    // Thread history complexity
    if (thread.exchangeCount && thread.exchangeCount > 10) complexityScore += 2;
    else if (thread.exchangeCount && thread.exchangeCount > 5) complexityScore += 1;
    
    // Emotional complexity indicators
    const emotionalWords = ['trauma', 'anxiety', 'depression', 'grief', 'anger', 'fear', 'overwhelmed'];
    const hasEmotionalComplexity = emotionalWords.some(word => 
      request.userInput.toLowerCase().includes(word)
    );
    if (hasEmotionalComplexity) complexityScore += 2;
    
    // Customization complexity
    if (request.customizations?.customInstructions) complexityScore += 1;
    
    if (complexityScore >= 5) return 'complex';
    if (complexityScore >= 2) return 'moderate';
    return 'simple';
  }

  /**
   * Calculate efficiency rating for cost optimization insights
   */
  private calculateEfficiencyRating(aiResponse: any): number {
    // Base efficiency on cost per meaningful output
    const baseEfficiency = 0.8;
    const costFactor = Math.max(0, 1 - (aiResponse.cost / 0.01)); // Penalty for high cost
    const qualityFactor = aiResponse.analysis && aiResponse.question ? 1.2 : 0.8;
    
    return Math.min(1, baseEfficiency * costFactor * qualityFactor);
  }

  /**
   * Get cost analysis and optimization recommendations
   */
  async getCostAnalysis(userId: string): Promise<any> {
    try {
      // Get recent exchanges for cost analysis
      const recentExchanges = await db.select()
        .from(threadExchanges)
        .where(eq(threadExchanges.userId, userId))
        .orderBy(desc(threadExchanges.createdAt))
        .limit(50);

      const costData = recentExchanges.map(exchange => ({
        cost: exchange.cost || 0,
        modelUsed: exchange.modelUsed || 'unknown',
        provider: exchange.provider || 'openai',
        tokenCount: exchange.tokenCount || 0,
        createdAt: exchange.createdAt
      }));

      return intelligentModelRouter.getCostAnalysis(costData);
    } catch (error) {
      console.error('Error getting cost analysis:', error);
      return {
        totalCost: 0,
        modelBreakdown: {},
        averageCostPerInteraction: 0,
        recommendations: []
      };
    }
  }
}

export const deepJournalingEngine = new DeepJournalingEngine();