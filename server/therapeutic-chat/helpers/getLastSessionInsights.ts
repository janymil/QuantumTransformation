/**
 * Helper function to retrieve the latest saved psychological data for a user
 * Aggregates data from psychological profiles, conversation history, and user models
 */

import { db } from "../../db";
import { psychologicalProfile, journalingThreads, threadExchanges } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export interface UserSessionInsights {
  framework: string;
  tone: string;
  state: string;
  themes: string[];
}

/**
 * Retrieve the latest saved psychological data for the user
 */
export async function getLastSessionInsights(userId: string): Promise<UserSessionInsights> {
  try {
    // Step 1: Get latest psychological profile
    const latestProfile = await db
      .select()
      .from(psychologicalProfile)
      .where(eq(psychologicalProfile.userId, userId))
      .orderBy(desc(psychologicalProfile.updatedAt))
      .limit(1);

    // Step 2: Get user's journaling threads to find their threadIds
    const userThreads = await db
      .select()
      .from(journalingThreads)
      .where(eq(journalingThreads.userId, userId))
      .orderBy(desc(journalingThreads.updatedAt))
      .limit(10);

    // Step 3: Get recent thread exchanges from user's threads
    let recentExchanges: any[] = [];
    if (userThreads.length > 0) {
      const threadIds = userThreads.map(thread => thread.id);
      recentExchanges = await db
        .select()
        .from(threadExchanges)
        .where(sql`${threadExchanges.threadId} IN (${threadIds.join(',')})`)
        .orderBy(desc(threadExchanges.createdAt))
        .limit(15);
    }

    // Step 4: Extract and aggregate insights
    let framework = "CBT"; // Default
    let tone = "neutral"; // Default
    let state = "uncertain"; // Default
    let themes: string[] = []; // Default

    // Extract preferred therapeutic framework from psychological profile
    if (latestProfile.length > 0) {
      const profile = latestProfile[0];
      
      // Extract emotional state from current dominant emotion
      if (profile.currentDominantEmotion) {
        state = profile.currentDominantEmotion;
      }
      
      // Extract tone from communication style
      if (profile.communicationStyle) {
        const styleToTone: Record<string, string> = {
          "supportive": "warm",
          "direct": "clear",
          "gentle": "soft",
          "analytical": "structured",
          "empathetic": "compassionate",
          "reflective": "thoughtful"
        };
        tone = styleToTone[profile.communicationStyle] || "neutral";
      }

      // Extract therapeutic framework from problem solving approach
      if (profile.problemSolvingApproach) {
        const approachToFramework: Record<string, string> = {
          "logical": "CBT",
          "intuitive": "Humanistic",
          "collaborative": "ACT",
          "avoidant": "Mindfulness"
        };
        framework = approachToFramework[profile.problemSolvingApproach] || "CBT";
      }

      // Extract dominant themes from psychological patterns
      if (profile.recurringTopics) {
        try {
          const topics = Array.isArray(profile.recurringTopics) 
            ? profile.recurringTopics 
            : (typeof profile.recurringTopics === 'string' 
                ? JSON.parse(profile.recurringTopics) 
                : []);
          if (Array.isArray(topics)) {
            themes.push(...topics.slice(0, 3));
          }
        } catch (error) {
          console.error('Error parsing recurring topics:', error);
        }
      }

      if (profile.recurringConcerns) {
        try {
          const concerns = Array.isArray(profile.recurringConcerns)
            ? profile.recurringConcerns
            : (typeof profile.recurringConcerns === 'string'
                ? JSON.parse(profile.recurringConcerns)
                : []);
          if (Array.isArray(concerns)) {
            themes.push(...concerns.slice(0, 2));
          }
        } catch (error) {
          console.error('Error parsing recurring concerns:', error);
        }
      }

      // Extract themes from identified growth areas
      if (profile.identifiedGrowthAreas) {
        try {
          const growthAreas = Array.isArray(profile.identifiedGrowthAreas)
            ? profile.identifiedGrowthAreas
            : (typeof profile.identifiedGrowthAreas === 'string'
                ? JSON.parse(profile.identifiedGrowthAreas)
                : []);
          if (Array.isArray(growthAreas)) {
            themes.push(...growthAreas.slice(0, 2));
          }
        } catch (error) {
          console.error('Error parsing growth areas:', error);
        }
      }
    }

    // Extract additional themes from recent conversation exchanges
    if (recentExchanges.length > 0) {
      const exchangeThemes: string[] = [];
      
      recentExchanges.forEach(exchange => {
        // Extract themes from AI analysis if available
        if (exchange.aiAnalysisDeep) {
          try {
            const analysis = typeof exchange.aiAnalysisDeep === 'string'
              ? JSON.parse(exchange.aiAnalysisDeep)
              : exchange.aiAnalysisDeep;
            
            if (analysis.themes && Array.isArray(analysis.themes)) {
              exchangeThemes.push(...analysis.themes);
            }
            if (analysis.emotionalThemes && Array.isArray(analysis.emotionalThemes)) {
              exchangeThemes.push(...analysis.emotionalThemes);
            }
          } catch (error) {
            // Continue if JSON parsing fails
          }
        }

        // Extract themes from emotional context
        if (exchange.emotionalContext) {
          const emotions = exchange.emotionalContext.toLowerCase().split(',');
          exchangeThemes.push(...emotions.map((e: string) => e.trim()).filter((e: string) => e.length > 2));
        }
      });

      // Merge exchange themes with existing themes
      const allThemes = [...themes, ...exchangeThemes];
      const uniqueThemes = [...new Set(allThemes.filter(theme => theme && theme.length > 0))];
      themes = uniqueThemes.slice(0, 5); // Keep top 5 themes
    }

    // Extract themes from recent thread titles and summaries
    if (userThreads.length > 0) {
      userThreads.forEach(thread => {
        if (thread.title) {
          // Extract meaningful keywords from thread titles
          const titleWords = thread.title.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .filter(word => 
              word.length > 3 && 
              !['this', 'that', 'with', 'about', 'feeling', 'today', 'really', 'been', 'have', 'just'].includes(word)
            );
          themes.push(...titleWords.slice(0, 2));
        }

        // Extract themes from current topic and emotional state
        if (thread.currentTopic) {
          const topicWords = thread.currentTopic.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .filter(word => word.length > 3);
          themes.push(...topicWords.slice(0, 2));
        }

        if (thread.currentEmotionalState) {
          themes.push(thread.currentEmotionalState.toLowerCase());
        }
      });
    }

    // Ensure we have valid data
    const validFrameworks = ["CBT", "ACT", "DBT", "Psychodynamic", "Humanistic", "Mindfulness"];
    if (!validFrameworks.includes(framework)) {
      framework = "CBT";
    }

    const validTones = ["neutral", "warm", "clear", "soft", "structured", "compassionate"];
    if (!validTones.includes(tone)) {
      tone = "neutral";
    }

    const validStates = ["uncertain", "anxious", "calm", "motivated", "overwhelmed", "hopeful", "frustrated"];
    if (!validStates.includes(state)) {
      state = "uncertain";
    }

    return {
      framework,
      tone,
      state,
      themes: themes.filter(theme => theme && theme.length > 0)
    };

  } catch (error) {
    console.error('Error retrieving last session insights:', error);
    
    // Return safe defaults on error
    return {
      framework: "CBT",
      tone: "neutral", 
      state: "uncertain",
      themes: []
    };
  }
}

/**
 * Get a summary of user's therapeutic preferences for quick reference
 */
export async function getUserTherapeuticPreferences(userId: string): Promise<{
  primaryFramework: string;
  preferredTone: string;
  recentTopics: string[];
  sessionCount: number;
}> {
  try {
    const insights = await getLastSessionInsights(userId);
    
    // Get session count from journaling threads
    const sessionCount = await db
      .select()
      .from(journalingThreads)
      .where(eq(journalingThreads.userId, userId));

    return {
      primaryFramework: insights.framework,
      preferredTone: insights.tone,
      recentTopics: insights.themes,
      sessionCount: sessionCount.length
    };

  } catch (error) {
    console.error('Error getting therapeutic preferences:', error);
    return {
      primaryFramework: "CBT",
      preferredTone: "neutral",
      recentTopics: [],
      sessionCount: 0
    };
  }
}