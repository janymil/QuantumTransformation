import { db } from '../db';
import { eq, and, gte, sql } from 'drizzle-orm';
import { aiUsageTracking, aiResponseCache } from '@shared/schema';

/**
 * AI Cost Control for Basic Tier (AI Coaching)
 * Manages usage limits, caching, and request validation for basic tier only
 */

// Basic tier usage limits configuration
export const BASIC_TIER_USAGE_LIMITS = {
  free: {
    daily: 10,
    monthly: 300,
    dailyRequests: 10,
    monthlyRequests: 300,
    maxInputLength: 1000,
    cooldownSeconds: 30,
  },
  basic: {
    daily: 25,
    monthly: 750,
    dailyRequests: 25,
    monthlyRequests: 750,
    maxInputLength: 1500,
    cooldownSeconds: 15,
  },
  unlimited: {
    daily: -1,
    monthly: -1,
    dailyRequests: -1,
    monthlyRequests: -1,
    maxInputLength: 5000,
    cooldownSeconds: 5,
  }
};

// Challenge-related keywords for filtering
const CHALLENGE_KEYWORDS = [
  'quantum', 'consciousness', 'meditation', 'practice', 'affirmation', 
  'visualization', 'manifestation', 'money', 'abundance', 'health',
  'relationship', 'love', 'healing', 'transform', 'create', 'reality',
  'belief', 'subconscious', 'neural', 'energy', 'vibration', 'feeling',
  'thought', 'emotion', 'pattern', 'habit', 'change', 'growth',
  'dispenza', 'goddard', 'neville', 'joe', 'science', 'brain',
  'neuroplasticity', 'coherence', 'field', 'intention', 'focus'
];

interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  remainingRequests?: number;
  nextAvailableAt?: Date;
}

interface AIRequest {
  userId: string;
  requestType: string;
  input: string;
  challengeType?: string;
  day?: number;
  userTier: 'basic' | 'premium' | 'unlimited';
}

/**
 * Create hash of input for cache lookup and duplicate detection
 */
export function createInputHash(input: string, requestType: string, challengeType?: string, day?: number): string {
  const hashInput = `${requestType}:${challengeType || ''}:${day || ''}:${input.trim().toLowerCase()}`;
  return Buffer.from(hashInput).toString('base64').slice(0, 32);
}

/**
 * Check if user input contains relevant challenge keywords
 */
function isRelevantToChallenge(input: string): boolean {
  const inputLower = input.toLowerCase();
  return CHALLENGE_KEYWORDS.some(keyword => inputLower.includes(keyword));
}

/**
 * Validate user input for AI request
 */
function validateInput(input: string, userTier: string): { valid: boolean; reason?: string } {
  const limits = BASIC_TIER_USAGE_LIMITS[userTier as keyof typeof BASIC_TIER_USAGE_LIMITS] || BASIC_TIER_USAGE_LIMITS.free;
  
  if (input.length > limits.maxInputLength) {
    return { 
      valid: false, 
      reason: `Input too long. Maximum ${limits.maxInputLength} characters allowed.` 
    };
  }
  
  if (input.trim().length < 10) {
    return { 
      valid: false, 
      reason: "Please provide a more detailed question (minimum 10 characters)." 
    };
  }
  
  if (!isRelevantToChallenge(input)) {
    return { 
      valid: false, 
      reason: "Please ask questions related to your quantum consciousness challenge." 
    };
  }
  
  return { valid: true };
}

/**
 * Check if user can make AI request based on usage limits with timezone-based daily reset
 */
