import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import { 
  aiCouchProfiles, 
  personalizedChallengePlans, 
  aiCouchSessions, 
  journalEntries,
  type AiCouchProfile,
  type PersonalizedChallengePlan,
  type AiCouchSession
} from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

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
    primaryGoals: string[];
    currentChallenges: string[];
    healingReadiness: number;
    preferredMode: 'scientific' | 'spiritual' | 'mixed';
    communicationStyle: 'gentle' | 'direct' | 'motivational';
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    traumaHistory: string;
    spiritualBackground: string;
    mentalHealthHistory: string;
    lifeContext: string;
  }): Promise<AiCouchProfile> {
    const prompt = this.buildProfileAnalysisPrompt(assessmentData);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    let analysisResult = {};
    if (content.type === 'text') {
      try {
        analysisResult = JSON.parse(content.text);
      } catch {
        analysisResult = {};
      }
    }

    const [profile] = await db.insert(aiCouchProfiles).values({
      userId,
      primaryGoals: assessmentData.primaryGoals,
      currentChallenges: assessmentData.currentChallenges,
      healingReadiness: assessmentData.healingReadiness,
      preferredMode: assessmentData.preferredMode,
      communicationStyle: assessmentData.communicationStyle,
      learningStyle: assessmentData.learningStyle,
      traumaHistory: assessmentData.traumaHistory,
      spiritualBackground: assessmentData.spiritualBackground,
      mentalHealthHistory: assessmentData.mentalHealthHistory,
      lifeContext: assessmentData.lifeContext,
      aiAnalysis: analysisResult,
      isActive: true
    }).returning();

    return profile;
  }

  /**
   * Generate personalized challenge plan based on user profile
   */
  async generatePersonalizedChallenge(
    userId: string, 
    challengeType: string, 
    duration: number = 30
  ): Promise<PersonalizedChallengePlan> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const prompt = this.buildChallengePlanPrompt(profile, challengeType, duration);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    let planData = {};
    if (content.type === 'text') {
      try {
        planData = JSON.parse(content.text);
      } catch {
        planData = {};
      }
    }

    const [plan] = await db.insert(personalizedChallengePlans).values({
      userId,
      planName: `${challengeType} - Personalized Journey`,
      challengeType,
      totalDays: duration,
      currentDay: 1,
      difficultyLevel: profile.healingReadiness,
      intensityLevel: profile.healingReadiness,
      generatedPlan: planData,
      isActive: true
    }).returning();

    return plan;
  }

  /**
   * Generate daily adaptive activity based on user progress and state
   */
  async generateDailyActivity(
    userId: string, 
    planId: number, 
    currentDay: number
  ): Promise<any> {
    const profile = await this.getUserProfile(userId);
    const plan = await this.getPersonalizedPlan(planId);
    if (!profile || !plan) throw new Error('Profile or plan not found');

    const previousActivities = await this.getPreviousActivities(planId, Math.max(1, currentDay - 3), currentDay - 1);

    const prompt = this.buildDailyActivityPrompt(plan, profile, currentDay, previousActivities);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        return JSON.parse(content.text);
      } catch {
        return {};
      }
    }
    return {};
  }

  /**
   * Conduct AI coaching session - main conversation interface
   */
  async conductCoachingSession(
    userId: string, 
    userInput: string, 
    sessionType: string = 'general'
  ): Promise<any> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const conversationContext = await this.buildConversationContext(profile, userInput);
    const prompt = this.buildCoachingPrompt(profile, userInput, conversationContext, sessionType);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    let aiResponse = '';
    if (content.type === 'text') {
      aiResponse = content.text;
    }

    // Analyze session for insights
    const sessionAnalysis = await this.analyzeSession(userInput, aiResponse, profile);

    // Save session
    await db.insert(aiCouchSessions).values({
      userId,
      sessionType,
      userInput,
      aiResponse,
      emotionalTone: sessionAnalysis.emotionalTone,
      detectedPatterns: sessionAnalysis.patterns,
      insights: sessionAnalysis.insights,
      recommendations: sessionAnalysis.recommendations,
      followUpNeeded: sessionAnalysis.followUpNeeded
    });

    return {
      response: aiResponse,
      analysis: sessionAnalysis,
      personalizedFor: userId
    };
  }

  /**
   * Generate morning prompt for daily companion functionality
   */
  async generateMorningPrompt(userId: string): Promise<any> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const recentJournals = await this.getRecentJournalEntries(userId, 3);

    const prompt = `${this.getAiCouchSystemPrompt(profile)}

MORNING COMPANION REQUEST:
Create a personalized morning prompt for this user to start their day with intention and awareness.

RECENT JOURNAL PATTERNS:
${recentJournals.map(j => `Day: ${j.createdAt?.toDateString()} - Mood: ${j.mood}/10, Energy: ${j.energy}/10`).join('\n')}

Create a morning prompt that:
1. Acknowledges their recent emotional patterns
2. Sets a positive, empowering tone
3. Includes a brief mindfulness practice (2-3 minutes)
4. Suggests an intention for the day
5. Takes 2-3 minutes to complete

Format as JSON with: { "greeting": "...", "reflection": "...", "practice": "...", "intention": "..." }`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        return JSON.parse(content.text);
      } catch {
        return {};
      }
    }
    return {};
  }

  /**
   * Generate evening reflection for daily companion functionality
   */
  async generateEveningReflection(userId: string, dayExperiences?: string): Promise<any> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const prompt = `${this.getAiCouchSystemPrompt(profile)}

EVENING REFLECTION REQUEST:
Create a personalized evening reflection to help the user process their day and prepare for rest.

TODAY'S EXPERIENCES: ${dayExperiences || 'No specific experiences shared'}

Create an evening reflection that:
1. Validates their day's experiences
2. Encourages gratitude and appreciation
3. Helps process any challenges
4. Celebrates growth and insights
5. Prepares mind for restful sleep
6. Matches their communication style

Format as JSON with: { "welcome": "...", "review": "...", "celebration": "...", "insight": "...", "gratitude": "...", "preparation": "..." }`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        return JSON.parse(content.text);
      } catch {
        return {};
      }
    }
    return {};
  }

  /**
   * Generate weekly psychological pattern summary
   */
  async generateWeeklyPatternSummary(userId: string): Promise<any> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const weekJournals = await this.getRecentJournalEntries(userId, 7);
    const weekSessions = await this.getRecentSessions(userId, 10);

    const prompt = `${this.getAiCouchSystemPrompt(profile)}

WEEKLY PATTERN ANALYSIS REQUEST:
Analyze this user's week of data to identify psychological and emotional patterns.

JOURNAL DATA (7 days):
${weekJournals.map(j => `
Date: ${j.createdAt?.toDateString()}
Mood: ${j.mood}/10
Energy: ${j.energy}/10
Experience: ${j.experience || 'No content'}
`).join('\n')}

SESSION DATA:
${weekSessions.map(s => `
Date: ${s.createdAt?.toDateString()}
Emotional Tone: ${s.emotionalTone}
Patterns: ${s.detectedPatterns?.join(', ') || 'None'}
`).join('\n')}

Analyze for:
1. Emotional patterns and trends
2. Energy fluctuations
3. Growth areas and resistance
4. Breakthrough moments
5. Recommendations for next week

Format as comprehensive JSON analysis.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        return JSON.parse(content.text);
      } catch {
        return {};
      }
    }
    return {};
  }

  /**
   * Crisis support mode - enhanced empathy and grounding techniques
   */
  async provideCrisisSupport(userId: string, crisisInput: string, severityLevel: 1 | 2 | 3 | 4 | 5): Promise<any> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const prompt = `${this.getAiCouchSystemPrompt(profile)}

