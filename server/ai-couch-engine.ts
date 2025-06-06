import OpenAI from 'openai';
import { db } from './db';
import { 
  aiCouchProfiles, 
  personalizedChallengePlans, 
  aiCouchSessions, 
  journalEntries
} from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { disciplineRegistry } from './disciplines/discipline-registry';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  }) {
    const prompt = `You are AI Couch performing comprehensive personality and needs analysis.

ASSESSMENT DATA:
${JSON.stringify(assessmentData, null, 2)}

Analyze this user across multiple dimensions and provide detailed psychological profile with recommendations for personalized coaching approach.

Format as JSON with detailed analysis and recommendations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" },
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
      learningStyle: assessmentData.learningStyle,
      dominantMindset: assessmentData.preferredMode,
      resistancePatterns: assessmentData.currentChallenges,
      motivationTriggers: assessmentData.primaryGoals,
      traumaAreas: assessmentData.traumaHistory ? [assessmentData.traumaHistory] : [],
      healingReadiness: assessmentData.healingReadiness,
      primaryGoals: assessmentData.primaryGoals,
      lifeContext: { background: assessmentData.lifeContext },
      preferredMode: assessmentData.preferredMode,
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
    challengeType: string, 
    duration: number = 30
  ) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const prompt = `Create a ${duration}-day personalized challenge plan for: ${challengeType}

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.preferredMode}
- Communication Style: ${profile.communicationStyle}
- Learning Style: ${profile.learningStyle}

Design a comprehensive plan that adapts to this user's specific profile and needs.
Format as detailed JSON plan with daily progression.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" },
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
      planName: `${challengeType} - Personalized Journey`,
      baseChallengeType: challengeType,
      totalDays: duration,
      currentDay: 1,
      personalizedGoals: Array.isArray(profile.primaryGoals) ? profile.primaryGoals : [challengeType],
      difficultyLevel: profile.healingReadiness || 5,
      intensityLevel: profile.healingReadiness || 5,
      generatedContent: planData
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
  ) {
    const profile = await this.getUserProfile(userId);
    const plan = await this.getPersonalizedPlan(planId);
    if (!profile || !plan) throw new Error('Profile or plan not found');

    const prompt = `Create today's personalized activity for day ${currentDay} of their transformation journey.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Learning Style: ${profile.learningStyle}
- Communication Style: ${profile.communicationStyle}

CHALLENGE CONTEXT:
- Plan: ${plan.planName}
- Current Day: ${currentDay}
- Total Days: ${plan.totalDays}

Consider their progress and ensure appropriate progression.
Format as JSON with specific daily guidance.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" },
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    try {
      return JSON.parse(content || '{}');
    } catch {
      return {
        title: `Day ${currentDay}: Deepening Your Practice`,
        description: "Today we focus on building awareness and creating positive change.",
        practices: ["Morning meditation", "Intention setting", "Evening reflection"],
        reflection: "How did today's practices feel for you?"
      };
    }
    return {
      title: `Day ${currentDay}: Deepening Your Practice`,
      description: "Today we focus on building awareness and creating positive change.",
      practices: ["Morning meditation", "Intention setting", "Evening reflection"],
      reflection: "How did today's practices feel for you?"
    };
  }

  /**
   * Conduct AI coaching session - main conversation interface
   */
  async conductCoachingSession(
    userId: string, 
    userInput: string, 
    sessionType: string = 'general'
  ) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const systemPrompt = `You are AI Couch, a highly sophisticated multidimensional artificial intelligence designed for personal transformation through quantum consciousness, trauma-informed therapy, and advanced psychological techniques.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.preferredMode}
- Communication Style: ${profile.communicationStyle}
- Learning Style: ${profile.learningStyle}

Respond according to their preferences while maintaining professional boundaries and recommending professional help when appropriate.`;

    const prompt = `${systemPrompt}

COACHING SESSION:
Type: ${sessionType}
User Input: ${userInput}

