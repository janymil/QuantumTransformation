/**
 * Fast Therapeutic Action Routes - Optimized for Action Buttons
 */

import { Router } from 'express';

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

    // Use FastChatEngine for immediate response
    const { fastChatEngine } = await import('../therapeutic-chat/FastChatEngine');
    
    const response = await fastChatEngine.processFastResponse(
      userId,
      threadId,
      userInput
    );

    // Send response immediately to user
    res.json({
      success: true,
      analysis: response.analysis,
      question: response.question
    });

    // Enqueue background post-processing job (non-blocking)
    const { postProcessingJob } = await import('../jobs/post-processing-job');
    await postProcessingJob.enqueue({
      userId,
      threadId: threadId || 'default',
      entryText: userInput
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

    // Use FastChatEngine for immediate response
    const { fastChatEngine } = await import('../therapeutic-chat/FastChatEngine');
    
    const response = await fastChatEngine.processFastResponse(
      userId,
      threadId,
      userInput
    );

    // Send response immediately to user
    res.json({
      success: true,
      analysis: response.analysis,
      question: response.question
    });

    // Enqueue background post-processing job (non-blocking)
    const { postProcessingJob } = await import('../jobs/post-processing-job');
    await postProcessingJob.enqueue({
      userId,
      threadId: threadId || 'default',
      entryText: userInput
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

    // Use FastChatEngine for immediate response
    const { fastChatEngine } = await import('../therapeutic-chat/FastChatEngine');
    
    const response = await fastChatEngine.processFastResponse(
      userId,
      threadId,
      userInput
    );

    // Send response immediately to user
    res.json({
      success: true,
      analysis: response.analysis,
      question: response.question
    });

    // Enqueue background post-processing job (non-blocking)
    const { postProcessingJob } = await import('../jobs/post-processing-job');
    await postProcessingJob.enqueue({
      userId,
      threadId: threadId || 'default',
      entryText: userInput
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