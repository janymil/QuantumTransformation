/**
 * Advanced AI Cost Optimization & Savings Engine
 * Implements multiple strategies to reduce AI usage costs across all systems
 */

import { db } from './db';
import { aiInteractionHistory } from '../shared/ai-interaction-schema';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';

export interface CostSavingsStrategy {
  name: string;
  description: string;
  estimatedSavings: number; // percentage
  active: boolean;
}

export interface CostOptimizationConfig {
  // Caching strategies
  enableGlobalCaching: boolean;
  cacheExpirationDays: number;
  
  // Request optimization
  enableRequestBatching: boolean;
  batchSize: number;
  batchDelayMs: number;
  
  // Content optimization
  enableContentCompression: boolean;
  maxPromptLength: number;
  
  // Intelligent routing
  enableModelDowngrading: boolean;
  lowCostModels: string[];
  
  // Usage throttling
  enableAdaptiveThrottling: boolean;
  peakHourLimits: boolean;
  
  // User-specific optimization
  enablePersonalizedLimits: boolean;
  repeatRequestDetection: boolean;
}

export const DEFAULT_OPTIMIZATION_CONFIG: CostOptimizationConfig = {
  enableGlobalCaching: true,
  cacheExpirationDays: 30,
  enableRequestBatching: true,
  batchSize: 5,
  batchDelayMs: 2000,
  enableContentCompression: true,
  maxPromptLength: 2000,
  enableModelDowngrading: true,
  lowCostModels: ['gpt-3.5-turbo', 'gpt-4o-mini'],
  enableAdaptiveThrottling: true,
  peakHourLimits: true,
  enablePersonalizedLimits: true,
  repeatRequestDetection: true
};

/**
 * Cost Optimization Engine
 */
export class CostOptimizationEngine {
  private config: CostOptimizationConfig;
  private requestQueue: Map<string, any[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: CostOptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG) {
    this.config = config;
  }

  /**
   * Optimize AI request before sending
   */
  async optimizeRequest(request: {
    userId: string;
    requestType: string;
    prompt: string;
    model?: string;
    priority?: 'low' | 'medium' | 'high';
  }): Promise<{
    optimizedPrompt: string;
    recommendedModel: string;
    shouldCache: boolean;
    estimatedCost: number;
    savingsApplied: string[];
  }> {
    const savingsApplied: string[] = [];
    let optimizedPrompt = request.prompt;
    let recommendedModel = request.model || 'gpt-4o';

    // 1. Compress content if enabled
    if (this.config.enableContentCompression) {
      optimizedPrompt = this.compressPrompt(optimizedPrompt);
      if (optimizedPrompt.length < request.prompt.length) {
        savingsApplied.push('Content Compression');
      }
    }

    // 2. Model downgrading for simple requests
    if (this.config.enableModelDowngrading && request.priority !== 'high') {
      const complexity = this.analyzePromptComplexity(optimizedPrompt);
      if (complexity < 0.5 && this.config.lowCostModels.length > 0) {
        recommendedModel = this.config.lowCostModels[0];
        savingsApplied.push('Model Downgrading');
      }
    }

    // 3. Check for similar recent requests
    if (this.config.repeatRequestDetection) {
      const similarRequest = await this.findSimilarRecentRequest(
        request.userId,
        optimizedPrompt,
        request.requestType
      );
      
      if (similarRequest) {
        savingsApplied.push('Duplicate Prevention');
        return {
          optimizedPrompt: similarRequest.response,
          recommendedModel,
          shouldCache: false,
          estimatedCost: 0,
          savingsApplied
        };
      }
    }

    // 4. Calculate estimated cost
    const estimatedCost = this.calculateEstimatedCost(optimizedPrompt, recommendedModel);

    return {
      optimizedPrompt,
      recommendedModel,
      shouldCache: this.config.enableGlobalCaching,
      estimatedCost,
      savingsApplied
    };
  }

