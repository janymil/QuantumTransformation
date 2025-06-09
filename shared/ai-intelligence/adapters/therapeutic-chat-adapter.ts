/**
 * Therapeutic Chat Adapter
 * Provides advanced interface for the therapeutic-chat system to use the AI Intelligence Layer
 * Includes advanced personalization, contextual memory, and adaptive language generation
 */

import { intelligentRouter, AIRequest, AIResponse } from '../core/intelligent-router';
import { costOptimizer } from '../core/cost-optimizer';
import { learningEngine } from '../core/learning-engine';
import { unifiedResearchIntegration } from '../../../server/unified-research-integration';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface TherapeuticRequest {
  userId: string;
  userInput: string;
  systemPrompt: string;
  userTier: 'premium' | 'ultra';
  sessionContext: {
    threadId?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    therapeuticGoals?: string[];
    currentTherapeuticStyle?: string;
    emotionalState?: string;
    sessionType?: string;
  };
  personalization?: {
    preferredResponseStyle?: string;
    effectivePatterns?: string[];
    avoidancePatterns?: string[];
    personalizedContext?: Record<string, any>;
  };
  options?: {
    temperature?: number;
    maxTokens?: number;
    preferredProvider?: 'openai' | 'anthropic' | 'local';
    enableAdaptiveLanguage?: boolean;
    enableContextualMemory?: boolean;
  };
}

export interface TherapeuticResponse {
  content: string;
  metadata: {
    modelUsed: string;
    provider: 'local' | 'openai' | 'anthropic';
    cost: number;
    processingTime: number;
    fromCache: boolean;
    costSavings: number;
    routingReason: string;
    adaptiveLanguageApplied: boolean;
    contextualMemoryUsed: boolean;
    personalizationLevel: number; // 0-1 scale
  };
  therapeuticInsights?: {
    detectedEmotionalState?: string;
    recommendedFollowUp?: string[];
    therapeuticApproaches?: string[];
    progressIndicators?: string[];
  };
}

export class TherapeuticChatAdapter {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Process therapeutic chat request through TherapeuticChatEngine
   * Correct flow: adapter → therapeutic-chat-engine → APIs
   */
  async processTherapeuticRequest(request: TherapeuticRequest): Promise<TherapeuticResponse> {
    try {
      // Use intelligent router for therapeutic processing instead of circular import
      const intelligentRouter = new IntelligentModelRouter();

      // Apply advanced therapeutic intelligence from adapter
      const therapeuticEnhancedPrompt = await this.applyTherapeuticIntelligence(
        request,
        request.systemPrompt
      );

      // Enhance with research integration (preserve knowledge enhancements for premium)
      const researchEnhancedPrompt = await unifiedResearchIntegration.enhancePromptWithResearch(
        therapeuticEnhancedPrompt,
        request.userInput,
        {
          userId: request.userId,
          sessionType: 'therapeutic_chat',
          therapeuticFramework: request.sessionContext.currentTherapeuticStyle,
          userTier: 'premium'
        }
      );

      // Enhanced system prompt with personalization
      const enhancedSystemPrompt = await this.enhanceSystemPrompt(
        researchEnhancedPrompt.enhancedPrompt,
        request.personalization,
        request.sessionContext
      );

      // Enhanced user input with contextual memory
      const enhancedUserInput = await this.enhanceUserInput(
        request.userInput,
        request.sessionContext,
        request.options?.enableContextualMemory
      );

      // Build request for TherapeuticChatEngine (DeepJournalingEngine)
      const engineRequest = {
        userId: request.userId,
        userInput: enhancedUserInput,
        threadId: request.sessionContext.threadId,
        actionType: request.sessionContext.sessionType,
        customizations: {
          tone: request.personalization?.preferredResponseStyle || 'empathetic',
          approach: request.sessionContext.currentTherapeuticStyle || 'balanced',
          responseLength: 'balanced',
          focusArea: request.sessionContext.therapeuticGoals?.[0] || 'general'
        },
        wasVoiceInput: false
      };

      // Process through DeepJournalingEngine (correct flow)
      const engine = new DeepJournalingEngine();
      const engineResponse = await engine.processJournalingRequest(engineRequest);

      // Extract content from engine response
      const content = engineResponse.analysis?.professionalAnalysis || engineResponse.question || "I understand what you're sharing with me.";

      // Apply adaptive language generation if enabled
      let processedContent = content;
      let adaptiveLanguageApplied = false;
      
      if (request.options?.enableAdaptiveLanguage) {
        processedContent = await this.applyAdaptiveLanguage(
          content,
          request.personalization?.preferredResponseStyle,
          request.sessionContext.currentTherapeuticStyle
        );
        adaptiveLanguageApplied = true;
      }

      // Post-process response with research citations (preserve knowledge enhancements for premium)
      const finalContent = unifiedResearchIntegration.postProcessResponse(
        processedContent,
        researchEnhancedPrompt.researchContext
      );

      // Track usage for analytics only (no cost optimization applied)
      await this.trackTherapeuticUsage(request.userId, {
        prompt: enhancedUserInput,
        systemPrompt: enhancedSystemPrompt,
        complexity,
        emotionalIntensity
      }, aiResponse);

      // Generate therapeutic insights
      const therapeuticInsights = await this.generateTherapeuticInsights(
        request.userInput,
        finalContent,
        request.sessionContext
      );

      // Calculate personalization level
      const personalizationLevel = this.calculatePersonalizationLevel(
        request.personalization,
        request.sessionContext,
        request.options
      );

      return {
        content: finalContent,
        metadata: {
          modelUsed: aiResponse.metadata.modelUsed,
          provider: aiResponse.metadata.provider,
          cost: aiResponse.metadata.cost,
          processingTime: aiResponse.metadata.processingTime,
          fromCache: aiResponse.metadata.fromCache,
          costSavings: aiResponse.metadata.fromCache ? 0.008 : 0, // Therapeutic responses typically more expensive
          routingReason: aiResponse.metadata.routingReason,
          adaptiveLanguageApplied,
          contextualMemoryUsed: request.options?.enableContextualMemory || false,
          personalizationLevel
        },
        therapeuticInsights
      };

    } catch (error) {
      console.error('Therapeutic Chat Adapter error:', error);
      throw new Error('Failed to process therapeutic request');
    }
  }

