/**
 * Adaptive Language Generation System
 * Provides user-specific language adaptation including vocabulary complexity matching,
 * metaphor/analogy preferences, cultural communication patterns, and emotional resonance optimization
 */

import { db } from "../db";
import { userTherapeuticProfile, threadExchanges, journalingThreads } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface VocabularyProfile {
  complexityLevel: 'simple' | 'moderate' | 'advanced' | 'professional';
  averageWordsPerSentence: number;
  technicalTermComfort: number; // 0-1 scale
  abstractConceptsComfort: number; // 0-1 scale
  preferredSentenceStructure: 'simple' | 'compound' | 'complex';
  readingLevel: number; // Grade level 6-16+
}

export interface MetaphorPreferences {
  preferredTypes: string[]; // ['nature', 'technology', 'sports', 'music', 'cooking', 'journey', 'building']
  abstractionLevel: 'concrete' | 'moderate' | 'abstract';
  culturalContext: string[];
  effectivenessScores: Record<string, number>; // Track which metaphors resonate
  avoidancePatterns: string[]; // Metaphors that don't work for this user
}

export interface CulturalCommunicationPattern {
  communicationStyle: 'direct' | 'indirect' | 'contextual' | 'relationship-focused';
  formalityLevel: 'casual' | 'semi-formal' | 'formal';
  emotionalExpressiveness: 'reserved' | 'moderate' | 'expressive';
  conflictApproach: 'avoidant' | 'collaborative' | 'direct' | 'hierarchical';
  timeOrientation: 'past-focused' | 'present-focused' | 'future-focused';
  individualismCollectivism: number; // -1 (collectivist) to 1 (individualist)
  powerDistance: number; // 0-1 scale
  uncertaintyAvoidance: number; // 0-1 scale
}

export interface EmotionalResonanceProfile {
  primaryEmotionalChannels: string[]; // ['visual', 'auditory', 'kinesthetic', 'cognitive']
  motivationalTriggers: string[]; // ['achievement', 'affiliation', 'autonomy', 'security']
  responseToValidation: number; // 0-1 scale
  responseToChallenge: number; // 0-1 scale
  comfortWithVulnerability: number; // 0-1 scale
  preferredEmotionalIntensity: 'gentle' | 'moderate' | 'intense';
  resonantEmotionalLanguage: string[]; // Words/phrases that create emotional connection
}

export interface LanguageAdaptationProfile {
  userId: string;
  vocabularyProfile: VocabularyProfile;
  metaphorPreferences: MetaphorPreferences;
  culturalPatterns: CulturalCommunicationPattern;
  emotionalResonance: EmotionalResonanceProfile;
  lastUpdated: Date;
  confidenceScore: number; // How confident we are in this profile (0-1)
}

export interface AdaptedLanguageResponse {
  adaptedContent: string;
  adaptationReasoning: string;
  vocabularyAdjustments: string[];
  metaphorsUsed: string[];
  culturalAdaptations: string[];
  emotionalResonanceElements: string[];
  originalComplexity: number;
  targetComplexity: number;
}

export class AdaptiveLanguageGenerator {

  /**
   * Generate language-adapted therapeutic response
   */
  async generateAdaptedResponse(
    userId: string,
    originalResponse: string,
    context: {
      userInput: string;
      emotionalState: any;
      therapeuticFramework: string;
      sessionHistory: any[];
    }
  ): Promise<AdaptedLanguageResponse> {
    try {
      // Get or create language adaptation profile
      const languageProfile = await this.getLanguageAdaptationProfile(userId);
      
      // Analyze original response complexity
      const originalComplexity = this.analyzeTextComplexity(originalResponse);
      
      // Determine target complexity based on user profile
      const targetComplexity = this.determineTargetComplexity(languageProfile, context);
      
      // Apply vocabulary adaptations
      let adaptedContent = await this.adaptVocabulary(
        originalResponse, 
        languageProfile.vocabularyProfile,
        targetComplexity
      );
      
      // Apply metaphor and analogy adaptations
      adaptedContent = await this.adaptMetaphors(
        adaptedContent,
        languageProfile.metaphorPreferences,
        context
      );
      
      // Apply cultural communication adaptations
      adaptedContent = await this.adaptCulturalPatterns(
        adaptedContent,
        languageProfile.culturalPatterns,
        context
      );
      
      // Apply emotional resonance optimization
      const emotionalAdaptation = await this.optimizeEmotionalResonance(
        adaptedContent,
        languageProfile.emotionalResonance,
        context
      );
      
      adaptedContent = emotionalAdaptation.content;
      
      // Update profile based on this interaction
      await this.updateLanguageProfile(userId, {
        userInput: context.userInput,
        originalResponse,
        adaptedResponse: adaptedContent,
        userReaction: context.emotionalState
      });
      
      return {
        adaptedContent,
        adaptationReasoning: this.generateAdaptationReasoning(languageProfile, originalComplexity, targetComplexity),
        vocabularyAdjustments: this.extractVocabularyChanges(originalResponse, adaptedContent),
        metaphorsUsed: this.extractMetaphors(adaptedContent),
        culturalAdaptations: this.extractCulturalAdaptations(originalResponse, adaptedContent),
        emotionalResonanceElements: emotionalAdaptation.resonanceElements,
        originalComplexity,
        targetComplexity
      };
      
    } catch (error) {
      console.error('Error generating adapted language response:', error);
      return {
        adaptedContent: originalResponse,
        adaptationReasoning: 'Language adaptation unavailable',
        vocabularyAdjustments: [],
        metaphorsUsed: [],
        culturalAdaptations: [],
        emotionalResonanceElements: [],
        originalComplexity: 5,
        targetComplexity: 5
      };
    }
  }