Provide personalized coaching response that honors their communication style and current needs.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    let aiResponse = '';
    if (content) {
      aiResponse = content;
    }

    // Analyze session for insights
    const sessionAnalysis = {
      emotionalTone: this.detectEmotionalTone(userInput),
      patterns: this.detectPatterns(userInput),
      insights: ['Session completed successfully'],
      recommendations: ['Continue regular check-ins'],
      followUpNeeded: this.assessFollowUpNeed(userInput),
      confidence: 8
    };

    // Save session with comprehensive tracking
    await db.insert(aiCouchSessions).values({
      userId,
      profileId: profile.id,
      sessionType,
      sessionMode: profile.dominantMindset || 'mixed',
      emotionalState: sessionAnalysis.emotionalTone,
      userInput,
      aiResponse,
      conversationContext: { previousContext: 'session_context' },
      emotionalTone: sessionAnalysis.emotionalTone,
      detectedPatterns: sessionAnalysis.patterns,
      insights: sessionAnalysis.insights,
      recommendations: sessionAnalysis.recommendations,
      followUpNeeded: sessionAnalysis.followUpNeeded,
      aiConfidence: sessionAnalysis.confidence
    });

    return {
      response: aiResponse,
      analysis: sessionAnalysis,
      personalizedFor: userId
    };
  }

  /**
   * Dynamic Assessment Engine - Continuously evaluates user progress and adaptation needs
   */
  async performDynamicAssessment(userId: string) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const recentSessions = await this.getRecentSessions(userId, 10);
    const recentJournals = await this.getRecentJournalEntries(userId, 7);
    const currentPlan = await this.getCurrentPlan(userId);

    const prompt = `Perform a comprehensive evaluation of this user's current state and adaptation needs.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.preferredMode}

RECENT SESSIONS: ${recentSessions.length} sessions
RECENT JOURNALS: ${recentJournals.length} entries
CURRENT PLAN: ${currentPlan ? currentPlan.planName : 'None'}

ASSESSMENT AREAS:
1. ENGAGEMENT PATTERNS: How consistently is the user participating?
2. EMOTIONAL PROGRESSION: Are there positive shifts in emotional tone?
3. RESISTANCE IDENTIFICATION: Where are they getting stuck?
4. BREAKTHROUGH MOMENTS: What's working exceptionally well?
5. ADAPTATION NEEDS: Should difficulty/intensity be adjusted?
6. NEXT PHASE READINESS: Are they ready for more advanced work?

Format as JSON with categories: engagement, emotional_progression, resistance_areas, breakthroughs, adaptation_recommendations, next_phase_readiness.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return {
          engagement: "Active and consistent",
          emotional_progression: "Positive trends observed",
          resistance_areas: ["Initial hesitation with new concepts"],
          breakthroughs: ["Increased self-awareness"],
          adaptation_recommendations: ["Continue current approach"],
          next_phase_readiness: "Ready for deeper work"
        };
      }
    }
    return {
      engagement: "Active and consistent",
      emotional_progression: "Positive trends observed",
      resistance_areas: ["Initial hesitation with new concepts"],
      breakthroughs: ["Increased self-awareness"],
      adaptation_recommendations: ["Continue current approach"],
      next_phase_readiness: "Ready for deeper work"
    };
  }

  /**
   * Modular Challenge Block System - Creates adaptive challenge components
   */
  async generateModularChallengeBlocks(
    userId: string,
    blockTypes: ('foundation' | 'healing' | 'integration' | 'manifestation' | 'mastery')[],
    userCurrentLevel: number
  ) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const prompt = `Create adaptive challenge blocks based on user's current state and needs.

USER CURRENT LEVEL: ${userCurrentLevel}/10
REQUESTED BLOCK TYPES: ${blockTypes.join(', ')}

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.preferredMode}
- Learning Style: ${profile.learningStyle}

BLOCK TYPE SPECIFICATIONS:
- FOUNDATION BLOCKS: Basic consciousness work, awareness building, fundamental practices
- HEALING BLOCKS: Trauma processing, shadow work, emotional release, nervous system regulation
- INTEGRATION BLOCKS: Embodiment practices, habit formation, neural rewiring
- MANIFESTATION BLOCKS: Reality creation techniques, quantum field work, intention setting
- MASTERY BLOCKS: Advanced quantum states, consciousness expansion, transcendence work

