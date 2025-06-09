/**
 * Personalized Comfort Soundscape Generator
 * AI-driven audio wellness system that creates custom ambient soundscapes
 */

import { aiCoachingEngine } from './ai-coaching';

export interface SoundscapeParameters {
  id: string;
  userId: string;
  name: string;
  description: string;
  
  // Binaural beat parameters
  binauralFrequency: number; // Hz difference between ears
  baseFrequency: number; // Base carrier frequency
  beatType: 'alpha' | 'beta' | 'theta' | 'delta' | 'gamma';
  
  // Ambient sound layers
  ambientLayers: AmbientLayer[];
  
  // Mixing parameters
  volume: number; // 0-1
  fadeInDuration: number; // seconds
  totalDuration: number; // minutes
  
  // Personalization
  emotionalTarget: string;
  stressLevel: number; // 1-10
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  purpose: 'meditation' | 'focus' | 'sleep' | 'relaxation' | 'energy';
}

export interface AmbientLayer {
  type: 'nature' | 'white_noise' | 'brown_noise' | 'pink_noise' | 'rain' | 'ocean' | 'forest' | 'fire';
  volume: number; // 0-1
  frequency?: number; // for noise types
  modulation?: {
    rate: number; // Hz
    depth: number; // 0-1
  };
}

export interface UserSoundProfile {
  userId: string;
  preferences: {
    favoriteTypes: string[];
    dislikedSounds: string[];
    preferredVolume: number;
    sensitivityToFrequencies: {
      low: number; // 0-1
      mid: number;
      high: number;
    };
  };
  biometricData?: {
    heartRate?: number;
    stressLevel?: number;
    sleepQuality?: number;
  };
  recentSessions: {
    parameters: SoundscapeParameters;
    effectiveness: number; // 1-10 user rating
    timestamp: Date;
  }[];
}

export class SoundscapeGenerator {
  
  /**
   * Generate personalized soundscape parameters using AI analysis
   */
  async generatePersonalizedSoundscape(
    userId: string, 
    purpose: string, 
    currentEmotionalState?: string,
    preferences?: any
  ): Promise<SoundscapeParameters> {
    
    // Get user's historical preferences and effectiveness data
    const userProfile = await this.getUserSoundProfile(userId);
    
    // AI analysis for optimal parameters
    const analysis = await this.analyzeOptimalParameters(
      userId, 
      purpose, 
      currentEmotionalState, 
      userProfile
    );
    
    // Generate specific parameters based on AI analysis
    const parameters = await this.createSoundscapeParameters(analysis, userProfile);
    
    return parameters;
  }
  
  /**
   * AI-driven analysis for optimal sound parameters
   */
  private async analyzeOptimalParameters(
    userId: string,
    purpose: string,
    emotionalState?: string,
    userProfile?: UserSoundProfile
  ): Promise<any> {
    
    const prompt = `As an AI audio therapy specialist, analyze the optimal soundscape parameters for:
    
    User Purpose: ${purpose}
    Current Emotional State: ${emotionalState || 'neutral'}
    Time: ${new Date().toLocaleTimeString()}
    
    ${userProfile ? `User History: ${JSON.stringify({
      recentEffectiveness: userProfile.recentSessions.slice(-3).map(s => s.effectiveness),
      preferences: userProfile.preferences
    })}` : ''}
    
    Provide recommendations in JSON format:
    {
      "binauralFrequency": number (1-40 Hz),
      "beatType": "alpha|beta|theta|delta|gamma",
      "baseFrequency": number (200-800 Hz),
      "ambientRecommendations": [
        {
          "type": "nature|white_noise|rain|ocean|forest",
          "volume": number (0-1),
          "reasoning": "why this helps"
        }
      ],
      "sessionDuration": number (minutes),
      "reasoning": "scientific explanation for choices"
    }`;
    
    try {
      const response = await aiCoachingEngine.generatePersonalizedResponse(
        userId,
        prompt,
        { sessionType: 'soundscape_analysis', skipUsageTracking: true }
      );
      
      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback to default parameters
      return this.getDefaultParameters(purpose);
      
    } catch (error) {
      console.error('Error in AI soundscape analysis:', error);
      return this.getDefaultParameters(purpose);
    }
  }
  
