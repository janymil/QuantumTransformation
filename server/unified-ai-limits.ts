/**
 * Unified AI Usage Tracking and Daily Limits System
 * ALL AI systems count towards user's daily AI usage limits
 */

import { db } from './db';
import { eq, and, gte, sql, count } from 'drizzle-orm';
import { aiUsageTracking } from '@shared/schema';

// Daily AI usage limits by tier
export const DAILY_AI_LIMITS = {
  free: 10,
  basic: 25, 
  premium: 50,
  unlimited: -1 // No limit
};

/**
 * Check if user has reached their daily AI limit
 * This includes ALL AI systems: OpenAI, ElevenLabs, Vision Board AI, etc.
 */
export async function checkDailyAILimit(userId: string, userTier: string = 'free'): Promise<{
  allowed: boolean;
  remainingRequests: number;
  totalUsed: number;
  dailyLimit: number;
  nextResetAt: Date;
}> {
  try {
    const dailyLimit = DAILY_AI_LIMITS[userTier as keyof typeof DAILY_AI_LIMITS] || DAILY_AI_LIMITS.free;
    
    // If unlimited tier, always allow
    if (dailyLimit === -1) {
      return {
        allowed: true,
        remainingRequests: -1,
        totalUsed: 0,
        dailyLimit: -1,
        nextResetAt: getTomorrowMidnight()
      };
    }

    // Get today's usage count across ALL AI systems
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const usageResult = await db
      .select({ count: count() })
      .from(aiUsageTracking)
      .where(and(
        eq(aiUsageTracking.userId, userId),
        gte(aiUsageTracking.createdAt, today)
      ));

    const totalUsed = usageResult[0]?.count || 0;
    const remainingRequests = Math.max(0, dailyLimit - totalUsed);
    const allowed = totalUsed < dailyLimit;

    return {
      allowed,
      remainingRequests,
      totalUsed,
      dailyLimit,
      nextResetAt: getTomorrowMidnight()
    };

  } catch (error) {
    console.error('Error checking daily AI limit:', error);
    // On error, allow but with conservative limits
    return {
      allowed: true,
      remainingRequests: 1,
      totalUsed: 0,
      dailyLimit: DAILY_AI_LIMITS.free,
      nextResetAt: getTomorrowMidnight()
    };
  }
}

/**
 * Track ANY AI usage - this counts towards daily limits
 */
export async function trackAIUsage(
  userId: string,
  aiSystem: 'openai-chat' | 'openai-image' | 'elevenlabs-tts' | 'vision-board-ai' | 'ai-couch' | 'coaching-ai',
  requestType: string,
  input: string,
  output: string,
  model: string,
  cost: string = '0',
  metadata: any = {}
): Promise<void> {
  try {
    await db.insert(aiUsageTracking).values({
      userId,
      requestType: `${aiSystem}:${requestType}`,
      input: input.substring(0, 1000), // Limit input length for storage
      output: output.substring(0, 2000), // Limit output length for storage
      model,
      cost,
      tokens: metadata.tokens || 0,
      responseTime: metadata.responseTime || 0
    });
  } catch (error) {
    console.error('Error tracking AI usage:', error);
  }
}

/**
 * Get user's daily AI usage statistics
 */
export async function getDailyAIStats(userId: string): Promise<{
  totalRequests: number;
  openaiRequests: number;
  elevenlabsRequests: number;
  visionBoardRequests: number;
  aiCouchRequests: number;
  totalCost: number;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await db
      .select()
      .from(aiUsageTracking)
      .where(and(
        eq(aiUsageTracking.userId, userId),
        gte(aiUsageTracking.createdAt, today)
      ));

    const stats = {
      totalRequests: usage.length,
      openaiRequests: usage.filter(u => u.requestType.includes('openai')).length,
      elevenlabsRequests: usage.filter(u => u.requestType.includes('elevenlabs')).length,
      visionBoardRequests: usage.filter(u => u.requestType.includes('vision-board')).length,
      aiCouchRequests: usage.filter(u => u.requestType.includes('ai-couch')).length,
      totalCost: usage.reduce((sum, u) => sum + parseFloat(u.cost || '0'), 0)
    };

    return stats;

  } catch (error) {
    console.error('Error getting daily AI stats:', error);
    return {
      totalRequests: 0,
      openaiRequests: 0,
      elevenlabsRequests: 0,
      visionBoardRequests: 0,
      aiCouchRequests: 0,
      totalCost: 0
    };
  }
}

/**
 * Validate AI request against daily limits
 */
export async function validateAIRequest(userId: string, userTier: string = 'free'): Promise<{
  allowed: boolean;
  reason?: string;
  remainingRequests?: number;
}> {
  const limitCheck = await checkDailyAILimit(userId, userTier);
  
  if (!limitCheck.allowed) {
    return {
      allowed: false,
      reason: `Daily AI limit reached (${limitCheck.dailyLimit} requests). Resets at midnight.`,
      remainingRequests: 0
    };
  }

  return {
    allowed: true,
    remainingRequests: limitCheck.remainingRequests
  };
}

/**
 * Get tomorrow at midnight for reset time
 */
function getTomorrowMidnight(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Get user's subscription tier (placeholder - implement based on your user system)
 */
export function getUserTier(userId: string): string {
  // TODO: Implement actual tier checking based on user subscription
  return 'free'; // Default to free tier
}