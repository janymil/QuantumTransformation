/**
 * FastChatEngine Test Script
 * Tests the rapid psychological response system with embedding search and GPT-4o integration
 */

const BASE_URL = 'http://localhost:5000';

async function testFastChatEngine() {
  console.log('🧠 Testing FastChatEngine Implementation');
  console.log('=====================================\n');

  try {
    // Test 1: Health check
    console.log('1. Testing therapeutic chat health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/therapeutic-chat/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }

    // Test 2: Test with sample journal entry
    console.log('\n2. Testing FastChatEngine with sample entry...');
    
    const testEntry = {
      entryText: "I've been feeling overwhelmed with work lately and struggling to find balance. Everything feels like it's piling up and I can't seem to catch a break.",
      threadId: "test-thread-001"
    };

    console.log('Test entry:', testEntry.entryText);
    
    const fastResponse = await fetch(`${BASE_URL}/api/therapeutic-chat/fast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEntry)
    });

    if (fastResponse.ok) {
      const responseData = await fastResponse.json();
      console.log('✅ FastChatEngine response received:');
      console.log('Analysis:', responseData.analysis);
      console.log('Question:', responseData.question);
      console.log('Processing time:', responseData.processingTime, 'ms');
    } else {
      const errorData = await fastResponse.text();
      console.log('❌ FastChatEngine test failed:', fastResponse.status);
      console.log('Error:', errorData);
    }

    // Test 3: Test with different emotional context
    console.log('\n3. Testing with different emotional context...');
    
    const testEntry2 = {
      entryText: "I accomplished something important today and feel proud of myself. It's been a while since I felt this confident about my abilities.",
      threadId: "test-thread-002"
    };

    console.log('Test entry 2:', testEntry2.entryText);
    
    const fastResponse2 = await fetch(`${BASE_URL}/api/therapeutic-chat/fast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEntry2)
    });

    if (fastResponse2.ok) {
      const responseData2 = await fastResponse2.json();
      console.log('✅ Second FastChatEngine response received:');
      console.log('Analysis:', responseData2.analysis);
      console.log('Question:', responseData2.question);
      console.log('Processing time:', responseData2.processingTime, 'ms');
    } else {
      console.log('❌ Second FastChatEngine test failed:', fastResponse2.status);
    }

    // Test 4: Performance test
    console.log('\n4. Testing response speed...');
    const startTime = Date.now();
    
    const perfResponse = await fetch(`${BASE_URL}/api/therapeutic-chat/fast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entryText: "Quick performance test entry for measuring response time.",
        threadId: "perf-test"
      })
    });

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`⏱️ Total request time: ${totalTime}ms`);
    
    if (perfResponse.ok) {
      const perfData = await perfResponse.json();
      console.log(`✅ AI processing time: ${perfData.processingTime}ms`);
      console.log(`📊 Network overhead: ${totalTime - perfData.processingTime}ms`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🏁 FastChatEngine testing complete');
}

// Run the test
testFastChatEngine().catch(console.error);