import { db } from "./db";
import { aiResponseCache, aiUsageTracking } from "@shared/schema";
import { sql, eq, and, inArray } from "drizzle-orm";
import { generateAIExplanation } from "./openai";
import { createInputHash } from "./ai-coaching/ai-cost-control";

interface PreGeneratedContent {
  challengeType: string;
  day: number;
  contentType: string;
  content: any;
  quality: 'high' | 'medium' | 'template';
}

interface SmartCacheStrategy {
  usePreGenerated: boolean;
  useTemplateResponse: boolean;
  generateFresh: boolean;
  reason: string;
}

// Common challenge questions that can be pre-generated
const COMMON_QUESTIONS = [
  "What is today's practice about?",
  "How does this connect to quantum physics?", 
  "What should I focus on during meditation?",
  "Explain the science behind this technique",
  "How does this help rewire my brain?",
  "What are the benefits of this practice?",
  "How long should I practice this?",
  "What if I'm having trouble with this exercise?",
  "How does this relate to consciousness?",
  "What's the purpose of this visualization?"
];

// Template responses for very common questions
const TEMPLATE_RESPONSES = {
  "practice_duration": {
    explanation: "Most quantum consciousness practices are most effective when done for 15-20 minutes daily. This duration allows your brain to enter the coherent state necessary for neural rewiring while being sustainable for consistent practice.",
    relatedConcepts: ["Neural plasticity", "Coherent brain states", "Habit formation"],
    practicalTips: ["Start with 10 minutes if you're new", "Practice at the same time daily", "Create a dedicated space"],
    scientificBacking: "Research shows that 15-20 minutes of focused meditation creates measurable changes in brain wave patterns and neural connectivity."
  },
  "meditation_trouble": {
    explanation: "Difficulty in meditation is completely normal and part of the learning process. Your brain is literally rewiring itself, which takes time and patience.",
    relatedConcepts: ["Neural rewiring", "Default mode network", "Present moment awareness"],
    practicalTips: ["Don't judge your thoughts", "Gently return focus when distracted", "Consistency matters more than perfection"],
    scientificBacking: "Studies show that even 'bad' meditation sessions contribute to long-term neuroplastic changes and stress reduction."
  },
  "quantum_connection": {
    explanation: "Quantum consciousness refers to the idea that consciousness operates at the quantum level, where thoughts and emotions can influence physical reality through the quantum field.",
    relatedConcepts: ["Quantum field theory", "Observer effect", "Consciousness and reality"],
    practicalTips: ["Focus on feeling states", "Visualize desired outcomes", "Practice elevated emotions"],
    scientificBacking: "Quantum physics shows that observation affects reality at the subatomic level, suggesting consciousness plays a fundamental role in creating our experience."
  }
};

/**
 * Determine the best caching strategy for a given request
 */
export function determineCacheStrategy(
  userQuestion: string,
  challengeType: string,
  day: number,
  userTier: string
): SmartCacheStrategy {
  const questionLower = userQuestion.toLowerCase();
  
  // Check for template-worthy questions
  if (questionLower.includes("how long") || questionLower.includes("duration")) {
    return {
      usePreGenerated: false,
      useTemplateResponse: true,
      generateFresh: false,
      reason: "template_duration"
    };
  }
  
  if (questionLower.includes("trouble") || questionLower.includes("difficult") || questionLower.includes("hard")) {
    return {
      usePreGenerated: false,
      useTemplateResponse: true,
      generateFresh: false,
      reason: "template_trouble"
    };
  }
  
  if (questionLower.includes("quantum") && questionLower.includes("work")) {
    return {
      usePreGenerated: false,
      useTemplateResponse: true,
      generateFresh: false,
      reason: "template_quantum"
    };
  }
  
  // Check for common challenge-specific questions
  const isCommonQuestion = COMMON_QUESTIONS.some(q => 
    questionLower.includes(q.toLowerCase().split(' ').slice(0, 3).join(' '))
  );
  
  if (isCommonQuestion && day <= 30) {
    return {
      usePreGenerated: true,
      useTemplateResponse: false,
      generateFresh: false,
      reason: "pregenerated_common"
    };
  }
  
  // Premium users get fresh content for complex questions
  if (userTier === 'premium' || userTier === 'unlimited') {
    return {
      usePreGenerated: false,
      useTemplateResponse: false,
      generateFresh: true,
      reason: "premium_fresh"
    };
  }
  
  // Default to global cache lookup
  return {
    usePreGenerated: false,
    useTemplateResponse: false,
    generateFresh: true,
    reason: "global_cache_then_fresh"
  };
}

/**
 * Get template response for common questions
 */
export function getTemplateResponse(reason: string): any {
  const templateKey = reason.replace('template_', '');
  const template = TEMPLATE_RESPONSES[templateKey as keyof typeof TEMPLATE_RESPONSES];
  
  if (template) {
    return {
      ...template,
      fromCache: true,
      cacheType: 'template',
      cost: 0
    };
  }
  
  return null;
}

/**
 * Pre-generate content for common questions across all challenges
 */
