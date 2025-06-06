/**
 * Simplified ElevenLabs Voice Cloning and Text-to-Speech Service
 * Handles voice cloning and affirmation audio generation using REST API
 */

import { storage } from './storage';
import { trackAIUsage, validateAIRequest, getUserTier } from './unified-ai-limits';
import fs from 'fs';
import path from 'path';

const ELEVENLABS_API_KEY = 'sk_1fa30a342618cb1fcfee56db845ce36ed49ab8ec92926a4d';

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  
  constructor() {
    this.apiKey = ELEVENLABS_API_KEY;
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getAvailableVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.voices.map((voice: any) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        preview_url: voice.preview_url
      }));
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw new Error('Failed to fetch available voices');
    }
  }

  /**
   * Generate speech from text using a specific voice
   */
  async generateSpeech(
    userId: string, 
    text: string, 
    voiceId: string, 
    options: {
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    } = {}
  ): Promise<{ audioBuffer: Buffer; cost: number; charactersUsed: number }> {
    try {
      // Check daily AI limits first - ALL AI systems count towards limits
      const userTier = getUserTier(userId);
      const limitCheck = await validateAIRequest(userId, userTier);
      
      if (!limitCheck.allowed) {
        throw new Error(limitCheck.reason || 'Daily AI limit reached');
      }

      const charactersUsed = text.length;
      const cost = this.calculateCost(charactersUsed);

      const requestBody = {
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarity_boost || 0.75,
          style: options.style || 0.0,
          use_speaker_boost: options.use_speaker_boost || true
        }
      };

      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS error: ${response.status}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      const responseTime = Date.now() - startTime;

      // Track this as AI usage - counts towards daily limits
      await trackAIUsage(
        userId,
        'elevenlabs-tts',
        'text_to_speech',
        text,
        `Audio generated (${charactersUsed} chars)`,
        'eleven_multilingual_v2',
        cost.toString(),
        { 
          charactersUsed, 
          voiceId, 
          responseTime,
          costCents: Math.round(cost * 100)
        }
      );

      return {
        audioBuffer,
        cost,
        charactersUsed
      };

    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  /**
   * Generate affirmation audio with personalized voice
   */
  async generateAffirmationAudio(
    userId: string,
    affirmationText: string,
    voiceId?: string
  ): Promise<{ audioBuffer: Buffer; audioUrl?: string; cost: number; charactersUsed: number }> {
    try {
      const startTime = Date.now();
      
      // Use user's cloned voice if available, otherwise use default
      let selectedVoiceId = voiceId;
      
      if (!selectedVoiceId) {
        const userVoices = await storage.getUserVoiceClones(userId);
        if (userVoices && userVoices.length > 0) {
          selectedVoiceId = userVoices[0].voiceId;
        } else {
          // Use default pleasant voice for affirmations
          selectedVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel - calm, soothing
        }
      }

      // Generate the speech
      const result = await this.generateSpeech(userId, affirmationText, selectedVoiceId, {
        stability: 0.7, // More stable for affirmations
        similarity_boost: 0.8, // Higher similarity for consistent voice
        style: 0.2, // Slight style for warmth
        use_speaker_boost: true
      });

      // Track this as AI usage - counts towards daily limits
      await trackAIUsage(
        userId,
        'elevenlabs-tts',
        'affirmation_audio',
        affirmationText,
        `Affirmation audio generated (${result.charactersUsed} chars)`,
        'eleven_multilingual_v2',
        result.cost.toString(),
        { 
          charactersUsed: result.charactersUsed, 
          voiceId: selectedVoiceId, 
          responseTime: Date.now() - startTime,
          costCents: Math.round(result.cost * 100)
        }
      );

      return {
        audioBuffer: result.audioBuffer,
        audioUrl: undefined, // Could implement CDN upload here
        cost: result.cost,
        charactersUsed: result.charactersUsed
      };

    } catch (error) {
      console.error('Error generating affirmation audio:', error);
      throw error;
    }
  }

  /**
   * Get user's cloned voices
   */
  async getUserVoiceClones(userId: string) {
    try {
      return await storage.getUserVoiceClones(userId);
    } catch (error) {
      console.error('Error fetching user voice clones:', error);
      return [];
    }
  }

  /**
   * Calculate cost based on character count
   */
  private calculateCost(characterCount: number): number {
    // ElevenLabs pricing (approximate)
    // Free tier: 10,000 chars/month
    // Starter: 30,000 chars/month ($5)
    // Creator: 100,000 chars/month ($22)
    // Pro: 500,000 chars/month ($99)
    
    const costPerCharacter = 0.00024; // Approximate average
    return characterCount * costPerCharacter;
  }

  /**
   * Get subscription usage stats
   */
  async getUsageStats(userId: string) {
    try {
      // Get affirmation audio usage directly from database
      const audioHistory = await storage.getUserAffirmationAudio(userId);
      
      // Calculate stats from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentAudio = audioHistory.filter(audio => 
        audio.createdAt && new Date(audio.createdAt) >= thirtyDaysAgo
      );
      
      const totalCharacters = recentAudio.reduce((sum: number, audio: any) => 
        sum + (audio.charactersUsed || 0), 0
      );
      
      const totalCost = recentAudio.reduce((sum: number, audio: any) => 
        sum + parseFloat(audio.cost || '0'), 0
      );
      
      return {
        charactersUsed: totalCharacters,
        totalCost,
        requestCount: recentAudio.length,
        period: '30 days'
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return {
        charactersUsed: 0,
        totalCost: 0,
        requestCount: 0,
        period: '30 days'
      };
    }
  }
}

export const elevenlabsService = new ElevenLabsService();