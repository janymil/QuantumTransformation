/**
 * Unified AI Intelligence Router
 * Central routing system that decides between local models and external APIs
 * based on query complexity, user tier, and cost optimization
 */

import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { localModelManager } from './local-model-manager';
import { costOptimizer } from './cost-optimizer';
import { learningEngine } from './learning-engine';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AIRequest {
  prompt: string;
  systemPrompt: string;
  context: {
    userId: string;
    sessionType: 'ai_coaching' | 'therapeutic_chat';
    userTier: 'basic' | 'premium' | 'ultra';
    complexity?: 'simple' | 'moderate' | 'complex';
    emotionalIntensity?: number; // 0-1 scale
    requiresPersonalization?: boolean;
    therapeuticContext?: {
      threadId?: string;
      conversationStyle?: string;
      focusArea?: string;
      actionType?: string;
      customizations?: any;
    };
  };
  options?: {
    temperature?: number;
    maxTokens?: number;
    preferredProvider?: 'openai' | 'anthropic' | 'local';
  };
}

export interface AIResponse {
  content: string;
  metadata: {
    modelUsed: string;
    provider: 'local' | 'openai' | 'anthropic';
    cost: number;
    processingTime: number;
    fromCache: boolean;
    learningApplied: boolean;
    routingReason: string;
  };
}

export interface RoutingDecision {
  useLocal: boolean;
  provider: 'local' | 'openai' | 'anthropic';
  model: string;
  reasoning: string;
  estimatedCost: number;
  confidence: number; // 0-1 scale for local model capability
}

export class IntelligentRouter {

