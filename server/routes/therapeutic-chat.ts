import express from 'express';
import { db } from '../db';
import { therapeuticChatSessions, therapeuticChatMessages } from '../../shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { isAuthenticated } from '../replitAuth';

const router = express.Router();

// Get all therapeutic chat sessions for a user
router.get('/sessions', isAuthenticated, async (req, res) => {
  // Force fresh query by adding timestamp and query param check
  const timestamp = Date.now();
  const forceRefresh = req.query.refresh || timestamp;
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('Querying sessions for userId:', userId, 'type:', typeof userId);
    
    // Test with string conversion to ensure type match
    const userIdString = String(userId);
    console.log('Converted userId:', userIdString);
    
    const sessions = await db
      .select()
      .from(therapeuticChatSessions)
      .where(eq(therapeuticChatSessions.userId, userIdString))
      .orderBy(desc(therapeuticChatSessions.lastActivity));
      
    console.log('Found sessions:', sessions.length);
    
    // Add cache-busting headers to ensure fresh responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Add timestamp to response headers for debugging but return sessions array
    res.setHeader('X-Debug-Timestamp', timestamp.toString());
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching therapeutic chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get messages for a specific therapeutic chat session
router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const userId = req.user?.claims?.sub;
    const sessionId = parseInt(req.params.sessionId);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify session belongs to user
    const session = await db
      .select()
      .from(therapeuticChatSessions)
      .where(and(
        eq(therapeuticChatSessions.id, sessionId),
        eq(therapeuticChatSessions.userId, userId)
      ))
      .limit(1);

    if (session.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = await db
      .select()
      .from(therapeuticChatMessages)
      .where(eq(therapeuticChatMessages.sessionId, sessionId))
      .orderBy(therapeuticChatMessages.createdAt);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching therapeutic chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create a new therapeutic chat session
router.post('/sessions', async (req, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title, sessionType, conversationStyle, focusArea, responseLength } = req.body;

    const [newSession] = await db
      .insert(therapeuticChatSessions)
      .values({
        userId,
        title: title || 'New Therapeutic Session',
        sessionType: sessionType || 'general',
        conversationStyle: conversationStyle || 'socratic',
        focusArea: focusArea || 'general',
        responseLength: responseLength || 'balanced',
        lastActivity: new Date(),
      })
      .returning();

    res.json(newSession);
  } catch (error) {
    console.error('Error creating therapeutic chat session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Save a conversation to therapeutic chat system
router.post('/save-conversation', async (req, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title, messages, sessionType, conversationStyle, focusArea } = req.body;

    // Create new therapeutic chat session
    const [newSession] = await db
      .insert(therapeuticChatSessions)
      .values({
        userId,
        title: title || 'Therapeutic Session',
        sessionType: sessionType || 'general',
        conversationStyle: conversationStyle || 'socratic',
        focusArea: focusArea || 'general',
        responseLength: 'balanced',
        messageCount: messages.length,
        lastActivity: new Date(),
      })
      .returning();

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
      }));

      await db
        .insert(therapeuticChatMessages)
        .values(messageData);
    }

    res.json({ success: true, sessionId: newSession.id });
  } catch (error) {
    console.error('Error saving therapeutic conversation:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// Update an existing therapeutic chat session (for auto-save)
router.put('/sessions/:sessionId/update', async (req, res) => {
  try {
    const userId = req.user?.claims?.sub;
    const sessionId = parseInt(req.params.sessionId);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title, messages, sessionType, conversationStyle, focusArea } = req.body;

    // Verify session belongs to user
    const existingSession = await db
      .select()
      .from(therapeuticChatSessions)
      .where(and(
        eq(therapeuticChatSessions.id, sessionId),
        eq(therapeuticChatSessions.userId, userId)
      ))
      .limit(1);

    if (existingSession.length === 0) {
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

// Delete a therapeutic chat session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const userId = req.user?.claims?.sub;
    const sessionId = parseInt(req.params.sessionId);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify session belongs to user
    const session = await db
      .select()
      .from(therapeuticChatSessions)
      .where(and(
        eq(therapeuticChatSessions.id, sessionId),
        eq(therapeuticChatSessions.userId, userId)
      ))
      .limit(1);

    if (session.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Delete session (messages will cascade delete)
    await db
      .delete(therapeuticChatSessions)
      .where(eq(therapeuticChatSessions.id, sessionId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting therapeutic chat session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;