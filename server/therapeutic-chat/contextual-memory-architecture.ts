/**
 * Contextual Memory Architecture
 * Provides cross-session pattern recognition, long-term therapeutic goals tracking,
 * breakthrough moment identification, resistance pattern detection, and progress velocity analysis
 */

import { db } from "../db";
import { 
  threadExchanges, 
  journalingThreads,
  userTherapeuticProfile,
  emotionalStateHistory,
  therapeuticInteractionAnalysis,
  type ThreadExchange,
  type UserTherapeuticProfile
} from "@shared/schema";
import { eq, and, desc, gte, lte, avg, count, sql } from "drizzle-orm";

export interface TherapeuticGoal {
  id: string;
  title: string;
  description: string;
  category: 'emotional_regulation' | 'relationship' | 'career' | 'health' | 'personal_growth' | 'anxiety' | 'depression' | 'trauma';
  targetDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  milestones: GoalMilestone[];
  currentProgress: number; // 0-100%
  createdAt: Date;
  lastUpdated: Date;
  isActive: boolean;
}

export interface GoalMilestone {
  id: string;
  description: string;
  targetDate?: Date;
  completed: boolean;
  completedAt?: Date;
  evidence: string[];
}

export interface BreakthroughMoment {
  id: string;
  threadId: number;
  exchangeId: number;
  type: 'insight' | 'emotional_release' | 'pattern_recognition' | 'cognitive_shift' | 'behavioral_change';
  description: string;
  significance: number; // 1-10 scale
  relatedGoals: string[];
  context: string;
  followUpRequired: boolean;
  createdAt: Date;
}

export interface ResistancePattern {
  id: string;
  pattern: string;
  frequency: number;
  contexts: string[];
  triggers: string[];
  frameworksAttempted: string[];
  effectiveInterventions: string[];
  lastOccurrence: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ProgressVelocity {
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  overallProgress: number;
  goalSpecificProgress: Record<string, number>;
  breakthroughFrequency: number;
  resistanceFrequency: number;
  engagementTrend: 'improving' | 'declining' | 'stable';
  frameworkEffectiveness: Record<string, number>;
  predictedTrajectory: 'accelerating' | 'steady' | 'slowing' | 'stagnant';
}

export interface TherapeuticMemory {
  userId: string;
  goals: TherapeuticGoal[];
  breakthroughs: BreakthroughMoment[];
  resistancePatterns: ResistancePattern[];
  progressVelocity: ProgressVelocity;
  keyInsights: string[];
  therapeuticAlliance: number;
  lastAnalyzed: Date;
}

export interface CrossSessionPattern {
  pattern: string;
  occurrences: number;
  sessions: number[];
  timeSpan: number; // days
  contexts: string[];
  outcomes: string[];
  significance: number;
}

export class ContextualMemoryArchitecture {
  
  /**
   * Analyze cross-session patterns for a user
   */
  async analyzeCrossSessionPatterns(userId: string, timeframeMonths: number = 6): Promise<CrossSessionPattern[]> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - timeframeMonths);

      // Get all exchanges for the user within timeframe
      const exchanges = await db.select()
        .from(threadExchanges)
        .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(and(
          eq(journalingThreads.userId, userId),
          gte(threadExchanges.createdAt, startDate)
        ))
        .orderBy(threadExchanges.createdAt);

      const patterns: CrossSessionPattern[] = [];

      // Pattern detection algorithms
      const emotionalPatterns = this.detectEmotionalPatterns(exchanges);
      const topicPatterns = this.detectTopicRecurrence(exchanges);
      const behavioralPatterns = this.detectBehavioralPatterns(exchanges);
      const resistancePatterns = this.detectCrossSessionResistance(exchanges);

      patterns.push(...emotionalPatterns, ...topicPatterns, ...behavioralPatterns, ...resistancePatterns);

