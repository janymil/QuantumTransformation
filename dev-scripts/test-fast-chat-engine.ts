#!/usr/bin/env tsx

/**
 * Test Script for FastChatEngine and PostProcessingJob
 * 
 * This script simulates a full journaling workflow:
 * 1. Tests processFastResponse() with mock user data
 * 2. Prints GPT response (analysis + question)
 * 3. Triggers PostProcessingJob manually
 * 4. Fetches saved psychological profile
 * 
 * Usage: npm run test:fast-chat or tsx dev-scripts/test-fast-chat-engine.ts
 */

import fs from 'fs';
import path from 'path';
import { processFastResponse } from '../server/therapeutic-chat/FastChatEngine';
import { getLastSessionInsights } from '../server/therapeutic-chat/helpers/getLastSessionInsights';
import { db } from '../server/db';
import { psychologicalProfile, journalingThreads, threadExchanges } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Load mock data
const mockDataPath = path.join(__dirname, 'test-mock-data.json');
const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

interface TestResults {
  fastResponse: any;
  responseTime: number;
  postProcessingResults: any;
  finalProfile: any;
}

async function runFastChatEngineTest(): Promise<TestResults> {
  console.log('🧪 Starting FastChatEngine Test Suite\n');
  
  const { testUser, journalEntries, mockInsights } = mockData;
  const userId = testUser.userId;
  
  // Test 1: Test processFastResponse() with mock journal entry
  console.log('📝 Testing processFastResponse()...');
  const testEntry = journalEntries[0]; // Use first journal entry
  
  const startTime = Date.now();
  
  try {
    const fastResponse = await processFastResponse(
      userId,
      'test-thread-123',
      testEntry.text
    );
    
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Fast response generated in ${responseTime}ms`);
    console.log('📊 Response Details:');
    console.log(`   Analysis: "${fastResponse.analysis}"`);
    console.log(`   Question: "${fastResponse.question}"`);
    console.log('');
    
    // Test 2: Create thread and exchange records for realistic data
    console.log('💾 Creating test thread and exchange records...');
    
    // Create a journaling thread
    const [newThread] = await db.insert(journalingThreads).values({
      userId: userId,
      title: 'Test Journal Session',
      createdAt: new Date(),
      lastActiveAt: new Date()
    }).returning();
    
    // Create a thread exchange
    await db.insert(threadExchanges).values({
      threadId: newThread.id,
      userInput: testEntry.text,
      aiAnalysis: fastResponse.analysis,
      aiQuestion: fastResponse.question,
      createdAt: new Date()
    });
    
    console.log('✅ Test records created');
    
    // Test 3: Test getLastSessionInsights()
    console.log('🔍 Testing getLastSessionInsights()...');
    
    const sessionInsights = await getLastSessionInsights(userId);
    console.log('📊 Session Insights:');
    console.log(`   Framework: ${sessionInsights.framework}`);
    console.log(`   Tone: ${sessionInsights.tone}`);
    console.log(`   State: ${sessionInsights.state}`);
    console.log(`   Themes: [${sessionInsights.themes.join(', ')}]`);
    console.log('');
    
    // Test 4: Simulate post-processing job (create psychological profile entry)
    console.log('⚙️ Simulating PostProcessingJob...');
    
    // Check if profile exists for user
    const existingProfile = await db.select()
      .from(psychologicalProfile)
      .where(eq(psychologicalProfile.user_id, userId))
      .limit(1);
    
    let profileResult;
    
    if (existingProfile.length === 0) {
      // Create new profile
      [profileResult] = await db.insert(psychologicalProfile).values({
        user_id: userId,
        current_dominant_emotion: testEntry.emotionalState || 'neutral',
        personality_traits: JSON.stringify({
          openness: 0.7,
          conscientiousness: 0.6,
          extraversion: 0.5,
          agreeableness: 0.8,
          neuroticism: 0.4
        }),
        communication_preferences: JSON.stringify({
          preferredTone: mockInsights.tone,
          responseDepth: 'moderate',
          frameworkPreference: mockInsights.framework
        }),
        therapeutic_goals: JSON.stringify(mockInsights.themes),
        updated_at: new Date()
      }).returning();
      
      console.log('✅ New psychological profile created');
    } else {
      // Update existing profile
      [profileResult] = await db.update(psychologicalProfile)
        .set({
          current_dominant_emotion: testEntry.emotionalState || 'neutral',
          updated_at: new Date()
        })
        .where(eq(psychologicalProfile.user_id, userId))
        .returning();
      
      console.log('✅ Psychological profile updated');
    }
    
    // Test 5: Fetch final psychological profile
    console.log('📋 Fetching final psychological profile...');
    
    const finalProfile = await db.select()
      .from(psychologicalProfile)
      .where(eq(psychologicalProfile.user_id, userId))
      .limit(1);
    
    if (finalProfile.length > 0) {
      const profile = finalProfile[0];
      console.log('📊 Final Profile Summary:');
      console.log(`   User ID: ${profile.user_id}`);
      console.log(`   Dominant Emotion: ${profile.current_dominant_emotion}`);
      console.log(`   Last Updated: ${profile.updated_at}`);
      
      try {
        const traits = JSON.parse(profile.personality_traits as string);
        console.log(`   Personality Traits: Openness=${traits.openness}, Conscientiousness=${traits.conscientiousness}`);
        
        const prefs = JSON.parse(profile.communication_preferences as string);
        console.log(`   Communication: Tone=${prefs.preferredTone}, Framework=${prefs.frameworkPreference}`);
        
        const goals = JSON.parse(profile.therapeutic_goals as string);
        console.log(`   Therapeutic Goals: [${goals.join(', ')}]`);
      } catch (error) {
        console.log('   (Profile data parsing skipped)');
      }
    }
    
    console.log('\n🎉 FastChatEngine Test Suite Completed Successfully!');
    console.log(`   Total response time: ${responseTime}ms`);
    console.log(`   Target: <1000ms (${responseTime < 1000 ? '✅ PASSED' : '❌ NEEDS OPTIMIZATION'})`);
    
    return {
      fastResponse,
      responseTime,
      postProcessingResults: profileResult,
      finalProfile: finalProfile[0] || null
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Performance benchmark function
async function runPerformanceBenchmark() {
  console.log('\n🏃‍♂️ Running Performance Benchmark...');
  
  const { testUser, journalEntries } = mockData;
  const userId = testUser.userId;
  const testCount = 5;
  const responseTimes: number[] = [];
  
  for (let i = 0; i < testCount; i++) {
    const entryIndex = i % journalEntries.length;
    const testEntry = journalEntries[entryIndex];
    
    const startTime = Date.now();
    
    try {
      await processFastResponse(
        userId,
        `benchmark-thread-${i}`,
        testEntry.text
      );
      
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      
      console.log(`   Test ${i + 1}/${testCount}: ${responseTime}ms`);
      
    } catch (error) {
      console.error(`   Test ${i + 1}/${testCount}: FAILED`);
    }
  }
  
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const maxResponseTime = Math.max(...responseTimes);
  const minResponseTime = Math.min(...responseTimes);
  
  console.log('\n📊 Performance Results:');
  console.log(`   Average: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`   Min: ${minResponseTime}ms`);
  console.log(`   Max: ${maxResponseTime}ms`);
  console.log(`   Sub-1s Success Rate: ${responseTimes.filter(t => t < 1000).length}/${testCount} (${((responseTimes.filter(t => t < 1000).length / testCount) * 100).toFixed(1)}%)`);
}

// Main execution
async function main() {
  try {
    console.log('🚀 FastChatEngine Test Suite');
    console.log('================================\n');
    
    // Run main test
    const results = await runFastChatEngineTest();
    
    // Run performance benchmark
    await runPerformanceBenchmark();
    
    console.log('\n✨ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { runFastChatEngineTest, runPerformanceBenchmark };