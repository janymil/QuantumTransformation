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
import { userModelingEngine } from "./user-modeling-engine";
import type { PersonalizationRecommendations } from "./user-modeling-engine";
import { dynamicFrameworkSelector } from "./dynamic-framework-selector";
import type { FrameworkRecommendation } from "./dynamic-framework-selector";
import { contextualMemoryArchitecture } from "./contextual-memory-architecture";
import type { TherapeuticMemory, BreakthroughMoment } from "./contextual-memory-architecture";
import { adaptiveLanguageGenerator } from "./adaptive-language-generator";
import type { AdaptedLanguageResponse } from "./adaptive-language-generator";
import { therapeuticChatAdapter, TherapeuticRequest } from '@shared/ai-intelligence/adapters/therapeutic-chat-adapter';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export class DeepJournalingEngine {

  private anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  /**
   * Direct therapeutic message processing (bypass AI intelligence layers)
   */
  async processTherapeuticMessage(request: DeepJournalingRequest): Promise<any> {
    try {
      const startTime = Date.now();

      // Get or create thread
      let thread = await this.getOrCreateThread(request.userId, request.threadId);

      // Get thread history for context
      const threadHistory = await this.getThreadHistory(thread.id);
      
      // Build therapeutic system prompt
      const systemPrompt = `You are an expert therapeutic AI with deep training in psychology, psychotherapy, and emotional intelligence. Your role is to provide sophisticated therapeutic responses that demonstrate genuine understanding and professional insight.

THERAPEUTIC APPROACH:
- Analyze the user's emotional state, underlying patterns, and core concerns
- Choose appropriate therapeutic techniques (CBT, psychodynamic, humanistic, etc.)
- Ask thoughtful questions that guide deeper self-exploration
- Provide meaningful insights that help users understand themselves better
- Always respond with depth, empathy, and professional therapeutic skill

CONVERSATION CONTEXT:
${threadHistory.length > 0 ? 
  threadHistory.slice(-3).map(exchange => 
    `User: ${exchange.userInput}\nAI: ${exchange.aiQuestion}`
  ).join('\n\n') : 
  'This is the beginning of the conversation.'
}

Analyze the user's input and craft a response that demonstrates deep understanding, provides therapeutic insight, and guides the conversation forward with purposeful questions.`;

      // Make direct API call to Claude
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          { role: 'user', content: `${systemPrompt}\n\nUser Input: ${request.userInput}` }
        ]
      });

      const aiResponse = response.content[0].type === 'text' ? response.content[0].text : 'I understand what you\'re sharing with me.';

      // Save exchange to database
      const exchangeOrder = threadHistory.length + 1;
      const [savedExchange] = await db.insert(threadExchanges).values({
        threadId: thread.id,
        exchangeOrder,
        userInput: request.userInput,
        userWordCount: request.userInput.split(' ').length,
        wasVoiceInput: request.wasVoiceInput || false,
        aiAnalysis: {
          professionalAnalysis: 'Direct therapeutic response via Claude API',
          emotionalInsights: 'User expressing complex emotional state',
          cognitivePatterns: [],
          therapeuticRecommendations: ['Continue exploration of underlying patterns']
        },
        aiQuestion: aiResponse,
        aiPatternInsights: {},
        aiEmotionalAssessment: {},
        responseMode: 'therapeutic',
        responseTone: request.customizations?.tone || 'empathetic',
        responsePerspective: 'psychologist',
        modelUsed: 'claude-3-5-sonnet-20241022',
        processingTime: Date.now() - startTime,
        tokenCount: response.usage?.input_tokens || 0,
        cost: '0.008'
      }).returning();

      return {
        content: aiResponse,
        threadId: thread.id,
        exchangeId: savedExchange.id
      };

    } catch (error) {
      console.error('Direct therapeutic processing error:', error);
      throw error;
    }
  }

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

    // Comprehensive psychological analysis integration - Full orchestration
    const emotionalState = psychologicalAnalyzer.analyzeEmotionalState(request.userInput, threadHistory.map(h => ({ primary: h.currentEmotionalState || 'neutral' })) as any[]);
    const cognitivePatterns = psychologicalAnalyzer.analyzeCognitivePatterns(request.userInput);
    const copingStrategies = psychologicalAnalyzer.assessCopingStrategies(request.userInput);
    const comprehensiveAnalysis = psychologicalAnalyzer.analyzeComprehensively(request.userInput, threadHistory);
    const psychologicalInsights = psychologicalAnalyzer.generateInsights(
      emotionalState,
      cognitivePatterns,
      copingStrategies
    );

    const psychologicalAnalysis = {
      emotionalState,
      cognitivePatterns,
      copingStrategies,
      comprehensiveAnalysis,
      psychologicalInsights,
      userId: request.userId,
      sessionContext: {
        actionType: request.actionType,
        threadId: thread.id,
        exchangeOrder: threadHistory.length + 1
      }
    };

    // Get personalization recommendations for premium-level responses (temporarily disabled for stability)
    const personalizationRecs = {
      therapeuticStyle: 'supportive',
      communicationAdjustments: { 
        tone: 'balanced', 
        complexity: 5,
        metaphorTypes: ['nature', 'journey'],
        responseLength: 'moderate'
      },
      therapeuticFrameworks: ['cbt', 'supportive'],
      avoidanceFactors: [],
      enhancementFactors: [],
      personalizationLevel: 'moderate',
      customInstructions: [],
      confidence: 0.8
    };

    // Select optimal therapeutic framework based on real-time session analysis + psychological insights
    const frameworkRecommendation = await dynamicFrameworkSelector.selectOptimalFramework(
      request.userId,
      thread.id,
      request.userInput,
      { 
        userProfile, 
        threadHistory, 
        userContext,
        psychologicalAnalysis: psychologicalAnalysis
      }
    );

    // Analyze cross-session patterns and update therapeutic memory (temporarily disabled for stability)
    const crossSessionPatterns = [];
    const therapeuticMemory = null;

    // Determine exchange order
    const exchangeOrder = threadHistory.length + 1;

    // Generate AI response based on action type
    let aiResponse;
    if (request.actionType === 'new_direction') {
      aiResponse = await this.generateNewDirectionResponse(request, thread, userProfile, userContext, personalizationRecs, frameworkRecommendation);
    } else if (request.actionType === 'customize_response' && threadHistory.length > 0) {
      aiResponse = await this.generateCustomizedResponse(request, thread, threadHistory[threadHistory.length - 1], userProfile, personalizationRecs, frameworkRecommendation);
    } else {
      aiResponse = await this.generateDeepAnalysisResponse(request, thread, threadHistory, userProfile, userContext, personalizationRecs, frameworkRecommendation, therapeuticMemory, crossSessionPatterns, psychologicalAnalysis);
    }

    const processingTime = Date.now() - startTime;

    // Skip expensive operations for better performance
    const breakthroughMoment = null;

    // Skip goal tracking for faster responses

    // Skip language adaptation for faster responses

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

    // Analyze interaction for user modeling and personalization improvements
    await userModelingEngine.analyzeInteraction({
      userId: request.userId,
      threadId: thread.id,
      exchangeId: savedExchange.id,
      userInput: request.userInput,
      aiResponse: aiResponse.question,
      sessionMetadata: {
        timeOfDay: this.getTimeOfDay(),
        sessionDuration: processingTime,
        techniquesUsed: this.extractTechniquesUsed(aiResponse),
        frameworksApplied: personalizationRecs.therapeuticFrameworks,
        questioningStyle: personalizationRecs.therapeuticStyle,
        interventionType: this.determineInterventionType(request, aiResponse)
      }
    });

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
    userContext: any,
    personalizationRecs: PersonalizationRecommendations,
    frameworkRec: FrameworkRecommendation,
    therapeuticMemory?: TherapeuticMemory,
    crossSessionPatterns?: any[],
    psychologicalAnalysis?: any
  ) {
    // Use dynamic framework recommendation with personalization for optimal therapeutic intervention
    const mode = request.customizations?.mode || personalizationRecs.communicationAdjustments.tone || thread.preferredMode || 'conversational';
    const tone = request.customizations?.tone || personalizationRecs.communicationAdjustments.tone || thread.preferredTone || 'supportive';
    const perspective = request.customizations?.perspective || frameworkRec.primaryFramework || personalizationRecs.therapeuticStyle || thread.preferredPerspective || 'psychologist';

    // Build enhanced system prompt with comprehensive psychological analysis integration
    const enhancedSystemPrompt = buildTherapeuticSystemPrompt(
      [frameworkRec.primaryFramework, ...frameworkRec.secondaryFrameworks],
      request.userInput, 
      { 
        mode, 
        tone, 
        perspective,
        responseLength: personalizationRecs.communicationAdjustments.responseLength,
        metaphorTypes: personalizationRecs.communicationAdjustments.metaphorTypes,
        avoidanceFactors: [...personalizationRecs.avoidanceFactors, ...frameworkRec.avoidanceFactors],
        customInstructions: [...personalizationRecs.customInstructions, ...frameworkRec.adaptationInstructions],
        interventionType: frameworkRec.interventionType,
        frameworkRationale: frameworkRec.rationale,
        expectedOutcomes: frameworkRec.expectedOutcomes
      }
    );

    // Integrate comprehensive psychological analysis into system prompt
    const psychologicalContext = psychologicalAnalysis ? `

COMPREHENSIVE PSYCHOLOGICAL ANALYSIS:
- Emotional State: ${psychologicalAnalysis.emotionalState.primary} (Intensity: ${psychologicalAnalysis.emotionalState.intensity}/10, ${psychologicalAnalysis.emotionalState.valence})
- Cognitive Patterns: ${psychologicalAnalysis.cognitivePatterns.map(p => p.content).join(', ')}
- Adaptive Coping: ${psychologicalAnalysis.copingStrategies.adaptive.join(', ') || 'None detected'}
- Maladaptive Patterns: ${psychologicalAnalysis.copingStrategies.maladaptive.join(', ') || 'None detected'}
- Psychological Insights: ${psychologicalAnalysis.psychologicalInsights.therapeuticRecommendations?.join(', ') || 'Standard therapeutic approach'}
- Risk Factors: ${psychologicalAnalysis.psychologicalInsights.riskFactors?.join(', ') || 'None identified'}
- Strengths: ${psychologicalAnalysis.psychologicalInsights.strengths?.join(', ') || 'To be explored'}

Use this analysis to provide highly personalized, psychologically-informed therapeutic responses.` : '';

    const systemPrompt = enhancedSystemPrompt + psychologicalContext;

    const contextPrompt = this.buildContextPrompt(thread, history, userProfile, userContext, therapeuticMemory, crossSessionPatterns);
    const analysisPrompt = this.buildAnalysisPrompt(request.userInput, request.actionType);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: `${contextPrompt}\n\n${analysisPrompt}` }
    ];

    // Use therapeutic-chat-adapter for AI Intelligence Layer integration while preserving therapeutic quality
    let aiResponse;

    try {
      const therapeuticRequest: TherapeuticRequest = {
        userId: request.userId,
        userInput: `${contextPrompt}\n\n${analysisPrompt}`,
        systemPrompt,
        userTier: 'premium', // Therapeutic chat is premium tier
        sessionContext: {
          threadId: thread.id,
          conversationHistory: history.map(h => ({
            role: 'user' as const,
            content: h.userInput || ''
          })),
          therapeuticGoals: frameworkRec.expectedOutcomes,
          currentTherapeuticStyle: frameworkRec.primaryFramework,
          emotionalState: userProfile?.currentEmotionalState || 'neutral',
          sessionType: 'therapeutic_analysis'
        },
        personalization: {
          preferredResponseStyle: personalizationRecs.communicationAdjustments.tone,
          effectivePatterns: personalizationRecs.therapeuticFrameworks,
          avoidancePatterns: personalizationRecs.avoidanceFactors,
          personalizedContext: {
            mode,
            tone,
            perspective,
            responseLength: personalizationRecs.communicationAdjustments.responseLength
          }
        },
        options: {
          temperature: 0.7,
          maxTokens: 2000,
          enableAdaptiveLanguage: true,
          enableContextualMemory: true
        }
      };

      // Process through therapeutic-chat-adapter (bypasses cost optimization, preserves quality)
      const adapterResponse = await therapeuticChatAdapter.processTherapeuticRequest(therapeuticRequest);

      const responseContent = adapterResponse.content || "I'm here to listen and support you. What would you like to explore?";

      // Use the therapeutic response directly from adapter - includes AI Intelligence Layer benefits
      aiResponse = {
        analysis: { professionalAnalysis: responseContent },
        question: responseContent, // Use the full therapeutic response
        patternInsights: adapterResponse.therapeuticInsights?.progressIndicators || [],
        emotionalAssessment: adapterResponse.therapeuticInsights?.detectedEmotionalState || 'neutral',
        emotionalState: { 
          primaryEmotion: adapterResponse.therapeuticInsights?.detectedEmotionalState || 'curious', 
          intensity: 0.7, 
          clarity: 0.8 
        },
        suggestions: adapterResponse.therapeuticInsights?.recommendedFollowUp || [],
        tokenCount: Math.ceil(responseContent.length / 4), // Estimate from response length
        cost: adapterResponse.metadata.cost,
        modelUsed: adapterResponse.metadata.modelUsed,
        provider: adapterResponse.metadata.provider
      };

      console.log('Direct OpenAI Response Quality Check:', {
        hasAnalysis: !!aiResponse.analysis?.professionalAnalysis,
        analysisLength: aiResponse.analysis?.professionalAnalysis?.length || 0,
        questionQuality: aiResponse.question?.length || 0
      });

    } catch (openaiError) {
      console.error('Direct OpenAI call failed:', openaiError);
      // Fallback to original routing
      aiResponse = await intelligentModelRouter.routeTherapeuticRequest(
        request,
        systemPrompt,
        `${contextPrompt}\n\n${analysisPrompt}`,
        'complex'
      );
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
    userContext: any,
    personalizationRecs: PersonalizationRecommendations,
    frameworkRec: FrameworkRecommendation
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
    userProfile: PsychologicalProfile | null,
    personalizationRecs: PersonalizationRecommendations,
    frameworkRec: FrameworkRecommendation
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
    userContext: any,
    therapeuticMemory?: TherapeuticMemory,
    crossSessionPatterns?: any[]
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

    // Add therapeutic memory and cross-session insights
    if (therapeuticMemory) {
      context += `\nTHERAPEUTIC MEMORY & PROGRESS:\n`;

      if (therapeuticMemory.goals.length > 0) {
        context += `Active Therapeutic Goals:\n`;
        therapeuticMemory.goals.slice(0, 3).forEach(goal => {
          context += `- ${goal.title}: ${goal.currentProgress}% complete (${goal.category})\n`;
        });
      }

      if (therapeuticMemory.breakthroughs.length > 0) {
        context += `Recent Breakthroughs:\n`;
        therapeuticMemory.breakthroughs.slice(0, 2).forEach(breakthrough => {
          context += `- ${breakthrough.type}: ${breakthrough.description} (significance: ${breakthrough.significance}/10)\n`;
        });
      }

      if (therapeuticMemory.resistancePatterns.length > 0) {
        context += `Resistance Patterns:\n`;
        therapeuticMemory.resistancePatterns.slice(0, 2).forEach(pattern => {
          context += `- "${pattern.pattern}" (frequency: ${pattern.frequency}, trend: ${pattern.trend})\n`;
        });
      }

      context += `Progress Velocity: ${therapeuticMemory.progressVelocity.predictedTrajectory} (${therapeuticMemory.progressVelocity.engagementTrend} engagement)\n`;
      context += `Therapeutic Alliance Score: ${Math.round(therapeuticMemory.therapeuticAlliance * 100)}%\n`;
    }

    if (crossSessionPatterns && crossSessionPatterns.length > 0) {
      context += `\nCROSS-SESSION PATTERNS:\n`;
      crossSessionPatterns.slice(0, 3).forEach(pattern => {
        context += `- ${pattern.pattern}: ${pattern.occurrences} occurrences over ${pattern.timeSpan} days (significance: ${pattern.significance}/10)\n`;
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
   * Humanize AI response formatting
   */
  private humanizeResponse(response: string): string {
    if (!response || typeof response !== 'string') {
      return response;
    }

    // Remove any JSON formatting artifacts
    let humanized = response.replace(/^["']|["']$/g, '').trim();

    // Fix common truncation patterns
    if (humanized.endsWith(' This pat') || humanized.endsWith('This pat')) {
      humanized = humanized.replace(/ This pat$|This pat$/, '. This pattern of urgency around ideas can feel overwhelming and exhausting.');
    }

    // Ensure proper sentence completion
    if (!humanized.match(/[.!?]$/)) {
      // If it ends mid-word or incomplete thought, try to complete it naturally
      if (humanized.endsWith(' feel') || humanized.endsWith('feel')) {
        humanized += 's deeply significant to you.';
      } else if (humanized.endsWith(' this ') || humanized.endsWith('this')) {
        humanized += ' experience you\'re having.';
      } else if (humanized.match(/\w$/)) {
        humanized += '.';
      }
    }

    // Add natural paragraph breaks for better readability
    humanized = humanized.replace(/\. ([A-Z])/g, '.\n\n$1');

    // Remove excessive line breaks and normalize spacing
    humanized = humanized.replace(/\n{3,}/g, '\n\n').trim();

    return humanized;
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
   * Helper methods for Multi-Dimensional User Modeling
   */
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private extractTechniquesUsed(aiResponse: any): string[] {
    const techniques = [];

    // Analyze the response to identify therapeutic techniques used
    const responseText = aiResponse.question?.toLowerCase() || '';

    if (responseText.includes('what if') || responseText.includes('imagine')) {
      techniques.push('hypothetical_questioning');
    }
    if (responseText.includes('how did that feel') || responseText.includes('emotion')) {
      techniques.push('emotional_exploration');
    }
    if (responseText.includes('pattern') || responseText.includes('similar')) {
      techniques.push('pattern_identification');
    }
    if (responseText.includes('why') || responseText.includes('what led')) {
      techniques.push('socratic_questioning');
    }
    if (responseText.includes('reframe') || responseText.includes('another way')) {
      techniques.push('cognitive_reframing');
    }

    return techniques.length > 0 ? techniques : ['supportive_questioning'];
  }

  private determineInterventionType(request: DeepJournalingRequest, aiResponse: any): string {
    // Determine intervention type based on request and response characteristics
    if (request.actionType === 'new_direction') return 'redirection';
    if (request.actionType === 'customize_response') return 'adaptation';

    const responseText = aiResponse.question?.toLowerCase() || '';

    if (responseText.includes('challenge') || responseText.includes('push')) {
      return 'confrontation';
    }
    if (responseText.includes('understand') || responseText.includes('clarify')) {
      return 'clarification';
    }
    if (responseText.includes('feel') || responseText.includes('valid')) {
      return 'validation';
    }
    if (responseText.includes('insight') || responseText.includes('meaning')) {
      return 'interpretation';
    }

    return 'support';
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
export const therapeuticChatEngine = deepJournalingEngine;