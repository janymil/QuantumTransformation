/**
 * Therapeutic Chat Module Entry Point
 * Exports deep journaling routes and fast chat engine
 */

import { Express } from 'express';
import { fastChatEngine } from './fast-chat-engine';

/**
 * Register deep journaling routes with FastChatEngine integration
 */
export async function registerDeepJournalingRoutes(app: Express): Promise<void> {
  // Fast therapeutic chat endpoint for rapid psychological responses
  app.post('/api/therapeutic-chat/fast', async (req: any, res) => {
    try {
      const { entryText, threadId } = req.body;
      const userId = req.user?.id || req.user?.claims?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!entryText || entryText.trim().length === 0) {
        return res.status(400).json({ error: 'Entry text is required' });
      }

      // Use FastChatEngine for rapid response
      const response = await fastChatEngine.processFastResponse(userId, threadId, entryText);

      res.json(response);
    } catch (error: any) {
      console.error('Fast therapeutic chat error:', error);
      res.status(500).json({ 
        error: 'Failed to process therapeutic response',
        details: error.message 
      });
    }
  });

  // Health check endpoint for therapeutic chat
  app.get('/api/therapeutic-chat/health', (req, res) => {
    res.json({ 
      status: 'active',
      fastChatEngine: 'ready',
      timestamp: new Date().toISOString()
    });
  });

  console.log('Deep journaling routes with FastChatEngine registered');
}

// Re-export fast chat engine
export { fastChatEngine } from './fast-chat-engine';