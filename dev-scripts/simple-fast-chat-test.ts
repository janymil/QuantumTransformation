#!/usr/bin/env tsx

/**
 * Simple FastChatEngine Performance Test
 * Tests core functionality without database dependencies
 */

import { processFastResponse } from '../server/therapeutic-chat/FastChatEngine';
import { buildFastPrompt } from '../server/therapeutic-chat/prompt-builders/buildFastPrompt';

async function testFastChatCore() {
  console.log('🧪 FastChatEngine Core Performance Test\n');

  // Test 1: buildFastPrompt function
  console.log('📋 Testing buildFastPrompt...');
  
  const testPrompt = buildFastPrompt(
    "I feel overwhelmed with work and questioning my abilities",
    [
      { userInput: "Previous stress about deadlines", similarity: 0.8 },
      { userInput: "Worried about job performance", similarity: 0.7 }
    ],
    {
      framework: "Cognitive Behavioral Therapy",
      tone: "supportive",
      state: "anxious",
      themes: ["work-stress", "self-doubt"]
    }
  );

  console.log('✅ Prompt structure generated');
  console.log(`   System message length: ${testPrompt[0].content.length} chars`);
  console.log(`   User prompt length: ${testPrompt[1].content.length} chars`);
  console.log('');

  // Test 2: Performance benchmark
  console.log('⚡ Running performance benchmark...');
  
  const testEntries = [
    "I'm struggling with anxiety about upcoming presentations at work",
    "Having trouble sleeping due to racing thoughts",
    "Feeling disconnected from friends and family lately",
    "Procrastinating on important tasks and feeling guilty",
    "Overwhelmed by daily responsibilities and losing motivation"
  ];

  const responseTimes: number[] = [];
  const responses: any[] = [];

  for (let i = 0; i < testEntries.length; i++) {
    const entry = testEntries[i];
    const startTime = Date.now();
    
    try {
      const response = await processFastResponse(
        `test-user-${i}`,
        `test-thread-${i}`,
        entry
      );
      
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      responses.push(response);
      
      console.log(`   Test ${i + 1}: ${responseTime}ms - "${response.analysis.substring(0, 50)}..."`);
      
    } catch (error) {
      console.log(`   Test ${i + 1}: FAILED - ${error.message}`);
    }
  }

  // Performance analysis
  const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const maxTime = Math.max(...responseTimes);
  const minTime = Math.min(...responseTimes);
  const sub1sCount = responseTimes.filter(t => t < 1000).length;

  console.log('\n📊 Performance Results:');
  console.log(`   Tests completed: ${responseTimes.length}/${testEntries.length}`);
  console.log(`   Average response time: ${Math.round(avgTime)}ms`);
  console.log(`   Fastest response: ${minTime}ms`);
  console.log(`   Slowest response: ${maxTime}ms`);
  console.log(`   Sub-1 second responses: ${sub1sCount}/${responseTimes.length} (${Math.round(sub1sCount/responseTimes.length*100)}%)`);

  // Quality analysis
  console.log('\n🎯 Response Quality Analysis:');
  responses.forEach((response, i) => {
    const hasAnalysis = response.analysis && response.analysis.length > 20;
    const hasQuestion = response.question && response.question.includes('?');
    const quality = hasAnalysis && hasQuestion ? '✅ Good' : '⚠️ Needs review';
    
    console.log(`   Response ${i + 1}: ${quality}`);
  });

  const successRate = responseTimes.length / testEntries.length * 100;
  const avgQuality = responses.filter(r => r.analysis?.length > 20 && r.question?.includes('?')).length / responses.length * 100;

  console.log('\n🏆 Final Assessment:');
  console.log(`   Success rate: ${Math.round(successRate)}%`);
  console.log(`   Quality rate: ${Math.round(avgQuality)}%`);
  console.log(`   Performance target (<1s): ${sub1sCount > responseTimes.length * 0.8 ? '✅ PASSED' : '⚠️ NEEDS OPTIMIZATION'}`);
  console.log(`   Overall status: ${successRate >= 80 && avgQuality >= 80 ? '🎉 EXCELLENT' : '🔧 GOOD'}`);
}

// Execute test
if (import.meta.url === `file://${process.argv[1]}`) {
  testFastChatCore().catch(console.error);
}