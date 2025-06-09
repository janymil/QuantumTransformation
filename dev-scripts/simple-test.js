
#!/usr/bin/env node

/**
 * Simple Fast Journaling Test Script
 * Tests the therapeutic chat API endpoints directly
 */

const testData = {
  userId: "test-user-12345",
  threadId: 1,
  entries: [
    "I feel overwhelmed with work pressure and can't seem to find balance.",
    "Today I realized I've been avoiding difficult conversations with my partner.",
    "I've been making progress with my meditation practice and feel more centered.",
    "Money stress is keeping me up at night and I keep procrastinating on budgeting."
  ]
};

async function testTherapeuticChat() {
  console.log('🧪 Testing Therapeutic Chat System');
  console.log('=' .repeat(50));

  for (let i = 0; i < testData.entries.length; i++) {
    const entry = testData.entries[i];
    console.log(`\n📝 Test ${i + 1}: "${entry.substring(0, 40)}..."`);
    console.log('-'.repeat(40));

    try {
      // Test the therapeutic chat endpoint
      const response = await fetch('http://localhost:5000/api/therapeutic-chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: entry,
          conversationStyle: 'empathetic',
          focusArea: 'general',
          responseLength: 'balanced'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response received');
        console.log(`📄 Response: ${data.response || data.question || 'No response text'}`);
        
        if (data.analysis) {
          console.log(`🧠 Analysis: ${JSON.stringify(data.analysis, null, 2)}`);
        }
      } else {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }

    // Wait between requests
    if (i < testData.entries.length - 1) {
      console.log('⏳ Waiting 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n🎯 Testing Direct Action Button');
  console.log('-'.repeat(40));
  
  try {
    const response = await fetch('http://localhost:5000/api/therapeutic-chat/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInput: testData.entries[0],
        actionType: 'go_deeper'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Action button response received');
      console.log(`📄 Question: ${data.question}`);
    } else {
      console.log(`❌ Action API Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Action Network Error: ${error.message}`);
  }

  console.log('\n✅ All tests completed!');
  console.log('📊 Check server logs for post-processing job activity.');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:5000/api/deep-journaling/stats');
    if (response.ok) {
      console.log('✅ Server is running on port 5000');
      return true;
    }
  } catch (error) {
    console.log('❌ Server not responding on port 5000');
    console.log('💡 Please start the server with: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Fast Journaling System Test\n');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await testTherapeuticChat();
}

main().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