  /**
   * Get personalized insights for therapeutic sessions
   */
  async getPersonalizedInsights(userId: string) {
    return await learningEngine.getPersonalizedInsights(userId);
  }

  /**
   * Apply advanced therapeutic intelligence from engine
   */
  private async applyTherapeuticIntelligence(
    request: TherapeuticRequest,
    systemPrompt: string
  ): Promise<string> {
    try {
      // For now, apply basic therapeutic enhancements to avoid import issues
      // The full therapeutic intelligence will be applied when the request reaches TherapeuticChatEngine
      let enhancedPrompt = systemPrompt;
      
      // Add therapeutic context from request
      if (request.sessionContext.therapeuticGoals?.length) {
        enhancedPrompt += `\n\nTherapeutic Goals: ${request.sessionContext.therapeuticGoals.join(', ')}`;
      }
      
      if (request.sessionContext.currentTherapeuticStyle) {
        enhancedPrompt += `\n\nTherapeutic Framework: ${request.sessionContext.currentTherapeuticStyle}`;
      }
      
      if (request.sessionContext.emotionalState) {
        enhancedPrompt += `\n\nUser's Emotional State: ${request.sessionContext.emotionalState}`;
      }
      
      // Add personalization data
      if (request.personalization?.preferredResponseStyle) {
        enhancedPrompt += `\n\nPreferred Communication Style: ${request.personalization.preferredResponseStyle}`;
      }
      
      if (request.personalization?.effectivePatterns?.length) {
        enhancedPrompt += `\n\nEffective Therapeutic Approaches: ${request.personalization.effectivePatterns.join(', ')}`;
      }
      
      return enhancedPrompt;
      
    } catch (error) {
      console.error('Therapeutic intelligence application error:', error);
      return systemPrompt; // Fallback to original prompt
    }
  }

  /**
   * Process therapeutic session with breakthrough detection
   */
  async processWithBreakthroughDetection(
    request: TherapeuticRequest
  ): Promise<TherapeuticResponse & { breakthroughDetected: boolean; breakthroughInsights?: string[] }> {
    const response = await this.processTherapeuticRequest(request);

    // Analyze for potential breakthroughs
    const breakthroughDetected = this.detectBreakthrough(
      request.userInput,
      response.content,
      request.sessionContext
    );

    let breakthroughInsights: string[] = [];
    if (breakthroughDetected) {
      breakthroughInsights = [
        'Significant emotional shift detected',
        'User showing increased self-awareness',
        'Potential therapeutic breakthrough moment',
        'Consider deeper exploration in next session'
      ];
    }

    return {
      ...response,
      breakthroughDetected,
      breakthroughInsights
    };
  }

