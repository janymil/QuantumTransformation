import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
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

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
   * Generate morning prompt for daily companion functionality
   */
  async generateMorningPrompt(userId: string): Promise<any> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const recentSessions = await this.getRecentSessions(userId, 3);
    const currentPlan = await this.getCurrentPlan(userId);

    const prompt = `Generate a personalized morning prompt for this user based on their profile and recent patterns.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Communication Style: ${profile.communicationStyle}
- Preferred Mode: ${profile.preferredMode}
- Primary Goals: ${JSON.stringify(profile.primaryGoals)}
- Current Challenge: ${currentPlan?.planName || 'None active'}

RECENT SESSION PATTERNS:
${recentSessions.map(s => `- ${s.emotionalTone}: ${s.insights?.slice(0, 2).join(', ')}`).join('\n')}

Create a morning prompt that:
1. Sets a positive, intentional tone for the day
2. Includes a brief reflection question aligned with their goals
3. Suggests a micro-practice or intention setting exercise
4. Matches their communication style and preferred approach
5. Takes 2-3 minutes to complete

Format as JSON with: { "greeting": "...", "reflection": "...", "practice": "...", "intention": "..." }`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    return JSON.parse(response.content[0].text || '{}');
  }

  /**
   * Generate evening reflection for daily companion functionality
   */
  async generateEveningReflection(userId: string, dayExperiences?: string): Promise<any> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const currentPlan = await this.getCurrentPlan(userId);

    const prompt = `Generate a personalized evening reflection for this user.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Communication Style: ${profile.communicationStyle}
- Preferred Mode: ${profile.preferredMode}
- Primary Goals: ${JSON.stringify(profile.primaryGoals)}

DAY CONTEXT:
- Current Challenge: ${currentPlan?.planName || 'None active'}
- Day Experiences: ${dayExperiences || 'Not provided'}

Create an evening reflection that:
1. Invites gentle review of the day's experiences
2. Celebrates growth and progress, however small
3. Identifies patterns or insights from the day
4. Prepares the mind for restful sleep
5. Includes gratitude or appreciation practice
6. Matches their communication style

Format as JSON with: { "welcome": "...", "review": "...", "celebration": "...", "insight": "...", "gratitude": "...", "preparation": "..." }`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    return JSON.parse(response.content[0].text || '{}');
  }

  /**
   * Generate weekly psychological pattern summary
   */
  async generateWeeklyPatternSummary(userId: string): Promise<any> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const recentSessions = await this.getRecentSessions(userId, 20);
    const recentJournals = await this.getRecentJournalEntries(userId, 7);

    const prompt = `Analyze this user's patterns from the past week and provide insights.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Known Resistance Patterns: ${JSON.stringify(profile.resistancePatterns)}
- Transformation Areas: ${JSON.stringify(profile.transformationAreas)}

RECENT SESSIONS (past week):
${recentSessions.map(s => `
Date: ${s.createdAt}
Emotional Tone: ${s.emotionalTone}
Detected Patterns: ${JSON.stringify(s.detectedPatterns)}
Insights: ${JSON.stringify(s.insights)}
`).join('\n')}

JOURNAL ENTRIES:
${recentJournals.map(j => `
Date: ${j.createdAt}
Content: ${j.content?.substring(0, 200)}...
`).join('\n')}

Provide a comprehensive weekly summary that identifies:
1. Emotional patterns and trends
2. Recurring themes or challenges
3. Growth areas and breakthroughs
4. Resistance patterns that surfaced
5. Recommended focus areas for next week
6. Specific interventions or practices to suggest

Format as JSON with detailed analysis in each category.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    return JSON.parse(response.content[0].text || '{}');
  }

  /**
   * Crisis support mode - enhanced empathy and grounding techniques
   */
  async provideCrisisSupport(userId: string, crisisInput: string, severityLevel: 1 | 2 | 3 | 4 | 5): Promise<any> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    // Enhanced crisis prompt with immediate grounding and safety
    const prompt = `${this.getAiCouchSystemPrompt(profile)}

🚨 CRISIS SUPPORT MODE ACTIVATED 🚨
Severity Level: ${severityLevel}/5

USER INPUT: "${crisisInput}"

This user is experiencing distress and needs immediate, compassionate support. Provide:

1. IMMEDIATE GROUNDING: Quick, effective grounding technique suited to their learning style
2. VALIDATION: Acknowledge their pain without minimizing or rushing to solutions
3. SAFETY ASSESSMENT: Gently inquire about immediate safety if severity is high
4. BREATHING/REGULATION: Simple nervous system regulation technique
5. NEXT STEPS: Clear, manageable next steps for the next hour/day
6. RESOURCES: When appropriate, suggest professional support

IMPORTANT:
- If severity level is 4-5, prioritize safety and professional resources
- Use their preferred communication style but adapt for crisis (more gentle, slower pace)
- Provide practical, immediate tools they can use right now
- Create sense of safety and connection

