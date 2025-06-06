import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import { 
  aiCouchProfiles, 
  personalizedChallengePlans, 
  aiCouchSessions, 
  journalEntries
} from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { multidisciplinaryExpertise } from './multidisciplinary-expertise';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class IntelligentCoachingEngine {
  
  /**
   * Main coaching interface - automatically analyzes and applies appropriate therapeutic approach
   */
  async processCoachingRequest(
    userId: string,
    userInput: string,
    sessionType: string = 'conversation'
  ) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    // Step 1: Intelligent analysis to determine therapeutic needs
    const therapeuticAnalysis = await this.analyzeTherapeuticNeeds(userInput, profile);
    
    // Step 2: Apply integrated multidisciplinary expertise
    const expertResponse = await this.applyMultidisciplinaryExpertise(
      therapeuticAnalysis.integratedApproaches,
      userInput,
      profile,
      therapeuticAnalysis
    );

    // Step 3: Create natural coaching response
    const coachingResponse = await this.generateNaturalCoachingResponse(
      userInput,
      expertResponse,
      profile,
      therapeuticAnalysis
    );

    // Step 4: Store session with intelligent metadata
    await this.storeSession(userId, userInput, coachingResponse, therapeuticAnalysis);

    return {
      response: coachingResponse.message,
      practices: coachingResponse.practices,
      insights: coachingResponse.insights,
      nextSteps: coachingResponse.nextSteps,
      therapeuticApproach: therapeuticAnalysis.primaryApproach,
      reasoning: therapeuticAnalysis.reasoning
    };
  }

  /**
   * Multidisciplinary analysis to create integrated therapeutic approach
   */
  private async analyzeTherapeuticNeeds(userInput: string, profile: any) {
    const prompt = `You are a multidisciplinary therapeutic AI that creates integrated healing approaches by combining multiple therapeutic modalities for maximum effectiveness.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.preferredMode}
- Communication Style: ${profile.communicationStyle}
- Learning Style: ${profile.learningStyle}

USER INPUT: "${userInput}"

AVAILABLE THERAPEUTIC MODALITIES:
${Object.entries(multidisciplinaryExpertise).map(([key, expert]) => 
  `${key}: ${expert.name} - Applications: ${expert.applications.slice(0, 3).join(', ')}`
).join('\n')}

MULTIDISCIPLINARY HEALING PRINCIPLE:
True transformation occurs when multiple therapeutic approaches work synergistically. Analyze this situation to create an integrated treatment approach that combines 3-5 complementary modalities.

Consider integration across:
1. COGNITIVE LEVEL: Thought patterns, beliefs, mental frameworks
2. EMOTIONAL LEVEL: Feeling processing, regulation, expression
3. SOMATIC LEVEL: Body awareness, nervous system, physical integration
4. BEHAVIORAL LEVEL: Actions, habits, daily practices
5. SPIRITUAL/CONSCIOUSNESS LEVEL: Meaning, purpose, transcendent awareness

Select modalities that create a comprehensive healing ecosystem addressing multiple dimensions simultaneously.

Respond in JSON:
{
  "integratedApproaches": [
    {
      "modality": "expert_key",
      "role": "primary|supporting|foundational",
      "focus": "specific_healing_dimension",
      "integration_points": ["how_it_connects_with_other_modalities"]
    }
  ],
  "healingStrategy": "Overall integrated approach description",
  "synergisticEffects": ["benefit_1", "benefit_2", "benefit_3"],
  "urgencyLevel": "low|medium|high",
  "holisticNeeds": ["mind", "body", "emotion", "spirit", "behavior"],
  "confidence": 0.9
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    try {
      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      return this.fallbackAnalysis(userInput);
    } catch (error) {
      return this.fallbackAnalysis(userInput);
    }
  }

  /**
   * Apply integrated multidisciplinary therapeutic expertise
   */
  private async applyMultidisciplinaryExpertise(
    integratedApproaches: any[],
    userInput: string,
    profile: any,
    analysis: any
  ) {
    const modalityDescriptions = integratedApproaches.map(approach => {
      const expert = multidisciplinaryExpertise[approach.modality];
      return `${expert?.name} (${approach.role}): ${expert?.description}`;
    }).join('\n');

    const allTechniques = integratedApproaches.flatMap(approach => {
      const expert = multidisciplinaryExpertise[approach.modality];
      return expert?.techniques.slice(0, 3) || [];
    });

    const prompt = `You are a multidisciplinary therapeutic AI integrating multiple healing modalities simultaneously for comprehensive transformation.

INTEGRATED THERAPEUTIC FRAMEWORK:
${modalityDescriptions}

HEALING STRATEGY: ${analysis.healingStrategy}

SYNERGISTIC EFFECTS: ${analysis.synergisticEffects?.join(', ')}

USER SITUATION: "${userInput}"

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Communication Style: ${profile.communicationStyle}
- Learning Style: ${profile.learningStyle}

INTEGRATED APPROACH DETAILS:
${integratedApproaches.map(approach => {
  const expert = multidisciplinaryExpertise[approach.modality];
  return `${expert?.name} (${approach.role}): Focus on ${approach.focus}
  Integration Points: ${approach.integration_points?.join(', ')}`;
}).join('\n\n')}

AVAILABLE TECHNIQUES ACROSS ALL MODALITIES:
${allTechniques.join(', ')}

Create a comprehensive multidisciplinary intervention that:
1. Integrates all selected therapeutic approaches synergistically
2. Addresses cognitive, emotional, somatic, behavioral, and spiritual dimensions
3. Provides techniques that work together rather than in isolation
4. Creates a holistic healing ecosystem
5. Maximizes therapeutic effectiveness through modality combination

Format as JSON:
{
  "multidisciplinaryAssessment": "Comprehensive assessment across all dimensions",
  "integratedTechniques": [
    {
      "technique": "specific_technique",
      "modalities": ["which_approaches_contribute"],
      "dimension": "cognitive|emotional|somatic|behavioral|spiritual",
      "synergy": "how_it_enhances_other_techniques"
    }
  ],
  "holisticInterventions": ["intervention_1", "intervention_2", "intervention_3"],
  "integrationStrategy": "How all approaches work together",
  "expectedOutcomes": "Comprehensive therapeutic benefits",
  "timeline": "Realistic progress timeframe"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    try {
      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      return this.fallbackExpertResponse(integratedApproaches[0]);
    } catch (error) {
      return this.fallbackExpertResponse(integratedApproaches[0]);
    }
  }

  /**
   * Generate natural coaching response that integrates therapeutic expertise seamlessly
   */
  private async generateNaturalCoachingResponse(
    userInput: string,
    expertResponse: any,
    profile: any,
    analysis: any
  ) {
    const prompt = `You are AI Couch, a warm and wise personal transformation coach. Create a natural, conversational response that seamlessly integrates therapeutic expertise.

USER INPUT: "${userInput}"

THERAPEUTIC EXPERTISE TO INTEGRATE:
- Assessment: ${expertResponse.assessment}
- Techniques: ${expertResponse.techniques?.join(', ')}
- Interventions: ${expertResponse.interventions?.join(', ')}

USER PREFERENCES:
- Communication Style: ${profile.communicationStyle}
- Learning Style: ${profile.learningStyle}

GUIDELINES:
1. Sound like a wise, experienced coach (not clinical or robotic)
2. Seamlessly weave in therapeutic techniques without naming them
3. Match their communication style (${profile.communicationStyle})
4. Provide practical, actionable guidance
5. Be warm, empathetic, and encouraging
6. Never mention the specific therapeutic approach used

Create a response that feels natural and supportive while incorporating the therapeutic wisdom.

Format as JSON:
{
  "message": "Main coaching response (conversational, warm, practical)",
  "practices": ["3-4 specific practices they can try today"],
  "insights": "Key insight or reframe to help them",
  "nextSteps": "Clear guidance for moving forward"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    });

    try {
      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      return this.fallbackCoachingResponse(userInput, expertResponse);
    } catch (error) {
      return this.fallbackCoachingResponse(userInput, expertResponse);
    }
  }

  /**
   * Store session with intelligent metadata
   */
  private async storeSession(
    userId: string,
    userInput: string,
    response: any,
    analysis: any
  ) {
    // Get user profile to get profileId
    const profile = await this.getUserProfile(userId);
    if (profile) {
      await db.insert(aiCouchSessions).values({
        userId,
        profileId: profile.id,
        sessionType: 'intelligent_coaching',
        sessionMode: 'multidisciplinary',
        userInput,
        aiResponse: JSON.stringify(response),
        emotionalTone: this.detectEmotionalTone(userInput),
        followUpNeeded: analysis.urgencyLevel !== 'low'
      });
    }
  }

  /**
   * Get user profile
   */
  private async getUserProfile(userId: string) {
    const [profile] = await db
      .select()
      .from(aiCouchProfiles)
      .where(eq(aiCouchProfiles.userId, userId));
    return profile;
  }

  /**
   * Detect emotional tone from user input
   */
  private detectEmotionalTone(input: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('crisis') || lowerInput.includes('emergency') || lowerInput.includes('suicide')) {
      return 'crisis';
    } else if (lowerInput.includes('anxious') || lowerInput.includes('worried') || lowerInput.includes('stressed')) {
      return 'anxious';
    } else if (lowerInput.includes('sad') || lowerInput.includes('depressed') || lowerInput.includes('down')) {
      return 'low';
    } else if (lowerInput.includes('angry') || lowerInput.includes('frustrated') || lowerInput.includes('mad')) {
      return 'agitated';
    } else if (lowerInput.includes('excited') || lowerInput.includes('happy') || lowerInput.includes('great')) {
      return 'positive';
    } else {
      return 'neutral';
    }
  }

  /**
   * Fallback analysis when AI analysis fails
   */
  private fallbackAnalysis(userInput: string) {
    const input = userInput.toLowerCase();
    
    if (input.includes('trauma') || input.includes('ptsd') || input.includes('abuse')) {
      return {
        primaryApproach: 'trauma_therapist',
        supportingApproaches: ['somatic_therapist'],
        reasoning: 'Trauma-related content detected',
        urgencyLevel: 'high',
        interventionNeeds: ['trauma processing', 'nervous system regulation'],
        confidence: 0.8
      };
    }
    
    if (input.includes('anxiety') || input.includes('panic') || input.includes('worry')) {
      return {
        primaryApproach: 'cbt_therapist',
        supportingApproaches: ['meditation_instructor'],
        reasoning: 'Anxiety patterns detected',
        urgencyLevel: 'medium',
        interventionNeeds: ['cognitive restructuring', 'anxiety management'],
        confidence: 0.7
      };
    }
    
    return {
      primaryApproach: 'personal_coach',
      supportingApproaches: ['meditation_instructor'],
      reasoning: 'General personal development support',
      urgencyLevel: 'low',
      interventionNeeds: ['goal clarification', 'motivation'],
      confidence: 0.6
    };
  }

  /**
   * Fallback expert response
   */
  private fallbackExpertResponse(approach: any) {
    const expert = multidisciplinaryExpertise[approach?.modality] || multidisciplinaryExpertise['cbt_therapist'];
    return {
      multidisciplinaryAssessment: `From a ${expert.name} perspective, this situation requires gentle attention and evidence-based support.`,
      integratedTechniques: [
        {
          technique: expert.techniques[0] || 'Mindful awareness',
          modalities: [expert.name],
          dimension: 'cognitive',
          synergy: 'Creates foundation for other interventions'
        }
      ],
      holisticInterventions: expert.interventions?.slice(0, 2) || ['Gentle self-observation', 'Compassionate self-talk'],
      integrationStrategy: 'Combine with mindfulness and self-compassion practices',
      expectedOutcomes: 'Gradual improvement in emotional regulation and insight',
      timeline: '2-4 weeks for initial progress'
    };
  }

  /**
   * Fallback coaching response
   */
  private fallbackCoachingResponse(userInput: string, expertResponse: any) {
    return {
      message: "I hear you, and I want you to know that what you're experiencing makes complete sense. Let's work together to find some helpful approaches that feel right for you.",
      practices: expertResponse.techniques?.slice(0, 3) || ['Take three deep breaths', 'Notice your current feelings without judgment', 'Practice one small act of self-care'],
      insights: "Sometimes the most powerful changes begin with simply acknowledging where we are right now.",
      nextSteps: "Let's continue exploring this together and see what feels most supportive for you moving forward."
    };
  }
}

export const intelligentCoachingEngine = new IntelligentCoachingEngine();