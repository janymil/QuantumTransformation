import { db } from "./db";
import { aiResponseCache, aiUsageTracking } from "@shared/schema";
import { sql, eq, and, desc } from "drizzle-orm";
import { 
  determineCacheStrategy, 
  getEnhancedCachedResponse, 
  getTemplateResponse 
} from "./enhanced-caching";
import { createInputHash } from "./ai-coaching/ai-cost-control";

interface CacheVerificationResult {
  question: string;
  strategy: string;
  responseSource: 'template' | 'pregenerated' | 'global_cache' | 'fresh_api';
  responseTime: number;
  cost: number;
  quality: string;
  explanation: string;
}

/**
 * Verify cache system is working properly
 */
export async function verifyCacheSystem(): Promise<{
  systemStatus: 'working' | 'partial' | 'failed';
  testResults: CacheVerificationResult[];
  summary: {
    totalTests: number;
    cacheHits: number;
    templateResponses: number;
    preGeneratedHits: number;
    globalCacheHits: number;
    freshGenerations: number;
    avgResponseTime: number;
    totalCostSaved: number;
  };
}> {
  const testQuestions = [
    "How long should I practice today's meditation?", // Should hit template
    "What if I'm having trouble with this exercise?", // Should hit template  
    "How does this connect to quantum physics?", // Should hit template
    "What is today's practice about?", // Should check pregenerated/cache
    "Explain Day 1 of general quantum consciousness" // Should check pregenerated/cache
  ];

  const testResults: CacheVerificationResult[] = [];
  
  for (const question of testQuestions) {
    const startTime = Date.now();
    
    try {
      // Test the caching strategy determination
      const strategy = determineCacheStrategy(question, 'general_quantum', 1, 'basic');
      const inputHash = createInputHash(question, 'explanation', 'general_quantum', 1);
      
      let responseSource: CacheVerificationResult['responseSource'] = 'fresh_api';
      let cost = 0.02; // Default API cost
      let explanation = '';
      
      // Test template responses first
      if (strategy.useTemplateResponse) {
        const templateResponse = getTemplateResponse(strategy.reason);
        if (templateResponse) {
          responseSource = 'template';
          cost = 0;
          explanation = 'Instant template response for common question type';
        }
      }
      
      // Test enhanced cache lookup
      if (responseSource === 'fresh_api') {
        const cachedResponse = await getEnhancedCachedResponse(inputHash, strategy);
        if (cachedResponse) {
          cost = 0;
          if (cachedResponse.cacheType === 'pregenerated') {
            responseSource = 'pregenerated';
            explanation = 'Pre-generated high-quality response from system cache';
          } else if (cachedResponse.cacheType === 'global') {
            responseSource = 'global_cache';
            explanation = 'Response reused from another user\'s previous question';
          }
        }
      }
      
      if (responseSource === 'fresh_api') {
        explanation = 'New AI generation required - will be cached for future use';
      }
      
      const responseTime = Date.now() - startTime;
      
      testResults.push({
        question,
        strategy: strategy.reason,
        responseSource,
        responseTime,
        cost,
        quality: responseSource === 'template' ? 'Good' : 
                responseSource === 'pregenerated' ? 'Excellent' : 
                responseSource === 'global_cache' ? 'Good' : 'Excellent',
        explanation
      });
      
    } catch (error) {
      console.error(`Cache verification error for "${question}":`, error);
      testResults.push({
        question,
        strategy: 'error',
        responseSource: 'fresh_api',
        responseTime: Date.now() - startTime,
        cost: 0.02,
        quality: 'Unknown',
        explanation: `Error testing cache: ${error.message}`
      });
    }
  }
  
  // Calculate summary statistics
  const summary = {
    totalTests: testResults.length,
    cacheHits: testResults.filter(r => r.cost === 0).length,
    templateResponses: testResults.filter(r => r.responseSource === 'template').length,
    preGeneratedHits: testResults.filter(r => r.responseSource === 'pregenerated').length,
    globalCacheHits: testResults.filter(r => r.responseSource === 'global_cache').length,
    freshGenerations: testResults.filter(r => r.responseSource === 'fresh_api').length,
    avgResponseTime: Math.round(testResults.reduce((sum, r) => sum + r.responseTime, 0) / testResults.length),
    totalCostSaved: testResults.filter(r => r.cost === 0).length * 0.02
  };
  
  // Determine system status
  const cacheHitRate = summary.cacheHits / summary.totalTests;
  let systemStatus: 'working' | 'partial' | 'failed';
  
  if (cacheHitRate >= 0.6) {
    systemStatus = 'working';
  } else if (cacheHitRate >= 0.3) {
    systemStatus = 'partial';
  } else {
    systemStatus = 'failed';
  }
  
  return {
    systemStatus,
    testResults,
    summary
  };
}