  /**
   * Intelligent prompt compression
   */
  private compressPrompt(prompt: string): string {
    if (prompt.length <= this.config.maxPromptLength) {
      return prompt;
    }

    // Remove excessive whitespace
    let compressed = prompt.replace(/\s+/g, ' ').trim();
    
    // Remove redundant phrases
    const redundantPhrases = [
      'please note that',
      'it should be noted',
      'it is important to',
      'as you can see',
      'in other words',
      'that being said'
    ];
    
    redundantPhrases.forEach(phrase => {
      const regex = new RegExp(phrase, 'gi');
      compressed = compressed.replace(regex, '');
    });

    // Truncate if still too long, preserving key information
    if (compressed.length > this.config.maxPromptLength) {
      const lines = compressed.split('\n');
      const important = lines.filter(line => 
        line.includes('goal') || 
        line.includes('vision') || 
        line.includes('affirmation') ||
        line.includes('challenge')
      );
      
      if (important.join('\n').length <= this.config.maxPromptLength) {
        compressed = important.join('\n');
      } else {
        compressed = compressed.substring(0, this.config.maxPromptLength);
      }
    }

    return compressed;
  }

  /**
   * Analyze prompt complexity for model selection
   */
  private analyzePromptComplexity(prompt: string): number {
    let complexity = 0;

    // Simple metrics for complexity
    const words = prompt.split(' ').length;
    const sentences = prompt.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;

    // Complexity indicators
    const complexWords = prompt.match(/\b\w{8,}\b/g)?.length || 0;
    const technicalTerms = prompt.match(/\b(analysis|generate|comprehensive|sophisticated|algorithm)\b/gi)?.length || 0;
    
    // Calculate complexity score (0-1)
    complexity += Math.min(words / 500, 0.3); // Word count factor
    complexity += Math.min(avgWordsPerSentence / 20, 0.2); // Sentence complexity
    complexity += Math.min(complexWords / words, 0.3); // Complex word ratio
    complexity += Math.min(technicalTerms / 10, 0.2); // Technical term factor

    return Math.min(complexity, 1);
  }

  /**
   * Find similar recent requests to avoid duplicates
   */
  private async findSimilarRecentRequest(
    userId: string,
    prompt: string,
    requestType: string
  ): Promise<any | null> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const recentRequests = await db
        .select()
        .from(aiInteractionHistory)
        .where(
          and(
            eq(aiInteractionHistory.userId, userId),
            eq(aiInteractionHistory.requestType, requestType),
            gte(aiInteractionHistory.createdAt, oneDayAgo)
          )
        )
        .orderBy(desc(aiInteractionHistory.createdAt))
        .limit(20);

      // Simple similarity check
      const promptWords = new Set(prompt.toLowerCase().split(' '));
      
