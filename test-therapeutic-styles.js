/**
 * Test Therapeutic Chat Custom Styles Implementation
 * Verifies that style changes actually affect AI responses
 */

async function testTherapeuticStyles() {
  console.log('🧠 Testing Therapeutic Chat Custom Styles...\n');

  // Test different conversation styles with the same message
  const testMessage = "I've been feeling overwhelmed at work lately and it's affecting my sleep.";
  
  const styles = [
    { style: 'socratic', focus: 'general', length: 'balanced' },
    { style: 'directive', focus: 'general', length: 'balanced' },
    { style: 'reflective', focus: 'general', length: 'balanced' },
    { style: 'collaborative', focus: 'general', length: 'balanced' }
  ];

  console.log('Testing Conversation Styles with same message:');
  console.log(`Message: "${testMessage}"\n`);

  for (const config of styles) {
    try {
      console.log(`Testing ${config.style.toUpperCase()} style:`);
      
      const response = await fetch('http://localhost:5000/api/therapeutic-chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': await getAuthCookie()
        },
        body: JSON.stringify({
          userInput: testMessage,
          conversationStyle: config.style,
          focusArea: config.focus,
          responseLength: config.length
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Response: "${data.response.substring(0, 120)}..."`);
        console.log(`   Follow-up: "${data.followUpQuestion}"`);
        console.log(`   Emotional Insight: ${data.emotionalInsight}\n`);
      } else {
        console.log(`❌ Failed: ${response.status}\n`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }

  // Test different focus areas
  const focusAreas = ['emotions', 'patterns', 'goals', 'relationships'];
  
  console.log('\n---\nTesting Focus Areas with same style (socratic):');
  
  for (const focus of focusAreas) {
    try {
      console.log(`Testing ${focus.toUpperCase()} focus:`);
      
      const response = await fetch('http://localhost:5000/api/therapeutic-chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': await getAuthCookie()
        },
        body: JSON.stringify({
          userInput: testMessage,
          conversationStyle: 'socratic',
          focusArea: focus,
          responseLength: 'balanced'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Response: "${data.response.substring(0, 120)}..."`);
        console.log(`   Follow-up: "${data.followUpQuestion}"`);
        console.log(`   Emotional Insight: ${data.emotionalInsight}\n`);
      } else {
        console.log(`❌ Failed: ${response.status}\n`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }

  // Test different response lengths
  const lengths = ['brief', 'balanced', 'detailed'];
  
  console.log('\n---\nTesting Response Lengths with same style and focus:');
  
  for (const length of lengths) {
    try {
      console.log(`Testing ${length.toUpperCase()} length:`);
      
      const response = await fetch('http://localhost:5000/api/therapeutic-chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': await getAuthCookie()
        },
        body: JSON.stringify({
          userInput: testMessage,
          conversationStyle: 'socratic',
          focusArea: 'general',
          responseLength: length
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Response (${data.response.length} chars): "${data.response.substring(0, 120)}..."`);
        console.log(`   Follow-up: "${data.followUpQuestion}"`);
        console.log(`   Emotional Insight: ${data.emotionalInsight}\n`);
      } else {
        console.log(`❌ Failed: ${response.status}\n`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
}

async function getAuthCookie() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/user', {
      credentials: 'include'
    });
    
    if (response.ok) {
      return response.headers.get('set-cookie') || '';
    }
    return '';
  } catch (error) {
    console.log('Auth check failed, proceeding without cookie');
    return '';
  }
}

// Run the test
testTherapeuticStyles().catch(console.error);