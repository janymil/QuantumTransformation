/**
 * Test Advanced Therapeutic Chat Engine Connection
 * Verifies the integration between frontend and advanced engine
 */

import fs from 'fs';

async function testAdvancedTherapeuticEngine() {
  console.log('🧠 Testing Advanced Therapeutic Chat Engine Connection...\n');

  // Get authentication cookie using the same method as other tests
  let authCookie = '';
  try {
    const cookieData = fs.readFileSync('cookies.txt', 'utf8');
    const sessionMatch = cookieData.match(/connect\.sid=([^;]+)/);
    if (sessionMatch) {
      authCookie = `connect.sid=${sessionMatch[1]}`;
      console.log('✅ Authentication cookie found');
    }
  } catch (error) {
    console.log('⚠️ No authentication cookie found, testing without auth');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(authCookie && { 'Cookie': authCookie })
  };

  console.log('📋 Testing different conversation styles with advanced engine...\n');

  const testMessage = "I've been feeling overwhelmed at work lately and it's affecting my sleep.";
  
  const styles = [
    { style: 'socratic', focus: 'emotions', length: 'balanced' },
    { style: 'directive', focus: 'patterns', length: 'brief' },
    { style: 'reflective', focus: 'general', length: 'detailed' },
    { style: 'collaborative', focus: 'goals', length: 'balanced' }
  ];

  for (const config of styles) {
    try {
      console.log(`\n--- Testing ${config.style.toUpperCase()} style with ${config.focus} focus ---`);
      
      const response = await fetch('http://localhost:5000/api/therapeutic-chat/process', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userInput: testMessage,
          conversationStyle: config.style,
          focusArea: config.focus,
          responseLength: config.length
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Advanced Engine Response:`);
        console.log(`   Response: "${data.response.substring(0, 120)}..."`);
        console.log(`   Follow-up: "${data.followUpQuestion}"`);
        console.log(`   Emotional State: ${data.emotionalInsight}`);
        console.log(`   Thread ID: ${data.threadId}`);
        console.log(`   Exchange ID: ${data.exchangeId}`);
        console.log(`   Cost: $${data.cost}`);
        console.log(`   Remaining Requests: ${data.remainingRequests}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n📋 Testing special action types...\n');

  // Test go_deeper action
  try {
    console.log('--- Testing GO DEEPER action ---');
    
    const response = await fetch('http://localhost:5000/api/therapeutic-chat/process', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userInput: "I think my perfectionism is holding me back",
        conversationStyle: 'socratic',
        focusArea: 'patterns',
        responseLength: 'balanced',
        actionType: 'go_deeper'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Go Deeper Response:`);
      console.log(`   Response: "${data.response.substring(0, 120)}..."`);
      console.log(`   Follow-up: "${data.followUpQuestion}"`);
    } else {
      console.log(`❌ Go Deeper failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Go Deeper error: ${error.message}`);
  }

  // Test new_direction action
  try {
    console.log('\n--- Testing NEW DIRECTION action ---');
    
    const response = await fetch('http://localhost:5000/api/therapeutic-chat/process', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userInput: "Let's explore this from a different angle",
        conversationStyle: 'collaborative',
        focusArea: 'general',
        responseLength: 'balanced',
        actionType: 'new_direction'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ New Direction Response:`);
      console.log(`   Response: "${data.response.substring(0, 120)}..."`);
      console.log(`   Follow-up: "${data.followUpQuestion}"`);
    } else {
      console.log(`❌ New Direction failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ New Direction error: ${error.message}`);
  }

  console.log('\n🎯 Advanced Therapeutic Engine Integration Test Complete!');
}

// Run the test
testAdvancedTherapeuticEngine().catch(console.error);