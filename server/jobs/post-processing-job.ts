
import { db } from "../db";
import { 
  psychologicalProfile, 
  emotionalStateHistory, 
  userTherapeuticProfile,
  therapeuticInteractionAnalysis 
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { psychologicalAnalyzer } from "../therapeutic-chat/psychological-analyzer";
import { userModelingEngine } from "../therapeutic-chat/user-modeling-engine";
import { dynamicFrameworkSelector } from "../therapeutic-chat/dynamic-framework-selector";

export interface PostProcessingJobData {
  userId: string;
  threadId: number;
  entryText: string;
  exchangeId?: number;
  timestamp: Date;
}

export interface PostProcessingResults {
  preferredFramework: string;
  detectedEmotionalState: string;
  toneShift: number; // -1 to 1 scale
  motivationThemes: string[];
  cognitivePatterns: any[];
  copingStrategies: any;
  insights: any;
}

class PostProcessingJobQueue {
  private queue: PostProcessingJobData[] = [];
  private processing = false;
  private readonly maxRetries = 3;
  private readonly processInterval = 2000; // Process every 2 seconds

  constructor() {
    // Start the background processor
    this.startProcessor();
  }

  /**
   * Add a new job to the queue
   */
  async enqueue(jobData: PostProcessingJobData): Promise<void> {
    this.queue.push({
      ...jobData,
      timestamp: new Date()
    });
    
    console.log(`Queued post-processing job for user ${jobData.userId}, thread ${jobData.threadId}`);
  }

  /**
   * Start the background processor
   */
  private startProcessor(): void {
    setInterval(async () => {
      if (!this.processing && this.queue.length > 0) {
        await this.processNext();
      }
    }, this.processInterval);
  }

  /**
   * Process the next job in the queue
   */
  private async processNext(): Promise<void> {
    if (this.queue.length === 0) return;

    this.processing = true;
    const job = this.queue.shift()!;

    try {
      console.log(`Processing post-processing job for user ${job.userId}`);
      await this.processJob(job);
      console.log(`Successfully processed job for user ${job.userId}`);
    } catch (error) {
      console.error(`Error processing job for user ${job.userId}:`, error);
      // Could implement retry logic here if needed
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: PostProcessingJobData): Promise<void> {
    const startTime = Date.now();

    try {
      // Step 1: Psychological Analysis
      console.log(`Step 1: Running psychological analysis for user ${job.userId}`);
      const psychAnalysis = psychologicalAnalyzer.analyzeComprehensively(job.entryText);

      // Step 2: User Model Update
      console.log(`Step 2: Updating user model for user ${job.userId}`);
      await userModelingEngine.analyzeInteraction({
        userId: job.userId,
        threadId: job.threadId,
        exchangeId: job.exchangeId,
        userInput: job.entryText,
        aiResponse: "", // We don't have AI response in post-processing
        sessionMetadata: {
          timeOfDay: this.getTimeOfDay(),
          userMoodAtStart: this.inferMoodFromText(job.entryText)
        }
      });

      // Step 3: Framework Selection Analysis
      console.log(`Step 3: Analyzing framework preferences for user ${job.userId}`);
      let frameworkRecommendation;
      try {
        frameworkRecommendation = await dynamicFrameworkSelector.selectOptimalFramework(
          job.userId,
          job.threadId,
          job.entryText,
          {}
        );
      } catch (error) {
        console.warn('Framework selector error, using fallback:', error);
        frameworkRecommendation = {
          primaryFramework: 'cognitive_behavioral',
          confidence: 0.5,
          rationale: 'Fallback framework due to analysis error'
        };
      }

      // Step 4: Calculate tone shift and motivation themes
      const toneShift = this.calculateToneShift(job.entryText);
      const motivationThemes = this.extractMotivationThemes(job.entryText);

      // Step 5: Save results to database
      const results: PostProcessingResults = {
        preferredFramework: frameworkRecommendation.primaryFramework,
        detectedEmotionalState: psychAnalysis.emotionalState.primary,
        toneShift,
        motivationThemes,
        cognitivePatterns: psychAnalysis.cognitivePatterns,
        copingStrategies: psychAnalysis.copingStrategies,
        insights: psychAnalysis.insights
      };

      await this.saveResults(job.userId, job.threadId, results);

      const processingTime = Date.now() - startTime;
      console.log(`Post-processing completed for user ${job.userId} in ${processingTime}ms`);

    } catch (error) {
      console.error(`Critical error in post-processing job for user ${job.userId}:`, error);
      throw error;
    }
  }

  /**
   * Save analysis results to database
   */
  private async saveResults(
    userId: string, 
    threadId: number, 
    results: PostProcessingResults
  ): Promise<void> {
    try {
      // Update or create psychological profile
      const existingProfile = await db.select()
        .from(psychologicalProfile)
        .where(eq(psychologicalProfile.userId, userId))
        .limit(1);

      if (existingProfile.length > 0) {
        // Update existing profile
        await db.update(psychologicalProfile)
          .set({
            currentDominantEmotion: results.detectedEmotionalState,
            emotionalPatterns: {
              ...existingProfile[0].emotionalPatterns,
              recentState: results.detectedEmotionalState,
              toneShift: results.toneShift
            },
            mostEffectiveQuestioningStyles: [results.preferredFramework],
            progressMarkers: {
              ...existingProfile[0].progressMarkers,
              lastAnalysis: new Date().toISOString(),
              motivationThemes: results.motivationThemes
            },
            lastFullAnalysisAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(psychologicalProfile.userId, userId));
      } else {
        // Create new profile
        await db.insert(psychologicalProfile).values({
          userId,
          currentDominantEmotion: results.detectedEmotionalState,
          emotionalPatterns: {
            recentState: results.detectedEmotionalState,
            toneShift: results.toneShift
          },
          mostEffectiveQuestioningStyles: [results.preferredFramework],
          progressMarkers: {
            lastAnalysis: new Date().toISOString(),
            motivationThemes: results.motivationThemes
          },
          lastFullAnalysisAt: new Date(),
          analysisConfidenceLevel: 0.8,
          totalDataPoints: 1
        });
      }

      // Save emotional state history
      await db.insert(emotionalStateHistory).values({
        userId,
        threadId,
        primaryEmotion: results.detectedEmotionalState,
        emotionalIntensity: results.insights.keyInsights.length > 0 ? 0.7 : 0.5,
        emotionalClarity: 0.8,
        triggerContext: results.motivationThemes.join(', '),
        associatedTopics: results.motivationThemes,
        detectionMethod: 'ai_analysis',
        confidenceScore: 0.8
      });

      // Update user therapeutic profile if exists
      const therapeuticProfile = await db.select()
        .from(userTherapeuticProfile)
        .where(eq(userTherapeuticProfile.userId, userId))
        .limit(1);

      if (therapeuticProfile.length > 0) {
        await db.update(userTherapeuticProfile)
          .set({
            preferredQuestioningDepth: results.copingStrategies.adaptive.length > 2 ? 7 : 5,
            lastProfileUpdateAt: new Date(),
            totalInteractionCount: (therapeuticProfile[0].totalInteractionCount || 0) + 1,
            updatedAt: new Date()
          })
          .where(eq(userTherapeuticProfile.userId, userId));
      }

      console.log(`Successfully saved post-processing results for user ${userId}`);

    } catch (error) {
      console.error(`Error saving post-processing results for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate tone shift from text analysis
   */
  private calculateToneShift(text: string): number {
    const positiveWords = ['better', 'good', 'great', 'happy', 'hopeful', 'positive', 'amazing', 'wonderful'];
    const negativeWords = ['worse', 'bad', 'terrible', 'sad', 'hopeless', 'negative', 'awful', 'horrible'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const totalEmotionalWords = positiveCount + negativeCount;
    if (totalEmotionalWords === 0) return 0;

    return (positiveCount - negativeCount) / totalEmotionalWords;
  }

  /**
   * Extract motivation themes from text
   */
  private extractMotivationThemes(text: string): string[] {
    const themes = [];
    const lowerText = text.toLowerCase();

    const themeKeywords = {
      'personal_growth': ['grow', 'improve', 'better', 'develop', 'learn', 'progress'],
      'relationships': ['relationship', 'family', 'friend', 'love', 'partner', 'connection'],
      'career': ['work', 'job', 'career', 'professional', 'business', 'success'],
      'health': ['health', 'fitness', 'exercise', 'wellness', 'body', 'energy'],
      'finances': ['money', 'financial', 'income', 'wealth', 'prosperity', 'abundance'],
      'spirituality': ['spiritual', 'purpose', 'meaning', 'soul', 'meditation', 'faith'],
      'creativity': ['creative', 'art', 'express', 'imagination', 'inspiration', 'passion']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes.length > 0 ? themes : ['general_wellbeing'];
  }

  /**
   * Get time of day string
   */
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Infer mood from text content
   */
  private inferMoodFromText(text: string): number {
    const positiveWords = ['good', 'great', 'happy', 'excited', 'grateful', 'positive'];
    const negativeWords = ['bad', 'sad', 'angry', 'frustrated', 'worried', 'anxious'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 5; // neutral baseline

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Get queue status
   */
  getStatus(): { queueLength: number; processing: boolean } {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    };
  }
}

// Export singleton instance
export const postProcessingQueue = new PostProcessingJobQueue();

/**
 * Convenience function to enqueue a post-processing job
 */
export async function enqueuePostProcessingJob(
  userId: string,
  threadId: number,
  entryText: string,
  exchangeId?: number
): Promise<void> {
  await postProcessingQueue.enqueue({
    userId,
    threadId,
    entryText,
    exchangeId,
    timestamp: new Date()
  });
}
