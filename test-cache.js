// Simple cache testing script
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';
const TEST_QUESTIONS = [
  "How long should I practice today's meditation?",
  "What if I'm having trouble with this exercise?", 
  "How does this connect to quantum physics?",
  "What is today's practice about?",
  "Explain the science behind this technique"
];

async function testCaching() {
  console.log('🧪 Testing Enhanced Caching System\n');
  
  const results = [];
  
  for (const question of TEST_QUESTIONS) {
    console.log(`\n📝 Testing: "${question}"`);
    
    // First request (should generate or use existing cache)
    const start1 = Date.now();
    try {
      const response1 = await fetch(`${BASE_URL}/api/ai/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'connect.sid=test' // Basic auth bypass for testing
        },
        body: JSON.stringify({
          userQuestion: question,
          challengeType: 'general_quantum',
          day: 1,
          userTier: 'basic'
        })
      });
      
      const data1 = await response1.json();
      const time1 = Date.now() - start1;
      
      console.log(`  ⏱️  First request: ${time1}ms`);
      console.log(`  💾 From cache: ${data1.fromCache ? 'YES' : 'NO'}`);
      if (data1.cacheStrategy) {
        console.log(`  🎯 Strategy: ${data1.cacheStrategy}`);
      }
      if (data1.cacheType) {
        console.log(`  📦 Cache type: ${data1.cacheType}`);
      }
      
      results.push({
        question,
        firstRequest: { time: time1, cached: data1.fromCache, strategy: data1.cacheStrategy }
      });
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({
        question,
        firstRequest: { error: error.message }
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('─'.repeat(50));
  
  const successful = results.filter(r => !r.firstRequest.error);
  const cached = successful.filter(r => r.firstRequest.cached);
  const avgTime = successful.length > 0 ? 
    Math.round(successful.reduce((sum, r) => sum + r.firstRequest.time, 0) / successful.length) : 0;
  
  console.log(`✅ Successful requests: ${successful.length}/${results.length}`);
  console.log(`💾 Cache hits: ${cached.length}/${successful.length} (${Math.round(cached.length/successful.length*100)}%)`);
  console.log(`⏱️  Average response time: ${avgTime}ms`);
  console.log(`💰 Estimated cost savings: $${(cached.length * 0.02).toFixed(2)}`);
  
  // Strategy breakdown
  const strategies = {};
  successful.forEach(r => {
    const strategy = r.firstRequest.strategy || 'unknown';
    strategies[strategy] = (strategies[strategy] || 0) + 1;
  });
  
  console.log('\n🎯 Cache Strategies Used:');
  Object.entries(strategies).forEach(([strategy, count]) => {
    console.log(`  ${strategy}: ${count} requests`);
  });
}

// Run the test
testCaching().catch(console.error);