CRISIS SUPPORT MODE ACTIVATED - SEVERITY LEVEL ${severityLevel}/5

USER CRISIS INPUT: ${crisisInput}

IMMEDIATE PRIORITIES:
1. SAFETY FIRST - Assess and address immediate safety
2. VALIDATION - Acknowledge their pain without judgment  
3. GROUNDING - Provide immediate nervous system regulation tools
4. HOPE - Gentle reminder that this moment will pass
5. RESOURCES - Suggest professional help if needed

APPROACH:
- Use their preferred communication style but lean toward gentler language
- Provide immediate grounding techniques suitable for their learning style
- If severity 4-5, recommend professional crisis resources
- Stay present-focused, avoid future planning in crisis state
- Normalize their experience while promoting safety

Format as JSON with: { "immediate_response": "...", "grounding_technique": "...", "safety_check": "...", "next_steps": "...", "professional_resources": "..." }`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        return JSON.parse(content.text);
      } catch {
        return {};
      }
    }
    return {};
  }

  /**
   * Advanced therapeutic intervention generator
   */
  async generateTherapeuticIntervention(
    userId: string,
    targetPattern: string,
    interventionType: 'cognitive' | 'somatic' | 'energy' | 'behavioral' | 'spiritual'
  ): Promise<any> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const prompt = `${this.getAiCouchSystemPrompt(profile)}