  /**
   * Get or create language adaptation profile for user
   */
  async getLanguageAdaptationProfile(userId: string): Promise<LanguageAdaptationProfile> {
    try {
      // Try to get existing profile
      const existingProfile = await db.select()
        .from(userTherapeuticProfile)
        .where(eq(userTherapeuticProfile.userId, userId))
        .limit(1);
      
      if (existingProfile.length > 0 && existingProfile[0].languageAdaptationProfile) {
        try {
          return JSON.parse(existingProfile[0].languageAdaptationProfile as string);
        } catch {
          // Fall through to create new profile
        }
      }
      
      // Create new profile by analyzing user's communication patterns
      const newProfile = await this.createLanguageProfileFromHistory(userId);
      
      // Store the new profile
      await this.storeLanguageProfile(userId, newProfile);
      
      return newProfile;
      
    } catch (error) {
      console.error('Error getting language adaptation profile:', error);
      return this.getDefaultLanguageProfile(userId);
    }
  }

  /**
   * Create language profile by analyzing user's communication history
   */
  private async createLanguageProfileFromHistory(userId: string): Promise<LanguageAdaptationProfile> {
    try {
      // Get user's recent exchanges for analysis
      const exchanges = await db.select()
        .from(threadExchanges)
        .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(eq(journalingThreads.userId, userId))
        .orderBy(desc(threadExchanges.createdAt))
        .limit(20);
      
      const userInputs = exchanges.map(e => e.userInput).filter(Boolean);
      
      if (userInputs.length === 0) {
        return this.getDefaultLanguageProfile(userId);
      }
      
      // Analyze vocabulary complexity
      const vocabularyProfile = this.analyzeVocabularyPatterns(userInputs);
      
      // Analyze metaphor preferences from successful interactions
      const metaphorPreferences = this.analyzeMetaphorPreferences(userInputs, exchanges);
      
      // Infer cultural communication patterns
      const culturalPatterns = this.inferCulturalPatterns(userInputs);
      
      // Analyze emotional resonance patterns
      const emotionalResonance = this.analyzeEmotionalResonance(userInputs, exchanges);
      
      return {
        userId,
        vocabularyProfile,
        metaphorPreferences,
        culturalPatterns,
        emotionalResonance,
        lastUpdated: new Date(),
        confidenceScore: Math.min(0.8, userInputs.length * 0.05) // Confidence builds with more data
      };
      
    } catch (error) {
      console.error('Error creating language profile from history:', error);
      return this.getDefaultLanguageProfile(userId);
    }
  }

