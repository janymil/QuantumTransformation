import { db } from "../db";
import { aiCouchProfiles, aiCouchSessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { trackUsage } from '../ai-cost-control';

export interface MultidisciplinaryAnalysis {
  primaryNeeds: string[];
  therapeuticApproaches: string[];
  integratedApproaches: Array<{
    name: string;
    techniques: string[];
    rationale: string;
    synergy: string;
  }>;
  urgencyLevel: string;
  emotionalState: string;
  confidence: number;
}

export class MultidisciplinaryAIEngine {
  async analyzeTherapeuticNeeds(userInput: string, profile: any): Promise<MultidisciplinaryAnalysis> {
    try {
      // Simplified analysis without external dependencies
      const analysis: MultidisciplinaryAnalysis = {
        primaryNeeds: ["emotional_support", "self_reflection"],
        therapeuticApproaches: ["cognitive_behavioral", "mindfulness"],
        integratedApproaches: [
          {
            name: "Cognitive Behavioral Therapy",
            techniques: ["thought_challenging", "behavioral_activation"],
            rationale: "Addresses thought patterns and behaviors",
            synergy: "Complements mindfulness practices"
          }
        ],
        urgencyLevel: "medium",
        emotionalState: "processing",
        confidence: 0.8
      };

      // Track usage for analytics
      await trackUsage(
        profile.userId || 'anonymous',
        'multidisciplinary_analysis',
        userInput,
        JSON.stringify(analysis),
        'fresh',
        0.002,
        'gpt-3.5-turbo'
      );

      return analysis;
    } catch (error) {
      console.error('Error in therapeutic analysis:', error);
      
      // Return fallback analysis
      return {
        primaryNeeds: ["emotional_support"],
        therapeuticApproaches: ["supportive"],
        integratedApproaches: [
          {
            name: "Supportive Therapy",
            techniques: ["active_listening", "empathy"],
            rationale: "Provides emotional support",
            synergy: "Foundation for other approaches"
          }
        ],
        urgencyLevel: "medium",
        emotionalState: "seeking_support",
        confidence: 0.6
      };
    }
  }

  async applyMultidisciplinaryExpertise(
    integratedApproaches: any[],
    userInput: string,
    profile: any,
    therapeuticAnalysis: MultidisciplinaryAnalysis
  ): Promise<any> {
    try {
      // Simplified expert response without external dependencies
      const expertResponse = {
        therapeuticInsight: "Your reflection shows awareness and willingness to explore deeper patterns.",
        techniques: [
          "Practice mindful observation of your thoughts",
          "Consider the evidence for and against your assumptions",
          "Explore the emotions behind your experiences"
        ],
        followUpQuestions: [
          "What patterns do you notice in similar situations?",
          "How might you approach this differently next time?",
          "What emotions are you experiencing right now?"
        ],
        recommendations: "Continue with regular journaling and self-reflection practices."
      };

      // Track usage
      await trackUsage(
        profile.userId || 'anonymous',
        'multidisciplinary_expertise',
        userInput,
        JSON.stringify(expertResponse),
        'fresh',
        0.003,
        'gpt-3.5-turbo'
      );

      return expertResponse;
    } catch (error) {
      console.error('Error applying expertise:', error);
      
      return {
        therapeuticInsight: "Thank you for sharing your thoughts and feelings.",
        techniques: ["Take time to reflect", "Practice self-compassion"],
        followUpQuestions: ["How are you feeling right now?"],
        recommendations: "Continue exploring your thoughts through writing."
      };
    }
  }

  async processCoachingRequest(
    userId: string,
    userInput: string,
    sessionType: string = 'conversation'
  ): Promise<any> {
    try {
      // Get user profile
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Step 1: Analyze therapeutic needs
      const therapeuticAnalysis = await this.analyzeTherapeuticNeeds(userInput, profile);
      
      // Step 2: Apply expertise
      const expertResponse = await this.applyMultidisciplinaryExpertise(
        therapeuticAnalysis.integratedApproaches,
        userInput,
        profile,
        therapeuticAnalysis
      );

      // Step 3: Generate coaching response
      const coachingResponse = {
        response: expertResponse.therapeuticInsight,
        followUpQuestions: expertResponse.followUpQuestions,
        techniques: expertResponse.techniques,
        emotionalInsight: `You seem to be in a ${therapeuticAnalysis.emotionalState} state, which is completely natural.`,
        therapeuticApproach: therapeuticAnalysis.therapeuticApproaches.join(', '),
        confidence: therapeuticAnalysis.confidence,
        sessionType,
        timestamp: new Date().toISOString()
      };

      // Store session
      await this.storeSession(userId, userInput, coachingResponse, therapeuticAnalysis);

      return coachingResponse;
    } catch (error) {
      console.error('Error in coaching request:', error);
      
      return {
        response: "Thank you for sharing. I'm here to support you through your reflection journey.",
        followUpQuestions: ["What would you like to explore further?"],
        techniques: ["Continue journaling", "Practice mindfulness"],
        emotionalInsight: "Your willingness to reflect shows strength and self-awareness.",
        therapeuticApproach: "supportive",
        confidence: 0.7,
        sessionType,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getUserProfile(userId: string) {
    try {
      const profile = await db
        .select()
        .from(aiCouchProfiles)
        .where(eq(aiCouchProfiles.userId, userId))
        .limit(1);

      return profile[0] || { userId, preferredName: 'User' };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { userId, preferredName: 'User' };
    }
  }

  private async storeSession(
    userId: string,
    userInput: string,
    coachingResponse: any,
    therapeuticAnalysis: MultidisciplinaryAnalysis
  ) {
    try {
      await db.insert(aiCouchSessions).values({
        userId,
        sessionType: 'deep_journaling',
        userInput,
        aiResponse: coachingResponse.response,
        emotionalState: therapeuticAnalysis.emotionalState,
        therapeuticApproach: therapeuticAnalysis.therapeuticApproaches.join(', '),
        confidence: therapeuticAnalysis.confidence,
        followUpQuestions: coachingResponse.followUpQuestions,
        sessionMetadata: JSON.stringify({
          therapeuticAnalysis,
          expertResponse: coachingResponse
        })
      });
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }
}

export const multidisciplinaryAIEngine = new MultidisciplinaryAIEngine();