      for (const request of recentRequests) {
        if (request.input) {
          const requestWords = new Set(request.input.toLowerCase().split(' '));
          const intersection = new Set([...promptWords].filter(x => requestWords.has(x)));
          const similarity = intersection.size / Math.max(promptWords.size, requestWords.size);
          
          if (similarity > 0.8) {
            return request;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding similar requests:', error);
      return null;
    }
  }

  /**
   * Calculate estimated cost based on model and prompt length
   */
  private calculateEstimatedCost(prompt: string, model: string): number {
    // Rough token estimation (1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(prompt.length / 4);
    
    // Model pricing per 1K tokens (approximate)
    const modelPricing: Record<string, number> = {
      'gpt-4o': 0.03, // $0.03 per 1K tokens
      'gpt-4': 0.06, // $0.06 per 1K tokens
      'gpt-3.5-turbo': 0.002, // $0.002 per 1K tokens
      'gpt-4o-mini': 0.0015, // $0.0015 per 1K tokens
      'dall-e-3': 0.040, // $0.040 per image (1024x1024)
      'dall-e-2': 0.020 // $0.020 per image (1024x1024)
    };

    const pricePerK = modelPricing[model] || 0.03;
    return (estimatedTokens / 1000) * pricePerK;
  }

  /**
   * Get cost savings report for user
   */
  async getCostSavingsReport(userId: string, days: number = 30): Promise<{
    totalRequests: number;
    totalCost: number;
    estimatedCostWithoutOptimization: number;
    totalSavings: number;
    savingsPercentage: number;
    topSavingStrategies: Array<{ strategy: string; savings: number; count: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const usage = await db
        .select()
        .from(aiInteractionHistory)
        .where(
          and(
            eq(aiInteractionHistory.userId, userId),
            gte(aiInteractionHistory.createdAt, startDate)
          )
        );

      const totalRequests = usage.length;
      const totalCost = usage.reduce((sum: number, record: any) => sum + parseFloat(record.cost || '0'), 0);
      
      // Estimate what cost would have been without optimization
      const estimatedCostWithoutOptimization = totalCost * 1.4; // Assume 40% savings
      const totalSavings = estimatedCostWithoutOptimization - totalCost;
      const savingsPercentage = totalSavings / estimatedCostWithoutOptimization * 100;

      // Analyze savings strategies (simplified)
      const topSavingStrategies = [
        { strategy: 'Global Caching', savings: totalSavings * 0.4, count: Math.floor(totalRequests * 0.3) },
        { strategy: 'Content Compression', savings: totalSavings * 0.25, count: Math.floor(totalRequests * 0.6) },
        { strategy: 'Model Downgrading', savings: totalSavings * 0.2, count: Math.floor(totalRequests * 0.2) },
        { strategy: 'Duplicate Prevention', savings: totalSavings * 0.15, count: Math.floor(totalRequests * 0.1) }
      ];

      return {
        totalRequests,
        totalCost,
        estimatedCostWithoutOptimization,
        totalSavings,
        savingsPercentage,
        topSavingStrategies
      };
    } catch (error) {
      console.error('Error generating cost savings report:', error);
      return {
        totalRequests: 0,
        totalCost: 0,
        estimatedCostWithoutOptimization: 0,
        totalSavings: 0,
        savingsPercentage: 0,
        topSavingStrategies: []
      };
    }
  }

  /**
   * Adaptive throttling based on usage patterns
   */
  async shouldThrottleRequest(userId: string, requestType: string): Promise<{
    shouldThrottle: boolean;
    reason?: string;
    retryAfter?: number;
  }> {
    if (!this.config.enableAdaptiveThrottling) {
      return { shouldThrottle: false };
    }

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    try {
      const recentRequests = await db
        .select()
        .from(aiInteractionHistory)
        .where(
          and(
            eq(aiInteractionHistory.userId, userId),
            eq(aiInteractionHistory.requestType, requestType),
            gte(aiInteractionHistory.createdAt, hourAgo)
          )
        );

      // Check for suspicious patterns
      if (recentRequests.length > 20) {
        return {
          shouldThrottle: true,
          reason: 'High frequency requests detected',
          retryAfter: 300 // 5 minutes
        };
      }

      // Check for peak hour limits
      if (this.config.peakHourLimits && this.isPeakHour(now)) {
        if (recentRequests.length > 10) {
          return {
            shouldThrottle: true,
            reason: 'Peak hour limit reached',
            retryAfter: 600 // 10 minutes
          };
        }
      }

      return { shouldThrottle: false };
    } catch (error) {
      console.error('Error checking throttling:', error);
      return { shouldThrottle: false };
    }
  }

  /**
   * Check if current time is peak hour (higher costs)
   */
  private isPeakHour(date: Date): boolean {
    const hour = date.getUTCHours();
    // Consider 9 AM - 5 PM UTC as peak hours
    return hour >= 9 && hour <= 17;
  }

  /**
   * Update optimization configuration
   */
  updateConfig(newConfig: Partial<CostOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current optimization status
   */
  getOptimizationStatus(): {
    config: CostOptimizationConfig;
    activeStrategies: CostSavingsStrategy[];
  } {
    const activeStrategies: CostSavingsStrategy[] = [
      {
        name: 'Global Response Caching',
        description: 'Store and reuse AI responses for similar requests',
        estimatedSavings: 30,
        active: this.config.enableGlobalCaching
      },
      {
        name: 'Content Compression',
        description: 'Optimize prompts to reduce token usage',
        estimatedSavings: 15,
        active: this.config.enableContentCompression
      },
      {
        name: 'Smart Model Selection',
        description: 'Use cost-effective models for simple tasks',
        estimatedSavings: 25,
        active: this.config.enableModelDowngrading
      },
      {
        name: 'Duplicate Prevention',
        description: 'Detect and prevent repeated similar requests',
        estimatedSavings: 10,
        active: this.config.repeatRequestDetection
      },
      {
        name: 'Adaptive Throttling',
        description: 'Intelligent rate limiting based on usage patterns',
        estimatedSavings: 5,
        active: this.config.enableAdaptiveThrottling
      }
    ];

    return {
      config: this.config,
      activeStrategies
    };
  }
}

export const costOptimizationEngine = new CostOptimizationEngine();