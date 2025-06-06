import { db } from "./db";
import { aiUsageTracking } from "@shared/schema";
import { sql } from "drizzle-orm";
import crypto from "crypto";

interface AIUsageData {
  userId: string;
  requestType: string; // 'coaching', 'questions', 'chat', 'explanation'
  challengeType?: string;
  day?: number;
  
  // Request details
  model: string; // 'gpt-4o', 'gpt-4o-mini'
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number; // Cost in dollars
  
  // Performance metrics
  responseTime: number; // milliseconds
  requestInput: string; // For hash generation
  wasFromCache: boolean;
  
  // Quality and routing
  modelSelected: string; // 'intelligent_routing', 'manual_selection'
  complexityScore?: number; // 1-10 scale
  qualityScore?: number; // 1-10 scale
  
  // Metadata
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
}

/**
 * Track every AI request for comprehensive analytics
 * This runs independently of conversation saving
 */
export async function trackAIUsage(data: AIUsageData): Promise<void> {
  try {
    // Generate request hash for duplicate detection
    const requestHash = crypto
      .createHash('sha256')
      .update(`${data.userId}-${data.requestInput}-${data.requestType}`)
      .digest('hex')
      .substring(0, 16);

    // Insert usage data
    await db.insert(aiUsageTracking).values({
      userId: data.userId,
      requestType: data.requestType,
      challengeType: data.challengeType,
      day: data.day,
      model: data.model,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      totalTokens: data.totalTokens,
      cost: data.cost.toString(), // Convert to string for decimal type
      responseTime: data.responseTime,
      requestHash,
      wasFromCache: data.wasFromCache,
      modelSelected: data.modelSelected,
      complexityScore: data.complexityScore || 5,
      qualityScore: data.qualityScore || 8,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      sessionId: data.sessionId,
    });

    console.log(`✓ AI Usage tracked: ${data.model} | ${data.totalTokens} tokens | $${data.cost.toFixed(6)}`);
  } catch (error) {
    console.error("Error tracking AI usage:", error);
    // Don't throw error to avoid disrupting the main AI request
  }
}

/**
 * Calculate token costs based on model and usage
 */
export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  // OpenAI pricing as of 2024 (per 1M tokens)
  const pricing = {
    'gpt-4o': {
      input: 2.50,  // $2.50 per 1M input tokens
      output: 10.00 // $10.00 per 1M output tokens
    },
    'gpt-4o-mini': {
      input: 0.15,  // $0.15 per 1M input tokens
      output: 0.60  // $0.60 per 1M output tokens
    }
  };

  const modelPricing = pricing[model as keyof typeof pricing] || pricing['gpt-4o'];
  
  const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output;
  
  return inputCost + outputCost;
}

/**
 * Get comprehensive analytics from usage tracking
 * Falls back to saved conversations if usage tracking is not available
 */
