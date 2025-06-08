import { openaiClient } from './openai-http-client';
import { db } from './db';
import { eq, desc } from 'drizzle-orm';
import { IntelligentModelRouter } from './intelligent-model-router';

/**
 * Advanced AI Couch Engine with full sophisticated features
 */
export class AiCouchEngine {
  private modelRouter = new IntelligentModelRouter();

  /**
   * Generate personalized response using AI - Main coaching interface
   * Now uses intelligent GPT-4o/GPT-4o-mini routing for cost optimization
   */
  async generatePersonalizedResponse(
    userId: string,
    userInput: string,
    context: string = '',
    sessionType: string = 'general'
  ): Promise<any> {
    const systemPrompt = `You are AI Couch, a sophisticated consciousness coach integrating:
- Joe Dispenza's quantum consciousness and neuroplasticity work
- Neville Goddard's imagination and manifestation principles
- Access Consciousness tools and question-based coaching
- Trauma-informed therapeutic approaches (EMDR, somatic therapy)
- Cognitive Behavioral Therapy and mindfulness practices
- Energy healing and chakra balancing techniques
- Breathwork and nervous system regulation
- Advanced pattern recognition and shadow work

Automatically select and integrate 3-5 therapeutic approaches that best serve the user's needs.`;

    const prompt = `${systemPrompt}

USER CONTEXT: ${context}
SESSION TYPE: ${sessionType}
USER INPUT: ${userInput}

Provide a comprehensive coaching response that automatically integrates multiple therapeutic modalities, addresses underlying patterns, offers practical techniques, and includes consciousness expansion practices.`;

    try {
      // Use intelligent model routing for cost optimization
      const analysis = this.modelRouter.analyzeQuery(userInput);
      const routingDecision = this.modelRouter.makeRoutingDecision(analysis);
      const routedResponse = await this.modelRouter.executeWithModel(
        routingDecision,
        systemPrompt,
        prompt,
        { temperature: 0.7, maxTokens: 2000 }
      );

      return {
        response: routedResponse.response,
        type: 'ai_coaching',
        timestamp: new Date().toISOString(),
        sessionType,
        modelUsed: routedResponse.modelUsed,
        cost: routedResponse.actualCost,
        routingDecision: routedResponse.routingDecision,
        modalities_used: this.detectUsedModalities(routedResponse.response || ''),
        emotional_tone: this.detectEmotionalTone(userInput),
        patterns_detected: this.detectPatterns(userInput)
      };
    } catch (error) {
      console.error('AI Coaching Error:', error);
      throw error;
    }
  }

