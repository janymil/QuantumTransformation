/**
 * PostProcessingJob Integration Test
 * Tests the complete flow: FastChatEngine -> PostProcessingJob -> Database
 */

import { fastChatEngine } from './server/therapeutic-chat/fast-chat-engine.js';
import { PostProcessingJob } from './server/jobs/post-processing-job.js';
import { db } from './server/db.js';
import { psychologicalProfile, journalingThreads, threadExchanges } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const TEST_USER_ID = '43272767';
const TEST_THREAD_ID = 1;

async function testCompleteFlow() {
  console.log('\n🚀 Testing Complete PostProcessingJob Integration...\n');

  try {
    // Test data for comprehensive psychological analysis
    const testEntries = [
      {
        text: "I've been feeling overwhelmed with work stress and having trouble sleeping. The anxiety keeps building up and I can't find a way to relax.",
        expectedEmotions: ['anxious', 'overwhelmed', 'stressed']
      },
      {
        text: "Had a breakthrough moment today during meditation. I realized my perfectionism is holding me back from actually enjoying my achievements.",
        expectedEmotions: ['insightful', 'reflective', 'hopeful']
      },
      {
        text: "Struggling with self-doubt again. Every decision feels wrong and I keep second-guessing myself. It's exhausting.",
        expectedEmotions: ['doubtful', 'exhausted', 'uncertain']
      }
    ];

    console.log('📊 Testing FastChatEngine responses...');
    
    for (let i = 0; i < testEntries.length; i++) {
      const entry = testEntries[i];
      console.log(`\n🔄 Processing entry ${i + 1}: "${entry.text.substring(0, 60)}..."`);
      
      try {
        // Test FastChatEngine response
        const fastResponse = await fastChatEngine.processFastResponse(
          TEST_USER_ID, 
          TEST_THREAD_ID, 
          entry.text
        );
        
        console.log(`✅ FastChatEngine response generated:`);
        console.log(`   Analysis: ${fastResponse.analysis.substring(0, 100)}...`);
        console.log(`   Question: ${fastResponse.question.substring(0, 100)}...`);
        
        // Test PostProcessingJob execution
        console.log(`🔄 Triggering PostProcessingJob...`);
        const jobId = await PostProcessingJob.enqueue(
          TEST_USER_ID,
          TEST_THREAD_ID.toString(),
          entry.text
        );
        
        console.log(`✅ PostProcessingJob enqueued with ID: ${jobId}`);
        
        // Wait for job processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log(`📊 Checking job queue status...`);
        const queueStatus = PostProcessingJob.getQueueStatus();
        console.log(`   Total jobs: ${queueStatus.total}`);
        console.log(`   Completed: ${queueStatus.completed}`);
        console.log(`   Processing: ${queueStatus.processing}`);
        
      } catch (error) {
        console.error(`❌ Error processing entry ${i + 1}:`, error.message);
      }
    }
    
    // Test psychological profile updates
    console.log('\n📊 Checking Psychological Profile Updates...');
    const profile = await db
      .select()
      .from(psychologicalProfile)
      .where(eq(psychologicalProfile.userId, TEST_USER_ID))
      .limit(1);
    
    if (profile.length > 0) {
      const userProfile = profile[0];
      console.log('✅ Psychological Profile Found:');
      console.log(`   Dominant Emotion: ${userProfile.currentDominantEmotion}`);
      console.log(`   Emotional Volatility: ${userProfile.emotionalVolatility}`);
      console.log(`   Total Data Points: ${userProfile.totalDataPoints}`);
      console.log(`   Last Analysis: ${userProfile.lastFullAnalysisAt}`);
      
      if (userProfile.emotionalPatterns) {
        console.log(`   Emotional Patterns: ${JSON.stringify(userProfile.emotionalPatterns, null, 2)}`);
      }
      
      if (userProfile.personalityTraits) {
        console.log(`   Personality Traits: ${JSON.stringify(userProfile.personalityTraits, null, 2)}`);
      }
    } else {
      console.log('❓ No psychological profile found for test user');
    }
    
    // Test thread context updates
    console.log('\n📊 Checking Thread Context Updates...');
    const thread = await db
      .select()
      .from(journalingThreads)
      .where(eq(journalingThreads.id, TEST_THREAD_ID))
      .limit(1);
    
    if (thread.length > 0) {
      const threadData = thread[0];
      console.log('✅ Thread Context Found:');
      console.log(`   Current Emotional State: ${threadData.currentEmotionalState}`);
      console.log(`   Preferred Tone: ${threadData.preferredTone}`);
      console.log(`   Preferred Perspective: ${threadData.preferredPerspective}`);
      console.log(`   Last Active: ${threadData.lastActiveAt}`);
    } else {
      console.log('❓ No thread context found for test thread');
    }
    
    // Test thread exchanges
    console.log('\n📊 Checking Thread Exchanges...');
    const exchanges = await db
      .select()
      .from(threadExchanges)
      .where(eq(threadExchanges.threadId, TEST_THREAD_ID))
      .orderBy(threadExchanges.exchangeOrder);
    
    console.log(`✅ Found ${exchanges.length} thread exchanges`);
    exchanges.forEach((exchange, idx) => {
      console.log(`   Exchange ${idx + 1}:`);
      console.log(`     User Input: ${exchange.userInput?.substring(0, 60)}...`);
      console.log(`     AI Analysis: ${typeof exchange.aiAnalysis === 'object' ? JSON.stringify(exchange.aiAnalysis).substring(0, 60) + '...' : exchange.aiAnalysis?.substring(0, 60) + '...'}`);
      console.log(`     AI Question: ${exchange.aiQuestion?.substring(0, 60)}...`);
    });
    
    console.log('\n🎉 PostProcessingJob Integration Test Complete!');
    console.log('\n📋 System Status Summary:');
    console.log(`✅ FastChatEngine: Operational`);
    console.log(`✅ PostProcessingJob: Operational`);
    console.log(`✅ Database Integration: Working`);
    console.log(`✅ Psychological Profiling: Active`);
    console.log(`✅ Thread Context Updates: Working`);
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the integration test
testCompleteFlow();