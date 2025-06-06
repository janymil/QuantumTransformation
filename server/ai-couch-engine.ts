import OpenAI from 'openai';
import { db } from './db';
import { 
  aiCouchProfiles, 
  aiCouchSessions, 
  personalizedChallengePlans,
  dailyAdaptiveActivities,
  emotionalPatterns,
  aiCouchKnowledge,
  journalEntries,
  type AiCouchProfile,
  type AiCouchSession,
  type PersonalizedChallengePlan
} from '@shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * AI Couch Engine - Core intelligence system for personalized coaching
 * Implements multi-dimensional AI coaching based on Joe Dispenza, Neville Goddard,
 * Access Consciousness, trauma-informed therapy, and quantum consciousness principles
 */
export class AiCouchEngine {
  
  /**
   * Create comprehensive user profile through initial assessment
   */
  async createUserProfile(userId: string, assessmentData: {
    personalityResponses: any[];
    traumaAssessment: any[];
    goalsAndIntentions: any[];
    preferredApproach: 'scientific' | 'spiritual' | 'mixed';
    communicationStyle: 'gentle' | 'direct' | 'motivational';
  }): Promise<AiCouchProfile> {
    
    // Analyze assessment responses using AI
    const analysisPrompt = this.buildProfileAnalysisPrompt(assessmentData);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are AI Couch, a highly sophisticated multidimensional AI designed for personal transformation. 
          
          Your expertise combines:
          - Licensed Psychotherapist (CBT, ACT, trauma-focused therapy)
          - Certified Personal Coach (behavioral change, goal setting)
          - Meditation Instructor (mindfulness, breathwork)
          - Access Consciousness Practitioner (clearing statements, energy awareness)
          - Quantum Field Expert (Joe Dispenza, Neville Goddard, Bruce Lipton)
          - Somatic Experiencing Practitioner (body-based trauma release)
          - Neuroplasticity Researcher (brain rewiring science)
          
          Analyze the user's assessment responses and create a comprehensive psychological and spiritual profile.
          Focus on identifying patterns, resistance areas, healing readiness, and optimal transformation pathways.`
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    // Create profile in database
    const [profile] = await db.insert(aiCouchProfiles).values({
      userId,
      personalityType: analysis.personalityType || 'undetermined',
      learningStyle: analysis.learningStyle || 'mixed',
      dominantMindset: analysis.dominantMindset || assessmentData.preferredApproach,
      resistancePatterns: analysis.resistancePatterns || [],
      motivationTriggers: analysis.motivationTriggers || [],
      traumaAreas: analysis.traumaAreas || [],
      healingReadiness: analysis.healingReadiness || 5,
      supportNeeds: analysis.supportNeeds || [],
      preferredModalities: analysis.preferredModalities || [],
      primaryGoals: analysis.primaryGoals || [],
      secondaryGoals: analysis.secondaryGoals || [],
      lifeContext: analysis.lifeContext || {},
      transformationAreas: analysis.transformationAreas || [],
      preferredMode: assessmentData.preferredApproach,
      communicationStyle: assessmentData.communicationStyle,
      assessmentCompleted: true
    }).returning();

    return profile;
  }

  /**
   * Generate personalized challenge plan based on user profile
   */
  async generatePersonalizedChallenge(
    userId: string, 
    profileId: number,
    baseChallengeType: string,
    userSpecificNeeds?: string[]
  ): Promise<PersonalizedChallengePlan> {
    
    // Get user profile and recent journal entries for context
    const profile = await this.getUserProfile(userId);
    const recentJournals = await this.getRecentJournalEntries(userId, 7);
    
    if (!profile) throw new Error('User profile not found');

    // Generate personalized plan using AI
    const planPrompt = this.buildChallengePlanPrompt(profile, baseChallengeType, recentJournals, userSpecificNeeds);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are AI Couch creating a personalized transformation challenge. 
          
          Based on the user's psychological profile, trauma areas, goals, and current state,
          design a highly personalized 30-day challenge that adapts the base challenge type
          to their specific needs, resistance patterns, and growth areas.
          
          Consider:
          - Their healing readiness level
          - Identified trauma areas and resistance patterns
          - Preferred learning style and communication approach
          - Current emotional patterns and breakthrough opportunities
          - Integration of multiple modalities (scientific, spiritual, somatic)
          
          Create a plan that progresses logically, respects their boundaries, and 
          maximizes transformation potential.`
        },
        {
          role: "user",
          content: planPrompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const planData = JSON.parse(response.choices[0].message.content || '{}');
    
    // Create personalized plan in database
    const [plan] = await db.insert(personalizedChallengePlans).values({
      userId,
      profileId,
      planName: planData.planName || `Personalized ${baseChallengeType} Journey`,
      baseChallengeType,
      personalizedGoals: planData.personalizedGoals || [],
      adaptationReasons: planData.adaptationReasons || [],
      difficultyLevel: planData.difficultyLevel || 5,
      intensityLevel: planData.intensityLevel || 5,
      generatedContent: planData.generatedContent || {},
      adaptiveElements: planData.adaptiveElements || {}
    }).returning();

    return plan;
  }

