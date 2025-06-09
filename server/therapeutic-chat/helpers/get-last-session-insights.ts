
import { db } from "../../db";
import { psychologicalProfile } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface LastSessionInsights {
  preferredFramework: string;
  emotionalState: string;
  toneShift: string;
  dominantThemes: string[];
}

/**
 * Retrieve the latest psychological profile data for a user
 * Returns cached insights from previous sessions to inform fast responses
 */
export async function getLastSessionInsights(userId: string): Promise<LastSessionInsights> {
  try {
    // Query the psychological profile for this user
    const [profile] = await db
      .select()
      .from(psychologicalProfile)
      .where(eq(psychologicalProfile.userId, userId))
      .limit(1);

    if (!profile) {
      // Return default values if no profile exists
      return {
        preferredFramework: "CBT",
        emotionalState: "uncertain",
        toneShift: "neutral",
        dominantThemes: []
      };
    }

    // Extract insights from the stored profile
    const insights: LastSessionInsights = {
      preferredFramework: extractPreferredFramework(profile),
      emotionalState: profile.currentDominantEmotion || "uncertain",
      toneShift: extractToneShift(profile),
      dominantThemes: extractDominantThemes(profile)
    };

    return insights;

  } catch (error) {
    console.error('Error retrieving last session insights:', error);
    
    // Return defaults on error
    return {
      preferredFramework: "CBT",
      emotionalState: "uncertain", 
      toneShift: "neutral",
      dominantThemes: []
    };
  }
}

/**
 * Extract the preferred therapeutic framework from profile data
 */
function extractPreferredFramework(profile: any): string {
  // Check most effective questioning styles first
  if (profile.mostEffectiveQuestioningStyles && Array.isArray(profile.mostEffectiveQuestioningStyles)) {
    const frameworks = profile.mostEffectiveQuestioningStyles;
    if (frameworks.length > 0) {
      return frameworks[0]; // Return the most effective framework
    }
  }

  // Check preferred interaction modes
  if (profile.preferredInteractionModes && Array.isArray(profile.preferredInteractionModes)) {
    const modes = profile.preferredInteractionModes;
    if (modes.length > 0) {
      // Map interaction modes to frameworks
      const modeToFramework: Record<string, string> = {
        'analytical': 'CBT',
        'supportive': 'ACT',
        'challenging': 'DBT',
        'empathetic': 'humanistic',
        'directive': 'CBT'
      };
      return modeToFramework[modes[0]] || 'CBT';
    }
  }

  return "CBT"; // Default fallback
}

/**
 * Extract tone shift information from emotional patterns
 */
function extractToneShift(profile: any): string {
  if (profile.emotionalPatterns && typeof profile.emotionalPatterns === 'object') {
    // Check for recent tone shift data
    if (profile.emotionalPatterns.toneShift) {
      return profile.emotionalPatterns.toneShift;
    }

    // Infer tone from emotional volatility
    if (typeof profile.emotionalVolatility === 'number') {
      if (profile.emotionalVolatility > 0.7) return "intense";
      if (profile.emotionalVolatility < 0.3) return "calm";
      return "moderate";
    }
  }

  return "neutral"; // Default fallback
}

/**
 * Extract dominant themes from recurring topics and concerns
 */
function extractDominantThemes(profile: any): string[] {
  const themes: string[] = [];

  // Extract from recurring topics
  if (profile.recurringTopics && Array.isArray(profile.recurringTopics)) {
    themes.push(...profile.recurringTopics.slice(0, 3)); // Limit to top 3
  }

  // Extract from recurring concerns
  if (profile.recurringConcerns && Array.isArray(profile.recurringConcerns)) {
    themes.push(...profile.recurringConcerns.slice(0, 2)); // Add top 2 concerns
  }

  // Extract from progress markers if available
  if (profile.progressMarkers && typeof profile.progressMarkers === 'object') {
    if (profile.progressMarkers.motivationThemes && Array.isArray(profile.progressMarkers.motivationThemes)) {
      themes.push(...profile.progressMarkers.motivationThemes.slice(0, 2));
    }
  }

  // Remove duplicates and return unique themes
  return [...new Set(themes)].slice(0, 5); // Limit to 5 themes max
}
