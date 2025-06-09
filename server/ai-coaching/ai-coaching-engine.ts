/**
 * AI Coaching Engine - Basic Tier System
 * Uses intelligent GPT-4o/GPT-4o-mini routing for cost optimization
 * Enhanced with research integration and self-learning capabilities
 */

import { IntelligentModelRouter } from './intelligent-model-router';
import { unifiedResearchIntegration } from '../unified-research-integration';
import { db } from '../db';
import { eq, desc } from 'drizzle-orm';
import { aiResponseHistory } from '@shared/schema';

export class AiCoachingEngine {
  private modelRouter = new IntelligentModelRouter();

  /**
   * Generate personalized coaching response with intelligent GPT-4o/GPT-4o-mini routing
   */
  async generatePersonalizedResponse(
    userId: string,
    userInput: string,
    context: string = '',
    sessionType: string = 'general'
  ): Promise<any> {
    
    // Enhanced coaching prompt for basic tier
    const systemPrompt = `You are an AI Coaching Assistant providing practical, actionable guidance. Focus on:

CORE COACHING PRINCIPLES:
- Goal-oriented guidance and accountability
- Practical techniques for daily challenges
- Motivational support and encouragement
- Simple, actionable steps for improvement
- Progress tracking and celebration
- Building healthy habits and routines

APPROACH:
- Keep responses practical and implementable
- Provide specific, actionable advice
- Maintain an encouraging, supportive tone
- Focus on incremental progress
- Offer concrete next steps

Respond with empathy while maintaining focus on practical solutions and forward momentum.`;

    const prompt = `${systemPrompt}

USER CONTEXT: ${context}
SESSION TYPE: ${sessionType}
USER INPUT: ${userInput}

Provide practical coaching guidance that helps the user take concrete steps toward their goals. Include specific actions they can take today.`;

    try {
      // Direct AI coaching without intelligence layer
      const routedResponse = await this.modelRouter.executeWithOptimalModel(
        prompt,
        systemPrompt,
        userInput,
        sessionType,
        'general',
        'basic',
        { temperature: 0.7, maxTokens: 1500 }
      );

      const result = {
        response: routedResponse.response,
        type: 'ai_coaching',
        tier: 'basic',
        timestamp: new Date().toISOString(),
        sessionType,
        modelUsed: routedResponse.modelUsed,
        cost: routedResponse.actualCost || 0.002,
        routingDecision: routedResponse.routingDecision,
        emotional_tone: this.detectEmotionalTone(userInput),
        coaching_focus: this.detectCoachingFocus(userInput),
        action_items: this.extractActionItems(routedResponse.response)
      };

      // Store session data for learning
      await this.storeSession(userId, userInput, result);

      return result;

    } catch (error) {
      console.error('AI Coaching Engine Error:', error);
      
      // Fallback response
      return {
        response: "I'm here to help you achieve your goals. Could you tell me more about what specific area you'd like to focus on today?",
        type: 'ai_coaching',
        tier: 'basic',
        timestamp: new Date().toISOString(),
        sessionType,
        modelUsed: 'fallback',
        cost: 0,
        error: true
      };
    }
  }

  /**
   * Generate daily coaching check-in
   */
  async generateDailyCheckIn(userId: string, currentDay: number, challengeType?: string): Promise<any> {
    const userInput = `Daily check-in for day ${currentDay}${challengeType ? ` of ${challengeType} challenge` : ''}. How can I stay motivated and on track today?`;
    
    return this.generatePersonalizedResponse(
      userId,
      userInput,
      `Daily coaching session focusing on motivation and progress tracking`,
      'daily_checkin'
    );
  }

  /**
   * Generate goal-setting guidance
   */
  async generateGoalGuidance(userId: string, goals: string[], timeframe: string): Promise<any> {
    const userInput = `Help me create an action plan for my goals: ${goals.join(', ')}. Timeframe: ${timeframe}`;
    
    return this.generatePersonalizedResponse(
      userId,
      userInput,
      `Goal-setting session focusing on creating actionable plans`,
      'goal_setting'
    );
  }

  /**
   * Generate accountability check
   */
  async generateAccountabilityCheck(userId: string, previousCommitments: string[]): Promise<any> {
    const userInput = `Accountability check-in. Previous commitments: ${previousCommitments.join(', ')}. Help me assess progress and plan next steps.`;
    
    return this.generatePersonalizedResponse(
      userId,
      userInput,
      `Accountability session focusing on progress review and forward planning`,
      'accountability'
    );
  }

  /**
   * Helper: Detect emotional tone
   */
  private detectEmotionalTone(input: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('excited') || lowerInput.includes('motivated') || lowerInput.includes('energized')) {
      return 'enthusiastic';
    } else if (lowerInput.includes('stuck') || lowerInput.includes('frustrated') || lowerInput.includes('overwhelmed')) {
      return 'challenged';
    } else if (lowerInput.includes('confident') || lowerInput.includes('ready') || lowerInput.includes('determined')) {
      return 'determined';
    } else if (lowerInput.includes('unsure') || lowerInput.includes('confused') || lowerInput.includes('lost')) {
      return 'uncertain';
    }
    
    return 'neutral';
  }

  /**
   * Helper: Detect coaching focus area
   */
  private detectCoachingFocus(input: string): string[] {
    const focuses = [];
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('goal') || lowerInput.includes('target') || lowerInput.includes('objective')) {
      focuses.push('goal_setting');
    }
    if (lowerInput.includes('habit') || lowerInput.includes('routine') || lowerInput.includes('daily')) {
      focuses.push('habit_building');
    }
    if (lowerInput.includes('motivation') || lowerInput.includes('drive') || lowerInput.includes('inspiration')) {
      focuses.push('motivation');
    }
    if (lowerInput.includes('productivity') || lowerInput.includes('efficiency') || lowerInput.includes('time')) {
      focuses.push('productivity');
    }
    if (lowerInput.includes('career') || lowerInput.includes('work') || lowerInput.includes('professional')) {
      focuses.push('career');
    }
    if (lowerInput.includes('relationship') || lowerInput.includes('communication') || lowerInput.includes('social')) {
      focuses.push('relationships');
    }
    
    return focuses.length > 0 ? focuses : ['general_coaching'];
  }

  /**
   * Helper: Extract action items from response
   */
  private extractActionItems(response: string): string[] {
    const actionItems = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.trim().match(/^[\d\-\*•].+/) || 
          line.toLowerCase().includes('action:') ||
          line.toLowerCase().includes('step:') ||
          line.toLowerCase().includes('try:')) {
        actionItems.push(line.trim());
      }
    }
    
    return actionItems.slice(0, 5); // Limit to 5 action items
  }

  /**
   * Store session for learning and improvement
   */
  private async storeSession(userId: string, userInput: string, result: any): Promise<void> {
    try {
      await db.insert(aiResponseHistory).values({
        userId,
        sessionType: result.sessionType,
        userInput,
        aiResponse: result,
        challengeType: result.coaching_focus?.[0] || 'general',
        day: 1,
        tags: ['ai_coaching', 'basic_tier', result.sessionType, ...(result.coaching_focus || [])]
      });
    } catch (error) {
      console.error('Error storing coaching session:', error);
    }
  }
}

export const aiCoachingEngine = new AiCoachingEngine();