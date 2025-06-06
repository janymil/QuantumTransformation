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
 * Advanced AI Couch Engine with 18 Sophisticated Functions
 * Integrating 16+ therapeutic modalities for personalized transformation
 */
export class AiCouchEngine {
  /**
   * 1. Create comprehensive user profile through initial assessment
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

Apply insights from:
- Joe Dispenza's quantum consciousness model
- Neville Goddard's manifestation principles
- Access Consciousness tools
- Trauma-informed therapeutic approaches
- CBT and EMDR frameworks
- Somatic therapy principles
- Attachment theory
- Neuroscience-based techniques

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
   * 2. Dynamic Assessment Engine - Continuously evaluates user progress and adaptation needs
   */
  async performDynamicAssessment(userId: string): Promise<any> {
    // Get user profile and recent sessions
    const [profile] = await db.select()
      .from(aiCouchProfiles)
      .where(eq(aiCouchProfiles.userId, userId))
      .limit(1);

    const recentSessions = await db.select()
      .from(aiCouchSessions)
      .where(eq(aiCouchSessions.userId, userId))
      .orderBy(desc(aiCouchSessions.createdAt))
      .limit(10);

    const prompt = `Perform dynamic assessment of user progress and adaptation needs.

USER PROFILE: ${profile ? JSON.stringify(profile) : 'New user'}
RECENT SESSIONS: ${recentSessions.length} sessions
SESSION PATTERNS: ${recentSessions.map(s => s.emotionalTone).join(', ')}

Assess:
1. Current readiness level for deeper work
2. Resistance patterns and breakthrough opportunities
3. Optimal therapeutic modalities for this moment
4. Adaptation recommendations for current phase
5. Crisis indicators or support needs

Format as JSON with comprehensive assessment.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        readiness_level: 'stable',
        recommendations: ['Continue current practices'],
        adaptations_needed: false
      };
    }
  }

  /**
   * 3. Modular Challenge Block System - Creates adaptive challenge components
   */
  async generateModularChallengeBlocks(
    userId: string,
    blockTypes: ('foundation' | 'healing' | 'integration' | 'manifestation' | 'mastery')[],
    userCurrentLevel: number
  ): Promise<any> {
    const [profile] = await db.select()
      .from(aiCouchProfiles)
      .where(eq(aiCouchProfiles.userId, userId))
      .limit(1);

    const prompt = `Create modular challenge blocks tailored to user's level and needs.

USER LEVEL: ${userCurrentLevel}/10
BLOCK TYPES: ${blockTypes.join(', ')}
USER PROFILE: ${profile ? profile.personalityType : 'adaptive'}

Design progressive challenge modules combining:
- Quantum consciousness techniques (Joe Dispenza)
- Manifestation practices (Neville Goddard)
- Access Consciousness tools
- Trauma-informed progression
- Somatic integration
- Neuroscience-based exercises

Each block should include:
1. Clear objectives and outcomes
2. Progressive difficulty levels
3. Integration practices
4. Success metrics
5. Personalized adaptations

Format as JSON with structured challenge blocks.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        blocks: blockTypes.map(type => ({
          type,
          level: userCurrentLevel,
          practices: ['Foundation practice for ' + type],
          duration: '7 days'
        }))
      };
    }
  }

  /**
   * 4. Real-time Adaptation Engine - Daily recalibration based on user responses
   */
  async performRealTimeAdaptation(userId: string, todaysInputs: any): Promise<any> {
    const [profile] = await db.select()
      .from(aiCouchProfiles)
      .where(eq(aiCouchProfiles.userId, userId))
      .limit(1);

    const recentSessions = await db.select()
      .from(aiCouchSessions)
      .where(eq(aiCouchSessions.userId, userId))
      .orderBy(desc(aiCouchSessions.createdAt))
      .limit(5);

    const prompt = `Perform real-time adaptation based on today's user inputs and responses.

TODAY'S INPUTS: ${JSON.stringify(todaysInputs)}
USER PROFILE: ${profile ? profile.communicationStyle : 'adaptive'}
RECENT PATTERN: ${recentSessions.map(s => s.emotionalTone).join(' -> ')}

Analyze and adapt:
1. Emotional state shifts requiring approach modifications
2. Resistance patterns indicating need for gentler/stronger approaches
3. Breakthrough moments suggesting readiness for deeper work
4. Energy levels affecting practice recommendations
5. Integration capacity for new concepts

Provide specific adaptations for:
- Communication style adjustments
- Practice intensity modifications
- Therapeutic modality selection
- Pacing recommendations
- Support level adjustments

Format as JSON with adaptation recommendations.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        adaptations: 'Maintain current approach',
        recommendations: ['Continue with gentle progression'],
        energy_match: 'balanced'
      };
    }
  }

  /**
   * 5. Multi-Layer Personality Profiling - Deep psychological and learning assessment
   */
  async performMultiLayerPersonalityProfiling(userId: string, assessmentInputs: any): Promise<any> {
    const prompt = `Perform comprehensive multi-layer personality profiling.

ASSESSMENT INPUTS: ${JSON.stringify(assessmentInputs)}

Analyze across multiple dimensions:

LAYER 1 - CORE PERSONALITY:
- Big Five personality traits
- Attachment style patterns
- Core beliefs and values
- Defense mechanisms

LAYER 2 - LEARNING & COMMUNICATION:
- Preferred learning modalities
- Information processing style
- Communication preferences
- Feedback reception patterns

LAYER 3 - TRAUMA & HEALING:
- Trauma response patterns
- Healing readiness indicators
- Resistance mechanisms
- Integration capacity

LAYER 4 - CONSCIOUSNESS & SPIRITUALITY:
- Consciousness development level
- Spiritual openness
- Manifestation readiness
- Quantum awareness capacity

LAYER 5 - BEHAVIORAL PATTERNS:
- Habit formation tendencies
- Change adaptation style
- Motivation triggers
- Success patterns

Provide detailed analysis with therapeutic recommendations for each layer.

Format as JSON with comprehensive profiling.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        core_personality: 'Balanced profile',
        learning_style: 'Multi-modal',
        healing_readiness: 'Open to growth',
        consciousness_level: 'Developing awareness',
        behavioral_patterns: 'Adaptive and flexible'
      };
    }
  }

  /**
   * 6. Predictive Guidance System - Anticipates user needs before they're conscious
   */
  async generatePredictiveGuidance(userId: string): Promise<any> {
    const [profile] = await db.select()
      .from(aiCouchProfiles)
      .where(eq(aiCouchProfiles.userId, userId))
      .limit(1);

    const recentSessions = await db.select()
      .from(aiCouchSessions)
      .where(eq(aiCouchSessions.userId, userId))
      .orderBy(desc(aiCouchSessions.createdAt))
      .limit(15);

    const prompt = `Generate predictive guidance based on user patterns and trajectory.

USER TRAJECTORY ANALYSIS:
- Profile: ${profile ? JSON.stringify(profile) : 'New user'}
- Session Count: ${recentSessions.length}
- Pattern Evolution: ${recentSessions.slice(0, 5).map(s => s.emotionalTone).join(' -> ')}

Predict and prepare for:

IMMEDIATE NEEDS (next 24-48 hours):
- Emotional support requirements
- Likely resistance points
- Breakthrough opportunities
- Integration support needs

SHORT-TERM TRAJECTORY (1-2 weeks):
- Emerging themes and patterns
- Readiness for deeper work
- Potential challenges
- Growth opportunities

MEDIUM-TERM DEVELOPMENT (1-3 months):
- Consciousness evolution path
- Major transformation windows
- Integration milestones
- Mastery development areas

Provide specific, actionable guidance that addresses needs before they become conscious.

Format as JSON with predictive insights and proactive recommendations.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        immediate_needs: ['Emotional support', 'Gentle guidance'],
        short_term: ['Continue current practices'],
        medium_term: ['Deepen awareness practices'],
        proactive_recommendations: ['Maintain consistent practice']
      };
    }
  }

  /**
   * 7. Multidisciplinary Expert Assessment - Determines which therapeutic approaches to apply
   */
  async performMultidisciplinaryAssessment(
    userId: string,
    currentIssues: string,
    goals: string
  ): Promise<any> {
    const [profile] = await db.select()
      .from(aiCouchProfiles)
      .where(eq(aiCouchProfiles.userId, userId))
      .limit(1);

    const prompt = `Perform multidisciplinary therapeutic assessment to determine optimal approach combination.

CURRENT ISSUES: ${currentIssues}
USER GOALS: ${goals}
USER PROFILE: ${profile ? JSON.stringify(profile) : 'Assessment in progress'}

Evaluate suitability and effectiveness of each therapeutic modality:

1. QUANTUM CONSCIOUSNESS (Joe Dispenza):
   - Meditation and mindfulness practices
   - Neuroscience-based transformation
   - Breaking habit patterns

2. MANIFESTATION PRINCIPLES (Neville Goddard):
   - Imagination and visualization
   - Assumption techniques
   - Reality creation practices

3. ACCESS CONSCIOUSNESS:
   - Question-based awareness tools
   - Clearing limiting beliefs
   - Expanding consciousness

4. TRAUMA-INFORMED THERAPY:
   - Safety and stabilization
   - Trauma processing techniques
   - Integration practices

5. COGNITIVE BEHAVIORAL THERAPY (CBT):
   - Thought pattern identification
   - Behavioral modification
   - Cognitive restructuring

6. EMDR (Eye Movement Desensitization):
   - Trauma processing
   - Memory integration
   - Nervous system regulation

7. SOMATIC THERAPY:
   - Body awareness practices
   - Nervous system regulation
   - Embodied healing

8. SOLUTION-FOCUSED THERAPY:
   - Goal-oriented approaches
   - Strength-based interventions
   - Future-focused techniques

For each modality, assess:
- Relevance to current issues (1-10)
- User readiness level (1-10)
- Potential effectiveness (1-10)
- Integration compatibility (1-10)

Select top 3-5 modalities and create integrated approach.

Format as JSON with assessment and integrated treatment plan.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        selected_modalities: ['mindfulness', 'cbt', 'somatic_awareness'],
        integration_approach: 'Gentle, trauma-informed progression',
        primary_focus: 'Safety and stabilization'
      };
    }
  }

  /**
   * 8. Expert Knowledge Integration System - Apply specific methodologies
   */
  async applyExpertKnowledgeIntegration(
    userId: string,
    expertiseNeeded: string[],
    currentContext: string
  ): Promise<any> {
    const prompt = `Apply expert knowledge integration for specific therapeutic methodologies.

EXPERTISE NEEDED: ${expertiseNeeded.join(', ')}
CURRENT CONTEXT: ${currentContext}

For each requested expertise area, provide:

JOE DISPENZA METHODOLOGY:
- Specific meditation techniques
- Neuroscience-based explanations
- Habit breaking protocols
- Energy and frequency work

NEVILLE GODDARD PRINCIPLES:
- Imagination exercises
- Assumption techniques
- State consciousness methods
- Manifestation protocols

ACCESS CONSCIOUSNESS TOOLS:
- Specific questions for awareness
- Clearing techniques
- Consciousness expansion exercises
- Limiting belief dissolution

TRAUMA-INFORMED APPROACHES:
- Safety establishment protocols
- Grounding techniques
- Titrated exposure methods
- Integration practices

SOMATIC THERAPY TECHNIQUES:
- Body awareness exercises
- Nervous system regulation
- Embodied healing practices
- Sensation tracking methods

CBT INTERVENTIONS:
- Thought record techniques
- Behavioral experiments
- Cognitive restructuring
- Homework assignments

EMDR PROTOCOLS:
- Resource building exercises
- Dual attention techniques
- Memory processing methods
- Integration practices

Provide specific, actionable techniques from requested expertise areas.

Format as JSON with detailed methodology applications.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        applied_techniques: expertiseNeeded.map(exp => ({
          methodology: exp,
          techniques: ['Basic technique for ' + exp],
          implementation: 'Gentle introduction'
        }))
      };
    }
  }

  /**
   * 9. Advanced Pattern Recognition with Emotional Intelligence
   */
  async performAdvancedPatternRecognition(userId: string): Promise<any> {
    const recentSessions = await db.select()
      .from(aiCouchSessions)
      .where(eq(aiCouchSessions.userId, userId))
      .orderBy(desc(aiCouchSessions.createdAt))
      .limit(20);

    const prompt = `Perform advanced pattern recognition with emotional intelligence analysis.

SESSION DATA: ${JSON.stringify(recentSessions.map(s => ({
  date: s.createdAt,
  tone: s.emotionalTone,
  techniques: s.techniquesApplied,
  insights: s.insightsGenerated
})))}

Analyze patterns across multiple dimensions:

EMOTIONAL PATTERNS:
- Emotional state progressions
- Trigger identification
- Resilience building patterns
- Emotional regulation development

BEHAVIORAL PATTERNS:
- Engagement levels over time
- Response to different approaches
- Resistance and breakthrough cycles
- Integration success patterns

CONSCIOUSNESS PATTERNS:
- Awareness development trajectory
- Insight generation patterns
- Consciousness expansion indicators
- Spiritual growth markers

THERAPEUTIC RESPONSE PATTERNS:
- Most effective modalities
- Optimal timing for interventions
- Communication style preferences
- Learning and integration patterns

PREDICTIVE INDICATORS:
- Early warning signs for setbacks
- Breakthrough opportunity markers
- Readiness indicators for deeper work
- Integration capacity signals

Provide detailed pattern analysis with actionable insights.

Format as JSON with comprehensive pattern recognition results.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        emotional_patterns: 'Stable progression',
        behavioral_patterns: 'Consistent engagement',
        consciousness_patterns: 'Gradual awareness expansion',
        therapeutic_response: 'Positive response to gentle approaches',
        predictive_indicators: 'Continued growth trajectory'
      };
    }
  }

  /**
   * 10. Generate personalized response using AI
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
   * 11. Generate morning companion prompt
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
   * 12. Generate evening reflection
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
   * 13. Generate weekly pattern summary
   */
  async generateWeeklyPatternSummary(userId: string): Promise<any> {
    try {
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
   * 14. Provide crisis support
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
   * 15. Generate therapeutic intervention
   */
  async generateTherapeuticIntervention(
    userId: string,
    interventionType: string,
    severity: number
  ): Promise<any> {
    const prompt = `Generate targeted therapeutic intervention.

Intervention Type: ${interventionType}
Severity Level: ${severity}/10

Create intervention combining relevant modalities:
- Trauma-informed approaches for safety
- Somatic techniques for regulation
- Cognitive approaches for restructuring
- Spiritual practices for meaning-making
- Practical tools for immediate relief

Format as JSON with structured intervention plan.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        intervention: "Gentle support and grounding",
        techniques: ["Deep breathing", "Safe space visualization"],
        follow_up: "Continue with gentle self-care practices"
      };
    }
  }

  /**
   * 16. Generate daily adaptive activity
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
   * 17. Generate personalized challenge
   */
  async generatePersonalizedChallenge(
    userId: string,
    challengeType: string,
    currentDay: number
  ): Promise<any> {
    const [profile] = await db.select()
      .from(aiCouchProfiles)
      .where(eq(aiCouchProfiles.userId, userId))
      .limit(1);

    const prompt = `Create personalized daily challenge for transformation journey.

User Profile: ${profile ? JSON.stringify(profile) : 'New user'}
Challenge Type: ${challengeType}
Current Day: ${currentDay}

Design challenge that:
1. Builds on previous days
2. Matches user's readiness level
3. Incorporates multiple modalities
4. Provides clear action steps
5. Includes integration practices

Format as JSON with detailed challenge structure.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      return {
        title: `Day ${currentDay}: Deepening Your Practice`,
        description: "Today we focus on building awareness and creating positive change.",
        practices: ["Morning meditation", "Intention setting", "Evening reflection"],
        reflection: "How did today's practices feel for you?"
      };
    }
  }

  /**
   * 18. Generate AI-driven daily assessment (replaces pre-defined challenges)
   */
  async generateDailyAssessment(userId: string): Promise<any> {
    console.log(`Generating personalized daily assessment for user ${userId}`);
    
    try {
      // Get user context for AI analysis
      const context = await this.getUserProgressContext(userId);
      
      // Use AI to analyze user situation and determine optimal daily focus
      const aiAnalysis = await this.analyzeUserSituation(context);
      
      // Generate specific daily content based on analysis
      const dailyContent = await this.generateDailyContent(context, aiAnalysis);
      
      return {
        userId,
        currentFocus: aiAnalysis.currentFocus,
        reasoning: aiAnalysis.reasoning,
        dailyAssessment: dailyContent,
        nextSteps: aiAnalysis.nextSteps,
        progressIndicators: aiAnalysis.progressIndicators
      };
    } catch (error) {
      console.error("Error generating daily assessment:", error);
      throw error;
    }
  }

  /**
   * AI analyzes user's complete situation and determines optimal approach
   */
  private async analyzeUserSituation(context: any): Promise<any> {
    const prompt = `
You are an advanced AI coaching psychologist with expertise in 16+ therapeutic modalities including Joe Dispenza's quantum consciousness work, Neville Goddard's manifestation principles, Access Consciousness, EMDR, CBT, trauma-informed therapy, and somatic approaches.

ANALYZE this user's complete situation and determine the optimal coaching path:

USER PROFILE:
- Healing Readiness: ${context.profile?.healingReadiness}/10
- Primary Goals: ${JSON.stringify(context.profile?.primaryGoals)}
- Current Challenges: ${JSON.stringify(context.profile?.traumaAreas)}
- Resistance Patterns: ${JSON.stringify(context.profile?.resistancePatterns)}
- Motivation Triggers: ${JSON.stringify(context.profile?.motivationTriggers)}
- Support Needs: ${JSON.stringify(context.profile?.supportNeeds)}
- Learning Style: ${context.profile?.learningStyle}
- Communication Style: ${context.profile?.communicationStyle}

RECENT PROGRESS:
- Recent Sessions: ${context.recentSessions?.length || 0} sessions
- Emotional State: ${context.emotionalState}
- Last Response: ${JSON.stringify(context.lastAssessmentResponse)}

Based on this analysis, determine what this user should focus on TODAY. Say something like:

"Based on your current challenges with [specific issue] and your goal of [specific goal], we need to start with [specific focus area] because this will [specific benefit] and prepare you for [next steps]."

Respond in JSON format:
{
  "currentFocus": "specific focus area like 'Emotional Regulation' or 'Limiting Belief Clearing'",
  "reasoning": "detailed explanation starting with 'Based on your...' explaining why this is the optimal starting point",
  "therapeuticApproaches": ["approach1", "approach2", "approach3"],
  "nextSteps": "what this prepares them for in coming days/weeks",
  "progressIndicators": ["indicator1", "indicator2", "indicator3"]
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No response from AI");

      return JSON.parse(content);
    } catch (error) {
      console.error("Error in AI situation analysis:", error);
      return {
        currentFocus: "Foundational Stability",
        reasoning: "Based on your current situation, we need to start with foundational emotional stability because this will create a solid base for all future growth and prepare you for deeper transformational work.",
        therapeuticApproaches: ["CBT", "Breathing Techniques", "Mindfulness"],
        nextSteps: "Building resilience for deeper consciousness work",
        progressIndicators: ["Improved daily mood", "Better stress response", "Increased self-awareness"]
      };
    }
  }

  /**
   * Generate specific daily content based on AI analysis
   */
  private async generateDailyContent(context: any, analysis: any): Promise<any> {
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
  "id": "daily_assessment_${Date.now()}",
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
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No response from AI");

      return JSON.parse(content);
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
  private async getUserProgressContext(userId: string): Promise<any> {
    try {
      // Get user profile
      const { storage } = await import('./storage');
      const profile = await storage.getAICouchProfile(userId);

      // Get recent sessions (last 7 days)
      const [recentSessions] = await db
        .select()
        .from(aiCouchSessions)
        .where(eq(aiCouchSessions.userId, userId))
        .orderBy(desc(aiCouchSessions.createdAt))
        .limit(10);

      return {
        profile,
        recentSessions: recentSessions || [],
        currentChallenges: Array.isArray(profile?.traumaAreas) ? profile.traumaAreas : [],
        emotionalState: recentSessions?.emotionalState || 'neutral',
        lastAssessmentResponse: recentSessions || null
      };
    } catch (error) {
      console.error("Error getting user context:", error);
      return {
        profile: null,
        recentSessions: [],
        currentChallenges: [],
        emotionalState: 'neutral',
        lastAssessmentResponse: null
      };
    }
  }

  /**
   * Process daily check-in and adapt future content
   */
  async processDailyCheckIn(userId: string, responses: any): Promise<any> {
    console.log(`Processing daily check-in for user ${userId}`);
    
    const context = await this.getUserProgressContext(userId);
    
    const prompt = `
The user has completed their daily assessment. Based on their responses, provide insights for tomorrow's adaptation.

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
  "emotionalShifts": "what changed today",
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
   * 19. Create personalized challenge plan
   */
  async createPersonalizedChallengePlan(userId: string): Promise<any> {
    const [profile] = await db.select()
      .from(aiCouchProfiles)
      .where(eq(aiCouchProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      throw new Error('User profile not found');
    }

    const prompt = `Create comprehensive personalized challenge plan.

User Profile Analysis:
- Primary Goals: ${profile.primaryGoals}
- Current Challenges: ${profile.currentChallenges}
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.personalityType}
- Communication Style: ${profile.communicationStyle}
- Learning Style: ${profile.learningStyle}

Design a comprehensive plan that adapts to this user's specific profile and needs.
Format as detailed JSON plan with daily progression.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      let planData = {};
      try {
        planData = JSON.parse(content || '{}');
      } catch {
        planData = {};
      }

      const [plan] = await db.insert(personalizedChallengePlans).values({
        userId,
        profileId: profile.id,
        planType: profile.personalityType || 'mixed',
        totalDays: 30,
        currentDay: 1,
        planData: JSON.stringify(planData),
        isActive: true
      }).returning();

      return {
        success: true,
        plan,
        planData
      };
    } catch (error) {
      console.error('Challenge plan creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const aiCouchEngine = new AiCouchEngine();