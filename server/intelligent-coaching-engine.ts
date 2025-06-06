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
    
    // Step 2: Apply appropriate expertise automatically
    const expertResponse = await this.applyTherapeuticExpertise(
      therapeuticAnalysis.primaryApproach,
      userInput,
      profile,
      therapeuticAnalysis.supportingApproaches
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
   * Intelligent analysis of user input to determine therapeutic needs
   */
  private async analyzeTherapeuticNeeds(userInput: string, profile: any) {
    const prompt = `You are an expert therapeutic AI that analyzes user communication to determine the most effective therapeutic intervention.

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.preferredMode}
- Communication Style: ${profile.communicationStyle}
- Learning Style: ${profile.learningStyle}

USER INPUT: "${userInput}"

AVAILABLE THERAPEUTIC APPROACHES:
${Object.entries(multidisciplinaryExpertise).map(([key, expert]) => 
  `${key}: ${expert.name} - Key applications: ${expert.applications.slice(0, 3).join(', ')}`
).join('\n')}

Analyze for:
1. Emotional urgency and safety concerns
2. Primary psychological patterns (cognitive, emotional, behavioral, somatic)
3. Underlying therapeutic needs
4. Readiness for different intervention levels
5. Language indicators of specific therapeutic approaches

Determine the PRIMARY approach and up to 2 SUPPORTING approaches that would be most beneficial.

Respond in JSON:
{
  "primaryApproach": "most_appropriate_expert_key",
  "supportingApproaches": ["expert_key_1", "expert_key_2"],
  "reasoning": "Clear explanation of therapeutic rationale",
  "urgencyLevel": "low|medium|high",
  "interventionNeeds": ["specific_need_1", "specific_need_2"],
  "confidence": 0.85
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    try {
      return JSON.parse(response.content[0].text);
    } catch (error) {
      return this.fallbackAnalysis(userInput);
    }
  }

  /**
   * Apply therapeutic expertise based on analysis
   */
  private async applyTherapeuticExpertise(
    primaryApproach: string,
    userInput: string,
    profile: any,
    supportingApproaches: string[] = []
  ) {
    const primaryExpert = multidisciplinaryExpertise[primaryApproach];
    if (!primaryExpert) {
      throw new Error(`Unknown therapeutic approach: ${primaryApproach}`);
    }

    const prompt = `You are acting as a ${primaryExpert.name} with comprehensive training and expertise.

THERAPEUTIC FRAMEWORK: ${primaryExpert.description}

AVAILABLE TECHNIQUES:
${primaryExpert.techniques.join('\n- ')}

USER SITUATION: "${userInput}"

USER PROFILE:
- Healing Readiness: ${profile.healingReadiness}/10
- Communication Style: ${profile.communicationStyle}
- Learning Style: ${profile.learningStyle}

SUPPORTING APPROACHES TO INTEGRATE:
${supportingApproaches.map(key => multidisciplinaryExpertise[key]?.name).join(', ')}

Apply your ${primaryExpert.name} expertise to provide:
1. Professional assessment of the situation
2. Specific therapeutic techniques most appropriate for their readiness level
3. Practical interventions they can implement
4. Integration with supporting approaches
5. Expected therapeutic outcomes

Format as JSON:
{
  "assessment": "Professional therapeutic assessment",
  "techniques": ["technique_1", "technique_2", "technique_3"],
  "interventions": ["intervention_1", "intervention_2"],
  "integration": "How to blend with supporting approaches",
  "outcomes": "Expected therapeutic benefits",
  "timeline": "Realistic timeframe for progress"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    try {
      return JSON.parse(response.content[0].text);
    } catch (error) {
      return this.fallbackExpertResponse(primaryExpert);
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
      return JSON.parse(response.content[0].text);
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
    await db.insert(aiCouchSessions).values({
      userId,
      sessionType: 'intelligent_coaching',
      userInput,
      aiResponse: JSON.stringify(response),
      emotionalTone: this.detectEmotionalTone(userInput),
      followUpNeeded: analysis.urgencyLevel !== 'low',
      expertApproach: analysis.primaryApproach,
      analysisNotes: JSON.stringify(analysis)
    });
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
  private fallbackExpertResponse(expert: any) {
    return {
      assessment: `From a ${expert.name} perspective, this situation requires gentle attention and evidence-based support.`,
      techniques: expert.techniques.slice(0, 3),
      interventions: expert.interventions.slice(0, 2),
      integration: 'Combine with mindfulness and self-compassion practices',
      outcomes: 'Gradual improvement in emotional regulation and insight',
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