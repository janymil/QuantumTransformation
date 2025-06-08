import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { z } from "zod";
import { db } from "../db";
import { 
  journalingThreads, 
  threadExchanges, 
  psychologicalProfile, 
  emotionalStateHistory,
  aiCouchProfiles
} from "@shared/schema";
import { eq, and, desc, count } from "drizzle-orm";

// Import the Deep Journaling Engine from the correct file
import { IntelligentCoachingEngine } from "./deep-journaling-engine";

// Create engine instance
const deepJournalingEngine = new IntelligentCoachingEngine();

// Request/Response schemas for Deep Journaling
const deepJournalingRequestSchema = z.object({
  userId: z.string(),
  threadId: z.number().optional(),
  userInput: z.string(),
  wasVoiceInput: z.boolean().optional(),
  voiceTranscriptionQuality: z.number().optional(),
  customizations: z.object({
    mode: z.enum(['conversational', 'therapeutic', 'analytical']).optional(),
    tone: z.enum(['supportive', 'challenging', 'neutral', 'empathetic']).optional(),
    perspective: z.enum(['psychologist', 'life_coach', 'cbt_therapist', 'philosopher', 'stoic']).optional(),
    customInstructions: z.string().optional(),
  }).optional(),
  actionType: z.enum(['go_deeper', 'new_direction', 'customize_response']).optional()
});

export function registerDeepJournalingRoutes(app: Express) {
  
  // Main Deep Journaling processing endpoint
  app.post('/api/deep-journaling/process', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const validatedData = deepJournalingRequestSchema.parse({
        ...req.body,
        userId
      });

      // Process through Deep Journaling Engine
      const response = await deepJournalingEngine.processJournalingRequest(validatedData);
      
      res.json(response);
    } catch (error: any) {
      console.error('Deep Journaling processing error:', error);
      res.status(500).json({ 
        error: 'Failed to process deep journaling request',
        details: error.message 
      });
    }
  });

  // Get user's journaling threads
  app.get('/api/deep-journaling/threads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const threads = await db
        .select()
        .from(journalingThreads)
        .where(eq(journalingThreads.userId, userId))
        .orderBy(desc(journalingThreads.lastActiveAt));
      
      res.json(threads);
    } catch (error: any) {
      console.error('Error fetching threads:', error);
      res.status(500).json({ 
        error: 'Failed to fetch threads',
        details: error.message 
      });
    }
  });

  // Get thread exchanges (conversation history)
  app.get('/api/deep-journaling/threads/:threadId/exchanges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const threadId = parseInt(req.params.threadId);
      
      // Verify thread belongs to user
      const thread = await db
        .select()
        .from(journalingThreads)
        .where(and(
          eq(journalingThreads.id, threadId),
          eq(journalingThreads.userId, userId)
        ))
        .limit(1);
      
      if (!thread.length) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      const exchanges = await db
        .select()
        .from(threadExchanges)
        .where(eq(threadExchanges.threadId, threadId))
        .orderBy(threadExchanges.exchangeOrder);
      
      res.json(exchanges);
    } catch (error: any) {
      console.error('Error fetching thread exchanges:', error);
      res.status(500).json({ 
        error: 'Failed to fetch thread exchanges',
        details: error.message 
      });
    }
  });

  // Get user's psychological profile
  app.get('/api/deep-journaling/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const profile = await db
        .select()
        .from(psychologicalProfile)
        .where(eq(psychologicalProfile.userId, userId))
        .limit(1);
      
      res.json(profile[0] || null);
    } catch (error: any) {
      console.error('Error fetching psychological profile:', error);
      res.status(500).json({ 
        error: 'Failed to fetch psychological profile',
        details: error.message 
      });
    }
  });

  // Get emotional state history
  app.get('/api/deep-journaling/emotional-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const history = await db
        .select()
        .from(emotionalStateHistory)
        .where(eq(emotionalStateHistory.userId, userId))
        .orderBy(desc(emotionalStateHistory.recordedAt))
        .limit(50);
      
      res.json(history);
    } catch (error: any) {
      console.error('Error fetching emotional history:', error);
      res.status(500).json({ 
        error: 'Failed to fetch emotional history',
        details: error.message 
      });
    }
  });

  // Analytics endpoint for Deep Journaling insights
  app.get('/api/deep-journaling/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get thread count and total exchanges
      const threadStats = await db
        .select({
          threadCount: count(journalingThreads.id)
        })
        .from(journalingThreads)
        .where(eq(journalingThreads.userId, userId));
      
      const exchangeStats = await db
        .select({
          totalExchanges: count(threadExchanges.id)
        })
        .from(threadExchanges)
        .leftJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(eq(journalingThreads.userId, userId));
      
      // Get recent emotional states
      const recentEmotions = await db
        .select()
        .from(emotionalStateHistory)
        .where(eq(emotionalStateHistory.userId, userId))
        .orderBy(desc(emotionalStateHistory.recordedAt))
        .limit(10);
      
      res.json({
        threadCount: threadStats[0]?.threadCount || 0,
        totalExchanges: exchangeStats[0]?.totalExchanges || 0,
        recentEmotions
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ 
        error: 'Failed to fetch analytics',
        details: error.message 
      });
    }
  });

  // Create new thread
  app.post('/api/deep-journaling/threads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description } = req.body;
      
      const [newThread] = await db
        .insert(journalingThreads)
        .values({
          userId,
          title: title || 'New Journaling Session',
          description: description || '',
          isActive: true,
          lastActiveAt: new Date(),
          createdAt: new Date()
        })
        .returning();
      
      res.json(newThread);
    } catch (error: any) {
      console.error('Error creating thread:', error);
      res.status(500).json({ 
        error: 'Failed to create thread',
        details: error.message 
      });
    }
  });

  // Update thread
  app.patch('/api/deep-journaling/threads/:threadId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const threadId = parseInt(req.params.threadId);
      const { title, description, isActive } = req.body;
      
      // Verify thread belongs to user
      const thread = await db
        .select()
        .from(journalingThreads)
        .where(and(
          eq(journalingThreads.id, threadId),
          eq(journalingThreads.userId, userId)
        ))
        .limit(1);
      
      if (!thread.length) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      const [updatedThread] = await db
        .update(journalingThreads)
        .set({
          ...(title && { title }),
          ...(description && { description }),
          ...(typeof isActive === 'boolean' && { isActive }),
          lastActiveAt: new Date()
        })
        .where(eq(journalingThreads.id, threadId))
        .returning();
      
      res.json(updatedThread);
    } catch (error: any) {
      console.error('Error updating thread:', error);
      res.status(500).json({ 
        error: 'Failed to update thread',
        details: error.message 
      });
    }
  });
}