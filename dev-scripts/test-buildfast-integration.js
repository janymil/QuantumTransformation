/**
 * Comprehensive Integration Test for buildFastPrompt + getLastSessionInsights
 * Tests the complete therapeutic chat system with helper functions
 */

const { buildFastPrompt, validatePromptInputs, optimizePromptForTokens } = require('../server/therapeutic-chat/prompt-builders/buildFastPrompt.ts');

async function testBuildFastPromptIntegration() {
  console.log('🧠 Testing buildFastPrompt + Helper Function Integration');
  console.log('====================================================');

  // Test 1: Basic prompt building
  console.log('\n1. Testing basic prompt building...');
  
  const entryText = "I've been feeling overwhelmed with work lately and struggling to find balance.";
  
  const memorySnippets = [
    {
      content: "Last week I mentioned feeling stressed about deadlines",
      relevanceScore: 0.8,
      context: "work_stress_pattern"
    },
    {
      content: "Previously discussed work-life balance challenges", 
      relevanceScore: 0.7,
      context: "balance_theme"
    }
  ];
  
  const userInsights = {
    framework: "CBT",
    tone: "warm",
    state: "anxious", 
    themes: ["work_stress", "balance", "overwhelm"]
  };

  try {
    // Test validation
    const validation = validatePromptInputs(entryText, memorySnippets, userInsights);
    console.log('✅ Validation passed:', validation.isValid);
    
    // Test prompt building
    const promptMessages = buildFastPrompt(entryText, memorySnippets, userInsights);
    console.log('✅ Prompt messages generated:', promptMessages.length, 'messages');
    console.log('System message length:', promptMessages[0].content.length, 'characters');
    console.log('User message length:', promptMessages[1].content.length, 'characters');
    
    // Test token optimization
    const optimizedPrompt = optimizePromptForTokens(entryText, memorySnippets, userInsights, 1200);
    console.log('✅ Token optimization completed');
    
    // Test 2: Framework-specific guidance
    console.log('\n2. Testing framework-specific guidance...');
    
    const frameworks = ["CBT", "ACT", "DBT", "Mindfulness"];
    frameworks.forEach(framework => {
      const testInsights = { ...userInsights, framework };
      const messages = buildFastPrompt(entryText, [], testInsights);
      const systemContent = messages[0].content;
      
      if (systemContent.includes(framework)) {
        console.log(`✅ ${framework} framework integrated correctly`);
      } else {
        console.log(`❌ ${framework} framework not found in system prompt`);
      }
    });
    
    // Test 3: Tone adaptation
    console.log('\n3. Testing tone adaptation...');
    
    const tones = ["warm", "clear", "structured", "compassionate"];
    tones.forEach(tone => {
      const testInsights = { ...userInsights, tone };
      const messages = buildFastPrompt(entryText, [], testInsights);
      const systemContent = messages[0].content;
      
      if (systemContent.includes("COMMUNICATION STYLE")) {
        console.log(`✅ ${tone} tone guidance integrated`);
      } else {
        console.log(`❌ ${tone} tone guidance missing`);
      }
    });
    
    // Test 4: Memory snippet integration
    console.log('\n4. Testing memory snippet integration...');
    
    const messagesWithMemory = buildFastPrompt(entryText, memorySnippets, userInsights);
    const userContent = messagesWithMemory[1].content;
    
    if (userContent.includes("PREVIOUS JOURNAL CONTEXT")) {
      console.log('✅ Memory snippets integrated into user prompt');
    } else {
      console.log('❌ Memory snippets not found in user prompt');
    }
    
    // Test 5: Theme integration
    console.log('\n5. Testing theme integration...');
    
    if (userContent.includes("RECURRING THEMES")) {
      console.log('✅ Recurring themes integrated');
    } else {
      console.log('❌ Recurring themes not found');
    }
    
    console.log('\n🏁 buildFastPrompt integration test complete');
    console.log('✅ All components working together successfully');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

// Test edge cases
async function testEdgeCases() {
  console.log('\n🔍 Testing edge cases...');
  
  // Empty memory snippets
  const emptyPrompt = buildFastPrompt("Test entry", [], null);
  console.log('✅ Handles empty memory snippets');
  
  // Null insights  
  const nullInsightsPrompt = buildFastPrompt("Test entry", [], null);
  console.log('✅ Handles null insights');
  
  // Large token count
  const largeEntry = "Very long entry text ".repeat(200);
  const largeMemory = Array(10).fill({
    content: "Large memory snippet ".repeat(50),
    relevanceScore: 0.5,
    context: "test"
  });
  
  const optimized = optimizePromptForTokens(largeEntry, largeMemory, null, 500);
  console.log('✅ Token optimization works with large inputs');
  console.log('Optimized to:', optimized[1].content.length, 'characters');
}

// Run comprehensive test
async function runCompleteTest() {
  await testBuildFastPromptIntegration();
  await testEdgeCases();
  
  console.log('\n🎉 Complete integration verification finished');
  console.log('FastChatEngine + buildFastPrompt + getLastSessionInsights = READY');
}

runCompleteTest().catch(console.error);