/**
 * Optimized Response Engine - Fast, Non-Duplicating AI Responses
 * Eliminates slow performance and duplicate generation issues
 */

import { openai } from '../openai';
import { db } from '../db';
import { threadExchanges, conversationThreads } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

interface OptimizedResponseRequest {
  userId: string;
  userInput: string;
  threadId?: number;
  actionType?: 'go_deeper' | 'new_direction' | 'regular';
}

interface OptimizedResponse {
  content: string;
  threadId: number;
  exchangeId: number;
  emotionalTone: string;
  tokenCount: number;
  cost: number;
}

export class OptimizedResponseEngine {
  private processingCache = new Map<string, Promise<OptimizedResponse>>();

  /**
   * Generate fast, non-duplicating therapeutic response
   */
  async generateResponse(request: OptimizedResponseRequest): Promise<OptimizedResponse> {
    const cacheKey = `${request.userId}-${request.userInput}-${request.actionType || 'regular'}`;
    
    // Prevent duplicate processing
    if (this.processingCache.has(cacheKey)) {
      return this.processingCache.get(cacheKey)!;
    }

    const responsePromise = this.processResponse(request);
    this.processingCache.set(cacheKey, responsePromise);

    try {
      const result = await responsePromise;
      // Clear cache after successful completion
      setTimeout(() => this.processingCache.delete(cacheKey), 5000);
      return result;
    } catch (error) {
      this.processingCache.delete(cacheKey);
      throw error;
    }
  }

  private async processResponse(request: OptimizedResponseRequest): Promise<OptimizedResponse> {
    // Get or create thread
    const threadId = await this.ensureThread(request.userId, request.threadId);
    
    // Get recent context (limited for speed)
    const recentExchanges = await db.select()
      .from(threadExchanges)
      .where(eq(threadExchanges.threadId, threadId))
      .orderBy(desc(threadExchanges.exchangeOrder))
      .limit(3);

    // Generate optimized prompt based on action type
    const prompt = this.buildOptimizedPrompt(request, recentExchanges);

    // Call AI with optimized settings
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use faster model for better performance
      messages: [
        {
          role: "system",
          content: this.getSystemPrompt(request.actionType)
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150, // Limit tokens to prevent cut-off and improve speed
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const content = response.choices[0].message.content || "I understand. How would you like to explore this further?";
    const tokenCount = response.usage?.total_tokens || 0;
    const cost = this.calculateCost(tokenCount);
    const processingTime = Date.now() - startTime;

    // Store exchange
    const [exchange] = await db.insert(threadExchanges).values({
      threadId,
      exchangeOrder: (recentExchanges[0]?.exchangeOrder || 0) + 1,
      userInput: request.userInput,
      aiResponse: content,
      userWordCount: request.userInput.split(' ').length,
      aiWordCount: content.split(' ').length,
      modelUsed: "gpt-4o-mini",
      tokenCount,
      cost: cost.toString(),
      processingTime,
      aiEmotionalAssessment: this.detectEmotionalTone(content),
      isActionButtonResponse: request.actionType !== 'regular'
    }).returning();

    return {
      content,
      threadId,
      exchangeId: exchange.id,
      emotionalTone: this.detectEmotionalTone(content),
      tokenCount,
      cost
    };
  }

  private async ensureThread(userId: string, threadId?: number): Promise<number> {
    if (threadId) {
      return threadId;
    }

    const [thread] = await db.insert(conversationThreads).values({
      userId,
      title: "Therapeutic Session",
      threadType: "therapeutic_chat",
      currentEmotionalState: "exploring"
    }).returning();

    return thread.id;
  }

  private buildOptimizedPrompt(request: OptimizedResponseRequest, recentExchanges: any[]): string {
    let context = "";
    if (recentExchanges.length > 0) {
      context = recentExchanges.reverse().map(ex => 
        `User: ${ex.userInput}\nTherapist: ${ex.aiResponse}`
      ).join('\n\n');
    }

    const basePrompt = `Context:\n${context}\n\nCurrent user input: "${request.userInput}"`;

    switch (request.actionType) {
      case 'go_deeper':
        return `${basePrompt}\n\nProvide a deeper therapeutic exploration that uncovers underlying patterns, emotions, or beliefs. Use depth psychology techniques to help the user gain profound insight.`;
      
      case 'new_direction':
        return `${basePrompt}\n\nOffer a fresh therapeutic perspective or alternative approach. Introduce a different framework (CBT, somatic, humanistic) to explore this topic from a new angle.`;
      
      default:
        return `${basePrompt}\n\nProvide a supportive, insightful therapeutic response that validates their experience and offers gentle guidance.`;
    }
  }

  private getSystemPrompt(actionType?: string): string {
    const basePrompt = "You are an experienced therapist. Provide concise, insightful responses that are supportive and professionally therapeutic.";
    
    switch (actionType) {
      case 'go_deeper':
        return `${basePrompt} Focus on depth psychology and uncovering deeper patterns. Be incisive but gentle.`;
      
      case 'new_direction':
        return `${basePrompt} Offer alternative therapeutic perspectives. Introduce different frameworks or approaches.`;
      
      default:
        return `${basePrompt} Provide empathetic, validating responses that help the user feel heard and understood.`;
    }
  }

  private detectEmotionalTone(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('explore') || lowerContent.includes('discover')) return 'exploratory';
    if (lowerContent.includes('understand') || lowerContent.includes('insight')) return 'insightful';
    if (lowerContent.includes('feel') || lowerContent.includes('emotion')) return 'empathetic';
    if (lowerContent.includes('pattern') || lowerContent.includes('notice')) return 'analytical';
    
    return 'supportive';
  }

  private calculateCost(tokens: number): number {
    // GPT-4o-mini pricing: $0.00015 per 1K input tokens, $0.0006 per 1K output tokens
    return (tokens * 0.0006) / 1000;
  }
}

export const optimizedResponseEngine = new OptimizedResponseEngine();