/**
 * Get cache statistics from database
 */
export async function getCacheStatistics() {
  try {
    // Get cache composition
    const cacheComposition = await db
      .select({
        totalCached: sql<number>`COUNT(*)`,
        templateResponses: sql<number>`SUM(CASE WHEN user_id = 'template' THEN 1 ELSE 0 END)`,
        preGenerated: sql<number>`SUM(CASE WHEN user_id = 'system_pregenerated' THEN 1 ELSE 0 END)`,
        userGenerated: sql<number>`SUM(CASE WHEN user_id != 'template' AND user_id != 'system_pregenerated' THEN 1 ELSE 0 END)`,
        totalHits: sql<number>`SUM(COALESCE(hit_count, 0))`,
        avgHitCount: sql<number>`AVG(COALESCE(hit_count, 0))`
      })
      .from(aiResponseCache);

    // Get usage statistics
    const usageStats = await db
      .select({
        totalRequests: sql<number>`COUNT(*)`,
        cacheHits: sql<number>`SUM(CASE WHEN is_from_cache THEN 1 ELSE 0 END)`,
        freshGenerations: sql<number>`SUM(CASE WHEN NOT is_from_cache THEN 1 ELSE 0 END)`,
        totalCost: sql<number>`SUM(cost)`,
        avgCost: sql<number>`AVG(cost)`
      })
      .from(aiUsageTracking);

    // Get most popular cached responses
    const popularResponses = await db
      .select({
        requestType: aiResponseCache.requestType,
        challengeType: aiResponseCache.challengeType,
        day: aiResponseCache.day,
        hitCount: aiResponseCache.hitCount,
        userId: aiResponseCache.userId,
        createdAt: aiResponseCache.createdAt
      })
      .from(aiResponseCache)
      .where(sql`hit_count > 0`)
      .orderBy(desc(aiResponseCache.hitCount))
      .limit(10);

    const hitRate = usageStats[0] && usageStats[0].totalRequests > 0 ? 
      Math.round((usageStats[0].cacheHits / usageStats[0].totalRequests) * 100) : 0;

    return {
      cacheComposition: cacheComposition[0],
      usageStats: usageStats[0],
      hitRate,
      popularResponses,
      estimatedSavings: usageStats[0] ? (usageStats[0].cacheHits * 0.02) : 0
    };
    
  } catch (error) {
    console.error("Error getting cache statistics:", error);
    return null;
  }
}

/**
 * Demonstrate cache performance with real examples
 */
export async function demonstrateCachePerformance() {
  console.log("🧪 Demonstrating Enhanced Cache Performance");
  console.log("=" * 50);
  
  // Run verification tests
  const verification = await verifyCacheSystem();
  
  console.log(`\n📊 System Status: ${verification.systemStatus.toUpperCase()}`);
  console.log(`Cache Hit Rate: ${Math.round((verification.summary.cacheHits / verification.summary.totalTests) * 100)}%`);
  console.log(`Average Response Time: ${verification.summary.avgResponseTime}ms`);
  console.log(`Cost Savings: $${verification.summary.totalCostSaved.toFixed(2)}`);
  
  console.log("\n🔍 Test Results:");
  verification.testResults.forEach((result, index) => {
    console.log(`\n${index + 1}. "${result.question}"`);
    console.log(`   Strategy: ${result.strategy}`);
    console.log(`   Source: ${result.responseSource}`);
    console.log(`   Time: ${result.responseTime}ms`);
    console.log(`   Cost: $${result.cost.toFixed(2)}`);
    console.log(`   Quality: ${result.quality}`);
    console.log(`   ${result.explanation}`);
  });
  
  // Get database statistics
  const stats = await getCacheStatistics();
  if (stats) {
    console.log("\n📈 Database Cache Statistics:");
    console.log(`   Total Cached Responses: ${stats.cacheComposition.totalCached}`);
    console.log(`   Template Responses: ${stats.cacheComposition.templateResponses}`);
    console.log(`   Pre-Generated: ${stats.cacheComposition.preGenerated}`);
    console.log(`   User-Generated: ${stats.cacheComposition.userGenerated}`);
    console.log(`   Overall Hit Rate: ${stats.hitRate}%`);
    console.log(`   Total Cost Savings: $${stats.estimatedSavings.toFixed(2)}`);
  }
  
  return verification;
}