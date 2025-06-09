/**
 * Enhanced Caching System
 * Provides intelligent caching strategies for AI responses and API optimization
 */

import { db } from './db';
import { eq, and, gte } from 'drizzle-orm';
import { aiResponseCache } from '@shared/schema';

export interface CacheStrategy {
  useCache: boolean;
  cacheKey: string;
  ttlHours: number;
  strategy: 'template' | 'personalized' | 'global' | 'none';
}

export interface CacheAnalytics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageResponseTime: number;
  costSavings: number;
}

/**
 * Determine optimal caching strategy based on request type and content
 */
export function determineCacheStrategy(
  requestType: string,
  userInput: string,
  userId?: string
): CacheStrategy {
  const inputLength = userInput.length;
  const isGeneric = isGenericQuery(userInput);
  
  // Template responses for common generic queries
  if (isGeneric && inputLength < 100) {
    return {
      useCache: true,
      cacheKey: `template_${requestType}_${hashString(userInput)}`,
      ttlHours: 168, // 1 week for templates
      strategy: 'template'
    };
  }
  
  // Personalized caching for specific users
  if (userId && inputLength < 500) {
    return {
      useCache: true,
      cacheKey: `user_${userId}_${requestType}_${hashString(userInput)}`,
      ttlHours: 24, // 1 day for personalized
      strategy: 'personalized'
    };
  }
  
  // Global caching for educational content
  if (requestType === 'explanation' || requestType === 'wellness_tip') {
    return {
      useCache: true,
      cacheKey: `global_${requestType}_${hashString(userInput)}`,
      ttlHours: 72, // 3 days for educational
      strategy: 'global'
    };
  }
  
  // No caching for therapeutic/personal content
  return {
    useCache: false,
    cacheKey: '',
    ttlHours: 0,
    strategy: 'none'
  };
}

/**
 * Get cached response if available and not expired
 */
export async function getCachedResponse(cacheKey: string): Promise<string | null> {
  try {
    const cached = await db
      .select()
      .from(aiResponseCache)
      .where(
        and(
          eq(aiResponseCache.inputHash, cacheKey),
          gte(aiResponseCache.expiresAt, new Date())
        )
      )
      .limit(1);
    
    return cached[0]?.response || null;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
}

/**
 * Store response in cache with expiration
 */
export async function setCachedResponse(
  cacheKey: string,
  response: string,
  requestType: string,
  ttlHours: number
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    
    await db
      .insert(aiResponseCache)
      .values({
        inputHash: cacheKey,
        response,
        requestType,
        expiresAt
      })
      .onConflictDoUpdate({
        target: aiResponseCache.inputHash,
        set: {
          response,
          expiresAt,
          createdAt: new Date()
        }
      });
  } catch (error) {
    console.error('Cache storage error:', error);
  }
}

/**
 * Get template response for common queries
 */
export function getTemplateResponse(requestType: string, userInput: string): string | null {
  const templates = {
    greeting: "Hello! I'm here to support your personal growth journey. What would you like to explore today?",
    help: "I can help you with personal development, emotional guidance, goal setting, and mindfulness practices. What specific area interests you?",
    motivation: "Remember that every small step forward is progress. You have the strength within you to overcome challenges and grow.",
    gratitude: "Practicing gratitude is a powerful way to shift your perspective. What are three things you're grateful for today?"
  };
  
  const normalizedInput = userInput.toLowerCase().trim();
  
  // Simple keyword matching for template selection
  if (normalizedInput.includes('hello') || normalizedInput.includes('hi')) {
    return templates.greeting;
  }
  if (normalizedInput.includes('help') || normalizedInput.includes('what can you do')) {
    return templates.help;
  }
  if (normalizedInput.includes('motivation') || normalizedInput.includes('inspire')) {
    return templates.motivation;
  }
  if (normalizedInput.includes('grateful') || normalizedInput.includes('gratitude')) {
    return templates.gratitude;
  }
  
  return null;
}

/**
 * Get caching analytics and performance metrics
 */
export async function getCacheAnalytics(): Promise<CacheAnalytics> {
  try {
    // In a real implementation, this would track hit/miss ratios
    // For now, return mock analytics structure
    return {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      averageResponseTime: 0,
      costSavings: 0
    };
  } catch (error) {
    console.error('Analytics error:', error);
    return {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      averageResponseTime: 0,
      costSavings: 0
    };
  }
}

/**
 * Initialize enhanced caching system
 */
export async function initializeEnhancedCaching(): Promise<void> {
  console.log('Enhanced caching system initialized');
  // Cleanup expired cache entries periodically
  setInterval(cleanupExpiredCache, 60 * 60 * 1000); // Every hour
}

/**
 * Helper Functions
 */

function isGenericQuery(input: string): boolean {
  const genericPatterns = [
    /^(hi|hello|hey)/i,
    /^(help|what can you)/i,
    /^(how are you)/i,
    /^(thank you|thanks)/i,
    /^(goodbye|bye)/i
  ];
  
  return genericPatterns.some(pattern => pattern.test(input.trim()));
}

function hashString(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

async function cleanupExpiredCache(): Promise<void> {
  try {
    await db
      .delete(aiResponseCache)
      .where(gte(new Date(), aiResponseCache.expiresAt));
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}