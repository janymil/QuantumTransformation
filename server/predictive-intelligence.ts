import OpenAI from "openai";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { journalEntries, aiResponseHistory, userProgress } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface PredictiveInsight {
  type: 'completion_risk' | 'breakthrough_opportunity' | 'optimal_timing' | 'support_needed';
  prediction: string;
  confidence: number;
  timeframe: string;
  actionable: boolean;
  recommendedActions: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UserBehaviorPattern {
  engagementTrend: 'increasing' | 'stable' | 'declining';
  optimalInteractionTimes: string[];
  preferredCoachingStyle: string;
  motivationCycles: string[];
  resistancePatterns: string[];
  breakthroughPredictors: string[];
}

export interface CompletionForecast {
  likelihood: number;
  riskFactors: string[];
  supportStrategies: string[];
  interventionTiming: string[];
  motivationBoosts: string[];
}

/**
 * Predictive Coaching Intelligence System
 * Analyzes patterns to predict user needs and optimize coaching timing
 */
export class PredictiveIntelligenceEngine {

  /**
   * Analyze user behavior patterns for predictive insights
   */
  async analyzeBehaviorPatterns(userId: string, challengeType: string): Promise<UserBehaviorPattern> {
    try {
      // Get historical data for pattern analysis
      const journalHistory = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(journalEntries.createdAt);

      const interactionHistory = await db
        .select()
        .from(aiResponseHistory)
        .where(eq(aiResponseHistory.userId, userId))
        .orderBy(aiResponseHistory.createdAt);

      const progressData = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));

      if (journalHistory.length < 3) {
        return this.getDefaultBehaviorPattern();
      }

      // Analyze patterns using AI
      const behaviorContent = [
        ...journalHistory.map(j => `Day ${j.day}: ${j.experience || ''} ${j.insights || ''} ${j.challenges || ''} (${j.createdAt?.toISOString()})`),
        ...interactionHistory.map(i => `Session: ${i.sessionType} at ${i.createdAt?.toISOString()} - Input: ${i.userInput}`),
        ...progressData.map(p => `Progress: Day ${p.currentDay}, Streak: ${p.streakCount}, Last active: ${p.updatedAt?.toISOString()}`)
      ].join('\n');

      const patternPrompt = `Analyze this user's behavioral patterns for predictive coaching insights:

${behaviorContent}

Extract patterns for:
1. Engagement trends (increasing/stable/declining activity)
2. Optimal interaction times (when user is most active/receptive)
3. Preferred coaching style (what approach works best)
4. Motivation cycles (when motivation peaks and dips)
5. Resistance patterns (what causes difficulty or avoidance)
6. Breakthrough predictors (conditions that lead to progress)

Focus on temporal patterns, emotional cycles, and coaching responsiveness.

Respond with detailed JSON analysis.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: patternPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        engagementTrend: analysis.engagementTrend || 'stable',
        optimalInteractionTimes: analysis.optimalInteractionTimes || ['morning'],
        preferredCoachingStyle: analysis.preferredCoachingStyle || 'encouraging',
        motivationCycles: analysis.motivationCycles || ['weekly peaks'],
        resistancePatterns: analysis.resistancePatterns || ['weekend drops'],
        breakthroughPredictors: analysis.breakthroughPredictors || ['consistent practice']
      };

    } catch (error) {
      console.error("Error analyzing behavior patterns:", error);
      return this.getDefaultBehaviorPattern();
    }
  }

  /**
   * Predict completion likelihood and risk factors
   */
  async predictCompletionLikelihood(userId: string, challengeType: string): Promise<CompletionForecast> {
    try {
      const behaviorPatterns = await this.analyzeBehaviorPatterns(userId, challengeType);
      
      // Get current progress data
      const [currentProgress] = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId))
        .limit(1);

      if (!currentProgress) {
        return this.getDefaultCompletionForecast();
      }

      const currentDay = currentProgress.currentDay || 1;
      const completedDays = (currentProgress.completedDays as number[])?.length || 0;
      const streakCount = currentProgress.streakCount || 0;
      const completionRate = completedDays / currentDay;

      // Get recent journal entries for sentiment analysis
      const recentJournals = await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.userId, userId),
            gte(journalEntries.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          )
        )
        .orderBy(desc(journalEntries.createdAt))
        .limit(5);

      const predictionPrompt = `Predict completion likelihood and recommend interventions based on this user data:

CURRENT PROGRESS:
- Day: ${currentDay}/30
- Completion Rate: ${Math.round(completionRate * 100)}%
- Current Streak: ${streakCount} days
- Challenge Type: ${challengeType}

BEHAVIOR PATTERNS:
- Engagement Trend: ${behaviorPatterns.engagementTrend}
- Preferred Style: ${behaviorPatterns.preferredCoachingStyle}
- Resistance Patterns: ${behaviorPatterns.resistancePatterns.join(', ')}
- Motivation Cycles: ${behaviorPatterns.motivationCycles.join(', ')}

RECENT JOURNAL INSIGHTS:
${recentJournals.map(j => `Day ${j.day}: ${j.insights || 'No insights'} (Challenges: ${j.challenges || 'None'})`).join('\n')}

Predict:
1. Completion likelihood (0-100%)
2. Primary risk factors for non-completion
3. Recommended support strategies
4. Optimal intervention timing
5. Motivation boost recommendations

Consider challenge-specific factors for ${challengeType}.

Respond with detailed JSON forecast.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: predictionPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800
      });

      const forecast = JSON.parse(response.choices[0].message.content || '{}');

      return {
        likelihood: forecast.likelihood || 70,
        riskFactors: forecast.riskFactors || ['consistency challenges'],
        supportStrategies: forecast.supportStrategies || ['daily check-ins'],
        interventionTiming: forecast.interventionTiming || ['mid-week support'],
        motivationBoosts: forecast.motivationBoosts || ['progress celebration']
      };

    } catch (error) {
      console.error("Error predicting completion:", error);
      return this.getDefaultCompletionForecast();
    }
  }

  /**
   * Generate predictive coaching insights
   */
  async generatePredictiveInsights(userId: string, challengeType: string): Promise<PredictiveInsight[]> {
    try {
      const behaviorPatterns = await this.analyzeBehaviorPatterns(userId, challengeType);
      const completionForecast = await this.predictCompletionLikelihood(userId, challengeType);

      const insights: PredictiveInsight[] = [];

      // Completion risk insight
      if (completionForecast.likelihood < 60) {
        insights.push({
          type: 'completion_risk',
          prediction: `Completion likelihood is ${completionForecast.likelihood}%. User may need additional support to maintain momentum.`,
          confidence: 0.8,
          timeframe: 'next 7 days',
          actionable: true,
          recommendedActions: completionForecast.supportStrategies,
          priority: completionForecast.likelihood < 40 ? 'urgent' : 'high'
        });
      }

      // Breakthrough opportunity
      if (behaviorPatterns.engagementTrend === 'increasing' && completionForecast.likelihood > 70) {
        insights.push({
          type: 'breakthrough_opportunity',
          prediction: 'User shows increasing engagement and high completion likelihood. Optimal time for deeper practices.',
          confidence: 0.9,
          timeframe: 'next 3 days',
          actionable: true,
          recommendedActions: ['Introduce advanced techniques', 'Increase practice intensity', 'Explore deeper insights'],
          priority: 'high'
        });
      }

      // Support needed prediction
      if (behaviorPatterns.resistancePatterns.length > 0) {
        insights.push({
          type: 'support_needed',
          prediction: `User shows resistance patterns: ${behaviorPatterns.resistancePatterns.join(', ')}. Proactive support recommended.`,
          confidence: 0.7,
          timeframe: 'ongoing',
          actionable: true,
          recommendedActions: ['Gentle encouragement', 'Address resistance directly', 'Modify approach'],
          priority: 'medium'
        });
      }

      // Optimal timing insight
      if (behaviorPatterns.optimalInteractionTimes.length > 0) {
        insights.push({
          type: 'optimal_timing',
          prediction: `User is most receptive during: ${behaviorPatterns.optimalInteractionTimes.join(', ')}`,
          confidence: 0.8,
          timeframe: 'daily pattern',
          actionable: true,
          recommendedActions: ['Schedule coaching at optimal times', 'Send reminders accordingly'],
          priority: 'medium'
        });
      }

      return insights;

    } catch (error) {
      console.error("Error generating predictive insights:", error);
      return [];
    }
  }

  /**
   * Determine optimal coaching intervention timing
   */
  async determineOptimalTiming(userId: string, challengeType: string): Promise<{
    bestTimeForIntervention: string;
    interventionType: string;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const behaviorPatterns = await this.analyzeBehaviorPatterns(userId, challengeType);
      const insights = await this.generatePredictiveInsights(userId, challengeType);

      // Analyze when user needs support most
      const timingPrompt = `Based on user behavior patterns and predictive insights, determine optimal coaching intervention timing:

BEHAVIOR PATTERNS:
- Engagement Trend: ${behaviorPatterns.engagementTrend}
- Optimal Times: ${behaviorPatterns.optimalInteractionTimes.join(', ')}
- Motivation Cycles: ${behaviorPatterns.motivationCycles.join(', ')}
- Resistance Patterns: ${behaviorPatterns.resistancePatterns.join(', ')}

PREDICTIVE INSIGHTS:
${insights.map(i => `${i.type}: ${i.prediction} (Priority: ${i.priority})`).join('\n')}

Determine:
1. Best time for next coaching intervention
2. Type of intervention needed (encouragement, challenge, guidance, etc.)
3. Confidence in timing recommendation
4. Reasoning for recommendation

Focus on maximizing impact and user receptiveness.

Respond with JSON recommendation.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: timingPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500
      });

      const timing = JSON.parse(response.choices[0].message.content || '{}');

      return {
        bestTimeForIntervention: timing.bestTime || 'within 24 hours',
        interventionType: timing.interventionType || 'encouragement',
        confidence: timing.confidence || 0.7,
        reasoning: timing.reasoning || 'Based on user engagement patterns'
      };

    } catch (error) {
      console.error("Error determining optimal timing:", error);
      return {
        bestTimeForIntervention: 'within 24 hours',
        interventionType: 'general support',
        confidence: 0.5,
        reasoning: 'Default recommendation due to analysis error'
      };
    }
  }

  /**
   * Generate proactive coaching message based on predictions
   */
  async generateProactiveMessage(userId: string, challengeType: string): Promise<string> {
    try {
      const insights = await this.generatePredictiveInsights(userId, challengeType);
      const timing = await this.determineOptimalTiming(userId, challengeType);
      const forecast = await this.predictCompletionLikelihood(userId, challengeType);

      const messagePrompt = `Generate a proactive coaching message based on predictive analysis:

COMPLETION FORECAST: ${forecast.likelihood}% likelihood
OPTIMAL TIMING: ${timing.bestTimeForIntervention} (${timing.interventionType})
REASONING: ${timing.reasoning}

KEY INSIGHTS:
${insights.map(i => `- ${i.prediction} (${i.priority} priority)`).join('\n')}

RECOMMENDED ACTIONS:
${insights.flatMap(i => i.recommendedActions).join('\n- ')}

Create a personalized, proactive coaching message that:
1. Acknowledges their current journey and progress
2. Addresses predicted needs before they become problems
3. Provides specific, actionable guidance
4. Maintains motivation and momentum
5. Uses appropriate tone for ${challengeType} challenge

Keep the message encouraging, specific, and forward-looking.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: messagePrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      return response.choices[0].message.content || "Continue with your amazing progress! I'm here to support your transformation journey.";

    } catch (error) {
      console.error("Error generating proactive message:", error);
      return "I'm here to support your transformation journey. Keep moving forward with your practice.";
    }
  }

  private getDefaultBehaviorPattern(): UserBehaviorPattern {
    return {
      engagementTrend: 'stable',
      optimalInteractionTimes: ['morning', 'evening'],
      preferredCoachingStyle: 'encouraging',
      motivationCycles: ['weekly peaks'],
      resistancePatterns: ['weekend drops'],
      breakthroughPredictors: ['consistent practice', 'regular journaling']
    };
  }

  private getDefaultCompletionForecast(): CompletionForecast {
    return {
      likelihood: 70,
      riskFactors: ['consistency challenges', 'motivation fluctuations'],
      supportStrategies: ['daily check-ins', 'progress celebration', 'gentle reminders'],
      interventionTiming: ['mid-week support', 'weekend motivation'],
      motivationBoosts: ['progress recognition', 'technique variety', 'community connection']
    };
  }
}

// Global instance
export const predictiveIntelligence = new PredictiveIntelligenceEngine();