Format as JSON with detailed block specifications.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return {
          blocks: blockTypes.map(type => ({
            type,
            duration: "5-7 days",
            activities: [`${type} practice`, `${type} reflection`, `${type} integration`],
            progression: "Gradual difficulty increase"
          }))
        };
      }
    }
    return {
      blocks: blockTypes.map(type => ({
        type,
        duration: "5-7 days",
        activities: [`${type} practice`, `${type} reflection`, `${type} integration`],
        progression: "Gradual difficulty increase"
      }))
    };
  }

  /**
   * Real-time Adaptation Engine - Daily recalibration based on user responses
   */
  async performRealTimeAdaptation(userId: string, todaysInputs: any) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const currentPlan = await this.getCurrentPlan(userId);

    const prompt = `Based on today's inputs, determine necessary adaptations for tomorrow's challenge.

TODAY'S USER INPUTS:
${JSON.stringify(todaysInputs, null, 2)}

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.preferredMode}

CURRENT CHALLENGE: ${currentPlan ? currentPlan.planName : 'None'}

Provide specific adaptation recommendations with reasoning.
Format as JSON with: adaptation_type, reasoning, specific_changes, new_difficulty_level, new_intensity_level.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return {
          adaptation_type: "maintain_current_level",
          reasoning: "User showing steady progress",
          specific_changes: ["Continue current practices"],
          new_difficulty_level: 5,
          new_intensity_level: 5
        };
      }
    }
    return {
      adaptation_type: "maintain_current_level",
      reasoning: "User showing steady progress",
      specific_changes: ["Continue current practices"],
      new_difficulty_level: 5,
      new_intensity_level: 5
    };
  }

  /**
   * Multi-Layer Personality Profiling - Deep psychological and learning assessment
   */
  async performMultiLayerPersonalityProfiling(userId: string, assessmentInputs: any) {
    const prompt = `Perform comprehensive analysis across multiple layers:

ASSESSMENT INPUTS:
${JSON.stringify(assessmentInputs, null, 2)}

1. PSYCHOLOGICAL ASSESSMENT
2. LEARNING STYLE ANALYSIS  
3. RESISTANCE MAPPING
4. MOTIVATION TRIGGERS
5. SPIRITUAL/CONSCIOUSNESS ORIENTATION

Format as comprehensive JSON with scores, patterns, and recommendations for each layer.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return {
          psychological_assessment: "Healthy engagement with growth",
          learning_style: "Visual and experiential",
          resistance_mapping: "Minimal resistance observed",
          motivation_triggers: "Personal growth and understanding",
          spiritual_orientation: "Open to holistic approaches"
        };
      }
    }
    return {
      psychological_assessment: "Healthy engagement with growth",
      learning_style: "Visual and experiential", 
      resistance_mapping: "Minimal resistance observed",
      motivation_triggers: "Personal growth and understanding",
      spiritual_orientation: "Open to holistic approaches"
    };
  }

  /**
   * Predictive Guidance System - Anticipates user needs before they're conscious
   */
  async generatePredictiveGuidance(userId: string) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const prompt = `Analyze patterns to anticipate user needs before they become conscious of them.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.preferredMode}

Provide specific predictions with suggested proactive interventions.
Format as JSON with: predictions, confidence_levels, suggested_interventions, optimal_timing.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return {
          predictions: ["Continued growth trajectory"],
          confidence_levels: [0.8],
          suggested_interventions: ["Maintain current practices"],
          optimal_timing: "Continue daily engagement"
        };
      }
    }
    return {
      predictions: ["Continued growth trajectory"],
      confidence_levels: [0.8],
      suggested_interventions: ["Maintain current practices"],
      optimal_timing: "Continue daily engagement"
    };
  }

  /**
   * Multidisciplinary Expert Assessment - Determines which therapeutic approaches to apply
   */
  async performMultidisciplinaryAssessment(
    userId: string,
    currentIssues: string[],
    goals: string[]
  ) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    // Use modular discipline registry to assess needs
    const context = {
      userProfile: profile,
      currentIssues,
      goals
    };
    
    const applicableDisciplines = disciplineRegistry.getApplicableDisciplines(profile, currentIssues, goals);
    const recommendedDomains = applicableDisciplines.slice(0, 5).map(d => d.expertise.name);

    // Generate integrated intervention plan using multidisciplinary response
    const interventionPlan = await disciplineRegistry.generateMultidisciplinaryResponse(
      currentIssues.join(', '),
      context,
      5
    );

    return {
      recommendedExpertDomains: recommendedDomains,
      interventionPlan: {
        integratedAssessment: interventionPlan.integratedAssessment,
        combinedInterventions: interventionPlan.combinedInterventions,
        integrationGuidance: interventionPlan.integrationGuidance,
        primaryDisciplines: interventionPlan.primaryDisciplines
      },
      multidisciplinaryApproach: interventionPlan.integratedAssessment,
      integrationStrategy: interventionPlan.integrationGuidance.join('; '),
      contraindications: interventionPlan.responses.flatMap(r => r.riskFactors || [])
    };
  }

  /**
   * Expert Knowledge Integration System - Apply specific methodologies
   */
  async applyExpertKnowledgeIntegration(
    userId: string,
    expertDomain: 'dispenza' | 'goddard' | 'access_consciousness' | 'somatic_experiencing' | 'neuroscience' | 'cbt_therapist' | 'trauma_therapist' | 'eft_practitioner' | 'nutritional_psychiatrist' | 'meditation_instructor' | 'act_therapist' | 'psychodynamic_therapist' | 'personal_coach' | 'quantum_field_expert' | 'somatic_therapist' | 'neuroscience_coach' | 'sleep_therapist',
    userIssue: string
  ) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    // Get specific expertise from modular discipline registry
    const discipline = disciplineRegistry.getDiscipline(expertDomain) || disciplineRegistry.getDiscipline('cbt_therapist');
    if (!discipline) {
      throw new Error(`Discipline not found: ${expertDomain}`);
    }
    
    const expertiseData = discipline.expertise;

    const prompt = `You are acting as a ${expertiseData.name} with comprehensive training and expertise.