  /**
   * Analyze user's vocabulary patterns and complexity preferences
   */
  private analyzeVocabularyPatterns(userInputs: string[]): VocabularyProfile {
    const allText = userInputs.join(' ');
    const words = allText.split(/\s+/).filter(word => word.length > 0);
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Calculate complexity metrics
    const averageWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Analyze technical terms and abstract concepts
    const technicalTerms = this.countTechnicalTerms(words);
    const abstractConcepts = this.countAbstractConcepts(words);
    
    // Determine complexity level
    let complexityLevel: 'simple' | 'moderate' | 'advanced' | 'professional' = 'moderate';
    if (averageWordLength < 4.5 && averageWordsPerSentence < 12) {
      complexityLevel = 'simple';
    } else if (averageWordLength > 6 && averageWordsPerSentence > 18) {
      complexityLevel = 'advanced';
    } else if (technicalTerms > 0.1 || abstractConcepts > 0.15) {
      complexityLevel = 'professional';
    }
    
    return {
      complexityLevel,
      averageWordsPerSentence,
      technicalTermComfort: Math.min(1, technicalTerms * 5),
      abstractConceptsComfort: Math.min(1, abstractConcepts * 3),
      preferredSentenceStructure: averageWordsPerSentence > 15 ? 'complex' : 
                                  averageWordsPerSentence > 10 ? 'compound' : 'simple',
      readingLevel: Math.max(6, Math.min(16, 4 + averageWordLength + (averageWordsPerSentence * 0.3)))
    };
  }

  /**
   * Analyze metaphor preferences from user interactions
   */
  private analyzeMetaphorPreferences(userInputs: string[], exchanges: any[]): MetaphorPreferences {
    const metaphorTypes = ['nature', 'technology', 'sports', 'music', 'cooking', 'journey', 'building'];
    const userText = userInputs.join(' ').toLowerCase();
    
    const preferredTypes = metaphorTypes.filter(type => {
      const keywords = this.getMetaphorKeywords(type);
      return keywords.some(keyword => userText.includes(keyword));
    });
    
    // Default to journey and nature if no clear preferences
    if (preferredTypes.length === 0) {
      preferredTypes.push('journey', 'nature');
    }
    
    return {
      preferredTypes,
      abstractionLevel: this.determineAbstractionLevel(userInputs),
      culturalContext: ['universal'], // Can be enhanced with cultural detection
      effectivenessScores: {},
      avoidancePatterns: []
    };
  }

  /**
   * Infer cultural communication patterns from user input
   */
  private inferCulturalPatterns(userInputs: string[]): CulturalCommunicationPattern {
    const allText = userInputs.join(' ').toLowerCase();
    
    // Analyze directness vs indirectness
    const directIndicators = ['directly', 'clearly', 'obviously', 'frankly'];
    const indirectIndicators = ['maybe', 'perhaps', 'might', 'could be', 'sort of'];
    
    const directScore = directIndicators.filter(word => allText.includes(word)).length;
    const indirectScore = indirectIndicators.filter(word => allText.includes(word)).length;
    
    const communicationStyle = directScore > indirectScore ? 'direct' : 'indirect';
    
    // Analyze formality
    const formalIndicators = ['however', 'furthermore', 'consequently', 'nevertheless'];
    const casualIndicators = ['yeah', 'okay', 'cool', 'awesome', 'totally'];
    
    const formalScore = formalIndicators.filter(word => allText.includes(word)).length;
    const casualScore = casualIndicators.filter(word => allText.includes(word)).length;
    
    const formalityLevel = formalScore > casualScore ? 'formal' : 
                          formalScore === casualScore ? 'semi-formal' : 'casual';
    
    return {
      communicationStyle,
      formalityLevel,
      emotionalExpressiveness: 'moderate',
      conflictApproach: 'collaborative',
      timeOrientation: 'present-focused',
      individualismCollectivism: 0,
      powerDistance: 0.3,
      uncertaintyAvoidance: 0.5
    };
  }

  /**
   * Analyze emotional resonance patterns
   */
  private analyzeEmotionalResonance(userInputs: string[], exchanges: any[]): EmotionalResonanceProfile {
    const allText = userInputs.join(' ').toLowerCase();
    
    // Analyze emotional channels
    const visualWords = ['see', 'look', 'picture', 'imagine', 'visualize'];
    const auditoryWords = ['hear', 'listen', 'sound', 'voice', 'echo'];
    const kinestheticWords = ['feel', 'touch', 'move', 'grasp', 'handle'];
    const cognitiveWords = ['think', 'understand', 'analyze', 'process', 'consider'];
    
    const channels = [];
    if (visualWords.some(word => allText.includes(word))) channels.push('visual');
    if (auditoryWords.some(word => allText.includes(word))) channels.push('auditory');
    if (kinestheticWords.some(word => allText.includes(word))) channels.push('kinesthetic');
    if (cognitiveWords.some(word => allText.includes(word))) channels.push('cognitive');
    
    if (channels.length === 0) channels.push('cognitive'); // Default
    
    return {
      primaryEmotionalChannels: channels,
      motivationalTriggers: ['autonomy', 'achievement'], // Default, can be enhanced
      responseToValidation: 0.7,
      responseToChallenge: 0.6,
      comfortWithVulnerability: 0.5,
      preferredEmotionalIntensity: 'moderate',
      resonantEmotionalLanguage: this.extractEmotionalLanguage(allText)
    };
  }