  /**
   * Get therapeutic usage analytics
   */
  async getTherapeuticAnalytics(userId: string, timeframe: 'day' | 'week' | 'month' = 'week') {
    const usageStats = await costOptimizer.getRoutingStats(userId, timeframe);
    const personalizedInsights = await learningEngine.getPersonalizedInsights(userId);

    return {
      usageStats,
      personalizedInsights,
      costOptimization: {
        totalSavings: 0, // No cost optimization applied for therapeutic chat
        localModelUsage: 0, // Never use local models for therapeutic content
        averageCostPerSession: usageStats.averageCostPerRequest
      }
    };
  }

  /**
   * Process request directly through premium APIs (bypassing cost optimization)
   * Ensures therapeutic quality by using only GPT-4o and Claude-3.5-Sonnet
   */
  private async processDirectPremiumAPI(params: {
    prompt: string;
    systemPrompt: string;
    userTier: 'premium' | 'ultra';
    complexity: 'simple' | 'moderate' | 'complex';
    emotionalIntensity: number;
    options?: any;
  }): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Select premium model based on complexity and user tier
    const modelChoice = this.selectPremiumModel(params.complexity, params.userTier, params.emotionalIntensity);
    
    try {
      let response;
      let cost: number;
      
      if (modelChoice.provider === 'anthropic') {
        // Use Claude for nuanced therapeutic conversations
        const claudeResponse = await this.anthropic.messages.create({
          model: modelChoice.model,
          max_tokens: params.options?.maxTokens || 2000,
          temperature: params.options?.temperature || 0.7,
          messages: [
            {
              role: 'user',
              content: `${params.systemPrompt}\n\nUser: ${params.prompt}`
            }
          ]
        });
        
        response = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
        cost = this.calculateAnthropicCost(claudeResponse.usage?.input_tokens || 0, claudeResponse.usage?.output_tokens || 0);
        
      } else {
        // Use OpenAI GPT-4o for complex therapeutic analysis
        const openaiResponse = await this.openai.chat.completions.create({
          model: modelChoice.model,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.prompt }
          ],
          temperature: params.options?.temperature || 0.7,
          max_tokens: params.options?.maxTokens || 2000
        });
        
