/**
 * PostProcessingJob - Background Analysis System
 * Analyzes journal entries asynchronously to build comprehensive psychological profiles
 */

import { db } from '../db';
import { 
  userTherapeuticProfile, 
  journalingThreads, 
  threadExchanges,
  psychologicalProfile 
} from '../../shared/schema';
import { eq, and, desc, isNotNull } from 'drizzle-orm';
import { openai } from '../openai';

// Job Queue Interface (in-memory implementation)
interface JobData {
  userId: string;
  threadId: string;
  entryText: string;
  timestamp: Date;
}

interface QueuedJob {
  id: string;
  data: JobData;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

/**
 * Psychological Analyzer - Advanced text analysis for emotional and cognitive patterns
 */
class PsychologicalAnalyzer {
  static async analyze(entryText: string): Promise<{
    emotionalState: string;
    cognitivePatterns: string[];
    stressLevel: number;
    motivationThemes: string[];
    therapeuticNeeds: string[];
  }> {
    try {
      const prompt = `Analyze this journal entry for psychological patterns:
"${entryText}"

Provide structured analysis in JSON format:
{
  "emotionalState": "primary emotional state (one word)",
  "cognitivePatterns": ["cognitive pattern 1", "pattern 2"],
  "stressLevel": 1-10,
  "motivationThemes": ["motivation theme 1", "theme 2"],
  "therapeuticNeeds": ["therapeutic need 1", "need 2"]
}

Focus on:
- Core emotional state (anxious, depressed, excited, content, etc.)
- Thinking patterns (rumination, catastrophizing, positive reframing, etc.)
- Stress indicators (1=very low, 10=crisis level)
- What motivates this person (achievement, connection, autonomy, etc.)
- What therapeutic approaches would help (CBT, mindfulness, narrative therapy, etc.)`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 400
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No analysis content received');

      const analysis = JSON.parse(content);
      
      return {
        emotionalState: analysis.emotionalState || 'neutral',
        cognitivePatterns: analysis.cognitivePatterns || [],
        stressLevel: Math.max(1, Math.min(10, analysis.stressLevel || 5)),
        motivationThemes: analysis.motivationThemes || [],
        therapeuticNeeds: analysis.therapeuticNeeds || []
      };
    } catch (error) {
      console.error('Psychological analysis failed:', error);
      return {
        emotionalState: 'neutral',
        cognitivePatterns: [],
        stressLevel: 5,
        motivationThemes: [],
        therapeuticNeeds: []
      };
    }
  }
}

/**
 * User Model Engine - Updates comprehensive user psychological model
 */
class UserModelEngine {
  static async update(userId: string, entryText: string, analysis: any): Promise<void> {
    try {
      // Get existing psychological profile
      const [existingProfile] = await db
        .select()
        .from(psychologicalProfile)
        .where(eq(psychologicalProfile.userId, userId))
        .limit(1);

      const updatedData = {
        userId,
        emotionalPatterns: this.mergePatterns(
          Object.keys((existingProfile?.emotionalPatterns as Record<string, number>) || {}),
          [analysis.emotionalState]
        ),
        personalityTraits: this.mergePatterns(
          Object.keys((existingProfile?.personalityTraits as Record<string, number>) || {}),
          analysis.cognitivePatterns
        ),
        currentDominantEmotion: analysis.emotionalState,
        emotionalVolatility: UserModelEngine.calculateEmotionalVolatility(analysis.stressLevel),
        recurringConcerns: this.mergePatterns(
          (existingProfile?.recurringConcerns as string[]) || [],
          analysis.motivationThemes
        ),
        identifiedGrowthAreas: this.mergePatterns(
          (existingProfile?.identifiedGrowthAreas as string[]) || [],
          analysis.therapeuticNeeds
        ),
        lastFullAnalysisAt: new Date(),
        totalDataPoints: (existingProfile?.totalDataPoints || 0) + 1,
        updatedAt: new Date()
      };

      if (existingProfile) {
        await db
          .update(psychologicalProfile)
          .set(updatedData)
          .where(eq(psychologicalProfile.userId, userId));
      } else {
        await db
          .insert(psychologicalProfile)
          .values(updatedData);
      }

      console.log(`Updated psychological model for user ${userId}`);
    } catch (error) {
      console.error('User model update failed:', error);
    }
  }

