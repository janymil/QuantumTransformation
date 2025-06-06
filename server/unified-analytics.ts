import { db } from "./db";
import { aiResponseHistory } from "@shared/schema";
import { sql, eq, and, gte } from "drizzle-orm";

/**
 * Unified Analytics System
 * Single source of truth for all analytics data across the platform
 */
export class UnifiedAnalytics {
  
  /**
   * Get daily usage for a specific user
   */
  async getDailyUsage(userId: string): Promise<{
    todayRequests: number;
    weekRequests: number;
    monthRequests: number;
    totalRequests: number;
    dailyLimit: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get all user usage stats in one query
    const [todayCount] = await db
      .select({ count: sql`count(*)` })
      .from(aiResponseHistory)
      .where(and(
        eq(aiResponseHistory.userId, userId),
        gte(aiResponseHistory.createdAt, today)
      ));

    const [weekCount] = await db
      .select({ count: sql`count(*)` })
      .from(aiResponseHistory)
      .where(and(
        eq(aiResponseHistory.userId, userId),
        gte(aiResponseHistory.createdAt, startOfWeek)
      ));

    const [monthCount] = await db
      .select({ count: sql`count(*)` })
      .from(aiResponseHistory)
      .where(and(
        eq(aiResponseHistory.userId, userId),
        gte(aiResponseHistory.createdAt, startOfMonth)
      ));

    const [totalCount] = await db
      .select({ count: sql`count(*)` })
      .from(aiResponseHistory)
      .where(eq(aiResponseHistory.userId, userId));

    return {
      todayRequests: Number(todayCount.count) || 0,
      weekRequests: Number(weekCount.count) || 0,
      monthRequests: Number(monthCount.count) || 0,
      totalRequests: Number(totalCount.count) || 0,
      dailyLimit: 10 // Standard daily limit
    };
  }

  /**
   * Get comprehensive analytics for admin dashboard
   */
  async getAdminAnalytics(): Promise<{
    totalUsers: number;
    totalResponses: number;
    totalCost: number;
    averageResponseTime: number;
    averageQuality: number;
    highQualityPercentage: number;
    modelDistribution: Array<{
      model: string;
      count: number;
      cost: number;
    }>;
    topChallengeTypes: Array<{
      challengeType: string;
      count: number;
      cost: number;
    }>;
    userEngagement: {
      activeUsers: number;
      avgResponsesPerUser: number;
    };
    costSavings: number;
  }> {
    // Get total unique users
    const [userCount] = await db
      .select({ count: sql`count(distinct ${aiResponseHistory.userId})` })
      .from(aiResponseHistory);

    // Get total responses
    const [responseCount] = await db
      .select({ count: sql`count(*)` })
      .from(aiResponseHistory);

    // Calculate cost and model distribution from token data
    const [costData] = await db
      .select({
        totalTokens: sql`sum(coalesce(${aiResponseHistory.tokenCount}, 0))`,
        avgResponseTime: sql`avg(coalesce(${aiResponseHistory.responseTime}, 2000))`
      })
      .from(aiResponseHistory);

    // Get model distribution
    const modelStats = await db
      .select({
        model: aiResponseHistory.modelUsed,
        count: sql`count(*)`,
        tokens: sql`sum(coalesce(${aiResponseHistory.tokenCount}, 0))`
      })
      .from(aiResponseHistory)
      .where(sql`${aiResponseHistory.modelUsed} IS NOT NULL`)
      .groupBy(aiResponseHistory.modelUsed);

    const totalUsers = Number(userCount.count) || 0;
    const totalResponses = Number(responseCount.count) || 0;
    const totalTokens = Number(costData.totalTokens) || 0;
    
    // Calculate cost based on tokens (gpt-4o-mini pricing: $0.15 per 1M tokens)
    const totalCost = totalTokens * 0.00015 / 1000;

    return {
      totalUsers,
      totalResponses,
      totalCost,
      averageResponseTime: Number(costData.avgResponseTime) || 2000,
      modelDistribution: modelStats.map(m => ({
        model: m.model || 'unknown',
        count: Number(m.count) || 0,
        cost: (Number(m.tokens) || 0) * 0.00015 / 1000
      })),
      userEngagement: {
        activeUsers: totalUsers,
        avgResponsesPerUser: totalUsers > 0 ? Math.round(totalResponses / totalUsers) : 0
      },
      costSavings: 75 // Estimated savings from using gpt-4o-mini vs gpt-4o
    };
  }

  /**
   * Get usage stats in the format expected by existing components
   */
  async getUsageStats(userId: string): Promise<{
    dailyUsage: string;
    monthlyUsage: string;
    totalRequests: string;
    requestsToday: number;
    dailyLimit: number;
  }> {
    const usage = await this.getDailyUsage(userId);
    
    return {
      dailyUsage: usage.todayRequests.toString(),
      monthlyUsage: usage.monthRequests.toString(),
      totalRequests: usage.totalRequests.toString(),
      requestsToday: usage.todayRequests,
      dailyLimit: usage.dailyLimit
    };
  }
}

export const unifiedAnalytics = new UnifiedAnalytics();