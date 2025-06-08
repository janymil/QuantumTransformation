/**
 * Analyze Therapeutic Chat Response Issues
 * Identifies why responses are too similar and generic
 */

async function analyzeTherapeuticResponses() {
  console.log('🔍 Analyzing Therapeutic Chat Response Issues...\n');

  // Test the same message with different styles to see actual differences
  const testMessage = "I have some ideas in my head, but I am very impatient. That urge to bring those ideas to existence is burning me inside.";
  
  const styles = [
    { name: 'Socratic', value: 'socratic' },
    { name: 'Directive', value: 'directive' },
    { name: 'Reflective', value: 'reflective' },
    { name: 'Collaborative', value: 'collaborative' }
  ];

  console.log(`Testing message: "${testMessage}"\n`);

  for (const style of styles) {
    try {
      console.log(`\n--- ${style.name.toUpperCase()} STYLE ---`);
      
      const startTime = Date.now();
      const response = await fetch('http://localhost:5000/api/therapeutic-chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userInput: testMessage,
          conversationStyle: style.value,
          focusArea: 'general',
          responseLength: 'balanced'
        })
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        
        console.log(`Response (${responseTime}ms):`);
        console.log(`"${data.response}"`);
        console.log(`\nFollow-up: "${data.followUpQuestion}"`);
        console.log(`Emotional Insight: ${data.emotionalInsight}`);
        
        // Analyze style characteristics
        const text = `${data.response} ${data.followUpQuestion}`.toLowerCase();
        console.log('\nStyle Analysis:');
        
        switch(style.value) {
          case 'socratic':
            const questionCount = (text.match(/\?/g) || []).length;
            const hasWhatHow = /what.*?|how.*?/.test(text);
            const avoidsAdvice = !/recommend|should|try this|you need/.test(text);
            console.log(`- Questions asked: ${questionCount}`);
            console.log(`- Uses what/how questioning: ${hasWhatHow}`);
            console.log(`- Avoids direct advice: ${avoidsAdvice}`);
            break;
            
          case 'directive':
            const hasDirectives = /recommend|should|try|need to|must|approach/.test(text);
            const hasSpecifics = /step|technique|method|strategy/.test(text);
            console.log(`- Uses directive language: ${hasDirectives}`);
            console.log(`- Offers specific advice: ${hasSpecifics}`);
            break;
            
          case 'reflective':
            const hasReflection = /sounds like|seems|appears|feeling|experiencing/.test(text);
            const hasMirroring = /you're|you seem|you feel/.test(text);
            console.log(`- Uses reflective language: ${hasReflection}`);
            console.log(`- Mirrors back to user: ${hasMirroring}`);
            break;
            
          case 'collaborative':
            const hasWeLanguage = /we|us|together|our/.test(text);
            const hasPartnership = /let's|work together|explore together/.test(text);
            console.log(`- Uses "we" language: ${hasWeLanguage}`);
            console.log(`- Shows partnership: ${hasPartnership}`);
            break;
        }
        
      } else {
        console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Test response length differences
  console.log('\n\n=== TESTING RESPONSE LENGTHS ===\n');
  
  const lengths = ['brief', 'balanced', 'detailed'];
  
  for (const length of lengths) {
    try {
      console.log(`\n--- ${length.toUpperCase()} LENGTH ---`);
      
      const response = await fetch('http://localhost:5000/api/therapeutic-chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userInput: testMessage,
          conversationStyle: 'directive',
          focusArea: 'general',
          responseLength: length
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Response (${data.response.length} chars): "${data.response}"`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n=== ISSUES IDENTIFIED ===');
  console.log('1. Responses may be too generic and not style-specific enough');
  console.log('2. AI prompt may need more specific behavioral instructions');
  console.log('3. Temperature and parameters may need adjustment');
  console.log('4. No conversation history context is being used');
  console.log('5. Style differentiation may not be strong enough in prompts');
}

// Run the analysis
analyzeTherapeuticResponses().catch(console.error);