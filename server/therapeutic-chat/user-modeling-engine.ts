/**
 * Multi-Dimensional User Modeling Engine
 * Creates comprehensive user profiles for premium-level personalization
 * Analyzes therapeutic response patterns, communication preferences, and emotional triggers
 */

import { db } from "../storage";
import { 
  userTherapeuticProfile, 
  therapeuticInteractionAnalysis, 
  userCommunicationPatterns, 
  personalizationInsights,
  threadExchanges,
  journalingThreads,
  eq, 
  and, 
  desc 
} from "../../shared/schema";
import type { 
  UserTherapeuticProfile, 
  TherapeuticInteractionAnalysis, 
  UserCommunicationPatterns, 
  PersonalizationInsights,
  ThreadExchange 
} from "../../shared/schema";

export interface UserModelingRequest {
  userId: string;
  threadId?: number;
  exchangeId?: number;
  userInput: string;
  aiResponse: string;
  sessionMetadata?: {
    timeOfDay?: string;
    sessionDuration?: number;
    userMoodAtStart?: number;
    userMoodAtEnd?: number;
    techniquesUsed?: string[];
    frameworksApplied?: string[];
    questioningStyle?: string;
    interventionType?: string;
  };
  userFeedback?: {
    satisfactionRating?: number;
    emotionalResonance?: number;
    insightGeneration?: number;
    therapeuticAlliance?: number;
  };
}

export interface PersonalizationRecommendations {
  therapeuticStyle: string;
  communicationAdjustments: {
    tone: string;
    complexity: number;
    metaphorTypes: string[];
    responseLength: string;
  };
  therapeuticFrameworks: string[];
  avoidanceFactors: string[];
  customInstructions: string[];
  confidence: number;
}

export class UserModelingEngine {
  /**
   * Analyze user interaction and update their multi-dimensional profile
   */
  async analyzeInteraction(request: UserModelingRequest): Promise<void> {
    try {
      // Store interaction analysis
      await this.storeInteractionAnalysis(request);
      
      // Update therapeutic profile
      await this.updateTherapeuticProfile(request);
      
      // Update communication patterns
      await this.updateCommunicationPatterns(request);
      
      // Generate new insights
      await this.generatePersonalizationInsights(request);
      
    } catch (error) {
      console.error('Error analyzing user interaction:', error);
    }
  }

  /**
   * Store detailed interaction analysis
   */
  private async storeInteractionAnalysis(request: UserModelingRequest): Promise<void> {
    const engagement = this.calculateEngagementScore(request.userInput);
    const emotionalResonance = request.userFeedback?.emotionalResonance || this.detectEmotionalResonance(request.userInput);
    const insightGeneration = request.userFeedback?.insightGeneration || this.detectInsightGeneration(request.userInput);
    
    await db.insert(therapeuticInteractionAnalysis).values({
      userId: request.userId,
      threadId: request.threadId,
      exchangeId: request.exchangeId,
      userEngagementScore: engagement,
      emotionalResonanceScore: emotionalResonance,
      insightGenerationScore: insightGeneration,
      therapeuticAllianceStrength: request.userFeedback?.therapeuticAlliance || 0.7,
      sessionSatisfactionRating: request.userFeedback?.satisfactionRating,
      techniquesUsed: request.sessionMetadata?.techniquesUsed || [],
      frameworksApplied: request.sessionMetadata?.frameworksApplied || [],
      questioningStyle: request.sessionMetadata?.questioningStyle,
      interventionType: request.sessionMetadata?.interventionType,
      userResponseLength: request.userInput.length,
      emotionalShiftDetected: this.detectEmotionalShift(request.userInput, request.aiResponse),
      newInsightsIdentified: this.detectNewInsights(request.userInput),
      resistanceEncountered: this.detectResistance(request.userInput),
      breakthroughMomentDetected: this.detectBreakthrough(request.userInput),
      sessionTimeOfDay: request.sessionMetadata?.timeOfDay,
      userMoodAtStart: request.sessionMetadata?.userMoodAtStart,
      userMoodAtEnd: request.sessionMetadata?.userMoodAtEnd,
      sessionDuration: request.sessionMetadata?.sessionDuration
    });
  }

