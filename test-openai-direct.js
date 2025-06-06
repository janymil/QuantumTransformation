import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAIDirect() {
  console.log('Testing OpenAI API Direct Connection...\n');
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: 'You are AI Couch. Provide coaching for: I feel overwhelmed with work stress and having trouble sleeping. I also struggle with self-doubt and perfectionism.'
      }]
    });

    console.log('OpenAI Response:');
    console.log('===================');
    console.log(response.choices[0].message.content);
    console.log('\n✓ OpenAI API Test Successful');
    
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    console.error('Error details:', error);
  }
}

testOpenAIDirect();