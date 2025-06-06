import { aiCouchEngine } from './server/ai-couch-simple.js';

async function testLiveCoaching() {
  console.log('Testing Live AI Coaching with OpenAI...\n');
  
  const userId = '43272767';
  const testInput = 'I feel overwhelmed with work stress and having trouble sleeping. I also struggle with self-doubt and perfectionism.';
  
  try {
    console.log('User Input:', testInput);
    console.log('\nGenerating AI coaching response with OpenAI...\n');
    
    const response = await aiCouchEngine.generatePersonalizedResponse(
      userId,
      testInput,
      'stress-management'
    );
    
    console.log('AI Coaching Response:');
    console.log('===================');
    console.log(JSON.stringify(response, null, 2));
    
    console.log('\n--- Testing Advanced Features ---');
    
    // Test multidisciplinary assessment
    const assessment = await aiCouchEngine.performMultiLayerPersonalityProfiling(
      userId,
      { 
        stressLevel: 8,
        sleepQuality: 3,
        perfectionism: 9,
        selfDoubt: 7
      }
    );
    
    console.log('\nPersonality Assessment:');
    console.log(JSON.stringify(assessment, null, 2));
    
    // Test predictive guidance
    const guidance = await aiCouchEngine.generatePredictiveGuidance(userId);
    
    console.log('\nPredictive Guidance:');
    console.log(JSON.stringify(guidance, null, 2));
    
    console.log('\n✓ Live AI Coaching Test Completed Successfully');
    
  } catch (error) {
    console.error('Live Coaching Test Error:', error.message);
    console.error('Full error:', error);
  }
}

testLiveCoaching();