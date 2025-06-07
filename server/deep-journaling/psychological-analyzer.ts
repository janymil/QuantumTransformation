import { PsychologicalAnalysis, EmotionalStateAnalysis } from "./types";
import { db } from "../db";
import { 
  emotionalStateHistory, 
  threadExchanges, 
  journalingThreads,
  psychologicalProfile 
} from "@shared/schema";
import { eq, and, gte, desc, count } from "drizzle-orm";

export class PsychologicalAnalyzer {
  
  /**
   * Perform comprehensive psychological analysis of user's writing
   */
  async analyzeUserWriting(
    userId: string, 
    userInput: string, 
    threadHistory: any[], 
    userProfile: any
  ): Promise<PsychologicalAnalysis> {
    
    // Get emotional history
    const emotionalHistory = await this.getEmotionalHistory(userId);
    
    // Analyze patterns
    const emotionalPatterns = this.identifyEmotionalPatterns(emotionalHistory, threadHistory);
    const cognitivePatterns = this.identifyCognitivePatterns(userInput, threadHistory);
    const behavioralInsights = this.analyzeBehavioralPatterns(threadHistory, userProfile);
    
    // Identify growth opportunities and strengths
    const growthOpportunities = this.identifyGrowthOpportunities(cognitivePatterns, emotionalPatterns);
    const strengthAreas = this.identifyStrengthAreas(threadHistory, userProfile);
    const riskFactors = this.assessRiskFactors(emotionalHistory, cognitivePatterns);
    
    return {
      emotionalPatterns,
      cognitivePatterns,
      behavioralInsights,
      growthOpportunities,
      strengthAreas,
      riskFactors
    };
  }

  /**
   * Analyze emotional state from text
   */
  analyzeEmotionalState(text: string, context?: any): EmotionalStateAnalysis {
    // Advanced emotion detection would use NLP models
    // For now, using keyword-based analysis with psychological frameworks
    
    const emotionalKeywords = {
      joy: ['happy', 'excited', 'thrilled', 'elated', 'cheerful', 'delighted', 'euphoric'],
      sadness: ['sad', 'depressed', 'melancholy', 'grief', 'sorrow', 'despair', 'heartbroken'],
      anger: ['angry', 'furious', 'rage', 'frustrated', 'irritated', 'livid', 'outraged'],
      fear: ['afraid', 'scared', 'terrified', 'anxious', 'worried', 'nervous', 'panicked'],
      disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'appalled'],
      surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned'],
      confusion: ['confused', 'puzzled', 'bewildered', 'perplexed', 'uncertain', 'lost'],
      shame: ['ashamed', 'guilty', 'embarrassed', 'humiliated', 'mortified'],
      love: ['love', 'adore', 'cherish', 'treasure', 'devoted', 'affectionate'],
      hope: ['hopeful', 'optimistic', 'confident', 'encouraged', 'inspired'],
      peace: ['peaceful', 'calm', 'serene', 'tranquil', 'relaxed', 'content']
    };

    const detectedEmotions: { emotion: string; strength: number }[] = [];
    
    for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
      const matches = keywords.filter(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      
      if (matches > 0) {
        detectedEmotions.push({ emotion, strength: matches });
      }
    }

    // Sort by strength and get primary emotion
    detectedEmotions.sort((a, b) => b.strength - a.strength);
    
    const primaryEmotion = detectedEmotions[0]?.emotion || 'neutral';
    const secondaryEmotions = detectedEmotions.slice(1, 3).map(e => e.emotion);
    
    // Calculate intensity based on emotional language strength
    const intensityWords = ['very', 'extremely', 'incredibly', 'absolutely', 'completely', 'totally'];
    const intensityScore = intensityWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    const intensity = Math.min(0.5 + (intensityScore * 0.2), 1.0);
    
    // Calculate clarity based on emotional specificity
    const specificEmotionalWords = text.split(' ').filter(word => 
      Object.values(emotionalKeywords).flat().includes(word.toLowerCase())
    ).length;
    const clarity = Math.min(specificEmotionalWords * 0.3, 1.0);
    