  /**
   * Create final soundscape parameters from AI analysis
   */
  private async createSoundscapeParameters(
    analysis: any,
    userProfile?: UserSoundProfile
  ): Promise<SoundscapeParameters> {
    
    const id = `soundscape_${Date.now()}`;
    
    // Convert AI recommendations to ambient layers
    const ambientLayers: AmbientLayer[] = (analysis.ambientRecommendations || []).map((rec: any) => ({
      type: rec.type,
      volume: rec.volume * (userProfile?.preferences.preferredVolume || 0.7),
      frequency: this.getFrequencyForType(rec.type),
      modulation: rec.type === 'ocean' ? { rate: 0.1, depth: 0.3 } : undefined
    }));
    
    return {
      id,
      userId: userProfile?.userId || 'anonymous',
      name: `${analysis.beatType} ${this.getPurposeName(analysis)} Soundscape`,
      description: analysis.reasoning || 'Personalized audio wellness experience',
      
      binauralFrequency: analysis.binauralFrequency || 10,
      baseFrequency: analysis.baseFrequency || 440,
      beatType: analysis.beatType || 'alpha',
      
      ambientLayers,
      
      volume: userProfile?.preferences.preferredVolume || 0.7,
      fadeInDuration: 30,
      totalDuration: analysis.sessionDuration || 15,
      
      emotionalTarget: analysis.targetEmotion || 'calm',
      stressLevel: userProfile?.biometricData?.stressLevel || 5,
      timeOfDay: this.getTimeOfDay(),
      purpose: analysis.purpose || 'relaxation'
    };
  }
  
  /**
   * Rate soundscape effectiveness and update user profile
   */
  async rateSoundscapeEffectiveness(
    userId: string,
    soundscapeId: string,
    effectiveness: number,
    feedback?: string
  ): Promise<void> {
    // Store effectiveness rating for future AI learning
    console.log(`Soundscape ${soundscapeId} rated ${effectiveness}/10 by user ${userId}`);
    // In a real implementation, this would update the user profile in the database
  }
  
  /**
   * Get user's sound profile with preferences and history
   */
  private async getUserSoundProfile(userId: string): Promise<UserSoundProfile | undefined> {
    // In a real implementation, this would fetch from database
    // For now, return undefined to use defaults
    return undefined;
  }
  
  /**
   * Default parameters for different purposes
   */
  private getDefaultParameters(purpose: string): any {
    const defaults = {
      meditation: {
        binauralFrequency: 8,
        beatType: 'alpha',
        baseFrequency: 440,
        ambientRecommendations: [
          { type: 'forest', volume: 0.6, reasoning: 'Natural sounds promote calm focus' },
          { type: 'brown_noise', volume: 0.3, reasoning: 'Low frequencies reduce mental chatter' }
        ],
        sessionDuration: 20
      },
      sleep: {
        binauralFrequency: 3,
        beatType: 'delta',
        baseFrequency: 200,
        ambientRecommendations: [
          { type: 'rain', volume: 0.5, reasoning: 'Consistent rainfall promotes deep sleep' },
          { type: 'brown_noise', volume: 0.4, reasoning: 'Masks environmental disturbances' }
        ],
        sessionDuration: 60
      },
      focus: {
        binauralFrequency: 15,
        beatType: 'beta',
        baseFrequency: 528,
        ambientRecommendations: [
          { type: 'white_noise', volume: 0.4, reasoning: 'Masks distractions' },
          { type: 'ocean', volume: 0.3, reasoning: 'Rhythmic waves enhance concentration' }
        ],
        sessionDuration: 25
      }
    };
    
    return defaults[purpose] || defaults.meditation;
  }
  
  private getFrequencyForType(type: string): number | undefined {
    const frequencies = {
      white_noise: 1000,
      brown_noise: 200,
      pink_noise: 500
    };
    return frequencies[type];
  }
  
  private getPurposeName(analysis: any): string {
    return analysis.purpose || 'Wellness';
  }
  
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
  }
}

export const soundscapeGenerator = new SoundscapeGenerator();