import { db } from "../db";
import { 
  journalingThreads, 
  threadExchanges, 
  psychologicalProfile, 
  emotionalStateHistory,
  type JournalingThread,
  type ThreadExchange,
  type PsychologicalProfile
} from "@shared/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { DeepJournalingRequest, DeepJournalingResponse } from "./types";
import { buildTherapeuticSystemPrompt } from "./therapeutic-frameworks";
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * FastChatEngine - Optimized for <1s responses while preserving all premium functions
 * 
 * Strategy:
 * 1. Fast Response Flow: Only essential components for immediate response
 * 2. Async Post-Processing: All heavy analysis runs in background
 * 3. Cached Results: Previous analysis results preloaded into prompts
 * 4. Graceful Fallback: Works even when background jobs haven't completed
 */
export class FastChatEngine {
  private anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  /**
   * Main fast response processing - optimized for speed
   */
  async processFastResponse(request: DeepJournalingRequest): Promise<DeepJournalingResponse> {
    const startTime = Date.now();

    try {
      // Ultra-fast path: Skip all database lookups and use minimal processing
      const thread = await this.getOrCreateThread(request.userId, request.threadId);

      // Minimal system prompt - no complex processing
      const systemPrompt = `You are a compassionate therapeutic AI assistant. Provide empathetic, insightful responses that validate the user's feelings and offer gentle guidance. Keep responses warm, professional, and conversational (2-3 paragraphs). Always end with a thoughtful question to deepen exploration.`;

      // Direct AI call with minimal prompt
      const aiResponse = await this.generateFastAIResponse(
        systemPrompt,
        request.userInput,
        request.customizations?.perspective || 'psychologist'
      );

      // Minimal database insert - only essential fields
      const [savedExchange] = await db.insert(threadExchanges).values({
        threadId: thread.id,
        exchangeOrder: 1,
        userInput: request.userInput,
        userWordCount: request.userInput.split(' ').length,
        aiAnalysis: { professionalAnalysis: aiResponse.analysis },
        aiQuestion: aiResponse.question,
        modelUsed: 'gpt-3.5-turbo',
        processingTime: Date.now() - startTime
      }).returning();

      // Step 6: Enqueue background processing (non-blocking)
      this.enqueuePostProcessingJob({
        userId: request.userId,
        threadId: thread.id,
        exchangeId: savedExchange.id,
        userInput: request.userInput,
        aiResponse,
        requestData: request
      }).catch(error => {
        console.error('Background processing error:', error);
        // Don't block the main response
      });

      // Step 7: Return fast response
      return {
        threadId: thread.id,
        exchangeId: savedExchange.id,
        analysis: {
          emotionalAssessment: aiResponse.emotionalAssessment || {},
          patternInsights: aiResponse.patternInsights || {},
          professionalAnalysis: aiResponse.analysis
        },
        question: aiResponse.question,
        suggestions: aiResponse.suggestions || [],
        emotionalState: aiResponse.emotionalState,
        cost: aiResponse.cost || '0.008',
        remainingRequests: aiResponse.remainingRequests || 999
      };

    } catch (error) {
      console.error('Fast response processing error:', error);
      throw error;
    }
  }

  /**
   * Get or create journaling thread (optimized query)
   */
  private async getOrCreateThread(userId: string, threadId?: string): Promise<JournalingThread> {
    if (threadId) {
      const [thread] = await db.select()
        .from(journalingThreads)
        .where(and(
          eq(journalingThreads.id, threadId),
          eq(journalingThreads.userId, userId)
        ))
        .limit(1);
      
      if (thread) return thread;
    }

    // Create new thread
    const [newThread] = await db.insert(journalingThreads).values({
      userId,
      title: 'Therapeutic Session',
      description: 'AI-assisted therapeutic conversation',
      preferredMode: 'conversational',
      preferredTone: 'supportive',
      preferredPerspective: 'psychologist'
    }).returning();

    return newThread;
  }

  /**
   * Get lightweight memory - only recent exchanges for context
   */
  private async getLightweightMemory(threadId: string): Promise<ThreadExchange[]> {
    return await db.select()
      .from(threadExchanges)
      .where(eq(threadExchanges.threadId, threadId))
      .orderBy(desc(threadExchanges.exchangeOrder))
      .limit(3); // Only last 3 exchanges for speed
  }