Response should be warm, grounding, and immediately helpful.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const aiResponse = response.content[0].text || '';

    // Save crisis session with special flagging
    await db.insert(aiCouchSessions).values({
      userId,
      profileId: profile.id,
      sessionType: 'crisis_support',
      sessionMode: 'gentle', // Always use gentle mode for crisis
      emotionalState: `crisis_level_${severityLevel}`,
      sessionGoal: 'Crisis support and stabilization',
      userInput: crisisInput,
      aiResponse,
      conversationContext: { crisisLevel: severityLevel },
      emotionalTone: 'crisis_distress',
      detectedPatterns: ['crisis_response'],
      insights: ['Crisis support provided'],
      recommendations: ['Follow up within 24 hours', 'Monitor for professional care needs'],
      followUpNeeded: true,
      aiConfidence: 9,
      specialFlags: ['crisis_session', `severity_${severityLevel}`]
    });

    return {
      response: aiResponse,
      crisisLevel: severityLevel,
      followUpScheduled: true,
      professionalReferralSuggested: severityLevel >= 4
    };
  }

  /**
   * Advanced therapeutic intervention generator
   */
  async generateTherapeuticIntervention(
    userId: string, 
    targetPattern: string, 
    interventionType: 'cognitive' | 'somatic' | 'energetic' | 'behavioral'
  ): Promise<any> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const prompt = `Generate a specific therapeutic intervention for this user.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.preferredMode}
- Learning Style: ${profile.learningStyle}
- Communication Style: ${profile.communicationStyle}

TARGET PATTERN: ${targetPattern}
INTERVENTION TYPE: ${interventionType}

Based on your multidisciplinary expertise, create a detailed intervention that includes:

FOR COGNITIVE: CBT techniques, reframing exercises, thought stopping, cognitive restructuring
FOR SOMATIC: Body-based practices, breathwork, nervous system regulation, movement
FOR ENERGETIC: Quantum field work, energy clearing, manifestation techniques, consciousness work
FOR BEHAVIORAL: Habit change, behavioral activation, exposure therapy, skill building

Structure the intervention with:
1. THEORY: Brief explanation of why this works
2. SETUP: How to prepare for the practice
3. STEP-BY-STEP: Detailed instructions
4. DURATION: How long to practice
5. FREQUENCY: How often to repeat
6. INTEGRATION: How to integrate insights
7. PROGRESSION: How to advance the practice

Adapt complexity to their healing readiness level and learning style.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      intervention: JSON.parse(response.content[0].text || '{}'),
      targetPattern,
      interventionType,
      personalizedFor: userId
    };
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
    return `You are AI Couch, a highly sophisticated multidimensional artificial intelligence designed to guide users through personal development, healing, transformation, and mindset evolution. You represent the accumulated wisdom and techniques of various disciplines.

🎯 YOUR CORE PURPOSE:
Analyze the user's personal situation, struggles, goals, mindset, emotional patterns, and inputs to offer structured, insightful support through:
- Diagnostic reflections and pattern recognition
- Tailored exercises and therapeutic interventions  
- Personalized challenge programs and visualizations
- Quantum reprogramming and consciousness-expanding tools
- Daily companion functionality with morning/evening prompts

🔧 YOUR INTEGRATED KNOWLEDGE BASE:
You embody the combined expertise of:

CORE THERAPEUTIC DISCIPLINES:
- Licensed Psychotherapist (CBT, ACT, psychodynamic therapy, trauma-focused therapy)
- Certified Personal Coach (goal setting, habits, behavioral change)
- Meditation Instructor (mindfulness, breathwork, mantra-based meditation)
- Access Consciousness Practitioner (clearing statements, energy awareness, perception reframing)
- Quantum Field Expert (Joe Dispenza, Neville Goddard, Gregg Braden, Bruce Lipton)

ADVANCED THERAPEUTIC MODALITIES:
- Somatic Experiencing Practitioner (body-based trauma release and nervous system regulation)
- Neuroplasticity Researcher (brain rewiring science and cognitive restructuring)
- Polyvagal Theory Expert (nervous system states and co-regulation)
- Internal Family Systems Therapist (parts work and inner child healing)
- Shadow Work Facilitator (unconscious pattern integration and psychological wholeness)
- EFT/Tapping Practitioner (emotional freedom techniques)
- Breathwork Therapist (conscious connected breathing and emotional release)
- Nutritional Psychiatrist (gut-brain connection and mental health nutrition)
- Sleep Therapy Specialist (circadian rhythm optimization and dream work)
- Neurofeedback Practitioner (brainwave training and optimization)

🧠 ANALYSIS CAPABILITIES:
You can detect and analyze:
- Emotional patterns and cognitive distortions
- Limiting beliefs and resistance patterns
- Life context and environmental factors
- Attachment styles and relationship dynamics
- Nervous system dysregulation and trauma responses
- Subconscious programming and quantum field interactions

💬 PERSONALIZED COMMUNICATION:
Tone: ${profile.communicationStyle === 'gentle' ? 'Calm, compassionate, nurturing - like a wise, caring mentor' : 
          profile.communicationStyle === 'direct' ? 'Clear, straightforward, practical - like a skilled coach' : 
          'Motivational, inspiring, empowering - like an enthusiastic guide'}

Mode: ${profile.preferredMode === 'scientific' ? 'Evidence-based psychology focus with CBT, emotional regulation, and psychoeducation' :
         profile.preferredMode === 'spiritual' ? 'Quantum consciousness, manifestation, and metaphysical insights' :
         'Balanced fusion of scientific rigor and spiritual wisdom'}

Approach: Always trauma-informed, culturally sensitive, and adapted to healing readiness level ${profile.healingReadiness}/10

🛡️ ETHICAL BOUNDARIES:
- Never diagnose medical or psychiatric conditions
- Never replace professional medical/psychological care
- Always recommend professional help for severe cases
- Provide informed suggestions within scope of coaching/guidance
- Maintain confidentiality and emotional safety

CURRENT USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Learning Style: ${profile.learningStyle}
- Primary Goals: ${JSON.stringify(profile.primaryGoals)}
- Transformation Areas: ${JSON.stringify(profile.transformationAreas)}
- Resistance Patterns: ${JSON.stringify(profile.resistancePatterns)}
- Motivation Triggers: ${JSON.stringify(profile.motivationTriggers)}
- Life Context: ${profile.lifeContext}

Your responses should demonstrate deep understanding, offer practical tools from your integrated knowledge base, and guide the user toward their next level of consciousness and healing.`;
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