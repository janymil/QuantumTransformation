import OpenAI from "openai";
import { VoiceTranscriptionResult } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class VoiceTranscriptionService {
  
  /**
   * Transcribe audio file to text with emotional analysis
   */
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<VoiceTranscriptionResult> {
    try {
      // Create a temporary file for OpenAI API
      const audioFile = new File([audioBuffer], filename, { 
        type: this.getAudioMimeType(filename) 
      });

      // Transcribe audio using Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["word"]
      });

      // Analyze emotional tone from transcription
      const emotionalTone = await this.analyzeVoiceEmotion(transcription.text);

      return {
        text: transcription.text,
        confidence: this.calculateConfidence(transcription),
        duration: transcription.duration || 0,
        emotionalTone
      };

    } catch (error) {
      console.error("Voice transcription error:", error);
      throw new Error("Failed to transcribe audio");
    }
  }

  /**
   * Analyze emotional tone from transcribed text
   */
  private async analyzeVoiceEmotion(text: string): Promise<{
    primary: string;
    intensity: number;
    confidence: number;
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use mini for cost efficiency on emotion analysis
        messages: [
          {
            role: "system",
            content: `You are an expert in emotional analysis of spoken language. Analyze the emotional tone of the transcribed text, considering not just words but the context and manner of expression.

Respond with JSON in this exact format:
{
  "primary": "primary emotion detected (joy, sadness, anger, fear, surprise, disgust, neutral, confused, frustrated, hopeful, etc.)",
  "intensity": 0.0-1.0 (how intense the emotion is),
  "confidence": 0.0-1.0 (how confident you are in this assessment)
}`
          },
          {
            role: "user",
            content: `Analyze the emotional tone of this transcribed speech: "${text}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        primary: result.primary || 'neutral',
        intensity: Math.max(0, Math.min(1, result.intensity || 0.5)),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
      };

    } catch (error) {
      console.error("Emotional analysis error:", error);
      return {
        primary: 'neutral',
        intensity: 0.5,
        confidence: 0.3
      };
    }
  }

  /**
   * Calculate transcription confidence based on Whisper response
   */
  private calculateConfidence(transcription: any): number {
    // Whisper doesn't provide direct confidence scores, so we estimate based on:
    // - Length of transcription (longer = more confident)
    // - Presence of timestamps (indicates good audio quality)
    // - Word count vs duration ratio
    
    let confidence = 0.7; // Base confidence
    
    if (transcription.text && transcription.text.length > 10) {
      confidence += 0.1;
    }
    
    if (transcription.words && transcription.words.length > 0) {
      confidence += 0.1;
    }
    
    if (transcription.duration && transcription.text) {
      const wordsPerSecond = transcription.text.split(' ').length / transcription.duration;
      // Normal speech is 2-3 words per second
      if (wordsPerSecond >= 1.5 && wordsPerSecond <= 4) {
        confidence += 0.1;
      }
    }
    
    return Math.min(1.0, confidence);
  }

  /**
   * Get MIME type based on file extension
   */
  private getAudioMimeType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/m4a',
      'webm': 'audio/webm',
      'flac': 'audio/flac'
    };
    
    return mimeTypes[extension || ''] || 'audio/mpeg';
  }

  /**
   * Validate audio file format and size
   */
  validateAudioFile(buffer: Buffer, filename: string): { isValid: boolean; error?: string } {
    // Check file size (max 25MB for Whisper)
    if (buffer.length > 25 * 1024 * 1024) {
      return { isValid: false, error: 'Audio file too large. Maximum size is 25MB.' };
    }

    // Check file extension
    const extension = filename.toLowerCase().split('.').pop();
    const supportedFormats = ['mp3', 'wav', 'ogg', 'm4a', 'webm', 'flac'];
    
    if (!extension || !supportedFormats.includes(extension)) {
      return { 
        isValid: false, 
        error: `Unsupported audio format. Supported formats: ${supportedFormats.join(', ')}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Process real-time voice input (for future streaming implementation)
   */
  async processRealTimeVoice(audioChunks: Buffer[]): Promise<string> {
    // This would be implemented for real-time streaming transcription
    // For now, we'll combine chunks and process as a single file
    
    const combinedBuffer = Buffer.concat(audioChunks);
    const result = await this.transcribeAudio(combinedBuffer, 'realtime-input.wav');
    
    return result.text;
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): string[] {
    return ['mp3', 'wav', 'ogg', 'm4a', 'webm', 'flac'];
  }

  /**
   * Calculate estimated cost for transcription
   */
  calculateTranscriptionCost(durationSeconds: number): number {
    // Whisper pricing: $0.006 per minute
    const minutes = Math.ceil(durationSeconds / 60);
    return minutes * 0.006;
  }

  /**
   * Enhance transcription with punctuation and formatting
   */
  async enhanceTranscription(rawText: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a transcription editor. Your job is to add proper punctuation, capitalization, and formatting to raw speech-to-text output while preserving the exact meaning and words. Do not change, add, or remove any words - only improve formatting.

Rules:
- Add appropriate punctuation (periods, commas, question marks, exclamation points)
- Fix capitalization
- Break into logical paragraphs if the text is long
- Preserve all original words exactly as spoken
- Do not add clarifications or interpretations`
          },
          {
            role: "user",
            content: `Please format this transcription: "${rawText}"`
          }
        ],
        temperature: 0.1,
        max_tokens: Math.max(500, rawText.length * 2)
      });

      return response.choices[0].message.content || rawText;

    } catch (error) {
      console.error("Transcription enhancement error:", error);
      return rawText; // Return original if enhancement fails
    }
  }

  /**
   * Detect speech patterns and characteristics
   */
  async analyzeSpeechPatterns(text: string, duration: number): Promise<{
    speakingRate: number;
    pauseFrequency: string;
    emotionalVariability: string;
    communicationStyle: string;
  }> {
    const wordCount = text.split(' ').length;
    const speakingRate = duration > 0 ? (wordCount / duration) * 60 : 0; // words per minute

    // Analyze pauses (indicated by periods, commas, or "um"/"uh")
    const pauseIndicators = (text.match(/[,.!?]|um|uh|like|you know/gi) || []).length;
    const pauseFrequency = pauseIndicators > wordCount * 0.1 ? 'high' : 
                          pauseIndicators > wordCount * 0.05 ? 'moderate' : 'low';

    // This would be enhanced with actual acoustic analysis in a full implementation
    return {
      speakingRate: Math.round(speakingRate),
      pauseFrequency,
      emotionalVariability: 'moderate', // Would be calculated from acoustic features
      communicationStyle: speakingRate > 160 ? 'rapid' : speakingRate < 120 ? 'deliberate' : 'conversational'
    };
  }
}

export const voiceTranscriptionService = new VoiceTranscriptionService();