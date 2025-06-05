import OpenAI from "openai";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";
import { journalEntries, aiResponseHistory, userProgress } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface EmotionalProfile {
  currentMood: 'elevated' | 'neutral' | 'challenged' | 'struggling';
  dominantEmotions: string[];
  emotionalTrends: {
    improving: boolean;
    stagnant: boolean;
    declining: boolean;
    breakthrough: boolean;
  };
  supportNeeds: string[];
  coachingAdjustments: {
    tone: 'encouraging' | 'gentle' | 'motivational' | 'supportive';
    intensity: 'light' | 'moderate' | 'intensive';
    focus: string[];
  };
}

export interface EmotionalInsight {
  insight: string;
  confidence: number;
  actionable: boolean;
  urgency: 'low' | 'medium' | 'high';
}

/**
 * Advanced Emotional Intelligence System for AI Coaching
 * Analyzes user emotional patterns and adapts coaching accordingly
 */
export class EmotionalIntelligenceEngine {

  /**
   * Analyze user's emotional state from journal entries and interactions
   */
  async analyzeEmotionalProfile(userId: string, challengeType: string): Promise<EmotionalProfile> {
    try {
      // Get recent journal entries (last 7 days)
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
        .limit(10);

      // Get recent AI interactions
      const recentInteractions = await db
        .select()
        .from(aiResponseHistory)
        .where(
          and(
            eq(aiResponseHistory.userId, userId),
            gte(aiResponseHistory.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          )
        )
        .orderBy(desc(aiResponseHistory.createdAt))
        .limit(5);

      // Combine text for emotional analysis
      const emotionalContent = [
        ...recentJournals.map(j => `${j.experience || ''} ${j.insights || ''} ${j.challenges || ''}`),
        ...recentInteractions.map(i => i.userInput)
      ].filter(Boolean).join(' ');

      if (!emotionalContent.trim()) {
        return this.getDefaultEmotionalProfile();
      }

      // Analyze emotional content using AI
      const emotionalAnalysis = await this.performEmotionalAnalysis(emotionalContent, challengeType);
      
      return emotionalAnalysis;

    } catch (error) {
      console.error("Error analyzing emotional profile:", error);
      return this.getDefaultEmotionalProfile();
    }
  }

  /**
   * Perform detailed emotional analysis using AI
   */
  private async performEmotionalAnalysis(content: string, challengeType: string): Promise<EmotionalProfile> {
    const systemPrompt = `You are an expert emotional intelligence analyst specializing in personal development and consciousness coaching. Analyze the provided user content for emotional patterns, mood trends, and coaching needs.

Focus on ${challengeType} specific emotional patterns:
- Money Blocks: Financial anxiety, scarcity fears, abundance blocks, money shame
- Quantum Consciousness: Resistance to change, limiting beliefs, elevated emotion challenges
- Relationships: Love barriers, intimacy fears, boundary issues, heart closure
- Health: Body disconnection, healing resistance, vitality blocks
- Career: Purpose confusion, success fears, creative blocks, confidence issues

Respond with precise JSON analysis including current mood, emotional trends, and specific coaching adjustments needed.`;

    const userPrompt = `Analyze this user's emotional content for coaching optimization:

${content}

Provide detailed emotional profile including:
1. Current mood state
2. Dominant emotions present
3. Emotional trend analysis (improving/declining/breakthrough moments)
4. Specific support needs
5. Coaching tone and intensity adjustments needed

Focus on actionable insights for personalized coaching adaptation.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        currentMood: analysis.currentMood || 'neutral',
        dominantEmotions: analysis.dominantEmotions || ['neutral'],
        emotionalTrends: {
          improving: analysis.emotionalTrends?.improving || false,
          stagnant: analysis.emotionalTrends?.stagnant || false,
          declining: analysis.emotionalTrends?.declining || false,
          breakthrough: analysis.emotionalTrends?.breakthrough || false
        },
        supportNeeds: analysis.supportNeeds || ['general encouragement'],
        coachingAdjustments: {
          tone: analysis.coachingAdjustments?.tone || 'encouraging',
          intensity: analysis.coachingAdjustments?.intensity || 'moderate',
          focus: analysis.coachingAdjustments?.focus || ['general progress']
        }
      };

    } catch (error) {
      console.error("Error in emotional analysis:", error);
      return this.getDefaultEmotionalProfile();
    }
  }

  /**
   * Generate emotionally intelligent coaching response
   */
  async generateEmotionallyAdaptedResponse(
    userId: string,
    query: string,
    challengeType: string,
    baseResponse: string
  ): Promise<string> {
    try {
      const emotionalProfile = await this.analyzeEmotionalProfile(userId, challengeType);
      
      const adaptationPrompt = `You are an emotionally intelligent AI coach. Adapt this base coaching response to match the user's current emotional state and needs.

USER'S EMOTIONAL PROFILE:
- Current Mood: ${emotionalProfile.currentMood}
- Dominant Emotions: ${emotionalProfile.dominantEmotions.join(', ')}
- Emotional Trends: ${JSON.stringify(emotionalProfile.emotionalTrends)}
- Support Needs: ${emotionalProfile.supportNeeds.join(', ')}
- Coaching Adjustments: Tone should be ${emotionalProfile.coachingAdjustments.tone}, Intensity: ${emotionalProfile.coachingAdjustments.intensity}

BASE RESPONSE TO ADAPT:
${baseResponse}

USER'S QUESTION:
${query}

Adapt the response to:
1. Match the recommended tone (${emotionalProfile.coachingAdjustments.tone})
2. Adjust intensity level (${emotionalProfile.coachingAdjustments.intensity})
3. Address their specific emotional needs
4. Acknowledge their current emotional state appropriately
5. Provide relevant emotional support while maintaining coaching value

Return the emotionally adapted response that feels personally supportive and appropriately calibrated to their emotional state.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: adaptationPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      return response.choices[0].message.content || baseResponse;

    } catch (error) {
      console.error("Error generating emotionally adapted response:", error);
      return baseResponse;
    }
  }