  private static mergePatterns(existing: string[], newPatterns: string[]): string[] {
    const combined = [...existing, ...newPatterns];
    const frequency = combined.reduce((acc, pattern) => {
      acc[pattern] = (acc[pattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Return top 5 most frequent patterns
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pattern]) => pattern);
  }

  private static updateStressHistory(existing: number[], newLevel: number): number[] {
    const updated = [...existing, newLevel];
    // Keep last 10 stress readings
    return updated.slice(-10);
  }

  /**
   * Calculate emotional volatility based on stress level
   */
  private static calculateEmotionalVolatility(stressLevel: number): number {
    // Convert stress level (1-10) to volatility (0-1)
    return Math.min(stressLevel / 10, 1.0);
  }
}

/**
 * Dynamic Framework Selector - Selects optimal therapeutic framework
 */
class DynamicFrameworkSelector {
  static async select(entryText: string, analysis: any): Promise<{
    primaryFramework: string;
    secondaryFramework: string;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const prompt = `Based on this journal entry and psychological analysis, recommend the most effective therapeutic framework:

Journal Entry: "${entryText}"
Emotional State: ${analysis.emotionalState}
Cognitive Patterns: ${analysis.cognitivePatterns.join(', ')}
Stress Level: ${analysis.stressLevel}/10
Therapeutic Needs: ${analysis.therapeuticNeeds.join(', ')}

Select from these evidence-based frameworks:
- Cognitive Behavioral Therapy (CBT)
- Acceptance and Commitment Therapy (ACT)
- Dialectical Behavior Therapy (DBT)
- Mindfulness-Based Stress Reduction (MBSR)
- Solution-Focused Brief Therapy (SFBT)
- Narrative Therapy
- Person-Centered Therapy
- Positive Psychology

Respond in JSON format:
{
  "primaryFramework": "most suitable framework",
  "secondaryFramework": "complementary framework",
  "confidence": 0.85,
  "reasoning": "brief explanation of why this framework fits"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No framework selection received');

      const selection = JSON.parse(content);
      
      return {
        primaryFramework: selection.primaryFramework || 'Person-Centered Therapy',
        secondaryFramework: selection.secondaryFramework || 'CBT',
        confidence: Math.max(0.1, Math.min(1.0, selection.confidence || 0.7)),
        reasoning: selection.reasoning || 'Default framework selection'
      };
    } catch (error) {
      console.error('Framework selection failed:', error);
      return {
        primaryFramework: 'Person-Centered Therapy',
        secondaryFramework: 'CBT',
        confidence: 0.5,
        reasoning: 'Fallback to general supportive approach'
      };
    }
  }
}

/**
 * In-Memory Job Queue Implementation
 */
class JobQueue {
  private jobs: Map<string, QueuedJob> = new Map();
  private processing = false;
  private readonly maxConcurrency = 3;
  private activeJobs = 0;

  async add(data: JobData): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: QueuedJob = {
      id: jobId,
      data,
      status: 'pending',
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);
    
    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }

    return jobId;
  }

  private async startProcessing(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    
    while (this.getPendingJobs().length > 0 && this.activeJobs < this.maxConcurrency) {
      const job = this.getNextJob();
      if (job) {
        this.processJob(job);
      }
    }
  }

  private getPendingJobs(): QueuedJob[] {
    return Array.from(this.jobs.values()).filter(job => job.status === 'pending');
  }

  private getNextJob(): QueuedJob | null {
    const pendingJobs = this.getPendingJobs();
    return pendingJobs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0] || null;
  }

  private async processJob(job: QueuedJob): Promise<void> {
    this.activeJobs++;
    job.status = 'processing';
    job.processedAt = new Date();

    try {
      await PostProcessingJob.execute(job.data);
      job.status = 'completed';
      console.log(`✅ PostProcessingJob ${job.id} completed for user ${job.data.userId}`);
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      console.error(`❌ PostProcessingJob ${job.id} failed:`, error.message);
    } finally {
      this.activeJobs--;
      
      // Continue processing if more jobs pending
      if (this.getPendingJobs().length > 0 && this.activeJobs < this.maxConcurrency) {
        setTimeout(() => this.startProcessing(), 100);
      } else if (this.activeJobs === 0) {
        this.processing = false;
      }
    }
  }

  getStatus(): {
    totalJobs: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const jobs = Array.from(this.jobs.values());
    return {
      totalJobs: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    };
  }

  // Cleanup completed jobs older than 1 hour
  cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' && job.processedAt && job.processedAt < oneHourAgo) {
        this.jobs.delete(jobId);
      }
    }
  }
}

/**
 * Main PostProcessingJob Class
 */
export class PostProcessingJob {
  private static queue = new JobQueue();

  /**
   * Enqueue a new post-processing job (non-blocking)
   */
  static async enqueue(userId: string, threadId: string, entryText: string): Promise<string> {
    const jobId = await this.queue.add({
      userId,
      threadId,
      entryText,
      timestamp: new Date()
    });

    console.log(`📋 PostProcessingJob enqueued: ${jobId} for user ${userId}`);
    return jobId;
  }

  /**
   * Execute the post-processing analysis pipeline
   */
  static async execute(data: JobData): Promise<void> {
    const { userId, threadId, entryText } = data;
    const startTime = Date.now();

    console.log(`🔄 Processing analysis for user ${userId}, thread ${threadId}`);

    try {
      // Step 1: Psychological Analysis
      console.log('  🧠 Running psychological analysis...');
      const analysis = await PsychologicalAnalyzer.analyze(entryText);

      // Step 2: Update User Model
      console.log('  👤 Updating user psychological model...');
      await UserModelEngine.update(userId, entryText, analysis);

      // Step 3: Select Therapeutic Framework
      console.log('  🎯 Selecting optimal therapeutic framework...');
      const frameworkSelection = await DynamicFrameworkSelector.select(entryText, analysis);

      // Step 4: Update Therapeutic Profile
      console.log('  💾 Updating therapeutic profile...');
      await this.updateTherapeuticProfile(userId, analysis, frameworkSelection);

      // Step 5: Update Thread Context
      console.log('  🔗 Updating thread context...');
      await this.updateThreadContext(threadId, analysis, frameworkSelection);

      const processingTime = Date.now() - startTime;
      console.log(`✨ Post-processing completed in ${processingTime}ms`);

    } catch (error) {
      console.error('Post-processing failed:', error);
      throw error;
    }
  }

  /**
   * Update user's therapeutic profile with new insights
   */
  private static async updateTherapeuticProfile(
    userId: string, 
    analysis: any, 
    frameworkSelection: any
  ): Promise<void> {
    try {
      const [existingProfile] = await db
        .select()
        .from(userTherapeuticProfile)
        .where(eq(userTherapeuticProfile.userId, userId))
        .limit(1);

      const profileData = {
        userId,
        preferredFramework: frameworkSelection.primaryFramework,
        communicationStyle: this.inferCommunicationStyle(analysis),
        responsiveFrameworks: this.buildFrameworkWeights(frameworkSelection, existingProfile),
        effectiveStyles: this.updateEffectiveStyles(analysis, existingProfile),
        lastUpdated: new Date()
      };

      if (existingProfile) {
        await db
          .update(userTherapeuticProfile)
          .set(profileData)
          .where(eq(userTherapeuticProfile.userId, userId));
      } else {
        await db
          .insert(userTherapeuticProfile)
          .values(profileData);
      }
    } catch (error) {
      console.error('Therapeutic profile update failed:', error);
    }
  }

  /**
   * Update thread with current analysis context
   */
  private static async updateThreadContext(
    threadId: string, 
    analysis: any, 
    frameworkSelection: any
  ): Promise<void> {
    try {
      await db
        .update(journalingThreads)
        .set({
          currentEmotionalState: analysis.emotionalState,
          preferredTone: PostProcessingJob.mapEmotionalStateToTone(analysis.emotionalState),
          preferredPerspective: frameworkSelection.primaryFramework,
          lastActiveAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(journalingThreads.id, parseInt(threadId)));
    } catch (error) {
      console.error('Thread context update failed:', error);
    }
  }

  /**
   * Helper methods for data processing
   */
  private static inferCommunicationStyle(analysis: any): string {
    if (analysis.stressLevel > 7) return 'gentle';
    if (analysis.cognitivePatterns.includes('analytical')) return 'direct';
    if (analysis.emotionalState === 'anxious') return 'reassuring';
    return 'supportive';
  }

  private static buildFrameworkWeights(selection: any, existing: any): Record<string, number> {
    const weights = existing?.responsiveFrameworks || {};
    weights[selection.primaryFramework] = (weights[selection.primaryFramework] || 0) + selection.confidence;
    weights[selection.secondaryFramework] = (weights[selection.secondaryFramework] || 0) + (selection.confidence * 0.5);
    return weights;
  }

  private static updateEffectiveStyles(analysis: any, existing: any): Record<string, number> {
    const styles = existing?.effectiveStyles || {};
    const inferredStyle = analysis.stressLevel > 6 ? 'supportive' : 'challenging';
    styles[inferredStyle] = (styles[inferredStyle] || 0) + 1;
    return styles;
  }

  private static mapEmotionalStateToTone(emotionalState: string): string {
    const toneMap: Record<string, string> = {
      'anxious': 'calming',
      'depressed': 'uplifting',
      'angry': 'validating',
      'excited': 'encouraging',
      'content': 'supportive',
      'confused': 'clarifying'
    };
    return toneMap[emotionalState] || 'supportive';
  }

  /**
   * Get job queue status
   */
  static getQueueStatus() {
    return this.queue.getStatus();
  }

  /**
   * Cleanup old completed jobs
   */
  static cleanup(): void {
    this.queue.cleanup();
  }
}

// Export for external use
export const postProcessingQueue = PostProcessingJob;

// Cleanup interval (run every 30 minutes)
setInterval(() => {
  PostProcessingJob.cleanup();
}, 30 * 60 * 1000);