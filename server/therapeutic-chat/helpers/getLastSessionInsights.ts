/**
 * Helper function to retrieve latest psychological insights for a user
 * Accesses stored profile data from Replit database
 */

import { db } from '../../db';
import { psychologicalProfile } from '../../../shared/schema';
import { eq, desc } from 'drizzle-orm';

interface SessionInsights {
  framework: string;
  tone: string;
  state: string;
  themes: string[];
}

/**
 * Retrieve the latest saved psychological data for the user
 * @param userId - User identifier
 * @returns SessionInsights object with latest psychological data
 */
export async function getLastSessionInsights(userId: string): Promise<SessionInsights> {
  try {
    // Query the most recent psychological profile for the user using Replit database
    const [latestProfile] = await db.select()
      .from(psychologicalProfile)
      .where(eq(psychologicalProfile.userId, userId))
      .orderBy(desc(psychologicalProfile.updatedAt))
      .limit(1);

    if (!latestProfile) {
      // Return default values if no profile found
      return getDefaultInsights();
    }

    // Extract insights from the profile data
    const insights: SessionInsights = {
      framework: extractTherapeuticFramework(latestProfile),
      tone: extractToneShift(latestProfile),
      state: extractEmotionalState(latestProfile),
      themes: extractDominantThemes(latestProfile)
    };

    return insights;

  } catch (error) {
    console.error('Error retrieving session insights:', error);
    return getDefaultInsights();
  }
}

/**
 * Extract preferred therapeutic framework from profile data
 */
function extractTherapeuticFramework(profile: any): string {
  // Check communication style field for framework preference
  if (profile.communicationStyle) {
    const style = profile.communicationStyle.toLowerCase();
    if (style.includes('cbt') || style.includes('cognitive')) return 'CBT';
    if (style.includes('act') || style.includes('acceptance')) return 'ACT';
    if (style.includes('dbt') || style.includes('dialectical')) return 'DBT';
    if (style.includes('humanistic') || style.includes('person-centered')) return 'Humanistic';
    if (style.includes('psychodynamic')) return 'Psychodynamic';
  }

  // Check effective therapeutic styles
  if (profile.effectiveTherapeuticStyles) {
    const styles = profile.effectiveTherapeuticStyles;
    if (styles.cbt > 0.7) return 'CBT';
    if (styles.act > 0.7) return 'ACT';
    if (styles.dbt > 0.7) return 'DBT';
    if (styles.humanistic > 0.7) return 'Humanistic';
  }

  return 'CBT'; // Default framework
}

/**
 * Extract tone shift from profile data
 */
function extractToneShift(profile: any): string {
  // Check personality traits for tone indicators
  if (profile.personalityTraits && profile.personalityTraits.toneShift) {
    return profile.personalityTraits.toneShift;
  }

  // Check communication tone
  if (profile.communicationTone) {
    return profile.communicationTone;
  }

  // Infer from emotional baseline
  if (profile.currentDominantEmotion) {
    const emotion = profile.currentDominantEmotion.toLowerCase();
    if (emotion.includes('anxious') || emotion.includes('stressed')) return 'tense';
    if (emotion.includes('sad') || emotion.includes('depressed')) return 'subdued';
    if (emotion.includes('angry') || emotion.includes('frustrated')) return 'intense';
    if (emotion.includes('happy') || emotion.includes('content')) return 'positive';
  }

  return 'neutral'; // Default tone
}

/**
 * Extract emotional state from profile data
 */
function extractEmotionalState(profile: any): string {
  // Use current dominant emotion if available
  if (profile.currentDominantEmotion) {
    return profile.currentDominantEmotion;
  }

  // Check personality traits for emotional indicators
  if (profile.personalityTraits && profile.personalityTraits.emotionalBaseline) {
    return profile.personalityTraits.emotionalBaseline;
  }

  return 'uncertain'; // Default state
}

/**
 * Extract dominant themes from profile data
 */
function extractDominantThemes(profile: any): string[] {
  const themes: string[] = [];

  // Extract from personality traits
  if (profile.personalityTraits && profile.personalityTraits.motivationThemes) {
    const motivationThemes = profile.personalityTraits.motivationThemes;
    if (Array.isArray(motivationThemes)) {
      themes.push(...motivationThemes);
    }
  }

  // Extract from identified growth areas
  if (profile.identifiedGrowthAreas && Array.isArray(profile.identifiedGrowthAreas)) {
    themes.push(...profile.identifiedGrowthAreas);
  }

  // Extract from strengths as positive themes
  if (profile.identifiedStrengths && Array.isArray(profile.identifiedStrengths)) {
    themes.push(...profile.identifiedStrengths);
  }

  // Remove duplicates and return up to 5 most relevant themes
  return [...new Set(themes)].slice(0, 5);
}

/**
 * Return default insights when no profile data is available
 */
function getDefaultInsights(): SessionInsights {
  return {
    framework: 'CBT',
    tone: 'neutral',
    state: 'uncertain',
    themes: []
  };
}