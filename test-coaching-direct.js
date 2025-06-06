import fetch from 'node-fetch';

async function testCoachingDirect() {
  console.log('Testing AI Coaching API Direct...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/ai-couch/simple-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: '43272767',
        input: 'I feel overwhelmed with work stress and having trouble sleeping. I also struggle with self-doubt and perfectionism.',
        challengeType: 'stress-management'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('AI Coaching Response:');
      console.log('===================');
      console.log(JSON.stringify(result, null, 2));
      console.log('\n✓ AI Coaching API Test Successful');
    } else {
      console.log('API Response Status:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('API Test Error:', error.message);
  }
}

testCoachingDirect();