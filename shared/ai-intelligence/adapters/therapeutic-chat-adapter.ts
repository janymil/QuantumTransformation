/**
 * Therapeutic Chat Adapter
 * Provides advanced interface for the therapeutic-chat system to use the AI Intelligence Layer
 * Includes advanced personalization, contextual memory, and adaptive language generation
 */

import { intelligentRouter, AIRequest, AIResponse } from '../core/intelligent-router';
import { costOptimizer } from '../core/cost-optimizer';
import { learningEngine } from '../core/learning-engine';

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

  /**
   * Process therapeutic chat request with advanced personalization
   */
  async processTherapeuticRequest(request: TherapeuticRequest): Promise<TherapeuticResponse> {
    try {
      // Enhanced system prompt with personalization
      const enhancedSystemPrompt = await this.enhanceSystemPrompt(
        request.systemPrompt,
        request.personalization,
        request.sessionContext
      );

      // Enhanced user input with contextual memory
      const enhancedUserInput = await this.enhanceUserInput(
        request.userInput,
        request.sessionContext,
        request.options?.enableContextualMemory
      );

      // Convert to AI Intelligence Layer format
      const aiRequest: AIRequest = {
        prompt: enhancedUserInput,
        systemPrompt: enhancedSystemPrompt,
        context: {
          userId: request.userId,
          sessionType: 'therapeutic_chat',
          userTier: request.userTier,
          complexity: this.analyzeTherapeuticComplexity(request.userInput, request.sessionContext),
          emotionalIntensity: this.analyzeEmotionalIntensity(request.userInput),
          requiresPersonalization: true // Always true for therapeutic chat
        },
        options: request.options
      };

      // Process through AI Intelligence Layer
      const aiResponse = await intelligentRouter.process(aiRequest);

      // Apply adaptive language generation if enabled
      let finalContent = aiResponse.content;
      let adaptiveLanguageApplied = false;
      
      if (request.options?.enableAdaptiveLanguage) {
        finalContent = await this.applyAdaptiveLanguage(
          aiResponse.content,
          request.personalization?.preferredResponseStyle,
          request.sessionContext.currentTherapeuticStyle
        );
        adaptiveLanguageApplied = true;
      }

      // Track usage and learn from interaction
      await Promise.all([
        costOptimizer.trackUsage(request.userId, aiRequest, aiResponse),
        learningEngine.learn(aiRequest, { ...aiResponse, content: finalContent })
      ]);

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
        totalSavings: usageStats.costSavings,
        localModelUsage: usageStats.routingBreakdown.local.percentage,
        averageCostPerSession: usageStats.averageCostPerRequest
      }
    };
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