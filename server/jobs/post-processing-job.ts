/**
 * PostProcessingJob - Background analysis system for therapeutic journaling
 * Runs asynchronously after user receives their response
 */

import { db } from '../db';
import { psychologicalProfile } from '../../shared/schema';
import { eq } from 'drizzle-orm';

interface PostProcessingJobData {
  userId: string;
  threadId: string;
  entryText: string;
}

interface AnalysisResults {
  preferredFramework: string;
  emotionalState: string;
  toneShift: string;
  motivationThemes: string[];
}

export class PostProcessingJob {
  private jobQueue: PostProcessingJobData[] = [];
  private isProcessing = false;

  /**
   * Enqueue a new post-processing job (non-blocking)
   */
  async enqueue(data: PostProcessingJobData): Promise<void> {
    this.jobQueue.push(data);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Process the job queue sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.jobQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.jobQueue.length > 0) {
      const job = this.jobQueue.shift();
      if (job) {
        try {
          await this.processJob(job);
        } catch (error) {
          console.error('PostProcessingJob error:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Process a single job with sequential analysis modules
   */
  private async processJob(data: PostProcessingJobData): Promise<void> {
    const startTime = Date.now();
    console.log(`Starting post-processing for user ${data.userId}`);

    try {
      // Step 1: Psychological Analysis
      const psychAnalysis = await this.runPsychologicalAnalyzer(data.entryText);
      
      // Step 2: User Model Update
      const userModelUpdate = await this.runUserModelEngine(data.userId, data.entryText);
      
      // Step 3: Dynamic Framework Selection
      const frameworkSelection = await this.runDynamicFrameworkSelector(data.entryText);

      // Step 4: Save combined results to database
      await this.saveResults(data.userId, {
        preferredFramework: frameworkSelection.recommendedFramework,
        emotionalState: psychAnalysis.dominantEmotion,
        toneShift: psychAnalysis.toneChange,
        motivationThemes: userModelUpdate.motivationThemes
      });

      const processingTime = Date.now() - startTime;
      console.log(`Post-processing completed for user ${data.userId} in ${processingTime}ms`);

    } catch (error) {
      console.error(`Post-processing failed for user ${data.userId}:`, error);
    }
  }

  /**
   * Step 1: Run psychological analysis on entry text
   */
  private async runPsychologicalAnalyzer(entryText: string): Promise<any> {
    try {
      const { PsychologicalAnalyzer } = await import('../therapeutic-chat/psychological-analyzer');
      return await PsychologicalAnalyzer.analyze(entryText);
    } catch (error) {
      console.error('PsychologicalAnalyzer error:', error);
      return {
        dominantEmotion: 'neutral',
        toneChange: 'stable',
        cognitivePatterns: []
      };
    }
  }

  /**
   * Step 2: Update user model with new entry
   */
  private async runUserModelEngine(userId: string, entryText: string): Promise<any> {
    try {
      const { UserModelEngine } = await import('../therapeutic-chat/user-modeling-engine');
      return await UserModelEngine.update(userId, entryText);
    } catch (error) {
      console.error('UserModelEngine error:', error);
      return {
        motivationThemes: ['self-reflection'],
        personalityUpdates: {}
      };
    }
  }

  /**
   * Step 3: Select optimal therapeutic framework
   */
  private async runDynamicFrameworkSelector(entryText: string): Promise<any> {
    try {
      const { DynamicFrameworkSelector } = await import('../therapeutic-chat/dynamic-framework-selector');
      return await DynamicFrameworkSelector.select(entryText);
    } catch (error) {
      console.error('DynamicFrameworkSelector error:', error);
      return {
        recommendedFramework: 'person-centered',
        confidence: 0.5
      };
    }
  }

  /**
   * Step 4: Save analysis results to psychologicalProfile table
   */
  private async saveResults(userId: string, results: AnalysisResults): Promise<void> {
    try {
      // Check if user has existing profile
      const [existingProfile] = await db.select()
        .from(psychologicalProfile)
        .where(eq(psychologicalProfile.userId, userId))
        .limit(1);

      const profileData = {
        userId,
        communicationStyle: results.preferredFramework,
        currentDominantEmotion: results.emotionalState,
        personalityTraits: { 
          toneShift: results.toneShift,
          motivationThemes: results.motivationThemes 
        },
        updatedAt: new Date()
      };

      if (existingProfile) {
        // Update existing profile
        await db.update(psychologicalProfile)
          .set(profileData)
          .where(eq(psychologicalProfile.userId, userId));
      } else {
        // Create new profile
        await db.insert(psychologicalProfile)
          .values(profileData);
      }

      console.log(`Saved analysis results for user ${userId}`);
      
    } catch (error) {
      console.error('Error saving post-processing results:', error);
    }
  }

  /**
   * Get current queue status
   */
  getStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.jobQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// Export singleton instance
export const postProcessingJob = new PostProcessingJob();