  /**
   * Update user's therapeutic profile based on interaction patterns
   */
  private async updateTherapeuticProfile(request: UserModelingRequest): Promise<void> {
    const existingProfile = await this.getUserTherapeuticProfile(request.userId);
    
    if (!existingProfile) {
      // Create new profile
      await this.createInitialTherapeuticProfile(request);
    } else {
      // Update existing profile
      await this.updateExistingTherapeuticProfile(request, existingProfile);
    }
  }

  /**
   * Get user's therapeutic profile
   */
  private async getUserTherapeuticProfile(userId: string): Promise<UserTherapeuticProfile | null> {
    const [profile] = await db
      .select()
      .from(userTherapeuticProfile)
      .where(eq(userTherapeuticProfile.userId, userId));
    
    return profile || null;
  }

  /**
   * Create initial therapeutic profile for new user
   */
  private async createInitialTherapeuticProfile(request: UserModelingRequest): Promise<void> {
    const communicationStyle = this.analyzeInitialCommunicationStyle(request.userInput);
    const emotionalRegulation = this.assessEmotionalRegulation(request.userInput);
    const cognitiveProcessing = this.assessCognitiveProcessing(request.userInput);
    
    await db.insert(userTherapeuticProfile).values({
      userId: request.userId,
      effectiveTherapeuticStyles: { initial: 0.5 },
      preferredQuestioningDepth: 5,
      responsiveToFrameworks: { initial: 0.5 },
      breakthroughPatterns: [],
      resistanceIndicators: [],
      preferredMetaphorTypes: [],
      effectiveExampleTypes: [],
      languageComplexityLevel: communicationStyle.complexity,
      culturalContextFactors: {},
      communicationTone: communicationStyle.tone,
      emotionalTriggers: [],
      comfortZoneThemes: [],
      emotionalRegulationCapacity: emotionalRegulation,
      crisisEscalationRisk: 1,
      supportSystemStrength: 5,
      cognitiveProcessingSpeed: cognitiveProcessing,
      preferredInsightDelivery: "gradual",
      conceptualVsExperiential: 0.5,
      sessionLengthPreference: 15,
      challengeLevelTolerance: 5,
      overallProgressVelocity: 0.5,
      stagnationRiskFactors: [],
      motivationalDrivers: [],
      sessionEngagementPatterns: {},
      goalAchievementHistory: [],
      totalInteractionCount: 1,
      averageSessionSatisfaction: 0.5,
      therapeuticRelationshipStrength: 0.5
    });
  }

  /**
   * Update existing therapeutic profile with new interaction data
   */
  private async updateExistingTherapeuticProfile(
    request: UserModelingRequest, 
    existingProfile: UserTherapeuticProfile
  ): Promise<void> {
    const updatedStats = this.calculateUpdatedProfileStats(request, existingProfile);
    
    await db
      .update(userTherapeuticProfile)
      .set({
        effectiveTherapeuticStyles: updatedStats.therapeuticStyles,
        responsiveToFrameworks: updatedStats.frameworks,
        languageComplexityLevel: updatedStats.languageComplexity,
        emotionalRegulationCapacity: updatedStats.emotionalRegulation,
        cognitiveProcessingSpeed: updatedStats.cognitiveProcessing,
        totalInteractionCount: (existingProfile.totalInteractionCount || 0) + 1,
        averageSessionSatisfaction: updatedStats.satisfaction,
        therapeuticRelationshipStrength: updatedStats.relationship,
        lastProfileUpdateAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userTherapeuticProfile.userId, request.userId));
  }

  /**
   * Update user's communication patterns
   */
  private async updateCommunicationPatterns(request: UserModelingRequest): Promise<void> {
    const existingPatterns = await this.getUserCommunicationPatterns(request.userId);
    const analysisResults = this.analyzeCommunicationStyle(request.userInput);
    
    if (!existingPatterns) {
      await this.createInitialCommunicationPatterns(request.userId, analysisResults);
    } else {
      await this.updateExistingCommunicationPatterns(request.userId, analysisResults, existingPatterns);
    }
  }

  /**
   * Get user's communication patterns
   */
  private async getUserCommunicationPatterns(userId: string): Promise<UserCommunicationPatterns | null> {
    const [patterns] = await db
      .select()
      .from(userCommunicationPatterns)
      .where(eq(userCommunicationPatterns.userId, userId));
    
    return patterns || null;
  }

