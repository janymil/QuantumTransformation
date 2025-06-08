/**
 * AI Coaching Adapter
 * Provides a simple interface for the ai-coaching system to use the AI Intelligence Layer
 * Proper flow: adapter → ai-coaching-engine → APIs
 */

import { intelligentRouter, AIRequest, AIResponse } from '../core/intelligent-router';
import { costOptimizer } from '../core/cost-optimizer';

export interface CoachingRequest {
  userId: string;
  userInput: string;
  systemPrompt: string;
  userTier: 'basic' | 'premium' | 'ultra';
  challengeType?: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
    preferredProvider?: 'openai' | 'anthropic' | 'local';
  };
}

export interface CoachingResponse {
  content: string;
  metadata: {
    modelUsed: string;
    provider: 'local' | 'openai' | 'anthropic';
    cost: number;
    processingTime: number;
    fromCache: boolean;
    costSavings: number;
    routingReason: string;
  };
}

export class AICoachingAdapter {

  /**
   * Process coaching request with intelligent routing and cost optimization
   */
  async processCoachingRequest(request: CoachingRequest): Promise<CoachingResponse> {
    try {
      // Convert to AI Intelligence Layer format
      const aiRequest: AIRequest = {
        prompt: request.userInput,
        systemPrompt: request.systemPrompt,
        context: {
          userId: request.userId,
          sessionType: 'ai_coaching',
          userTier: request.userTier,
          complexity: this.analyzeComplexity(request.userInput),
          emotionalIntensity: this.analyzeEmotionalIntensity(request.userInput),
          requiresPersonalization: request.userTier !== 'basic'
        },
        options: request.options
      };

      // Process through AI Intelligence Layer
      const aiResponse = await intelligentRouter.process(aiRequest);

      // Track usage for cost optimization
      await costOptimizer.trackUsage(request.userId, aiRequest, aiResponse);

      // Calculate cost savings
      const costSavings = aiResponse.metadata.fromCache ? 0.005 : 0; // Estimate average API cost saved

      return {
        content: aiResponse.content,
        metadata: {
          modelUsed: aiResponse.metadata.modelUsed,
          provider: aiResponse.metadata.provider,
          cost: aiResponse.metadata.cost,
          processingTime: aiResponse.metadata.processingTime,
          fromCache: aiResponse.metadata.fromCache,
          costSavings,
          routingReason: aiResponse.metadata.routingReason
        }
      };

    } catch (error) {
      console.error('AI Coaching Adapter error:', error);
      throw new Error('Failed to process coaching request');
    }
  }

  /**
   * Get coaching usage statistics
   */
  async getUsageStats(userId: string, timeframe: 'day' | 'week' | 'month' = 'week') {
    return await costOptimizer.getRoutingStats(userId, timeframe);
  }

  /**
   * Process multiple coaching requests efficiently
   */
  async batchProcessCoachingRequests(requests: CoachingRequest[]): Promise<CoachingResponse[]> {
    const promises = requests.map(request => this.processCoachingRequest(request));
    return await Promise.all(promises);
  }

  /**
   * Get coaching response with feedback integration
   */
  async processWithFeedback(
    request: CoachingRequest,
    previousFeedback?: { rating: number; wasHelpful: boolean }
  ): Promise<CoachingResponse> {
    const response = await this.processCoachingRequest(request);

    // If we have previous feedback, it helps the learning engine
    if (previousFeedback) {
      // The learning engine will use this for future improvements
      console.log('Previous feedback received:', previousFeedback);
    }

    return response;
  }

  /**
   * Analyze request complexity for routing optimization
   */
  private analyzeComplexity(userInput: string): 'simple' | 'moderate' | 'complex' {
    const length = userInput.length;
    const sentences = userInput.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    // Simple heuristics for complexity
    if (length < 100 && sentences <= 2) return 'simple';
    if (length > 400 || sentences > 5) return 'complex';
    return 'moderate';
  }

  /**
   * Analyze emotional intensity for better routing
   */
  private analyzeEmotionalIntensity(userInput: string): number {
    const emotionalWords = [
      'overwhelmed', 'anxious', 'stressed', 'depressed', 'angry', 'frustrated',
      'hopeless', 'scared', 'worried', 'panic', 'crisis', 'emergency',
      'desperate', 'exhausted', 'burnout', 'breakdown'
    ];

    const intensityWords = [
      'very', 'extremely', 'completely', 'totally', 'absolutely',
      'really', 'so', 'incredibly', 'unbearably'
    ];

    const input = userInput.toLowerCase();
    let intensity = 0.3; // Base intensity

    // Check for emotional words
    emotionalWords.forEach(word => {
      if (input.includes(word)) intensity += 0.1;
    });

    // Check for intensity amplifiers
    intensityWords.forEach(word => {
      if (input.includes(word)) intensity += 0.05;
    });

    // Check for caps (indicates strong emotion)
    const capsRatio = (userInput.match(/[A-Z]/g) || []).length / userInput.length;
    if (capsRatio > 0.3) intensity += 0.2;

    return Math.min(1.0, intensity);
  }

  /**
   * Get optimal model recommendation for coaching request
   */
  async getModelRecommendation(request: CoachingRequest): Promise<{
    recommendedProvider: 'local' | 'openai' | 'anthropic';
    estimatedCost: number;
    confidence: number;
    reasoning: string;
  }> {
    const aiRequest: AIRequest = {
      prompt: request.userInput,
      systemPrompt: request.systemPrompt,
      context: {
        userId: request.userId,
        sessionType: 'ai_coaching',
        userTier: request.userTier,
        complexity: this.analyzeComplexity(request.userInput),
        emotionalIntensity: this.analyzeEmotionalIntensity(request.userInput),
        requiresPersonalization: request.userTier !== 'basic'
      }
    };

    // Get routing decision without executing
    const router = intelligentRouter as any;
    const decision = await router.makeRoutingDecision(aiRequest);

    return {
      recommendedProvider: decision.provider,
      estimatedCost: decision.estimatedCost,
      confidence: decision.confidence,
      reasoning: decision.reasoning
    };
  }

  /**
   * Check if coaching request can be handled locally
   */
  async canHandleLocally(request: CoachingRequest): Promise<boolean> {
    const recommendation = await this.getModelRecommendation(request);
    return recommendation.recommendedProvider === 'local' && recommendation.confidence > 0.7;
  }
}

export const aiCoachingAdapter = new AICoachingAdapter();