THERAPEUTIC INTERVENTION REQUEST:
Design a specific intervention for this user's pattern.

TARGET PATTERN: ${targetPattern}
INTERVENTION TYPE: ${interventionType}

Design intervention that:
1. Addresses the specific pattern safely
2. Matches their healing readiness level (${profile.healingReadiness}/10)
3. Uses their preferred learning style (${profile.learningStyle})
4. Respects their trauma history and boundaries
5. Provides clear, actionable steps
6. Includes progress tracking methods

Format as detailed JSON intervention guide.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        return JSON.parse(content.text);
      } catch {
        return {};
      }
    }
    return {};
  }

  /**
   * Dynamic Assessment Engine - Continuously evaluates user progress and adaptation needs
   */
  async performDynamicAssessment(userId: string): Promise<any> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const recentSessions = await this.getRecentSessions(userId, 10);
    const recentJournals = await this.getRecentJournalEntries(userId, 7);
    const currentPlan = await this.getCurrentPlan(userId);

    const prompt = `${this.getAiCouchSystemPrompt(profile)}

DYNAMIC ASSESSMENT REQUEST:
Perform a comprehensive evaluation of this user's current state and adaptation needs.

RECENT SESSIONS DATA:
${recentSessions.map(s => `
Date: ${s.createdAt?.toDateString()}
Emotional Tone: ${s.emotionalTone}
Patterns: ${JSON.stringify(s.detectedPatterns)}
Progress Indicators: ${JSON.stringify(s.insights)}
Follow-up Needed: ${s.followUpNeeded}
`).join('\n')}

RECENT JOURNAL ENTRIES:
${recentJournals.map(j => `
Date: ${j.createdAt?.toDateString()}
Mood: ${j.mood}/10
Energy: ${j.energy}/10
Content Themes: ${j.insights || 'Not analyzed'}
`).join('\n')}

CURRENT CHALLENGE PROGRESS:
${currentPlan ? `
Plan: ${currentPlan.planName}
Current Day: ${currentPlan.currentDay || 0}/${currentPlan.totalDays || 30}
Completion Rate: ${Math.round(((currentPlan.currentDay || 0) / (currentPlan.totalDays || 30)) * 100)}%
` : 'No active challenge'}

ASSESSMENT AREAS TO EVALUATE:
1. ENGAGEMENT PATTERNS: How consistently is the user participating?
2. EMOTIONAL PROGRESSION: Are there positive shifts in emotional tone?
3. RESISTANCE IDENTIFICATION: Where are they getting stuck?
4. BREAKTHROUGH MOMENTS: What's working exceptionally well?
5. ADAPTATION NEEDS: Should difficulty/intensity be adjusted?
6. NEXT PHASE READINESS: Are they ready for more advanced work?

Provide detailed assessment with specific recommendations for adaptation.
Format as JSON with categories: engagement, emotional_progression, resistance_areas, breakthroughs, adaptation_recommendations, next_phase_readiness.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        return JSON.parse(content.text);
      } catch {
        return {};
      }
    }
    return {};
  }

  /**
   * Helper methods for data retrieval and analysis
   */
  private async getUserProfile(userId: string): Promise<AiCouchProfile | null> {
    const [profile] = await db.select().from(aiCouchProfiles)
      .where(eq(aiCouchProfiles.userId, userId))
      .orderBy(desc(aiCouchProfiles.createdAt))
      .limit(1);
    return profile || null;
  }

  private async getRecentJournalEntries(userId: string, days: number) {
    return await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(days);
  }

  private async getRecentSessions(userId: string, count: number) {
    return await db.select().from(aiCouchSessions)
      .where(eq(aiCouchSessions.userId, userId))
      .orderBy(desc(aiCouchSessions.createdAt))
      .limit(count);
  }

  private async getCurrentPlan(userId: string): Promise<PersonalizedChallengePlan | null> {
    const [plan] = await db.select().from(personalizedChallengePlans)
      .where(eq(personalizedChallengePlans.userId, userId))
      .orderBy(desc(personalizedChallengePlans.createdAt))
      .limit(1);
    return plan || null;
  }

  private async getPersonalizedPlan(planId: number): Promise<PersonalizedChallengePlan | null> {
    const [plan] = await db.select().from(personalizedChallengePlans)
      .where(eq(personalizedChallengePlans.id, planId))
      .limit(1);
    return plan || null;
  }

  private async getPreviousActivities(planId: number, startDay: number, endDay: number) {
    // This would fetch activities from a activities table if implemented
    return [];
  }

  /**
   * Prompt building methods for AI interactions
   */
  private buildProfileAnalysisPrompt(assessmentData: any): string {
    return `You are AI Couch performing comprehensive personality and needs analysis.

