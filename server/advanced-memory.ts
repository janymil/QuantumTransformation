import OpenAI from "openai";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { journalEntries, aiResponseHistory, userProgress } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface MemoryInsight {
  id: string;
  type: 'breakthrough' | 'pattern' | 'resistance' | 'success' | 'struggle';
  content: string;
  relevanceScore: number;
  lastAccessed: Date;
  importance: 'low' | 'medium' | 'high' | 'critical';
  associatedChallenges: string[];
  emotionalContext: string;
}

export interface ConversationMemory {
  sessionId: string;
  keyInsights: string[];
  userGoals: string[];
  challengesDiscussed: string[];
  breakthroughMoments: string[];
  emotionalState: string;
  coachingApproach: string;
  followUpNeeded: boolean;
}

export interface LongTermMemory {
  userId: string;
  coreBeliefs: string[];
  transformationPatterns: string[];
  preferredTechniques: string[];
  resistanceAreas: string[];
  motivationTriggers: string[];
  successStrategies: string[];
  learningStyle: string;
}

/**
 * Advanced Memory Architecture for AI Coaching
 * Mimics human episodic and semantic memory for continuous learning
 */
export class AdvancedMemorySystem {

  /**
   * Consolidate and store important insights from interactions
   */
  async consolidateMemory(userId: string, challengeType: string): Promise<MemoryInsight[]> {
    try {
      // Get recent interactions for consolidation
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
        .limit(10);

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

      if (recentInteractions.length === 0 && recentJournals.length === 0) {
        return [];
      }

      // Analyze interactions for consolidation
      const consolidationContent = [
        ...recentInteractions.map(i => `Q: ${i.userInput}\nA: ${typeof i.aiResponse === 'string' ? i.aiResponse : JSON.stringify(i.aiResponse)}`),
        ...recentJournals.map(j => `Day ${j.day}: ${j.experience || ''} ${j.insights || ''} ${j.challenges || ''}`)
      ].join('\n\n');

      const consolidationPrompt = `Analyze these coaching interactions and journal entries to extract key insights for long-term memory consolidation:

${consolidationContent}

Extract and categorize insights into:
1. Breakthrough moments (major realizations or progress)
2. Patterns (recurring themes, behaviors, or responses)
3. Resistance areas (what the user struggles with)
4. Success strategies (what works well for this user)
5. Emotional themes (dominant emotional patterns)

Focus on insights that would be valuable for future coaching sessions. Rate importance (low/medium/high/critical) and relevance (0-1 score).

Respond with JSON array of insights.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: consolidationPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1200
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{"insights": []}');
      
      return (analysis.insights || []).map((insight: any, index: number) => ({
        id: `memory_${userId}_${Date.now()}_${index}`,
        type: insight.type || 'pattern',
        content: insight.content || '',
        relevanceScore: insight.relevanceScore || 0.5,
        lastAccessed: new Date(),
        importance: insight.importance || 'medium',
        associatedChallenges: [challengeType],
        emotionalContext: insight.emotionalContext || 'neutral'
      }));

    } catch (error) {
      console.error("Error consolidating memory:", error);
      return [];
    }
  }

  /**
   * Retrieve relevant memories for current coaching context
   */
  async retrieveRelevantMemories(
    userId: string, 
    currentQuery: string, 
    challengeType: string,
    maxMemories: number = 5
  ): Promise<MemoryInsight[]> {
    try {
      // Get all historical insights for this user
      const consolidatedInsights = await this.consolidateMemory(userId, challengeType);
      
      if (consolidatedInsights.length === 0) {
        return [];
      }

      // Use AI to determine relevance to current query
      const relevancePrompt = `Given this user's current query and their historical insights, determine which memories are most relevant:

CURRENT QUERY: ${currentQuery}
CHALLENGE TYPE: ${challengeType}

HISTORICAL INSIGHTS:
${consolidatedInsights.map((insight, i) => `${i + 1}. [${insight.type}] ${insight.content} (Importance: ${insight.importance})`).join('\n')}

Rank the insights by relevance to the current query (1-10 scale) and return the top ${maxMemories} most relevant ones.

Respond with JSON array containing insight indices and relevance scores.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: relevancePrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 500
      });

      const relevanceAnalysis = JSON.parse(response.choices[0].message.content || '{"relevant": []}');
      
