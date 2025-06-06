import { aiCouchEngine } from './server/ai-couch-simple.js';

async function testCoachingDirect() {
  console.log('Testing Advanced AI Coaching Engine...\n');
  
  const userInput = "I feel overwhelmed with work stress and having trouble sleeping. I also struggle with self-doubt and perfectionism.";
  
  try {
    console.log('User Input:', userInput);
    console.log('\nGenerating comprehensive AI coaching response...\n');
    
    const result = await aiCouchEngine.generatePersonalizedResponse(
      'test-user-123',
      userInput,
      'First coaching session, user seeking help with stress and sleep issues',
      'stress_management'
    );
    
    console.log('AI Coaching Response:');
    console.log('====================');
    console.log(result.response);
    console.log('\nSession Details:');
    console.log('- Type:', result.type);
    console.log('- Session Type:', result.sessionType);
    console.log('- Emotional Tone:', result.emotional_tone);
    console.log('- Patterns Detected:', result.patterns_detected);
    console.log('- Modalities Used:', result.modalities_used);
    console.log('- Timestamp:', result.timestamp);
    
    console.log('\n✓ Advanced AI Coaching Engine Test Successful');
    
  } catch (error) {
    console.error('Coaching Engine Error:', error.message);
    if (error.message.includes('timeout')) {
      console.error('Connection timeout - checking API connectivity...');
    }
  }
}

testCoachingDirect();