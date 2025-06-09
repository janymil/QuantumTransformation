/**
 * Learning Engine for AI Intelligence Layer
 * Handles continuous learning from user interactions and feedback
 */

import { db } from "../../../server/db";
import { aiLearningData, aiResponseCache } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { AIRequest, AIResponse } from './intelligent-router';

export interface LearningData {
  userId: string;
  requestType: string;
  userInput: string;
  systemPrompt: string;
  aiResponse: string;
  userFeedback: number | null; // 1-5 rating
  wasSuccessful: boolean;
  learningPoints: string[];
  timestamp: Date;
}

export interface PatternInsight {
  pattern: string;
  frequency: number;
  successRate: number;
  averageFeedback: number;
  recommendedActions: string[];
}

export class LearningEngine {

  /**
   * Learn from a successful AI interaction
   */
  async learn(request: AIRequest, response: AIResponse): Promise<void> {
    try {
      const learningData: LearningData = {
        userId: request.context.userId,
        requestType: `${request.context.sessionType}_${request.context.userTier}`,
        userInput: request.prompt,
        systemPrompt: request.systemPrompt,
        aiResponse: response.content,
        userFeedback: null, // Will be updated when user provides feedback
        wasSuccessful: true, // Assume successful until feedback indicates otherwise
        learningPoints: this.extractLearningPoints(request, response),
        timestamp: new Date()
      };

      await this.storeLearningData(learningData);
      await this.updatePatternRecognition(request, response);

    } catch (error) {
      console.error('Learning engine error:', error);
    }
  }

  /**
   * Update learning data with user feedback
   */
  async processFeedback(
    userId: string,
    inputHash: string,
    feedback: number,
    wasHelpful: boolean
  ): Promise<void> {
    try {
      // Update learning data with feedback
      await db.update(aiLearningData)
        .set({
          userFeedback: feedback,
          wasSuccessful: wasHelpful,
          updatedAt: new Date()
        })
        .where(and(
          eq(aiLearningData.userId, userId),
          eq(aiLearningData.inputHash, inputHash)
        ));

      // If feedback is negative, learn from the failure
      if (!wasHelpful || feedback < 3) {
        await this.learnFromFailure(userId, inputHash, feedback);
      }

    } catch (error) {
      console.error('Feedback processing error:', error);
    }
  }

  /**
   * Get pattern insights for improving responses
   */
  async getPatternInsights(
    sessionType: 'ai_coaching' | 'therapeutic_chat',
    timeframeDays: number = 30
  ): Promise<PatternInsight[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframeDays);

      const learningData = await db.select()
        .from(aiLearningData)
        .where(and(
          sql`${aiLearningData.requestType} LIKE ${sessionType + '%'}`,
          sql`${aiLearningData.createdAt} >= ${startDate}`
        ))
        .orderBy(desc(aiLearningData.createdAt));

      // Analyze patterns
      const patterns = new Map<string, {
        frequency: number;
        totalFeedback: number;
        feedbackCount: number;
        successCount: number;
      }>();

      learningData.forEach(data => {
        const pattern = this.identifyPattern(data.userInput);
        if (!patterns.has(pattern)) {
          patterns.set(pattern, {
            frequency: 0,
            totalFeedback: 0,
            feedbackCount: 0,
            successCount: 0
          });
        }

        const patternData = patterns.get(pattern)!;
        patternData.frequency++;
        
        if (data.userFeedback) {
          patternData.totalFeedback += data.userFeedback;
          patternData.feedbackCount++;
        }
        
        if (data.wasSuccessful) {
          patternData.successCount++;
        }
      });

      // Convert to insights
      const insights: PatternInsight[] = [];
      patterns.forEach((data, pattern) => {
        const averageFeedback = data.feedbackCount > 0 ? data.totalFeedback / data.feedbackCount : 0;
        const successRate = data.frequency > 0 ? (data.successCount / data.frequency) * 100 : 0;

        insights.push({
          pattern,
          frequency: data.frequency,
          successRate,
          averageFeedback,
          recommendedActions: this.generateRecommendations(pattern, successRate, averageFeedback)
        });
      });