      return (relevanceAnalysis.relevant || [])
        .slice(0, maxMemories)
        .map((item: any) => {
          const insight = consolidatedInsights[item.index - 1];
          if (insight) {
            insight.relevanceScore = item.relevance / 10;
            insight.lastAccessed = new Date();
          }
          return insight;
        })
        .filter(Boolean);

    } catch (error) {
      console.error("Error retrieving memories:", error);
      return [];
    }
  }

  /**
   * Build long-term user profile from historical data
   */
  async buildLongTermMemory(userId: string): Promise<LongTermMemory> {
    try {
      // Get comprehensive historical data
      const allJournals = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(journalEntries.createdAt);

      const allInteractions = await db
        .select()
        .from(aiResponseHistory)
        .where(eq(aiResponseHistory.userId, userId))
        .orderBy(aiResponseHistory.createdAt);

      const userProgressData = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));

      if (allJournals.length < 3) {
        return this.getDefaultLongTermMemory(userId);
      }

      // Analyze comprehensive user patterns
      const comprehensiveContent = [
        ...allJournals.map(j => `Day ${j.day}: Experience: ${j.experience || ''}, Insights: ${j.insights || ''}, Challenges: ${j.challenges || ''}`),
        ...allInteractions.map(i => `Q: ${i.userInput} | Session: ${i.sessionType}`),
        ...userProgressData.map(p => `Progress: Day ${p.currentDay}, Streak: ${p.streakCount}, Challenge: ${p.challengeType}`)
      ].join('\n');

      const profilePrompt = `Analyze this user's complete coaching journey to build a comprehensive long-term memory profile:

${comprehensiveContent}

Extract deep patterns and insights about:
1. Core beliefs and mindset patterns
2. Transformation patterns (how they typically change and grow)
3. Preferred techniques and approaches that work best
4. Areas of resistance or difficulty
5. Key motivation triggers and success strategies
6. Learning style and coaching preferences

Focus on enduring patterns that persist across multiple sessions and challenges.

Respond with detailed JSON profile.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: profilePrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      });

      const profile = JSON.parse(response.choices[0].message.content || '{}');

      return {
        userId,
        coreBeliefs: profile.coreBeliefs || [],
        transformationPatterns: profile.transformationPatterns || [],
        preferredTechniques: profile.preferredTechniques || [],
        resistanceAreas: profile.resistanceAreas || [],
        motivationTriggers: profile.motivationTriggers || [],
        successStrategies: profile.successStrategies || [],
        learningStyle: profile.learningStyle || 'balanced'
      };

    } catch (error) {
      console.error("Error building long-term memory:", error);
      return this.getDefaultLongTermMemory(userId);
    }
  }

  /**
   * Create memory-enhanced coaching response
   */
  async generateMemoryEnhancedResponse(
    userId: string,
    query: string,
    challengeType: string,
    baseResponse: string
  ): Promise<string> {
    try {
      const relevantMemories = await this.retrieveRelevantMemories(userId, query, challengeType);
      const longTermProfile = await this.buildLongTermMemory(userId);

      if (relevantMemories.length === 0) {
        return baseResponse;
      }

      const memoryPrompt = `Enhance this coaching response using the user's memory profile and relevant historical insights:

BASE RESPONSE:
${baseResponse}

USER'S LONG-TERM PROFILE:
- Learning Style: ${longTermProfile.learningStyle}
- Preferred Techniques: ${longTermProfile.preferredTechniques.join(', ')}
- Success Strategies: ${longTermProfile.successStrategies.join(', ')}
- Resistance Areas: ${longTermProfile.resistanceAreas.join(', ')}

RELEVANT MEMORIES:
${relevantMemories.map(m => `[${m.type}] ${m.content} (Importance: ${m.importance})`).join('\n')}

CURRENT QUERY: ${query}

Enhance the response by:
1. Referencing relevant past insights and breakthroughs
2. Acknowledging patterns from their journey
3. Building upon previous successful strategies
4. Addressing known resistance areas proactively
5. Using their preferred learning style and techniques

Create a response that demonstrates continuity and deep understanding of their unique journey.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: memoryPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      return response.choices[0].message.content || baseResponse;

    } catch (error) {
      console.error("Error generating memory-enhanced response:", error);
      return baseResponse;
    }
  }

  /**
   * Perform memory consolidation and cleanup
   */
  async performMemoryMaintenance(userId: string): Promise<{
    consolidated: number;
    archived: number;
    strengthened: number;
  }> {
    try {
      // Consolidate recent memories
      const recentInsights = await this.consolidateMemory(userId, 'general');
      
      // Simulate memory strengthening (accessing frequently used memories)
      const longTermProfile = await this.buildLongTermMemory(userId);
      
      return {
        consolidated: recentInsights.length,
        archived: 0, // Would implement memory archiving logic
        strengthened: longTermProfile.successStrategies.length
      };

    } catch (error) {
      console.error("Error in memory maintenance:", error);
      return { consolidated: 0, archived: 0, strengthened: 0 };
    }
  }

  private getDefaultLongTermMemory(userId: string): LongTermMemory {
    return {
      userId,
      coreBeliefs: ['growth-oriented', 'open to change'],
      transformationPatterns: ['gradual progress', 'breakthrough moments'],
      preferredTechniques: ['meditation', 'journaling'],
      resistanceAreas: ['consistency', 'self-doubt'],
      motivationTriggers: ['progress recognition', 'community support'],
      successStrategies: ['small daily steps', 'celebration of wins'],
      learningStyle: 'balanced'
    };
  }
}

// Global instance
export const advancedMemory = new AdvancedMemorySystem();