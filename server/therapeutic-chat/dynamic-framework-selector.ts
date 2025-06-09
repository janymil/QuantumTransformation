/**
 * Dynamic Therapeutic Framework Selection Engine
 * Provides real-time framework switching based on session progression,
 * emotional state detection, user engagement metrics, and historical effectiveness
 */

import { db } from "../db";
import { 
  threadExchanges, 
  therapeuticInteractionAnalysis,
  userTherapeuticProfile,
  emotionalStateHistory,
  type ThreadExchange,
  type UserTherapeuticProfile
} from "@shared/schema";
import { eq, desc, and, gte, avg, count } from "drizzle-orm";

export interface SessionProgressionMetrics {
  totalExchanges: number;
  averageResponseTime: number;
  emotionalStateProgression: string[];
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
  breakthroughIndicators: number;
  resistanceIndicators: number;
  currentSessionDuration: number;
}

export interface EmotionalStateDetection {
  currentState: string;
  stateIntensity: number;
  stateStability: number;
  predominantEmotions: string[];
  emotionalShifts: number;
  riskIndicators: string[];
}

export interface UserEngagementMetrics {
  responseLength: number;
  responseDepth: number;
  questionEngagement: number;
  insightGeneration: number;
  emotionalResonance: number;
  therapeuticAlliance: number;
}

export interface FrameworkEffectiveness {
  frameworkName: string;
  successRate: number;
  averageEngagement: number;
  emotionalImpact: number;
  breakthroughRate: number;
  userSatisfaction: number;
  recentPerformance: number;
}

export interface FrameworkRecommendation {
  primaryFramework: string;
  secondaryFrameworks: string[];
  interventionType: string;
  confidence: number;
  rationale: string;
  adaptationInstructions: string[];
  avoidanceFactors: string[];
  expectedOutcomes: string[];
}

export class DynamicFrameworkSelector {
  
  /**
   * Select optimal therapeutic framework based on real-time session analysis
   */
  async selectOptimalFramework(
    userId: string,
    threadId: number,
    currentUserInput: string,
    sessionContext: any
  ): Promise<FrameworkRecommendation> {
    
    // Analyze current session progression
    const sessionMetrics = await this.analyzeSessionProgression(threadId);
    
    // Detect current emotional state
    const emotionalState = await this.detectEmotionalState(userId, currentUserInput);
    
    // Calculate user engagement metrics
    const engagementMetrics = await this.calculateEngagementMetrics(threadId);
    
    // Get historical framework effectiveness
    const frameworkEffectiveness = await this.getFrameworkEffectiveness(userId);
    
    // Select optimal framework based on analysis
    const recommendation = await this.synthesizeFrameworkRecommendation(
      sessionMetrics,
      emotionalState,
      engagementMetrics,
      frameworkEffectiveness,
      currentUserInput
    );
    
    // Store framework selection decision for learning
    await this.storeFrameworkDecision(userId, threadId, recommendation);
    
    return recommendation;
  }

  /**
   * Analyze session progression and trajectory
   */
  private async analyzeSessionProgression(threadId: number): Promise<SessionProgressionMetrics> {
    try {
      // Get all exchanges for this session
      const exchanges = await db.select()
        .from(threadExchanges)
        .where(eq(threadExchanges.threadId, threadId))
        .orderBy(threadExchanges.exchangeOrder);

      const totalExchanges = exchanges.length;
      
      // Calculate average response time (mock calculation)
      const averageResponseTime = exchanges.reduce((sum, ex) => 
        sum + (ex.userWritingTime || 5000), 0) / Math.max(totalExchanges, 1);

      // Extract emotional state progression
      const emotionalStateProgression = exchanges
        .map(ex => ex.aiEmotionalAssessment)
        .filter(Boolean)
        .map(assessment => {
          try {
            const parsed = JSON.parse(assessment);
            return parsed.primaryEmotion || 'neutral';
          } catch {
            return 'neutral';
          }
        });

      // Analyze engagement trend
      const recentEngagement = exchanges.slice(-3).map(ex => 
        this.calculateExchangeEngagement(ex)
      );
      const earlyEngagement = exchanges.slice(0, 3).map(ex => 
        this.calculateExchangeEngagement(ex)
      );
      
      const recentAvg = recentEngagement.reduce((a, b) => a + b, 0) / Math.max(recentEngagement.length, 1);
      const earlyAvg = earlyEngagement.reduce((a, b) => a + b, 0) / Math.max(earlyEngagement.length, 1);
      
      let engagementTrend: 'increasing' | 'decreasing' | 'stable';
      if (recentAvg > earlyAvg * 1.1) engagementTrend = 'increasing';
      else if (recentAvg < earlyAvg * 0.9) engagementTrend = 'decreasing';
      else engagementTrend = 'stable';

      // Count breakthrough and resistance indicators
      const breakthroughIndicators = exchanges.filter(ex => 
        ex.userInput && this.detectBreakthrough(ex.userInput)
      ).length;
      
      const resistanceIndicators = exchanges.filter(ex => 
        ex.userInput && this.detectResistance(ex.userInput)
      ).length;

      return {
        totalExchanges,
        averageResponseTime,
        emotionalStateProgression,
        engagementTrend,
        breakthroughIndicators,
        resistanceIndicators,
        currentSessionDuration: Date.now() - (exchanges[0]?.createdAt?.getTime() || Date.now())
      };
    } catch (error) {
      console.error('Error analyzing session progression:', error);
      return this.getDefaultSessionMetrics();
    }
  }