      return insights.sort((a, b) => b.frequency - a.frequency);

    } catch (error) {
      console.error('Error getting pattern insights:', error);
      return [];
    }
  }

  /**
   * Get personalized learning insights for a user
   */
  async getPersonalizedInsights(userId: string): Promise<{
    preferredResponseStyle: string;
    effectivePatterns: string[];
    improvementAreas: string[];
    learningProgress: number; // 0-100 score
  }> {
    try {
      const userLearningData = await db.select()
        .from(aiLearningData)
        .where(eq(aiLearningData.userId, userId))
        .orderBy(desc(aiLearningData.createdAt))
        .limit(100);

      if (userLearningData.length === 0) {
        return {
          preferredResponseStyle: 'balanced',
          effectivePatterns: [],
          improvementAreas: ['More interactions needed for personalization'],
          learningProgress: 0
        };
      }

      // Analyze user preferences
      const highRatedResponses = userLearningData.filter(d => d.userFeedback && d.userFeedback >= 4);
      const lowRatedResponses = userLearningData.filter(d => d.userFeedback && d.userFeedback <= 2);

      const preferredResponseStyle = this.determinePreferredStyle(highRatedResponses);
      const effectivePatterns = this.identifyEffectivePatterns(highRatedResponses);
      const improvementAreas = this.identifyImprovementAreas(lowRatedResponses);

      // Calculate learning progress based on feedback trends
      const recentFeedback = userLearningData
        .filter(d => d.userFeedback)
        .slice(0, 20)
        .map(d => d.userFeedback!);
      
      const learningProgress = recentFeedback.length > 0 
        ? (recentFeedback.reduce((sum, rating) => sum + rating, 0) / recentFeedback.length) * 20 // Convert 1-5 to 0-100
        : 0;

      return {
        preferredResponseStyle,
        effectivePatterns,
        improvementAreas,
        learningProgress
      };

    } catch (error) {
      console.error('Error getting personalized insights:', error);
      return {
        preferredResponseStyle: 'balanced',
        effectivePatterns: [],
        improvementAreas: ['Analysis unavailable'],
        learningProgress: 0
      };
    }
  }

  /**
   * Extract learning points from request and response
   */
  private extractLearningPoints(request: AIRequest, response: AIResponse): string[] {
    const learningPoints: string[] = [];

    // Analyze request characteristics
    if (request.context.emotionalIntensity && request.context.emotionalIntensity > 0.7) {
      learningPoints.push('High emotional intensity detected');
    }

    if (request.prompt.length > 500) {
      learningPoints.push('Complex multi-part query');
    }

    // Analyze response characteristics
    if (response.metadata.provider === 'local') {
      learningPoints.push('Local model successful');
    }

    if (response.metadata.fromCache) {
      learningPoints.push('Cache hit - pattern recognized');
    }

    if (response.metadata.cost === 0) {
      learningPoints.push('Zero cost response achieved');
    }

    return learningPoints;
  }

  /**
   * Store learning data for future analysis
   */
  private async storeLearningData(data: LearningData): Promise<void> {
    try {
      const inputHash = this.generateInputHash(data.userInput, data.systemPrompt);

      await db.insert(aiLearningData).values({
        userId: data.userId,
        requestType: data.requestType,
        inputHash,
        userInput: data.userInput,
        systemPrompt: data.systemPrompt,
        aiResponse: data.aiResponse,
        userFeedback: data.userFeedback,
        wasSuccessful: data.wasSuccessful,
        learningPoints: JSON.stringify(data.learningPoints),
        createdAt: data.timestamp,
        updatedAt: data.timestamp
      }).onConflictDoUpdate({
        target: [aiLearningData.inputHash, aiLearningData.userId],
        set: {
          aiResponse: data.aiResponse,
          learningPoints: JSON.stringify(data.learningPoints),
          updatedAt: data.timestamp
        }
      });

    } catch (error) {
      console.error('Error storing learning data:', error);
    }
  }

  /**
   * Update pattern recognition database
   */
  private async updatePatternRecognition(request: AIRequest, response: AIResponse): Promise<void> {
    // This would update a pattern recognition database
    // For now, we'll just log the pattern
    const pattern = this.identifyPattern(request.prompt);
    console.log('Pattern recognized:', pattern, 'Provider:', response.metadata.provider);
  }

  /**
   * Learn from failed interactions
   */
  private async learnFromFailure(userId: string, inputHash: string, feedback: number): Promise<void> {
    try {
      // Mark patterns that led to poor feedback for improvement
      console.log('Learning from failure:', { userId, inputHash, feedback });
      
      // In production, this would:
      // 1. Identify what went wrong
      // 2. Update routing preferences
      // 3. Flag for human review if needed
      // 4. Adjust local model training

    } catch (error) {
      console.error('Error learning from failure:', error);
    }
  }

  /**
   * Identify patterns in user input
   */
  private identifyPattern(userInput: string): string {
    const input = userInput.toLowerCase();

    if (input.includes('anxiety') || input.includes('anxious') || input.includes('worry')) {
      return 'anxiety_support';
    }
    if (input.includes('depression') || input.includes('sad') || input.includes('hopeless')) {
      return 'depression_support';
    }
    if (input.includes('stress') || input.includes('overwhelmed') || input.includes('pressure')) {
      return 'stress_management';
    }
    if (input.includes('relationship') || input.includes('partner') || input.includes('family')) {
      return 'relationship_issues';
    }
    if (input.includes('work') || input.includes('job') || input.includes('career')) {
      return 'work_related';
    }
    if (input.includes('goal') || input.includes('motivation') || input.includes('achievement')) {
      return 'goal_setting';
    }
    if (input.includes('confidence') || input.includes('self-esteem') || input.includes('worth')) {
      return 'self_confidence';
    }

    return 'general_support';
  }

  /**
   * Generate recommendations based on pattern analysis
   */
  private generateRecommendations(
    pattern: string,
    successRate: number,
    averageFeedback: number
  ): string[] {
    const recommendations: string[] = [];

    if (successRate < 70) {
      recommendations.push(`Improve ${pattern} responses - current success rate: ${successRate.toFixed(1)}%`);
    }

    if (averageFeedback < 3.5) {
      recommendations.push(`Enhance response quality for ${pattern} - current rating: ${averageFeedback.toFixed(1)}/5`);
    }

    if (successRate > 85 && averageFeedback > 4.0) {
      recommendations.push(`${pattern} responses performing well - consider using local model more often`);
    }

    return recommendations;
  }

  /**
   * Determine user's preferred response style
   */
  private determinePreferredStyle(highRatedResponses: any[]): string {
    // Analyze characteristics of high-rated responses
    // This is simplified - in production would use more sophisticated analysis
    
    if (highRatedResponses.length === 0) return 'balanced';

    const styles = {
      direct: 0,
      empathetic: 0,
      analytical: 0,
      supportive: 0
    };

    highRatedResponses.forEach(response => {
      const content = response.aiResponse.toLowerCase();
      if (content.includes('specific') || content.includes('actionable')) styles.direct++;
      if (content.includes('understand') || content.includes('feel')) styles.empathetic++;
      if (content.includes('analyze') || content.includes('consider')) styles.analytical++;
      if (content.includes('support') || content.includes('here for you')) styles.supportive++;
    });

    const maxStyle = Object.entries(styles).reduce((a, b) => styles[a[0]] > styles[b[0]] ? a : b);
    return maxStyle[0];
  }

  /**
   * Identify effective patterns for user
   */
  private identifyEffectivePatterns(highRatedResponses: any[]): string[] {
    const patterns = new Map<string, number>();
    
    highRatedResponses.forEach(response => {
      const pattern = this.identifyPattern(response.userInput);
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    });

    return Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern]) => pattern);
  }

  /**
   * Identify areas for improvement
   */
  private identifyImprovementAreas(lowRatedResponses: any[]): string[] {
    const issues = new Map<string, number>();
    
    lowRatedResponses.forEach(response => {
      const pattern = this.identifyPattern(response.userInput);
      issues.set(pattern, (issues.get(pattern) || 0) + 1);
    });

    return Array.from(issues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([issue]) => `Improve responses for ${issue}`);
  }

  /**
   * Generate hash for input
   */
  private generateInputHash(userInput: string, systemPrompt: string): string {
    // Simple hash generation without crypto module
    let hash = 0;
    const str = userInput + systemPrompt;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

export const learningEngine = new LearningEngine();