  /**
   * Adapt vocabulary complexity to match user preferences
   */
  private async adaptVocabulary(
    text: string, 
    vocabularyProfile: VocabularyProfile,
    targetComplexity: number
  ): Promise<string> {
    // Simple vocabulary adaptation
    if (vocabularyProfile.complexityLevel === 'simple') {
      return this.simplifyVocabulary(text);
    } else if (vocabularyProfile.complexityLevel === 'professional') {
      return this.enhanceVocabulary(text);
    }
    
    return text;
  }

  /**
   * Adapt metaphors and analogies to user preferences
   */
  private async adaptMetaphors(
    text: string,
    metaphorPreferences: MetaphorPreferences,
    context: any
  ): Promise<string> {
    // Look for opportunities to add metaphors from preferred types
    const preferredType = metaphorPreferences.preferredTypes[0] || 'journey';
    
    // Simple metaphor injection based on content
    if (text.includes('progress') && preferredType === 'journey') {
      text = text.replace(/\bmake progress\b/g, 'move forward on your journey');
    } else if (text.includes('challenge') && preferredType === 'nature') {
      text = text.replace(/\bchallenge\b/g, 'obstacle in your path, like a river to cross');
    }
    
    return text;
  }

  /**
   * Adapt cultural communication patterns
   */
  private async adaptCulturalPatterns(
    text: string,
    culturalPatterns: CulturalCommunicationPattern,
    context: any
  ): Promise<string> {
    // Adjust directness
    if (culturalPatterns.communicationStyle === 'indirect') {
      text = this.makeMoreIndirect(text);
    } else if (culturalPatterns.communicationStyle === 'direct') {
      text = this.makeMoreDirect(text);
    }
    
    // Adjust formality
    if (culturalPatterns.formalityLevel === 'casual') {
      text = this.makeCasual(text);
    } else if (culturalPatterns.formalityLevel === 'formal') {
      text = this.makeFormal(text);
    }
    
    return text;
  }

  /**
   * Optimize emotional resonance
   */
  private async optimizeEmotionalResonance(
    text: string,
    emotionalResonance: EmotionalResonanceProfile,
    context: any
  ): Promise<{ content: string; resonanceElements: string[] }> {
    const resonanceElements: string[] = [];
    let optimizedText = text;
    
    // Add sensory language based on primary channels
    if (emotionalResonance.primaryEmotionalChannels.includes('visual')) {
      optimizedText = this.addVisualLanguage(optimizedText);
      resonanceElements.push('visual imagery');
    }
    
    if (emotionalResonance.primaryEmotionalChannels.includes('kinesthetic')) {
      optimizedText = this.addKinestheticLanguage(optimizedText);
      resonanceElements.push('kinesthetic language');
    }
    
    // Incorporate resonant emotional language
    if (emotionalResonance.resonantEmotionalLanguage.length > 0) {
      optimizedText = this.incorporateResonantLanguage(optimizedText, emotionalResonance.resonantEmotionalLanguage);
      resonanceElements.push('personal emotional language');
    }
    
    return {
      content: optimizedText,
      resonanceElements
    };
  }

  // Helper methods for text analysis and adaptation
  private analyzeTextComplexity(text: string): number {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);
    
