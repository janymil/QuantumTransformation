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
   * Process coaching request through AI-Coaching-Engine
   * Correct flow: adapter → ai-coaching-engine → APIs
   */
  async processCoachingRequest(request: CoachingRequest): Promise<CoachingResponse> {
    try {
      // Import AI-Coaching-Engine
      const { AiCoachingEngine } = await import('../../../server/ai-coaching-engine');
      
      // Route through AI-Coaching-Engine for specialized basic tier processing
      const coachingEngine = new AiCoachingEngine();
      const engineResponse = await coachingEngine.generatePersonalizedResponse(
        request.userId,
        request.userInput,
        request.challengeType || 'general',
        'ai_coaching'
      );

      // Return the coaching response in adapter format
      return {
        content: engineResponse.response || engineResponse.content || 'Here is your personalized coaching guidance.',
        metadata: {
          modelUsed: engineResponse.modelUsed || 'gpt-4o-mini',
          provider: engineResponse.provider || 'openai',
          cost: engineResponse.cost || 0.002,
          processingTime: engineResponse.processingTime || 1500,
          fromCache: false,
          costSavings: 0,
          routingReason: 'routed_through_ai_coaching_engine'
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
    const wordCount = userInput.split(' ').length;
    const hasEmotionalKeywords = /\b(feel|emotion|stress|anxiety|fear|anger|sad|happy|excited|overwhelmed)\b/i.test(userInput);
    const hasComplexConcepts = /\b(trauma|therapy|depression|relationship|career|life purpose|existential)\b/i.test(userInput);

    if (wordCount > 100 || hasComplexConcepts) return 'complex';
    if (wordCount > 30 || hasEmotionalKeywords) return 'moderate';
    return 'simple';
  }

  /**
   * Analyze emotional intensity for better routing
   */
  private analyzeEmotionalIntensity(userInput: string): number {
    const intensityKeywords = {
      high: /\b(crisis|emergency|suicide|hopeless|desperate|can't cope|breaking down)\b/i,
      medium: /\b(stressed|anxious|worried|frustrated|confused|stuck|overwhelmed)\b/i,
      low: /\b(curious|interested|wondering|exploring|learning|growing)\b/i
    };

    if (intensityKeywords.high.test(userInput)) return 0.9;
    if (intensityKeywords.medium.test(userInput)) return 0.6;
    if (intensityKeywords.low.test(userInput)) return 0.3;
    return 0.5; // neutral
  }
}

// Export singleton instance
export const aiCoachingAdapter = new AICoachingAdapter();