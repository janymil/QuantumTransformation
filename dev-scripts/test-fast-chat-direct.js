/**
 * Direct FastChatEngine Test
 * Tests the FastChatEngine module directly without API authentication
 */

import { fastChatEngine } from '../server/therapeutic-chat/fast-chat-engine.ts';

async function testFastChatEngineDirect() {
  console.log('Testing FastChatEngine Direct Implementation');
  console.log('==========================================\n');

  const testUserId = "43272767"; // Real authenticated user ID
  
  try {
    // Test 1: Basic functionality with overwhelm scenario
    console.log('1. Testing overwhelm scenario...');
    const startTime1 = Date.now();
    
    const response1 = await fastChatEngine.processFastResponse(
      testUserId,
      "test-thread-001",
      "I've been feeling overwhelmed with work lately and struggling to find balance. Everything feels like it's piling up and I can't seem to catch a break."
    );
    
    const endTime1 = Date.now();
    console.log(`Processing time: ${endTime1 - startTime1}ms`);
    console.log('Analysis:', response1.analysis);
    console.log('Question:', response1.question);
    console.log('');

    // Test 2: Achievement scenario
    console.log('2. Testing achievement scenario...');
    const startTime2 = Date.now();
    
    const response2 = await fastChatEngine.processFastResponse(
      testUserId,
      "test-thread-002", 
      "I accomplished something important today and feel proud of myself. It's been a while since I felt this confident about my abilities."
    );
    
    const endTime2 = Date.now();
    console.log(`Processing time: ${endTime2 - startTime2}ms`);
    console.log('Analysis:', response2.analysis);
    console.log('Question:', response2.question);
    console.log('');

    // Test 3: Speed optimization test
    console.log('3. Testing speed optimization...');
    const speedTests = [];
    
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      await fastChatEngine.processFastResponse(
        testUserId,
        `speed-test-${i}`,
        `This is speed test number ${i + 1} to measure consistent performance.`
      );
      const end = Date.now();
      speedTests.push(end - start);
    }
    
    const avgTime = speedTests.reduce((a, b) => a + b, 0) / speedTests.length;
    console.log(`Average processing time: ${avgTime.toFixed(0)}ms`);
    console.log(`Speed consistency: ${Math.min(...speedTests)}ms - ${Math.max(...speedTests)}ms`);

    console.log('\nFastChatEngine testing completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFastChatEngineDirect().catch(console.error);