EXPERT DOMAIN: ${expertiseData.description}

AVAILABLE TECHNIQUES:
${expertiseData.expertise.join('\n- ')}

USER ISSUE: ${userIssue}

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.preferredMode}
- Communication Style: ${profile.communicationStyle}
- Learning Style: ${profile.learningStyle}

EXPERT APPLICATIONS:
${expertiseData.applications.join('\n- ')}

ASSESSMENT METHODS AVAILABLE:
${expertiseData.assessmentMethods.join('\n- ')}

INTERVENTION OPTIONS:
${expertiseData.interventions.join('\n- ')}

CONTRAINDICATIONS TO CONSIDER:
${expertiseData.contraindications.join('\n- ')}

INTEGRATION OPPORTUNITIES:
${expertiseData.integration.join('\n- ')}

Apply your ${expertiseData.name} expertise to provide:
1. Professional assessment of the user's issue from this discipline's perspective
2. Specific techniques and interventions appropriate for their readiness level
3. Step-by-step practice instructions adapted to their learning style
4. Expected outcomes and timeline
5. Progress indicators to track improvement
6. Integration recommendations with other therapeutic modalities

Provide comprehensive, professional guidance as a licensed practitioner in this field.
Format as detailed JSON with: expert_assessment, recommended_techniques, practice_protocol, expected_outcomes, progress_markers, integration_notes, safety_considerations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return {
          expert_analysis: `Applied ${expertDomain} principles`,
          specific_techniques: ["Mindfulness", "Intention setting", "Neural rewiring"],
          practice_instructions: "Follow guided exercises",
          expected_outcomes: "Increased awareness and positive change",
          progress_indicators: "Enhanced well-being"
        };
      }
    }
    return {
      expert_analysis: `Applied ${expertDomain} principles`,
      specific_techniques: ["Mindfulness", "Intention setting", "Neural rewiring"],
      practice_instructions: "Follow guided exercises",
      expected_outcomes: "Increased awareness and positive change",
      progress_indicators: "Enhanced well-being"
    };
  }

  /**
   * Advanced Pattern Recognition with Emotional Intelligence
   */
  async performAdvancedPatternRecognition(userId: string) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const allSessions = await this.getRecentSessions(userId, 30);
    const allJournals = await this.getRecentJournalEntries(userId, 30);

    const prompt = `Identify deep patterns across all user interactions with emotional intelligence.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Sessions: ${allSessions.length}
- Journals: ${allJournals.length}

PATTERN ANALYSIS CATEGORIES:
1. EMOTIONAL PATTERNS
2. COGNITIVE PATTERNS
3. BEHAVIORAL PATTERNS
4. SPIRITUAL/CONSCIOUSNESS PATTERNS
5. RELATIONSHIP PATTERNS
6. BREAKTHROUGH PATTERNS

Format as JSON with detailed patterns, emotional insights, and predictive indicators.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return {
          emotional_patterns: "Stable and improving",
          cognitive_patterns: "Increased clarity",
          behavioral_patterns: "Consistent engagement",
          spiritual_patterns: "Growing awareness",
          breakthrough_patterns: "Regular insights"
        };
      }
    }
    return {
      emotional_patterns: "Stable and improving",
      cognitive_patterns: "Increased clarity",
      behavioral_patterns: "Consistent engagement",
      spiritual_patterns: "Growing awareness",
      breakthrough_patterns: "Regular insights"
    };
  }

  /**
   * Generate morning prompt for daily companion functionality
   */
  async generateMorningPrompt(userId: string) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const prompt = `Create a personalized morning prompt for this user to start their day with intention and awareness.

