import { db } from "../db";
import { threadExchanges } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { intelligentModelRouter } from "./intelligent-model-router";

export class CostOptimizationService {
  
  /**
   * Get comprehensive cost analytics for a user
   */
  async getUserCostAnalytics(userId: string, timeframeHours: number = 24): Promise<any> {
    const cutoffTime = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);
    
    try {
      // Get recent exchanges with cost data
      const exchanges = await db.select()
        .from(threadExchanges)
        .where(and(
          eq(threadExchanges.userId, userId),
          gte(threadExchanges.createdAt, cutoffTime)
        ))
        .orderBy(desc(threadExchanges.createdAt));

      const costData = exchanges.map(exchange => ({
        cost: exchange.cost || 0,
        modelUsed: exchange.modelUsed || 'unknown',
        provider: exchange.provider || 'openai',
        tokenCount: exchange.tokenCount || 0,
        createdAt: exchange.createdAt,
        complexity: this.estimateComplexity(exchange)
      }));

      const analytics = intelligentModelRouter.getCostAnalysis(costData);
      
      return {
        ...analytics,
        timeframe: `${timeframeHours}h`,
        exchangeCount: exchanges.length,
        costTrends: this.calculateCostTrends(costData),
        modelEfficiency: this.calculateModelEfficiency(costData),
        recommendations: this.generateCostRecommendations(costData, analytics)
      };

    } catch (error) {
      console.error('Error getting cost analytics:', error);
      return {
        totalCost: 0,
        exchangeCount: 0,
        modelBreakdown: {},
        averageCostPerInteraction: 0,
        recommendations: [],
        error: 'Failed to fetch cost analytics'
      };
    }
  }

  /**
   * Get real-time cost recommendations based on usage patterns
   */
  async getRealTimeCostRecommendations(userId: string): Promise<any> {
    try {
      const recentExchanges = await db.select()
        .from(threadExchanges)
        .where(eq(threadExchanges.userId, userId))
        .orderBy(desc(threadExchanges.createdAt))
        .limit(10);

      const recommendations = [];
      const totalCost = recentExchanges.reduce((sum, ex) => sum + (ex.cost || 0), 0);
      const avgCost = totalCost / Math.max(recentExchanges.length, 1);

      // High cost threshold recommendations
      if (avgCost > 0.02) {
        recommendations.push({
          type: 'cost_optimization',
          priority: 'high',
          message: 'Consider using Claude for empathetic conversations - typically 40% more cost-effective',
          action: 'Switch to Claude for emotional support sessions'
        });
      }

      // Model selection recommendations
      const openaiUsage = recentExchanges.filter(ex => ex.provider === 'openai').length;
      const claudeUsage = recentExchanges.filter(ex => ex.provider === 'anthropic').length;
      
      if (openaiUsage > claudeUsage * 3) {
        recommendations.push({
          type: 'model_balance',
          priority: 'medium',
          message: 'Balance model usage - Claude excels at nuanced therapeutic conversations',
          action: 'Try Claude for your next emotional exploration session'
        });
      }

      // Simple query optimization
      const simpleQueries = recentExchanges.filter(ex => 
        (ex.userInput?.length || 0) < 100 && ex.modelUsed === 'gpt-4o'
      ).length;
      
      if (simpleQueries > 3) {
        recommendations.push({
          type: 'query_optimization',
          priority: 'low',
          message: 'Use GPT-4o mini for shorter reflections to reduce costs by 80%',
          action: 'Keep responses under 100 characters for automatic cost optimization'
        });
      }

      return {
        totalCost,
        averageCost,
        recommendations,
        potentialSavings: this.calculatePotentialSavings(recentExchanges)
      };

    } catch (error) {
      console.error('Error getting real-time recommendations:', error);
      return {
        recommendations: [],
        error: 'Failed to generate recommendations'
      };
    }
  }

  /**
   * Track cost savings from intelligent model routing
   */
  async trackCostSavings(userId: string, days: number = 7): Promise<any> {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    try {
      const exchanges = await db.select()
        .from(threadExchanges)
        .where(and(
          eq(threadExchanges.userId, userId),
          gte(threadExchanges.createdAt, cutoffTime)
        ));

      const actualCost = exchanges.reduce((sum, ex) => sum + (ex.cost || 0), 0);
      
      // Calculate what it would have cost using only GPT-4o
      const gpt4oCost = exchanges.reduce((sum, ex) => {
        const tokens = ex.tokenCount || 1000; // estimate
        return sum + (tokens / 1000) * 0.005; // GPT-4o pricing
      }, 0);

      const savings = gpt4oCost - actualCost;
      const savingsPercentage = gpt4oCost > 0 ? (savings / gpt4oCost) * 100 : 0;

      return {
        actualCost,
        potentialCost: gpt4oCost,
        totalSavings: savings,
        savingsPercentage,
        exchangeCount: exchanges.length,
        averageSavingsPerExchange: savings / Math.max(exchanges.length, 1)
      };

    } catch (error) {
      console.error('Error tracking cost savings:', error);
      return {
        actualCost: 0,
        totalSavings: 0,
        savingsPercentage: 0,
        error: 'Failed to calculate savings'
      };
    }
  }

  /**
   * Estimate complexity of an exchange for analytics
   */
  private estimateComplexity(exchange: any): 'simple' | 'moderate' | 'complex' {
    const inputLength = exchange.userInput?.length || 0;
    const hasEmotionalWords = exchange.userInput?.toLowerCase().includes('anxiety') ||
                             exchange.userInput?.toLowerCase().includes('depression') ||
                             exchange.userInput?.toLowerCase().includes('trauma');
    
    if (inputLength > 500 || hasEmotionalWords) return 'complex';
    if (inputLength > 200) return 'moderate';
    return 'simple';
  }

  /**
   * Calculate cost trends over time
   */
  private calculateCostTrends(costData: any[]): any {
    if (costData.length < 2) return { trend: 'stable', change: 0 };
    
    const sortedData = costData.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
    const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, item) => sum + item.cost, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.cost, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    return {
      trend: change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable',
      change: Math.round(change * 100) / 100
    };
  }

  /**
   * Calculate efficiency metrics for different models
   */
  private calculateModelEfficiency(costData: any[]): any {
    const modelStats = costData.reduce((stats, item) => {
      const model = item.modelUsed || 'unknown';
      if (!stats[model]) {
        stats[model] = { totalCost: 0, count: 0, totalTokens: 0 };
      }
      stats[model].totalCost += item.cost;
      stats[model].count += 1;
      stats[model].totalTokens += item.tokenCount || 0;
      return stats;
    }, {} as any);

    return Object.entries(modelStats).map(([model, stats]: [string, any]) => ({
      model,
      averageCost: stats.totalCost / stats.count,
      costPerToken: stats.totalTokens > 0 ? stats.totalCost / stats.totalTokens : 0,
      usageCount: stats.count,
      efficiency: this.calculateEfficiencyScore(stats.totalCost, stats.count, stats.totalTokens)
    }));
  }

  /**
   * Calculate efficiency score for model performance
   */
  private calculateEfficiencyScore(totalCost: number, count: number, totalTokens: number): number {
    const avgCost = totalCost / count;
    const costPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;
    
    // Lower cost = higher efficiency (inverted scale)
    const costEfficiency = Math.max(0, 1 - (avgCost / 0.01));
    const tokenEfficiency = Math.max(0, 1 - (costPerToken / 0.00001));
    
    return Math.round(((costEfficiency + tokenEfficiency) / 2) * 100);
  }

  /**
   * Generate personalized cost recommendations
   */
  private generateCostRecommendations(costData: any[], analytics: any): any[] {
    const recommendations = [];
    
    // High cost alerts
    if (analytics.averageCostPerInteraction > 0.03) {
      recommendations.push({
        type: 'high_cost_alert',
        priority: 'high',
        message: 'Your therapeutic sessions are costing more than average',
        suggestions: [
          'Try Claude for emotional conversations (50% cost reduction)',
          'Use shorter, focused queries when possible',
          'Consider batch processing multiple thoughts in one session'
        ]
      });
    }

    // Model optimization suggestions
    const openaiCost = costData.filter(d => d.provider === 'openai').reduce((s, d) => s + d.cost, 0);
    const claudeCost = costData.filter(d => d.provider === 'anthropic').reduce((s, d) => s + d.cost, 0);
    
    if (openaiCost > claudeCost * 2) {
      recommendations.push({
        type: 'model_optimization',
        priority: 'medium',
        message: 'Switch to Claude for better cost efficiency',
        suggestions: [
          'Claude excels at empathetic therapeutic responses',
          'Better cost-per-quality ratio for emotional support',
          'More natural conversational flow for therapy'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Calculate potential savings from optimization
   */
  private calculatePotentialSavings(exchanges: any[]): any {
    let potentialSavings = 0;
    let currentCost = 0;
    
    exchanges.forEach(exchange => {
      currentCost += exchange.cost || 0;
      
      // Calculate savings if using optimal model
      const inputLength = exchange.userInput?.length || 0;
      if (inputLength < 100 && exchange.modelUsed === 'gpt-4o') {
        // Could save 80% using GPT-4o mini
        potentialSavings += (exchange.cost || 0) * 0.8;
      } else if (exchange.provider === 'openai' && inputLength > 200) {
        // Could save 40% using Claude for longer therapeutic conversations
        potentialSavings += (exchange.cost || 0) * 0.4;
      }
    });

    return {
      currentCost,
      potentialSavings,
      savingsPercentage: currentCost > 0 ? (potentialSavings / currentCost) * 100 : 0,
      monthlySavingsEstimate: potentialSavings * 30 // rough monthly estimate
    };
  }
}

export const costOptimizationService = new CostOptimizationService();