async function testSimpleOpenAI() {
  console.log('Testing simple fetch to OpenAI API...\n');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hello, test message' }],
        max_tokens: 50
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI Response:', data.choices[0].message.content);
    console.log('✓ OpenAI API connection successful');
    
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    if (error.name === 'TimeoutError') {
      console.error('Connection timeout - network issue detected');
    }
  }
}

testSimpleOpenAI();