  /**
   * Identify breakthrough moments and emotional insights
   */
  async identifyEmotionalInsights(userId: string, challengeType: string): Promise<EmotionalInsight[]> {
    try {
      const emotionalProfile = await this.analyzeEmotionalProfile(userId, challengeType);
      
      const insights: EmotionalInsight[] = [];

      // Breakthrough detection
      if (emotionalProfile.emotionalTrends.breakthrough) {
        insights.push({
          insight: "You're experiencing an emotional breakthrough! This is an optimal time to deepen your practice and integrate new patterns.",
          confidence: 0.9,
          actionable: true,
          urgency: 'high'
        });
      }

      // Declining trend support
      if (emotionalProfile.emotionalTrends.declining) {
        insights.push({
          insight: "Your emotional patterns suggest you might benefit from gentler practices and additional support during this challenging period.",
          confidence: 0.8,
          actionable: true,
          urgency: 'medium'
        });
      }

      // Stagnation detection
      if (emotionalProfile.emotionalTrends.stagnant) {
        insights.push({
          insight: "Consider introducing new practices or increasing challenge intensity to break through current plateau patterns.",
          confidence: 0.7,
          actionable: true,
          urgency: 'medium'
        });
      }

      return insights;

    } catch (error) {
      console.error("Error identifying emotional insights:", error);
      return [];
    }
  }

  /**
   * Get default emotional profile for new users or errors
   */
  private getDefaultEmotionalProfile(): EmotionalProfile {
    return {
      currentMood: 'neutral',
      dominantEmotions: ['curious', 'hopeful'],
      emotionalTrends: {
        improving: false,
        stagnant: false,
        declining: false,
        breakthrough: false
      },
      supportNeeds: ['encouragement', 'guidance'],
      coachingAdjustments: {
        tone: 'encouraging',
        intensity: 'moderate',
        focus: ['foundation building', 'consistency']
      }
    };
  }

  /**
   * Track emotional evolution over time
   */
  async trackEmotionalEvolution(userId: string, days: number = 30): Promise<{
    emotionalJourney: string;
    keyMilestones: string[];
    recommendedFocus: string[];
  }> {
    try {
      // Get historical journal entries
      const historicalJournals = await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.userId, userId),
            gte(journalEntries.createdAt, new Date(Date.now() - days * 24 * 60 * 60 * 1000))
          )
        )
        .orderBy(journalEntries.createdAt);

      if (historicalJournals.length < 3) {
        return {
          emotionalJourney: "Emotional journey tracking requires more journal entries for meaningful analysis.",
          keyMilestones: [],
          recommendedFocus: ['consistent journaling', 'emotional awareness']
        };
      }

      // Analyze emotional evolution
      const journalContent = historicalJournals.map(j => 
        `Day ${j.day}: ${j.experience || ''} ${j.insights || ''} ${j.challenges || ''}`
      ).join('\n');

      const evolutionPrompt = `Analyze this user's emotional evolution over time and identify key patterns, milestones, and growth areas:

${journalContent}

Provide:
1. Brief emotional journey summary
2. Key emotional milestones and breakthroughs
3. Recommended areas of focus for continued growth

Focus on growth patterns, emotional maturity development, and breakthrough moments.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: evolutionPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 800
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        emotionalJourney: analysis.emotionalJourney || "Emotional growth journey in progress.",
        keyMilestones: analysis.keyMilestones || [],
        recommendedFocus: analysis.recommendedFocus || ['continued practice']
      };

    } catch (error) {
      console.error("Error tracking emotional evolution:", error);
      return {
        emotionalJourney: "Unable to analyze emotional evolution at this time.",
        keyMilestones: [],
        recommendedFocus: ['continued practice', 'consistent journaling']
      };
    }
  }
}

// Global instance
export const emotionalIntelligence = new EmotionalIntelligenceEngine();