        response = openaiResponse.choices[0]?.message?.content || '';
        cost = this.calculateOpenAICost(
          openaiResponse.usage?.prompt_tokens || 0, 
          openaiResponse.usage?.completion_tokens || 0, 
          modelChoice.model
        );
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        content: response,
        metadata: {
          modelUsed: modelChoice.model,
          provider: modelChoice.provider,
          cost,
          processingTime,
          fromCache: false,
          learningApplied: false,
          routingReason: modelChoice.reasoning
        }
      };
      
    } catch (error) {
      console.error('Direct premium API error:', error);
      throw new Error('Failed to process therapeutic request with premium models');
    }
  }

  /**
   * Select optimal premium model for therapeutic content
   */
  private selectPremiumModel(
    complexity: 'simple' | 'moderate' | 'complex',
    userTier: 'premium' | 'ultra',
    emotionalIntensity: number
  ): { provider: 'openai' | 'anthropic'; model: string; reasoning: string } {
    
    // Ultra tier gets the absolute best models
    if (userTier === 'ultra') {
      return {
        provider: 'openai',
        model: 'gpt-4o',
        reasoning: 'Ultra tier - premium GPT-4o for highest therapeutic quality'
      };
    }
    
    // High emotional intensity or complex topics get Claude for empathy
    if (emotionalIntensity > 0.7 || complexity === 'complex') {
      return {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        reasoning: 'High emotional intensity/complexity - Claude for therapeutic empathy'
      };
    }
    
    // Standard therapeutic sessions use GPT-4o
    return {
      provider: 'openai',
      model: 'gpt-4o',
      reasoning: 'Standard therapeutic session - GPT-4o for clinical expertise'
    };
  }

  /**
   * Track therapeutic usage for analytics (no optimization applied)
   */
  private async trackTherapeuticUsage(
    userId: string,
    request: { prompt: string; systemPrompt: string; complexity: any; emotionalIntensity: number },
    response: AIResponse
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const inputTokens = Math.ceil((request.prompt + request.systemPrompt).length / 4);
      const outputTokens = Math.ceil(response.content.length / 4);
      
      await costOptimizer.trackUsage(userId, {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        context: {
          userId,
          sessionType: 'therapeutic_chat',
          userTier: 'premium',
          complexity: request.complexity,
          emotionalIntensity: request.emotionalIntensity,
          requiresPersonalization: true
        }
      } as AIRequest, response);
      
    } catch (error) {
      console.error('Therapeutic usage tracking error:', error);
    }
  }

  /**
   * Calculate OpenAI API costs
   */
  private calculateOpenAICost(inputTokens: number, outputTokens: number, model: string): number {
    const costs = {
      'gpt-4o': { input: 0.0025, output: 0.01 }, // per 1K tokens
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
    };
    
    const modelCosts = costs[model as keyof typeof costs] || costs['gpt-4o'];
    return ((inputTokens * modelCosts.input) + (outputTokens * modelCosts.output)) / 1000;
  }

  /**
   * Calculate Anthropic API costs
   */
  private calculateAnthropicCost(inputTokens: number, outputTokens: number): number {
    // Claude-3.5-Sonnet costs: $3/1M input tokens, $15/1M output tokens
    return ((inputTokens * 3) + (outputTokens * 15)) / 1000000;
  }

  /**
   * Enhance system prompt with personalization data
   */
  private async enhanceSystemPrompt(
    basePrompt: string,
    personalization?: TherapeuticRequest['personalization'],
    sessionContext?: TherapeuticRequest['sessionContext']
  ): Promise<string> {
    let enhanced = basePrompt;

    if (personalization?.preferredResponseStyle) {
      enhanced += `\n\nPersonalization: Use a ${personalization.preferredResponseStyle} communication style.`;
    }

    if (personalization?.effectivePatterns?.length) {
      enhanced += `\n\nEffective approaches for this user: ${personalization.effectivePatterns.join(', ')}.`;
    }

    if (personalization?.avoidancePatterns?.length) {
      enhanced += `\n\nAvoid these approaches: ${personalization.avoidancePatterns.join(', ')}.`;
    }

    if (sessionContext?.therapeuticGoals?.length) {
      enhanced += `\n\nTherapeutic goals: ${sessionContext.therapeuticGoals.join(', ')}.`;
    }

    if (sessionContext?.currentTherapeuticStyle) {
      enhanced += `\n\nCurrent therapeutic framework: ${sessionContext.currentTherapeuticStyle}.`;
    }

    return enhanced;
  }

  /**
   * Enhance user input with contextual memory
   */
  private async enhanceUserInput(
    userInput: string,
    sessionContext?: TherapeuticRequest['sessionContext'],
    useContextualMemory?: boolean
  ): Promise<string> {
    if (!useContextualMemory || !sessionContext?.conversationHistory) {
      return userInput;
    }

    // Add relevant context from conversation history
    const recentContext = sessionContext.conversationHistory
      .slice(-3) // Last 3 exchanges
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return `Context from recent conversation:\n${recentContext}\n\nCurrent message: ${userInput}`;
  }

  /**
   * Apply adaptive language generation
   */
  private async applyAdaptiveLanguage(
    content: string,
    preferredStyle?: string,
    therapeuticStyle?: string
  ): Promise<string> {
    // This would typically use advanced NLP to adapt the language
    // For now, we'll apply basic style adaptations

    if (preferredStyle === 'direct') {
      // Make language more direct and actionable
      return content.replace(/Perhaps you could/g, 'I recommend you')
                  .replace(/You might want to/g, 'Try to')
                  .replace(/Maybe/g, 'Consider');
    }

    if (preferredStyle === 'empathetic') {
      // Make language more empathetic and supportive
      return content.replace(/You should/g, 'It might help if you')
                  .replace(/Try to/g, 'When you feel ready, you could')
                  .replace(/This will/g, 'This may gently');
    }

    return content; // No changes for other styles
  }

  /**
   * Generate therapeutic insights
   */
  private async generateTherapeuticInsights(
    userInput: string,
    aiResponse: string,
    sessionContext?: TherapeuticRequest['sessionContext']
  ): Promise<TherapeuticResponse['therapeuticInsights']> {
    const detectedEmotionalState = this.detectEmotionalState(userInput);
    
    const recommendedFollowUp = [
      'Explore deeper emotional responses',
      'Practice mindfulness techniques',
      'Journal about insights from this session'
    ];

    const therapeuticApproaches = sessionContext?.currentTherapeuticStyle ? 
      [sessionContext.currentTherapeuticStyle] : 
      ['CBT', 'Mindfulness-based approach'];

    const progressIndicators = [
      'Increased emotional awareness',
      'Better coping strategies',
      'Improved self-reflection'
    ];

    return {
      detectedEmotionalState,
      recommendedFollowUp,
      therapeuticApproaches,
      progressIndicators
    };
  }

  /**
   * Analyze therapeutic complexity
   */
  private analyzeTherapeuticComplexity(
    userInput: string,
    sessionContext?: TherapeuticRequest['sessionContext']
  ): 'simple' | 'moderate' | 'complex' {
    let complexity = 'moderate';

    // Check for complex psychological concepts
    const complexKeywords = [
      'trauma', 'ptsd', 'dissociation', 'personality disorder',
      'suicidal', 'self-harm', 'abuse', 'addiction'
    ];

    if (complexKeywords.some(keyword => userInput.toLowerCase().includes(keyword))) {
      complexity = 'complex';
    }

    // Check conversation history depth
    if (sessionContext?.conversationHistory && sessionContext.conversationHistory.length > 10) {
      complexity = 'complex';
    }

    // Simple responses for basic check-ins
    if (userInput.length < 50 && !sessionContext?.therapeuticGoals?.length) {
      complexity = 'simple';
    }

    return complexity as 'simple' | 'moderate' | 'complex';
  }

  /**
   * Analyze emotional intensity
   */
  private analyzeEmotionalIntensity(userInput: string): number {
    const highIntensityWords = [
      'crisis', 'emergency', 'can\'t take it', 'overwhelming',
      'desperate', 'hopeless', 'suicidal', 'breaking down'
    ];

    const mediumIntensityWords = [
      'stressed', 'anxious', 'depressed', 'angry', 'frustrated',
      'sad', 'worried', 'confused', 'hurt'
    ];

    const input = userInput.toLowerCase();
    let intensity = 0.3;

    if (highIntensityWords.some(word => input.includes(word))) {
      intensity = 0.9;
    } else if (mediumIntensityWords.some(word => input.includes(word))) {
      intensity = 0.6;
    }

    // Check for urgency indicators
    if (input.includes('urgent') || input.includes('need help now')) {
      intensity = Math.min(1.0, intensity + 0.2);
    }

    return intensity;
  }

  /**
   * Calculate personalization level
   */
  private calculatePersonalizationLevel(
    personalization?: TherapeuticRequest['personalization'],
    sessionContext?: TherapeuticRequest['sessionContext'],
    options?: TherapeuticRequest['options']
  ): number {
    let level = 0.5; // Base personalization

    if (personalization?.preferredResponseStyle) level += 0.2;
    if (personalization?.effectivePatterns?.length) level += 0.2;
    if (sessionContext?.therapeuticGoals?.length) level += 0.1;
    if (options?.enableContextualMemory) level += 0.1;
    if (options?.enableAdaptiveLanguage) level += 0.1;

    return Math.min(1.0, level);
  }

  /**
   * Detect emotional state from user input
   */
  private detectEmotionalState(userInput: string): string {
    const input = userInput.toLowerCase();

    if (input.includes('anxious') || input.includes('worry')) return 'anxious';
    if (input.includes('depressed') || input.includes('sad')) return 'depressed';
    if (input.includes('angry') || input.includes('frustrated')) return 'angry';
    if (input.includes('hopeful') || input.includes('better')) return 'hopeful';
    if (input.includes('confused') || input.includes('lost')) return 'confused';

    return 'neutral';
  }

  /**
   * Detect potential therapeutic breakthroughs
   */
  private detectBreakthrough(
    userInput: string,
    aiResponse: string,
    sessionContext?: TherapeuticRequest['sessionContext']
  ): boolean {
    const breakthroughIndicators = [
      'i understand now', 'i see the pattern', 'that makes sense',
      'i never thought of it that way', 'this is really helpful',
      'i feel like something clicked', 'i have a new perspective'
    ];

    const combinedText = (userInput + ' ' + aiResponse).toLowerCase();
    return breakthroughIndicators.some(indicator => combinedText.includes(indicator));
  }
}

export const therapeuticChatAdapter = new TherapeuticChatAdapter();