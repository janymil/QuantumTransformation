/**
 * FastChatEngine - Optimized for Speed
 * 
 * Provides rapid therapeutic responses using:
 * 1. Embedding-based semantic search of past entries
 * 2. Cached psychological profile insights
 * 3. Lightweight GPT-4o prompts
 * 4. Structured JSON responses
 */

import { openai } from '../openai';
import { db } from '../db';
import { eq, desc, and, isNotNull } from 'drizzle-orm';
import { PostProcessingJob } from '../jobs/post-processing-job';
import { 
  threadExchanges, 
  journalingThreads, 
  psychologicalProfile,
  userTherapeuticProfile
} from '@shared/schema';
import { buildFastPrompt, type MemorySnippet, type UserInsights, validatePromptInputs, optimizePromptForTokens } from './prompt-builders/buildFastPrompt';
import { getLastSessionInsights as getUserSessionInsights } from './helpers/getLastSessionInsights';

/**
 * Fast response structure for speed-optimized therapeutic interactions
 */
export interface FastTherapeuticResponse {
  analysis: string;    // 2-3 sentence psychological reflection
  question: string;    // 1 follow-up question for deeper exploration
}

/**
 * Semantic similarity entry from past conversations
 */
interface SimilarEntry {
  userInput: string;
  aiAnalysis: any;
  emotionalContext: string;
  createdAt: Date;
  similarity: number;
}

/**
 * Cached psychological insights for rapid personalization
 */
interface SessionInsights {
  preferredFramework: string;
  communicationTone: string;
  questioningDepth: number;
  currentEmotionalState: string;
  effectivePatterns: string[];
  recentTopics: string[];
}

/**
 * Main function: Process fast therapeutic response
 * Optimized for sub-2-second response times
 */
export async function processFastResponse(
  userId: string, 
  threadId: string, 
  entryText: string
): Promise<FastTherapeuticResponse> {
  const startTime = Date.now();
  
  try {
    // Step 1: Validate input
    const validation = validatePromptInputs(entryText);
    if (!validation.isValid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    // Step 2: Parallel data retrieval for speed optimization
    const [similarEntries, sessionInsights] = await Promise.all([
      findSimilarPastEntries(userId, entryText, 3),
      getUserSessionInsights(userId)
    ]);
    
    console.log("Retrieved session insights:", sessionInsights);
    console.log("Retrieved similar entries:", similarEntries.length);

    // Step 3: Convert similar entries to memory snippets
    const memorySnippets: MemorySnippet[] = similarEntries.map(entry => ({
      content: entry.userInput,
      relevanceScore: entry.similarity,
      context: entry.emotionalContext || 'past_journal_entry'
    }));

    // Step 4: Use session insights directly (interfaces match)
    const userInsights: UserInsights = sessionInsights;

    // Step 5: Build optimized prompt using buildFastPrompt
    const promptMessages = optimizePromptForTokens(
      entryText,
      memorySnippets,
      userInsights,
      1200 // Max tokens for fast response
    );
    
    console.log("Final prompt messages being sent to OpenAI:");
    console.log("System message:", promptMessages[0]?.content?.substring(0, 200) + "...");
    console.log("User message:", promptMessages[1]?.content?.substring(0, 200) + "...");

    // Step 6: Call GPT-4o with optimized parameters
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: promptMessages,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 300, // Limit for speed
    });

    // Step 5: Parse and return structured response
    const rawContent = response.choices[0].message.content || "{}";
    console.log("Raw OpenAI response:", rawContent);
    
    let result;
    try {
      result = JSON.parse(rawContent);
      console.log("Parsed JSON result:", result);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.log("Attempting to extract content manually from:", rawContent);
      
      // Manual extraction if JSON parsing fails
      result = {
        analysis: rawContent,
        question: "How does this situation make you feel, and what would help you move forward?"
      };
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`FastChatEngine processed response in ${processingTime}ms`);

    return {
      analysis: result.analysis || "I notice you're sharing something meaningful. Let's explore this together.",
      question: result.question || "What aspect of this feels most important to you right now?"
    };

  } catch (error) {
    console.error("FastChatEngine error:", error);
    
    // Fast fallback response maintaining therapeutic quality
    return {
      analysis: "I can sense there's something significant in what you're sharing. Your awareness of this topic shows growth.",
      question: "What would feel most helpful to explore about this right now?"
    };
  }
}

/**
 * Find semantically similar past entries using embedding search
 * Returns 2-3 most relevant entries for context
 */
async function findSimilarPastEntries(
  userId: string, 
  currentText: string, 
  limit: number = 3
): Promise<SimilarEntry[]> {
  try {
    // Get recent exchanges from user's threads
    const recentExchanges = await db
      .select({
        userInput: threadExchanges.userInput,
        aiAnalysis: threadExchanges.aiAnalysis,
        aiEmotionalAssessment: threadExchanges.aiEmotionalAssessment,
        createdAt: threadExchanges.createdAt,
        threadId: threadExchanges.threadId
      })
      .from(threadExchanges)
      .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
      .where(
        and(
          eq(journalingThreads.userId, userId),
          isNotNull(threadExchanges.userInput)
        )
      )
      .orderBy(desc(threadExchanges.createdAt))
      .limit(20); // Get more entries for better similarity matching

    // Simple keyword-based similarity scoring for speed
    // In production, this would use actual embeddings/vector search
    const similarEntries: SimilarEntry[] = recentExchanges
      .filter(entry => entry.createdAt !== null) // Filter out null dates
      .map(entry => ({
        userInput: entry.userInput,
        aiAnalysis: entry.aiAnalysis,
        emotionalContext: extractEmotionalContext(entry.aiEmotionalAssessment),
        createdAt: entry.createdAt as Date, // Safe cast after filtering
        similarity: calculateTextSimilarity(currentText, entry.userInput)
      }))
      .filter(entry => entry.similarity > 0.1) // Filter out very low similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarEntries;

  } catch (error) {
    console.error("Error finding similar entries:", error);
    return [];
  }
}