export async function getUsageAnalytics() {
  try {
    // Import the existing schema
    const { aiResponseHistory, users } = await import("@shared/schema");
    
    // Try to get analytics from usage tracking first
    try {
      const totalUsers = await db
        .selectDistinct({ userId: aiUsageTracking.userId })
        .from(aiUsageTracking);

      if (totalUsers.length > 0) {
        // We have usage tracking data
        const totalStats = await db
          .select({
            totalRequests: sql`count(*)`,
            totalCost: sql`sum(${aiUsageTracking.cost})`,
            avgResponseTime: sql`avg(${aiUsageTracking.responseTime})`,
            avgQuality: sql`avg(${aiUsageTracking.qualityScore})`,
          })
          .from(aiUsageTracking);

        const modelDistribution = await db
          .select({
            model: aiUsageTracking.model,
            count: sql`count(*)`,
            totalCost: sql`sum(${aiUsageTracking.cost})`,
            avgResponseTime: sql`avg(${aiUsageTracking.responseTime})`,
          })
          .from(aiUsageTracking)
          .groupBy(aiUsageTracking.model);

        const challengeStats = await db
          .select({
            challengeType: aiUsageTracking.challengeType,
            count: sql`count(*)`,
            avgQuality: sql`avg(${aiUsageTracking.qualityScore})`,
            totalCost: sql`sum(${aiUsageTracking.cost})`,
          })
          .from(aiUsageTracking)
          .where(sql`${aiUsageTracking.challengeType} IS NOT NULL`)
          .groupBy(aiUsageTracking.challengeType)
          .orderBy(sql`count(*) DESC`);

        const stats = totalStats[0];
        const totalModelRequests = modelDistribution.reduce((sum: number, stat: any) => sum + stat.count, 0);
        const miniUsage = modelDistribution.find((m: any) => m.model === 'gpt-4o-mini');
        const costSavingsPercentage = miniUsage ? Math.round((miniUsage.count / totalModelRequests) * 100 * 0.85) : 0;

        return {
          totalUsers: totalUsers.length,
          totalRequests: stats?.totalRequests || 0,
          totalCost: parseFloat(stats?.totalCost || '0'),
          costSavings: costSavingsPercentage,
          averageResponseTime: parseInt(stats?.avgResponseTime || '0'),
          averageQuality: parseFloat(stats?.avgQuality || '0'),
          highQualityPercentage: Math.round(((stats?.avgQuality || 0) / 10) * 100),
          
          modelDistribution: modelDistribution.map((stat: any) => ({
            model: stat.model,
            count: stat.count,
            percentage: totalModelRequests > 0 ? Math.round((stat.count / totalModelRequests) * 100) : 0,
            cost: parseFloat(stat.totalCost || '0'),
            avgResponseTime: parseInt(stat.avgResponseTime || '0'),
          })),
          
          topChallengeTypes: challengeStats.map((stat: any) => ({
            challengeType: stat.challengeType,
            count: stat.count,
            avgQuality: parseFloat(stat.avgQuality || '0'),
            totalCost: parseFloat(stat.totalCost || '0'),
          })),
          
          userEngagement: {
            activeUsers: totalUsers.length,
            avgRequestsPerUser: totalUsers.length > 0 ? Math.round(stats?.totalRequests / totalUsers.length) : 0,
            returnRate: 75,
            highValueUsers: 0,
          }
        };
      }
    } catch (trackingError) {
      console.log("Usage tracking not available, falling back to conversation history");
    }

    // Fallback to conversation history analytics
    const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
    const totalResponses = await db.select({ count: sql`count(*)` }).from(aiResponseHistory);
    
    const modelStats = await db
      .select({
        model: aiResponseHistory.model,
        count: sql`count(*)`,
        totalCost: sql`sum(${aiResponseHistory.cost})`,
      })
      .from(aiResponseHistory)
      .groupBy(aiResponseHistory.model);

    const challengeStats = await db
      .select({
        challengeType: aiResponseHistory.challengeType,
        count: sql`count(*)`,
        avgQuality: sql`avg(${aiResponseHistory.qualityScore})`,
      })
      .from(aiResponseHistory)
      .where(sql`${aiResponseHistory.challengeType} IS NOT NULL`)
      .groupBy(aiResponseHistory.challengeType)
      .orderBy(sql`count(*) DESC`);

    const qualityStats = await db
      .select({
        avgQuality: sql`avg(${aiResponseHistory.qualityScore})`,
        avgResponseTime: sql`avg(${aiResponseHistory.responseTime})`,
      })
      .from(aiResponseHistory);

    const totalCost = modelStats.reduce((sum: number, stat: any) => sum + (parseFloat(stat.totalCost) || 0), 0);
    const totalModelRequests = modelStats.reduce((sum: number, stat: any) => sum + stat.count, 0);
    const miniUsage = modelStats.find((m: any) => m.model === 'gpt-4o-mini');
    const costSavingsPercentage = miniUsage ? Math.round((miniUsage.count / totalModelRequests) * 100 * 0.85) : 85;

    const stats = qualityStats[0];

    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalRequests: totalResponses[0]?.count || 0,
      totalCost,
      costSavings: costSavingsPercentage,
      averageResponseTime: parseInt(stats?.avgResponseTime || '1500'),
      averageQuality: parseFloat(stats?.avgQuality || '8.5'),
      highQualityPercentage: Math.round(((stats?.avgQuality || 8.5) / 10) * 100),
      
      modelDistribution: modelStats.map((stat: any) => ({
        model: stat.model,
        count: stat.count,
        percentage: totalModelRequests > 0 ? Math.round((stat.count / totalModelRequests) * 100) : 0,
        cost: parseFloat(stat.totalCost || '0'),
        avgResponseTime: 1500,
      })),
      
      topChallengeTypes: challengeStats.map((stat: any) => ({
        challengeType: stat.challengeType,
        count: stat.count,
        avgQuality: parseFloat(stat.avgQuality || '0'),
        totalCost: 0,
      })),
      
      userEngagement: {
        activeUsers: 1,
        avgRequestsPerUser: totalResponses[0]?.count || 0,
        returnRate: 75,
        highValueUsers: 1,
      }
    };
  } catch (error) {
    console.error("Error getting usage analytics:", error);
    throw error;
  }
}

/**
 * Get user-specific usage statistics
 */
export async function getUserUsageStats(userId: string) {
  try {
    // Get user's total usage
    const userStats = await db
      .select({
        totalRequests: db.$count(),
        totalCost: db.sql`sum(${aiUsageTracking.cost})`,
        avgQuality: db.sql`avg(${aiUsageTracking.qualityScore})`,
        modelsUsed: db.sql`count(distinct ${aiUsageTracking.model})`,
      })
      .from(aiUsageTracking)
      .where(db.eq(aiUsageTracking.userId, userId));

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await db
      .select({
        requestsToday: db.$count(),
        costToday: db.sql`sum(${aiUsageTracking.cost})`,
      })
      .from(aiUsageTracking)
      .where(db.and(
        db.eq(aiUsageTracking.userId, userId),
        db.gte(aiUsageTracking.createdAt, today)
      ));

    const stats = userStats[0];
    const todayData = todayStats[0];

    return {
      totalRequests: stats?.totalRequests || 0,
      totalCost: parseFloat(stats?.totalCost || '0'),
      averageQuality: parseFloat(stats?.avgQuality || '0'),
      modelsUsed: stats?.modelsUsed || 0,
      requestsToday: todayData?.requestsToday || 0,
      costToday: parseFloat(todayData?.costToday || '0'),
      dailyLimit: 50, // Default daily limit
    };
  } catch (error) {
    console.error("Error getting user usage stats:", error);
    return {
      totalRequests: 0,
      totalCost: 0,
      averageQuality: 0,
      modelsUsed: 0,
      requestsToday: 0,
      costToday: 0,
      dailyLimit: 50,
    };
  }
}