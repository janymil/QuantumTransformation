import { db } from "./db";
import { eq, and, gte, sql } from "drizzle-orm";
import { pgTable, serial, varchar, integer, timestamp, text, boolean } from "drizzle-orm/pg-core";

// AI Usage tracking table
export const aiUsageTracking = pgTable("ai_usage_tracking", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  requestType: varchar("request_type").notNull(), // 'explanation', 'coaching', 'analysis', etc.
  inputHash: varchar("input_hash"), // Hash of input to detect duplicates
  tokensUsed: integer("tokens_used").default(0),
  cost: integer("cost").default(0), // in cents
  isFromCache: boolean("is_from_cache").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Response cache table
export const aiResponseCache = pgTable("ai_response_cache", {
  id: serial("id").primaryKey(),
  inputHash: varchar("input_hash").unique().notNull(),
  requestType: varchar("request_type").notNull(),
  challengeType: varchar("challenge_type"),
  day: integer("day"),
  response: text("response").notNull(),
  tokensUsed: integer("tokens_used").default(0),
  userId: varchar("user_id").notNull(), // Track who originally asked
  hitCount: integer("hit_count").default(0), // Track how many times this response was reused
  lastHitAt: timestamp("last_hit_at"), // When this was last accessed
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage limits configuration
export const USAGE_LIMITS = {
  basic: {
    dailyRequests: 3,
    monthlyRequests: 90,
    maxInputLength: 500,
    cooldownSeconds: 120, // 2 minutes
  },
  premium: {
    dailyRequests: 25,
    monthlyRequests: 750,
    maxInputLength: 1500,
    cooldownSeconds: 30,
  },
  unlimited: {
    dailyRequests: -1, // unlimited
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
  const hashInput = `${requestType}:${challengeType || 'none'}:${day || 0}:${input.toLowerCase().trim()}`;
  
  // Simple hash function for input deduplication
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
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
  const limits = USAGE_LIMITS[userTier as keyof typeof USAGE_LIMITS] || USAGE_LIMITS.free;
  
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
 * Check if user can make AI request based on usage limits
 */
export async function checkUsageLimit(userId: string, userTier: string = 'free'): Promise<UsageCheckResult> {
  try {
    // Use user's timezone to calculate start of day
    const now = new Date();
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Get current date in user's timezone
    const userDate = new Date(now.toLocaleString("en-US", {timeZone: userTimezone}));
    const startOfUserDay = new Date(userDate.getFullYear(), userDate.getMonth(), userDate.getDate());
    
    // Convert back to UTC for database comparison
    const startOfDayUTC = new Date(startOfUserDay.getTime() - (startOfUserDay.getTimezoneOffset() * 60000));
    
    // Get today's usage based on user's timezone
    const [todayUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiUsageTracking)
      .where(
        and(
          eq(aiUsageTracking.userId, userId),
          gte(aiUsageTracking.createdAt, startOfDayUTC)
        )
      );

    const dailyCount = todayUsage?.count || 0;
    const limits = USAGE_LIMITS[userTier as keyof typeof USAGE_LIMITS] || USAGE_LIMITS.free;
    const limit = limits.daily;

    if (dailyCount >= limit) {
      // Calculate next available time (start of next day in user's timezone)
      const nextUserDay = new Date(startOfUserDay);
      nextUserDay.setDate(nextUserDay.getDate() + 1);
      const nextDayUTC = new Date(nextUserDay.getTime() - (nextUserDay.getTimezoneOffset() * 60000));
      
      return {
        allowed: false,
        reason: `Daily limit of ${limit} requests reached. Resets at midnight in your timezone.`,
        remainingRequests: 0,
        nextAvailableAt: nextDayUTC
      };
    }
  
  // Check cooldown
  const lastRequest = await db
    .select()
    .from(aiUsageTracking)
    .where(eq(aiUsageTracking.userId, userId))
    .orderBy(sql`created_at DESC`)
    .limit(1);
  
  if (lastRequest.length > 0) {
    const timeSinceLastRequest = Date.now() - new Date(lastRequest[0].createdAt!).getTime();
    const cooldownMs = limits.cooldownSeconds * 1000;
    
    if (timeSinceLastRequest < cooldownMs) {
      const nextAvailable = new Date(new Date(lastRequest[0].createdAt!).getTime() + cooldownMs);
      return {
        allowed: false,
        reason: `Please wait ${Math.ceil((cooldownMs - timeSinceLastRequest) / 1000)} seconds before next request.`,
        nextAvailableAt: nextAvailable
      };
    }
  }
  
  return {
    allowed: true,
    remainingRequests: limits.dailyRequests - dailyCount - 1
  };
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
      // Update hit count and last accessed time
      await db
        .update(aiResponseCache)
        .set({ 
          hitCount: sql`${aiResponseCache.hitCount} + 1`,
          lastHitAt: new Date()
        })
        .where(eq(aiResponseCache.id, cached[0].id));
      
      const response = JSON.parse(cached[0].response);
      return {
        ...response,
        fromCache: true,
        cacheId: cached[0].id,
        originallyAskedBy: cached[0].userId,
        hitCount: cached[0].hitCount + 1,
        originalDate: cached[0].createdAt
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error checking cache:", error);
    return null;
  }
}

/**
 * Store response in cache
 */
export async function cacheResponse(
  inputHash: string, 
  requestType: string, 
  response: any, 
  userId: string,
  challengeType?: string, 
  day?: number,
  tokensUsed: number = 0
): Promise<void> {
  // Set expiration: common queries cache longer, specific queries shorter
  const expiresAt = new Date();
  if (requestType === 'explanation' && day) {
    expiresAt.setDate(expiresAt.getDate() + 30); // Day explanations cache for 30 days
  } else if (requestType === 'coaching') {
    expiresAt.setHours(expiresAt.getHours() + 24); // Coaching cache for 24 hours
  } else {
    expiresAt.setHours(expiresAt.getHours() + 12); // Default 12 hours
  }
  
  await db.insert(aiResponseCache).values({
    inputHash,
    requestType,
    challengeType,
    day,
    response: JSON.stringify(response),
    tokensUsed,
    userId,
    hitCount: 0,
    expiresAt
  }).onConflictDoUpdate({
    target: aiResponseCache.inputHash,
    set: {
      response: JSON.stringify(response),
      tokensUsed,
      expiresAt,
      userId // Update to latest user who asked
    }
  });
}

/**
 * Track AI usage for analytics and billing
 */
export async function trackUsage(
  userId: string, 
  requestType: string, 
  inputHash: string, 
  tokensUsed: number, 
  cost: number
): Promise<void> {
  await db.insert(aiUsageTracking).values({
    userId,
    requestType,
    inputHash,
    tokensUsed,
    cost,
    isFromCache: false
  });
}

/**
 * Main function to validate and process AI request
 */
export async function validateAIRequest(request: AIRequest): Promise<{
  allowed: boolean;
  inputHash?: string;
  cachedResponse?: any;
  reason?: string;
  remainingRequests?: number;
}> {
  // 1. Validate input
  const inputValidation = validateInput(request.input, request.userTier);
  if (!inputValidation.valid) {
    return { allowed: false, reason: inputValidation.reason };
  }
  
  // 2. Check usage limits
  const usageCheck = await checkUsageLimit(request.userId, request.userTier);
  if (!usageCheck.allowed) {
    return { allowed: false, reason: usageCheck.reason, remainingRequests: usageCheck.remainingRequests };
  }
  
  // 3. Create input hash and check cache
  const inputHash = createInputHash(request.input, request.requestType, request.challengeType, request.day);
  const cachedResponse = await getCachedResponse(inputHash);
  
  if (cachedResponse) {
    return { 
      allowed: true, 
      inputHash, 
      cachedResponse,
      remainingRequests: usageCheck.remainingRequests 
    };
  }
  
  return { 
    allowed: true, 
    inputHash,
    remainingRequests: usageCheck.remainingRequests 
  };
}

/**
 * Get user's AI usage statistics
 */
export async function getUserAIStats(userId: string): Promise<{
  dailyUsage: number;
  monthlyUsage: number;
  totalUsage: number;
  dailyLimit: number;
  monthlyLimit: number;
}> {
  try {
    // Use user's timezone to calculate start of day and month
    const now = new Date();
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Create start of day and month in user's timezone
    const userDate = new Date(now.toLocaleString("en-US", {timeZone: userTimezone}));
    const startOfUserDay = new Date(userDate.getFullYear(), userDate.getMonth(), userDate.getDate());
    const startOfUserMonth = new Date(userDate.getFullYear(), userDate.getMonth(), 1);
    
    // Convert to UTC for database queries
    const startOfDayUTC = new Date(startOfUserDay.getTime() - (startOfUserDay.getTimezoneOffset() * 60000));
    const startOfMonthUTC = new Date(startOfUserMonth.getTime() - (startOfUserMonth.getTimezoneOffset() * 60000));

    // Get daily usage
    const [dailyUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiUsageTracking)
      .where(
        and(
          eq(aiUsageTracking.userId, userId),
          gte(aiUsageTracking.createdAt, startOfDayUTC)
        )
      );

    // Get monthly usage
    const [monthlyUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiUsageTracking)
      .where(
        and(
          eq(aiUsageTracking.userId, userId),
          gte(aiUsageTracking.createdAt, startOfMonthUTC)
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
      dailyLimit: USAGE_LIMITS.free.daily,
      monthlyLimit: USAGE_LIMITS.free.monthly
    };
  } catch (error) {
    console.error('Error getting user AI stats:', error);
    return {
      dailyUsage: 0,
      monthlyUsage: 0,
      totalUsage: 0,
      dailyLimit: USAGE_LIMITS.free.daily,
      monthlyLimit: USAGE_LIMITS.free.monthly
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
  
  // Limit journal entries to recent ones
  if (optimized.journalEntries && optimized.journalEntries.length > 5) {
    optimized.journalEntries = optimized.journalEntries
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5); // Keep only 5 most recent
  }
  
  // Limit progress data to current week
  if (optimized.completedDays && optimized.completedDays.length > 7) {
    const weekStart = Math.max(1, currentDay - 6);
    optimized.completedDays = optimized.completedDays.filter((day: number) => day >= weekStart);
  }
  
  // For explanations, only include current day content
  if (requestType === 'explanation') {
    optimized.relevantDays = [currentDay];
  }
  
  return optimized;
}