/**
 * Get cached psychological profile insights for rapid personalization
 * Retrieves user's preferred frameworks, tone, and effective patterns
 */
export async function getLastSessionInsights(userId: string): Promise<SessionInsights> {
  try {
    // Get psychological profile
    const [profile] = await db
      .select()
      .from(psychologicalProfile)
      .where(eq(psychologicalProfile.userId, userId))
      .limit(1);

    // Get therapeutic profile
    const [therapeuticProfile] = await db
      .select()
      .from(userTherapeuticProfile)
      .where(eq(userTherapeuticProfile.userId, userId))
      .limit(1);

    // Get recent conversation context
    const recentThreads = await db
      .select({
        currentEmotionalState: journalingThreads.currentEmotionalState,
        currentTopic: journalingThreads.currentTopic,
        preferredTone: journalingThreads.preferredTone,
        preferredPerspective: journalingThreads.preferredPerspective
      })
      .from(journalingThreads)
      .where(
        and(
          eq(journalingThreads.userId, userId),
          eq(journalingThreads.isActive, true)
        )
      )
      .orderBy(desc(journalingThreads.lastActiveAt))
      .limit(3);

    // Compile insights for fast access
    const insights: SessionInsights = {
      preferredFramework: extractPreferredFramework(therapeuticProfile?.responsiveToFrameworks),
      communicationTone: therapeuticProfile?.communicationTone || recentThreads[0]?.preferredTone || "supportive",
      questioningDepth: therapeuticProfile?.preferredQuestioningDepth || 5,
      currentEmotionalState: profile?.currentDominantEmotion || recentThreads[0]?.currentEmotionalState || "exploring",
      effectivePatterns: extractEffectivePatterns(therapeuticProfile?.effectiveTherapeuticStyles),
      recentTopics: extractRecentTopics(recentThreads)
    };

    return insights;

  } catch (error) {
    console.error("Error getting session insights:", error);
    
    // Return safe defaults for uninterrupted service
    return {
      preferredFramework: "person-centered",
      communicationTone: "supportive",
      questioningDepth: 5,
      currentEmotionalState: "exploring",
      effectivePatterns: ["reflective", "collaborative"],
      recentTopics: []
    };
  }
}

/**
 * Build lightweight system prompt using cached insights and similar entries
 * Optimized for consistent, personalized responses
 */
function buildFastSystemPrompt(insights: SessionInsights, similarEntries: SimilarEntry[]): string {
  const contextualPatterns = similarEntries.length > 0 
    ? `\n\nRecent conversation patterns:
${similarEntries.map(entry => 
  `- Previous topic: "${entry.userInput.substring(0, 100)}..." → Emotional context: ${entry.emotionalContext}`
).join('\n')}`
    : '';

  return `You are a skilled therapeutic AI providing rapid, personalized responses. Your approach:

PERSONALIZATION PROFILE:
- Preferred framework: ${insights.preferredFramework}
- Communication tone: ${insights.communicationTone}
- Questioning depth: ${insights.questioningDepth}/10
- Current emotional state: ${insights.currentEmotionalState}
- Effective patterns: ${insights.effectivePatterns.join(', ')}
${insights.recentTopics.length > 0 ? `- Recent topics: ${insights.recentTopics.join(', ')}` : ''}${contextualPatterns}

RESPONSE REQUIREMENTS:
- Always respond in JSON format: {"analysis": "2-3 sentences", "question": "single question"}
- Analysis: Brief psychological reflection building on their patterns
- Question: One thoughtful follow-up that respects their depth preference
- Match their established communication style and emotional needs
- Reference patterns from similar past conversations when relevant
- Keep responses concise but meaningful

Focus on continuity with their psychological journey and established therapeutic relationship.`;
}

/**
 * Helper Functions
 */

function extractEmotionalContext(emotionalAssessment: any): string {
  if (!emotionalAssessment || typeof emotionalAssessment !== 'object') {
    return 'neutral';
  }
  return emotionalAssessment.primaryEmotion || emotionalAssessment.dominant_emotion || 'mixed';
}

function calculateTextSimilarity(text1: string, text2: string): number {
  // Simple keyword overlap similarity for speed
  // In production, use proper embedding similarity
  const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return union.length > 0 ? intersection.length / union.length : 0;
}

function extractPreferredFramework(responsiveFrameworks: any): string {
  if (!responsiveFrameworks || typeof responsiveFrameworks !== 'object') {
    return 'person-centered';
  }
  
  // Find highest scoring framework
  const frameworks = Object.entries(responsiveFrameworks as Record<string, number>);
  if (frameworks.length === 0) return 'person-centered';
  
  const [bestFramework] = frameworks.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  
  return bestFramework || 'person-centered';
}

function extractEffectivePatterns(effectiveStyles: any): string[] {
  if (!effectiveStyles || typeof effectiveStyles !== 'object') {
    return ['reflective', 'supportive'];
  }
  
  // Return styles with score > 0.7
  return Object.entries(effectiveStyles as Record<string, number>)
    .filter(([_, score]) => score > 0.7)
    .map(([style]) => style)
    .slice(0, 3); // Limit for speed
}

function extractRecentTopics(recentThreads: any[]): string[] {
  return recentThreads
    .map(thread => thread?.currentTopic)
    .filter(topic => topic && typeof topic === 'string')
    .slice(0, 3);
}

// Export the main function
export const fastChatEngine = {
  processFastResponse
};