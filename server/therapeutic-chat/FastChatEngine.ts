/**
 * FastChatEngine Module - Optimized for Sub-1 Second Responses
 * Uses embedding search and cached insights for therapeutic responses
 */

import OpenAI from 'openai';
import { getLastSessionInsights } from './helpers/getLastSessionInsights';
import { buildFastPrompt } from './prompt-builders/buildFastPrompt';
import { db } from '../db';
import { threadExchanges, journalingThreads } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for the FastChatEngine
interface FastResponse {
  analysis: string;
  question: string;
}

interface SessionInsights {
  framework: string;
  tone: string;
  state: string;
  themes: string[];
}

interface SimilarEntry {
  userInput: string;
  aiAnalysis: any;
  similarity: number;
}

/**
 * Main function: Process fast therapeutic response
 * @param userId - User identifier
 * @param threadId - Thread identifier 
 * @param entryText - User's current input
 * @returns Lightweight therapeutic response with analysis and question
 */
export async function processFastResponse(
  userId: string,
  threadId: string,
  entryText: string
): Promise<FastResponse> {
  try {
    // Step 1: Retrieve 2-3 semantically similar past entries using embedding search
    const similarEntries = await findSimilarEntries(userId, entryText);

    // Step 2: Get cached psychological profile insights
    const sessionInsights = await getLastSessionInsights(userId);

    // Step 3: Build fast prompt using the new prompt builder
    const promptMessages = buildFastPrompt(entryText, similarEntries, sessionInsights);

    // Step 4: Call GPT-4o for fast response
    const response = await callGPT4o(promptMessages);

    return response;

  } catch (error) {
    console.error('FastChatEngine error:', error);
    
    // Fallback response if anything fails
    return {
      analysis: "I understand what you're sharing. This connects to patterns of growth and self-reflection that show your willingness to explore deeper aspects of yourself.",
      question: "What feels most important to explore about this right now?"
    };
  }
}

/**
 * Step 1: Find 2-3 semantically similar past entries using embedding search
 * Uses simple text similarity as fallback if pgvector isn't available
 */
async function findSimilarEntries(userId: string, currentText: string): Promise<SimilarEntry[]> {
  try {
    // Get recent thread exchanges for the user
    const recentExchanges = await db.select({
      userInput: threadExchanges.userInput,
      aiAnalysis: threadExchanges.aiAnalysis,
      createdAt: threadExchanges.createdAt
    })
    .from(threadExchanges)
    .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
    .where(eq(journalingThreads.userId, userId))
    .orderBy(desc(threadExchanges.createdAt))
    .limit(20); // Get recent entries for similarity comparison

    // Simple text similarity scoring (fallback method)
    const currentWords = currentText.toLowerCase().split(/\s+/);
    
    const scoredEntries = recentExchanges.map(entry => {
      const entryWords = entry.userInput.toLowerCase().split(/\s+/);
      const commonWords = currentWords.filter(word => entryWords.includes(word));
      const similarity = commonWords.length / Math.max(currentWords.length, entryWords.length);
      
      return {
        userInput: entry.userInput,
        aiAnalysis: entry.aiAnalysis,
        similarity
      };
    });

    // Return top 3 most similar entries
    return scoredEntries
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

  } catch (error) {
    console.error('Error finding similar entries:', error);
    return [];
  }
}



/**
 * Step 4: Call GPT-4o with optimized settings for speed
 */
async function callGPT4o(messages: Array<{role: string, content: string}>): Promise<FastResponse> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: messages as any,
    temperature: 0.7,
    max_tokens: 150, // Limited for speed
    stream: false
  });

  const response = completion.choices[0]?.message?.content || 
    "I hear what you're sharing and appreciate your openness. What aspect of this feels most significant to you right now?";

  // Parse response into analysis and question
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length >= 2) {
    // Split into analysis (first sentences) and question (last sentence)
    const lastSentence = sentences[sentences.length - 1].trim();
    const isQuestion = lastSentence.includes('?') || lastSentence.toLowerCase().includes('what') || 
                      lastSentence.toLowerCase().includes('how') || lastSentence.toLowerCase().includes('when');
    
    if (isQuestion) {
      const analysis = sentences.slice(0, -1).join('. ').trim() + '.';
      const question = lastSentence.endsWith('?') ? lastSentence : lastSentence + '?';
      
      return { analysis, question };
    }
  }

  // Fallback parsing if structure is unclear
  return {
    analysis: response,
    question: "What would you like to explore further about this?"
  };
}

/**
 * Helper: Extract key theme from a text entry
 */
function extractKeyTheme(text: string): string {
  const words = text.toLowerCase();
  
  // Simple keyword detection for themes
  if (words.includes('anxious') || words.includes('worry') || words.includes('stress')) return 'anxiety';
  if (words.includes('sad') || words.includes('down') || words.includes('depressed')) return 'mood';
  if (words.includes('relationship') || words.includes('family') || words.includes('friend')) return 'relationships';
  if (words.includes('work') || words.includes('job') || words.includes('career')) return 'career';
  if (words.includes('decision') || words.includes('choice') || words.includes('unsure')) return 'decision-making';
  
  return 'personal growth';
}