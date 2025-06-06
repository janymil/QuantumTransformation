import { aiCouchEngine } from './server/ai-couch-simple.js';

async function testAICoaching() {
  console.log('Testing AI Coaching Session Functionality...\n');
  
  const userId = '43272767';
  const testInput = 'I feel overwhelmed with work stress and having trouble sleeping. I also struggle with self-doubt and perfectionism.';
  
  try {
    console.log('Input:', testInput);
    console.log('\nGenerating AI coaching response...\n');
    
    // Test the AI coaching engine
    const response = await aiCouchEngine.generatePersonalizedResponse(
      userId,
      testInput,
      'stress-management'
    );
    
    console.log('AI Coaching Response:');
    console.log('===================');
    console.log(response);
    console.log('\n✓ AI coaching session test completed successfully');
    
  } catch (error) {
    console.error('AI Coaching Test Error:', error.message);
    if (error.message.includes('API key')) {
      console.log('\nNote: OpenAI API key may need to be verified for full functionality');
    }
  }
}

testAICoaching();