    return {
      primaryEmotion,
      secondaryEmotions,
      intensity,
      clarity,
      triggers: this.identifyTriggers(text),
      context: context?.summary || 'Current writing session'
    };
  }

  /**
   * Get user's emotional history
   */
  private async getEmotionalHistory(userId: string, days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await db
      .select()
      .from(emotionalStateHistory)
      .where(and(
        eq(emotionalStateHistory.userId, userId),
        gte(emotionalStateHistory.createdAt, cutoffDate)
      ))
      .orderBy(desc(emotionalStateHistory.createdAt));
  }

  /**
   * Identify emotional patterns from history
   */
  private identifyEmotionalPatterns(emotionalHistory: any[], threadHistory: any[]) {
    if (emotionalHistory.length === 0) return {};

    // Group emotions by type
    const emotionCounts: Record<string, number> = {};
    emotionalHistory.forEach(record => {
      emotionCounts[record.primaryEmotion] = (emotionCounts[record.primaryEmotion] || 0) + 1;
    });

    // Calculate emotional volatility
    const intensities = emotionalHistory.map(record => record.emotionalIntensity);
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const volatility = this.calculateStandardDeviation(intensities);

    // Identify trending emotions
    const recentEmotions = emotionalHistory.slice(0, 10).map(r => r.primaryEmotion);
    const olderEmotions = emotionalHistory.slice(10, 20).map(r => r.primaryEmotion);
    
    return {
      dominantEmotions: Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([emotion, count]) => ({ emotion, frequency: count })),
      averageIntensity: avgIntensity,
      emotionalVolatility: volatility,
      recentTrends: this.compareEmotionalPeriods(recentEmotions, olderEmotions),
      emotionalRange: Object.keys(emotionCounts).length
    };
  }

  /**
   * Identify cognitive patterns from text analysis
   */
  private identifyCognitivePatterns(userInput: string, threadHistory: any[]): string[] {
    const patterns: string[] = [];
    const text = userInput.toLowerCase();

    // Cognitive distortion patterns
    if (text.includes('always') || text.includes('never') || text.includes('everyone') || text.includes('no one')) {
      patterns.push('All-or-nothing thinking');
    }
    
    if (text.includes('should') || text.includes('must') || text.includes('have to')) {
      patterns.push('Should statements');
    }
    
    if (text.includes('terrible') || text.includes('awful') || text.includes('disaster')) {
      patterns.push('Catastrophizing');
    }
    
    if (text.includes('my fault') || text.includes('i caused') || text.includes('i\'m responsible')) {
      patterns.push('Personalization');
    }
    
    if (text.includes('can\'t') || text.includes('impossible') || text.includes('won\'t work')) {
      patterns.push('Mental filtering');
    }

    // Positive cognitive patterns
    if (text.includes('grateful') || text.includes('thankful') || text.includes('appreciate')) {
      patterns.push('Gratitude practice');
    }
    
    if (text.includes('learned') || text.includes('growing') || text.includes('improving')) {
      patterns.push('Growth mindset');
    }
    
    if (text.includes('perspective') || text.includes('different view') || text.includes('another way')) {
      patterns.push('Perspective-taking');
    }

    return patterns;
  }

  /**
   * Analyze behavioral patterns from thread history
   */
  private analyzeBehavioralPatterns(threadHistory: any[], userProfile: any): string[] {
    const insights: string[] = [];
    
    if (threadHistory.length === 0) return insights;

    // Writing frequency patterns
    const writingTimes = threadHistory.map(exchange => new Date(exchange.createdAt).getHours());
    const avgWritingTime = writingTimes.reduce((a, b) => a + b, 0) / writingTimes.length;
    
    if (avgWritingTime < 8) {
      insights.push('Tends to engage in self-reflection during early morning hours');
    } else if (avgWritingTime > 20) {
      insights.push('Prefers evening reflection and introspection');
    }

    // Response length patterns
    const responseLengths = threadHistory.map(exchange => exchange.userWordCount || 0);
    const avgLength = responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length;
    
    if (avgLength > 100) {
      insights.push('Demonstrates thorough, detailed self-expression');
    } else if (avgLength < 30) {
      insights.push('Tends toward concise, direct communication');
    }

    // Engagement consistency
    const sessionGaps = this.calculateSessionGaps(threadHistory);
    if (sessionGaps.some(gap => gap > 7)) {
      insights.push('Shows periodic disengagement patterns');
    } else if (sessionGaps.every(gap => gap <= 2)) {
      insights.push('Maintains consistent self-reflection practice');
    }

    return insights;
  }

  /**
   * Identify growth opportunities
   */
  private identifyGrowthOpportunities(cognitivePatterns: string[], emotionalPatterns: any): string[] {
    const opportunities: string[] = [];
    
    if (cognitivePatterns.includes('All-or-nothing thinking')) {
      opportunities.push('Developing nuanced thinking and gray-area tolerance');
    }
    
    if (cognitivePatterns.includes('Catastrophizing')) {
      opportunities.push('Building realistic risk assessment skills');
    }
    
    if (cognitivePatterns.includes('Should statements')) {
      opportunities.push('Practicing self-compassion and flexible expectations');
    }
    
    if (emotionalPatterns.emotionalVolatility > 0.5) {
      opportunities.push('Developing emotional regulation and stability techniques');
    }
    
    if (emotionalPatterns.emotionalRange < 3) {
      opportunities.push('Expanding emotional vocabulary and awareness');
    }

    return opportunities;
  }

  /**
   * Identify strength areas
   */
  private identifyStrengthAreas(threadHistory: any[], userProfile: any): string[] {
    const strengths: string[] = [];
    
    if (threadHistory.length > 10) {
      strengths.push('Strong commitment to self-reflection and growth');
    }
    
    // Check for positive cognitive patterns
    const allText = threadHistory.map(exchange => exchange.userInput).join(' ').toLowerCase();
    
    if (allText.includes('grateful') || allText.includes('thankful')) {
      strengths.push('Natural inclination toward gratitude');
    }
    
    if (allText.includes('learned') || allText.includes('insight')) {
      strengths.push('Active learning and insight integration');
    }
    
    if (allText.includes('others') || allText.includes('relationship')) {
      strengths.push('Awareness of interpersonal dynamics');
    }

    return strengths;
  }

  /**
   * Assess risk factors
   */
  private assessRiskFactors(emotionalHistory: any[], cognitivePatterns: string[]): string[] {
    const risks: string[] = [];
    
    // Check for concerning emotional patterns
    const recentSadness = emotionalHistory
      .slice(0, 10)
      .filter(record => record.primaryEmotion === 'sadness').length;
    
    if (recentSadness > 5) {
      risks.push('Persistent low mood pattern detected');
    }
    
    const highIntensityEmotions = emotionalHistory
      .filter(record => record.emotionalIntensity > 0.8).length;
    
    if (highIntensityEmotions > emotionalHistory.length * 0.5) {
      risks.push('High emotional intensity frequency');
    }
    
    if (cognitivePatterns.includes('All-or-nothing thinking') && 
        cognitivePatterns.includes('Catastrophizing')) {
      risks.push('Multiple cognitive distortion patterns present');
    }

    return risks;
  }

  /**
   * Helper methods
   */
  private identifyTriggers(text: string): string[] {
    const triggers: string[] = [];
    const triggerKeywords = {
      'Relationship conflict': ['argument', 'fight', 'disagreement', 'conflict'],
      'Work stress': ['work', 'job', 'boss', 'deadline', 'pressure'],
      'Family issues': ['family', 'parents', 'siblings', 'relatives'],
      'Health concerns': ['health', 'sick', 'pain', 'medical', 'doctor'],
      'Financial stress': ['money', 'financial', 'bills', 'debt', 'budget']
    };

    for (const [trigger, keywords] of Object.entries(triggerKeywords)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        triggers.push(trigger);
      }
    }

    return triggers;
  }

  private calculateStandardDeviation(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private compareEmotionalPeriods(recent: string[], older: string[]): any {
    const recentCounts: Record<string, number> = {};
    const olderCounts: Record<string, number> = {};
    
    recent.forEach(emotion => {
      recentCounts[emotion] = (recentCounts[emotion] || 0) + 1;
    });
    
    older.forEach(emotion => {
      olderCounts[emotion] = (olderCounts[emotion] || 0) + 1;
    });
    
    return {
      increasing: Object.keys(recentCounts).filter(emotion => 
        (recentCounts[emotion] || 0) > (olderCounts[emotion] || 0)
      ),
      decreasing: Object.keys(olderCounts).filter(emotion => 
        (olderCounts[emotion] || 0) > (recentCounts[emotion] || 0)
      )
    };
  }

  private calculateSessionGaps(threadHistory: any[]): number[] {
    if (threadHistory.length < 2) return [];
    
    const gaps: number[] = [];
    for (let i = 1; i < threadHistory.length; i++) {
      const current = new Date(threadHistory[i].createdAt);
      const previous = new Date(threadHistory[i-1].createdAt);
      const gapDays = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
      gaps.push(gapDays);
    }
    
    return gaps;
  }

  /**
   * Generate insights summary for user profile
   */
  async generateProfileInsights(userId: string): Promise<any> {
    const emotionalHistory = await this.getEmotionalHistory(userId, 90); // 3 months
    const recentThreads = await this.getRecentThreads(userId);
    
    if (emotionalHistory.length === 0) return null;
    
    return {
      emotionalStability: this.assessEmotionalStability(emotionalHistory),
      communicationStyle: this.assessCommunicationStyle(recentThreads),
      engagementPattern: this.assessEngagementPattern(recentThreads),
      growthTrajectory: this.assessGrowthTrajectory(emotionalHistory, recentThreads),
      recommendations: this.generateRecommendations(emotionalHistory, recentThreads)
    };
  }

  private async getRecentThreads(userId: string) {
    return await db
      .select()
      .from(threadExchanges)
      .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
      .where(eq(journalingThreads.userId, userId))
      .orderBy(desc(threadExchanges.createdAt))
      .limit(50);
  }

  private assessEmotionalStability(emotionalHistory: any[]): any {
    const intensities = emotionalHistory.map(record => record.emotionalIntensity);
    const volatility = this.calculateStandardDeviation(intensities);
    
    return {
      score: Math.max(0, 1 - volatility), // Higher score = more stable
      trend: this.calculateTrend(intensities),
      consistency: volatility < 0.3 ? 'high' : volatility < 0.6 ? 'moderate' : 'low'
    };
  }

  private assessCommunicationStyle(recentThreads: any[]): string {
    if (recentThreads.length === 0) return 'unknown';
    
    const avgWordCount = recentThreads.reduce((sum, thread) => 
      sum + (thread.userWordCount || 0), 0) / recentThreads.length;
    const emotionalWords = recentThreads.filter(thread => 
      this.containsEmotionalLanguage(thread.userInput)).length;
    
    if (avgWordCount > 100 && emotionalWords > recentThreads.length * 0.7) {
      return 'expressive_detailed';
    } else if (avgWordCount > 100) {
      return 'analytical_detailed';
    } else if (emotionalWords > recentThreads.length * 0.7) {
      return 'emotionally_direct';
    } else {
      return 'concise_practical';
    }
  }

  private assessEngagementPattern(recentThreads: any[]): any {
    if (recentThreads.length === 0) return { level: 'none', consistency: 'unknown' };
    
    const sessionDates = recentThreads.map(thread => 
      new Date(thread.createdAt).toDateString()
    );
    const uniqueDays = new Set(sessionDates).size;
    const totalDays = 30; // Looking at last 30 days
    
    return {
      level: uniqueDays > 20 ? 'high' : uniqueDays > 10 ? 'moderate' : 'low',
      consistency: this.calculateConsistency(sessionDates),
      frequency: uniqueDays / totalDays
    };
  }

  private assessGrowthTrajectory(emotionalHistory: any[], recentThreads: any[]): any {
    const recentEmotions = emotionalHistory.slice(0, 15);
    const olderEmotions = emotionalHistory.slice(15, 30);
    
    const recentPositiveRatio = this.calculatePositiveEmotionRatio(recentEmotions);
    const olderPositiveRatio = this.calculatePositiveEmotionRatio(olderEmotions);
    
    return {
      direction: recentPositiveRatio > olderPositiveRatio ? 'improving' : 
                 recentPositiveRatio < olderPositiveRatio ? 'declining' : 'stable',
      magnitude: Math.abs(recentPositiveRatio - olderPositiveRatio),
      confidence: emotionalHistory.length > 30 ? 'high' : 'moderate'
    };
  }

  private generateRecommendations(emotionalHistory: any[], recentThreads: any[]): string[] {
    const recommendations: string[] = [];
    
    const emotionalPatterns = this.identifyEmotionalPatterns(emotionalHistory, recentThreads);
    
    if (emotionalPatterns.emotionalVolatility > 0.6) {
      recommendations.push('Consider exploring emotional regulation techniques');
    }
    
    if (emotionalPatterns.emotionalRange < 4) {
      recommendations.push('Experiment with expanding emotional vocabulary');
    }
    
    const engagementPattern = this.assessEngagementPattern(recentThreads);
    if (engagementPattern.level === 'low') {
      recommendations.push('Consider establishing a more regular journaling routine');
    }
    
    return recommendations;
  }

  private containsEmotionalLanguage(text: string): boolean {
    const emotionalWords = ['feel', 'emotion', 'happy', 'sad', 'angry', 'afraid', 'excited', 'worried'];
    return emotionalWords.some(word => text.toLowerCase().includes(word));
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (Math.abs(difference) < 0.1) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  }

  private calculateConsistency(sessionDates: string[]): 'high' | 'moderate' | 'low' {
    const uniqueDates = new Set(sessionDates);
    const gaps = this.calculateDateGaps(Array.from(uniqueDates));
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    
    if (avgGap <= 2) return 'high';
    if (avgGap <= 5) return 'moderate';
    return 'low';
  }

  private calculateDateGaps(dates: string[]): number[] {
    const sortedDates = dates.map(d => new Date(d)).sort();
    const gaps: number[] = [];
    
    for (let i = 1; i < sortedDates.length; i++) {
      const gap = Math.floor((sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24));
      gaps.push(gap);
    }
    
    return gaps;
  }

  private calculatePositiveEmotionRatio(emotions: any[]): number {
    if (emotions.length === 0) return 0;
    
    const positiveEmotions = ['joy', 'love', 'hope', 'peace', 'gratitude', 'excitement'];
    const positiveCount = emotions.filter(emotion => 
      positiveEmotions.includes(emotion.primaryEmotion)
    ).length;
    
    return positiveCount / emotions.length;
  }
}

export const psychologicalAnalyzer = new PsychologicalAnalyzer();