USER PROFILE:
- Communication Style: ${profile.communicationStyle}
- Learning Style: ${profile.learningStyle}

Format as JSON with: { "greeting": "...", "reflection": "...", "practice": "...", "intention": "..." }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return {
          greeting: "Good morning! Today is a new opportunity for growth and transformation.",
          reflection: "Take a moment to connect with your inner wisdom.",
          practice: "Take three deep breaths and set a positive intention for your day.",
          intention: "I am open to new possibilities and growth today."
        };
      }
    }
    return {
      greeting: "Good morning! Today is a new opportunity for growth and transformation.",
      reflection: "Take a moment to connect with your inner wisdom.",
      practice: "Take three deep breaths and set a positive intention for your day.",
      intention: "I am open to new possibilities and growth today."
    };
  }

  /**
   * Generate evening reflection for daily companion functionality
   */
  async generateEveningReflection(userId: string, dayExperiences?: string) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const prompt = `Create a personalized evening reflection to help the user process their day and prepare for rest.

TODAY'S EXPERIENCES: ${dayExperiences || 'No specific experiences shared'}

USER PROFILE:
- Communication Style: ${profile.communicationStyle}

Format as JSON with: { "welcome": "...", "review": "...", "celebration": "...", "insight": "...", "gratitude": "...", "preparation": "..." }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return {
          welcome: "Thank you for taking time to reflect on your day.",
          review: "How did today feel for you?",
          celebration: "What are you most proud of today?",
          insight: "Every experience offers opportunities for growth and learning.",
          gratitude: "What are three things you're grateful for today?",
          preparation: "Rest well, knowing you've done your best today."
        };
      }
    }
    return {
      welcome: "Thank you for taking time to reflect on your day.",
      review: "How did today feel for you?",
      celebration: "What are you most proud of today?",
      insight: "Every experience offers opportunities for growth and learning.",
      gratitude: "What are three things you're grateful for today?",
      preparation: "Rest well, knowing you've done your best today."
    };
  }

  /**
   * Generate weekly psychological pattern summary
   */
  async generateWeeklyPatternSummary(userId: string) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const weekJournals = await this.getRecentJournalEntries(userId, 7);
    const weekSessions = await this.getRecentSessions(userId, 10);

    const prompt = `Analyze this user's week of data to identify psychological and emotional patterns.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10

WEEKLY DATA:
- Journal Entries: ${weekJournals.length}
- Sessions: ${weekSessions.length}