  /**
   * Generate personalization insights based on interaction patterns
   */
  private async generatePersonalizationInsights(request: UserModelingRequest): Promise<void> {
    const recentInteractions = await this.getRecentInteractions(request.userId, 10);
    const patterns = this.identifyPatterns(recentInteractions);
    
    for (const pattern of patterns) {
      await this.storePersonalizationInsight(request.userId, pattern);
    }
  }

  /**
   * Get personalization recommendations for user
   */
  async getPersonalizationRecommendations(userId: string): Promise<PersonalizationRecommendations> {
    const [profile, patterns, insights] = await Promise.all([
      this.getUserTherapeuticProfile(userId),
      this.getUserCommunicationPatterns(userId),
      this.getValidatedInsights(userId)
    ]);

    return this.synthesizeRecommendations(profile, patterns, insights);
  }

  /**
   * Calculate engagement score based on user response
   */
  private calculateEngagementScore(userInput: string): number {
    let score = 0.5; // Base score
    
    // Length factor
    if (userInput.length > 500) score += 0.2;
    else if (userInput.length > 200) score += 0.1;
    else if (userInput.length < 50) score -= 0.2;
    
    // Emotional expression
    const emotionalWords = ['feel', 'think', 'realize', 'understand', 'insight', 'struggle', 'hope', 'fear', 'love', 'angry', 'sad', 'happy'];
    const emotionalCount = emotionalWords.filter(word => 
      userInput.toLowerCase().includes(word)
    ).length;
    score += Math.min(emotionalCount * 0.05, 0.2);
    
    // Question asking (engagement indicator)
    const questionCount = (userInput.match(/\?/g) || []).length;
    score += Math.min(questionCount * 0.1, 0.2);
    
    // Personal pronouns (self-reflection)
    const personalPronouns = ['I ', 'me ', 'my ', 'myself'];
    const pronounCount = personalPronouns.filter(pronoun => 
      userInput.toLowerCase().includes(pronoun)
    ).length;
    score += Math.min(pronounCount * 0.03, 0.15);
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Detect emotional resonance in user response
   */
  private detectEmotionalResonance(userInput: string): number {
    let resonance = 0.5;
    
    // Positive emotional indicators
    const positiveWords = ['helpful', 'insightful', 'understand', 'clarity', 'relief', 'grateful', 'thank'];
    const positiveCount = positiveWords.filter(word => 
      userInput.toLowerCase().includes(word)
    ).length;
    resonance += Math.min(positiveCount * 0.1, 0.3);
    
    // Emotional depth indicators
    const depthWords = ['realize', 'discovered', 'breakthrough', 'connection', 'pattern', 'deeper'];
    const depthCount = depthWords.filter(word => 
      userInput.toLowerCase().includes(word)
    ).length;
    resonance += Math.min(depthCount * 0.15, 0.2);
    
    return Math.max(0, Math.min(1, resonance));
  }

  /**
   * Detect insight generation in user response
   */
  private detectInsightGeneration(userInput: string): number {
    let insight = 0.3;
    
    const insightWords = ['realize', 'understand', 'see now', 'makes sense', 'insight', 'aha', 'discovered', 'learned', 'connection'];
    const insightCount = insightWords.filter(word => 
      userInput.toLowerCase().includes(word)
    ).length;
    insight += Math.min(insightCount * 0.2, 0.5);
    
    // Look for "I" + insight verbs
    const insightPatterns = ['I realize', 'I understand', 'I see', 'I learned', 'I discovered'];
    const patternCount = insightPatterns.filter(pattern => 
      userInput.toLowerCase().includes(pattern)
    ).length;
    insight += Math.min(patternCount * 0.3, 0.4);
    
    return Math.max(0, Math.min(1, insight));
  }

  /**
   * Analyze initial communication style
   */
  private analyzeInitialCommunicationStyle(userInput: string): { complexity: number; tone: string } {
    const words = userInput.split(' ');
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Complexity based on vocabulary and sentence structure
    let complexity = 5; // Default
    if (avgWordLength > 6) complexity += 2;
    if (avgWordLength < 4) complexity -= 2;
    
    const sentences = userInput.split(/[.!?]+/);
    const avgSentenceLength = words.length / sentences.length;
    if (avgSentenceLength > 20) complexity += 1;
    if (avgSentenceLength < 10) complexity -= 1;
    
    // Tone analysis
    let tone = "balanced";
    const formalWords = ['however', 'therefore', 'consequently', 'furthermore'];
    const casualWords = ['yeah', 'like', 'kinda', 'sorta', 'totally'];
    
    const formalCount = formalWords.filter(word => userInput.toLowerCase().includes(word)).length;
    const casualCount = casualWords.filter(word => userInput.toLowerCase().includes(word)).length;
    
    if (formalCount > casualCount) tone = "formal";
    else if (casualCount > formalCount) tone = "casual";
    
    return {
      complexity: Math.max(1, Math.min(10, complexity)),
      tone
    };
  }

  /**
   * Helper methods for pattern detection
   */
  private detectEmotionalShift(userInput: string, aiResponse: string): boolean {
    // Simple implementation - could be enhanced with sentiment analysis
    const emotionalWords = ['better', 'worse', 'different', 'changed', 'shift', 'new perspective'];
    return emotionalWords.some(word => userInput.toLowerCase().includes(word));
  }

  private detectNewInsights(userInput: string): boolean {
    const insightIndicators = ['realize', 'understand', 'see now', 'makes sense', 'never thought'];
    return insightIndicators.some(indicator => userInput.toLowerCase().includes(indicator));
  }

  private detectResistance(userInput: string): boolean {
    const resistanceWords = ['but', 'however', 'disagree', 'not sure', 'dont think', "don't think"];
    return resistanceWords.some(word => userInput.toLowerCase().includes(word));
  }

  private detectBreakthrough(userInput: string): boolean {
    const breakthroughWords = ['breakthrough', 'aha', 'suddenly understand', 'everything clicks', 'revelation'];
    return breakthroughWords.some(word => userInput.toLowerCase().includes(word));
  }

  private assessEmotionalRegulation(userInput: string): number {
    // Simple assessment based on emotional expression and self-awareness
    let regulation = 5;
    
    const selfAwareWords = ['I feel', 'I think', 'I realize', 'I notice'];
    const selfAwareCount = selfAwareWords.filter(phrase => 
      userInput.toLowerCase().includes(phrase)
    ).length;
    regulation += Math.min(selfAwareCount, 3);
    
    const overwhelmWords = ['overwhelmed', 'cant handle', 'too much', 'falling apart'];
    const overwhelmCount = overwhelmWords.filter(word => 
      userInput.toLowerCase().includes(word)
    ).length;
    regulation -= overwhelmCount * 2;
    
    return Math.max(1, Math.min(10, regulation));
  }

  private assessCognitiveProcessing(userInput: string): number {
    // Assess based on complexity of thought expression
    let processing = 5;
    
    const complexThoughts = ['because', 'therefore', 'relationship between', 'connected to', 'leads to'];
    const complexCount = complexThoughts.filter(phrase => 
      userInput.toLowerCase().includes(phrase)
    ).length;
    processing += Math.min(complexCount, 3);
    
    const sentences = userInput.split(/[.!?]+/);
    const avgSentenceLength = userInput.split(' ').length / sentences.length;
    if (avgSentenceLength > 15) processing += 1;
    if (avgSentenceLength < 8) processing -= 1;
    
    return Math.max(1, Math.min(10, processing));
  }

  /**
   * Placeholder methods for comprehensive implementation
   */
  private calculateUpdatedProfileStats(request: UserModelingRequest, profile: UserTherapeuticProfile): any {
    // Implementation would analyze effectiveness of different approaches
    return {
      therapeuticStyles: profile.effectiveTherapeuticStyles,
      frameworks: profile.responsiveToFrameworks,
      languageComplexity: profile.languageComplexityLevel,
      emotionalRegulation: profile.emotionalRegulationCapacity,
      cognitiveProcessing: profile.cognitiveProcessingSpeed,
      satisfaction: profile.averageSessionSatisfaction,
      relationship: profile.therapeuticRelationshipStrength
    };
  }

  private analyzeCommunicationStyle(userInput: string): any {
    // Comprehensive communication analysis
    return {
      complexity: this.analyzeInitialCommunicationStyle(userInput).complexity,
      tone: this.analyzeInitialCommunicationStyle(userInput).tone,
      metaphorPreferences: [],
      effectiveExamples: []
    };
  }

  private async createInitialCommunicationPatterns(userId: string, analysis: any): Promise<void> {
    await db.insert(userCommunicationPatterns).values({
      userId,
      vocabularyComplexity: analysis.complexity,
      sentenceStructurePreference: "balanced",
      communicationRhythm: "moderate",
      effectiveMetaphors: [],
      preferredExampleCategories: [],
      analogyReceptiveness: 0.5,
      culturalBackground: {},
      personalValueSystem: [],
      worldviewOrientation: "balanced",
      typicalResponseLength: 200,
      emotionalExpressionStyle: "moderate",
      introspectionCapacity: 5,
      informationProcessingStyle: "sequential",
      feedbackReceptiveness: 0.5,
      changeReadiness: 0.5,
      communicationEffectivenessScore: 0.5,
      totalSamplesAnalyzed: 1
    });
  }

  private async updateExistingCommunicationPatterns(userId: string, analysis: any, existing: UserCommunicationPatterns): Promise<void> {
    await db
      .update(userCommunicationPatterns)
      .set({
        vocabularyComplexity: analysis.complexity,
        totalSamplesAnalyzed: (existing.totalSamplesAnalyzed || 0) + 1,
        lastAnalysisUpdate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userCommunicationPatterns.userId, userId));
  }

  private async getRecentInteractions(userId: string, limit: number): Promise<any[]> {
    // Get recent therapeutic interactions for pattern analysis
    return await db
      .select()
      .from(therapeuticInteractionAnalysis)
      .where(eq(therapeuticInteractionAnalysis.userId, userId))
      .orderBy(desc(therapeuticInteractionAnalysis.createdAt))
      .limit(limit);
  }

  private identifyPatterns(interactions: any[]): any[] {
    // Pattern identification logic
    const patterns = [];
    
    // Example pattern: High engagement with specific techniques
    const techniques = {};
    interactions.forEach(interaction => {
      if (interaction.techniquesUsed) {
        interaction.techniquesUsed.forEach((technique: string) => {
          techniques[technique] = (techniques[technique] || 0) + interaction.userEngagementScore;
        });
      }
    });
    
    for (const [technique, score] of Object.entries(techniques)) {
      if (score > 0.7) {
        patterns.push({
          type: 'technique_effectiveness',
          category: 'effectiveness',
          title: `High Response to ${technique}`,
          description: `User shows strong engagement with ${technique} approach`,
          confidence: 0.8,
          evidence: [`Average engagement: ${score}`],
          recommendedActions: [`Continue using ${technique}`, `Expand similar techniques`],
          contraindications: [],
          contextFactors: ['high_engagement_sessions']
        });
      }
    }
    
    return patterns;
  }

  private async storePersonalizationInsight(userId: string, pattern: any): Promise<void> {
    // Check if similar insight already exists
    const existingInsights = await db
      .select()
      .from(personalizationInsights)
      .where(and(
        eq(personalizationInsights.userId, userId),
        eq(personalizationInsights.title, pattern.title)
      ));
    
    if (existingInsights.length === 0) {
      await db.insert(personalizationInsights).values({
        userId,
        insightType: pattern.type,
        insightCategory: pattern.category,
        title: pattern.title,
        description: pattern.description,
        confidence: pattern.confidence,
        evidence: pattern.evidence,
        recommendedActions: pattern.recommendedActions,
        contraindications: pattern.contraindications,
        contextFactors: pattern.contextFactors,
        isValidated: false,
        applicationCount: 0
      });
    }
  }

  private async getValidatedInsights(userId: string): Promise<PersonalizationInsights[]> {
    return await db
      .select()
      .from(personalizationInsights)
      .where(and(
        eq(personalizationInsights.userId, userId),
        eq(personalizationInsights.isValidated, true)
      ))
      .orderBy(desc(personalizationInsights.confidence));
  }

  private synthesizeRecommendations(
    profile: UserTherapeuticProfile | null,
    patterns: UserCommunicationPatterns | null,
    insights: PersonalizationInsights[]
  ): PersonalizationRecommendations {
    const defaultRecommendations: PersonalizationRecommendations = {
      therapeuticStyle: "balanced",
      communicationAdjustments: {
        tone: "supportive",
        complexity: 5,
        metaphorTypes: ["nature", "journey"],
        responseLength: "balanced"
      },
      therapeuticFrameworks: ["cbt", "mindfulness"],
      avoidanceFactors: [],
      customInstructions: [],
      confidence: 0.5
    };

    if (!profile) return defaultRecommendations;

    // Synthesize recommendations based on profile data
    const recommendations: PersonalizationRecommendations = {
      therapeuticStyle: this.selectOptimalTherapeuticStyle(profile),
      communicationAdjustments: {
        tone: profile.communicationTone || "balanced",
        complexity: profile.languageComplexityLevel || 5,
        metaphorTypes: (profile.preferredMetaphorTypes as string[]) || ["nature"],
        responseLength: this.determineOptimalResponseLength(profile)
      },
      therapeuticFrameworks: this.selectOptimalFrameworks(profile),
      avoidanceFactors: (profile.emotionalTriggers as string[]) || [],
      customInstructions: this.generateCustomInstructions(profile, patterns, insights),
      confidence: this.calculateRecommendationConfidence(profile, patterns, insights)
    };

    return recommendations;
  }

  private selectOptimalTherapeuticStyle(profile: UserTherapeuticProfile): string {
    const styles = profile.effectiveTherapeuticStyles as Record<string, number> || {};
    let bestStyle = "balanced";
    let bestScore = 0;

    for (const [style, score] of Object.entries(styles)) {
      if (score > bestScore) {
        bestScore = score;
        bestStyle = style;
      }
    }

    return bestStyle;
  }

  private determineOptimalResponseLength(profile: UserTherapeuticProfile): string {
    const processingSpeed = profile.cognitiveProcessingSpeed || 5;
    const sessionPreference = profile.sessionLengthPreference || 15;

    if (processingSpeed >= 7 && sessionPreference >= 20) return "detailed";
    if (processingSpeed <= 3 || sessionPreference <= 10) return "brief";
    return "balanced";
  }

  private selectOptimalFrameworks(profile: UserTherapeuticProfile): string[] {
    const frameworks = profile.responsiveToFrameworks as Record<string, number> || {};
    return Object.entries(frameworks)
      .filter(([_, score]) => score > 0.6)
      .map(([framework, _]) => framework)
      .slice(0, 3); // Top 3 frameworks
  }

  private generateCustomInstructions(
    profile: UserTherapeuticProfile,
    patterns: UserCommunicationPatterns | null,
    insights: PersonalizationInsights[]
  ): string[] {
    const instructions: string[] = [];

    // Based on communication patterns
    if (patterns?.emotionalExpressionStyle === "reserved") {
      instructions.push("Use gentle, non-intrusive questioning to encourage emotional exploration");
    }

    // Based on processing style
    if (profile.cognitiveProcessingSpeed && profile.cognitiveProcessingSpeed <= 4) {
      instructions.push("Allow extra processing time, use simpler language structures");
    }

    // Based on insights
    insights.forEach(insight => {
      if (insight.recommendedActions) {
        instructions.push(...(insight.recommendedActions as string[]));
      }
    });

    return instructions.slice(0, 5); // Limit to most important instructions
  }

  private calculateRecommendationConfidence(
    profile: UserTherapeuticProfile,
    patterns: UserCommunicationPatterns | null,
    insights: PersonalizationInsights[]
  ): number {
    let confidence = 0.3; // Base confidence

    // More interactions = higher confidence
    const interactionCount = profile.totalInteractionCount || 0;
    confidence += Math.min(interactionCount * 0.05, 0.4);

    // Communication patterns available
    if (patterns && patterns.totalSamplesAnalyzed && patterns.totalSamplesAnalyzed > 5) {
      confidence += 0.2;
    }

    // Validated insights available
    const validatedInsights = insights.filter(i => i.isValidated);
    confidence += Math.min(validatedInsights.length * 0.1, 0.3);

    return Math.min(confidence, 0.95); // Cap at 95%
  }
}

export const userModelingEngine = new UserModelingEngine();