  /**
   * Create comprehensive user profile through initial assessment
   */
  async createUserProfile(userId: string, assessmentData: {
    personalityResponses: any[];
    traumaAssessment: any[];
    goalsAndIntentions: any[];
    preferredApproach: 'scientific' | 'spiritual' | 'mixed';
    communicationStyle: 'gentle' | 'direct' | 'motivational';
  }): Promise<any> {
    const prompt = `Create a comprehensive psychological and consciousness profile based on this assessment data:

PERSONALITY RESPONSES: ${JSON.stringify(assessmentData.personalityResponses)}
TRAUMA ASSESSMENT: ${JSON.stringify(assessmentData.traumaAssessment)}
GOALS AND INTENTIONS: ${JSON.stringify(assessmentData.goalsAndIntentions)}
PREFERRED APPROACH: ${assessmentData.preferredApproach}
COMMUNICATION STYLE: ${assessmentData.communicationStyle}

Generate a detailed profile including:
- Personality archetype and learning style
- Trauma-informed considerations and healing readiness
- Dominant mindset patterns and resistance areas
- Motivation triggers and support needs
- Recommended therapeutic modalities
- Personalized growth pathway recommendations

Provide response in JSON format with structured insights.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Profile creation error:', error);
      throw error;
    }
  }

  /**
   * Generate personalized challenge plan based on user profile
   */
  async generatePersonalizedChallenge(
    userId: string,
    userProfile: any,
    challengeType: string,
    duration: number = 21
  ): Promise<any> {
    const prompt = `Generate a comprehensive ${duration}-day personalized challenge plan for ${challengeType}.

USER PROFILE: ${JSON.stringify(userProfile)}

Create a sophisticated challenge that includes:
- Daily adaptive activities with quantum consciousness principles
- Trauma-informed progression that honors user's healing journey
- Multi-dimensional growth targeting mind, body, spirit integration
- Progressive difficulty scaling with built-in adaptation points
- Crisis support protocols and safety considerations
- Breakthrough moment recognition and celebration rituals
- Advanced pattern recognition triggers for real-time adaptation

Provide complete JSON structure with daily activities, assessment checkpoints, and adaptive elements.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Challenge generation error:', error);
      throw error;
    }
  }

  /**
   * Generate daily adaptive activity based on user progress and state
   */
  async generateDailyActivity(
    userId: string,
    planId: number,
    currentDay: number,
    userState: any,
    progressData: any
  ): Promise<any> {
    const prompt = `Generate today's adaptive activity for Day ${currentDay}.

USER STATE: ${JSON.stringify(userState)}
PROGRESS DATA: ${JSON.stringify(progressData)}

Create a personalized activity that:
- Adapts to current emotional and energy state
- Builds on previous days' breakthroughs and insights
- Incorporates quantum consciousness and manifestation principles
- Includes trauma-informed modifications if needed
- Provides multiple difficulty levels and adaptation options
- Offers crisis support alternatives if user is struggling
- Includes specific techniques from multiple therapeutic modalities

Provide detailed activity structure with step-by-step guidance, expected outcomes, and adaptation triggers.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Daily activity generation error:', error);
      throw error;
    }
  }

  /**
   * Conduct AI coaching session - main conversation interface
   */
  async conductCoachingSession(
    userId: string,
    userInput: string,
    sessionContext: any,
    userProfile: any,
    conversationHistory: any[]
  ): Promise<any> {
    const systemPrompt = `You are AI Couch, an advanced consciousness coach integrating:

- Joe Dispenza's quantum field and neuroplasticity work
- Neville Goddard's imagination and manifestation principles
- Access Consciousness tools and question-based coaching
- Trauma-informed therapeutic approaches (EMDR, somatic therapy)
- Cognitive Behavioral Therapy (CBT) and mindfulness practices
- Energy healing and chakra balancing techniques
- Breathwork and nervous system regulation
- Jungian psychology and shadow work
- Positive psychology and strengths-based coaching

You have access to 16+ therapeutic modalities and automatically select 3-5 approaches that best serve each user's specific needs without requiring them to choose.`;

    const prompt = `${systemPrompt}

USER PROFILE: ${JSON.stringify(userProfile)}
SESSION CONTEXT: ${JSON.stringify(sessionContext)}
CONVERSATION HISTORY: ${JSON.stringify(conversationHistory.slice(-5))}
USER INPUT: ${userInput}

Provide a comprehensive coaching response that:
- Automatically integrates multiple therapeutic approaches
- Addresses underlying patterns and core beliefs
- Offers practical techniques and homework
- Includes energy and somatic awareness
- Provides trauma-informed guidance when appropriate
- Suggests manifestation and consciousness practices
- Offers crisis support if needed
- Recognizes and celebrates breakthroughs

Response should be conversational, deeply personalized, and transformative.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        response: response.choices[0].message.content,
        timestamp: new Date().toISOString(),
        modalities_used: this.detectUsedModalities(response.choices[0].message.content || ''),
        emotional_tone: this.detectEmotionalTone(userInput),
        follow_up_needed: this.assessFollowUpNeed(userInput),
        patterns_detected: this.detectPatterns(userInput)
      };
    } catch (error) {
      console.error('Coaching session error:', error);
      throw error;
    }
  }

  /**
   * Dynamic Assessment Engine - Continuously evaluates user progress and adaptation needs
   */
  async performDynamicAssessment(userId: string) {
    const prompt = `Perform comprehensive dynamic assessment for continuous adaptation:

Analyze user's:
- Current emotional state and energy patterns
- Learning velocity and integration capacity
- Resistance patterns and breakthrough readiness
- Optimal challenge difficulty and pacing
- Support needs and crisis risk factors
- Multidisciplinary approach effectiveness
- Consciousness expansion markers

Provide detailed assessment with specific adaptation recommendations.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Dynamic assessment error:', error);
      throw error;
    }
  }

  /**
   * Modular Challenge Block System - Creates adaptive challenge components
   */
  async generateModularChallengeBlocks(
    userProfile: any,
    challengeType: string,
    duration: number,
    expertDomains: string[]
  ) {
    const prompt = `Generate modular challenge blocks for ${challengeType} over ${duration} days.

USER PROFILE: ${JSON.stringify(userProfile)}
EXPERT DOMAINS: ${JSON.stringify(expertDomains)}

Create interconnected challenge modules that:
- Each focus on specific therapeutic modalities
- Build progressively in complexity and depth
- Include adaptation points and difficulty scaling
- Provide crisis support alternatives
- Enable real-time recombination based on user response
- Include breakthrough celebration and integration rituals

Provide structured JSON with modular components that can be dynamically assembled.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Modular challenge generation error:', error);
      throw error;
    }
  }

  /**
   * Real-time Adaptation Engine - Daily recalibration based on user responses
   */
  async performRealTimeAdaptation(userId: string, todaysInputs: any) {
    const prompt = `Perform real-time adaptation analysis based on today's user inputs:

TODAY'S DATA: ${JSON.stringify(todaysInputs)}

Analyze and adapt:
- Emotional state changes and energy fluctuations
- Resistance patterns and breakthrough indicators
- Learning style preferences and optimal delivery methods
- Challenge difficulty and pacing adjustments needed
- Support level modifications and crisis prevention
- Therapeutic modality effectiveness and recommendations
- Tomorrow's optimal focus areas and techniques

Provide specific adaptation instructions and reasoning.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Real-time adaptation error:', error);
      throw error;
    }
  }

  /**
   * Multi-Layer Personality Profiling - Deep psychological and learning assessment
   */
  async performMultiLayerPersonalityProfiling(userId: string, assessmentInputs: any) {
    const prompt = `Perform comprehensive multi-layer personality profiling:

ASSESSMENT INPUTS: ${JSON.stringify(assessmentInputs)}

Analyze across multiple dimensions:
- Cognitive patterns (analytical, intuitive, creative, practical)
- Emotional intelligence and regulation patterns
- Behavioral tendencies and action orientation
- Learning style preferences and information processing
- Trauma patterns and healing readiness levels
- Spiritual/consciousness development stage
- Motivation systems and values alignment
- Shadow aspects and integration opportunities
- Strengths and growth edge identification

Provide detailed psychological profile with therapeutic recommendations.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Personality profiling error:', error);
      throw error;
    }
  }

  /**
   * Predictive Guidance System - Anticipates user needs before they're conscious
   */
  async generatePredictiveGuidance(userId: string) {
    const prompt = `Generate predictive guidance based on pattern analysis:

Predict and prepare for:
- Upcoming resistance patterns and breakthrough windows
- Optimal timing for advanced techniques and deeper work
- Potential crisis points and prevention strategies
- Learning plateau periods and acceleration opportunities
- Integration challenges and support needs
- Shadow material emergence and processing guidance
- Manifestation blocks and breakthrough catalysts

Provide predictive insights with proactive recommendations and timing guidance.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Predictive guidance error:', error);
      throw error;
    }
  }

  /**
   * Multidisciplinary Expert Assessment - Determines which therapeutic approaches to apply
   */
  async performMultidisciplinaryAssessment(
    userInput: string,
    userProfile: any,
    sessionContext: any
  ) {
    const prompt = `Perform expert assessment to determine optimal therapeutic approaches:

USER INPUT: ${userInput}
USER PROFILE: ${JSON.stringify(userProfile)}
SESSION CONTEXT: ${JSON.stringify(sessionContext)}

Available therapeutic modalities:
- CBT, DBT, EMDR, Somatic Therapy, Psychodynamic
- Mindfulness, Meditation, Breathwork, Energy Healing
- Quantum Consciousness, Manifestation, Access Consciousness
- Trauma-Informed Care, Crisis Intervention
- Positive Psychology, Life Coaching, Relationship Counseling

Select 3-5 optimal approaches and provide:
- Primary modality with detailed reasoning
- Supporting modalities and integration strategy
- Specific techniques and interventions
- Expected outcomes and progress markers
- Contraindications and safety considerations

Provide expert assessment with therapeutic recommendations.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Multidisciplinary assessment error:', error);
      throw error;
    }
  }

  /**
   * Expert Knowledge Integration System - Apply specific methodologies
   */
  async applyExpertKnowledgeIntegration(
    expertDomains: string[],
    userProfile: any,
    currentIssues: string[]
  ) {
    const prompt = `Apply expert knowledge integration across domains:

EXPERT DOMAINS: ${JSON.stringify(expertDomains)}
USER PROFILE: ${JSON.stringify(userProfile)}
CURRENT ISSUES: ${JSON.stringify(currentIssues)}

Integrate knowledge from selected domains:
- Create unified intervention strategy
- Blend techniques from multiple modalities
- Address potential conflicts between approaches
- Sequence interventions for optimal effectiveness
- Provide integration practices and homework
- Monitor for contraindications and adjustments needed

Provide comprehensive integration plan with specific protocols.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Expert integration error:', error);
      throw error;
    }
  }

  /**
   * Advanced Pattern Recognition with Emotional Intelligence
   */
  async performAdvancedPatternRecognition(userId: string) {
    const prompt = `Perform advanced pattern recognition analysis:

Identify patterns across:
- Emotional cycles and trigger sequences
- Behavioral patterns and decision-making tendencies
- Energy fluctuations and optimal performance windows
- Resistance patterns and breakthrough catalysts
- Learning patterns and integration rhythms
- Relationship dynamics and projection patterns
- Consciousness expansion markers and integration challenges
- Shadow material emergence and processing patterns

Provide detailed pattern analysis with intervention recommendations.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Pattern recognition error:', error);
      throw error;
    }
  }

  /**
   * Generate morning prompt for daily companion functionality
   */
  async generateMorningPrompt(userId: string) {
    const prompt = `Generate personalized morning consciousness activation:

Create a morning practice that:
- Connects user to quantum field and infinite possibilities
- Sets powerful intentions for manifestation
- Activates higher consciousness and awareness
- Provides energy alignment and nervous system regulation
- Includes gratitude and appreciation practices
- Offers specific techniques for the day ahead

Provide inspiring, personalized morning guidance.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        response: response.choices[0].message.content,
        type: 'morning_prompt',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Morning prompt error:', error);
      throw error;
    }
  }

  /**
   * Generate evening reflection for daily companion functionality
   */
  async generateEveningReflection(userId: string, dayExperiences?: string) {
    const prompt = `Generate personalized evening reflection and integration:

${dayExperiences ? `DAY EXPERIENCES: ${dayExperiences}` : ''}

Create evening practice that:
- Processes and integrates the day's experiences
- Celebrates breakthroughs and acknowledges challenges
- Clears energy and releases what no longer serves
- Prepares consciousness for overnight integration
- Sets intentions for tomorrow's possibilities
- Includes gratitude and self-compassion practices

Provide nurturing, integrative evening guidance.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        response: response.choices[0].message.content,
        type: 'evening_reflection',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Evening reflection error:', error);
      throw error;
    }
  }

  /**
   * Generate weekly psychological pattern summary
   */
  async generateWeeklyPatternSummary(userId: string) {
    const prompt = `Generate comprehensive weekly pattern analysis and insights:

Analyze this week's:
- Growth patterns and breakthrough moments
- Resistance areas and integration challenges
- Emotional patterns and energy fluctuations
- Learning velocity and consciousness expansion
- Behavioral changes and habit formation
- Manifestation progress and alignment
- Next week's focus areas and opportunities

Provide insightful weekly summary with forward-looking guidance.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        response: response.choices[0].message.content,
        type: 'weekly_summary',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Weekly summary error:', error);
      throw error;
    }
  }

  /**
   * Crisis support mode - enhanced empathy and grounding techniques
   */
  async provideCrisisSupport(userId: string, crisisInput: string, severityLevel: 1 | 2 | 3 | 4 | 5) {
    const prompt = `Provide immediate, compassionate crisis support:

CRISIS INPUT: ${crisisInput}
SEVERITY LEVEL: ${severityLevel}/5

Provide:
- Immediate grounding and safety techniques
- Nervous system regulation and stabilization
- Trauma-informed crisis intervention
- Professional resource recommendations
- Follow-up support protocols
- Emergency contact guidance if needed

Prioritize safety, stabilization, and professional support referrals.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        response: response.choices[0].message.content,
        type: 'crisis_support',
        severityLevel,
        timestamp: new Date().toISOString(),
        priority: 'urgent'
      };
    } catch (error) {
      console.error('Crisis support error:', error);
      throw error;
    }
  }

  /**
   * Advanced therapeutic intervention generator
   */
  async generateTherapeuticIntervention(
    interventionType: string,
    targetPattern: string,
    userContext: any
  ) {
    const prompt = `Generate advanced therapeutic intervention:

INTERVENTION TYPE: ${interventionType}
TARGET PATTERN: ${targetPattern}
USER CONTEXT: ${JSON.stringify(userContext)}

Create sophisticated intervention that:
- Integrates multiple therapeutic modalities
- Addresses core beliefs and unconscious patterns
- Includes somatic and energetic components
- Provides specific techniques and homework
- Offers progress markers and adaptation points
- Includes crisis support alternatives

Provide detailed therapeutic intervention protocol.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Therapeutic intervention error:', error);
      throw error;
    }
  }

  /**
   * Helper methods for data retrieval and analysis
   */
  private async getUserProfile(userId: string) {
    // Implementation for retrieving user profile from database
    return {};
  }

  private async getRecentJournalEntries(userId: string, days: number) {
    // Implementation for retrieving recent journal entries
    return [];
  }

  private async getRecentSessions(userId: string, count: number) {
    // Implementation for retrieving recent coaching sessions
    return [];
  }

  private async getCurrentPlan(userId: string) {
    // Implementation for retrieving current challenge plan
    return null;
  }

  private async getPersonalizedPlan(planId: number) {
    // Implementation for retrieving specific personalized plan
    return null;
  }

  private detectEmotionalTone(input: string): string {
    // Advanced emotional tone detection
    if (input.toLowerCase().includes('crisis') || input.toLowerCase().includes('emergency')) {
      return 'crisis';
    }
    if (input.toLowerCase().includes('excited') || input.toLowerCase().includes('breakthrough')) {
      return 'elevated';
    }
    return 'neutral';
  }

  private detectPatterns(input: string): string[] {
    // Advanced pattern detection
    const patterns = [];
    if (input.toLowerCase().includes('always') || input.toLowerCase().includes('never')) {
      patterns.push('absolute_thinking');
    }
    if (input.toLowerCase().includes('should') || input.toLowerCase().includes('must')) {
      patterns.push('perfectionism');
    }
    return patterns;
  }

  private assessFollowUpNeed(input: string): boolean {
    // Assessment of whether follow-up is needed
    const crisisKeywords = ['help', 'crisis', 'emergency', 'suicide', 'harm'];
    return crisisKeywords.some(keyword => input.toLowerCase().includes(keyword));
  }

  private detectUsedModalities(response: string): string[] {
    // Detection of therapeutic modalities used in response
    const modalities = [];
    if (response.includes('breath') || response.includes('breathing')) {
      modalities.push('breathwork');
    }
    if (response.includes('visualization') || response.includes('imagine')) {
      modalities.push('visualization');
    }
    if (response.includes('thought') || response.includes('belief')) {
      modalities.push('cognitive_restructuring');
    }
    return modalities;
  }
}

export const aiCouchEngine = new AiCouchEngine();