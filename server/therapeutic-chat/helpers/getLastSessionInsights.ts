/**
 * Helper function to retrieve the latest saved psychological data for a user
 * Aggregates data from psychological profiles, conversation history, and user models
 */

import { db } from "../../db";
import { psychologicalProfile, journalingThreads, threadExchanges, therapeuticChatSessions, therapeuticChatMessages } from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";

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

    // Step 2: Get user's therapeutic chat sessions
    const therapeuticSessions = await db
      .select()
      .from(therapeuticChatSessions)
      .where(eq(therapeuticChatSessions.userId, userId))
      .orderBy(desc(therapeuticChatSessions.lastActivity))
      .limit(10);

    // Step 3: Get recent therapeutic chat messages from user's sessions
    let recentMessages: any[] = [];
    if (therapeuticSessions.length > 0) {
      const sessionIds = therapeuticSessions.map(session => session.id);
      if (sessionIds.length > 0) {
        recentMessages = await db
          .select()
          .from(therapeuticChatMessages)
          .where(sessionIds.length === 1 
            ? eq(therapeuticChatMessages.sessionId, sessionIds[0])
            : or(...sessionIds.map(id => eq(therapeuticChatMessages.sessionId, id)))
          )
          .orderBy(desc(therapeuticChatMessages.createdAt))
          .limit(15);
      }
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

    // Extract additional themes from recent therapeutic chat messages
    if (recentMessages.length > 0) {
      const messageThemes: string[] = [];
      
      recentMessages.forEach(message => {
        // Extract themes from message content
        if (message.content) {
          const content = message.content.toLowerCase();
          
          // Extract key themes using simple keyword analysis
          const commonThemes = [
            'anxiety', 'stress', 'depression', 'anger', 'fear', 'sadness', 'joy', 'hope',
            'relationship', 'work', 'family', 'health', 'future', 'past', 'change',
            'confidence', 'motivation', 'purpose', 'growth', 'healing'
          ];

          const foundThemes = commonThemes.filter(theme => 
            content.includes(theme)
          );
          messageThemes.push(...foundThemes);
        }
      });

      // Merge message themes with existing themes
      const allThemes = [...themes, ...messageThemes];
      const uniqueThemes = [...new Set(allThemes.filter(theme => theme && theme.length > 0))];
      themes = uniqueThemes.slice(0, 5); // Keep top 5 themes
    }

    // Extract themes from recent therapeutic sessions
    if (therapeuticSessions.length > 0) {
      therapeuticSessions.forEach(session => {
        if (session.title) {
          // Extract meaningful keywords from session titles
          const titleWords = session.title.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .filter(word => 
              word.length > 3 && 
              !['this', 'that', 'with', 'about', 'feeling', 'today', 'really', 'been', 'have', 'just'].includes(word)
            );
          themes.push(...titleWords.slice(0, 2));
        }

        // Extract themes from session type and focus area
        if (session.sessionType) {
          themes.push(session.sessionType);
        }
        if (session.focusArea) {
          themes.push(session.focusArea);
        }
      });
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