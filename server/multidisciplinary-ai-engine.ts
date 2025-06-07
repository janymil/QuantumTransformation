import { db } from "./db";
import { aiCouchProfiles, aiCouchSessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { disciplineRegistry } from "./disciplines/discipline-registry";
import { intelligentModelRouter } from './disciplines/intelligent-model-router';
import { advancedCostOptimization } from './disciplines/advanced-cost-optimization';
import { unifiedAnalytics } from './unified-analytics';

export interface MultidisciplinaryAnalysis {
  primaryNeeds: string[];
  therapeuticApproaches: string[];
  integratedTechniques: {
    technique: string;
    modalities: string[];
    dimension: string;
    synergy: string;
  }[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'crisis';
  emotionalState: string;
  confidence: number;
}

export interface MultidisciplinaryResponse {
  multidisciplinaryAssessment: string;
  integratedTechniques: {
    technique: string;
    modalities: string[];
    dimension: string;
    synergy: string;
  }[];
  holisticInterventions: string[];
  integrationStrategy: string;
  expectedOutcomes: string;
  timeline: string;
  naturalResponse: string;
}

/**
 * Main Multidisciplinary AI Coaching Engine
 * Automatically analyzes user input and applies appropriate therapeutic expertise
 */
export class MultidisciplinaryAIEngine {
  /**
   * Main coaching interface - automatically analyzes and applies appropriate therapeutic approach
   */
  async processCoachingRequest(
    userId: string,
    userInput: string,
    sessionType: string = 'intelligent_coaching'
  ): Promise<MultidisciplinaryResponse> {
    try {
      // Get or create user profile
      let profile = await this.getUserProfile(userId);
      if (!profile) {
        profile = await this.createBasicProfile(userId);
      }

      // Analyze therapeutic needs
      const analysis = await this.analyzeTherapeuticNeeds(userInput, profile);

      // Apply multidisciplinary expertise
      const expertResponse = await this.applyMultidisciplinaryExpertise(userInput, analysis, profile);

      // Generate natural coaching response
      const naturalResponse = await this.generateNaturalCoachingResponse(userInput, expertResponse, profile);

      // Store session
      await this.storeSession(userId, userInput, naturalResponse, analysis, profile.id);

      return {
        ...expertResponse,
        naturalResponse
      };

    } catch (error) {
      console.error('Error in multidisciplinary coaching:', error);
      return {
        multidisciplinaryAssessment: 'I understand you\'re going through something important. Let\'s approach this with care and wisdom.',
        integratedTechniques: [{
          technique: 'Mindful awareness',
          modalities: ['CBT', 'Mindfulness'],
          dimension: 'cognitive',
          synergy: 'Creates foundation for other interventions'
        }],
        holisticInterventions: ['Gentle self-observation', 'Compassionate self-talk'],
        integrationStrategy: 'Combine mindfulness with cognitive awareness',
        expectedOutcomes: 'Gradual improvement in emotional regulation and insight',
        timeline: '2-4 weeks for initial progress',
        naturalResponse: `I hear you, and I want you to know that what you're experiencing is valid. While we navigate this together, let's start with some gentle awareness of what's happening right now. Take a moment to breathe and notice what you're feeling. This is a safe space for you to explore and grow.`
      };
    }
  }

  /**
   * Analyze therapeutic needs from user input
   */
  private async analyzeTherapeuticNeeds(userInput: string, profile: any): Promise<MultidisciplinaryAnalysis> {
    try {
      const prompt = `
Analyze this user input for multidisciplinary therapeutic needs:

User Input: "${userInput}"

User Context:
- Healing Readiness: ${profile.healingReadiness}/10
- Preferred Mode: ${profile.preferredMode}
- Communication Style: ${profile.communicationStyle}
- Primary Goals: ${JSON.stringify(profile.primaryGoals || [])}

Analyze and respond in JSON format with:
{
  "primaryNeeds": ["need1", "need2"],
  "therapeuticApproaches": ["approach1", "approach2", "approach3"],
  "integratedTechniques": [
    {
      "technique": "specific technique",
      "modalities": ["CBT", "Somatic"],
      "dimension": "cognitive/emotional/somatic/spiritual",
      "synergy": "how this integrates with other approaches"
    }
  ],
  "urgencyLevel": "low/medium/high/crisis",
  "emotionalState": "detected emotional state",
  "confidence": 0.8
}

Available therapeutic approaches: ${disciplineRegistry.getAllDisciplines().map(d => d.expertise.name).join(', ')}
      `;

      // Apply advanced cost optimization for therapeutic analysis
      const cachedProfile = await advancedCostOptimization.getCachedUserProfile(userId);
      const similarResponse = await advancedCostOptimization.findSimilarResponse(userId, userInput);
      
      if (similarResponse && similarResponse.primaryNeeds) {
        // Return cached similar analysis with cost savings
        await unifiedAnalytics.trackUsage(userId, 'multidisciplinary_analysis', 0.001); // Minimal cost for cache hit
        return similarResponse;
      }

      // Route to optimal model for analysis
      const modelResponse = await intelligentModelRouter.routeDisciplineRequest(
        'therapeutic_analysis',
        userInput,
        prompt,
        'complex'
      );

      // Track usage and costs
      await unifiedAnalytics.trackUsage(userId, 'multidisciplinary_analysis', modelResponse.cost);
      
      const analysis = JSON.parse(modelResponse.content);
      
      // Update user patterns for future optimization
      await advancedCostOptimization.updateUserPatterns(userId, 'multidisciplinary_analysis', {
        modelUsed: modelResponse.modelUsed,
        effectiveness: modelResponse.efficiency / 100,
        sessionLength: modelResponse.content.length,
        responseStyle: 'analytical'
      });

      return analysis;

    } catch (error) {
      console.error('Error in therapeutic analysis:', error);
      return this.fallbackAnalysis(userInput);
    }
  }

  /**
   * Apply integrated multidisciplinary therapeutic expertise
   */
  private async applyMultidisciplinaryExpertise(
    userInput: string,
    analysis: MultidisciplinaryAnalysis,
    profile: any
  ): Promise<Omit<MultidisciplinaryResponse, 'naturalResponse'>> {
    try {
      // Use new modular discipline registry to get multidisciplinary response
      const context = {
        userProfile: profile,
        currentIssues: analysis.primaryNeeds,
        goals: profile?.goals || []
      };

      const multidisciplinaryResult = await disciplineRegistry.generateMultidisciplinaryResponse(
        userInput,
        context,
        Math.min(5, analysis.therapeuticApproaches.length)
      );

      const expertiseContext = multidisciplinaryResult.primaryDisciplines.join(', ');

      const prompt = `
As a multidisciplinary therapeutic AI, integrate expertise from these approaches:

${expertiseContext}

User Input: "${userInput}"
Analysis: ${JSON.stringify(analysis)}

Create an integrated therapeutic response in JSON format:
{
  "multidisciplinaryAssessment": "comprehensive assessment",
  "integratedTechniques": [
    {
      "technique": "specific technique",
      "modalities": ["CBT", "Somatic", "Mindfulness"],
      "dimension": "cognitive/emotional/somatic/spiritual",
      "synergy": "how this technique synergizes with others"
    }
  ],
  "holisticInterventions": ["intervention1", "intervention2"],
  "integrationStrategy": "how to combine all approaches",
  "expectedOutcomes": "what to expect",
  "timeline": "expected timeframe for progress"
}

Focus on seamless integration rather than separate approaches.
      `;

      // Apply advanced cost optimization for integrated expertise
      const similarExpertise = await advancedCostOptimization.findSimilarResponse(userId, prompt);
      
      if (similarExpertise && similarExpertise.multidisciplinaryAssessment) {
        await unifiedAnalytics.trackUsage(userId, 'multidisciplinary_expertise', 0.001);
        return similarExpertise;
      }

      // Route to optimal model for expertise integration
      const modelResponse = await intelligentModelRouter.routeDisciplineRequest(
        'multidisciplinary_integration',
        userInput,
        prompt,
        'complex'
      );

      await unifiedAnalytics.trackUsage(userId, 'multidisciplinary_expertise', modelResponse.cost);
      
      const expertiseResponse = JSON.parse(modelResponse.content);
      
      await advancedCostOptimization.updateUserPatterns(userId, 'multidisciplinary_integration', {
        modelUsed: modelResponse.modelUsed,
        effectiveness: modelResponse.efficiency / 100,
        sessionLength: modelResponse.content.length,
        responseStyle: 'integrative'
      });

      return expertiseResponse;

    } catch (error) {
      console.error('Error in multidisciplinary expertise:', error);
      return this.fallbackExpertResponse(analysis);
    }
  }

  /**
   * Generate natural coaching response that integrates therapeutic expertise seamlessly
   */
  private async generateNaturalCoachingResponse(
    userInput: string,
    expertResponse: Omit<MultidisciplinaryResponse, 'naturalResponse'>,
    profile: any
  ): Promise<string> {
    try {
      const prompt = `
You are an AI Coach with deep multidisciplinary expertise. Respond naturally and conversationally to this user input, seamlessly integrating the therapeutic insights.

User Input: "${userInput}"

Therapeutic Insights:
${JSON.stringify(expertResponse, null, 2)}

User Preferences:
- Communication Style: ${profile.communicationStyle}
- Preferred Mode: ${profile.preferredMode}

Create a warm, professional response that:
1. Acknowledges the user's input with empathy
2. Naturally incorporates the therapeutic techniques
3. Provides actionable guidance
4. Feels like talking to a wise, caring coach
5. Avoids clinical jargon

Respond as the AI Coach directly, without JSON formatting.
      `;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.content[0].type === 'text' ? response.content[0].text : 'I understand what you\'re going through. Let\'s work on this together.';

    } catch (error) {
      console.error('Error generating natural response:', error);
      return this.fallbackCoachingResponse(userInput, expertResponse);
    }
  }

  /**
   * Get or create user profile
   */
  private async getUserProfile(userId: string) {
    const [profile] = await db.select().from(aiCouchProfiles).where(eq(aiCouchProfiles.userId, userId));
    return profile;
  }

  private async createBasicProfile(userId: string) {
    const [profile] = await db.insert(aiCouchProfiles).values({
      userId,
      assessmentCompleted: false,
      healingReadiness: 5,
      preferredMode: 'mixed',
      communicationStyle: 'balanced'
    }).returning();
    return profile;
  }

  /**
   * Store session with metadata
   */
  private async storeSession(
    userId: string,
    userInput: string,
    response: string,
    analysis: MultidisciplinaryAnalysis,
    profileId: number
  ) {
    await db.insert(aiCouchSessions).values({
      userId,
      profileId,
      sessionType: 'intelligent_coaching',
      sessionMode: 'multidisciplinary',
      userInput,
      aiResponse: response,
      emotionalTone: analysis.emotionalState,
      followUpNeeded: analysis.urgencyLevel !== 'low'
    });
  }

  /**
   * Fallback methods for error cases
   */
  private fallbackAnalysis(userInput: string): MultidisciplinaryAnalysis {
    return {
      primaryNeeds: ['emotional_support', 'guidance'],
      therapeuticApproaches: ['cbt_therapist', 'mindfulness_teacher'],
      integratedTechniques: [{
        technique: 'Mindful awareness',
        modalities: ['CBT', 'Mindfulness'],
        dimension: 'cognitive',
        synergy: 'Creates foundation for other interventions'
      }],
      urgencyLevel: this.detectUrgency(userInput),
      emotionalState: this.detectEmotionalTone(userInput),
      confidence: 0.6
    };
  }

  private fallbackExpertResponse(analysis: MultidisciplinaryAnalysis): Omit<MultidisciplinaryResponse, 'naturalResponse'> {
    return {
      multidisciplinaryAssessment: 'I understand you\'re going through something important. Let\'s approach this with care and wisdom.',
      integratedTechniques: analysis.integratedTechniques,
      holisticInterventions: ['Gentle self-observation', 'Compassionate self-talk'],
      integrationStrategy: 'Combine mindfulness with cognitive awareness',
      expectedOutcomes: 'Gradual improvement in emotional regulation and insight',
      timeline: '2-4 weeks for initial progress'
    };
  }

  private fallbackCoachingResponse(userInput: string, expertResponse: any): string {
    return `I hear you, and I want you to know that what you're experiencing is valid. While we navigate this together, let's start with some gentle awareness of what's happening right now. Take a moment to breathe and notice what you're feeling. This is a safe space for you to explore and grow.`;
  }

  private detectUrgency(input: string): 'low' | 'medium' | 'high' | 'crisis' {
    const crisisWords = ['suicide', 'kill myself', 'end it all', 'can\'t go on'];
    const highWords = ['emergency', 'crisis', 'desperate', 'panic', 'breakdown'];
    const mediumWords = ['urgent', 'help', 'struggling', 'overwhelmed'];
    
    if (crisisWords.some(word => input.toLowerCase().includes(word))) return 'crisis';
    if (highWords.some(word => input.toLowerCase().includes(word))) return 'high';
    if (mediumWords.some(word => input.toLowerCase().includes(word))) return 'medium';
    return 'low';
  }

  private detectEmotionalTone(input: string): string {
    const anxiousWords = ['worried', 'anxious', 'nervous', 'scared'];
    const sadWords = ['sad', 'depressed', 'down', 'hopeless'];
    const angryWords = ['angry', 'frustrated', 'mad', 'furious'];
    
    if (anxiousWords.some(word => input.toLowerCase().includes(word))) return 'anxious';
    if (sadWords.some(word => input.toLowerCase().includes(word))) return 'sad';
    if (angryWords.some(word => input.toLowerCase().includes(word))) return 'angry';
    return 'neutral';
  }
}

export const multidisciplinaryAIEngine = new MultidisciplinaryAIEngine();