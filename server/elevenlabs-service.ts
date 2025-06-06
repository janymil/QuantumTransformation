/**
 * ElevenLabs Voice Cloning and Text-to-Speech Service
 * Handles voice cloning and affirmation audio generation
 */

import { storage } from './storage';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const ELEVENLABS_API_KEY = 'sk_1fa30a342618cb1fcfee56db845ce36ed49ab8ec92926a4d';

export class ElevenLabsService {
  private apiKey: string;
  private maxCharactersPerRequest = 5000; // ElevenLabs limit
  
  constructor() {
    this.apiKey = ELEVENLABS_API_KEY;
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getAvailableVoices() {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
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
        preview_url: voice.preview_url,
        available_for_tiers: voice.available_for_tiers,
        settings: voice.settings
      }));
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw new Error('Failed to fetch available voices');
    }
  }

  /**
   * Clone a voice from audio samples
   */
  async cloneVoice(userId: string, voiceName: string, audioFiles: Buffer[], description?: string) {
    try {
      // Validate input
      if (!audioFiles || audioFiles.length === 0) {
        throw new Error('At least one audio file is required for voice cloning');
      }

      if (audioFiles.length > 25) {
        throw new Error('Maximum 25 audio files allowed for voice cloning');
      }

      // Convert buffers to files for ElevenLabs API
      const tempFiles: string[] = [];
      const files: File[] = [];

      for (let i = 0; i < audioFiles.length; i++) {
        const tempPath = path.join('/tmp', `voice_sample_${Date.now()}_${i}.wav`);
        fs.writeFileSync(tempPath, audioFiles[i]);
        tempFiles.push(tempPath);
        
        // Create File object for API
        const fileBuffer = fs.readFileSync(tempPath);
        const file = new File([fileBuffer], `sample_${i}.wav`, { type: 'audio/wav' });
        files.push(file);
      }

      try {
        // Create voice clone
        const response = await this.client.voices.add({
          name: voiceName,
          description: description || `Custom voice for ${voiceName}`,
          files: files
        });

        // Clean up temp files
        tempFiles.forEach(file => {
          try {
            fs.unlinkSync(file);
          } catch (e) {
            console.warn('Failed to delete temp file:', file);
          }
        });

        // Store voice information in database
        await storage.createVoiceClone({
          userId,
          voiceId: response.voice_id,
          voiceName,
          description: description || '',
          isActive: true
        });

        // Track usage for cost analysis
        await trackUsage(userId, 'voice_cloning', JSON.stringify({ voiceName, samples: audioFiles.length }), 'elevenlabs', {
          success: true,
          cost: 0, // Voice cloning is typically included in subscription
          charactersUsed: 0,
          model: 'voice-clone'
        });

        return {
          voice_id: response.voice_id,
          name: voiceName,
          status: 'success',
          message: 'Voice successfully cloned'
        };

      } catch (apiError) {
        // Clean up temp files on error
        tempFiles.forEach(file => {
          try {
            fs.unlinkSync(file);
          } catch (e) {
            console.warn('Failed to delete temp file:', file);
          }
        });
        throw apiError;
      }

    } catch (error) {
      console.error('Error cloning voice:', error);
      
      // Track failed usage
      await trackUsage(userId, 'voice_cloning', JSON.stringify({ voiceName, error: error.message }), 'elevenlabs', {
        success: false,
        cost: 0,
        charactersUsed: 0,
        model: 'voice-clone'
      });

      if (error instanceof ElevenLabsError) {
        throw new Error(`ElevenLabs API Error: ${error.message}`);
      }
      throw error;
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
      // Validate text length
      if (text.length > this.maxCharactersPerRequest) {
        throw new Error(`Text too long. Maximum ${this.maxCharactersPerRequest} characters allowed.`);
      }

      const charactersUsed = text.length;

      // Calculate estimated cost
      const cost = this.calculateCost(charactersUsed);

      // Generate speech
      const audio = await this.client.generate({
        voice: voiceId,
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarity_boost || 0.75,
          style: options.style || 0.0,
          use_speaker_boost: options.use_speaker_boost || true
        }
      });

      // Convert audio stream to buffer
      const chunks: Buffer[] = [];
      const reader = audio.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Buffer.from(value));
      }
      
      const audioBuffer = Buffer.concat(chunks);

      // Track usage for cost analysis
      await trackUsage(userId, 'text_to_speech', text, 'elevenlabs', {
        success: true,
        cost,
        charactersUsed,
        model: 'eleven_multilingual_v2',
        voiceId
      });

      return {
        audioBuffer,
        cost,
        charactersUsed
      };

    } catch (error) {
      console.error('Error generating speech:', error);
      
      // Track failed usage
      await trackUsage(userId, 'text_to_speech', text, 'elevenlabs', {
        success: false,
        cost: 0,
        charactersUsed: text.length,
        model: 'eleven_multilingual_v2',
        voiceId
      });

      if (error instanceof ElevenLabsError) {
        throw new Error(`ElevenLabs API Error: ${error.message}`);
      }
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

      // Optionally upload to BunnyCDN for persistent storage
      let audioUrl: string | undefined;
      try {
        // Create a temporary file
        const tempPath = path.join('/tmp', `affirmation_${Date.now()}.mp3`);
        fs.writeFileSync(tempPath, result.audioBuffer);
        
        // Upload to BunnyCDN (if configured)
        // This would require BunnyCDN integration for audio files
        // For now, we'll return the buffer directly
        
        // Clean up temp file
        fs.unlinkSync(tempPath);
      } catch (uploadError) {
        console.warn('Audio upload failed, returning buffer only:', uploadError);
      }

      return {
        audioBuffer: result.audioBuffer,
        audioUrl,
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
   * Delete a cloned voice
   */
  async deleteVoiceClone(userId: string, voiceId: string) {
    try {
      // Delete from ElevenLabs
      await this.client.voices.delete(voiceId);
      
      // Delete from our database
      await storage.deleteVoiceClone(userId, voiceId);
      
      return { success: true, message: 'Voice clone deleted successfully' };
    } catch (error) {
      console.error('Error deleting voice clone:', error);
      throw new Error('Failed to delete voice clone');
    }
  }

  /**
   * Calculate cost based on character count and subscription tier
   */
  private calculateCost(characterCount: number): number {
    // ElevenLabs pricing (approximate)
    // Free tier: 10,000 chars/month
    // Starter: 30,000 chars/month ($5)
    // Creator: 100,000 chars/month ($22)
    // Pro: 500,000 chars/month ($99)
    
    // Overage rates vary by tier, using average estimate
    const costPerCharacter = 0.00024; // Approximate average
    return characterCount * costPerCharacter;
  }

  /**
   * Get subscription usage stats
   */
  async getUsageStats(userId: string) {
    try {
      // Get usage from our tracking
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const usage = await storage.getUserAIUsage(userId, thirtyDaysAgo);
      const elevenlabsUsage = usage.filter(u => u.model?.includes('elevenlabs') || u.requestType === 'text_to_speech');
      
      const totalCharacters = elevenlabsUsage.reduce((sum, u) => {
        const metadata = u.metadata ? JSON.parse(u.metadata) : {};
        return sum + (metadata.charactersUsed || 0);
      }, 0);
      
      const totalCost = elevenlabsUsage.reduce((sum, u) => sum + parseFloat(u.cost || '0'), 0);
      
      return {
        charactersUsed: totalCharacters,
        totalCost,
        requestCount: elevenlabsUsage.length,
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