      return patterns.sort((a, b) => b.significance - a.significance);
    } catch (error) {
      console.error('Error analyzing cross-session patterns:', error);
      return [];
    }
  }

  /**
   * Track and update long-term therapeutic goals
   */
  async trackTherapeuticGoals(userId: string, sessionData: any): Promise<TherapeuticGoal[]> {
    try {
      // Get existing goals from user profile
      const profile = await db.select()
        .from(userTherapeuticProfile)
        .where(eq(userTherapeuticProfile.userId, userId))
        .limit(1);

      let existingGoals: TherapeuticGoal[] = [];
      if (profile.length > 0 && profile[0].therapeuticGoals) {
        try {
          existingGoals = JSON.parse(profile[0].therapeuticGoals as string);
        } catch {
          existingGoals = [];
        }
      }

      // Analyze current session for goal-related content
      const goalUpdates = await this.analyzeGoalProgress(sessionData, existingGoals);
      
      // Update goals based on session insights
      const updatedGoals = this.updateGoalProgress(existingGoals, goalUpdates);

      // Store updated goals
      await this.storeTherapeuticGoals(userId, updatedGoals);

      return updatedGoals;
    } catch (error) {
      console.error('Error tracking therapeutic goals:', error);
      return [];
    }
  }

  /**
   * Identify breakthrough moments in therapeutic sessions
   */
  async identifyBreakthroughMoments(
    userId: string, 
    threadId: number, 
    exchangeId: number, 
    userInput: string, 
    aiResponse: string
  ): Promise<BreakthroughMoment | null> {
    try {
      // Analyze for breakthrough indicators
      const breakthroughIndicators = [
        { pattern: /suddenly realize|i see now|it makes sense|breakthrough|clarity|understand now/i, type: 'insight', weight: 0.9 },
        { pattern: /feel so much better|weight lifted|relief|emotional release/i, type: 'emotional_release', weight: 0.8 },
        { pattern: /pattern|keep doing|always do|recognize|notice/i, type: 'pattern_recognition', weight: 0.7 },
        { pattern: /think differently|new perspective|see it another way/i, type: 'cognitive_shift', weight: 0.6 },
        { pattern: /going to try|will change|starting to|new approach/i, type: 'behavioral_change', weight: 0.5 }
      ];

      const text = (userInput + ' ' + aiResponse).toLowerCase();
      let maxWeight = 0;
      let breakthroughType: string = '';

      for (const indicator of breakthroughIndicators) {
        if (indicator.pattern.test(text)) {
          if (indicator.weight > maxWeight) {
            maxWeight = indicator.weight;
            breakthroughType = indicator.type;
          }
        }
      }

      // Minimum threshold for breakthrough detection
      if (maxWeight < 0.5) {
        return null;
      }

      // Get context from recent exchanges
      const context = await this.getSessionContext(threadId, exchangeId);

      const breakthrough: BreakthroughMoment = {
        id: this.generateId(),
        threadId,
        exchangeId,
        type: breakthroughType as any,
        description: this.extractBreakthroughDescription(userInput, breakthroughType),
        significance: Math.min(10, Math.round(maxWeight * 10)),
        relatedGoals: await this.identifyRelatedGoals(userId, userInput),
        context,
        followUpRequired: this.determineFollowUpNeed(breakthroughType, maxWeight),
        createdAt: new Date()
      };

      // Store breakthrough moment
      await this.storeBreakthroughMoment(userId, breakthrough);

      return breakthrough;
    } catch (error) {
      console.error('Error identifying breakthrough moments:', error);
      return null;
    }
  }

  /**
   * Detect and analyze resistance patterns
   */
  async detectResistancePatterns(userId: string): Promise<ResistancePattern[]> {
    try {
      // Get recent exchanges to analyze for resistance
      const exchanges = await db.select()
        .from(threadExchanges)
        .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(eq(journalingThreads.userId, userId))
        .orderBy(desc(threadExchanges.createdAt))
        .limit(100);

      const resistanceIndicators = [
        'but', 'however', 'i can\'t', 'won\'t work', 'tried that', 'doesn\'t help',
        'not sure', 'maybe', 'i guess', 'whatever', 'pointless', 'waste of time'
      ];

      const patterns: ResistancePattern[] = [];
      const patternMap = new Map<string, any>();

      for (const exchange of exchanges) {
        const input = exchange.userInput?.toLowerCase() || '';
        
        for (const indicator of resistanceIndicators) {
          if (input.includes(indicator)) {
            const key = indicator;
            if (!patternMap.has(key)) {
              patternMap.set(key, {
                pattern: indicator,
                frequency: 0,
                contexts: [],
                triggers: [],
                frameworksAttempted: [],
                occurrences: []
              });
            }
            
            const pattern = patternMap.get(key);
            pattern.frequency++;
            pattern.contexts.push(this.extractContext(input));
            pattern.occurrences.push(exchange.createdAt);
          }
        }
      }

      // Convert map to array and analyze trends
      for (const [key, data] of patternMap) {
        if (data.frequency >= 2) { // Minimum frequency threshold
          patterns.push({
            id: this.generateId(),
            pattern: data.pattern,
            frequency: data.frequency,
            contexts: [...new Set(data.contexts)],
            triggers: this.identifyTriggers(data.contexts),
            frameworksAttempted: this.getFrameworksAttempted(userId, data.pattern),
            effectiveInterventions: [],
            lastOccurrence: new Date(Math.max(...data.occurrences.map((d: Date) => d.getTime()))),
            trend: this.calculateResistanceTrend(data.occurrences)
          });
        }
      }

      return patterns.sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
      console.error('Error detecting resistance patterns:', error);
      return [];
    }
  }

  /**
   * Calculate progress velocity across different timeframes
   */
  async calculateProgressVelocity(userId: string): Promise<ProgressVelocity> {
    try {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Get exchanges for analysis
      const recentExchanges = await db.select()
        .from(threadExchanges)
        .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(and(
          eq(journalingThreads.userId, userId),
          gte(threadExchanges.createdAt, quarterAgo)
        ))
        .orderBy(threadExchanges.createdAt);

      // Calculate breakthrough frequency
      const breakthroughs = await this.getBreakthroughMoments(userId, quarterAgo);
      const breakthroughFrequency = breakthroughs.length / 3; // per month

      // Calculate resistance frequency
      const resistancePatterns = await this.detectResistancePatterns(userId);
      const resistanceFrequency = resistancePatterns.reduce((sum, p) => sum + p.frequency, 0) / 3;

      // Analyze engagement trend
      const engagementTrend = this.calculateEngagementTrend(recentExchanges);

      // Calculate framework effectiveness
      const frameworkEffectiveness = await this.calculateFrameworkEffectiveness(userId);

      return {
        timeframe: 'quarter',
        overallProgress: this.calculateOverallProgress(recentExchanges, breakthroughs),
        goalSpecificProgress: await this.calculateGoalSpecificProgress(userId),
        breakthroughFrequency,
        resistanceFrequency,
        engagementTrend,
        frameworkEffectiveness,
        predictedTrajectory: this.predictTrajectory(breakthroughFrequency, resistanceFrequency, engagementTrend)
      };
    } catch (error) {
      console.error('Error calculating progress velocity:', error);
      return this.getDefaultProgressVelocity();
    }
  }

  /**
   * Get comprehensive therapeutic memory for a user
   */
  async getTherapeuticMemory(userId: string): Promise<TherapeuticMemory> {
    try {
      const [
        goals,
        breakthroughs,
        resistancePatterns,
        progressVelocity
      ] = await Promise.all([
        this.getTherapeuticGoals(userId),
        this.getBreakthroughMoments(userId),
        this.detectResistancePatterns(userId),
        this.calculateProgressVelocity(userId)
      ]);

      const keyInsights = await this.extractKeyInsights(userId);
      const therapeuticAlliance = await this.calculateTherapeuticAlliance(userId);

      return {
        userId,
        goals,
        breakthroughs,
        resistancePatterns,
        progressVelocity,
        keyInsights,
        therapeuticAlliance,
        lastAnalyzed: new Date()
      };
    } catch (error) {
      console.error('Error getting therapeutic memory:', error);
      return this.getDefaultTherapeuticMemory(userId);
    }
  }

  // Helper methods
  private detectEmotionalPatterns(exchanges: any[]): CrossSessionPattern[] {
    const patterns: CrossSessionPattern[] = [];
    const emotionMap = new Map<string, any>();

    const emotions = ['anxious', 'depressed', 'angry', 'frustrated', 'hopeful', 'grateful', 'confused', 'overwhelmed'];

    for (const exchange of exchanges) {
      const text = exchange.userInput?.toLowerCase() || '';
      for (const emotion of emotions) {
        if (text.includes(emotion)) {
          if (!emotionMap.has(emotion)) {
            emotionMap.set(emotion, { sessions: [], contexts: [] });
          }
          emotionMap.get(emotion).sessions.push(exchange.threadId);
          emotionMap.get(emotion).contexts.push(this.extractContext(text));
        }
      }
    }

    for (const [emotion, data] of emotionMap) {
      if (data.sessions.length >= 3) {
        patterns.push({
          pattern: `Recurring ${emotion} emotional state`,
          occurrences: data.sessions.length,
          sessions: [...new Set(data.sessions)],
          timeSpan: this.calculateTimeSpan(exchanges, data.sessions),
          contexts: [...new Set(data.contexts)],
          outcomes: [],
          significance: Math.min(10, data.sessions.length * 0.5)
        });
      }
    }

    return patterns;
  }

  private detectTopicRecurrence(exchanges: any[]): CrossSessionPattern[] {
    const patterns: CrossSessionPattern[] = [];
    const topicKeywords = {
      'work': ['work', 'job', 'career', 'boss', 'colleague'],
      'relationship': ['relationship', 'partner', 'family', 'friend'],
      'self-esteem': ['confidence', 'self-worth', 'value', 'identity'],
      'anxiety': ['anxiety', 'worry', 'nervous', 'panic', 'fear'],
      'future': ['future', 'goals', 'plans', 'dreams', 'hope']
    };

    const topicMap = new Map<string, any>();

    for (const exchange of exchanges) {
      const text = exchange.userInput?.toLowerCase() || '';
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
          if (!topicMap.has(topic)) {
            topicMap.set(topic, { sessions: [], contexts: [] });
          }
          topicMap.get(topic).sessions.push(exchange.threadId);
          topicMap.get(topic).contexts.push(this.extractContext(text));
        }
      }
    }

    for (const [topic, data] of topicMap) {
      if (data.sessions.length >= 3) {
        patterns.push({
          pattern: `Recurring focus on ${topic}`,
          occurrences: data.sessions.length,
          sessions: [...new Set(data.sessions)],
          timeSpan: this.calculateTimeSpan(exchanges, data.sessions),
          contexts: [...new Set(data.contexts)],
          outcomes: [],
          significance: Math.min(10, data.sessions.length * 0.7)
        });
      }
    }

    return patterns;
  }

  private detectBehavioralPatterns(exchanges: any[]): CrossSessionPattern[] {
    // Implementation for behavioral pattern detection
    return [];
  }

  private detectCrossSessionResistance(exchanges: any[]): CrossSessionPattern[] {
    // Implementation for cross-session resistance detection
    return [];
  }

  private async analyzeGoalProgress(sessionData: any, existingGoals: TherapeuticGoal[]): Promise<any> {
    // Analyze session for goal-related progress indicators
    return {};
  }

  private updateGoalProgress(existingGoals: TherapeuticGoal[], updates: any): TherapeuticGoal[] {
    // Update goal progress based on session analysis
    return existingGoals;
  }

  private async storeTherapeuticGoals(userId: string, goals: TherapeuticGoal[]): Promise<void> {
    try {
      const goalsJson = JSON.stringify(goals);
      
      await db.insert(userTherapeuticProfile).values({
        userId,
        therapeuticGoals: goalsJson,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: userTherapeuticProfile.userId,
        set: {
          therapeuticGoals: goalsJson,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error storing therapeutic goals:', error);
    }
  }

  private async getSessionContext(threadId: number, exchangeId: number): Promise<string> {
    try {
      const context = await db.select()
        .from(threadExchanges)
        .where(and(
          eq(threadExchanges.threadId, threadId),
          sql`${threadExchanges.id} <= ${exchangeId}`
        ))
        .orderBy(desc(threadExchanges.exchangeOrder))
        .limit(3);

      return context.map(e => e.userInput).join(' ');
    } catch (error) {
      console.error('Error getting session context:', error);
      return '';
    }
  }

  private extractBreakthroughDescription(userInput: string, type: string): string {
    // Extract key phrases that indicate breakthrough
    const sentences = userInput.split(/[.!?]+/);
    const relevant = sentences.find(s => 
      s.toLowerCase().includes('realize') || 
      s.toLowerCase().includes('understand') ||
      s.toLowerCase().includes('see')
    );
    return relevant?.trim() || userInput.slice(0, 100);
  }

  private async identifyRelatedGoals(userId: string, userInput: string): Promise<string[]> {
    try {
      const goals = await this.getTherapeuticGoals(userId);
      return goals
        .filter(goal => 
          userInput.toLowerCase().includes(goal.title.toLowerCase()) ||
          goal.description.toLowerCase().includes(userInput.toLowerCase())
        )
        .map(goal => goal.id);
    } catch {
      return [];
    }
  }

  private determineFollowUpNeed(type: string, significance: number): boolean {
    return significance > 0.7 || type === 'emotional_release' || type === 'behavioral_change';
  }

  private async storeBreakthroughMoment(userId: string, breakthrough: BreakthroughMoment): Promise<void> {
    try {
      await db.insert(therapeuticInteractionAnalysis).values({
        userId,
        threadId: breakthrough.threadId,
        exchangeId: breakthrough.exchangeId,
        breakthroughMoments: JSON.stringify([breakthrough]),
        recordedAt: new Date()
      });
    } catch (error) {
      console.error('Error storing breakthrough moment:', error);
    }
  }

  private extractContext(input: string): string {
    // Extract meaningful context from input
    const words = input.split(' ');
    return words.slice(0, 5).join(' ');
  }

  private identifyTriggers(contexts: string[]): string[] {
    // Identify common triggers from contexts
    return [...new Set(contexts.slice(0, 3))];
  }

  private async getFrameworksAttempted(userId: string, pattern: string): Promise<string[]> {
    // Get frameworks that have been attempted for this resistance pattern
    return [];
  }

  private calculateResistanceTrend(occurrences: Date[]): 'increasing' | 'decreasing' | 'stable' {
    if (occurrences.length < 3) return 'stable';
    
    const recent = occurrences.slice(-3);
    const earlier = occurrences.slice(0, 3);
    
    const recentAvg = recent.reduce((sum, date) => sum + date.getTime(), 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, date) => sum + date.getTime(), 0) / earlier.length;
    
    if (recentAvg > earlierAvg * 1.1) return 'increasing';
    if (recentAvg < earlierAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  private async getBreakthroughMoments(userId: string, since?: Date): Promise<BreakthroughMoment[]> {
    try {
      let whereClause = eq(therapeuticInteractionAnalysis.userId, userId);
      if (since) {
        whereClause = and(whereClause, gte(therapeuticInteractionAnalysis.createdAt, since));
      }

      const results = await db.select()
        .from(therapeuticInteractionAnalysis)
        .where(whereClause);

      const breakthroughs: BreakthroughMoment[] = [];
      for (const result of results) {
        if (result.breakthroughMomentDetected) {
          // Create breakthrough moment from detected session
          const moment: BreakthroughMoment = {
            id: `breakthrough_${result.id}`,
            type: 'insight',
            description: `Breakthrough detected in session`,
            context: `Session analysis revealed significant progress`,
            emotionalImpact: result.emotionalResonanceScore || 0.7,
            significance: result.insightGenerationScore || 0.8,
            createdAt: result.createdAt || new Date(),
            tags: []
          };
          breakthroughs.push(moment);
        }
      }

      return breakthroughs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting breakthrough moments:', error);
      return [];
    }
  }

  private calculateEngagementTrend(exchanges: any[]): 'improving' | 'declining' | 'stable' {
    if (exchanges.length < 6) return 'stable';
    
    const recent = exchanges.slice(-3);
    const earlier = exchanges.slice(0, 3);
    
    const recentEngagement = recent.reduce((sum, ex) => sum + (ex.userWordCount || 0), 0) / recent.length;
    const earlierEngagement = earlier.reduce((sum, ex) => sum + (ex.userWordCount || 0), 0) / earlier.length;
    
    if (recentEngagement > earlierEngagement * 1.2) return 'improving';
    if (recentEngagement < earlierEngagement * 0.8) return 'declining';
    return 'stable';
  }

  private async calculateFrameworkEffectiveness(userId: string): Promise<Record<string, number>> {
    try {
      const interactions = await db.select()
        .from(therapeuticInteractionAnalysis)
        .where(eq(therapeuticInteractionAnalysis.userId, userId));

      const effectiveness: Record<string, number> = {};
      
      for (const interaction of interactions) {
        const framework = interaction.frameworkUsed;
        if (framework) {
          effectiveness[framework] = (effectiveness[framework] || 0) + (interaction.confidence || 0.5);
        }
      }

      // Normalize by count
      for (const framework in effectiveness) {
        const count = interactions.filter(i => i.frameworkUsed === framework).length;
        effectiveness[framework] = effectiveness[framework] / count;
      }

      return effectiveness;
    } catch (error) {
      console.error('Error calculating framework effectiveness:', error);
      return {};
    }
  }

  private calculateOverallProgress(exchanges: any[], breakthroughs: BreakthroughMoment[]): number {
    // Calculate overall therapeutic progress based on various metrics
    const engagementScore = exchanges.length > 0 ? 
      exchanges.reduce((sum, ex) => sum + (ex.userWordCount || 0), 0) / exchanges.length / 100 : 0;
    
    const breakthroughScore = breakthroughs.length * 10;
    
    return Math.min(100, (engagementScore + breakthroughScore) / 2);
  }

  private async calculateGoalSpecificProgress(userId: string): Promise<Record<string, number>> {
    const goals = await this.getTherapeuticGoals(userId);
    const progress: Record<string, number> = {};
    
    for (const goal of goals) {
      progress[goal.id] = goal.currentProgress;
    }
    
    return progress;
  }

  private predictTrajectory(
    breakthroughFreq: number, 
    resistanceFreq: number, 
    engagement: 'improving' | 'declining' | 'stable'
  ): 'accelerating' | 'steady' | 'slowing' | 'stagnant' {
    if (breakthroughFreq > 2 && engagement === 'improving') return 'accelerating';
    if (resistanceFreq > 3 && engagement === 'declining') return 'stagnant';
    if (breakthroughFreq < 1 && resistanceFreq > 2) return 'slowing';
    return 'steady';
  }

  private async extractKeyInsights(userId: string): Promise<string[]> {
    // Extract key therapeutic insights from user's history
    return [];
  }

  private async calculateTherapeuticAlliance(userId: string): Promise<number> {
    try {
      const profile = await db.select()
        .from(userTherapeuticProfile)
        .where(eq(userTherapeuticProfile.userId, userId))
        .limit(1);

      return profile.length > 0 ? (profile[0].therapeuticAlliance || 0.7) : 0.7;
    } catch {
      return 0.7;
    }
  }

  private async getTherapeuticGoals(userId: string): Promise<TherapeuticGoal[]> {
    try {
      const profile = await db.select()
        .from(userTherapeuticProfile)
        .where(eq(userTherapeuticProfile.userId, userId))
        .limit(1);

      if (profile.length > 0 && profile[0].therapeuticGoals) {
        return JSON.parse(profile[0].therapeuticGoals as string);
      }
      return [];
    } catch {
      return [];
    }
  }

  private calculateTimeSpan(exchanges: any[], sessionIds: number[]): number {
    const relevantExchanges = exchanges.filter(ex => sessionIds.includes(ex.threadId));
    if (relevantExchanges.length < 2) return 0;
    
    const dates = relevantExchanges.map(ex => new Date(ex.createdAt).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)); // days
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getDefaultProgressVelocity(): ProgressVelocity {
    return {
      timeframe: 'month',
      overallProgress: 0,
      goalSpecificProgress: {},
      breakthroughFrequency: 0,
      resistanceFrequency: 0,
      engagementTrend: 'stable',
      frameworkEffectiveness: {},
      predictedTrajectory: 'steady'
    };
  }

  private getDefaultTherapeuticMemory(userId: string): TherapeuticMemory {
    return {
      userId,
      goals: [],
      breakthroughs: [],
      resistancePatterns: [],
      progressVelocity: this.getDefaultProgressVelocity(),
      keyInsights: [],
      therapeuticAlliance: 0.7,
      lastAnalyzed: new Date()
    };
  }

  /**
   * Update therapeutic memory with new session data
   */
  async updateTherapeuticMemory(
    userId: string,
    threadId: number,
    sessionData: {
      userInput: string;
      aiResponse: string;
      emotionalState: any;
      cognitivePatterns: any[];
      insights: any;
    }
  ): Promise<TherapeuticMemory> {
    try {
      // Get current memory
      const currentMemory = await this.getTherapeuticMemory(userId);
      
      // Update key insights
      const newInsights = this.extractKeyInsights(sessionData);
      currentMemory.keyInsights.push(...newInsights);
      
      // Keep only recent insights (last 10)
      if (currentMemory.keyInsights.length > 10) {
        currentMemory.keyInsights = currentMemory.keyInsights.slice(-10);
      }
      
      // Update therapeutic alliance based on session engagement
      const engagementScore = this.calculateSessionEngagement(sessionData);
      currentMemory.therapeuticAlliance = Math.min(1.0, 
        (currentMemory.therapeuticAlliance * 0.8) + (engagementScore * 0.2)
      );
      
      // Check for breakthrough moments
      const breakthrough = this.detectBreakthroughMoment(threadId, sessionData);
      if (breakthrough) {
        currentMemory.breakthroughs.push(breakthrough);
        
        // Keep only recent breakthroughs (last 5)
        if (currentMemory.breakthroughs.length > 5) {
          currentMemory.breakthroughs = currentMemory.breakthroughs.slice(-5);
        }
      }
      
      currentMemory.lastAnalyzed = new Date();
      
      return currentMemory;
    } catch (error) {
      console.error('Error updating therapeutic memory:', error);
      return this.getDefaultTherapeuticMemory(userId);
    }
  }

  private extractKeyInsights(sessionData: any): string[] {
    const insights: string[] = [];
    
    if (sessionData.insights && sessionData.insights.keyInsights) {
      insights.push(...sessionData.insights.keyInsights.slice(0, 2));
    }
    
    if (sessionData.emotionalState && sessionData.emotionalState.intensity > 7) {
      insights.push(`High emotional intensity detected: ${sessionData.emotionalState.primary}`);
    }
    
    if (sessionData.cognitivePatterns && sessionData.cognitivePatterns.length > 0) {
      insights.push(`Cognitive patterns identified: ${sessionData.cognitivePatterns.length} patterns`);
    }
    
    return insights;
  }

  private calculateSessionEngagement(sessionData: any): number {
    let engagement = 0.5; // baseline
    
    // User input length indicates engagement
    const inputLength = sessionData.userInput?.length || 0;
    if (inputLength > 200) engagement += 0.2;
    if (inputLength > 500) engagement += 0.1;
    
    // Emotional openness indicates engagement
    if (sessionData.emotionalState && sessionData.emotionalState.intensity > 5) {
      engagement += 0.2;
    }
    
    return Math.min(1.0, engagement);
  }

  private detectBreakthroughMoment(threadId: number, sessionData: any): BreakthroughMoment | null {
    // Simple breakthrough detection based on emotional state and insights
    if (sessionData.insights && sessionData.insights.keyInsights && 
        sessionData.insights.keyInsights.length > 2) {
      return {
        id: this.generateId(),
        threadId,
        exchangeId: 0, // Will be updated when exchange is saved
        type: 'insight',
        description: sessionData.insights.keyInsights[0] || 'Significant insight achieved',
        significance: Math.min(10, sessionData.insights.keyInsights.length * 2),
        relatedGoals: [],
        context: sessionData.userInput.substring(0, 100),
        followUpRequired: true,
        createdAt: new Date()
      };
    }
    
    return null;
  }
}

export const contextualMemoryArchitecture = new ContextualMemoryArchitecture();