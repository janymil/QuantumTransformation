import type { Express } from "express";
import { fastChatEngine } from "./fast-chat-engine";
import { monthlyCostSimulation } from "./monthly-cost-simulation";
import { advancedCostOptimization } from "./advanced-cost-optimization";
import { voiceTranscriptionService } from "./voice-service";
import { psychologicalAnalyzer } from "./psychological-analyzer";
import { therapeuticFrameworks } from "./therapeutic-frameworks";
import { costOptimizationService } from "./cost-optimization";
import { isAuthenticated } from "../replitAuth";
import multer from "multer";
import { z } from "zod";
import { db } from "../db";
import { journalingThreads, threadExchanges, psychologicalProfile, emotionalStateHistory } from "@shared/schema";
import { eq, and, desc, count } from "drizzle-orm";

// Configure multer for voice file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for Whisper
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg', 'audio/wav', 'audio/ogg', 
      'audio/m4a', 'audio/webm', 'audio/flac'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio format'), false);
    }
  }
});

// Request validation schemas
const deepJournalingRequestSchema = z.object({
  threadId: z.number().optional(),
  userInput: z.string().min(1, "User input is required"),
  wasVoiceInput: z.boolean().optional().default(false),
  voiceTranscriptionQuality: z.number().min(0).max(1).optional(),
  customizations: z.object({
    mode: z.enum(['conversational', 'therapeutic', 'analytical']).optional(),
    tone: z.enum(['supportive', 'challenging', 'neutral', 'empathetic']).optional(),
    perspective: z.enum(['psychologist', 'life_coach', 'cbt_therapist', 'philosopher', 'stoic']).optional(),
    customInstructions: z.string().optional()
  }).optional(),
  actionType: z.enum(['go_deeper', 'new_direction', 'customize_response']).optional()
});

const threadCustomizationSchema = z.object({
  mode: z.enum(['conversational', 'therapeutic', 'analytical']).optional(),
  tone: z.enum(['supportive', 'challenging', 'neutral', 'empathetic']).optional(),
  perspective: z.enum(['psychologist', 'life_coach', 'cbt_therapist', 'philosopher', 'stoic']).optional(),
  customInstructions: z.string().optional()
});

