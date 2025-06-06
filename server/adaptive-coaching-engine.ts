/**
 * Adaptive Coaching Engine - AI-Driven Personalized Daily Coaching
 * Creates dynamic, personalized daily content based on user progress and responses
 */

import OpenAI from 'openai';
import { db } from './db';
import { aiCouchProfiles, aiCouchSessions } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { 
  validateAIRequest, 
  getCachedResponse, 
  cacheResponse, 
  trackUsage,
  createInputHash,
  optimizeContext 
} from './ai-cost-control';
import { modelRouter } from './intelligent-model-router';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DailyCoachingPlan {
  userId: string;
  currentFocus: string;
  reasoning: string;
  dailyAssessment: {
    id: string;
    title: string;
    description: string;
    exercises: DailyExercise[];
    reflectionQuestions: string[];
    completionCriteria: string[];
  };
  nextSteps: string;
  progressIndicators: string[];
}

export interface DailyExercise {
  id: string;
  type: 'meditation' | 'journaling' | 'visualization' | 'breathing' | 'movement' | 'awareness';
  title: string;
  description: string;
  duration: number; // minutes
  instructions: string[];
  therapeuticBasis: string; // Which therapeutic approach this is based on
}

export interface UserProgressContext {
  profile: any;
  recentSessions: any[];
  completedActivities: any[];
  currentChallenges: string[];
  emotionalState: string;
  lastAssessmentResponse: any;
}

export class AdaptiveCoachingEngine {
  
  /**
   * Main intelligence function - analyzes user and creates personalized daily plan
   */
  async createPersonalizedDailyPlan(userId: string): Promise<DailyCoachingPlan> {
    console.log(`Creating personalized daily plan for user ${userId}`);
    
    // Get user context
    const context = await this.getUserProgressContext(userId);
    
    // Use AI to analyze and create personalized plan
    const aiAnalysis = await this.analyzeUserAndCreatePlan(context);
    
    // Generate specific daily content
    const dailyContent = await this.generateDailyContent(context, aiAnalysis);
    
    return {
      userId,
      currentFocus: aiAnalysis.currentFocus,
      reasoning: aiAnalysis.reasoning,
      dailyAssessment: dailyContent,
      nextSteps: aiAnalysis.nextSteps,
      progressIndicators: aiAnalysis.progressIndicators
    };
  }

  /**
   * AI analyzes user's complete situation and determines optimal approach
   */
  private async analyzeUserAndCreatePlan(context: UserProgressContext): Promise<any> {
    // Create optimized input for cost control
    const optimizedContext = optimizeContext(
      JSON.stringify(context),
      'daily_coaching_analysis',
      { maxTokens: 2000, priorityFields: ['profile', 'emotionalState', 'lastAssessmentResponse'] }
    );

    // Create hash for caching
    const inputHash = createInputHash(
      optimizedContext, 
      'daily_coaching_analysis',
      undefined,
      undefined
    );

    // Skip cache and validation for now - focus on core functionality

    const prompt = `
You are an advanced AI coaching psychologist. Analyze this user's situation and determine optimal coaching path.

USER CONTEXT: ${optimizedContext}

Determine:
1. CURRENT FOCUS: One specific area to focus on now
2. REASONING: Why this is optimal for their situation  
3. THERAPEUTIC APPROACHES: 3 best modalities
4. NEXT STEPS: What this prepares them for
5. PROGRESS INDICATORS: How to measure success

Respond in JSON:
{
  "currentFocus": "specific focus area",
  "reasoning": "explanation of why this is optimal",
  "therapeuticApproaches": ["approach1", "approach2", "approach3"],
  "nextSteps": "what this prepares them for",
  "progressIndicators": ["indicator1", "indicator2", "indicator3"]
}
`;

    try {
      // Use full intelligent model routing with complexity analysis
      const aiResult = await modelRouter.executeWithOptimalModel(
        prompt,
        "You are an advanced AI coaching psychologist specializing in adaptive personalized coaching.",
        optimizedContext,
        'daily_coaching_analysis',
        'advanced_ai_couch',
        'premium',
        { temperature: 0.7, maxTokens: 800 }
      );

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No response from AI");

      // Track usage
      await trackUsage(
        context.profile?.userId || 'unknown',
        'daily_coaching_analysis',
        prompt,
        response.usage?.prompt_tokens || 0,
        response.usage?.completion_tokens || 0
      );

      // Cache response
      await cacheResponse(
        inputHash,
        'daily_coaching_analysis',
        undefined,
        undefined,
        content,
        response.usage?.total_tokens || 0,
        context.profile?.userId || 'unknown'
      );

      return JSON.parse(content);
    } catch (error) {
      console.error("Error in AI analysis:", error);
      return {
        currentFocus: "Foundational Stability",
        reasoning: "Starting with basic emotional regulation and stress management",
        therapeuticApproaches: ["CBT", "Breathing Techniques", "Mindfulness"],
        nextSteps: "Building resilience for deeper work",
        progressIndicators: ["Improved daily mood", "Better stress response", "Increased self-awareness"]
      };
    }
  }

