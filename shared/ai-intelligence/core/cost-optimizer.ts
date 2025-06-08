/**
 * Cost Optimizer for AI Intelligence Layer
 * Handles caching, cost tracking, and optimization strategies
 */

import { db } from "../../../server/db";
import { aiResponseCache, aiUsageTracking } from "@shared/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import crypto from 'crypto';
import { AIRequest, AIResponse } from './intelligent-router';

export interface CacheEntry {
  content: string;
  modelUsed: string;
  provider: string;
  cost: number;
  timestamp: Date;
}

export interface UsageStats {
  totalCost: number;
  totalRequests: number;
  cacheHitRate: number;
  costSavings: number;
  averageCostPerRequest: number;
  routingBreakdown: {
    local: { requests: number; percentage: number };
    openai: { requests: number; cost: number; percentage: number };
    anthropic: { requests: number; cost: number; percentage: number };
  };
}

export class CostOptimizer {

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: AIRequest): string {
    const cacheData = {
      prompt: request.prompt,
      systemPrompt: request.systemPrompt,
      sessionType: request.context.sessionType,
      userTier: request.context.userTier,
      temperature: request.options?.temperature || 0.7
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(cacheData))
      .digest('hex');
  }

  /**
   * Check cache for existing response
   */
  async checkCache(request: AIRequest): Promise<CacheEntry | null> {
    try {
      const cacheKey = this.generateCacheKey(request);
      
      const cached = await db.select()
        .from(aiResponseCache)
        .where(and(
          eq(aiResponseCache.inputHash, cacheKey),
          gte(aiResponseCache.expiresAt, new Date())
        ))
        .limit(1);

      if (cached.length > 0) {
        const entry = cached[0];
        return {
          content: JSON.parse(entry.response).content,
          modelUsed: JSON.parse(entry.response).modelUsed || 'cached',
          provider: JSON.parse(entry.response).provider || 'cache',
          cost: 0,
          timestamp: entry.createdAt || new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('Cache check error:', error);
      return null;
    }
  }

  /**
   * Cache response for future use
   */
  async cacheResponse(request: AIRequest, response: AIResponse): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const expirationHours = this.getCacheExpirationHours(request);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      const cacheData = {
        content: response.content,
        modelUsed: response.metadata.modelUsed,
        provider: response.metadata.provider,
        cost: response.metadata.cost,
        metadata: response.metadata
      };

      await db.insert(aiResponseCache).values({
        inputHash: cacheKey,
        response: JSON.stringify(cacheData),
        requestType: `${request.context.sessionType}_${request.context.userTier}`,
        expiresAt,
        createdAt: new Date()
      }).onConflictDoUpdate({
        target: [aiResponseCache.inputHash],
        set: {
          response: JSON.stringify(cacheData),
          expiresAt,
          hitCount: sql`${aiResponseCache.hitCount} + 1`
        }
      });

    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  /**
   * Track usage and costs
   */
  async trackUsage(
    userId: string, 
    request: AIRequest, 
    response: AIResponse
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Use existing aiUsageTracking schema
      const inputTokens = this.estimateTokens(request.prompt + request.systemPrompt);
      const outputTokens = this.estimateTokens(response.content);
      
      await db.insert(aiUsageTracking).values({
        userId,
        requestType: request.context.sessionType,
        challengeType: request.context.sessionType,
        day: parseInt(today.replace(/-/g, '')), // Convert YYYY-MM-DD to YYYYMMDD
        model: response.metadata.modelUsed,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost: response.metadata.cost.toString(),
        responseTime: response.metadata.processingTime,
        requestHash: this.generateCacheKey(request),
        wasFromCache: response.metadata.fromCache,
        modelSelected: 'intelligent_routing',
        complexityScore: request.context.complexity === 'simple' ? 3 : request.context.complexity === 'complex' ? 8 : 5,
        qualityScore: 8,
        createdAt: new Date()
      });

    } catch (error) {
      console.error('Usage tracking error:', error);
    }
  }

  /**
   * Get cache expiration hours based on request type
   */
  private getCacheExpirationHours(request: AIRequest): number {
    // Therapeutic chat - shorter cache (more personalized)
    if (request.context.sessionType === 'therapeutic_chat') {
      return request.context.requiresPersonalization ? 1 : 4;
    }

    // AI coaching - longer cache (more standard responses)
    if (request.context.sessionType === 'ai_coaching') {
      return 24; // 24 hours for coaching responses
    }

    return 12; // Default 12 hours
  }

  /**
   * Estimate token count for cost calculations
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Get routing statistics for user
   */
  async getRoutingStats(
    userId: string, 
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<UsageStats> {
    try {
      const daysBack = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const usage = await db.select()
        .from(aiUsageTracking)
        .where(and(
          eq(aiUsageTracking.userId, userId),
          gte(aiUsageTracking.createdAt, startDate)
        ))
        .orderBy(desc(aiUsageTracking.createdAt));

      const totalRequests = usage.length;
      const totalCost = usage.reduce((sum, entry) => sum + Number(entry.cost), 0);
      const cacheHits = usage.filter(entry => entry.wasFromCache).length;
      const cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

      // Calculate cost savings from cache hits
      const averageCostPerRequest = totalRequests > 0 ? totalCost / (totalRequests - cacheHits) : 0;
      const costSavings = cacheHits * averageCostPerRequest;

      // Routing breakdown (using model field as proxy for provider)
      const routingBreakdown = {
        local: {
          requests: usage.filter(u => u.model.includes('local')).length,
          percentage: 0
        },
        openai: {
          requests: usage.filter(u => u.model.includes('gpt')).length,
          cost: usage.filter(u => u.model.includes('gpt')).reduce((sum, u) => sum + Number(u.cost), 0),
          percentage: 0
        },
        anthropic: {
          requests: usage.filter(u => u.model.includes('claude')).length,
          cost: usage.filter(u => u.model.includes('claude')).reduce((sum, u) => sum + Number(u.cost), 0),
          percentage: 0
        }
      };

      if (totalRequests > 0) {
        routingBreakdown.local.percentage = (routingBreakdown.local.requests / totalRequests) * 100;
        routingBreakdown.openai.percentage = (routingBreakdown.openai.requests / totalRequests) * 100;
        routingBreakdown.anthropic.percentage = (routingBreakdown.anthropic.requests / totalRequests) * 100;
      }

      return {
        totalCost,
        totalRequests,
        cacheHitRate: cacheHitRate * 100, // Convert to percentage
        costSavings,
        averageCostPerRequest,
        routingBreakdown
      };

    } catch (error) {
      console.error('Error getting routing stats:', error);
      return {
        totalCost: 0,
        totalRequests: 0,
        cacheHitRate: 0,
        costSavings: 0,
        averageCostPerRequest: 0,
        routingBreakdown: {
          local: { requests: 0, percentage: 0 },
          openai: { requests: 0, cost: 0, percentage: 0 },
          anthropic: { requests: 0, cost: 0, percentage: 0 }
        }
      };
    }
  }

  /**
   * Get platform-wide cost optimization insights
   */
  async getPlatformOptimizationInsights(): Promise<{
    totalCostSavings: number;
    optimalRoutingRate: number;
    recommendedLocalModelUsage: number;
    costEfficiencyScore: number;
  }> {
    try {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const platformUsage = await db.select()
        .from(aiUsageTracking)
        .where(gte(aiUsageTracking.createdAt, last30Days));

      const totalRequests = platformUsage.length;
      const localRequests = platformUsage.filter(u => u.provider === 'local').length;
      const cacheHits = platformUsage.filter(u => u.isFromCache).length;
      const totalCost = platformUsage.reduce((sum, entry) => sum + Number(entry.cost), 0);

      const localUsageRate = totalRequests > 0 ? (localRequests / totalRequests) * 100 : 0;
      const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
      
      // Estimate cost savings from local models and caching
      const averageExternalCost = 0.006; // Average external API cost
      const costSavings = (localRequests + cacheHits) * averageExternalCost;

      // Cost efficiency score (0-100)
      const costEfficiencyScore = Math.min(100, localUsageRate + cacheHitRate);

      return {
        totalCostSavings: costSavings,
        optimalRoutingRate: localUsageRate,
        recommendedLocalModelUsage: Math.max(40, localUsageRate + 10), // Recommend 10% increase
        costEfficiencyScore
      };

    } catch (error) {
      console.error('Error getting platform optimization insights:', error);
      return {
        totalCostSavings: 0,
        optimalRoutingRate: 0,
        recommendedLocalModelUsage: 40,
        costEfficiencyScore: 0
      };
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<void> {
    try {
      await db.delete(aiResponseCache)
        .where(sql`${aiResponseCache.expiresAt} < NOW()`);
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

export const costOptimizer = new CostOptimizer();