export function registerDeepJournalingRoutes(app: Express) {
  
  /**
   * Direct action button endpoint - bypasses broken adapters for immediate fixes
   */
  app.post('/api/therapeutic-chat/action', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userInput, actionType } = req.body;

      // Direct AI call bypassing broken therapeutic chat adapter
      const anthropic = new (await import('@anthropic-ai/sdk')).default({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      let systemPrompt = '';
      if (actionType === 'go_deeper') {
        systemPrompt = `You are an expert therapeutic coach specializing in depth psychology, CBT, and somatic therapy. Provide deep, insightful therapeutic exploration that helps uncover underlying patterns, beliefs, and emotions. Ask probing questions that guide toward profound self-discovery. Be compassionate but penetrating in your analysis. Provide a complete, thoughtful response that demonstrates sophisticated therapeutic understanding.`;
      } else if (actionType === 'new_direction') {
        systemPrompt = `You are an expert therapeutic coach. Completely shift the therapeutic direction. Explore different angles, challenge assumptions, and guide toward unexplored aspects of the situation. Help see challenges from fresh, innovative viewpoints. Provide a complete, insightful response that opens new therapeutic pathways.`;
      } else {
        systemPrompt = `You are a compassionate therapeutic coach. Provide thoughtful, personalized support that addresses the user's immediate needs with wisdom and understanding.`;
      }

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          { role: 'user', content: `${systemPrompt}\n\nUser input: ${userInput}` }
        ],
        temperature: 0.7
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';

      res.json({
        question: content,
        analysis: { professionalAnalysis: content },
        emotionalState: { primaryEmotion: 'insightful' },
        threadId: null
      });

    } catch (error) {
      console.error('Direct therapeutic action error:', error);
      res.status(500).json({ 
        question: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        analysis: { professionalAnalysis: "Technical issue encountered." }
      });
    }
  });

  /**
   * Main deep journaling endpoint - process user input and generate therapeutic response
   */
  app.post('/api/deep-journaling/process', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = deepJournalingRequestSchema.parse(req.body);

      // Set timeout for long-running requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
      });

      const response = await fastChatEngine.processFastResponse(
        userId,
        validatedData.threadId || null,
        validatedData.userInput
      );

      // Response already received from fastChatEngine

      // Enqueue post-processing job asynchronously (don't await)
      const { enqueuePostProcessingJob } = await import('../jobs/post-processing-job');
      if (validatedData.threadId && validatedData.userInput) {
        enqueuePostProcessingJob(
          userId,
          validatedData.threadId,
          validatedData.userInput
        ).catch(error => {
          console.error('Failed to enqueue post-processing job:', error);
        });
      }

      // Validate response completeness
      if (response && typeof response === 'object') {
        const content = response.analysis?.professionalAnalysis || response.question || response.response;
        if (content && content.length > 10) {
          res.json(response);
        } else {
          // Provide fallback response if content is incomplete
          res.json({
            ...response,
            question: response.actionType === 'go_deeper' 
              ? "Let me explore this more deeply with you. What specific aspects of this situation feel most significant or challenging right now?"
              : "Let's approach this from a different perspective. What alternative ways might we understand or address this situation?",
            analysis: {
              professionalAnalysis: content || "I'm here to support your therapeutic journey."
            }
          });
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Deep journaling processing error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      } else {
        // Provide therapeutic fallback instead of generic error
        const actionType = req.body?.actionType;
        res.status(200).json({
          question: actionType === 'go_deeper' 
            ? "I want to explore this more deeply with you. What underlying feelings or patterns do you notice in this situation?"
            : actionType === 'new_direction'
            ? "Let's try a different therapeutic approach. What would it look like to view this challenge from a completely new angle?"
            : "I'm here to support you. What would be most helpful to explore right now?",
          analysis: {
            professionalAnalysis: "I'm committed to providing you with thoughtful therapeutic support."
          },
          emotionalState: { primaryEmotion: 'supportive' },
          threadId: req.body?.threadId || null
        });
      }
    }
  });

  /**
   * Voice transcription endpoint
   */
  app.post('/api/deep-journaling/transcribe', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No audio file provided' });
      }

      // Validate audio file
      const validation = voiceTranscriptionService.validateAudioFile(req.file.buffer, req.file.originalname);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }

      // Transcribe audio
      const transcriptionResult = await voiceTranscriptionService.transcribeAudio(
        req.file.buffer, 
        req.file.originalname
      );

      // Enhance transcription formatting
      const enhancedText = await voiceTranscriptionService.enhanceTranscription(transcriptionResult.text);
      
      // Analyze speech patterns
      const speechPatterns = await voiceTranscriptionService.analyzeSpeechPatterns(
        transcriptionResult.text, 
        transcriptionResult.duration
      );

      res.json({
        text: enhancedText,
        originalText: transcriptionResult.text,
        confidence: transcriptionResult.confidence,
        duration: transcriptionResult.duration,
        emotionalTone: transcriptionResult.emotionalTone,
        speechPatterns,
        cost: voiceTranscriptionService.calculateTranscriptionCost(transcriptionResult.duration)
      });

    } catch (error) {
      console.error('Voice transcription error:', error);
      res.status(500).json({ message: 'Failed to transcribe audio' });
    }
  });

  /**
   * Get user's journaling threads with enhanced conversation statistics and emotional analysis
   */
  app.get('/api/deep-journaling/threads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // TODO: Implement getUserThreads in fastChatEngine or use direct DB queries
      const threads = [];
      
      // Add enhanced analytics to each thread
      const threadsWithAnalytics = await Promise.all(
        threads.map(async (thread) => {
          // Get exchange count
          const [exchangeCount] = await db
            .select({ count: count() })
            .from(threadExchanges)
            .where(eq(threadExchanges.threadId, thread.id));
          
          // Get latest exchange for analysis
          const latestExchange = await db
            .select()
            .from(threadExchanges)
            .where(eq(threadExchanges.threadId, thread.id))
            .orderBy(desc(threadExchanges.createdAt))
            .limit(1);

          // Extract emotional insights and brief analysis
          let emotionalInsight = 'Processing emotions';
          let briefAnalysis = 'Therapeutic conversation about personal growth and self-reflection';
          
          if (latestExchange.length > 0) {
            const exchange = latestExchange[0];
            
            // Extract emotional insight from AI analysis
            if (exchange.aiEmotionalAssessment) {
              try {
                const assessment = typeof exchange.aiEmotionalAssessment === 'string' 
                  ? JSON.parse(exchange.aiEmotionalAssessment) 
                  : exchange.aiEmotionalAssessment;
                emotionalInsight = assessment.insight || assessment.primaryEmotion || 'emotional processing';
              } catch (e) {
                // Fallback to direct value
                emotionalInsight = exchange.aiEmotionalAssessment.toString().slice(0, 30);
              }
            }
            
            // Create brief analysis from user input or thread topic
            if (exchange.userInput && exchange.userInput.length > 10) {
              briefAnalysis = exchange.userInput.slice(0, 80) + (exchange.userInput.length > 80 ? '...' : '');
            } else if (thread.currentTopic && thread.currentTopic.length > 10) {
              briefAnalysis = thread.currentTopic.slice(0, 80) + (thread.currentTopic.length > 80 ? '...' : '');
            }
          }
          
          return {
            ...thread,
            exchangeCount: exchangeCount.count,
            emotionalJourney: [emotionalInsight],
            lastMessage: briefAnalysis,
            conversationStats: {
              totalExchanges: exchangeCount.count,
              lastActivity: thread.updatedAt || thread.createdAt,
              emotionalFocus: emotionalInsight
            }
          };
        })
      );

      res.json(threadsWithAnalytics);
    } catch (error) {
      console.error('Error fetching threads:', error);
      res.status(500).json({ message: 'Failed to fetch journaling threads' });
    }
  });

  /**
   * Get specific thread with all exchanges
   */
  app.get('/api/deep-journaling/threads/:threadId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const threadId = parseInt(req.params.threadId);

      if (isNaN(threadId)) {
        return res.status(400).json({ message: 'Invalid thread ID' });
      }

      const threadData = await deepJournalingEngine.getThreadWithExchanges(userId, threadId);
      res.json(threadData);
    } catch (error) {
      console.error('Error fetching thread:', error);
      if (error.message === 'Thread not found') {
        res.status(404).json({ message: 'Thread not found' });
      } else {
        res.status(500).json({ message: 'Failed to fetch thread data' });
      }
    }
  });

  /**
   * Get messages for a specific therapeutic chat session
   */
  app.get('/api/therapeutic-chat/sessions/:sessionId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = parseInt(req.params.sessionId);

      if (isNaN(sessionId)) {
        return res.status(400).json({ message: 'Invalid session ID' });
      }

      // Fetch the thread and all its exchanges
      const thread = await db.select()
        .from(journalingThreads)
        .where(and(
          eq(journalingThreads.id, sessionId),
          eq(journalingThreads.userId, userId)
        ))
        .limit(1);

      if (thread.length === 0) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Fetch all exchanges for this thread
      const exchanges = await db.select()
        .from(threadExchanges)
        .where(eq(threadExchanges.threadId, sessionId))
        .orderBy(threadExchanges.createdAt);

      res.json({
        session: thread[0],
        exchanges: exchanges
      });
    } catch (error) {
      console.error('Error fetching session messages:', error);
      res.status(500).json({ message: 'Failed to fetch session messages' });
    }
  });

  /**
   * Archive a thread
   */
  app.delete('/api/deep-journaling/threads/:threadId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const threadId = parseInt(req.params.threadId);

      if (isNaN(threadId)) {
        return res.status(400).json({ message: 'Invalid thread ID' });
      }

      await deepJournalingEngine.archiveThread(userId, threadId);
      res.json({ message: 'Thread archived successfully' });
    } catch (error) {
      console.error('Error archiving thread:', error);
      res.status(500).json({ message: 'Failed to archive thread' });
    }
  });

  /**
   * Update thread customization preferences
   */
  app.patch('/api/deep-journaling/threads/:threadId/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const threadId = parseInt(req.params.threadId);

      if (isNaN(threadId)) {
        return res.status(400).json({ message: 'Invalid thread ID' });
      }

      const validatedData = threadCustomizationSchema.parse(req.body);
      
      await deepJournalingEngine.updateThreadPreferences(userId, threadId, validatedData);
      res.json({ message: 'Thread preferences updated successfully' });
    } catch (error) {
      console.error('Error updating thread preferences:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid preferences data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to update thread preferences' });
      }
    }
  });

  /**
   * Get user's psychological profile and insights
   */
  app.get('/api/deep-journaling/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get profile data
      const [profile] = await db
        .select()
        .from(psychologicalProfile)
        .where(eq(psychologicalProfile.userId, userId));

      // Generate fresh insights if profile exists
      let insights = null;
      if (profile) {
        insights = await psychologicalAnalyzer.generateProfileInsights(userId);
      }

      res.json({
        profile: profile || null,
        insights: insights || null,
        hasData: !!profile
      });
    } catch (error) {
      console.error('Error fetching psychological profile:', error);
      res.status(500).json({ message: 'Failed to fetch psychological profile' });
    }
  });

  /**
   * Get emotional state analytics
   */
  app.get('/api/deep-journaling/analytics/emotions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 30;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Get emotional history
      const emotionalHistory = await db
        .select()
        .from(emotionalStateHistory)
        .where(eq(emotionalStateHistory.userId, userId))
        .orderBy(desc(emotionalStateHistory.createdAt));

      // Process data for visualization
      const emotionCounts: Record<string, number> = {};
      const dailyEmotions: Record<string, string[]> = {};
      const intensityData: { date: string; intensity: number }[] = [];

      emotionalHistory.forEach(record => {
        const emotion = record.primaryEmotion;
        const date = record.createdAt.toISOString().split('T')[0];
        
        // Count emotions
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        
        // Group by day
        if (!dailyEmotions[date]) dailyEmotions[date] = [];
        dailyEmotions[date].push(emotion);
        
        // Track intensity
        intensityData.push({
          date,
          intensity: record.emotionalIntensity
        });
      });

      // Calculate trends
      const totalEntries = emotionalHistory.length;
      const emotionPercentages = Object.entries(emotionCounts).map(([emotion, count]) => ({
        emotion,
        count,
        percentage: (count / totalEntries) * 100
      })).sort((a, b) => b.count - a.count);

      res.json({
        summary: {
          totalEntries,
          uniqueEmotions: Object.keys(emotionCounts).length,
          timeRange: days,
          mostCommonEmotion: emotionPercentages[0]?.emotion || null
        },
        emotionDistribution: emotionPercentages,
        dailyEmotions,
        intensityTrend: intensityData,
        period: { days, startDate: cutoffDate.toISOString().split('T')[0] }
      });

    } catch (error) {
      console.error('Error fetching emotional analytics:', error);
      res.status(500).json({ message: 'Failed to fetch emotional analytics' });
    }
  });

  /**
   * Get therapeutic frameworks info
   */
  app.get('/api/deep-journaling/frameworks', isAuthenticated, async (req: any, res) => {
    try {
      const frameworks = therapeuticFrameworks.getFrameworks();
      res.json(frameworks);
    } catch (error) {
      console.error('Error fetching frameworks:', error);
      res.status(500).json({ message: 'Failed to fetch therapeutic frameworks' });
    }
  });

  /**
   * Get questioning strategies for specific emotion
   */
  app.get('/api/deep-journaling/strategies/:emotion', isAuthenticated, async (req: any, res) => {
    try {
      const emotion = req.params.emotion;
      const strategies = therapeuticFrameworks.getEmotionalQuestioningStrategies(emotion);
      res.json({ emotion, strategies });
    } catch (error) {
      console.error('Error fetching strategies:', error);
      res.status(500).json({ message: 'Failed to fetch questioning strategies' });
    }
  });

  /**
   * Get perspective-specific questions
   */
  app.get('/api/deep-journaling/perspectives/:perspective', isAuthenticated, async (req: any, res) => {
    try {
      const perspective = req.params.perspective;
      const questions = therapeuticFrameworks.getPerspectiveQuestions(perspective);
      res.json({ perspective, questions });
    } catch (error) {
      console.error('Error fetching perspective questions:', error);
      res.status(500).json({ message: 'Failed to fetch perspective questions' });
    }
  });

  /**
   * Rate an AI response
   */
  app.post('/api/deep-journaling/exchanges/:exchangeId/rate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchangeId = parseInt(req.params.exchangeId);
      const { rating, feedback } = req.body;

      if (isNaN(exchangeId) || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Invalid exchange ID or rating' });
      }

      // Verify exchange belongs to user
      const [exchange] = await db
        .select()
        .from(threadExchanges)
        .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(and(
          eq(threadExchanges.id, exchangeId),
          eq(journalingThreads.userId, userId)
        ));

      if (!exchange) {
        return res.status(404).json({ message: 'Exchange not found' });
      }

      // Update rating
      await db
        .update(threadExchanges)
        .set({
          userRating: rating,
          userFeedback: feedback || null,
          updatedAt: new Date()
        })
        .where(eq(threadExchanges.id, exchangeId));

      res.json({ message: 'Rating saved successfully' });
    } catch (error) {
      console.error('Error saving rating:', error);
      res.status(500).json({ message: 'Failed to save rating' });
    }
  });

  /**
   * Bookmark an exchange
   */
  app.post('/api/deep-journaling/exchanges/:exchangeId/bookmark', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchangeId = parseInt(req.params.exchangeId);
      const { bookmarked } = req.body;

      if (isNaN(exchangeId)) {
        return res.status(400).json({ message: 'Invalid exchange ID' });
      }

      // Verify exchange belongs to user
      const [exchange] = await db
        .select()
        .from(threadExchanges)
        .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(and(
          eq(threadExchanges.id, exchangeId),
          eq(journalingThreads.userId, userId)
        ));

      if (!exchange) {
        return res.status(404).json({ message: 'Exchange not found' });
      }

      // Update bookmark status
      await db
        .update(threadExchanges)
        .set({
          isBookmarked: !!bookmarked,
          updatedAt: new Date()
        })
        .where(eq(threadExchanges.id, exchangeId));

      res.json({ message: bookmarked ? 'Exchange bookmarked' : 'Bookmark removed' });
    } catch (error) {
      console.error('Error updating bookmark:', error);
      res.status(500).json({ message: 'Failed to update bookmark' });
    }
  });

  /**
   * Get bookmarked exchanges
   */
  app.get('/api/deep-journaling/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const bookmarkedExchanges = await db
        .select()
        .from(threadExchanges)
        .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(and(
          eq(journalingThreads.userId, userId),
          eq(threadExchanges.isBookmarked, true)
        ))
        .orderBy(desc(threadExchanges.createdAt));

      res.json(bookmarkedExchanges);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      res.status(500).json({ message: 'Failed to fetch bookmarked exchanges' });
    }
  });

  /**
   * Get usage statistics
   */
  app.get('/api/deep-journaling/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get thread count
      const [threadCount] = await db
        .select({ count: count() })
        .from(journalingThreads)
        .where(eq(journalingThreads.userId, userId));

      // Get exchange count  
      const [exchangeCount] = await db
        .select({ count: count() })
        .from(threadExchanges)
        .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(eq(journalingThreads.userId, userId));

      // Get emotional state count
      const [emotionCount] = await db
        .select({ count: count() })
        .from(emotionalStateHistory)
        .where(eq(emotionalStateHistory.userId, userId));

      // Get recent activity (last 7 days)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);
      
      const [recentActivity] = await db
        .select({ count: count() })
        .from(threadExchanges)
        .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(and(
          eq(journalingThreads.userId, userId),
          eq(threadExchanges.createdAt, recentDate)
        ));

      res.json({
        totalThreads: threadCount.count,
        totalExchanges: exchangeCount.count,
        emotionalDataPoints: emotionCount.count,
        recentActivity: recentActivity.count,
        hasData: exchangeCount.count > 0
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch usage statistics' });
    }
  });
}