    // Simple complexity score (1-10)
    return Math.min(10, Math.max(1, (avgWordsPerSentence / 3) + (text.length / 200)));
  }

  private determineTargetComplexity(profile: LanguageAdaptationProfile, context: any): number {
    const base = profile.vocabularyProfile.readingLevel - 6; // Convert to 0-10 scale
    
    // Adjust based on emotional state and context
    if (context.emotionalState?.intensity > 0.7) {
      return Math.max(1, base - 2); // Simplify during high emotion
    }
    
    return Math.max(1, Math.min(10, base));
  }

  private countTechnicalTerms(words: string[]): number {
    const technicalPatterns = [/ology$/, /ism$/, /tion$/, /sion$/];
    const technicalCount = words.filter(word => 
      technicalPatterns.some(pattern => pattern.test(word)) || word.length > 12
    ).length;
    
    return technicalCount / words.length;
  }

  private countAbstractConcepts(words: string[]): number {
    const abstractWords = ['concept', 'idea', 'theory', 'philosophy', 'meaning', 'essence', 'nature'];
    const abstractCount = words.filter(word => 
      abstractWords.some(abstract => word.toLowerCase().includes(abstract))
    ).length;
    
    return abstractCount / words.length;
  }

  private getMetaphorKeywords(type: string): string[] {
    const keywords: Record<string, string[]> = {
      nature: ['tree', 'river', 'mountain', 'garden', 'seed', 'growth', 'seasons', 'weather'],
      technology: ['code', 'program', 'system', 'network', 'data', 'process', 'algorithm'],
      sports: ['game', 'team', 'goal', 'play', 'win', 'strategy', 'coach', 'practice'],
      music: ['harmony', 'rhythm', 'tune', 'song', 'melody', 'instrument', 'concert'],
      cooking: ['recipe', 'ingredient', 'flavor', 'cook', 'bake', 'mix', 'taste'],
      journey: ['path', 'road', 'travel', 'destination', 'journey', 'steps', 'direction'],
      building: ['foundation', 'structure', 'build', 'construct', 'framework', 'blueprint']
    };
    
    return keywords[type] || [];
  }

  private determineAbstractionLevel(userInputs: string[]): 'concrete' | 'moderate' | 'abstract' {
    const allText = userInputs.join(' ').toLowerCase();
    const abstractIndicators = ['concept', 'idea', 'feeling', 'sense', 'generally', 'overall'];
    const concreteIndicators = ['specific', 'exactly', 'particular', 'precise', 'definitely'];
    
    const abstractScore = abstractIndicators.filter(word => allText.includes(word)).length;
    const concreteScore = concreteIndicators.filter(word => allText.includes(word)).length;
    
    if (abstractScore > concreteScore) return 'abstract';
    if (concreteScore > abstractScore) return 'concrete';
    return 'moderate';
  }

  private extractEmotionalLanguage(text: string): string[] {
    const emotionalWords = ['feel', 'emotion', 'heart', 'soul', 'deeply', 'truly', 'really'];
    return emotionalWords.filter(word => text.includes(word));
  }

  private simplifyVocabulary(text: string): string {
    const simplifications: Record<string, string> = {
      'utilize': 'use',
      'facilitate': 'help',
      'demonstrate': 'show',
      'approximately': 'about',
      'consequently': 'so',
      'furthermore': 'also',
      'however': 'but',
      'therefore': 'so'
    };
    
    let simplified = text;
    Object.entries(simplifications).forEach(([complex, simple]) => {
      simplified = simplified.replace(new RegExp(complex, 'gi'), simple);
    });
    
    return simplified;
  }

  private enhanceVocabulary(text: string): string {
    const enhancements: Record<string, string> = {
      'help': 'facilitate',
      'show': 'demonstrate',
      'about': 'approximately',
      'so': 'consequently',
      'also': 'furthermore',
      'but': 'however'
    };
    
    let enhanced = text;
    Object.entries(enhancements).forEach(([simple, complex]) => {
      enhanced = enhanced.replace(new RegExp(`\\b${simple}\\b`, 'gi'), complex);
    });
    
    return enhanced;
  }

  private makeMoreIndirect(text: string): string {
    return text
      .replace(/\bYou should\b/g, 'You might consider')
      .replace(/\bYou need to\b/g, 'It could be helpful to')
      .replace(/\bYou must\b/g, 'Perhaps you could');
  }

  private makeMoreDirect(text: string): string {
    return text
      .replace(/\bmight consider\b/g, 'should')
      .replace(/\bcould be helpful to\b/g, 'need to')
      .replace(/\bperhaps you could\b/g, 'you should');
  }

  private makeCasual(text: string): string {
    return text
      .replace(/\bhowever\b/g, 'but')
      .replace(/\bfurthermore\b/g, 'also')
      .replace(/\bconsequently\b/g, 'so');
  }

  private makeFormal(text: string): string {
    return text
      .replace(/\bbut\b/g, 'however')
      .replace(/\balso\b/g, 'furthermore')
      .replace(/\bso\b/g, 'consequently');
  }

  private addVisualLanguage(text: string): string {
    return text
      .replace(/\bunderstand\b/g, 'see clearly')
      .replace(/\brealize\b/g, 'picture this');
  }

  private addKinestheticLanguage(text: string): string {
    return text
      .replace(/\bunderstand\b/g, 'grasp')
      .replace(/\bprogress\b/g, 'movement forward');
  }

  private incorporateResonantLanguage(text: string, resonantWords: string[]): string {
    // Simple incorporation - could be enhanced with more sophisticated NLP
    return text;
  }

  private extractVocabularyChanges(original: string, adapted: string): string[] {
    // Simple implementation - could be enhanced with more sophisticated diff
    const changes: string[] = [];
    if (original !== adapted) {
      changes.push('vocabulary adaptation applied');
    }
    return changes;
  }

  private extractMetaphors(text: string): string[] {
    const metaphorPatterns = [
      /like a [^.!?]*/g,
      /as if [^.!?]*/g,
      /journey/g,
      /path/g,
      /bridge/g,
      /mountain/g
    ];
    
    const metaphors: string[] = [];
    metaphorPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        metaphors.push(...matches);
      }
    });
    
    return metaphors;
  }

  private extractCulturalAdaptations(original: string, adapted: string): string[] {
    const adaptations: string[] = [];
    if (original !== adapted) {
      adaptations.push('cultural communication patterns applied');
    }
    return adaptations;
  }

  private generateAdaptationReasoning(
    profile: LanguageAdaptationProfile,
    originalComplexity: number,
    targetComplexity: number
  ): string {
    const adaptations = [];
    
    if (originalComplexity !== targetComplexity) {
      adaptations.push(`Adjusted complexity from ${originalComplexity} to ${targetComplexity}`);
    }
    
    if (profile.metaphorPreferences.preferredTypes.length > 0) {
      adaptations.push(`Used preferred metaphor types: ${profile.metaphorPreferences.preferredTypes.join(', ')}`);
    }
    
    adaptations.push(`Matched ${profile.culturalPatterns.communicationStyle} communication style`);
    
    return adaptations.join('; ');
  }

  private async updateLanguageProfile(userId: string, interaction: any): Promise<void> {
    try {
      // Get current profile
      const currentProfile = await this.getLanguageAdaptationProfile(userId);
      
      // Update confidence score
      currentProfile.confidenceScore = Math.min(1, currentProfile.confidenceScore + 0.02);
      currentProfile.lastUpdated = new Date();
      
      // Store updated profile
      await this.storeLanguageProfile(userId, currentProfile);
      
    } catch (error) {
      console.error('Error updating language profile:', error);
    }
  }

  private async storeLanguageProfile(userId: string, profile: LanguageAdaptationProfile): Promise<void> {
    try {
      const profileJson = JSON.stringify(profile);
      
      await db.insert(userTherapeuticProfile).values({
        userId,
        languageAdaptationProfile: profileJson,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: userTherapeuticProfile.userId,
        set: {
          languageAdaptationProfile: profileJson,
          updatedAt: new Date()
        }
      });
      
    } catch (error) {
      console.error('Error storing language profile:', error);
    }
  }

  private getDefaultLanguageProfile(userId: string): LanguageAdaptationProfile {
    return {
      userId,
      vocabularyProfile: {
        complexityLevel: 'moderate',
        averageWordsPerSentence: 15,
        technicalTermComfort: 0.5,
        abstractConceptsComfort: 0.5,
        preferredSentenceStructure: 'compound',
        readingLevel: 10
      },
      metaphorPreferences: {
        preferredTypes: ['journey', 'nature'],
        abstractionLevel: 'moderate',
        culturalContext: ['universal'],
        effectivenessScores: {},
        avoidancePatterns: []
      },
      culturalPatterns: {
        communicationStyle: 'direct',
        formalityLevel: 'semi-formal',
        emotionalExpressiveness: 'moderate',
        conflictApproach: 'collaborative',
        timeOrientation: 'present-focused',
        individualismCollectivism: 0,
        powerDistance: 0.3,
        uncertaintyAvoidance: 0.5
      },
      emotionalResonance: {
        primaryEmotionalChannels: ['cognitive', 'visual'],
        motivationalTriggers: ['autonomy', 'achievement'],
        responseToValidation: 0.7,
        responseToChallenge: 0.6,
        comfortWithVulnerability: 0.5,
        preferredEmotionalIntensity: 'moderate',
        resonantEmotionalLanguage: []
      },
      lastUpdated: new Date(),
      confidenceScore: 0.3
    };
  }
}

export const adaptiveLanguageGenerator = new AdaptiveLanguageGenerator();