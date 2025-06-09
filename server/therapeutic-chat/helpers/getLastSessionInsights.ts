/**
 * Helper function to retrieve the latest saved psychological data for a user
 * Aggregates data from psychological profiles, conversation history, and user models
 */

import { db } from "../../db";
import { psychologicalProfile, threadExchanges, journalingThreads } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

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

    // Step 2: Get recent thread exchanges for conversation analysis
    const recentExchanges = await db
      .select()
      .from(threadExchanges)
      .where(eq(threadExchanges.threadId, userId)) // threadExchanges uses threadId, not userId directly
      .orderBy(desc(threadExchanges.createdAt))
      .limit(10);

    // Step 3: Get recent journaling threads for themes
    const recentThreads = await db
      .select()
      .from(journalingThreads)
      .where(eq(journalingThreads.userId, userId))
      .orderBy(desc(journalingThreads.updatedAt))
      .limit(5);

    // Step 4: Extract and aggregate insights
    let framework = "CBT"; // Default
    let tone = "neutral"; // Default
    let state = "uncertain"; // Default
    let themes: string[] = []; // Default

    // Extract data from psychological profile
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

      // Extract themes from recurring topics and concerns
      if (profile.recurringTopics) {
        try {
          const topics = Array.isArray(profile.recurringTopics) 
            ? profile.recurringTopics 
            : JSON.parse(profile.recurringTopics as string);
          themes.push(...topics);
        } catch (error) {
          console.error('Error parsing recurring topics:', error);
        }
      }

      if (profile.recurringConcerns) {
        try {
          const concerns = Array.isArray(profile.recurringConcerns)
            ? profile.recurringConcerns
            : JSON.parse(profile.recurringConcerns as string);
          themes.push(...concerns);
        } catch (error) {
          console.error('Error parsing recurring concerns:', error);
        }
      }
    }

    // Extract additional themes from recent thread exchanges
    if (recentExchanges.length > 0) {
      const exchangeThemes: string[] = [];
      
      recentExchanges.forEach(exchange => {
        if (exchange.aiResponse) {
          try {
            const response = typeof exchange.aiResponse === 'string'
              ? JSON.parse(exchange.aiResponse)
              : exchange.aiResponse;
            
            if (response.themes && Array.isArray(response.themes)) {
              exchangeThemes.push(...response.themes);
            }
          } catch (error) {
            // Continue if JSON parsing fails
          }
        }
      });

      // Merge exchange themes with existing themes
      const allThemes = [...themes, ...exchangeThemes];
      const uniqueThemes = [...new Set(allThemes)];
      themes = uniqueThemes.slice(0, 5); // Keep top 5 themes
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
    
    // Get session count from conversation history
    const sessionCount = await db
      .select()
      .from(conversationHistory)
      .where(eq(conversationHistory.userId, userId));

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