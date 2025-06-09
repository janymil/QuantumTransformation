/**
 * Fast Chat Engine for Therapeutic Responses
 * Optimized for speed using semantic search and lightweight prompting
 */

import { openai } from '../openai';
import { db } from '../db';
import { threadExchanges, journalingThreads, psychologicalProfile } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getLastSessionInsights, type LastSessionInsights } from "./helpers";

interface FastChatResponse {
  analysis: string;
  question: string;
}

interface SemanticMatch {
  content: string;
  similarity: number;
  context: string;
}

export class FastChatEngine {

  /**
   * Main entry point for fast therapeutic responses
   * Optimized for speed - no deep analysis or model switching
   */
  async processFastResponse(
    userId: string, 
    threadId: number | null, 
    entryText: string
  ): Promise<FastChatResponse> {
    try {
      // Step 1: Get semantic matches from past entries (parallel execution)
      const [semanticMatches, sessionInsights] = await Promise.all([
        this.getSemanticMatches(userId, entryText),
        getLastSessionInsights(userId)
      ]);

      // Step 2: Build lightweight system prompt
      const systemPrompt = this.buildLightweightPrompt(
        entryText, 
        semanticMatches, 
        sessionInsights
      );

      // Step 3: Get GPT-4o response (optimized for speed)
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: entryText }
        ],
        max_tokens: 200, // Limit for speed
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      // Step 4: Parse and return structured response
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response content received');
      }

      return JSON.parse(content) as FastChatResponse;

    } catch (error) {
      console.error('Fast chat engine error:', error);

      // Fallback response for reliability
      return {
        analysis: "I can sense you're processing some important thoughts. Your willingness to explore these feelings shows real self-awareness.",
        question: "What aspect of this situation feels most significant to you right now?"
      };
    }
  }

  /**
   * Retrieve 2-3 semantically similar past entries using simple text matching
   * Note: For production, integrate with pgvector or similar embedding search
   */
  private async getSemanticMatches(
    userId: string, 
    currentText: string
  ): Promise<SemanticMatch[]> {
    try {
      // Get recent user entries for semantic matching
      const recentEntries = await db
        .select({
          userInput: threadExchanges.userInput,
          aiResponse: threadExchanges.aiResponse,
          createdAt: threadExchanges.createdAt
        })
        .from(threadExchanges)
        .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(eq(journalingThreads.userId, userId))
        .orderBy(desc(threadExchanges.createdAt))
        .limit(20); // Get pool of recent entries

      // Simple keyword-based semantic matching (placeholder for embedding search)
      const matches = this.findSemanticMatches(currentText, recentEntries);

      return matches.slice(0, 3); // Return top 3 matches

    } catch (error) {
      console.error('Error retrieving semantic matches:', error);
      return [];
    }
  }

  /**
   * Simple semantic matching using keyword overlap and patterns
   * TODO: Replace with proper embedding search (pgvector) in production
   */
  private findSemanticMatches(
    currentText: string, 
    entries: any[]
  ): SemanticMatch[] {
    const currentWords = this.extractKeywords(currentText.toLowerCase());
    const matches: SemanticMatch[] = [];

    for (const entry of entries) {
      if (!entry.userInput || entry.userInput.length < 20) continue;

      const entryWords = this.extractKeywords(entry.userInput.toLowerCase());
      const similarity = this.calculateSimilarity(currentWords, entryWords);

      if (similarity > 0.2) { // Minimum similarity threshold
        matches.push({
          content: entry.userInput.substring(0, 150) + '...',
          similarity,
          context: entry.aiResponse ? entry.aiResponse.substring(0, 100) + '...' : ''
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Extract meaningful keywords for semantic matching
   */
  private extractKeywords(text: string): string[] {
    // Remove common stop words and extract meaningful terms
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'me', 'my', 'myself', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);

    return text
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10); // Limit keywords for performance
  }

  /**
   * Calculate simple similarity score between keyword sets
   */
  private calculateSimilarity(words1: string[], words2: string[]): number {
    if (words1.length === 0 || words2.length === 0) return 0;

    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));

    return intersection.size / Math.max(set1.size, set2.size);
  }

  /**
   * Build lightweight system prompt optimized for fast GPT-4o responses
   */
  private buildLightweightPrompt(
    entryText: string,
    semanticMatches: SemanticMatch[],
    insights: LastSessionInsights
  ): string {
    const contextSection = semanticMatches.length > 0 
      ? `\nRELATED PAST THEMES:\n${semanticMatches.map(m => `- ${m.content}`).join('\n')}\n`
      : '';

    return `You are a skilled therapeutic AI assistant providing quick, meaningful responses. 

USER PROFILE:
- Preferred approach: ${insights.preferredFramework}
- Communication tone: ${insights.communicationTone}
- Current emotional state: ${insights.emotionalState}
- Challenge level: ${insights.challengeLevel}/10
${contextSection}
INSTRUCTIONS:
1. Provide a 2-3 sentence psychological reflection that validates their experience
2. Ask 1 follow-up question that helps them explore deeper
3. Use ${insights.communicationTone} tone
4. Apply ${insights.preferredFramework} framework principles
5. Return as JSON: {"analysis": "reflection here", "question": "question here"}

Keep responses concise but meaningful. Focus on emotional validation and gentle exploration.`;
  }
}

// Export singleton instance
export const fastChatEngine = new FastChatEngine();