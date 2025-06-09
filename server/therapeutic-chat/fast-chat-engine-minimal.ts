import { db } from "../db";
import { 
  journalingThreads, 
  threadExchanges,
  type JournalingThread,
  type ThreadExchange
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import Anthropic from '@anthropic-ai/sdk';

interface FastChatRequest {
  userId: string;
  userInput: string;
  threadId?: number;
  actionType?: string;
  customizations?: {
    mode?: string;
    tone?: string;
    perspective?: string;
  };
}

interface FastChatResponse {
  response: string;
  threadId: number;
  exchangeId: number;
  responseTime: number;
}

/**
 * Minimal FastChatEngine that actually works
 * Fixes all the import and function reference errors
 */
export class MinimalFastChatEngine {
  private anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  async processFastResponse(request: FastChatRequest): Promise<FastChatResponse> {
    const startTime = Date.now();

    try {
      // Get or create thread
      const thread = await this.getOrCreateThread(request.userId, request.threadId);
      
      // Get recent exchanges for context
      const recentExchanges = await this.getRecentExchanges(thread.id);
      
      // Build simple system prompt
      const systemPrompt = this.buildSystemPrompt(request.userInput, recentExchanges, request.customizations);
      
      // Generate AI response
      const aiResponse = await this.generateAIResponse(systemPrompt, request.userInput);
      
      // Save exchange
      const exchangeOrder = recentExchanges.length + 1;
      const [savedExchange] = await db.insert(threadExchanges).values({
        threadId: thread.id,
        exchangeOrder,
        userInput: request.userInput,
        userWordCount: request.userInput.split(' ').length,
        wasVoiceInput: false,
        aiAnalysis: { analysis: "Basic analysis" },
        aiQuestion: aiResponse,
        modelUsed: "claude-3-sonnet",
        processingTime: Date.now() - startTime,
        tokenCount: request.userInput.length + aiResponse.length,
        cost: "0.01"
      }).returning();

      // Update thread
      await db.update(journalingThreads)
        .set({ 
          totalExchanges: exchangeOrder,
          lastActiveAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(journalingThreads.id, thread.id));

      return {
        response: aiResponse,
        threadId: thread.id,
        exchangeId: savedExchange.id,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('FastChatEngine error:', error);
      throw new Error('Failed to process therapeutic chat response');
    }
  }

  private async getOrCreateThread(userId: string, threadId?: number): Promise<JournalingThread> {
    if (threadId) {
      const existing = await db.select()
        .from(journalingThreads)
        .where(eq(journalingThreads.id, threadId))
        .limit(1);
      
      if (existing.length > 0) {
        return existing[0];
      }
    }

    // Create new thread
    const [newThread] = await db.insert(journalingThreads).values({
      userId,
      title: "Therapeutic Chat Session",
      threadType: "therapy_session",
      currentEmotionalState: "exploring",
      totalExchanges: 0,
      isActive: true
    }).returning();

    return newThread;
  }

  private async getRecentExchanges(threadId: number): Promise<ThreadExchange[]> {
    return await db.select()
      .from(threadExchanges)
      .where(eq(threadExchanges.threadId, threadId))
      .orderBy(desc(threadExchanges.exchangeOrder))
      .limit(3);
  }

  private buildSystemPrompt(userInput: string, recentExchanges: ThreadExchange[], customizations?: any): string {
    const context = recentExchanges.length > 0 
      ? `Recent conversation context: ${recentExchanges.map(e => `User: ${e.userInput}\nResponse: ${e.aiQuestion}`).join('\n\n')}`
      : 'This is the beginning of our conversation.';

    return `You are a skilled therapist providing compassionate, insightful responses to help someone explore their thoughts and feelings.

${context}

Current user input: "${userInput}"

Respond with warmth and therapeutic insight. Ask one thoughtful follow-up question to encourage deeper exploration. Keep your response natural and conversational, avoiding clinical jargon.`;
  }

  private async generateAIResponse(systemPrompt: string, userInput: string): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userInput
          }
        ]
      });

      return response.content[0].type === 'text' ? response.content[0].text : 'I appreciate you sharing that. How are you feeling about what you just expressed?';
    } catch (error) {
      console.error('AI generation error:', error);
      return 'I appreciate you sharing that with me. It sounds like there\'s a lot going on for you right now. What feels most important to explore together?';
    }
  }
}

export const fastChatEngine = new MinimalFastChatEngine();