  /**
   * Generate specific daily content based on AI analysis
   */
  private async generateDailyContent(context: UserProgressContext, analysis: any): Promise<any> {
    const prompt = `
Create a personalized daily assessment and exercises for this user.

CURRENT FOCUS: ${analysis.currentFocus}
THERAPEUTIC APPROACHES: ${analysis.therapeuticApproaches.join(', ')}
USER LEARNING STYLE: ${context.profile?.learningStyle}
USER COMMUNICATION STYLE: ${context.profile?.communicationStyle}

Create TODAY'S specific content:

1. DAILY ASSESSMENT: 
   - Title and description
   - 3-5 specific exercises (meditation, journaling, visualization, etc.)
   - Each exercise should be 5-30 minutes
   - Include step-by-step instructions
   - Specify which therapeutic approach each exercise uses

2. REFLECTION QUESTIONS: 3-4 questions to assess progress

3. COMPLETION CRITERIA: Clear criteria for marking today's work as complete

Make everything specific, actionable, and personalized to this user's situation and learning style.

Respond in JSON format:
{
  "id": "daily_assessment_unique_id",
  "title": "Today's Focus Title",
  "description": "What we're working on today and why",
  "exercises": [
    {
      "id": "exercise_id",
      "type": "meditation/journaling/visualization/breathing/movement/awareness",
      "title": "Exercise Title",
      "description": "What this exercise does",
      "duration": 15,
      "instructions": ["step 1", "step 2", "step 3"],
      "therapeuticBasis": "Which approach this is based on"
    }
  ],
  "reflectionQuestions": ["question 1", "question 2", "question 3"],
  "completionCriteria": ["criteria 1", "criteria 2"]
}
`;

    try {
      // Use intelligent routing for daily content generation
      const aiResult = await modelRouter.executeWithOptimalModel(
        prompt,
        "You are an advanced AI coach creating detailed daily coaching content with therapeutic exercises.",
        contextString,
        'therapeutic_content_generation',
        'advanced_ai_couch',
        'premium',
        { temperature: 0.8, maxTokens: 1500 }
      );

      const dailyContent = JSON.parse(aiResult.response);
      
      console.log(`Daily Content - Model: ${aiResult.modelUsed}, Complexity: ${aiResult.routingDecision.complexity}, Cost: $${aiResult.actualCost.toFixed(4)}`);
      
      return dailyContent;
    } catch (error) {
      console.error("Error generating daily content:", error);
      return {
        id: `daily_${Date.now()}`,
        title: "Foundation Building",
        description: "Today we focus on establishing emotional stability and awareness",
        exercises: [
          {
            id: "breathing_foundation",
            type: "breathing",
            title: "Coherent Breathing",
            description: "Establish nervous system regulation",
            duration: 10,
            instructions: ["Sit comfortably", "Breathe in for 5 counts", "Breathe out for 5 counts", "Continue for 10 minutes"],
            therapeuticBasis: "Somatic therapy and nervous system regulation"
          }
        ],
        reflectionQuestions: ["How do you feel after the breathing exercise?", "What did you notice in your body?"],
        completionCriteria: ["Completed breathing exercise", "Answered reflection questions"]
      };
    }
  }

  /**
   * Get comprehensive user context for AI analysis
   */
  private async getUserProgressContext(userId: string): Promise<UserProgressContext> {
    try {
      // Get user profile
      const [profile] = await db
        .select()
        .from(aiCouchProfiles)
        .where(eq(aiCouchProfiles.userId, userId))
        .limit(1);

      // Get recent sessions (last 7 days)
      const recentSessions = await db
        .select()
        .from(aiCouchSessions)
        .where(eq(aiCouchSessions.userId, userId))
        .orderBy(desc(aiCouchSessions.createdAt))
        .limit(10);

      return {
        profile,
        recentSessions,
        completedActivities: [], // TODO: Implement activity tracking
        currentChallenges: Array.isArray(profile?.traumaAreas) ? profile.traumaAreas : [],
        emotionalState: recentSessions[0]?.emotionalState || 'neutral',
        lastAssessmentResponse: recentSessions[0] || null
      };
    } catch (error) {
      console.error("Error getting user context:", error);
      return {
        profile: null,
        recentSessions: [],
        completedActivities: [],
        currentChallenges: [],
        emotionalState: 'neutral',
        lastAssessmentResponse: null
      };
    }
  }

  /**
   * Process daily check-in and adapt next day's content
   */
  async processDailyCheckIn(userId: string, responses: any): Promise<any> {
    console.log(`Processing daily check-in for user ${userId}`);
    
    const context = await this.getUserProgressContext(userId);
    
    const prompt = `
The user has completed their daily assessment. Based on their responses, adapt tomorrow's content.

USER RESPONSES: ${JSON.stringify(responses)}
CURRENT PROGRESS: ${JSON.stringify(context)}

Analyze:
1. How did they respond to today's exercises?
2. What emotional/mental shifts occurred?
3. What should we focus on tomorrow?
4. Should we continue current approach or pivot?

Respond with adaptation recommendations:
{
  "progressAssessment": "how they're doing",
  "emotionalShifts": "what changed",
  "tomorrowFocus": "what to focus on next",
  "approachAdjustments": "any changes needed"
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      return content ? JSON.parse(content) : null;
    } catch (error) {
      console.error("Error processing check-in:", error);
      return null;
    }
  }

  /**
   * Check if user has incomplete daily assessments
   */
  async getIncompleteAssessments(userId: string): Promise<any[]> {
    // TODO: Implement daily assessment tracking
    // For now, return empty array
    return [];
  }
}

export const adaptiveCoachingEngine = new AdaptiveCoachingEngine();