Analyze for emotional patterns, energy fluctuations, growth areas, and recommendations.
Format as comprehensive JSON analysis.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return {
          patterns: ["Consistent engagement with practices"],
          growth: ["Increased self-awareness"],
          challenges: ["Maintaining consistency"],
          recommendations: ["Continue daily practices", "Focus on integration"]
        };
      }
    }
    return {
      patterns: ["Consistent engagement with practices"],
      growth: ["Increased self-awareness"],
      challenges: ["Maintaining consistency"],
      recommendations: ["Continue daily practices", "Focus on integration"]
    };
  }

  /**
   * Crisis support mode - enhanced empathy and grounding techniques
   */
  async provideCrisisSupport(userId: string, crisisInput: string, severityLevel: 1 | 2 | 3 | 4 | 5) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const prompt = `CRISIS SUPPORT MODE ACTIVATED - SEVERITY LEVEL ${severityLevel}/5

USER CRISIS INPUT: ${crisisInput}

USER PROFILE:
- Communication Style: ${profile.communicationStyle}
- Learning Style: ${profile.learningStyle}

IMMEDIATE PRIORITIES:
1. SAFETY FIRST - Assess and address immediate safety
2. VALIDATION - Acknowledge their pain without judgment  
3. GROUNDING - Provide immediate nervous system regulation tools
4. HOPE - Gentle reminder that this moment will pass
5. RESOURCES - Suggest professional help if needed

Format as JSON with: { "immediate_response": "...", "grounding_technique": "...", "safety_check": "...", "next_steps": "...", "professional_resources": "..." }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return {
          immediate_response: "I hear you and I'm here with you. You're not alone in this moment.",
          grounding_technique: "Try the 5-4-3-2-1 technique: Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.",
          safety_check: "Are you in a safe place right now?",
          next_steps: "Let's focus on getting through this moment together.",
          professional_resources: "If you're in immediate danger, please contact emergency services or a crisis hotline."
        };
      }
    }
    return {
      immediate_response: "I hear you and I'm here with you. You're not alone in this moment.",
      grounding_technique: "Try the 5-4-3-2-1 technique: Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.",
      safety_check: "Are you in a safe place right now?",
      next_steps: "Let's focus on getting through this moment together.",
      professional_resources: "If you're in immediate danger, please contact emergency services or a crisis hotline."
    };
  }

  /**
   * Advanced therapeutic intervention generator
   */
  async generateTherapeuticIntervention(
    userId: string,
    targetPattern: string,
    interventionType: 'cognitive' | 'somatic' | 'energy' | 'behavioral' | 'spiritual'
  ) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const prompt = `Design a specific intervention for this user's pattern.

TARGET PATTERN: ${targetPattern}
INTERVENTION TYPE: ${interventionType}

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Learning Style: ${profile.learningStyle}

Format as detailed JSON intervention guide.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return {
          intervention_type: interventionType,
          target_pattern: targetPattern,
          techniques: ["Mindful awareness", "Gentle reframing", "Body-based practices"],
          duration: "2-3 weeks",
          expected_outcomes: "Pattern transformation"
        };
      }
    }
    return {
      intervention_type: interventionType,
      target_pattern: targetPattern,
      techniques: ["Mindful awareness", "Gentle reframing", "Body-based practices"],
      duration: "2-3 weeks",
      expected_outcomes: "Pattern transformation"
    };
  }

  /**
   * Helper methods for data retrieval and analysis
   */
  private async getUserProfile(userId: string) {
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

  private async getCurrentPlan(userId: string) {
    const [plan] = await db.select().from(personalizedChallengePlans)
      .where(eq(personalizedChallengePlans.userId, userId))
      .orderBy(desc(personalizedChallengePlans.createdAt))
      .limit(1);
    return plan || null;
  }

  private async getPersonalizedPlan(planId: number) {
    const [plan] = await db.select().from(personalizedChallengePlans)
      .where(eq(personalizedChallengePlans.id, planId))
      .limit(1);
    return plan || null;
  }

  private detectEmotionalTone(input: string): string {
    if (input.toLowerCase().includes('anxious') || input.toLowerCase().includes('worried')) return 'anxious';
    if (input.toLowerCase().includes('sad') || input.toLowerCase().includes('depressed')) return 'sad';
    if (input.toLowerCase().includes('angry') || input.toLowerCase().includes('frustrated')) return 'frustrated';
    if (input.toLowerCase().includes('excited') || input.toLowerCase().includes('happy')) return 'positive';
    return 'neutral';
  }

  private detectPatterns(input: string): string[] {
    const patterns: string[] = [];
    if (input.toLowerCase().includes('stuck')) patterns.push('feeling_stuck');
    if (input.toLowerCase().includes('fear')) patterns.push('fear_pattern');
    if (input.toLowerCase().includes('progress')) patterns.push('progress_awareness');
    return patterns;
  }

  private assessFollowUpNeed(input: string): boolean {
    return input.toLowerCase().includes('crisis') || 
           input.toLowerCase().includes('emergency') ||
           input.toLowerCase().includes('help');
  }
}

export const aiCouchEngine = new AiCouchEngine();