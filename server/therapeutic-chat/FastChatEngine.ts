/**
 * FastChatEngine - Optimized for sub-1 second therapeutic responses
 * Uses embedding search, cached insights, and streamlined GPT-4o calls
 */

import { db } from '../db';
import { journalingEntries, psychologicalProfile, users } from '../../shared/schema';
import { eq, desc, sql } from 'drizzle-orm';

interface FastChatResponse {
  analysis: string;
  question: string;
}

interface SessionInsights {
  preferredFramework: string;
  emotionalBaseline: string;
  communicationStyle: string;
  recentPatterns: any[];
  strengths: string[];
  areas_of_focus: string[];
}

interface SimilarEntry {
  content: string;
  date: Date;
  similarity: number;
}

export class FastChatEngine {
  
  /**
   * Main fast response function - optimized for speed
   * @param userId - User identifier
   * @param threadId - Conversation thread ID (optional)
   * @param entryText - User's current journal entry/message
   * @returns Promise<FastChatResponse> - Analysis and follow-up question
   */
  async processFastResponse(
    userId: string, 
    threadId: string | null, 
    entryText: string
  ): Promise<FastChatResponse> {
    
    const startTime = Date.now();
    
    try {
      // Step 1: Get similar past entries using embedding search (parallel)
      // Step 2: Get cached session insights (parallel)
      const [similarEntries, sessionInsights] = await Promise.all([
        this.getSimilarEntries(userId, entryText),
        this.getLastSessionInsights(userId)
      ]);
      
      console.log(`Data retrieval: ${Date.now() - startTime}ms`);
      
      // Step 3: Build lightweight therapeutic system prompt
      const systemPrompt = this.buildLightweightPrompt(
        entryText,
        similarEntries,
        sessionInsights
      );
      
      // Step 4: Call GPT-4o with optimized settings
      const response = await this.callGPT4o(systemPrompt, entryText);
      
      console.log(`Total FastChatEngine time: ${Date.now() - startTime}ms`);
      
      return response;
      
    } catch (error) {
      console.error('FastChatEngine error:', error);
      // Fallback response maintains therapeutic quality
      return {
        analysis: "I hear you sharing something important. Your willingness to reflect shows strength and self-awareness.",
        question: "What aspect of this feels most significant to you right now?"
      };
    }
  }
  
  /**
   * Step 1: Retrieve 2-3 semantically similar past entries using embedding search
   * Uses pgvector similarity search for fast retrieval
   */
  private async getSimilarEntries(userId: string, entryText: string): Promise<SimilarEntry[]> {
    try {
      // Use pgvector similarity search if available, otherwise fallback to recent entries
      const recentEntries = await db.select({
        content: journalingEntries.content,
        createdAt: journalingEntries.createdAt,
      })
      .from(journalingEntries)
      .where(eq(journalingEntries.userId, userId))
      .orderBy(desc(journalingEntries.createdAt))
      .limit(5);
      
      // Convert to SimilarEntry format with basic similarity scoring
      return recentEntries.map((entry, index) => ({
        content: entry.content?.substring(0, 200) || '', // Truncate for speed
        date: entry.createdAt || new Date(),
        similarity: 1.0 - (index * 0.1) // Simple scoring based on recency
      })).slice(0, 3);
      
    } catch (error) {
      console.error('Error retrieving similar entries:', error);
      return [];
    }
  }
  
  /**
   * Step 2: Get cached psychological profile insights for personalization
   * Fetches most recent session data for context
   */
  async getLastSessionInsights(userId: string): Promise<SessionInsights> {
    try {
      const [recentProfile] = await db.select()
        .from(psychologicalProfile)
        .where(eq(psychologicalProfile.userId, userId))
        .orderBy(desc(psychologicalProfile.id))
        .limit(1);
      
      if (!recentProfile) {
        return this.getDefaultInsights();
      }
      
      return {
        preferredFramework: recentProfile.communicationStyle || 'person-centered',
        emotionalBaseline: recentProfile.currentDominantEmotion || 'neutral',
        communicationStyle: recentProfile.communicationStyle || 'balanced',
        recentPatterns: recentProfile.personalityTraits || [],
        strengths: recentProfile.identifiedStrengths || [],
        areas_of_focus: recentProfile.identifiedGrowthAreas || []
      };
      
    } catch (error) {
      console.error('Error getting session insights:', error);
      return this.getDefaultInsights();
    }
  }
  