export async function preGenerateCommonContent(): Promise<void> {
  const challenges = ['general_quantum', 'money_blocks_clearing', 'love_relationships', 'health_vitality', 'career_purpose'];
  
  console.log("Starting pre-generation of common content...");
  
  for (const challengeType of challenges) {
    for (let day = 1; day <= 30; day++) {
      for (const question of COMMON_QUESTIONS.slice(0, 5)) { // Pre-generate top 5 most common
        try {
          const inputHash = createInputHash(question, 'explanation', challengeType, day);
          
          // Check if already cached
          const existing = await db
            .select()
            .from(aiResponseCache)
            .where(eq(aiResponseCache.inputHash, inputHash))
            .limit(1);
          
          if (existing.length === 0) {
            // Generate fresh content
            const response = await generateAIExplanation({
              topic: challengeType,
              day,
              userQuestion: question,
              context: `Pre-generated content for ${challengeType} Day ${day}`
            });
            
            // Cache with extended expiration (90 days for pre-generated content)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 90);
            
            await db.insert(aiResponseCache).values({
              inputHash,
              requestType: 'explanation',
              challengeType,
              day,
              response: JSON.stringify(response),
              tokensUsed: 800, // Estimated
              userId: 'system_pregenerated',
              hitCount: 0,
              expiresAt
            });
            
            console.log(`Pre-generated: ${challengeType} Day ${day} - ${question.slice(0, 30)}...`);
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Error pre-generating ${challengeType} Day ${day}:`, error);
        }
      }
    }
  }
  
  console.log("Pre-generation completed!");
}

/**
 * Enhanced cache lookup with quality scoring
 */
export async function getEnhancedCachedResponse(
  inputHash: string,
  strategy: SmartCacheStrategy
): Promise<any | null> {
  try {
    // Template responses (highest priority, zero cost)
    if (strategy.useTemplateResponse) {
      return getTemplateResponse(strategy.reason);
    }
    
    // Pre-generated content (high quality, zero incremental cost)
    if (strategy.usePreGenerated) {
      const preGenerated = await db
        .select()
        .from(aiResponseCache)
        .where(and(
          eq(aiResponseCache.inputHash, inputHash),
          eq(aiResponseCache.userId, 'system_pregenerated')
        ))
        .limit(1);
      
      if (preGenerated.length > 0) {
        // Update hit count
        await db
          .update(aiResponseCache)
          .set({ 
            hitCount: sql`${aiResponseCache.hitCount} + 1`,
            lastHitAt: new Date()
          })
          .where(eq(aiResponseCache.id, preGenerated[0].id));
        
        return {
          ...JSON.parse(preGenerated[0].response),
          fromCache: true,
          cacheType: 'pregenerated',
          hitCount: preGenerated[0].hitCount + 1
        };
      }
    }
    
    // Global cache (medium quality, existing responses from other users)
    const globalCached = await db
      .select()
      .from(aiResponseCache)
      .where(and(
        eq(aiResponseCache.inputHash, inputHash),
        sql`expires_at > NOW() OR expires_at IS NULL`
      ))
      .orderBy(sql`hit_count DESC, created_at DESC`)
      .limit(1);
    
    if (globalCached.length > 0) {
      // Update hit count
      await db
        .update(aiResponseCache)
        .set({ 
          hitCount: sql`${aiResponseCache.hitCount} + 1`,
          lastHitAt: new Date()
        })
        .where(eq(aiResponseCache.id, globalCached[0].id));
      
      return {
        ...JSON.parse(globalCached[0].response),
        fromCache: true,
        cacheType: 'global',
        originallyAskedBy: globalCached[0].userId,
        hitCount: globalCached[0].hitCount + 1
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error in enhanced cache lookup:", error);
    return null;
  }
}

/**
 * Get cache performance analytics
 */
export async function getCacheAnalytics() {
  try {
    const analytics = await db
      .select({
        totalCached: sql<number>`COUNT(*)`,
        templateResponses: sql<number>`SUM(CASE WHEN user_id = 'template' THEN 1 ELSE 0 END)`,
        preGenerated: sql<number>`SUM(CASE WHEN user_id = 'system_pregenerated' THEN 1 ELSE 0 END)`,
        userGenerated: sql<number>`SUM(CASE WHEN user_id != 'template' AND user_id != 'system_pregenerated' THEN 1 ELSE 0 END)`,
        totalHits: sql<number>`SUM(hit_count)`,
        avgHitCount: sql<number>`AVG(hit_count)`
      })
      .from(aiResponseCache);
    
    const usageStats = await db
      .select({
        totalRequests: sql<number>`COUNT(*)`,
        cacheHits: sql<number>`SUM(CASE WHEN is_from_cache THEN 1 ELSE 0 END)`,
        freshGenerations: sql<number>`SUM(CASE WHEN is_from_cache THEN 0 ELSE 1 END)`,
        totalCostSaved: sql<number>`SUM(CASE WHEN is_from_cache THEN tokens_used * 0.02 ELSE 0 END)`
      })
      .from(aiUsageTracking);
    
    const hitRate = usageStats[0] ? 
      (usageStats[0].cacheHits / usageStats[0].totalRequests * 100) : 0;
    
    return {
      cacheComposition: analytics[0],
      usageMetrics: usageStats[0],
      hitRate: Math.round(hitRate),
      estimatedMonthlySavings: usageStats[0]?.totalCostSaved || 0
    };
  } catch (error) {
    console.error("Error getting cache analytics:", error);
    return null;
  }
}

/**
 * Initialize enhanced caching system
 */
export async function initializeEnhancedCaching(): Promise<void> {
  console.log("Initializing enhanced caching system...");
  
  // Pre-generate common content (can be run periodically)
  await preGenerateCommonContent();
  
  console.log("Enhanced caching system initialized!");
}