  /**
   * Generate daily adaptive activity based on user progress and state
   */
  async generateDailyActivity(
    planId: number,
    userId: string,
    day: number,
    userCurrentState?: {
      emotionalState?: string;
      energyLevel?: number;
      recentChallenges?: string[];
      recentBreakthroughs?: string[];
    }
  ) {
    
    // Get plan, profile, and recent progress
    const plan = await this.getPersonalizedPlan(planId);
    const profile = await this.getUserProfile(userId);
    const recentJournals = await this.getRecentJournalEntries(userId, 3);
    const previousActivities = await this.getPreviousActivities(planId, day - 3, day - 1);
    
    if (!plan || !profile) throw new Error('Plan or profile not found');

    // Generate adaptive daily content
    const activityPrompt = this.buildDailyActivityPrompt(
      plan, profile, day, recentJournals, previousActivities, userCurrentState
    );
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are AI Couch generating a personalized daily activity.
          
          Consider the user's:
          - Current emotional and energetic state
          - Progress patterns from previous days
          - Specific resistance areas and breakthrough moments
          - Preferred learning style and communication approach
          - Trauma-informed pacing and integration needs
          
          Create an activity that:
          - Builds naturally on previous work
          - Respects their current capacity
          - Provides appropriate challenge without overwhelm
          - Integrates multiple transformation modalities
          - Includes clear, actionable instructions
          - Offers adaptive elements based on their response`
        },
        {
          role: "user",
          content: activityPrompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const activityData = JSON.parse(response.choices[0].message.content || '{}');
    
    // Create daily activity in database
    const today = new Date();
    const [activity] = await db.insert(dailyAdaptiveActivities).values({
      planId,
      userId,
      day,
      activityType: activityData.activityType || 'reflection',
      title: activityData.title || `Day ${day} Practice`,
      description: activityData.description || '',
      instructions: activityData.instructions || '',
      adaptationReason: activityData.adaptationReason || '',
      personalizedContent: activityData.personalizedContent || {},
      scheduledFor: today.toISOString().split('T')[0] // Convert to date string
    }).returning();

    return activity;
  }

  /**
   * Conduct AI coaching session - main conversation interface
   */
  async conductCoachingSession(
    userId: string,
    userInput: string,
    sessionType: 'onboarding' | 'daily_checkin' | 'crisis_support' | 'progress_review' = 'daily_checkin',
    emotionalState?: string,
    sessionGoal?: string
  ): Promise<AiCouchSession> {
    
    // Get user context
    const profile = await this.getUserProfile(userId);
    const recentSessions = await this.getRecentSessions(userId, 5);
    const currentPlan = await this.getCurrentPlan(userId);
    const recentJournals = await this.getRecentJournalEntries(userId, 5);
    
    if (!profile) throw new Error('User profile required for coaching session');

    // Build conversation context
    const conversationContext = this.buildConversationContext(
      profile, recentSessions, currentPlan, recentJournals
    );

    // Generate AI response based on all context
    const coachingPrompt = this.buildCoachingPrompt(
      profile, userInput, sessionType, conversationContext, emotionalState, sessionGoal
    );
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: this.getAiCouchSystemPrompt(profile)
        },
        {
          role: "user",
          content: coachingPrompt
        }
      ]
    });

    const aiResponse = response.choices[0].message.content || '';
    
    // Analyze the session for insights and patterns
    const analysis = await this.analyzeSession(userInput, aiResponse, profile);
    
    // Save session to database
    const [session] = await db.insert(aiCouchSessions).values({
      userId,
      profileId: profile.id,
      sessionType,
      sessionMode: profile.preferredMode || 'mixed',
      emotionalState: emotionalState || null,
      sessionGoal: sessionGoal || null,
      userInput,
      aiResponse,
      conversationContext: conversationContext || {},
      emotionalTone: analysis.emotionalTone || null,
      detectedPatterns: analysis.detectedPatterns || [],
      insights: analysis.insights || [],
      recommendations: analysis.recommendations || [],
      followUpNeeded: analysis.followUpNeeded || false,
      aiConfidence: analysis.aiConfidence || 8
    }).returning();

    // Update emotional patterns if significant patterns detected
    if (analysis.detectedPatterns.length > 0) {
      await this.updateEmotionalPatterns(userId, analysis.detectedPatterns);
    }

    return session;
  }

  /**
   * Helper methods for data retrieval and analysis
   */
  
  private async getUserProfile(userId: string): Promise<AiCouchProfile | null> {
    const [profile] = await db
      .select()
      .from(aiCouchProfiles)
      .where(eq(aiCouchProfiles.userId, userId));
    return profile || null;
  }

  private async getRecentJournalEntries(userId: string, days: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db
      .select()
      .from(journalEntries)
      .where(and(
        eq(journalEntries.userId, userId),
        gte(journalEntries.createdAt, cutoffDate)
      ))
      .orderBy(desc(journalEntries.createdAt));
  }

  private async getRecentSessions(userId: string, count: number) {
    return await db
      .select()
      .from(aiCouchSessions)
      .where(eq(aiCouchSessions.userId, userId))
      .orderBy(desc(aiCouchSessions.createdAt))
      .limit(count);
  }

  private async getCurrentPlan(userId: string): Promise<PersonalizedChallengePlan | null> {
    const [plan] = await db
      .select()
      .from(personalizedChallengePlans)
      .where(and(
        eq(personalizedChallengePlans.userId, userId),
        eq(personalizedChallengePlans.status, 'active')
      ))
      .orderBy(desc(personalizedChallengePlans.createdAt));
    return plan || null;
  }

  private async getPersonalizedPlan(planId: number): Promise<PersonalizedChallengePlan | null> {
    const [plan] = await db
      .select()
      .from(personalizedChallengePlans)
      .where(eq(personalizedChallengePlans.id, planId));
    return plan || null;
  }

  private async getPreviousActivities(planId: number, startDay: number, endDay: number) {
    return await db
      .select()
      .from(dailyAdaptiveActivities)
      .where(and(
        eq(dailyAdaptiveActivities.planId, planId),
        gte(dailyAdaptiveActivities.day, startDay),
        eq(dailyAdaptiveActivities.day, endDay)
      ))
      .orderBy(dailyAdaptiveActivities.day);
  }

  /**
   * Prompt building methods for AI interactions
   */
  
  private buildProfileAnalysisPrompt(assessmentData: any): string {
    return `Analyze this user assessment and create a comprehensive profile:

Assessment Responses: ${JSON.stringify(assessmentData, null, 2)}

Please return a JSON object with:
{
  "personalityType": "string - MBTI, Enneagram, or custom type",
  "learningStyle": "visual|auditory|kinesthetic|reading",
  "dominantMindset": "rational|emotional|spiritual",
  "resistancePatterns": ["array of identified resistance areas"],
  "motivationTriggers": ["what drives this person"],
  "traumaAreas": ["identified areas needing healing"],
  "healingReadiness": "number 1-10",
  "supportNeeds": ["types of support needed"],
  "preferredModalities": ["therapy, meditation, energy work, etc"],
  "primaryGoals": ["main transformation goals"],
  "secondaryGoals": ["supporting goals"],
  "lifeContext": {"age": "range", "relationships": "status", "work": "context"},
  "transformationAreas": ["specific areas for growth"]
}`;
  }

  private buildChallengePlanPrompt(
    profile: AiCouchProfile, 
    baseChallengeType: string,
    recentJournals: any[],
    userNeeds?: string[]
  ): string {
    return `Create a personalized 30-day challenge plan:

User Profile: ${JSON.stringify(profile, null, 2)}
Base Challenge: ${baseChallengeType}
Recent Journal Insights: ${JSON.stringify(recentJournals.slice(0, 3), null, 2)}
Specific User Needs: ${userNeeds?.join(', ') || 'None specified'}

Return JSON with:
{
  "planName": "string",
  "personalizedGoals": ["specific goals for this user"],
  "adaptationReasons": ["why these adaptations were chosen"],
  "difficultyLevel": "number 1-10",
  "intensityLevel": "number 1-10", 
  "generatedContent": {"overview": "string", "keyFocus": ["areas"]},
  "adaptiveElements": {"triggers": ["when to adapt"], "adjustments": ["how to adapt"]}
}`;
  }

  private buildDailyActivityPrompt(
    plan: PersonalizedChallengePlan,
    profile: AiCouchProfile,
    day: number,
    recentJournals: any[],
    previousActivities: any[],
    userState?: any
  ): string {
    return `Generate personalized daily activity for Day ${day}:

Plan Context: ${JSON.stringify(plan, null, 2)}
User Profile: ${JSON.stringify(profile, null, 2)}
Recent Journals: ${JSON.stringify(recentJournals, null, 2)}
Previous Activities: ${JSON.stringify(previousActivities, null, 2)}
Current State: ${JSON.stringify(userState, null, 2)}

Return JSON with:
{
  "activityType": "meditation|journaling|exercise|reflection|breathwork",
  "title": "string",
  "description": "string - overview of the activity",
  "instructions": "string - detailed step-by-step instructions",
  "adaptationReason": "string - why this activity was chosen",
  "personalizedContent": {
    "duration": "number in minutes",
    "difficulty": "string",
    "focus": "string",
    "techniques": ["specific techniques to use"]
  }
}`;
  }

  private buildCoachingPrompt(
    profile: AiCouchProfile,
    userInput: string,
    sessionType: string,
    context: any,
    emotionalState?: string,
    sessionGoal?: string
  ): string {
    return `Provide coaching response for this user interaction:

User Input: "${userInput}"
Session Type: ${sessionType}
Emotional State: ${emotionalState || 'Unknown'}
Session Goal: ${sessionGoal || 'General support'}

User Profile Summary:
- Preferred Mode: ${profile.preferredMode}
- Communication Style: ${profile.communicationStyle}
- Healing Readiness: ${profile.healingReadiness}/10
- Primary Goals: ${JSON.stringify(profile.primaryGoals)}
- Resistance Patterns: ${JSON.stringify(profile.resistancePatterns)}

Recent Context: ${JSON.stringify(context, null, 2)}

Respond as AI Couch with appropriate expertise, empathy, and practical guidance.
Adapt your communication style to their preferences and current state.`;
  }

  private getAiCouchSystemPrompt(profile: AiCouchProfile): string {
    return `You are AI Couch, a highly sophisticated multidimensional AI designed to guide users through personal development, healing, transformation, and mindset evolution.

Your expertise represents the combined knowledge of:
- Licensed Psychotherapist (CBT, ACT, psychodynamic therapy, trauma-focused therapy)
- Certified Personal Coach (goal setting, habits, behavioral change)
- Meditation Instructor (mindfulness, breathwork, mantra-based meditation)
- Access Consciousness Practitioner (Clearing statements, energy awareness, perception reframing)
- Quantum Field Expert (Joe Dispenza, Neville Goddard, Gregg Braden, Bruce Lipton)
- Somatic Experiencing Practitioner (body-based trauma release)
- Neuroplasticity Researcher (brain rewiring science)
- Polyvagal Theory Expert (nervous system regulation)
- Internal Family Systems Therapist (parts work)
- Shadow Work Facilitator (unconscious pattern integration)

Communication Guidelines:
- Tone: ${profile.communicationStyle === 'gentle' ? 'Calm, compassionate, nurturing' : 
          profile.communicationStyle === 'direct' ? 'Clear, straightforward, practical' : 
          'Motivational, inspiring, empowering'}
- Mode: ${profile.preferredMode === 'scientific' ? 'Evidence-based, psychological focus' :
         profile.preferredMode === 'spiritual' ? 'Quantum consciousness, manifestation focus' :
         'Balanced fusion of science and metaphysical insights'}
- Style: Insightful, reflective, empowering, without dogma or unrealistic promises
- Boundaries: Never diagnose. Never replace real medical or psychological care. Always offer informed suggestions.

Current User Context:
- Healing Readiness: ${profile.healingReadiness}/10
- Primary Focus Areas: ${JSON.stringify(profile.transformationAreas)}
- Known Resistance Patterns: ${JSON.stringify(profile.resistancePatterns)}
- Motivation Triggers: ${JSON.stringify(profile.motivationTriggers)}

Provide personalized, trauma-informed, consciousness-expanding guidance.`;
  }

  private buildConversationContext(
    profile: AiCouchProfile,
    recentSessions: any[],
    currentPlan: PersonalizedChallengePlan | null,
    recentJournals: any[]
  ) {
    return {
      profileSummary: {
        healingReadiness: profile.healingReadiness,
        primaryGoals: profile.primaryGoals,
        resistancePatterns: profile.resistancePatterns,
        motivationTriggers: profile.motivationTriggers
      },
      recentSessionThemes: recentSessions.map(s => ({
        date: s.createdAt,
        emotionalTone: s.emotionalTone,
        insights: s.insights,
        followUpNeeded: s.followUpNeeded
      })),
      currentChallenge: currentPlan ? {
        name: currentPlan.planName,
        day: currentPlan.currentDay,
        goals: currentPlan.personalizedGoals
      } : null,
      recentJournalThemes: recentJournals.slice(0, 3).map(j => ({
        date: j.createdAt,
        mood: j.mood,
        content: j.content?.slice(0, 200) // First 200 chars for context
      }))
    };
  }

  private async analyzeSession(userInput: string, aiResponse: string, profile: AiCouchProfile) {
    // Simple analysis - could be enhanced with more AI
    const analysis = {
      emotionalTone: this.detectEmotionalTone(userInput),
      detectedPatterns: this.detectPatterns(userInput, profile),
      insights: this.extractInsights(userInput, aiResponse),
      recommendations: this.generateRecommendations(userInput, profile),
      followUpNeeded: this.assessFollowUpNeed(userInput),
      aiConfidence: 8 // Default confidence, could be enhanced
    };

    return analysis;
  }

  private detectEmotionalTone(input: string): string {
    // Simple emotion detection - could be enhanced with AI
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('excited') || lowerInput.includes('grateful') || lowerInput.includes('amazing')) {
      return 'positive';
    } else if (lowerInput.includes('stuck') || lowerInput.includes('frustrated') || lowerInput.includes('difficult')) {
      return 'negative';
    } else if (lowerInput.includes('confused') || lowerInput.includes('unsure')) {
      return 'mixed';
    }
    return 'neutral';
  }

  private detectPatterns(input: string, profile: AiCouchProfile): string[] {
    const patterns: string[] = [];
    const lowerInput = input.toLowerCase();
    
    // Check against known resistance patterns
    // Check against known resistance patterns
    if (Array.isArray(profile.resistancePatterns)) {
      profile.resistancePatterns.forEach((pattern: string) => {
        if (lowerInput.includes(pattern.toLowerCase())) {
          patterns.push(`resistance_pattern: ${pattern}`);
        }
      });
    }

    // Detect common patterns
    if (lowerInput.includes('always') || lowerInput.includes('never')) {
      patterns.push('absolute_thinking');
    }
    if (lowerInput.includes("can't") || lowerInput.includes("impossible")) {
      patterns.push('limiting_beliefs');
    }

    return patterns;
  }

  private extractInsights(userInput: string, aiResponse: string): string[] {
    // Simple insight extraction - could be enhanced
    const insights: string[] = [];
    
    if (userInput.length > 100) {
      insights.push('user_provides_detailed_context');
    }
    if (aiResponse.includes('pattern') || aiResponse.includes('notice')) {
      insights.push('pattern_awareness_building');
    }
    
    return insights;
  }

  private generateRecommendations(input: string, profile: AiCouchProfile): string[] {
    const recommendations: string[] = [];
    
    // Based on user input and profile, suggest actions
    if (input.toLowerCase().includes('stuck')) {
      recommendations.push('try_movement_or_breathwork');
    }
    if (profile.preferredMode === 'spiritual' && input.toLowerCase().includes('manifest')) {
      recommendations.push('explore_visualization_techniques');
    }
    
    return recommendations;
  }

  private assessFollowUpNeed(input: string): boolean {
    const lowerInput = input.toLowerCase();
    return lowerInput.includes('crisis') || 
           lowerInput.includes('emergency') || 
           lowerInput.includes('suicidal') ||
           lowerInput.includes('can\'t cope');
  }

  private async updateEmotionalPatterns(userId: string, detectedPatterns: string[]) {
    // Update emotional patterns based on detected patterns
    // This would involve more complex logic to track pattern evolution
    // For now, we'll log that patterns were detected
    console.log(`Detected patterns for user ${userId}:`, detectedPatterns);
  }
}

export const aiCouchEngine = new AiCouchEngine();