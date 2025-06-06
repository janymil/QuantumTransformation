/**
 * Test AI Vision Board Suggestions Engine
 */

async function testAISuggestions() {
  console.log('Testing AI Vision Board Suggestions Engine...\n');

  const testBoard = {
    title: "My Financial Freedom Vision",
    description: "A board focused on achieving financial independence",
    items: [
      {
        id: "1",
        type: "text",
        content: "Financial Freedom by 2025",
        x: 100,
        y: 100,
        width: 200,
        height: 40
      },
      {
        id: "2", 
        type: "image",
        content: "https://example.com/money.jpg",
        x: 300,
        y: 200,
        width: 150,
        height: 100
      }
    ],
    backgroundColor: "#ffffff"
  };

  const testData = {
    boardData: testBoard,
    userGoals: "I want to achieve financial freedom by building multiple income streams, investing in real estate, and creating passive income. My goal is to have $1 million in assets by 2025.",
    focusArea: "financial"
  };

  try {
    console.log('🎯 Testing board analysis and suggestion generation...');
    
    const response = await fetch('http://localhost:5000/api/ai/vision-board-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ AI Suggestions Generated Successfully!');
    console.log(`📊 Analysis: ${result.analysis || 'Complete'}`);
    console.log(`💡 Generated ${result.suggestions?.length || 0} suggestions:\n`);

    if (result.suggestions && result.suggestions.length > 0) {
      result.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.title} (${suggestion.type})`);
        console.log(`   📝 ${suggestion.description}`);
        console.log(`   🎯 Category: ${suggestion.category}`);
        console.log(`   🔮 Confidence: ${Math.round(suggestion.confidence * 100)}%`);
        console.log(`   💭 Reasoning: ${suggestion.reasoning}`);
        if (suggestion.preview) {
          console.log(`   👀 Preview: ${suggestion.preview}`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️ No suggestions were generated');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure the server is running on port 5000');
    } else if (error.message.includes('fetch')) {
      console.log('💡 Check network connection and server status');
    }
  }
}

// Test different scenarios
async function testMultipleScenarios() {
  console.log('\n🚀 Testing Multiple AI Suggestion Scenarios...\n');

  const scenarios = [
    {
      name: "Empty Board - Career Focus",
      data: {
        boardData: {
          title: "Career Vision Board",
          description: "Building my dream career",
          items: [],
          backgroundColor: "#f8fafc"
        },
        userGoals: "I want to become a senior software engineer at a top tech company, lead innovative projects, and mentor junior developers.",
        focusArea: "career"
      }
    },
    {
      name: "Health & Wellness Board",
      data: {
        boardData: {
          title: "Wellness Journey",
          description: "Health and fitness goals",
          items: [
            {
              id: "1",
              type: "text", 
              content: "Run Marathon 2025",
              x: 50,
              y: 50,
              width: 180,
              height: 30
            }
          ],
          backgroundColor: "#ecfdf5"
        },
        userGoals: "I want to run a marathon, lose 20 pounds, build muscle, and develop a consistent meditation practice.",
        focusArea: "health"
      }
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n📋 Testing: ${scenario.name}`);
    console.log('─'.repeat(50));
    
    try {
      const response = await fetch('http://localhost:5000/api/ai/vision-board-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario.data)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Generated ${result.suggestions?.length || 0} suggestions for ${scenario.name}`);
        
        // Show top 2 suggestions
        if (result.suggestions && result.suggestions.length > 0) {
          result.suggestions.slice(0, 2).forEach((suggestion, index) => {
            console.log(`   ${index + 1}. ${suggestion.title} (${suggestion.type}) - ${Math.round(suggestion.confidence * 100)}%`);
          });
        }
      } else {
        console.log(`❌ Failed for ${scenario.name}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${scenario.name}: ${error.message}`);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function runAllTests() {
  await testAISuggestions();
  await testMultipleScenarios();
  
  console.log('\n🎉 AI Suggestions Engine testing complete!');
  console.log('\nTo test the full integration:');
  console.log('1. Open the Vision Board Creator in your browser');
  console.log('2. Create or load a vision board');
  console.log('3. Click the "AI Suggestions" button');
  console.log('4. Fill in your goals and select a focus area');
  console.log('5. Click "Generate AI Suggestions" to see personalized recommendations');
}

runAllTests().catch(console.error);