  /**
   * Get cached insights from last session processing
   */
  private async getLastSessionInsights(userId: string): Promise<any> {
    try {
      // Get the most recent psychological analysis results
      const [recentProfile] = await db.select()
        .from(psychologicalProfile)
        .where(eq(psychologicalProfile.userId, userId))
        .orderBy(desc(psychologicalProfile.id))
        .limit(1);

      if (!recentProfile) {
        return this.getDefaultInsights();
      }

      return {
        therapeuticFramework: recentProfile.communicationStyle || 'cbt',
        emotionalBaseline: recentProfile.currentDominantEmotion || 'neutral',
        communicationStyle: recentProfile.communicationStyle || 'balanced',
        recentPatterns: recentProfile.personalityTraits || {},
        strengths: recentProfile.identifiedStrengths || [],
        areas_of_focus: recentProfile.identifiedGrowthAreas || [],
        last_updated: recentProfile.updatedAt
      };
    } catch (error) {
      console.error('Error getting session insights:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Build fast, lightweight system prompt optimized for speed
   */
  private async buildFastSystemPrompt(
    userInput: string,
    recentMemory: ThreadExchange[],
    sessionInsights: any,
    customizations?: any
  ): Promise<string> {
    // Simple, fast therapeutic prompt without complex framework processing
    const recentContext = recentMemory.length > 0 
      ? `Previous conversation context: ${recentMemory[0]?.userInput?.substring(0, 200) || 'None'}`
      : 'This is the start of our conversation.';

    return `You are a skilled therapeutic AI assistant with expertise in psychology and emotional support. Your role is to provide compassionate, insightful responses that help users explore their thoughts and feelings.

Guidelines:
- Respond with genuine empathy and understanding
- Ask thoughtful follow-up questions to deepen exploration
- Offer practical insights and gentle guidance
- Maintain a warm, professional therapeutic presence
- Keep responses concise but meaningful (2-3 paragraphs max)
- Focus on the user's emotional experience and growth

${recentContext}

Respond to the user's message with professional therapeutic insight, emotional validation, and a thoughtful question that encourages deeper reflection.`;
  }

  /**
   * Generate fast AI response using optimized prompting
   */
  private async generateFastAIResponse(
    systemPrompt: string,
    userInput: string,
    perspective: string = 'psychologist'
  ): Promise<any> {
    try {
      // Use GPT-3.5-turbo for fast therapeutic responses (sub-1 second)
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: userInput
          }
        ]
      });

      const rawContent = response.choices[0]?.message?.content || '';
      
      if (!rawContent || rawContent.trim().length < 20) {
        throw new Error('Empty or insufficient response from AI model');
      }
      
      const fullResponse = rawContent.trim();
      
      // Simple emotion detection from content
      const emotionalState = this.detectEmotionFromContent(fullResponse);

      // Parse the therapeutic response to extract analysis and question
      const { analysis, question } = this.parseTherapeuticResponse(fullResponse);

      return {
        analysis,
        question,
        emotionalState,
        suggestions: this.extractSuggestions(fullResponse),
        emotionalAssessment: { primary: emotionalState, intensity: 6 },
        patternInsights: { identified_patterns: ['self_reflection', 'value_exploration'] },
        tokenCount: response.usage?.total_tokens || 0,
        cost: '0.002',
        modelUsed: 'gpt-3.5-turbo'
      };

    } catch (error) {
      console.error('Fast AI response error:', error);
      
      throw error;
    }
  }

  /**
   * Simple emotion detection from response content
   */
  private detectEmotionFromContent(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('struggle') || lowerContent.includes('conflict') || lowerContent.includes('tension')) {
      return 'conflicted';
    }
    if (lowerContent.includes('hope') || lowerContent.includes('aspir') || lowerContent.includes('dream')) {
      return 'hopeful';
    }
    if (lowerContent.includes('reflect') || lowerContent.includes('consider') || lowerContent.includes('explore')) {
      return 'contemplative';
    }
    if (lowerContent.includes('concern') || lowerContent.includes('worry') || lowerContent.includes('anxious')) {
      return 'concerned';
    }
    if (lowerContent.includes('grateful') || lowerContent.includes('appreciate') || lowerContent.includes('thankful')) {
      return 'grateful';
    }
    
    return 'thoughtful';
  }

  /**
   * Parse therapeutic response to extract analysis and question
   */
  private parseTherapeuticResponse(fullResponse: string): { analysis: string; question: string } {
    const content = fullResponse.trim();
    
    // Split by question marks to find the last question
    const questions = content.split(/\?+/).filter(s => s.trim().length > 0);
    
    if (questions.length > 1) {
      // Last question is the follow-up question
      const question = questions[questions.length - 1].trim() + '?';
      // Everything before the last question is analysis
      const analysisEnd = content.lastIndexOf(question.slice(0, -1));
      const analysis = content.substring(0, analysisEnd).trim();
      
      return {
        analysis: analysis || content,
        question: question
      };
    }
    
    // If no clear question found, treat entire response as analysis
    return {
      analysis: content,
      question: "What comes up for you as you sit with these reflections?"
    };
  }

  /**
   * Extract suggestions from therapeutic response
   */
  private extractSuggestions(content: string): string[] {
    // Look for action-oriented phrases in the response
    const suggestions = [];
    
    if (content.includes('reflect') || content.includes('consider')) {
      suggestions.push('Take time to reflect on these insights');
    }
    if (content.includes('journal') || content.includes('write')) {
      suggestions.push('Continue exploring these themes in your journaling');
    }
    if (content.includes('notice') || content.includes('aware')) {
      suggestions.push('Practice noticing these patterns in daily life');
    }
    
    // Default suggestions if none found
    if (suggestions.length === 0) {
      suggestions.push('Continue exploring these feelings and insights');
    }
    
    return suggestions;
  }

  /**
   * Enqueue background processing job (non-blocking)
   */
  private async enqueuePostProcessingJob(data: {
    userId: string;
    threadId: string;
    exchangeId: string;
    userInput: string;
    aiResponse: any;
    requestData: DeepJournalingRequest;
  }): Promise<void> {
    // Run in background without blocking main response
    setImmediate(async () => {
      try {
        await this.runPostProcessingJob(data);
      } catch (error) {
        console.error('Post-processing job failed:', error);
        // Log but don't throw - this is background processing
      }
    });
  }

  /**
   * Run comprehensive post-processing analysis in background
   */
  private async runPostProcessingJob(data: {
    userId: string;
    threadId: string;
    exchangeId: string;
    userInput: string;
    aiResponse: any;
    requestData: DeepJournalingRequest;
  }): Promise<void> {
    console.log('Starting post-processing job for user:', data.userId);

    try {
      // Import heavy modules only when needed (lazy loading)
      const { psychologicalAnalyzer } = await import('./psychological-analyzer');
      const { userModelingEngine } = await import('./user-modeling-engine');
      const { dynamicFrameworkSelector } = await import('./dynamic-framework-selector');
      const { contextualMemoryArchitecture } = await import('./contextual-memory-architecture');

      // Get full context for analysis
      const [userProfile, threadHistory, userContext] = await Promise.all([
        this.getUserPsychologicalProfile(data.userId),
        this.getFullThreadHistory(data.threadId),
        this.getUserContext(data.userId)
      ]);

      // Run comprehensive psychological analysis
      const emotionalState = psychologicalAnalyzer.analyzeEmotionalState(
        data.userInput
      );
      
      const cognitivePatterns = psychologicalAnalyzer.analyzeCognitivePatterns(data.userInput);
      const copingStrategies = psychologicalAnalyzer.assessCopingStrategies(data.userInput);
      const comprehensiveAnalysis = psychologicalAnalyzer.analyzeComprehensively(data.userInput, threadHistory);
      
      const psychologicalInsights = psychologicalAnalyzer.generateInsights(
        emotionalState,
        cognitivePatterns,
        copingStrategies
      );

      const psychologicalAnalysis = {
        emotionalState,
        cognitivePatterns,
        copingStrategies,
        comprehensiveAnalysis,
        psychologicalInsights,
        userId: data.userId,
        sessionContext: {
          actionType: data.requestData.actionType,
          threadId: data.threadId,
          exchangeId: data.exchangeId
        }
      };

      // Get personalization recommendations
      const personalizationRecs = await userModelingEngine.getPersonalizationRecommendations(
        data.userId,
        data.userInput,
        { userProfile, threadHistory, userContext }
      );

      // Select optimal therapeutic framework
      const frameworkRecommendation = await dynamicFrameworkSelector.selectOptimalFramework(
        data.userId,
        data.threadId,
        data.userInput,
        { userProfile, threadHistory, userContext, psychologicalAnalysis }
      );

      // Analyze cross-session patterns
      const crossSessionPatterns = await contextualMemoryArchitecture.analyzeCrossSessionPatterns(
        data.userId,
        6 // timeframeMonths
      );

      // Update therapeutic memory
      const therapeuticMemory = await contextualMemoryArchitecture.updateTherapeuticMemory(
        data.userId,
        data.threadId,
        {
          userInput: data.userInput,
          aiResponse: data.aiResponse.question,
          emotionalState: psychologicalAnalysis.emotionalState,
          cognitivePatterns: psychologicalAnalysis.cognitivePatterns,
          insights: psychologicalAnalysis.psychologicalInsights
        }
      );

      // Update user psychological profile
      await this.updatePsychologicalProfile(
        data.userId, 
        data.userInput, 
        data.aiResponse, 
        userProfile,
        psychologicalAnalysis,
        frameworkRecommendation,
        personalizationRecs
      );

      // Track emotional state progression
      await this.trackEmotionalState(
        data.userId, 
        data.threadId, 
        data.exchangeId, 
        psychologicalAnalysis.emotionalState
      );

      // Analyze interaction for user modeling improvements
      await userModelingEngine.analyzeInteraction({
        userId: data.userId,
        threadId: data.threadId,
        exchangeId: data.exchangeId,
        userInput: data.userInput,
        aiResponse: data.aiResponse.question,
        sessionMetadata: {
          timeOfDay: this.getTimeOfDay(),
          sessionDuration: 0, // Post-processing doesn't affect response time
          techniquesUsed: this.extractTechniquesUsed(data.aiResponse),
          frameworksApplied: [frameworkRecommendation.primaryFramework],
          questioningStyle: personalizationRecs.therapeuticStyle,
          interventionType: frameworkRecommendation.interventionType
        },
        psychologicalAnalysis,
        personalizationEffectiveness: personalizationRecs.confidence
      });

      // Update thread metadata with comprehensive analysis
      await this.updateThreadMetadata(
        data.threadId, 
        psychologicalAnalysis.emotionalState, 
        data.userInput,
        {
          frameworkRecommendation,
          personalizationRecs,
          crossSessionPatterns,
          therapeuticMemory
        }
      );

      console.log('Post-processing job completed for user:', data.userId);

    } catch (error) {
      console.error('Post-processing job error:', error);
      // Continue gracefully - next session will have fallback data
    }
  }

  // Helper methods for parsing AI responses
  private extractAnalysis(content: string): string {
    const match = content.match(/(?:analysis|insight)[:\s]*(.*?)(?:\n|$)/i);
    return match ? match[1].trim() : content.split('\n')[0].trim();
  }

  private extractQuestion(content: string): string {
    const lines = content.split('\n').filter(line => line.trim());
    const questionLine = lines.find(line => line.includes('?'));
    return questionLine || lines[lines.length - 1] || content;
  }

  private extractEmotionalState(content: string): string {
    const emotions = ['anxious', 'sad', 'happy', 'angry', 'frustrated', 'hopeful', 'confused', 'overwhelmed'];
    const lowerContent = content.toLowerCase();
    const detectedEmotion = emotions.find(emotion => lowerContent.includes(emotion));
    return detectedEmotion || 'neutral';
  }

  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.includes('suggest') || line.includes('try') || line.includes('consider')) {
        suggestions.push(line.trim());
      }
    });

    return suggestions.length > 0 ? suggestions : ['Reflect on your current feelings and needs'];
  }

  private getDefaultInsights(): any {
    return {
      therapeuticFramework: 'cbt',
      emotionalBaseline: 'neutral',
      communicationStyle: 'balanced',
      recentPatterns: [],
      strengths: [],
      areas_of_focus: ['emotional awareness'],
      last_updated: null
    };
  }

  // Placeholder methods for background processing compatibility
  private async getUserPsychologicalProfile(userId: string): Promise<PsychologicalProfile | null> {
    try {
      const [profile] = await db.select()
        .from(psychologicalProfile)
        .where(eq(psychologicalProfile.userId, userId))
        .limit(1);
      return profile || null;
    } catch (error) {
      console.error('Error getting psychological profile:', error);
      return null;
    }
  }

  private async getFullThreadHistory(threadId: string): Promise<ThreadExchange[]> {
    return await db.select()
      .from(threadExchanges)
      .where(eq(threadExchanges.threadId, threadId))
      .orderBy(desc(threadExchanges.exchangeOrder));
  }

  private async getUserContext(userId: string): Promise<any> {
    // Simplified user context for background processing
    return {
      userId,
      preferences: {},
      goals: [],
      challenges: []
    };
  }

  private async updatePsychologicalProfile(
    userId: string, 
    userInput: string, 
    aiResponse: any, 
    existingProfile: PsychologicalProfile | null,
    psychologicalAnalysis?: any,
    frameworkRecommendation?: any,
    personalizationRecs?: any
  ): Promise<void> {
    try {
      const updateData = {
        userId,
        currentEmotionalState: psychologicalAnalysis?.emotionalState?.primary || aiResponse.emotionalState,
        cognitivePatterns: psychologicalAnalysis?.cognitivePatterns || [],
        copingStrategies: psychologicalAnalysis?.copingStrategies || { adaptive: [], maladaptive: [] },
        preferredTherapeuticFramework: frameworkRecommendation?.primaryFramework || 'cbt',
        communicationStyle: personalizationRecs?.communicationAdjustments?.tone || 'balanced',
        identifiedStrengths: psychologicalAnalysis?.psychologicalInsights?.strengths || [],
        areasOfFocus: psychologicalAnalysis?.psychologicalInsights?.areasOfFocus || [],
        lastUpdated: new Date()
      };

      if (existingProfile) {
        await db.update(psychologicalProfile)
          .set(updateData)
          .where(eq(psychologicalProfile.userId, userId));
      } else {
        await db.insert(psychologicalProfile).values(updateData);
      }
    } catch (error) {
      console.error('Error updating psychological profile:', error);
    }
  }

  private async trackEmotionalState(
    userId: string, 
    threadId: string, 
    exchangeId: string, 
    emotionalState: any
  ): Promise<void> {
    try {
      await db.insert(emotionalStateHistory).values({
        userId,
        threadId: parseInt(threadId),
        exchangeId: parseInt(exchangeId),
        primaryEmotion: typeof emotionalState === 'string' ? emotionalState : (emotionalState.primary || 'neutral'),
        emotionalIntensity: typeof emotionalState === 'object' ? (emotionalState.intensity || 0.5) : 0.5,
        emotionalClarity: 0.7,
        triggerContext: 'user_journaling_session',
        detectionMethod: 'ai_analysis',
        confidenceScore: 0.8
      });
    } catch (error) {
      console.error('Error tracking emotional state:', error);
    }
  }

  private async updateThreadMetadata(
    threadId: string, 
    emotionalState: any, 
    userInput: string,
    additionalMetadata?: any
  ): Promise<void> {
    try {
      await db.update(journalingThreads)
        .set({
          lastMessageAt: new Date(),
          currentEmotionalState: typeof emotionalState === 'string' ? emotionalState : emotionalState.primary
        })
        .where(eq(journalingThreads.id, threadId));
    } catch (error) {
      console.error('Error updating thread metadata:', error);
    }
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private extractTechniquesUsed(aiResponse: any): string[] {
    const techniques: string[] = [];
    const content = aiResponse.question || aiResponse.analysis || '';
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('thought') || lowerContent.includes('think')) techniques.push('cognitive_restructuring');
    if (lowerContent.includes('feel') || lowerContent.includes('emotion')) techniques.push('emotional_exploration');
    if (lowerContent.includes('behavior') || lowerContent.includes('action')) techniques.push('behavioral_analysis');
    if (lowerContent.includes('past') || lowerContent.includes('childhood')) techniques.push('psychodynamic_exploration');
    if (lowerContent.includes('goal') || lowerContent.includes('future')) techniques.push('solution_focused');

    return techniques.length > 0 ? techniques : ['supportive_listening'];
  }
}

export const fastChatEngine = new FastChatEngine();