  /**
   * Main processing method - decides routing and executes request
   */
  async process(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Check cache first
      const cachedResponse = await costOptimizer.checkCache(request);
      if (cachedResponse) {
        return {
          content: cachedResponse.content,
          metadata: {
            modelUsed: cachedResponse.modelUsed,
            provider: cachedResponse.provider as any,
            cost: 0,
            processingTime: Date.now() - startTime,
            fromCache: true,
            learningApplied: false,
            routingReason: 'Cache hit'
          }
        };
      }

      // Step 2: Analyze request and make routing decision
      const routingDecision = await this.makeRoutingDecision(request);

      // Step 3: Route to appropriate adapter based on session type
      let response: AIResponse;
      
      if (request.context.sessionType === 'therapeutic_chat') {
        // Route therapeutic chat through therapeutic-chat-adapter
        response = await this.routeToTherapeuticAdapter(request);
      } else if (request.context.sessionType === 'ai_coaching') {
        // Route AI coaching through ai-coaching-adapter
        response = await this.routeToAICoachingAdapter(request);
      } else {
        // Default routing for other requests
        if (routingDecision.useLocal) {
          response = await this.executeLocalModel(request, routingDecision);
        } else {
          response = await this.executeExternalAPI(request, routingDecision);
        }
      }

      // Step 4: Apply learning and cache response
      await Promise.all([
        costOptimizer.cacheResponse(request, response),
        learningEngine.learn(request, response)
      ]);

      response.metadata.processingTime = Date.now() - startTime;
      return response;

    } catch (error) {
      console.error('AI Intelligence Router error:', error);
      // Fallback to external API
      return await this.executeExternalAPI(request, {
        useLocal: false,
        provider: 'openai',
        model: 'gpt-4o-mini',
        reasoning: 'Fallback due to error',
        estimatedCost: 0.002,
        confidence: 0
      });
    }
  }

  /**
   * Intelligent routing decision based on multiple factors
   */
  private async makeRoutingDecision(request: AIRequest): Promise<RoutingDecision> {
    const { context, prompt, systemPrompt } = request;
    
    // Analyze request complexity
    const complexity = await this.analyzeComplexity(prompt, context);
    
    // Check local model capability for this type of request
    const localCapability = await localModelManager.assessCapability(request);
    
    // Determine if local model can handle this request effectively
    const useLocal = this.shouldUseLocalModel(complexity, localCapability, context);
    
    if (useLocal) {
      const localModel = await localModelManager.selectOptimalLocalModel(request);
      return {
        useLocal: true,
        provider: 'local',
        model: localModel,
        reasoning: `Local model capable (confidence: ${localCapability.confidence}) - cost savings`,
        estimatedCost: 0,
        confidence: localCapability.confidence
      };
    }

    // Route to external API
    const externalChoice = this.selectExternalProvider(complexity, context);
    return {
      useLocal: false,
      provider: externalChoice.provider,
      model: externalChoice.model,
      reasoning: externalChoice.reasoning,
      estimatedCost: externalChoice.estimatedCost,
      confidence: 0.95 // High confidence for external APIs
    };
  }

  /**
   * Analyze request complexity for routing decisions
   */
  private async analyzeComplexity(prompt: string, context: any): Promise<{
    score: number; // 1-10
    factors: string[];
    requiresAdvanced: boolean;
  }> {
    let complexityScore = 1;
    const factors: string[] = [];

    // Text length and structure analysis
    if (prompt.length > 500) {
      complexityScore += 1;
      factors.push('Long prompt');
    }

    // Emotional complexity
    if (context.emotionalIntensity > 0.7) {
      complexityScore += 2;
      factors.push('High emotional intensity');
    }

    // Session type complexity
    if (context.sessionType === 'therapeutic_chat') {
      complexityScore += 2;
      factors.push('Advanced therapeutic session');
    }

    // User tier expectations
    if (context.userTier === 'ultra') {
      complexityScore += 1;
      factors.push('Premium tier expectations');
    }

    // Keyword analysis for complex topics
    const complexKeywords = [
      'trauma', 'personality disorder', 'psychodynamic', 'unconscious',
      'transference', 'complex ptsd', 'dissociation', 'therapeutic relationship'
    ];
    
    const hasComplexKeywords = complexKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
    
    if (hasComplexKeywords) {
      complexityScore += 3;
      factors.push('Complex psychological concepts');
    }

    // Personalization requirements
    if (context.requiresPersonalization) {
      complexityScore += 1;
      factors.push('Personalization required');
    }

    return {
      score: Math.min(complexityScore, 10),
      factors,
      requiresAdvanced: complexityScore > 6
    };
  }

  /**
   * Determine if local model should be used
   */
  private shouldUseLocalModel(
    complexity: any,
    localCapability: any,
    context: any
  ): boolean {
    // Never use local for ultra tier users (they pay for premium)
    if (context.userTier === 'ultra') {
      return false;
    }

    // Use local if complexity is low and local model is confident
    if (complexity.score <= 4 && localCapability.confidence > 0.8) {
      return true;
    }

    // Use local for basic coaching tasks
    if (context.sessionType === 'ai_coaching' && localCapability.confidence > 0.7) {
      return true;
    }

    // Use local for routine therapeutic patterns
    if (localCapability.hasLearnedPattern && localCapability.confidence > 0.75) {
      return true;
    }

    return false;
  }

  /**
   * Select external API provider and model
   */
  private selectExternalProvider(complexity: any, context: any): {
    provider: 'openai' | 'anthropic';
    model: string;
    reasoning: string;
    estimatedCost: number;
  } {
    // High complexity or ultra tier gets best models
    if (complexity.requiresAdvanced || context.userTier === 'ultra') {
      return {
        provider: 'openai',
        model: 'gpt-4o',
        reasoning: 'Complex query requires advanced reasoning',
        estimatedCost: 0.012
      };
    }

    // Therapeutic chat gets Claude for nuanced responses
    if (context.sessionType === 'therapeutic_chat') {
      return {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        reasoning: 'Therapeutic session benefits from Claude\'s empathy',
        estimatedCost: 0.008
      };
    }

    // Default to cost-optimized model
    return {
      provider: 'openai',
      model: 'gpt-4o-mini',
      reasoning: 'Standard query with cost optimization',
      estimatedCost: 0.002
    };
  }

  /**
   * Route therapeutic chat requests through therapeutic-chat-adapter
   */
  private async routeToTherapeuticAdapter(request: AIRequest): Promise<AIResponse> {
    const { therapeuticChatAdapter } = await import('../adapters/therapeutic-chat-adapter');
    
    // Convert AI request to therapeutic request format
    const therapeuticRequest = {
      userId: request.context.userId,
      userInput: request.prompt,
      systemPrompt: request.systemPrompt,
      userTier: (request.context.userTier === 'basic' ? 'premium' : request.context.userTier) as 'premium' | 'ultra',
      sessionContext: {
        threadId: request.context.therapeuticContext?.threadId,
        conversationHistory: [],
        therapeuticGoals: [request.context.therapeuticContext?.focusArea || 'general'],
        currentTherapeuticStyle: request.context.therapeuticContext?.conversationStyle || 'empathetic',
        emotionalState: 'processing',
        sessionType: request.context.therapeuticContext?.actionType || 'chat'
      },
      personalization: {
        preferredResponseStyle: request.context.therapeuticContext?.customizations?.tone || 'empathetic',
        effectivePatterns: [],
        avoidancePatterns: [],
        personalizedContext: request.context.therapeuticContext?.customizations || {}
      },
      options: {
        temperature: request.options?.temperature || 0.7,
        maxTokens: request.options?.maxTokens || 2000,
        enableAdaptiveLanguage: true,
        enableContextualMemory: true
      }
    };

    const adapterResponse = await therapeuticChatAdapter.processTherapeuticRequest(therapeuticRequest);

    // Convert adapter response to AI response format
    return {
      content: adapterResponse.content,
      metadata: {
        modelUsed: adapterResponse.metadata.modelUsed,
        provider: adapterResponse.metadata.provider,
        cost: adapterResponse.metadata.cost,
        processingTime: adapterResponse.metadata.processingTime,
        fromCache: adapterResponse.metadata.fromCache,
        learningApplied: false,
        routingReason: 'routed_through_therapeutic_adapter'
      }
    };
  }

  /**
   * Route AI coaching requests through ai-coaching-adapter
   */
  private async routeToAICoachingAdapter(request: AIRequest): Promise<AIResponse> {
    const { aiCoachingAdapter } = await import('../adapters/ai-coaching-adapter');
    
    const coachingResponse = await aiCoachingAdapter.processCoachingRequest({
      userId: request.context.userId,
      userInput: request.prompt,
      systemPrompt: request.systemPrompt,
      userTier: request.context.userTier || 'basic',
      challengeType: request.context.therapeuticContext?.focusArea,
      actionType: request.context.therapeuticContext?.actionType,
      options: request.options
    });

    return {
      content: coachingResponse.content,
      metadata: {
        modelUsed: coachingResponse.metadata.modelUsed,
        provider: coachingResponse.metadata.provider,
        cost: coachingResponse.metadata.cost,
        processingTime: coachingResponse.metadata.processingTime,
        fromCache: coachingResponse.metadata.fromCache,
        learningApplied: false,
        routingReason: 'routed_through_ai_coaching_adapter'
      }
    };
  }

  /**
   * Execute request using local model
   */
  private async executeLocalModel(
    request: AIRequest,
    routing: RoutingDecision
  ): Promise<AIResponse> {
    const response = await localModelManager.generate(request, routing.model);
    
    return {
      content: response.content,
      metadata: {
        modelUsed: routing.model,
        provider: 'local',
        cost: 0,
        processingTime: response.processingTime,
        fromCache: false,
        learningApplied: response.learningApplied,
        routingReason: routing.reasoning
      }
    };
  }

  /**
   * Execute request using external API
   */
  private async executeExternalAPI(
    request: AIRequest,
    routing: RoutingDecision
  ): Promise<AIResponse> {
    const { prompt, systemPrompt, options = {} } = request;

    try {
      let response: any;
      let cost: number;

      if (routing.provider === 'openai') {
        const completion = await openai.chat.completions.create({
          model: routing.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1500
        });

        const rawResponse = completion.choices[0].message.content || "";
        
        // Clean up response - remove JSON formatting if present
        let cleanResponse = rawResponse;
        if (rawResponse.includes('"therapeuticResponse":')) {
          try {
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              cleanResponse = parsed.therapeuticResponse || parsed.response || parsed.content || rawResponse;
            }
          } catch {
            // If JSON parsing fails, extract content after the colon
            const colonIndex = rawResponse.indexOf('"therapeuticResponse":');
            if (colonIndex !== -1) {
              cleanResponse = rawResponse.substring(colonIndex + '"therapeuticResponse":'.length)
                .replace(/^[\s"]+/, '')
                .replace(/["}]+$/, '')
                .trim();
            }
          }
        }
        
        response = cleanResponse;
        cost = this.calculateOpenAICost(completion, routing.model);

      } else if (routing.provider === 'anthropic') {
        const completion = await anthropic.messages.create({
          model: routing.model,
          max_tokens: options.maxTokens || 1500,
          messages: [
            { role: "user", content: `${systemPrompt}\n\n${prompt}` }
          ],
          temperature: options.temperature || 0.7
        });

        const rawResponse = completion.content[0].type === 'text' ? completion.content[0].text : "";
        
        // Clean up response - remove JSON formatting if present
        let cleanResponse = rawResponse;
        if (rawResponse.includes('"therapeuticResponse":')) {
          try {
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              cleanResponse = parsed.therapeuticResponse || parsed.response || parsed.content || rawResponse;
            }
          } catch {
            // If JSON parsing fails, extract content after the colon
            const colonIndex = rawResponse.indexOf('"therapeuticResponse":');
            if (colonIndex !== -1) {
              cleanResponse = rawResponse.substring(colonIndex + '"therapeuticResponse":'.length)
                .replace(/^[\s"]+/, '')
                .replace(/["}]+$/, '')
                .trim();
            }
          }
        }
        
        response = cleanResponse;
        cost = this.calculateAnthropicCost(completion, routing.model);
      }

      return {
        content: response,
        metadata: {
          modelUsed: routing.model,
          provider: routing.provider,
          cost,
          processingTime: 0, // Will be set by caller
          fromCache: false,
          learningApplied: false,
          routingReason: routing.reasoning
        }
      };

    } catch (error) {
      console.error(`Error with ${routing.provider}:`, error);
      throw error;
    }
  }

  /**
   * Calculate OpenAI API costs
   */
  private calculateOpenAICost(completion: any, model: string): number {
    const promptTokens = completion.usage?.prompt_tokens || 0;
    const completionTokens = completion.usage?.completion_tokens || 0;
    
    if (model === 'gpt-4o') {
      return (promptTokens * 0.0000025) + (completionTokens * 0.00001);
    } else if (model === 'gpt-4o-mini') {
      return (promptTokens * 0.00000015) + (completionTokens * 0.0000006);
    }
    
    return 0.005; // Default estimate
  }

  /**
   * Calculate Anthropic API costs
   */
  private calculateAnthropicCost(completion: any, model: string): number {
    const inputTokens = completion.usage?.input_tokens || 0;
    const outputTokens = completion.usage?.output_tokens || 0;
    
    // Claude 3 Sonnet pricing
    return (inputTokens * 0.000003) + (outputTokens * 0.000015);
  }

  /**
   * Get routing statistics for analytics
   */
  async getRoutingStats(userId: string, timeframe: 'day' | 'week' | 'month' = 'week') {
    return await costOptimizer.getRoutingStats(userId, timeframe);
  }

  /**
   * Process coaching request - unified entry point for all coaching types
   */
  async processCoachingRequest(params: {
    userId: string;
    userInput: string;
    requestType: 'therapeutic_chat' | 'ai_coaching' | 'deep_journaling';
    threadId?: string;
    customizations?: any;
  }): Promise<AIResponse> {
    // Convert coaching request to AIRequest format
    const request: AIRequest = {
      prompt: params.userInput,
      systemPrompt: this.buildSystemPrompt(params.requestType, params.customizations),
      context: {
        userId: params.userId,
        sessionType: params.requestType === 'therapeutic_chat' ? 'therapeutic_chat' : 'ai_coaching',
        userTier: 'premium', // Default to premium for now
        therapeuticContext: {
          threadId: params.threadId,
          conversationStyle: params.customizations?.conversationStyle,
          focusArea: params.customizations?.focusArea,
          actionType: params.requestType,
          customizations: params.customizations
        }
      }
    };

    return await this.process(request);
  }

  private buildSystemPrompt(requestType: string, customizations?: any): string {
    switch (requestType) {
      case 'therapeutic_chat':
        return `You are an expert therapeutic AI with deep training in psychology, psychotherapy, and emotional intelligence. Your role is to provide sophisticated therapeutic responses that demonstrate genuine understanding and professional insight.

THERAPEUTIC APPROACH:
- Analyze the user's emotional state, underlying patterns, and core concerns
- Choose appropriate therapeutic techniques (CBT, psychodynamic, humanistic, etc.)
- Ask thoughtful questions that guide deeper self-exploration
- Provide meaningful insights that help users understand themselves better
- Always respond with depth, empathy, and professional therapeutic skill

RESPONSE STYLE: ${customizations?.conversationStyle || 'empathetic'}
FOCUS AREA: ${customizations?.focusArea || 'general'}

Analyze the user's input and craft a response that demonstrates deep understanding, provides therapeutic insight, and guides the conversation forward with purposeful questions.`;
      case 'deep_journaling':
        return `You are an AI journaling coach specializing in deep reflection and personal insight. Help users explore their thoughts and patterns through guided questions and analysis.`;
      default:
        return `You are a supportive AI life coach. Provide encouraging and practical guidance to help users achieve their goals.`;
    }
  }
}

export const intelligentRouter = new IntelligentRouter();