
/**
 * Fast Therapeutic Action Routes - Optimized for Action Buttons
 * Uses FastChatEngine for immediate responses + background post-processing
 */

import { Router } from 'express';
import { fastChatEngine } from '../therapeutic-chat/fast-chat-engine';
import { PostProcessingJob } from '../jobs/post-processing-job';
import { isAuthenticated } from '../replitAuth';
import { db } from '../db';
import { journalingThreads, threadExchanges } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Handle Go Deeper action
 */
router.post('/go-deeper', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { userInput, threadId } = req.body;
    
    if (!userInput || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Step 1: Get immediate response from FastChatEngine
    const response = await fastChatEngine.processFastResponse(
      userId,
      threadId || null,
      userInput
    );

    // Step 2: Send immediate response to frontend
    res.json({
      success: true,
      question: response.question,
      analysis: {
        professionalAnalysis: response.analysis
      },
      actionType: 'go_deeper',
      threadId: threadId || null,
      timestamp: new Date().toISOString()
    });

    // Step 3: Enqueue background processing (don't await)
    if (threadId) {
      PostProcessingJob.enqueue(userId, threadId.toString(), userInput).catch((error: any) => {
        console.error('Failed to enqueue post-processing job for go-deeper:', error);
      });
    }

  } catch (error) {
    console.error('Error in go-deeper action:', error);
    res.status(500).json({ 
      error: 'Failed to process deeper exploration',
      question: "Let's explore this more deeply. What aspects feel most significant to you right now?",
      analysis: { professionalAnalysis: "I'm here to support your therapeutic journey." }
    });
  }
});

/**
 * Handle New Direction action
 */
router.post('/new-direction', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { userInput, threadId } = req.body;
    
    if (!userInput || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Step 1: Get immediate response from FastChatEngine
    const response = await fastChatEngine.processFastResponse(
      userId,
      threadId || null,
      userInput
    );

    // Step 2: Send immediate response to frontend
    res.json({
      success: true,
      question: response.question,
      analysis: {
        professionalAnalysis: response.analysis
      },
      actionType: 'new_direction',
      threadId: threadId || null,
      timestamp: new Date().toISOString()
    });

    // Step 3: Enqueue background processing (don't await)
    if (threadId) {
      PostProcessingJob.enqueue(userId, threadId.toString(), userInput).catch((error: any) => {
        console.error('Failed to enqueue post-processing job for new-direction:', error);
      });
    }

  } catch (error) {
    console.error('Error in new-direction action:', error);
    res.status(500).json({ 
      error: 'Failed to explore new direction',
      question: "Let's try a different approach. What if we looked at this from another perspective?",
      analysis: { professionalAnalysis: "I'm committed to helping you find new pathways forward." }
    });
  }
});

/**
 * Handle regular message sending
 */
router.post('/send-message', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { userInput, threadId } = req.body;
    
    if (!userInput || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Step 1: Get immediate response from FastChatEngine
    const response = await fastChatEngine.processFastResponse(
      userId,
      threadId || null,
      userInput
    );

    // Step 2: Send immediate response to frontend
    res.json({
      success: true,
      question: response.question,
      analysis: {
        professionalAnalysis: response.analysis
      },
      actionType: 'regular',
      threadId: threadId || null,
      timestamp: new Date().toISOString()
    });

    // Step 3: Enqueue background processing (don't await)
    if (threadId) {
      PostProcessingJob.enqueue(userId, threadId.toString(), userInput).catch((error: any) => {
        console.error('Failed to enqueue post-processing job for send-message:', error);
      });
    }

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      question: "I hear you. How would you like to explore this further?",
      analysis: { professionalAnalysis: "I'm here to provide thoughtful support." }
    });
  }
});

/**
 * Save therapeutic conversation
 */
router.post('/save-conversation', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { title, messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Create a new thread for the therapeutic session
    const [newThread] = await db
      .insert(journalingThreads)
      .values({
        userId,
        title: title || "Therapeutic Chat Session",
        threadType: 'therapy_session', // This is the key fix!
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Save all exchanges to the thread
    let exchangeOrder = 0;
    for (const message of messages) {
      if (message.type === 'user' || message.type === 'ai') {
        await db
          .insert(threadExchanges)
          .values({
            threadId: newThread.id,
            exchangeOrder: exchangeOrder++,
            userInput: message.type === 'user' ? message.content : '',
            aiResponse: message.type === 'ai' ? message.content : '',
            emotionalContext: message.emotionalTone || 'neutral',
            createdAt: new Date(message.timestamp || new Date())
          });
      }
    }

    res.json({
      success: true,
      threadId: newThread.id,
      title: newThread.title,
      messageCount: messages.length
    });

  } catch (error) {
    console.error('Error saving therapeutic conversation:', error);
    res.status(500).json({ 
      error: 'Failed to save conversation',
      message: 'Unable to save your therapeutic session. Please try again.'
    });
  }
});

export default router;
