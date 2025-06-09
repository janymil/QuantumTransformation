
import type { Express } from "express";
import { fastChatEngine } from "./fast-chat-engine";
import { monthlyCostSimulation } from "./monthly-cost-simulation";
import { advancedCostOptimization } from "./advanced-cost-optimization";
import { voiceTranscriptionService } from "./voice-service";
import { db } from '../db';
import { therapeuticChatSessions, therapeuticChatMessages } from '../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  // Check multiple possible authentication patterns
  const userId = req.user?.claims?.sub || req.user?.id || req.headers['x-replit-user-id'];
  
  if (!userId) {
    console.log('Authentication failed - no user or not authenticated');
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  // Ensure user object has the expected structure
  if (!req.user) {
    req.user = {};
  }
  if (!req.user.claims) {
    req.user.claims = {};
  }
  if (!req.user.claims.sub) {
    req.user.claims.sub = String(userId); // Ensure it's a string
  }
  
  console.log('User authenticated successfully:', {
    hasUser: !!req.user,
    userKeys: Object.keys(req.user),
    userId: req.user.claims.sub,
    userIdType: typeof req.user.claims.sub
  });
  
  next();
};

export function registerTherapeuticChatRoutes(app: Express) {
  // Get all therapeutic chat sessions for a user
  app.get('/api/therapeutic-chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = String(req.user.claims.sub); // Ensure string type
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log('=== THERAPEUTIC CHAT SESSIONS DEBUG ===');
      console.log('Fetching sessions for userId:', userId, 'type:', typeof userId);
      
      // Check all sessions in database first
      console.log('Querying all sessions...');
      const allSessions = await db.select().from(therapeuticChatSessions);
      console.log('Total sessions in database:', allSessions.length);
      
      if (allSessions.length > 0) {
        console.log('Sample session userIds:', allSessions.slice(0, 3).map(s => ({ id: s.id, userId: s.userId, type: typeof s.userId })));
        
        // Check for any sessions that might match this user
        const potentialMatches = allSessions.filter(s => 
          String(s.userId) === userId || 
          s.userId === userId ||
          s.userId === parseInt(userId, 10)
        );
        console.log('Potential matches found:', potentialMatches.length);
      }
      
      // Try multiple query approaches to find sessions
      let sessions = await db
        .select()
        .from(therapeuticChatSessions)
        .where(eq(therapeuticChatSessions.userId, userId))
        .orderBy(desc(therapeuticChatSessions.lastActivity));

      // If no sessions found with string match, try numeric match
      if (sessions.length === 0 && !isNaN(parseInt(userId, 10))) {
        console.log('Trying numeric userId match...');
        sessions = await db
          .select()
          .from(therapeuticChatSessions)
          .where(eq(therapeuticChatSessions.userId, parseInt(userId, 10).toString()))
          .orderBy(desc(therapeuticChatSessions.lastActivity));
      }

      console.log('Found sessions for user:', sessions.length);
      if (sessions.length > 0) {
        console.log('Session titles:', sessions.map(s => s.title));
      }
      console.log('=== END DEBUG ===');

      // Add cache-busting headers to ensure fresh responses
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json(sessions);
    } catch (error) {
      console.error('Error fetching therapeutic chat sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  // Get messages for a specific session
  app.get('/api/therapeutic-chat/sessions/:sessionId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = String(req.user.claims.sub); // Ensure string type
      const sessionId = parseInt(req.params.sessionId);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log('Getting messages for session:', sessionId, 'userId:', userId, 'type:', typeof userId);

      // Verify session belongs to user - try multiple formats
      let session = await db
        .select()
        .from(therapeuticChatSessions)
        .where(and(
          eq(therapeuticChatSessions.id, sessionId),
          eq(therapeuticChatSessions.userId, userId)
        ))
        .limit(1);

      // If not found with string match, try other formats
      if (session.length === 0 && !isNaN(parseInt(userId, 10))) {
        session = await db
          .select()
          .from(therapeuticChatSessions)
          .where(and(
            eq(therapeuticChatSessions.id, sessionId),
            eq(therapeuticChatSessions.userId, parseInt(userId, 10).toString())
          ))
          .limit(1);
      }

      if (session.length === 0) {
        console.log('Session not found for messages. SessionId:', sessionId, 'UserId:', userId);
        return res.status(404).json({ error: 'Session not found' });
      }

      // Get messages for the session
      const messages = await db
        .select()
        .from(therapeuticChatMessages)
        .where(eq(therapeuticChatMessages.sessionId, sessionId))
        .orderBy(therapeuticChatMessages.createdAt);

      // Format messages for frontend
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        type: msg.messageType,
        content: msg.content,
        timestamp: msg.createdAt,
        emotionalTone: msg.emotionalTone
      }));

      res.json({
        session: session[0],
        messages: formattedMessages
      });
    } catch (error) {
      console.error('Error fetching session messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Save a conversation to therapeutic chat system
  app.post('/api/therapeutic-chat/save-conversation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = String(req.user.claims.sub); // Ensure string type
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { title, messages, sessionType, conversationStyle, focusArea } = req.body;

      console.log('Saving conversation for userId:', userId, 'title:', title, 'userId type:', typeof userId);

      // Create new therapeutic chat session with consistent userId format
      const [newSession] = await db
        .insert(therapeuticChatSessions)
        .values({
          userId: userId, // Keep as string for consistency
          title: title || 'Therapeutic Session',
          sessionType: sessionType || 'general',
          conversationStyle: conversationStyle || 'socratic',
          focusArea: focusArea || 'general',
          responseLength: 'balanced',
          messageCount: messages?.length || 0,
          lastActivity: new Date(),
        })
        .returning();

      console.log('Created session:', newSession.id, 'for user:', userId, 'stored userId:', newSession.userId, 'type:', typeof newSession.userId);

      // Save all messages
      if (messages && messages.length > 0) {
        const messageData = messages.map((msg: any, index: number) => ({
          sessionId: newSession.id,
          messageType: msg.type || (index % 2 === 0 ? 'user' : 'ai'),
          content: msg.content || msg.text || '',
          aiAnalysis: msg.analysis ? { analysis: msg.analysis } : null,
          aiQuestion: msg.question || null,
          actionType: msg.actionType || 'regular',
          processingTime: msg.processingTime || null,
          tokens: msg.tokens || null,
          cost: msg.cost || null,
          createdAt: new Date(msg.timestamp || new Date()),
        }));

        await db
          .insert(therapeuticChatMessages)
          .values(messageData);
        
        console.log('Saved', messageData.length, 'messages for session:', newSession.id);
      }

      res.json({ success: true, sessionId: newSession.id });
    } catch (error) {
      console.error('Error saving therapeutic conversation:', error);
      res.status(500).json({ error: 'Failed to save conversation' });
    }
  });

  // Update an existing therapeutic chat session (for auto-save)
  app.put('/api/therapeutic-chat/sessions/:sessionId/update', isAuthenticated, async (req: any, res) => {
    try {
      const userId = String(req.user.claims.sub); // Ensure string type
      const sessionId = parseInt(req.params.sessionId);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { title, messages, sessionType, conversationStyle, focusArea } = req.body;

      console.log('Updating session:', sessionId, 'for userId:', userId, 'type:', typeof userId);

      // Verify session belongs to user - try both string and potential numeric matches
      let existingSession = await db
        .select()
        .from(therapeuticChatSessions)
        .where(and(
          eq(therapeuticChatSessions.id, sessionId),
          eq(therapeuticChatSessions.userId, userId)
        ))
        .limit(1);

      // If not found with string match, try other formats
      if (existingSession.length === 0 && !isNaN(parseInt(userId, 10))) {
        existingSession = await db
          .select()
          .from(therapeuticChatSessions)
          .where(and(
            eq(therapeuticChatSessions.id, sessionId),
            eq(therapeuticChatSessions.userId, parseInt(userId, 10).toString())
          ))
          .limit(1);
      }

      if (existingSession.length === 0) {
        console.log('Session not found for update. SessionId:', sessionId, 'UserId:', userId);
        return res.status(404).json({ error: 'Session not found' });
      }

      // Update session metadata
      await db
        .update(therapeuticChatSessions)
        .set({
          title: title || existingSession[0].title,
          sessionType: sessionType || existingSession[0].sessionType,
          conversationStyle: conversationStyle || existingSession[0].conversationStyle,
          focusArea: focusArea || existingSession[0].focusArea,
          messageCount: messages ? messages.length : existingSession[0].messageCount,
          lastActivity: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(therapeuticChatSessions.id, sessionId));

      // Delete existing messages and replace with new ones
      if (messages && messages.length > 0) {
        await db
          .delete(therapeuticChatMessages)
          .where(eq(therapeuticChatMessages.sessionId, sessionId));

        const messageData = messages.map((msg: any, index: number) => ({
          sessionId: sessionId,
          messageType: msg.type || (index % 2 === 0 ? 'user' : 'ai'),
          content: msg.content || msg.text || '',
          aiAnalysis: msg.analysis ? { analysis: msg.analysis } : null,
          aiQuestion: msg.question || null,
          actionType: msg.actionType || 'regular',
          processingTime: msg.processingTime || null,
          tokens: msg.tokens || null,
          cost: msg.cost || null,
          createdAt: new Date(msg.timestamp || new Date()),
        }));

        await db
          .insert(therapeuticChatMessages)
          .values(messageData);
      }

      res.json({ success: true, sessionId: sessionId });
    } catch (error) {
      console.error('Error updating therapeutic conversation:', error);
      res.status(500).json({ error: 'Failed to update conversation' });
    }
  });

  // Delete therapeutic chat session
  app.delete('/api/therapeutic-chat/sessions/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = String(req.user.claims.sub); // Ensure string type
      const sessionId = parseInt(req.params.sessionId);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log('Deleting session:', sessionId, 'for userId:', userId, 'type:', typeof userId);

      // Verify session belongs to user - try multiple formats
      let session = await db
        .select()
        .from(therapeuticChatSessions)
        .where(and(
          eq(therapeuticChatSessions.id, sessionId),
          eq(therapeuticChatSessions.userId, userId)
        ))
        .limit(1);

      // If not found with string match, try other formats
      if (session.length === 0 && !isNaN(parseInt(userId, 10))) {
        session = await db
          .select()
          .from(therapeuticChatSessions)
          .where(and(
            eq(therapeuticChatSessions.id, sessionId),
            eq(therapeuticChatSessions.userId, parseInt(userId, 10).toString())
          ))
          .limit(1);
      }

      if (session.length === 0) {
        console.log('Session not found for deletion. SessionId:', sessionId, 'UserId:', userId);
        return res.status(404).json({ error: 'Session not found' });
      }

      // Delete messages first
      await db
        .delete(therapeuticChatMessages)
        .where(eq(therapeuticChatMessages.sessionId, sessionId));

      // Delete session
      await db
        .delete(therapeuticChatSessions)
        .where(eq(therapeuticChatSessions.id, sessionId));

      res.json({ success: true, message: 'Session deleted successfully' });
    } catch (error) {
      console.error('Error deleting therapeutic chat session:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  });

  // Process therapeutic chat message
  app.post('/api/therapeutic-chat/process', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userInput, threadId, conversationStyle, focusArea, actionType } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Use FastChatEngine for processing
      const response = await fastChatEngine.processFastResponse(userId, threadId, userInput);

      res.json({
        professionalAnalysis: response.analysis,
        question: response.question,
        emotionalInsight: 'supportive',
        threadId: threadId
      });
    } catch (error) {
      console.error('Error processing therapeutic chat:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  });
}
