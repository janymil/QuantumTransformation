/**
 * Fast Therapeutic Action Routes - Optimized for Action Buttons
 */

import { Router } from 'express';
import { optimizedResponseEngine } from '../therapeutic-chat/optimized-response-engine';

const router = Router();

/**
 * Handle Go Deeper action
 */
router.post('/go-deeper', async (req, res) => {
  try {
    const { userInput, threadId, userId } = req.body;
    
    if (!userInput || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await optimizedResponseEngine.generateResponse({
      userId,
      userInput,
      threadId,
      actionType: 'go_deeper'
    });

    res.json({
      success: true,
      content: response.content,
      threadId: response.threadId,
      exchangeId: response.exchangeId,
      emotionalTone: response.emotionalTone,
      tokenCount: response.tokenCount,
      cost: response.cost
    });

  } catch (error) {
    console.error('Error in go-deeper action:', error);
    res.status(500).json({ 
      error: 'Failed to process deeper exploration',
      fallback: "Let's explore this more deeply. What aspects feel most significant to you right now?"
    });
  }
});

/**
 * Handle New Direction action
 */
router.post('/new-direction', async (req, res) => {
  try {
    const { userInput, threadId, userId } = req.body;
    
    if (!userInput || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await optimizedResponseEngine.generateResponse({
      userId,
      userInput,
      threadId,
      actionType: 'new_direction'
    });

    res.json({
      success: true,
      content: response.content,
      threadId: response.threadId,
      exchangeId: response.exchangeId,
      emotionalTone: response.emotionalTone,
      tokenCount: response.tokenCount,
      cost: response.cost
    });

  } catch (error) {
    console.error('Error in new-direction action:', error);
    res.status(500).json({ 
      error: 'Failed to explore new direction',
      fallback: "Let's try a different approach. What if we looked at this from another perspective?"
    });
  }
});

/**
 * Handle regular message sending
 */
router.post('/send-message', async (req, res) => {
  try {
    const { userInput, threadId, userId } = req.body;
    
    if (!userInput || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await optimizedResponseEngine.generateResponse({
      userId,
      userInput,
      threadId,
      actionType: 'regular'
    });

    res.json({
      success: true,
      content: response.content,
      threadId: response.threadId,
      exchangeId: response.exchangeId,
      emotionalTone: response.emotionalTone,
      tokenCount: response.tokenCount,
      cost: response.cost
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      fallback: "I hear you. How would you like to explore this further?"
    });
  }
});

export default router;