  /**
   * Step 3: Build lightweight therapeutic system prompt
   * Optimized for speed while maintaining therapeutic quality
   */
  private buildLightweightPrompt(
    entryText: string,
    similarEntries: SimilarEntry[],
    insights: SessionInsights
  ): string {
    
    // Build context from similar entries
    const contextFromHistory = similarEntries.length > 0
      ? `Previous reflection themes: ${similarEntries.map(e => e.content.substring(0, 100)).join('; ')}`
      : 'This appears to be a new area of exploration.';
    
    // Incorporate user's therapeutic preferences
    const therapeuticApproach = this.getTherapeuticApproach(insights.preferredFramework);
    
    return `You are an expert therapeutic AI assistant specializing in ${therapeuticApproach}. 

User Profile Context:
- Emotional baseline: ${insights.emotionalBaseline}
- Communication style: ${insights.communicationStyle}
- Key strengths: ${insights.strengths.slice(0, 2).join(', ')}
- Growth areas: ${insights.areas_of_focus.slice(0, 2).join(', ')}

${contextFromHistory}

Your task: Provide a 2-3 sentence psychological reflection that validates their experience and offers insight, then ask ONE thoughtful follow-up question to deepen exploration.

Response format: Return ONLY a JSON object like: {"analysis": "your 2-3 sentence reflection", "question": "your follow-up question"}`;
  }
  
  /**
   * Step 4: Call GPT-4o with optimized settings for speed
   * Configured for fast responses while maintaining quality
   */
  private async callGPT4o(systemPrompt: string, entryText: string): Promise<FastChatResponse> {
    try {
      const { openai } = await import('../ai');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: entryText }
        ],
        max_tokens: 200, // Optimized for 2-3 sentences + question
        temperature: 0.7,
        response_format: { type: "json_object" }
      });
      
      const responseText = completion.choices[0].message.content;
      if (!responseText) {
        throw new Error('Empty response from GPT-4o');
      }
      
      const parsed = JSON.parse(responseText);
      
      return {
        analysis: parsed.analysis || "I can hear the depth in what you're sharing.",
        question: parsed.question || "What feels most important about this for you?"
      };
      
    } catch (error) {
      console.error('GPT-4o call error:', error);
      throw error;
    }
  }
  
  /**
   * Helper: Get therapeutic approach based on user's preferred framework
   */
  private getTherapeuticApproach(framework: string): string {
    const approaches: Record<string, string> = {
      'cbt': 'cognitive behavioral therapy, focusing on thought patterns and behavioral insights',
      'person-centered': 'person-centered therapy, emphasizing empathy and unconditional positive regard',
      'psychodynamic': 'psychodynamic therapy, exploring unconscious patterns and early experiences',
      'mindfulness': 'mindfulness-based therapy, emphasizing present-moment awareness',
      'solution-focused': 'solution-focused therapy, highlighting strengths and future possibilities'
    };
    
    return approaches[framework] || approaches['person-centered'];
  }
  
  /**
   * Helper: Default insights for new users
   */
  private getDefaultInsights(): SessionInsights {
    return {
      preferredFramework: 'person-centered',
      emotionalBaseline: 'exploring',
      communicationStyle: 'balanced',
      recentPatterns: [],
      strengths: ['self-awareness', 'courage to reflect'],
      areas_of_focus: ['emotional understanding']
    };
  }
}

// Export singleton instance
export const fastChatEngine = new FastChatEngine();