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
  // Check communication_style field for framework preference
  if (profile.communication_style) {
    const style = profile.communication_style.toLowerCase();
    if (style.includes('cbt') || style.includes('cognitive')) return 'CBT';
    if (style.includes('act') || style.includes('acceptance')) return 'ACT';
    if (style.includes('dbt') || style.includes('dialectical')) return 'DBT';
    if (style.includes('humanistic') || style.includes('person-centered')) return 'Humanistic';
    if (style.includes('psychodynamic')) return 'Psychodynamic';
  }

  // Check most_effective_questioning_styles for framework indicators
  if (profile.most_effective_questioning_styles) {
    const styles = profile.most_effective_questioning_styles;
    if (styles.cognitive_behavioral && styles.cognitive_behavioral > 0.7) return 'CBT';
    if (styles.acceptance_commitment && styles.acceptance_commitment > 0.7) return 'ACT';
    if (styles.humanistic && styles.humanistic > 0.7) return 'Humanistic';
  }

  return 'CBT'; // Default framework
}

/**
 * Extract tone shift from profile data
 */
function extractToneShift(profile: any): string {
  // Check personality traits for tone indicators
  if (profile.personality_traits && profile.personality_traits.toneShift) {
    return profile.personality_traits.toneShift;
  }

  // Check communication style for tone
  if (profile.communication_style) {
    return profile.communication_style;
  }

  // Infer from emotional baseline
  if (profile.current_dominant_emotion) {
    const emotion = profile.current_dominant_emotion.toLowerCase();
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
  if (profile.current_dominant_emotion) {
    return profile.current_dominant_emotion;
  }

  // Check personality traits for emotional indicators
  if (profile.personality_traits && profile.personality_traits.emotionalBaseline) {
    return profile.personality_traits.emotionalBaseline;
  }

  return 'uncertain'; // Default state
}

/**
 * Extract dominant themes from profile data
 */
function extractDominantThemes(profile: any): string[] {
  const themes: string[] = [];

  // Extract from personality traits
  if (profile.personality_traits && profile.personality_traits.motivationThemes) {
    const motivationThemes = profile.personality_traits.motivationThemes;
    if (Array.isArray(motivationThemes)) {
      themes.push(...motivationThemes);
    }
  }

  // Extract from identified growth areas
  if (profile.identified_growth_areas && Array.isArray(profile.identified_growth_areas)) {
    themes.push(...profile.identified_growth_areas);
  }

  // Extract from strengths as positive themes
  if (profile.identified_strengths && Array.isArray(profile.identified_strengths)) {
    themes.push(...profile.identified_strengths);
  }

  // Extract from recurring concerns
  if (profile.recurring_concerns && Array.isArray(profile.recurring_concerns)) {
    themes.push(...profile.recurring_concerns);
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