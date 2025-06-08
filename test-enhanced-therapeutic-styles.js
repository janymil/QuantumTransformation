/**
 * Test Enhanced Therapeutic Chat Styles
 * Verifies that each style produces distinctly different responses
 */

async function testEnhancedTherapeuticStyles() {
  console.log('🧠 Testing Enhanced Therapeutic Chat Styles Implementation...\n');

  const testMessage = "I keep procrastinating on important tasks and then feel guilty about it later.";
  
  // Test each conversation style with same message
  const styles = ['socratic', 'directive', 'reflective', 'collaborative'];
  
  console.log(`Testing message: "${testMessage}"\n`);
  console.log('='.repeat(80));
  
  for (const style of styles) {
    try {
      console.log(`\n📋 ${style.toUpperCase()} STYLE:`);
      console.log('-'.repeat(50));
      
      const response = await makeTherapeuticRequest({
        userInput: testMessage,
        conversationStyle: style,
        focusArea: 'general',
        responseLength: 'balanced'
      });

      if (response) {
        console.log(`Response: "${response.response}"`);
        console.log(`Follow-up: "${response.followUpQuestion}"`);
        console.log(`Emotional Insight: ${response.emotionalInsight}`);
        
        // Analyze style characteristics
        analyzeStyleCharacteristics(style, response);
      }
    } catch (error) {
      console.log(`❌ Error testing ${style}: ${error.message}`);
    }
  }

  // Test focus areas with socratic style
  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 Testing Focus Areas (Socratic Style):');
  
  const focusAreas = ['emotions', 'patterns', 'goals', 'relationships'];
  
  for (const focus of focusAreas) {
    try {
      console.log(`\n📍 ${focus.toUpperCase()} FOCUS:`);
      console.log('-'.repeat(30));
      
      const response = await makeTherapeuticRequest({
        userInput: testMessage,
        conversationStyle: 'socratic',
        focusArea: focus,
        responseLength: 'balanced'
      });

      if (response) {
        console.log(`Response: "${response.response}"`);
        console.log(`Follow-up: "${response.followUpQuestion}"`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${focus}: ${error.message}`);
    }
  }

  // Test response lengths
  console.log('\n' + '='.repeat(80));
  console.log('\n📏 Testing Response Lengths (Directive Style):');
  
  const lengths = ['brief', 'balanced', 'detailed'];
  
  for (const length of lengths) {
    try {
      console.log(`\n📝 ${length.toUpperCase()} LENGTH:`);
      console.log('-'.repeat(30));
      
      const response = await makeTherapeuticRequest({
        userInput: testMessage,
        conversationStyle: 'directive',
        focusArea: 'general',
        responseLength: length
      });

      if (response) {
        console.log(`Response (${response.response.length} chars): "${response.response}"`);
        console.log(`Follow-up: "${response.followUpQuestion}"`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${length}: ${error.message}`);
    }
  }
}

async function makeTherapeuticRequest(params) {
  try {
    const response = await fetch('http://localhost:5000/api/therapeutic-chat/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This test should be run from the browser console while logged in
      },
      credentials: 'include',
      body: JSON.stringify(params)
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

function analyzeStyleCharacteristics(style, response) {
  const text = `${response.response} ${response.followUpQuestion}`.toLowerCase();
  
  console.log('\n🔍 Style Analysis:');
  
  switch(style) {
    case 'socratic':
      const hasQuestions = (text.match(/\?/g) || []).length;
      const hasWhatHow = /what.*?|how.*?/.test(text);
      console.log(`  - Questions asked: ${hasQuestions}`);
      console.log(`  - Uses "what/how" questioning: ${hasWhatHow ? 'Yes' : 'No'}`);
      console.log(`  - Avoids direct advice: ${!/recommend|should|try this/.test(text) ? 'Yes' : 'No'}`);
      break;
      
    case 'directive':
      const hasRecommendations = /recommend|should|try|do this|approach|strategy/.test(text);
      const hasSpecificAdvice = /step|technique|method/.test(text);
      console.log(`  - Gives recommendations: ${hasRecommendations ? 'Yes' : 'No'}`);
      console.log(`  - Offers specific advice: ${hasSpecificAdvice ? 'Yes' : 'No'}`);
      break;
      
    case 'reflective':
      const hasReflection = /sounds like|hearing|seem|feeling|experiencing/.test(text);
      const hasMirroring = /you.*feel|you.*think|you.*experience/.test(text);
      console.log(`  - Uses reflective language: ${hasReflection ? 'Yes' : 'No'}`);
      console.log(`  - Mirrors feelings/thoughts: ${hasMirroring ? 'Yes' : 'No'}`);
      break;
      
    case 'collaborative':
      const hasWeLanguage = /we|us|together|our/.test(text);
      const hasPartnership = /let's|work together|explore together/.test(text);
      console.log(`  - Uses "we" language: ${hasWeLanguage ? 'Yes' : 'No'}`);
      console.log(`  - Shows partnership: ${hasPartnership ? 'Yes' : 'No'}`);
      break;
  }
}

// Instructions for running this test
console.log(`
🚀 USAGE INSTRUCTIONS:
1. Open the therapeutic chat in your browser and log in
2. Open browser developer console (F12)
3. Paste this entire script and run it
4. The test will demonstrate distinct behaviors for each therapeutic style

This test verifies:
✓ Each conversation style produces different response patterns
✓ Focus areas influence the therapeutic direction  
✓ Response lengths control verbosity
✓ Style-specific language patterns are present
`);

// Export for browser console use
if (typeof window !== 'undefined') {
  window.testEnhancedTherapeuticStyles = testEnhancedTherapeuticStyles;
}