ASSESSMENT DATA:
${JSON.stringify(assessmentData, null, 2)}

Analyze this user across multiple dimensions and provide detailed psychological profile with recommendations for personalized coaching approach.

Format as JSON with detailed analysis and recommendations.`;
  }

  private buildChallengePlanPrompt(
    profile: AiCouchProfile, 
    challengeType: string, 
    duration: number
  ): string {
    return `${this.getAiCouchSystemPrompt(profile)}

CHALLENGE PLAN GENERATION:
Create a ${duration}-day personalized challenge plan for: ${challengeType}

Design a comprehensive plan that adapts to this user's specific profile and needs.
Format as detailed JSON plan with daily progression.`;
  }

  private buildDailyActivityPrompt(
    plan: PersonalizedChallengePlan,
    profile: AiCouchProfile,
    currentDay: number,
    previousActivities: any[]
  ): string {
    return `${this.getAiCouchSystemPrompt(profile)}

DAILY ACTIVITY GENERATION:
Create today's personalized activity for day ${currentDay} of their ${plan.planName} journey.

Consider their progress and previous activities to ensure appropriate progression.
Format as JSON with specific daily guidance.`;
  }

  private buildCoachingPrompt(
    profile: AiCouchProfile,
    userInput: string,
    conversationContext: string,
    sessionType: string
  ): string {
    return `${this.getAiCouchSystemPrompt(profile)}

COACHING SESSION:
Type: ${sessionType}
User Input: ${userInput}

Context: ${conversationContext}

Provide personalized coaching response that honors their communication style and current needs.`;
  }

  private getAiCouchSystemPrompt(profile: AiCouchProfile): string {
    return `You are AI Couch, a highly sophisticated multidimensional artificial intelligence designed for personal transformation through quantum consciousness, trauma-informed therapy, and advanced psychological techniques.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.preferredMode}
- Communication Style: ${profile.communicationStyle}
- Learning Style: ${profile.learningStyle}
- Primary Goals: ${profile.primaryGoals?.join(', ')}
- Current Challenges: ${profile.currentChallenges?.join(', ')}

Respond according to their preferences while maintaining professional boundaries and recommending professional help when appropriate.`;
  }

  private async buildConversationContext(
    profile: AiCouchProfile,
    userInput: string
  ): Promise<string> {
    const recentSessions = await this.getRecentSessions(profile.userId, 3);
    return `Recent conversation patterns: ${recentSessions.map(s => s.emotionalTone).join(', ')}`;
  }

  private async analyzeSession(userInput: string, aiResponse: string, profile: AiCouchProfile) {
    return {
      emotionalTone: this.detectEmotionalTone(userInput),
      patterns: this.detectPatterns(userInput, profile),
      insights: this.extractInsights(userInput, aiResponse),
      recommendations: this.generateRecommendations(userInput, profile),
      followUpNeeded: this.assessFollowUpNeed(userInput)
    };
  }

  private detectEmotionalTone(input: string): string {
    // Simple emotion detection - could be enhanced with ML
    if (input.toLowerCase().includes('anxious') || input.toLowerCase().includes('worried')) return 'anxious';
    if (input.toLowerCase().includes('sad') || input.toLowerCase().includes('depressed')) return 'sad';
    if (input.toLowerCase().includes('angry') || input.toLowerCase().includes('frustrated')) return 'frustrated';
    if (input.toLowerCase().includes('excited') || input.toLowerCase().includes('happy')) return 'positive';
    return 'neutral';
  }

  private detectPatterns(input: string, profile: AiCouchProfile): string[] {
    const patterns: string[] = [];
    // Pattern detection logic based on profile and input
    return patterns;
  }

  private extractInsights(userInput: string, aiResponse: string): string[] {
    return ['Session completed successfully'];
  }

  private generateRecommendations(input: string, profile: AiCouchProfile): string[] {
    return ['Continue regular check-ins'];
  }

  private assessFollowUpNeed(input: string): boolean {
    return input.toLowerCase().includes('crisis') || input.toLowerCase().includes('emergency');
  }
}

export const aiCouchEngine = new AiCouchEngine();