  /**
   * Detect current emotional state with advanced analysis
   */
  private async detectEmotionalState(userId: string, currentInput: string): Promise<EmotionalStateDetection> {
    try {
      // Get recent emotional history
      const recentEmotions = await db.select()
        .from(emotionalStateHistory)
        .where(eq(emotionalStateHistory.userId, userId))
        .orderBy(desc(emotionalStateHistory.createdAt))
        .limit(10);

      // Analyze current input for emotional indicators
      const currentState = this.analyzeEmotionalContent(currentInput);
      
      // Calculate emotional stability
      const emotionalStates = recentEmotions.map(e => e.emotionalState);
      const stateVariability = this.calculateEmotionalVariability(emotionalStates);
      const stateStability = Math.max(0, 1 - stateVariability);

      // Extract predominant emotions
      const emotionCounts: Record<string, number> = {};
      emotionalStates.forEach(state => {
        emotionCounts[state] = (emotionCounts[state] || 0) + 1;
      });
      
      const predominantEmotions = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([emotion]) => emotion);

      // Count emotional shifts
      const emotionalShifts = this.countEmotionalShifts(emotionalStates);

      // Detect risk indicators
      const riskIndicators = this.detectRiskIndicators(currentInput, emotionalStates);

      return {
        currentState,
        stateIntensity: this.calculateEmotionalIntensity(currentInput),
        stateStability,
        predominantEmotions,
        emotionalShifts,
        riskIndicators
      };
    } catch (error) {
      console.error('Error detecting emotional state:', error);
      return this.getDefaultEmotionalState();
    }
  }

  /**
   * Calculate comprehensive user engagement metrics
   */
  private async calculateEngagementMetrics(threadId: number): Promise<UserEngagementMetrics> {
    try {
      const exchanges = await db.select()
        .from(threadExchanges)
        .where(eq(threadExchanges.threadId, threadId))
        .orderBy(desc(threadExchanges.exchangeOrder))
        .limit(5); // Focus on recent exchanges

      if (exchanges.length === 0) {
        return this.getDefaultEngagementMetrics();
      }

      // Calculate response length trend
      const responseLengths = exchanges.map(ex => ex.userWordCount || 0);
      const responseLength = responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length;

      // Analyze response depth
      const responseDepth = exchanges.reduce((total, ex) => {
        return total + this.analyzeResponseDepth(ex.userInput || '');
      }, 0) / exchanges.length;

      // Calculate question engagement
      const questionEngagement = exchanges.reduce((total, ex) => {
        return total + this.analyzeQuestionEngagement(ex.userInput || '', ex.aiQuestion || '');
      }, 0) / exchanges.length;

      // Extract other metrics from stored analysis
      const recentAnalysis = exchanges[0];
      const insightGeneration = this.extractMetricFromAnalysis(recentAnalysis.aiPatternInsights, 'insight');
      const emotionalResonance = this.extractMetricFromAnalysis(recentAnalysis.aiEmotionalAssessment, 'resonance');
      const therapeuticAlliance = this.calculateTherapeuticAlliance(exchanges);

      return {
        responseLength,
        responseDepth,
        questionEngagement,
        insightGeneration,
        emotionalResonance,
        therapeuticAlliance
      };
    } catch (error) {
      console.error('Error calculating engagement metrics:', error);
      return this.getDefaultEngagementMetrics();
    }
  }

  /**
   * Get historical framework effectiveness for user
   */
  private async getFrameworkEffectiveness(userId: string): Promise<FrameworkEffectiveness[]> {
    try {
      // Get user's therapeutic profile
      const profile = await db.select()
        .from(userTherapeuticProfile)
        .where(eq(userTherapeuticProfile.userId, userId))
        .limit(1);

      if (profile.length === 0) {
        return this.getDefaultFrameworkEffectiveness();
      }

      const userProfile = profile[0];
      
      // Extract framework performance data
      const frameworkData = [
        {
          frameworkName: 'cognitive_behavioral',
          successRate: userProfile.cognitivePatterns?.successRate || 0.7,
          averageEngagement: userProfile.cognitivePatterns?.engagement || 0.8,
          emotionalImpact: userProfile.emotionalResponsePatterns?.cbtImpact || 0.75,
          breakthroughRate: userProfile.breakthroughPatterns?.cbtRate || 0.6,
          userSatisfaction: userProfile.therapeuticAlliance || 0.8,
          recentPerformance: this.calculateRecentPerformance('cognitive_behavioral', userProfile)
        },
        {
          frameworkName: 'psychodynamic',
          successRate: userProfile.cognitivePatterns?.psychodynamicSuccess || 0.65,
          averageEngagement: userProfile.emotionalResponsePatterns?.depth || 0.7,
          emotionalImpact: userProfile.emotionalResponsePatterns?.psychodynamicImpact || 0.8,
          breakthroughRate: userProfile.breakthroughPatterns?.psychodynamicRate || 0.7,
          userSatisfaction: userProfile.therapeuticAlliance || 0.8,
          recentPerformance: this.calculateRecentPerformance('psychodynamic', userProfile)
        },
        {
          frameworkName: 'humanistic',
          successRate: userProfile.communicationStyle?.humanisticSuccess || 0.75,
          averageEngagement: userProfile.communicationStyle?.empathyResonance || 0.85,
          emotionalImpact: userProfile.emotionalResponsePatterns?.humanisticImpact || 0.9,
          breakthroughRate: userProfile.breakthroughPatterns?.humanisticRate || 0.65,
          userSatisfaction: userProfile.therapeuticAlliance || 0.8,
          recentPerformance: this.calculateRecentPerformance('humanistic', userProfile)
        },
        {
          frameworkName: 'solution_focused',
          successRate: userProfile.cognitivePatterns?.solutionFocusedSuccess || 0.7,
          averageEngagement: userProfile.cognitivePatterns?.engagement || 0.75,
          emotionalImpact: userProfile.emotionalResponsePatterns?.solutionFocusedImpact || 0.7,
          breakthroughRate: userProfile.breakthroughPatterns?.solutionFocusedRate || 0.8,
          userSatisfaction: userProfile.therapeuticAlliance || 0.8,
          recentPerformance: this.calculateRecentPerformance('solution_focused', userProfile)
        }
      ];

      return frameworkData.sort((a, b) => b.recentPerformance - a.recentPerformance);
    } catch (error) {
      console.error('Error getting framework effectiveness:', error);
      return this.getDefaultFrameworkEffectiveness();
    }
  }

  /**
   * Synthesize framework recommendation based on all analysis
   */
  private async synthesizeFrameworkRecommendation(
    sessionMetrics: SessionProgressionMetrics,
    emotionalState: EmotionalStateDetection,
    engagementMetrics: UserEngagementMetrics,
    frameworkEffectiveness: FrameworkEffectiveness[],
    currentInput: string
  ): Promise<FrameworkRecommendation> {
    
    // Analyze current situation urgency and needs
    const urgencyLevel = this.assessSituationUrgency(emotionalState, currentInput);
    const primaryNeed = this.identifyPrimaryTherapeuticNeed(sessionMetrics, emotionalState, engagementMetrics);
    
    // Select primary framework based on analysis
    let primaryFramework = frameworkEffectiveness[0]?.frameworkName || 'cognitive_behavioral';
    
    // Override based on specific conditions
    if (urgencyLevel === 'high') {
      primaryFramework = 'humanistic'; // Crisis support
    } else if (emotionalState.riskIndicators.length > 0) {
      primaryFramework = 'cognitive_behavioral'; // Structured approach for risk
    } else if (engagementMetrics.therapeuticAlliance < 0.6) {
      primaryFramework = 'humanistic'; // Build rapport
    } else if (sessionMetrics.engagementTrend === 'decreasing') {
      primaryFramework = 'solution_focused'; // Re-engage with practical focus
    }
    
    // Select complementary frameworks
    const secondaryFrameworks = frameworkEffectiveness
      .filter(f => f.frameworkName !== primaryFramework)
      .slice(0, 2)
      .map(f => f.frameworkName);
    
    // Determine intervention type
    const interventionType = this.determineInterventionType(
      primaryNeed, 
      emotionalState, 
      sessionMetrics
    );
    
    // Calculate confidence
    const confidence = this.calculateRecommendationConfidence(
      sessionMetrics,
      emotionalState,
      engagementMetrics,
      frameworkEffectiveness
    );
    
    // Generate rationale
    const rationale = this.generateRecommendationRationale(
      primaryFramework,
      sessionMetrics,
      emotionalState,
      engagementMetrics,
      primaryNeed
    );
    
    // Create adaptation instructions
    const adaptationInstructions = this.generateAdaptationInstructions(
      primaryFramework,
      emotionalState,
      engagementMetrics
    );
    
    // Identify avoidance factors
    const avoidanceFactors = this.identifyAvoidanceFactors(
      emotionalState,
      sessionMetrics
    );
    
    // Predict expected outcomes
    const expectedOutcomes = this.predictExpectedOutcomes(
      primaryFramework,
      frameworkEffectiveness.find(f => f.frameworkName === primaryFramework)
    );

    return {
      primaryFramework,
      secondaryFrameworks,
      interventionType,
      confidence,
      rationale,
      adaptationInstructions,
      avoidanceFactors,
      expectedOutcomes
    };
  }

  /**
   * Store framework selection decision for learning
   */
  private async storeFrameworkDecision(
    userId: string,
    threadId: number,
    recommendation: FrameworkRecommendation
  ): Promise<void> {
    try {
      // Store in therapeutic interaction analysis for future learning
      await db.insert(therapeuticInteractionAnalysis).values({
        userId,
        threadId,
        exchangeId: null, // Will be updated when exchange is created
        frameworkUsed: recommendation.primaryFramework,
        interventionType: recommendation.interventionType,
        confidence: recommendation.confidence,
        rationale: recommendation.rationale,
        adaptationInstructions: recommendation.adaptationInstructions.join('; '),
        expectedOutcomes: recommendation.expectedOutcomes.join('; '),
        recordedAt: new Date()
      });
    } catch (error) {
      console.error('Error storing framework decision:', error);
    }
  }

  // Helper methods for analysis
  private calculateExchangeEngagement(exchange: ThreadExchange): number {
    const wordCount = exchange.userWordCount || 0;
    const writingTime = exchange.userWritingTime || 5000;
    const hasEmotionalContent = exchange.userInput ? 
      this.calculateEmotionalIntensity(exchange.userInput) > 0.3 : false;
    
    let engagement = 0.5; // Base engagement
    
    if (wordCount > 20) engagement += 0.2;
    if (wordCount > 50) engagement += 0.2;
    if (writingTime > 30000) engagement += 0.1; // Thoughtful response
    if (hasEmotionalContent) engagement += 0.2;
    
    return Math.min(1, engagement);
  }

  private detectBreakthrough(input: string): boolean {
    const breakthroughWords = [
      'understand', 'realize', 'insight', 'clarity', 'breakthrough',
      'makes sense', 'I see', 'connection', 'pattern'
    ];
    return breakthroughWords.some(word => 
      input.toLowerCase().includes(word.toLowerCase())
    );
  }

  private detectResistance(input: string): boolean {
    const resistanceWords = [
      'but', 'however', 'can\'t', 'won\'t', 'don\'t think',
      'not sure', 'maybe', 'I guess', 'whatever'
    ];
    return resistanceWords.some(word => 
      input.toLowerCase().includes(word.toLowerCase())
    );
  }

  private analyzeEmotionalContent(input: string): string {
    const emotionalWords = {
      anxious: ['anxious', 'worried', 'nervous', 'scared', 'fear'],
      depressed: ['sad', 'depressed', 'down', 'hopeless', 'empty'],
      angry: ['angry', 'mad', 'frustrated', 'irritated', 'annoyed'],
      confused: ['confused', 'lost', 'uncertain', 'unclear', 'puzzled'],
      hopeful: ['hopeful', 'optimistic', 'positive', 'excited', 'happy']
    };

    for (const [emotion, words] of Object.entries(emotionalWords)) {
      if (words.some(word => input.toLowerCase().includes(word))) {
        return emotion;
      }
    }
    
    return 'neutral';
  }

  private calculateEmotionalIntensity(input: string): number {
    const intensityWords = [
      'very', 'extremely', 'really', 'so', 'incredibly',
      'absolutely', 'completely', 'totally', 'overwhelming'
    ];
    
    const capsCount = (input.match(/[A-Z]/g) || []).length;
    const exclamationCount = (input.match(/!/g) || []).length;
    const intensityWordCount = intensityWords.filter(word => 
      input.toLowerCase().includes(word)
    ).length;
    
    let intensity = 0.3; // Base intensity
    intensity += Math.min(0.3, capsCount * 0.05);
    intensity += Math.min(0.2, exclamationCount * 0.1);
    intensity += Math.min(0.4, intensityWordCount * 0.1);
    
    return Math.min(1, intensity);
  }

  private calculateEmotionalVariability(states: string[]): number {
    if (states.length < 2) return 0;
    
    const uniqueStates = new Set(states);
    return uniqueStates.size / states.length;
  }

  private countEmotionalShifts(states: string[]): number {
    if (states.length < 2) return 0;
    
    let shifts = 0;
    for (let i = 1; i < states.length; i++) {
      if (states[i] !== states[i - 1]) shifts++;
    }
    return shifts;
  }

  private detectRiskIndicators(input: string, recentStates: string[]): string[] {
    const riskIndicators = [];
    
    const riskWords = [
      'hopeless', 'worthless', 'give up', 'end it all',
      'can\'t go on', 'no point', 'better off dead'
    ];
    
    if (riskWords.some(word => input.toLowerCase().includes(word))) {
      riskIndicators.push('suicidal_ideation');
    }
    
    if (recentStates.filter(s => s === 'depressed').length > 3) {
      riskIndicators.push('persistent_depression');
    }
    
    return riskIndicators;
  }

  private analyzeResponseDepth(input: string): number {
    const deepWords = [
      'because', 'feel', 'think', 'believe', 'experience',
      'realize', 'understand', 'remember', 'connect'
    ];
    
    const questionCount = (input.match(/\?/g) || []).length;
    const deepWordCount = deepWords.filter(word => 
      input.toLowerCase().includes(word)
    ).length;
    
    let depth = 0.3;
    depth += Math.min(0.4, deepWordCount * 0.1);
    depth += Math.min(0.3, questionCount * 0.15);
    
    return Math.min(1, depth);
  }

  private analyzeQuestionEngagement(userInput: string, aiQuestion: string): number {
    if (!aiQuestion) return 0.5;
    
    // Check if user directly addresses the question
    const questionWords = aiQuestion.toLowerCase().split(' ');
    const userWords = userInput.toLowerCase().split(' ');
    
    const overlap = questionWords.filter(word => 
      userWords.includes(word) && word.length > 3
    ).length;
    
    const engagementScore = Math.min(1, 0.3 + (overlap * 0.1));
    
    return engagementScore;
  }

  private extractMetricFromAnalysis(analysis: string | null, metricType: string): number {
    if (!analysis) return 0.5;
    
    try {
      const parsed = JSON.parse(analysis);
      return parsed[metricType] || 0.5;
    } catch {
      return 0.5;
    }
  }

  private calculateTherapeuticAlliance(exchanges: ThreadExchange[]): number {
    // Calculate based on response patterns and engagement
    const avgWordCount = exchanges.reduce((sum, ex) => 
      sum + (ex.userWordCount || 0), 0) / exchanges.length;
    
    const positiveResponses = exchanges.filter(ex => 
      ex.userInput && this.detectPositiveEngagement(ex.userInput)
    ).length;
    
    let alliance = 0.5;
    alliance += Math.min(0.3, avgWordCount / 100);
    alliance += Math.min(0.2, (positiveResponses / exchanges.length) * 0.5);
    
    return Math.min(1, alliance);
  }

  private detectPositiveEngagement(input: string): boolean {
    const positiveWords = [
      'thank', 'help', 'understand', 'appreciate', 'good',
      'better', 'insight', 'useful', 'right', 'yes'
    ];
    
    return positiveWords.some(word => 
      input.toLowerCase().includes(word)
    );
  }

  private calculateRecentPerformance(framework: string, profile: any): number {
    // Mock calculation based on profile data
    const basePerformance = profile.therapeuticAlliance || 0.7;
    const frameworkSpecific = profile.preferredFrameworks?.includes(framework) ? 0.1 : 0;
    
    return Math.min(1, basePerformance + frameworkSpecific);
  }

  private assessSituationUrgency(emotionalState: EmotionalStateDetection, input: string): 'low' | 'medium' | 'high' {
    if (emotionalState.riskIndicators.length > 0) return 'high';
    if (emotionalState.stateIntensity > 0.8) return 'high';
    if (emotionalState.stateIntensity > 0.6) return 'medium';
    return 'low';
  }

  private identifyPrimaryTherapeuticNeed(
    sessionMetrics: SessionProgressionMetrics,
    emotionalState: EmotionalStateDetection,
    engagementMetrics: UserEngagementMetrics
  ): string {
    if (emotionalState.riskIndicators.length > 0) return 'crisis_support';
    if (engagementMetrics.therapeuticAlliance < 0.6) return 'rapport_building';
    if (sessionMetrics.resistanceIndicators > sessionMetrics.breakthroughIndicators) return 'resistance_resolution';
    if (emotionalState.stateStability < 0.5) return 'emotional_regulation';
    if (sessionMetrics.breakthroughIndicators > 0) return 'insight_deepening';
    return 'general_exploration';
  }

  private determineInterventionType(
    primaryNeed: string,
    emotionalState: EmotionalStateDetection,
    sessionMetrics: SessionProgressionMetrics
  ): string {
    switch (primaryNeed) {
      case 'crisis_support': return 'supportive';
      case 'rapport_building': return 'validating';
      case 'resistance_resolution': return 'exploratory';
      case 'emotional_regulation': return 'stabilizing';
      case 'insight_deepening': return 'interpretive';
      default: return 'conversational';
    }
  }

  private calculateRecommendationConfidence(
    sessionMetrics: SessionProgressionMetrics,
    emotionalState: EmotionalStateDetection,
    engagementMetrics: UserEngagementMetrics,
    frameworkEffectiveness: FrameworkEffectiveness[]
  ): number {
    let confidence = 0.5;
    
    // Higher confidence with more session data
    confidence += Math.min(0.2, sessionMetrics.totalExchanges * 0.02);
    
    // Higher confidence with stable emotional state
    confidence += emotionalState.stateStability * 0.2;
    
    // Higher confidence with good engagement
    confidence += engagementMetrics.therapeuticAlliance * 0.2;
    
    // Higher confidence with clear framework effectiveness data
    if (frameworkEffectiveness.length > 0) {
      confidence += frameworkEffectiveness[0].recentPerformance * 0.1;
    }
    
    return Math.min(1, confidence);
  }

  private generateRecommendationRationale(
    framework: string,
    sessionMetrics: SessionProgressionMetrics,
    emotionalState: EmotionalStateDetection,
    engagementMetrics: UserEngagementMetrics,
    primaryNeed: string
  ): string {
    const rationales = [];
    
    rationales.push(`Selected ${framework} framework based on ${primaryNeed} need`);
    
    if (sessionMetrics.engagementTrend === 'decreasing') {
      rationales.push('engagement trend suggests need for framework adjustment');
    }
    
    if (emotionalState.stateIntensity > 0.7) {
      rationales.push('high emotional intensity requires supportive approach');
    }
    
    if (engagementMetrics.therapeuticAlliance < 0.6) {
      rationales.push('alliance building is priority');
    }
    
    return rationales.join('; ');
  }

  private generateAdaptationInstructions(
    framework: string,
    emotionalState: EmotionalStateDetection,
    engagementMetrics: UserEngagementMetrics
  ): string[] {
    const instructions = [];
    
    if (emotionalState.stateIntensity > 0.7) {
      instructions.push('Use gentle, non-confrontational approach');
      instructions.push('Validate emotions before exploring');
    }
    
    if (engagementMetrics.therapeuticAlliance < 0.6) {
      instructions.push('Focus on building rapport and trust');
      instructions.push('Use more reflective and empathetic responses');
    }
    
    if (emotionalState.riskIndicators.length > 0) {
      instructions.push('Prioritize safety and stabilization');
      instructions.push('Avoid intensive exploration until stability achieved');
    }
    
    return instructions;
  }

  private identifyAvoidanceFactors(
    emotionalState: EmotionalStateDetection,
    sessionMetrics: SessionProgressionMetrics
  ): string[] {
    const avoidanceFactors = [];
    
    if (emotionalState.riskIndicators.length > 0) {
      avoidanceFactors.push('Avoid challenging confrontations');
      avoidanceFactors.push('Avoid deep trauma exploration');
    }
    
    if (sessionMetrics.resistanceIndicators > 2) {
      avoidanceFactors.push('Avoid directive approaches');
      avoidanceFactors.push('Reduce interpretation frequency');
    }
    
    if (emotionalState.stateIntensity > 0.8) {
      avoidanceFactors.push('Avoid overwhelming with too many questions');
    }
    
    return avoidanceFactors;
  }

  private predictExpectedOutcomes(
    framework: string,
    effectiveness?: FrameworkEffectiveness
  ): string[] {
    const outcomes = [];
    
    if (effectiveness) {
      if (effectiveness.successRate > 0.7) {
        outcomes.push('High likelihood of positive engagement');
      }
      if (effectiveness.breakthroughRate > 0.6) {
        outcomes.push('Potential for insight generation');
      }
      if (effectiveness.emotionalImpact > 0.7) {
        outcomes.push('Expected emotional resonance');
      }
    }
    
    // Framework-specific outcomes
    switch (framework) {
      case 'cognitive_behavioral':
        outcomes.push('Improved thought pattern awareness', 'Practical coping strategies');
        break;
      case 'psychodynamic':
        outcomes.push('Deeper self-understanding', 'Pattern recognition');
        break;
      case 'humanistic':
        outcomes.push('Enhanced self-acceptance', 'Improved emotional expression');
        break;
      case 'solution_focused':
        outcomes.push('Goal clarification', 'Action-oriented insights');
        break;
    }
    
    return outcomes;
  }

  // Default fallback methods
  private getDefaultSessionMetrics(): SessionProgressionMetrics {
    return {
      totalExchanges: 0,
      averageResponseTime: 5000,
      emotionalStateProgression: ['neutral'],
      engagementTrend: 'stable',
      breakthroughIndicators: 0,
      resistanceIndicators: 0,
      currentSessionDuration: 0
    };
  }

  private getDefaultEmotionalState(): EmotionalStateDetection {
    return {
      currentState: 'neutral',
      stateIntensity: 0.5,
      stateStability: 0.7,
      predominantEmotions: ['neutral'],
      emotionalShifts: 0,
      riskIndicators: []
    };
  }

  private getDefaultEngagementMetrics(): UserEngagementMetrics {
    return {
      responseLength: 0,
      responseDepth: 0.5,
      questionEngagement: 0.5,
      insightGeneration: 0.5,
      emotionalResonance: 0.5,
      therapeuticAlliance: 0.7
    };
  }

  private getDefaultFrameworkEffectiveness(): FrameworkEffectiveness[] {
    return [
      {
        frameworkName: 'cognitive_behavioral',
        successRate: 0.75,
        averageEngagement: 0.8,
        emotionalImpact: 0.7,
        breakthroughRate: 0.65,
        userSatisfaction: 0.8,
        recentPerformance: 0.75
      },
      {
        frameworkName: 'humanistic',
        successRate: 0.8,
        averageEngagement: 0.85,
        emotionalImpact: 0.9,
        breakthroughRate: 0.6,
        userSatisfaction: 0.85,
        recentPerformance: 0.8
      }
    ];
  }
}

export const dynamicFrameworkSelector = new DynamicFrameworkSelector();