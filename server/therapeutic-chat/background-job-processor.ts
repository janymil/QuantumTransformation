import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { db } from "../db";
import { 
  journalingThreads, 
  threadExchanges, 
  psychologicalProfile, 
  emotionalStateHistory
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Background Job Processor for Therapeutic Chat
 * Handles heavy psychological analysis, user modeling, and framework selection
 * Runs asynchronously to avoid blocking fast responses
 */

interface PostProcessingJobData {
  userId: string;
  threadId: string;
  exchangeId: string;
  userInput: string;
  aiResponse: any;
  requestData: any;
}

export class BackgroundJobProcessor {
  private jobQueue: PostProcessingJobData[] = [];
  private processing = false;
  private workers: Worker[] = [];
  private maxWorkers = 2; // Limit concurrent background processing

  constructor() {
    // Start job processor if in main thread
    if (isMainThread) {
      this.startJobProcessor();
    }
  }

  /**
   * Add job to processing queue
   */
  async enqueueJob(jobData: PostProcessingJobData): Promise<void> {
    this.jobQueue.push(jobData);
    
    // Process immediately if not busy
    if (!this.processing && this.workers.length < this.maxWorkers) {
      this.processNextJob();
    }
  }

  /**
   * Start processing jobs from queue
   */
  private async startJobProcessor(): Promise<void> {
    // Process jobs every 100ms to maintain responsiveness
    setInterval(() => {
      if (this.jobQueue.length > 0 && this.workers.length < this.maxWorkers) {
        this.processNextJob();
      }
    }, 100);
  }

  /**
   * Process next job in queue using worker thread
   */
  private async processNextJob(): Promise<void> {
    if (this.jobQueue.length === 0 || this.workers.length >= this.maxWorkers) {
      return;
    }

    const jobData = this.jobQueue.shift();
    if (!jobData) return;

    try {
      // Create worker thread for background processing
      const worker = new Worker(__filename, {
        workerData: jobData
      });

      this.workers.push(worker);

      worker.on('message', (result) => {
        console.log('Background job completed:', result.status);
      });

      worker.on('error', (error) => {
        console.error('Background job error:', error);
      });

      worker.on('exit', (code) => {
        // Remove worker from active list
        this.workers = this.workers.filter(w => w !== worker);
        
        if (code !== 0) {
          console.error('Background job worker exited with code:', code);
        }
      });

    } catch (error) {
      console.error('Failed to start background job:', error);
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { pending: number; processing: number } {
    return {
      pending: this.jobQueue.length,
      processing: this.workers.length
    };
  }
}

/**
 * Worker thread execution for background processing
 */
if (!isMainThread && parentPort && workerData) {
  (async () => {
    try {
      const jobData: PostProcessingJobData = workerData;
      const result = await processJobInWorker(jobData);
      parentPort!.postMessage({ status: 'completed', result });
    } catch (error) {
      parentPort!.postMessage({ status: 'error', error: error.message });
    }
  })();
}

/**
 * Execute comprehensive analysis in worker thread
 */
async function processJobInWorker(jobData: PostProcessingJobData): Promise<any> {
  console.log(`Starting background analysis for user: ${jobData.userId}`);

  try {
    // Import heavy modules in worker context
    const { psychologicalAnalyzer } = await import('./psychological-analyzer');
    const { userModelingEngine } = await import('./user-modeling-engine');
    const { dynamicFrameworkSelector } = await import('./dynamic-framework-selector');
    const { contextualMemoryArchitecture } = await import('./contextual-memory-architecture');

    // Get comprehensive context
    const [userProfile, threadHistory, userContext] = await Promise.all([
      getUserPsychologicalProfile(jobData.userId),
      getFullThreadHistory(jobData.threadId),
      getUserContext(jobData.userId)
    ]);

    // === COMPREHENSIVE PSYCHOLOGICAL ANALYSIS ===
    console.log('Running psychological analysis...');
    
    const emotionalState = psychologicalAnalyzer.analyzeEmotionalState(
      jobData.userInput, 
      threadHistory.map(h => ({ primary: h.currentEmotionalState || 'neutral' })) as any[]
    );
    
    const cognitivePatterns = psychologicalAnalyzer.analyzeCognitivePatterns(jobData.userInput);
    const copingStrategies = psychologicalAnalyzer.assessCopingStrategies(jobData.userInput);
    const comprehensiveAnalysis = psychologicalAnalyzer.analyzeComprehensively(jobData.userInput, threadHistory);
    
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
      userId: jobData.userId,
      sessionContext: {
        actionType: jobData.requestData.actionType,
        threadId: jobData.threadId,
        exchangeId: jobData.exchangeId
      }
    };

    // === USER MODELING & PERSONALIZATION ===
    console.log('Running personalization analysis...');
    
    const personalizationRecs = await userModelingEngine.getPersonalizationRecommendations(
      jobData.userId,
      jobData.userInput,
      { userProfile, threadHistory, userContext }
    );

    // === DYNAMIC FRAMEWORK SELECTION ===
    console.log('Selecting optimal therapeutic framework...');
    
    const frameworkRecommendation = await dynamicFrameworkSelector.selectOptimalFramework(
      jobData.userId,
      jobData.threadId,
      jobData.userInput,
      { userProfile, threadHistory, userContext, psychologicalAnalysis }
    );

    // === CONTEXTUAL MEMORY ANALYSIS ===
    console.log('Analyzing cross-session patterns...');
    
    const crossSessionPatterns = await contextualMemoryArchitecture.analyzeCrossSessionPatterns(
      jobData.userId,
      jobData.userInput,
      threadHistory
    );

    const therapeuticMemory = await contextualMemoryArchitecture.updateTherapeuticMemory(
      jobData.userId,
      jobData.threadId,
      {
        userInput: jobData.userInput,
        aiResponse: jobData.aiResponse.question,
        emotionalState: psychologicalAnalysis.emotionalState,
        cognitivePatterns: psychologicalAnalysis.cognitivePatterns,
        insights: psychologicalAnalysis.psychologicalInsights
      }
    );

    // === DATABASE UPDATES ===
    console.log('Updating user profiles and memory...');
    
    // Update psychological profile with comprehensive analysis
    await updatePsychologicalProfile(
      jobData.userId, 
      jobData.userInput, 
      jobData.aiResponse, 
      userProfile,
      psychologicalAnalysis,
      frameworkRecommendation,
      personalizationRecs
    );

    // Track emotional progression
    await trackEmotionalStateProgression(
      jobData.userId, 
      jobData.threadId, 
      jobData.exchangeId, 
      psychologicalAnalysis.emotionalState,
      emotionalState.intensity,
      emotionalState.valence
    );

    // Enhanced interaction analysis
    await userModelingEngine.analyzeInteraction({
      userId: jobData.userId,
      threadId: jobData.threadId,
      exchangeId: jobData.exchangeId,
      userInput: jobData.userInput,
      aiResponse: jobData.aiResponse.question,
      sessionMetadata: {
        timeOfDay: getTimeOfDay(),
        sessionDuration: 0, // Background processing doesn't affect response time
        techniquesUsed: extractTechniquesUsed(jobData.aiResponse),
        frameworksApplied: [frameworkRecommendation.primaryFramework],
        questioningStyle: personalizationRecs.therapeuticStyle,
        interventionType: frameworkRecommendation.interventionType,
        responseQuality: assessResponseQuality(jobData.aiResponse),
        userEngagement: assessUserEngagement(jobData.userInput, threadHistory)
      },
      psychologicalAnalysis,
      personalizationEffectiveness: personalizationRecs.confidence,
      frameworkEffectiveness: frameworkRecommendation.confidence
    });

    // Update thread with comprehensive metadata
    await updateThreadWithAnalysis(
      jobData.threadId, 
      psychologicalAnalysis.emotionalState, 
      jobData.userInput,
      {
        frameworkRecommendation,
        personalizationRecs,
        crossSessionPatterns,
        therapeuticMemory,
        comprehensiveAnalysis
      }
    );

    // Update exchange with enhanced analysis
    await updateExchangeAnalysis(
      jobData.exchangeId,
      {
        psychologicalAnalysis,
        frameworkRecommendation,
        personalizationRecs,
        crossSessionPatterns
      }
    );

    console.log(`Background analysis completed for user: ${jobData.userId}`);

    return {
      userId: jobData.userId,
      analysisCompleted: true,
      emotionalState: psychologicalAnalysis.emotionalState,
      frameworkRecommendation: frameworkRecommendation.primaryFramework,
      personalizationLevel: personalizationRecs.personalizationLevel,
      crossSessionInsights: crossSessionPatterns.length,
      processingTime: Date.now()
    };

  } catch (error) {
    console.error('Background job processing error:', error);
    throw error;
  }
}

// === HELPER FUNCTIONS FOR WORKER CONTEXT ===

async function getUserPsychologicalProfile(userId: string): Promise<any> {
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

async function getFullThreadHistory(threadId: string): Promise<any[]> {
  return await db.select()
    .from(threadExchanges)
    .where(eq(threadExchanges.threadId, threadId))
    .orderBy(desc(threadExchanges.exchangeOrder));
}

async function getUserContext(userId: string): Promise<any> {
  return {
    userId,
    preferences: {},
    goals: [],
    challenges: []
  };
}

async function updatePsychologicalProfile(
  userId: string, 
  userInput: string, 
  aiResponse: any, 
  existingProfile: any,
  psychologicalAnalysis: any,
  frameworkRecommendation: any,
  personalizationRecs: any
): Promise<void> {
  try {
    const updateData = {
      userId,
      currentEmotionalState: psychologicalAnalysis.emotionalState.primary,
      cognitivePatterns: psychologicalAnalysis.cognitivePatterns,
      copingStrategies: psychologicalAnalysis.copingStrategies,
      preferredTherapeuticFramework: frameworkRecommendation.primaryFramework,
      communicationStyle: personalizationRecs.communicationAdjustments.tone,
      identifiedStrengths: psychologicalAnalysis.psychologicalInsights.strengths || [],
      areasOfFocus: psychologicalAnalysis.psychologicalInsights.areasOfFocus || [],
      therapeuticGoals: psychologicalAnalysis.psychologicalInsights.recommendedGoals || [],
      riskFactors: psychologicalAnalysis.psychologicalInsights.riskFactors || [],
      progressIndicators: psychologicalAnalysis.psychologicalInsights.progressIndicators || [],
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

async function trackEmotionalStateProgression(
  userId: string, 
  threadId: string, 
  exchangeId: string, 
  emotionalState: any,
  intensity: number,
  valence: string
): Promise<void> {
  try {
    await db.insert(emotionalStateHistory).values({
      userId,
      threadId,
      exchangeId,
      emotionalState: emotionalState.primary,
      intensity: intensity || 5,
      valence: valence || 'neutral',
      triggers: emotionalState.triggers || [],
      contextualFactors: emotionalState.contextualFactors || [],
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error tracking emotional state:', error);
  }
}

async function updateThreadWithAnalysis(
  threadId: string, 
  emotionalState: any, 
  userInput: string,
  analysisData: any
): Promise<void> {
  try {
    await db.update(journalingThreads)
      .set({
        lastMessageAt: new Date(),
        currentEmotionalState: emotionalState.primary,
        preferredMode: analysisData.personalizationRecs?.communicationAdjustments?.tone || 'conversational',
        preferredTone: analysisData.personalizationRecs?.therapeuticStyle || 'supportive',
        preferredPerspective: analysisData.frameworkRecommendation?.primaryFramework || 'psychologist'
      })
      .where(eq(journalingThreads.id, threadId));
  } catch (error) {
    console.error('Error updating thread metadata:', error);
  }
}

async function updateExchangeAnalysis(
  exchangeId: string,
  analysisData: any
): Promise<void> {
  try {
    const enhancedAnalysis = {
      professionalAnalysis: analysisData.psychologicalAnalysis?.comprehensiveAnalysis?.summary || 'Comprehensive analysis completed',
      emotionalInsights: analysisData.psychologicalAnalysis?.psychologicalInsights?.emotionalInsights || [],
      cognitivePatterns: analysisData.psychologicalAnalysis?.cognitivePatterns || [],
      therapeuticRecommendations: analysisData.frameworkRecommendation?.recommendations || [],
      personalizationInsights: analysisData.personalizationRecs?.customInstructions || [],
      crossSessionPatterns: analysisData.crossSessionPatterns || []
    };

    const enhancedPatternInsights = {
      identified_patterns: analysisData.psychologicalAnalysis?.cognitivePatterns?.map(p => p.content) || [],
      cross_session_patterns: analysisData.crossSessionPatterns?.map(p => p.description) || [],
      therapeutic_progress: analysisData.frameworkRecommendation?.progressIndicators || [],
      personalization_effectiveness: analysisData.personalizationRecs?.confidence || 0.8
    };

    const enhancedEmotionalAssessment = {
      primary: analysisData.psychologicalAnalysis?.emotionalState?.primary || 'neutral',
      intensity: analysisData.psychologicalAnalysis?.emotionalState?.intensity || 5,
      valence: analysisData.psychologicalAnalysis?.emotionalState?.valence || 'neutral',
      triggers: analysisData.psychologicalAnalysis?.emotionalState?.triggers || [],
      coping_strategies: analysisData.psychologicalAnalysis?.copingStrategies || {}
    };

    await db.update(threadExchanges)
      .set({
        aiAnalysis: enhancedAnalysis,
        aiPatternInsights: enhancedPatternInsights,
        aiEmotionalAssessment: enhancedEmotionalAssessment
      })
      .where(eq(threadExchanges.id, exchangeId));

  } catch (error) {
    console.error('Error updating exchange analysis:', error);
  }
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function extractTechniquesUsed(aiResponse: any): string[] {
  const techniques: string[] = [];
  const content = aiResponse.question || aiResponse.analysis || '';
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('thought') || lowerContent.includes('think')) techniques.push('cognitive_restructuring');
  if (lowerContent.includes('feel') || lowerContent.includes('emotion')) techniques.push('emotional_exploration');
  if (lowerContent.includes('behavior') || lowerContent.includes('action')) techniques.push('behavioral_analysis');
  if (lowerContent.includes('past') || lowerContent.includes('childhood')) techniques.push('psychodynamic_exploration');
  if (lowerContent.includes('goal') || lowerContent.includes('future')) techniques.push('solution_focused');
  if (lowerContent.includes('relationship') || lowerContent.includes('connect')) techniques.push('interpersonal_therapy');

  return techniques.length > 0 ? techniques : ['supportive_listening'];
}

function assessResponseQuality(aiResponse: any): number {
  let quality = 5; // baseline
  
  const content = aiResponse.question || aiResponse.analysis || '';
  
  // Check for therapeutic depth
  if (content.includes('feel') || content.includes('emotion')) quality += 1;
  if (content.includes('pattern') || content.includes('notice')) quality += 1;
  if (content.includes('strength') || content.includes('resource')) quality += 1;
  if (content.includes('?')) quality += 1; // Has questioning
  if (content.length > 100) quality += 1; // Adequate length
  
  return Math.min(quality, 10);
}

function assessUserEngagement(userInput: string, threadHistory: any[]): number {
  let engagement = 5; // baseline
  
  // Length indicates engagement
  if (userInput.length > 100) engagement += 1;
  if (userInput.length > 300) engagement += 1;
  
  // Emotional words indicate engagement
  const emotionalWords = ['feel', 'think', 'worry', 'hope', 'fear', 'love', 'hate', 'anxious', 'happy', 'sad'];
  const matchedWords = emotionalWords.filter(word => userInput.toLowerCase().includes(word));
  engagement += Math.min(matchedWords.length, 2);
  
  // Session continuity
  if (threadHistory.length > 1) engagement += 1;
  if (threadHistory.length > 5) engagement += 1;
  
  return Math.min(engagement, 10);
}

export const backgroundJobProcessor = new BackgroundJobProcessor();