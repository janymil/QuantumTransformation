/**
 * Fast Chat Engine for Sub-1 Second Therapeutic Responses
 * Delivers immediate responses using GPT-4o with embedded context
 */

import OpenAI from 'openai';
import { getLastSessionInsights } from './helpers/getLastSessionInsights';
import { db } from '../db';
import { therapeuticConversations } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FastChatResponse {
  response: string;
  responseTime: number;
  cost: number;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
}

interface ConversationContext {
  recentMessages: string[];
  sessionInsights: {
    framework: string;
    tone: string;
    state: string;
    themes: string[];
  };
}

export class FastChatEngine {
  private static instance: FastChatEngine;
  
  public static getInstance(): FastChatEngine {
    if (!FastChatEngine.instance) {
      FastChatEngine.instance = new FastChatEngine();
    }
    return FastChatEngine.instance;
  }

  /**
   * Generate immediate therapeutic response using GPT-4o
   */
  async generateFastResponse(
    userId: string,
    userMessage: string,
    challengeType: string = 'general'
  ): Promise<FastChatResponse> {
    const startTime = Date.now();

    try {
      // Get conversation context quickly
      const context = await this.getConversationContext(userId);
      
      // Build optimized prompt for immediate response
      const prompt = this.buildFastPrompt(userMessage, challengeType, context);
      
      // Make GPT-4o call for immediate response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: prompt.system
          },
          {
            role: 'user',
            content: prompt.user
          }
        ],
        temperature: 0.7,
        max_tokens: 400, // Limit for faster response
        stream: false
      });

      const response = completion.choices[0]?.message?.content || 'I understand what you\'re sharing. Let me think about how to best support you with this.';
      const responseTime = Date.now() - startTime;

      // Calculate cost (GPT-4o pricing: $5/1M input, $15/1M output)
      const inputTokens = completion.usage?.prompt_tokens || 0;
      const outputTokens = completion.usage?.completion_tokens || 0;
      const cost = (inputTokens / 1000000 * 5) + (outputTokens / 1000000 * 15);

      return {
        response,
        responseTime,
        cost,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens
        }
      };

    } catch (error) {
      console.error('FastChatEngine error:', error);
      
      // Fallback response if API fails
      return {
        response: this.getFallbackResponse(challengeType),
        responseTime: Date.now() - startTime,
        cost: 0,
        tokensUsed: { input: 0, output: 0, total: 0 }
      };
    }
  }

  /**
   * Get recent conversation context for personalization
   */
  private async getConversationContext(userId: string): Promise<ConversationContext> {
    try {
      // Get session insights from psychological profile
      const sessionInsights = await getLastSessionInsights(userId);

      // Get last 3 conversation messages for context
      const recentConversations = await db.select({
        userInput: therapeuticConversations.userInput,
        aiResponse: therapeuticConversations.aiResponse
      })
      .from(therapeuticConversations)
      .where(eq(therapeuticConversations.userId, userId))
      .orderBy(desc(therapeuticConversations.createdAt))
      .limit(3);

      // Format recent messages
      const recentMessages: string[] = [];
      recentConversations.reverse().forEach(conv => {
        recentMessages.push(`User: ${conv.userInput}`);
        if (conv.aiResponse) {
          recentMessages.push(`Assistant: ${conv.aiResponse}`);
        }
      });

      return {
        recentMessages,
        sessionInsights
      };

    } catch (error) {
      console.error('Error getting conversation context:', error);
      return {
        recentMessages: [],
        sessionInsights: {
          framework: 'CBT',
          tone: 'neutral',
          state: 'uncertain',
          themes: []
        }
      };
    }
  }

  /**
   * Build optimized prompt for fast therapeutic response
   */
  private buildFastPrompt(
    userMessage: string,
    challengeType: string,
    context: ConversationContext
  ): { system: string; user: string } {
    const { sessionInsights, recentMessages } = context;
    
    const systemPrompt = `You are an expert therapeutic AI providing immediate, personalized support. 

THERAPEUTIC APPROACH:
- Framework: ${sessionInsights.framework}
- User's emotional state: ${sessionInsights.state}
- Communication tone: ${sessionInsights.tone}
- Key themes: ${sessionInsights.themes.join(', ') || 'None identified yet'}

RESPONSE GUIDELINES:
1. Provide immediate validation and understanding
2. Use ${sessionInsights.framework} techniques when appropriate
3. Match the user's emotional tone (${sessionInsights.tone})
4. Reference their key themes if relevant: ${sessionInsights.themes.join(', ')}
5. Keep response under 150 words for immediate delivery
6. Be warm, professional, and therapeutic
7. Ask one thoughtful follow-up question

CHALLENGE TYPE: ${challengeType}

${recentMessages.length > 0 ? `RECENT CONVERSATION CONTEXT:\n${recentMessages.join('\n')}\n` : ''}

Respond with therapeutic empathy and practical guidance.`;

    return {
      system: systemPrompt,
      user: userMessage
    };
  }

  /**
   * Provide fallback response if API fails
   */
  private getFallbackResponse(challengeType: string): string {
    const fallbacks = {
      anxiety: "I can sense you're feeling anxious right now. That's completely understandable. Let's take this one step at a time. What's feeling most overwhelming for you in this moment?",
      depression: "Thank you for sharing what you're going through. It takes courage to reach out when you're feeling this way. You're not alone in this. What would feel most supportive for you right now?",
      relationships: "Relationships can be complex and challenging. I appreciate you opening up about this situation. What aspect of this relationship dynamic feels most important to explore together?",
      stress: "It sounds like you're carrying a lot right now. Stress can feel overwhelming, but we can work together to find ways to manage it. What's contributing most to your stress lately?",
      general: "I hear what you're sharing, and I want you to know that your feelings are valid. Thank you for trusting me with this. What would be most helpful for you to explore right now?"
    };

    return fallbacks[challengeType as keyof typeof fallbacks] || fallbacks.general;
  }

  /**
   * Validate response quality before sending
   */
  private validateResponse(response: string): boolean {
    // Basic quality checks
    if (response.length < 20) return false;
    if (response.includes('I cannot') || response.includes('I\'m not able')) return false;
    if (response.includes('as an AI')) return false;
    
    return true;
  }
}

export const fastChatEngine = FastChatEngine.getInstance();