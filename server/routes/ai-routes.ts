import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { 
  validateAIRequest, 
  getCachedResponse, 
  cacheResponse, 
  trackUsage,
  createInputHash,
  getUserAIStats 
} from "../ai-cost-control";
import { generateAIExplanation, analyzeJournalEntries, generatePersonalizedCoaching } from "../openai";
import { db } from "../db";
import { aiResponseCache, aiUsageTracking } from "../ai-cost-control";
import { sql, desc, count, avg } from "drizzle-orm";

export function registerAIRoutes(app: Express) {
  // AI Explanation endpoint with global caching
  app.post("/api/ai/explain", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { topic, day, userQuestion, challengeType, userTier = 'basic' } = req.body;

      // Create input hash for caching
      const inputHash = createInputHash(userQuestion || topic, 'explanation', challengeType, day);

      // Validate request
      const validation = await validateAIRequest({
        userId,
        requestType: 'explanation',
        input: userQuestion || topic,
        challengeType,
        day,
        userTier
      });

      if (!validation.allowed) {
        return res.status(429).json({ 
          error: validation.reason,
          remainingRequests: validation.remainingRequests 
        });
      }

      // Check global cache first
      const cachedResponse = await getCachedResponse(inputHash);
      if (cachedResponse) {
        // Track cache hit for analytics
        await trackUsage(userId, 'explanation', inputHash, 0, 0);
        
        return res.json({
          ...cachedResponse,
          fromCache: true,
          remainingRequests: validation.remainingRequests
        });
      }

      // Generate new AI response
      const aiResponse = await generateAIExplanation({
        topic: topic || challengeType,
        day,
        userQuestion,
        context: `Challenge: ${challengeType}, Day: ${day}`
      });

      // Estimate tokens used (rough calculation)
      const tokensUsed = Math.ceil((userQuestion?.length || 0) / 4) + Math.ceil(JSON.stringify(aiResponse).length / 4);
      const cost = Math.ceil(tokensUsed * 0.00002 * 100); // Cost in cents

      // Cache the response globally
      await cacheResponse(inputHash, 'explanation', aiResponse, userId, challengeType, day, tokensUsed);

      // Track usage
      await trackUsage(userId, 'explanation', inputHash, tokensUsed, cost);

      res.json({
        ...aiResponse,
        fromCache: false,
        tokensUsed,
        remainingRequests: validation.remainingRequests
      });

    } catch (error) {
      console.error("AI explanation error:", error);
      res.status(500).json({ error: "Failed to generate AI explanation" });
    }
  });

  // Journal Analysis endpoint
  app.post("/api/ai/analyze-journal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { entries, userTier = 'basic' } = req.body;

      const inputText = JSON.stringify(entries);
      const inputHash = createInputHash(inputText, 'journal_analysis');

      const validation = await validateAIRequest({
        userId,
        requestType: 'journal_analysis',
        input: inputText,
        userTier
      });

      if (!validation.allowed) {
        return res.status(429).json({ 
          error: validation.reason,
          remainingRequests: validation.remainingRequests 
        });
      }

      // Check cache
      const cachedResponse = await getCachedResponse(inputHash);
      if (cachedResponse) {
        await trackUsage(userId, 'journal_analysis', inputHash, 0, 0);
        return res.json({ ...cachedResponse, fromCache: true });
      }

      // Generate analysis
      const analysis = await analyzeJournalEntries({ entries });
      const tokensUsed = Math.ceil(inputText.length / 4) + Math.ceil(JSON.stringify(analysis).length / 4);
      const cost = Math.ceil(tokensUsed * 0.00002 * 100);

      // Cache and track
      await cacheResponse(inputHash, 'journal_analysis', analysis, userId, undefined, undefined, tokensUsed);
      await trackUsage(userId, 'journal_analysis', inputHash, tokensUsed, cost);

      res.json({ ...analysis, fromCache: false, tokensUsed });

    } catch (error) {
      console.error("Journal analysis error:", error);
      res.status(500).json({ error: "Failed to analyze journal entries" });
    }
  });

  // Personalized Coaching endpoint
  app.post("/api/ai/coaching", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const coachingRequest = { ...req.body, userId };
      const { userTier = 'basic' } = req.body;

      const inputText = JSON.stringify(coachingRequest);
      const inputHash = createInputHash(inputText, 'coaching');

      const validation = await validateAIRequest({
        userId,
        requestType: 'coaching',
        input: inputText,
        userTier
      });

      if (!validation.allowed) {
        return res.status(429).json({ 
          error: validation.reason,
          remainingRequests: validation.remainingRequests 
        });
      }

      // Check cache (shorter expiration for personalized content)
      const cachedResponse = await getCachedResponse(inputHash);
      if (cachedResponse) {
        await trackUsage(userId, 'coaching', inputHash, 0, 0);
        return res.json({ ...cachedResponse, fromCache: true });
      }

      // Generate coaching
      const coaching = await generatePersonalizedCoaching(coachingRequest);
      const tokensUsed = Math.ceil(inputText.length / 4) + Math.ceil(JSON.stringify(coaching).length / 4);
      const cost = Math.ceil(tokensUsed * 0.00002 * 100);

      // Cache and track
      await cacheResponse(inputHash, 'coaching', coaching, userId, undefined, undefined, tokensUsed);
      await trackUsage(userId, 'coaching', inputHash, tokensUsed, cost);

      res.json({ ...coaching, fromCache: false, tokensUsed });

    } catch (error) {
      console.error("Coaching error:", error);
      res.status(500).json({ error: "Failed to generate personalized coaching" });
    }
  });

  // AI Usage Statistics endpoint
  app.get("/api/ai/usage-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await getUserAIStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Usage stats error:", error);
      res.status(500).json({ error: "Failed to get usage statistics" });
    }
  });

  // Global Cache Analytics (admin endpoint)
  app.get("/api/ai/cache-analytics", isAuthenticated, async (req: any, res) => {
    try {
      // Get cache performance metrics
      const cacheStats = await db
        .select({
          totalCachedResponses: count(),
          averageHitCount: avg(aiResponseCache.hitCount),
          topQuestions: sql<string>`array_agg(request_type ORDER BY hit_count DESC LIMIT 10)`
        })
        .from(aiResponseCache);

      // Get cache hit rate over time
      const hitRateStats = await db
        .select({
          totalRequests: count(),
          cacheHits: sql<number>`SUM(CASE WHEN is_from_cache THEN 1 ELSE 0 END)`,
          apiCalls: sql<number>`SUM(CASE WHEN is_from_cache THEN 0 ELSE 1 END)`,
          totalCost: sql<number>`SUM(cost)`,
          savedCost: sql<number>`SUM(CASE WHEN is_from_cache THEN tokens_used * 0.02 ELSE 0 END)`
        })
        .from(aiUsageTracking);

      // Most popular cached questions
      const popularQuestions = await db
        .select({
          requestType: aiResponseCache.requestType,
          challengeType: aiResponseCache.challengeType,
          day: aiResponseCache.day,
          hitCount: aiResponseCache.hitCount,
          createdAt: aiResponseCache.createdAt
        })
        .from(aiResponseCache)
        .orderBy(desc(aiResponseCache.hitCount))
        .limit(20);

      const hitRate = hitRateStats[0] ? 
        (hitRateStats[0].cacheHits / hitRateStats[0].totalRequests * 100) : 0;

      res.json({
        cachePerformance: {
          ...cacheStats[0],
          hitRate: Math.round(hitRate),
          totalSavedCost: hitRateStats[0]?.savedCost || 0
        },
        usageStats: hitRateStats[0],
        popularQuestions
      });

    } catch (error) {
      console.error("Cache analytics error:", error);
      res.status(500).json({ error: "Failed to get cache analytics" });
    }
  });
}