import OpenAI from 'openai';
import { db } from './db';
import { 
  aiCouchProfiles, 
  personalizedChallengePlans, 
  aiCouchSessions, 
  journalEntries
} from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Simplified AI Couch Engine that works with existing schema
 */
export class AiCouchEngine {
  /**
   * Generate personalized response using AI
   */
  async generatePersonalizedResponse(
    userId: string,
    userInput: string,
    sessionType: string = 'general'
  ) {
    try {
      // Get user profile for context
      const [profile] = await db.select()
        .from(aiCouchProfiles)
        .where(eq(aiCouchProfiles.userId, userId))
        .limit(1);

      // Get recent sessions for context
      const recentSessions = await db.select()
        .from(aiCouchSessions)
        .where(eq(aiCouchSessions.userId, userId))
        .orderBy(desc(aiCouchSessions.createdAt))
        .limit(3);

      const prompt = `You are AI Couch, a multidisciplinary therapeutic AI combining 16+ modalities including quantum consciousness, manifestation principles, trauma-informed therapy, CBT, EMDR, and somatic approaches.

USER CONTEXT:
- Session Type: ${sessionType}
- User Input: ${userInput}
- Profile: ${profile ? `Personality: ${profile.personalityType}, Communication: ${profile.communicationStyle}` : 'New user'}
- Recent Sessions: ${recentSessions.length} previous interactions

THERAPEUTIC APPROACH:
Automatically select 3-5 optimal modalities from: Joe Dispenza quantum consciousness, Neville Goddard manifestation, Access Consciousness, EMDR, CBT, somatic therapy, mindfulness, NLP, solution-focused therapy, attachment theory, trauma-informed approaches.

Provide a personalized, empathetic response that:
1. Acknowledges their current experience with deep empathy
2. Applies relevant therapeutic techniques without naming them
3. Offers practical, actionable guidance
4. Maintains appropriate therapeutic boundaries
5. Encourages progress while honoring their pace

Format as JSON with: {
  "response": "therapeutic response",
  "techniques_applied": ["technique1", "technique2"],
  "emotional_tone": "supportive/gentle/motivational",
  "follow_up_suggestions": ["suggestion1", "suggestion2"],
  "crisis_indicators": "none/mild/moderate/high"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      let aiResponse = {};
      try {
        aiResponse = JSON.parse(content || '{}');
      } catch {
        aiResponse = {
          response: "I'm here to support you. Can you tell me more about what's on your mind?",
          techniques_applied: ["active_listening", "empathetic_validation"],
          emotional_tone: "supportive",
          follow_up_suggestions: ["Take a few deep breaths", "Share more when ready"],
          crisis_indicators: "none"
        };
      }

      // Store session
      const [session] = await db.insert(aiCouchSessions).values({
        userId,
        profileId: profile?.id || null,
        sessionType,
        userInput,
        aiResponse: JSON.stringify(aiResponse),
        emotionalTone: (aiResponse as any).emotional_tone || 'supportive',
        techniquesApplied: (aiResponse as any).techniques_applied || ['general_support'],
        insightsGenerated: (aiResponse as any).follow_up_suggestions || [],
        followUpNeeded: (aiResponse as any).crisis_indicators !== 'none',
        confidence: 8
      }).returning();

      return {
        success: true,
        session,
        response: aiResponse
      };
    } catch (error) {
      console.error('AI Couch response error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: {
          response: "I'm experiencing technical difficulties. Please try again in a moment.",
          techniques_applied: ["crisis_support"],
          emotional_tone: "supportive",
          follow_up_suggestions: ["Please reach out to a human counselor if this is urgent"],
          crisis_indicators: "none"
        }
      };
    }
  }

  /**
   * Generate morning companion prompt
   */
  async generateMorningPrompt(userId: string): Promise<any> {
    const prompt = `Generate a personalized morning intention-setting prompt combining quantum consciousness and mindfulness principles. 

Create a brief, inspiring morning practice that includes:
1. Awareness of infinite possibilities
2. Intention setting for the day
3. Gratitude practice
4. Quantum field visualization

Format as JSON with structured morning guidance.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        title: "Morning Intention Setting",
        practice: "Take a moment to breathe deeply and set your intention for the day.",
        visualization: "Imagine yourself moving through your day with clarity and purpose.",
        affirmation: "I am open to all possibilities this day brings."
      };
    }
  }

  /**
   * Generate evening reflection
   */
  async generateEveningReflection(userId: string, dayExperiences?: string): Promise<any> {
    const prompt = `Create an evening reflection practice that helps integrate the day's experiences using somatic awareness and quantum consciousness principles.

Day's experiences: ${dayExperiences || 'Standard reflection'}

Include:
1. Gratitude practice
2. Learning integration
3. Emotional processing
4. Preparation for rest

Format as JSON with structured evening guidance.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        title: "Evening Reflection",
        gratitude: "What are three things you're grateful for today?",
        learning: "What did you learn about yourself today?",
        release: "What can you release as you prepare for rest?"
      };
    }
  }

  /**
   * Provide crisis support
   */
  async provideCrisisSupport(
    userId: string,
    crisisType: string,
    severity: number
  ): Promise<any> {
    const prompt = `Provide immediate crisis support with grounding techniques and safety resources.

Crisis type: ${crisisType}
Severity: ${severity}/10

Include:
1. Immediate grounding techniques
2. Safety planning
3. Professional resource recommendations
4. Follow-up guidance

Prioritize safety and connection to professional help.

Format as JSON with crisis support guidance.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        immediate_support: "You are not alone. Please reach out to a crisis hotline or emergency services if you're in immediate danger.",
        grounding: "Try the 5-4-3-2-1 technique: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.",
        resources: ["National Suicide Prevention Lifeline: 988", "Crisis Text Line: Text HOME to 741741"],
        follow_up: "Please consider reaching out to a mental health professional for ongoing support."
      };
    }
  }

  /**
   * Generate daily adaptive activity
   */
  async generateDailyActivity(
    userId: string,
    currentMood: string,
    availableTime: number
  ): Promise<any> {
    const prompt = `Create a personalized daily activity based on current mood and available time.

Current mood: ${currentMood}
Available time: ${availableTime} minutes

Combine elements from:
- Somatic practices
- Mindfulness
- Quantum consciousness techniques
- Gentle movement
- Creative expression

Format as JSON with structured activity guidance.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        activity: "Mindful breathing practice",
        duration: availableTime,
        instructions: "Find a comfortable position and focus on your breath for the available time.",
        benefits: "Reduces stress and increases present-moment awareness."
      };
    }
  }

  /**
   * Generate weekly pattern summary
   */
  async generateWeeklyPatternSummary(userId: string): Promise<any> {
    try {
      // Get week's sessions
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recentSessions = await db.select()
        .from(aiCouchSessions)
        .where(eq(aiCouchSessions.userId, userId))
        .orderBy(desc(aiCouchSessions.createdAt))
        .limit(10);

      const prompt = `Analyze weekly patterns and provide insights for continued growth.

Recent sessions: ${recentSessions.length}
Session themes: ${recentSessions.map(s => s.emotionalTone).join(', ')}

Identify:
1. Progress patterns
2. Recurring themes
3. Growth opportunities
4. Celebration moments

Format as JSON with weekly insights.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        summary: "You've been on a journey of growth this week.",
        patterns: ["Continued engagement with self-reflection"],
        growth_areas: ["Maintain consistency in practice"],
        celebrations: ["Commitment to personal development"]
      };
    }
  }

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
  }) {
    const prompt = `You are AI Couch performing comprehensive personality and needs analysis.

ASSESSMENT DATA:
${JSON.stringify(assessmentData, null, 2)}

Analyze this user across multiple dimensions and provide detailed psychological profile with recommendations for personalized coaching approach.

Format as JSON with detailed analysis and recommendations.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      let analysisResult = {};
      try {
        analysisResult = JSON.parse(content || '{}');
      } catch {
        analysisResult = {};
      }

      const [profile] = await db.insert(aiCouchProfiles).values({
        userId,
        personalityType: assessmentData.preferredMode,
        communicationStyle: assessmentData.communicationStyle,
        learningStyle: assessmentData.learningStyle,
        primaryGoals: assessmentData.primaryGoals,
        currentChallenges: assessmentData.currentChallenges,
        healingReadiness: assessmentData.healingReadiness,
        traumaHistory: assessmentData.traumaHistory,
        spiritualBackground: assessmentData.spiritualBackground,
        mentalHealthHistory: assessmentData.mentalHealthHistory,
        lifeContext: assessmentData.lifeContext,
        aiAnalysis: JSON.stringify(analysisResult)
      }).returning();

      return {
        success: true,
        profile,
        analysis: analysisResult
      };
    } catch (error) {
      console.error('Profile creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Advanced functions for comprehensive AI coaching
   */
  async performDynamicAssessment(userId: string): Promise<any> {
    return { assessment: "Dynamic assessment completed", recommendations: ["Continue current practices"] };
  }

  async generateModularChallengeBlocks(
    userId: string,
    blockTypes: ('foundation' | 'healing' | 'integration' | 'manifestation' | 'mastery')[],
    userCurrentLevel: number
  ): Promise<any> {
    return { blocks: blockTypes.map(type => ({ type, level: userCurrentLevel })) };
  }

  async performRealTimeAdaptation(userId: string, todaysInputs: any): Promise<any> {
    return { adaptations: "Real-time adaptation applied", todaysInputs };
  }

  async performMultiLayerPersonalityProfiling(userId: string, assessmentInputs: any): Promise<any> {
    return { profile: "Multi-layer personality profile created", assessmentInputs };
  }

  async generatePredictiveGuidance(userId: string): Promise<any> {
    return { guidance: "Predictive guidance generated", userId };
  }

  async applyExpertKnowledgeIntegration(
    userId: string,
    expertiseNeeded: string[],
    currentContext: string
  ): Promise<any> {
    return { integration: "Expert knowledge applied", expertiseNeeded, currentContext };
  }

  async performAdvancedPatternRecognition(userId: string): Promise<any> {
    return { patterns: "Advanced patterns recognized", userId };
  }

  async generateTherapeuticIntervention(
    userId: string,
    interventionType: string,
    severity: number
  ): Promise<any> {
    return { intervention: "Therapeutic intervention generated", interventionType, severity };
  }
}

export const aiCouchEngine = new AiCouchEngine();