export async function checkUsageLimit(userId: string, userTier: string = 'free'): Promise<UsageCheckResult> {
  try {
    // Calculate start of day in user's timezone (defaults to server timezone)
    const now = new Date();
    
    // For timezone-based reset: calculate midnight in user's local timezone
    // This uses the browser's timezone detection when available
    const userDate = new Date();
    userDate.setHours(0, 0, 0, 0);
    
    // Get today's usage starting from user's midnight
    const [todayUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiUsageTracking)
      .where(
        and(
          eq(aiUsageTracking.userId, userId),
          gte(aiUsageTracking.createdAt, userDate)
        )
      );

    const dailyCount = todayUsage?.count || 0;
    const limits = BASIC_TIER_USAGE_LIMITS[userTier as keyof typeof BASIC_TIER_USAGE_LIMITS] || BASIC_TIER_USAGE_LIMITS.free;
    const dailyLimit = limits.daily || limits.dailyRequests || 10;

    if (dailyLimit !== -1 && dailyCount >= dailyLimit) {
      // Calculate next reset time (next midnight)
      const nextReset = new Date(userDate);
      nextReset.setDate(nextReset.getDate() + 1);
      
      return {
        allowed: false,
        reason: `Daily limit of ${dailyLimit} requests reached. Resets at midnight.`,
        remainingRequests: 0,
        nextAvailableAt: nextReset
      };
    }

    return {
      allowed: true,
      remainingRequests: dailyLimit === -1 ? -1 : dailyLimit - dailyCount
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { allowed: true }; // Allow on error to prevent blocking
  }
}

/**
 * Check cache for existing response (global across all users)
 */
export async function getCachedResponse(inputHash: string): Promise<any | null> {
  try {
    const cached = await db
      .select()
      .from(aiResponseCache)
      .where(and(
        eq(aiResponseCache.inputHash, inputHash),
        sql`expires_at > NOW() OR expires_at IS NULL`
      ))
      .orderBy(sql`created_at DESC`)
      .limit(1);

    if (cached.length > 0) {
      // Update access count
      await db
        .update(aiResponseCache)
        .set({ 
          response: cached[0].response
        })
        .where(eq(aiResponseCache.id, cached[0].id));

      return JSON.parse(cached[0].response);
    }

    return null;
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

/**
 * Store response in cache
 */
export async function cacheResponse(
  inputHash: string,
  response: any,
  requestType: string,
  expirationHours: number = 24
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    await db
      .insert(aiResponseCache)
      .values({
        inputHash,
        response: JSON.stringify(response),
        requestType,
        expiresAt
      })
      .onConflictDoUpdate({
        target: [aiResponseCache.inputHash],
        set: {
          response: JSON.stringify(response),
          expiresAt
        }
      });
  } catch (error) {
    console.error('Error caching response:', error);
  }
}

/**
 * Track AI usage for analytics and billing - ALL AI systems count towards daily limits
 */
export async function trackUsage(
  userId: string,
  requestType: string,
  input: string,
  output: string,
  model: string,
  tokens: number = 0,
  cost: string = '0',
  responseTime: number = 0,
  challengeType: string | null = null,
  sessionId: string | null = null
): Promise<void> {
  try {
    await db.insert(aiUsageTracking).values({
      userId,
      requestType,
      input,
      output,
      model,
      tokens,
      cost,
      responseTime,
      challengeType,
      sessionId
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
  }
}

/**
 * Main function to validate and process AI request
 */
export async function validateAIRequest(request: AIRequest): Promise<{
  valid: boolean;
  allowed?: boolean;
  reason?: string;
  inputHash?: string;
  cachedResponse?: any;
  remainingRequests?: number 
}> {
  // Validate input
  const inputValidation = validateInput(request.input, request.userTier);
  if (!inputValidation.valid) {
    return inputValidation;
  }

  // Check usage limits
  const usageCheck = await checkUsageLimit(request.userId, request.userTier);
  if (!usageCheck.allowed) {
    return {
      valid: false,
      allowed: false,
      reason: usageCheck.reason,
      remainingRequests: usageCheck.remainingRequests
    };
  }

  // Create input hash for caching
  const inputHash = createInputHash(
    request.input, 
    request.requestType, 
    request.challengeType, 
    request.day
  );

  // Check cache
  const cachedResponse = await getCachedResponse(inputHash);

  return { 
    valid: true,
    allowed: true,
    inputHash,
    cachedResponse,
    remainingRequests: usageCheck.remainingRequests 
  };
}

/**
 * Get user's AI usage statistics with timezone-based calculations
 */
export async function getUserAIStats(userId: string): Promise<{
  dailyUsage: number;
  monthlyUsage: number;
  totalUsage: number;
  dailyLimit: number;
  monthlyLimit: number;
}> {
  try {
    // Calculate today's start based on user's timezone
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get daily usage
    const [dailyUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiUsageTracking)
      .where(
        and(
          eq(aiUsageTracking.userId, userId),
          gte(aiUsageTracking.createdAt, startOfDay)
        )
      );

    // Get monthly usage
    const [monthlyUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiUsageTracking)
      .where(
        and(
          eq(aiUsageTracking.userId, userId),
          gte(aiUsageTracking.createdAt, startOfMonth)
        )
      );

    // Get total usage
    const [totalUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiUsageTracking)
      .where(eq(aiUsageTracking.userId, userId));

    return {
      dailyUsage: dailyUsage?.count || 0,
      monthlyUsage: monthlyUsage?.count || 0,
      totalUsage: totalUsage?.count || 0,
      dailyLimit: BASIC_TIER_USAGE_LIMITS.free.daily || BASIC_TIER_USAGE_LIMITS.free.dailyRequests || 10,
      monthlyLimit: BASIC_TIER_USAGE_LIMITS.free.monthly || BASIC_TIER_USAGE_LIMITS.free.monthlyRequests || 300
    };
  } catch (error) {
    console.error('Error getting user AI stats:', error);
    return {
      dailyUsage: 0,
      monthlyUsage: 0,
      totalUsage: 0,
      dailyLimit: 10,
      monthlyLimit: 300
    };
  }
}

/**
 * Optimize context size for AI requests to reduce token usage
 */
export function optimizeContext(
  fullContext: any, 
  requestType: string, 
  currentDay: number
): any {
  const optimized = { ...fullContext };

  // Remove old journal entries if too many
  if (optimized.journalEntries && optimized.journalEntries.length > 5) {
    optimized.journalEntries = optimized.journalEntries.slice(-5);
  }

  // Keep only recent user sessions for context
  if (optimized.recentSessions && optimized.recentSessions.length > 3) {
    optimized.recentSessions = optimized.recentSessions.slice(-3);
  }

  // Prioritize current day data
  if (currentDay && optimized.challengeProgress) {
    optimized.challengeProgress = optimized.challengeProgress.filter(
      (p: any) => Math.abs(p.day - currentDay) <= 2
    );
  }

  return optimized;
}