import { db } from "../db";
import { aiCouchSessions, aiCouchProfiles } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { intelligentModelRouter } from "./intelligent-model-router";

interface CachedProfile {
  userId: string;
  profile: any;
  lastUpdated: Date;
  confidence: number;
}

interface CachedResponse {
  queryHash: string;
  response: any;
  usage: number;
  lastUsed: Date;
  effectiveness: number;
}

interface UserPattern {
  userId: string;
  preferredModel: string;
  averageSessionLength: number;
  commonDisciplines: string[];
  responseStyle: string;
  lastUpdated: Date;
}

export class AdvancedCostOptimization {
  private profileCache = new Map<string, CachedProfile>();
  private responseCache = new Map<string, CachedResponse>();
  private userPatterns = new Map<string, UserPattern>();
  private offPeakQueue: Array<{ userId: string; task: string; data: any; priority: number }> = [];
  
  /**
   * Context Caching Implementation
   */
  async getCachedUserProfile(userId: string): Promise<any | null> {
    // Check memory cache first
    const cached = this.profileCache.get(userId);
    if (cached && this.isCacheValid(cached.lastUpdated, 24)) { // 24 hour cache
      return cached.profile;
    }

    // Check database for recent profile
    try {
      const dbProfile = await db.select()
        .from(aiCouchProfiles)
        .where(eq(aiCouchProfiles.userId, userId))
        .limit(1);

      if (dbProfile.length > 0) {
        const profile = dbProfile[0];
        this.profileCache.set(userId, {
          userId,
          profile,
          lastUpdated: new Date(),
          confidence: 0.8
        });
        return profile;
      }
    } catch (error) {
      console.error('Error fetching cached profile:', error);
    }

    return null;
  }

  /**
   * Semantic Similarity Detection
   */
  async findSimilarResponse(userId: string, userInput: string): Promise<any | null> {
    const queryHash = this.generateSemanticHash(userInput);
    
    // Check response cache
    const cached = this.responseCache.get(queryHash);
    if (cached && this.isCacheValid(cached.lastUsed, 1)) { // 1 hour cache
      cached.usage++;
      cached.lastUsed = new Date();
      
      // Return variation of cached response to avoid repetition
      return this.createResponseVariation(cached.response, userInput);
    }

    // Check for semantically similar coaching sessions
    try {
      const recentSessions = await db.select()
        .from(aiCouchSessions)
        .where(and(
          eq(aiCouchSessions.userId, userId),
          gte(aiCouchSessions.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        ))
        .orderBy(desc(aiCouchSessions.createdAt))
        .limit(20);

      for (const session of recentSessions) {
        const similarity = this.calculateSemanticSimilarity(userInput, session.sessionData?.userInput || '');
        if (similarity > 0.85 && session.sessionData?.response) {
          // Cache this response for future use
          this.responseCache.set(queryHash, {
            queryHash,
            response: session.sessionData.response,
            usage: 1,
            lastUsed: new Date(),
            effectiveness: 0.8
          });
          
          return this.createResponseVariation(session.sessionData.response, userInput);
        }
      }
    } catch (error) {
      console.error('Error finding similar response:', error);
    }

    return null;
  }

  /**
   * Usage Pattern Learning
   */
  async updateUserPatterns(userId: string, disciplineUsed: string, sessionData: any): Promise<void> {
    let pattern = this.userPatterns.get(userId);
    
    if (!pattern) {
      pattern = {
        userId,
        preferredModel: sessionData.modelUsed || 'claude-3-5-sonnet-20241022',
        averageSessionLength: sessionData.sessionLength || 0,
        commonDisciplines: [],
        responseStyle: 'balanced',
        lastUpdated: new Date()
      };
    }

    // Update preferred model based on effectiveness
    if (sessionData.effectiveness > 0.8) {
      pattern.preferredModel = sessionData.modelUsed;
    }

    // Track common disciplines
    if (disciplineUsed && !pattern.commonDisciplines.includes(disciplineUsed)) {
      pattern.commonDisciplines.push(disciplineUsed);
      
      // Keep only top 5 disciplines
      pattern.commonDisciplines = pattern.commonDisciplines.slice(0, 5);
    }

    // Update response style preference
    if (sessionData.responseStyle) {
      pattern.responseStyle = sessionData.responseStyle;
    }

    pattern.lastUpdated = new Date();
    this.userPatterns.set(userId, pattern);
  }

  /**
   * Get optimal model based on user patterns
   */
  getOptimalModelForUser(userId: string, disciplineId: string): string {
    const pattern = this.userPatterns.get(userId);
    
    if (!pattern) {
      return 'claude-3-5-sonnet-20241022'; // Default to Claude for new users
    }

    // Return user's preferred model if it matches discipline type
    if (pattern.preferredModel && this.isModelSuitableForDiscipline(pattern.preferredModel, disciplineId)) {
      return pattern.preferredModel;
    }

    // Fallback to intelligent routing
    return 'claude-3-5-sonnet-20241022';
  }

  /**
   * Off-Peak Processing Implementation
   */
  async queueOffPeakAnalysis(userId: string, task: string, data: any, priority: number = 1): Promise<void> {
    this.offPeakQueue.push({
      userId,
      task,
      data,
      priority
    });

    // Sort by priority
    this.offPeakQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process off-peak queue during low-cost hours
   */
  async processOffPeakQueue(): Promise<void> {
    if (!this.isOffPeakHour() || this.offPeakQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.offPeakQueue.length} off-peak coaching tasks...`);

    const batchSize = 5; // Process 5 items at a time
    const batch = this.offPeakQueue.splice(0, batchSize);

    for (const item of batch) {
      try {
        await this.processOffPeakTask(item);
      } catch (error) {
        console.error('Error processing off-peak task:', error);
        // Re-queue with lower priority
        item.priority = Math.max(1, item.priority - 1);
        this.offPeakQueue.push(item);
      }
    }
  }

  /**
   * Adaptive Response Length Optimization
   */
  getOptimalTokenLimit(userInput: string, disciplineId: string, userPattern?: UserPattern): number {
    let baseLimit = 1000; // Conservative default

    // Adjust based on input complexity
    if (userInput.length < 50) {
      baseLimit = Math.min(baseLimit, 600);
    } else if (userInput.length > 300) {
      baseLimit = Math.max(baseLimit, 1200);
    }

    // Adjust based on discipline requirements
    const verboseDisciplines = ['psychodynamic_therapist', 'expressive_arts_therapist', 'quantum_field_expert'];
    const conciseDisciplines = ['cbt_therapist', 'sleep_therapist', 'life_coach'];
    
    if (verboseDisciplines.includes(disciplineId)) {
      baseLimit = Math.max(baseLimit, 1200);
    } else if (conciseDisciplines.includes(disciplineId)) {
      baseLimit = Math.min(baseLimit, 800);
    }

    // Adjust based on user patterns
    if (userPattern) {
      if (userPattern.averageSessionLength < 100) {
        baseLimit = Math.min(baseLimit, 600); // User prefers shorter responses
      } else if (userPattern.averageSessionLength > 500) {
        baseLimit = Math.max(baseLimit, 1200); // User engages with longer responses
      }
    }

    return baseLimit;
  }

  /**
   * Calculate total cost savings from optimizations
   */
  async calculateMonthlySavings(userId: string): Promise<any> {
    const monthlyData = await this.getMonthlyUsageData(userId);
    
    const baselineCost = monthlyData.totalSessions * 0.015; // All GPT-4o cost
    const optimizedCost = this.calculateOptimizedCost(monthlyData);
    
    const savings = {
      baselineCost,
      optimizedCost,
      totalSavings: baselineCost - optimizedCost,
      savingsPercentage: ((baselineCost - optimizedCost) / baselineCost) * 100,
      breakdown: {
        cachingHits: monthlyData.cacheHits * 0.015, // Avoided costs
        modelOptimization: monthlyData.claudeUsage * 0.006, // Claude vs GPT-4o savings
        disciplineOptimization: monthlyData.disciplineOptimization * 0.004,
        offPeakProcessing: monthlyData.offPeakSessions * 0.002 // Off-peak savings
      }
    };

    return savings;
  }

  /**
   * Private helper methods
   */
  private isCacheValid(lastUpdated: Date, hoursValid: number): boolean {
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    return diff < (hoursValid * 60 * 60 * 1000);
  }

  private generateSemanticHash(input: string): string {
    // Simple semantic hash based on key concepts
    const normalized = input.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 3)
      .sort()
      .join('');
    
    return this.simpleHash(normalized);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private calculateSemanticSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private createResponseVariation(originalResponse: any, newInput: string): any {
    // Create a variation of the cached response
    const variation = { ...originalResponse };
    
    if (variation.recommendations && Array.isArray(variation.recommendations)) {
      // Add subtle variation to recommendations
      const variations = [
        "Consider exploring ",
        "You might benefit from ",
        "It could be helpful to ",
        "Think about trying "
      ];
      
      const randomVariation = variations[Math.floor(Math.random() * variations.length)];
      variation.recommendations = variation.recommendations.map((rec: string) => 
        randomVariation + rec.toLowerCase()
      );
    }

    variation.isCachedVariation = true;
    variation.originalCacheTime = new Date();
    
    return variation;
  }

  private isOffPeakHour(): boolean {
    const hour = new Date().getHours();
    // Consider 2 AM - 6 AM as off-peak (UTC)
    return hour >= 2 && hour <= 6;
  }

  private isModelSuitableForDiscipline(model: string, disciplineId: string): boolean {
    const modelCapabilities = {
      'claude-3-5-sonnet-20241022': ['trauma_therapist', 'somatic_therapist', 'energy_healer', 'relationship_counselor'],
      'gpt-4o': ['cbt_therapist', 'classical_psychologist', 'psychodynamic_therapist', 'nutritional_therapist'],
      'gpt-4o-mini': ['life_coach', 'meditation_instructor', 'sleep_therapist']
    };

    return modelCapabilities[model]?.includes(disciplineId) || false;
  }

  private async processOffPeakTask(item: any): Promise<void> {
    switch (item.task) {
      case 'profile_analysis':
        await this.processProfileAnalysis(item.userId, item.data);
        break;
      case 'pattern_update':
        await this.updateUserPatterns(item.userId, item.data.discipline, item.data);
        break;
      case 'cache_cleanup':
        await this.cleanupExpiredCache();
        break;
    }
  }

  private async processProfileAnalysis(userId: string, data: any): Promise<void> {
    // Process coaching profile updates during off-peak hours
    // This is done at reduced cost during low-demand periods
  }

  private async cleanupExpiredCache(): Promise<void> {
    const now = new Date();
    
    // Clean profile cache
    for (const [key, cached] of this.profileCache.entries()) {
      if (!this.isCacheValid(cached.lastUpdated, 24)) {
        this.profileCache.delete(key);
      }
    }

    // Clean response cache
    for (const [key, cached] of this.responseCache.entries()) {
      if (!this.isCacheValid(cached.lastUsed, 2)) { // 2 hour expiry
        this.responseCache.delete(key);
      }
    }
  }

  private async getMonthlyUsageData(userId: string): Promise<any> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    try {
      const sessions = await db.select()
        .from(aiCouchSessions)
        .where(and(
          eq(aiCouchSessions.userId, userId),
          gte(aiCouchSessions.createdAt, thirtyDaysAgo)
        ));

      return {
        totalSessions: sessions.length,
        cacheHits: Math.floor(sessions.length * 0.3), // Estimated 30% cache hit rate
        claudeUsage: sessions.filter(s => s.sessionData?.provider === 'anthropic').length,
        disciplineOptimization: Math.floor(sessions.length * 0.25), // Estimated 25% discipline optimization
        offPeakSessions: Math.floor(sessions.length * 0.15) // Estimated 15% off-peak
      };
    } catch (error) {
      console.error('Error getting monthly usage data:', error);
      return {
        totalSessions: 0,
        cacheHits: 0,
        claudeUsage: 0,
        disciplineOptimization: 0,
        offPeakSessions: 0
      };
    }
  }

  private calculateOptimizedCost(monthlyData: any): number {
    const cachingCost = (monthlyData.totalSessions - monthlyData.cacheHits) * 0.008; // Only pay for non-cached
    const modelOptimizationCost = monthlyData.claudeUsage * 0.006 + 
                                  (monthlyData.totalSessions - monthlyData.claudeUsage) * 0.012;
    const disciplineSavings = monthlyData.disciplineOptimization * 0.004;
    const offPeakSavings = monthlyData.offPeakSessions * 0.002;
    
    return Math.max(0, cachingCost + modelOptimizationCost - disciplineSavings - offPeakSavings);
  }
}

export const advancedCostOptimization = new AdvancedCostOptimization();

// Auto-start off-peak processing
setInterval(() => {
  advancedCostOptimization.processOffPeakQueue();
}, 30 * 60 * 1000); // Check every 30 minutes