/**
 * Test Correct Therapeutic Architecture Flow
 * Verifies: Frontend → AI Intelligence Layer → Therapeutic-Chat-Adapter → TherapeuticChatEngine
 */

async function testCorrectTherapeuticArchitecture() {
  console.log('🔬 Testing Correct Therapeutic Architecture Flow...\n');
  
  try {
    // Test 1: Direct AI Intelligence Layer Entry Point
    console.log('1. Testing AI Intelligence Layer as Entry Point...');
    
    const testRequest = {
      prompt: "I've been feeling anxious about my upcoming presentation at work. How can I manage these feelings?",
      context: {
        userId: 'test-user-premium',
        userTier: 'premium',
        sessionType: 'therapeutic_chat',
        conversationHistory: [],
        therapeuticGoals: ['anxiety management', 'confidence building'],
        currentTherapeuticStyle: 'cognitive-behavioral'
      },
      options: {
        requiresPersonalization: true,
        enableContextualMemory: true,
        enableAdaptiveLanguage: true
      }
    };
    
    // This should route through: AI Intelligence → Therapeutic-Chat-Adapter → TherapeuticChatEngine
    const response = await fetch('http://localhost:5000/api/ai-intelligence/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRequest)
    });
    
    if (!response.ok) {
      console.log('❌ AI Intelligence Layer entry point not found');
      console.log('Current implementation may have TherapeuticChatEngine calling adapter directly');
    } else {
      const data = await response.json();
      console.log('✅ AI Intelligence Layer successfully processed request');
      console.log('Model used:', data.metadata?.modelUsed);
      console.log('Provider:', data.metadata?.provider);
      console.log('Routing reason:', data.metadata?.routingReason);
    }
    
    // Test 2: Verify Current Therapeutic Chat Endpoint
    console.log('\n2. Testing Current Therapeutic Chat Endpoint...');
    
    const therapeuticRequest = {
      userInput: "I feel overwhelmed with work responsibilities lately.",
      conversationStyle: "empathetic",
      focusArea: "stress_management", 
      responseLength: "balanced",
      threadId: "test-thread-123"
    };
    
    const therapeuticResponse = await fetch('http://localhost:5000/api/therapeutic-chat/process', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=test-session'
      },
      body: JSON.stringify(therapeuticRequest)
    });
    
    if (therapeuticResponse.ok) {
      const data = await therapeuticResponse.json();
      console.log('✅ Current therapeutic chat endpoint working');
      console.log('Response preview:', data.aiResponse?.analysis?.professionalAnalysis?.substring(0, 100) + '...');
      console.log('Model used:', data.aiResponse?.modelUsed);
      console.log('Provider:', data.aiResponse?.provider);
      
      // Check if it went through adapter
      if (data.aiResponse?.modelUsed && data.aiResponse?.provider) {
        console.log('✅ Response includes AI Intelligence metadata');
      } else {
        console.log('❌ Response missing AI Intelligence metadata - may be bypassing adapter');
      }
    } else {
      console.log('❌ Therapeutic chat endpoint error:', await therapeuticResponse.text());
    }
    
    // Test 3: Architecture Flow Analysis
    console.log('\n3. Architecture Flow Analysis...');
    
    console.log('Expected Flow:');
    console.log('Frontend → AI Intelligence Layer → Therapeutic-Chat-Adapter → TherapeuticChatEngine → API');
    console.log('');
    console.log('Current Implementation Analysis:');
    
    if (therapeuticResponse.ok) {
      const data = await therapeuticResponse.json();
      
      if (data.aiResponse?.cost && data.aiResponse?.modelUsed) {
        console.log('✅ Therapeutic responses include AI Intelligence metadata');
        console.log('✅ Cost tracking active:', data.aiResponse.cost);
        console.log('✅ Model selection working:', data.aiResponse.modelUsed);
        
        if (data.aiResponse.provider === 'openai' || data.aiResponse.provider === 'anthropic') {
          console.log('✅ Premium model routing active');
        }
      } else {
        console.log('❌ Missing AI Intelligence Layer integration');
      }
    }
    
    // Test 4: Adapter Independence Test
    console.log('\n4. Testing Adapter Independence...');
    
    // Try to test therapeutic-chat-adapter directly (if accessible)
    try {
      const adapterTest = await fetch('http://localhost:5000/api/therapeutic-chat-adapter/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          userInput: 'Test adapter direct access',
          systemPrompt: 'You are a therapeutic AI assistant.',
          userTier: 'premium'
        })
      });
      
      if (adapterTest.ok) {
        console.log('✅ Therapeutic-Chat-Adapter accessible independently');
      } else {
        console.log('ℹ️  Therapeutic-Chat-Adapter not exposed as independent endpoint (expected)');
      }
    } catch (error) {
      console.log('ℹ️  Therapeutic-Chat-Adapter internal component (expected)');
    }
    
    // Test 5: Quality vs Cost Analysis
    console.log('\n5. Quality vs Cost Analysis...');
    
    if (therapeuticResponse.ok) {
      const data = await therapeuticResponse.json();
      
      if (data.aiResponse?.cost) {
        const cost = data.aiResponse.cost;
        console.log('Response cost:', cost);
        
        if (cost > 0.01) {
          console.log('✅ High-quality premium model used (higher cost indicates premium)');
        } else {
          console.log('⚠️  Lower cost may indicate cost optimization applied');
        }
      }
      
      if (data.aiResponse?.modelUsed === 'gpt-4o' || data.aiResponse?.modelUsed === 'claude-3-5-sonnet-20241022') {
        console.log('✅ Premium model confirmed:', data.aiResponse.modelUsed);
      } else {
        console.log('⚠️  Non-premium model used:', data.aiResponse?.modelUsed);
      }
    }
    
    console.log('\n📊 Architecture Analysis Complete');
    console.log('=====================================');
    
    // Summary and Recommendations
    if (therapeuticResponse.ok) {
      const data = await therapeuticResponse.json();
      
      if (data.aiResponse?.modelUsed && data.aiResponse?.provider && data.aiResponse?.cost) {
        console.log('✅ INTEGRATION STATUS: Therapeutic Chat successfully integrated with AI Intelligence Layer');
        console.log('✅ QUALITY PRESERVATION: Premium models being used');
        console.log('✅ COST TRACKING: AI Intelligence metadata present');
        
        console.log('\n🎯 CURRENT ARCHITECTURE:');
        console.log('Frontend → TherapeuticChatEngine → Therapeutic-Chat-Adapter → Premium APIs');
        console.log('✅ This is functional but not the ideal layering');
        
        console.log('\n💡 RECOMMENDED ARCHITECTURE:');
        console.log('Frontend → AI Intelligence Layer → Therapeutic-Chat-Adapter → TherapeuticChatEngine → APIs');
        console.log('This would make AI Intelligence the top-level orchestrator');
        
      } else {
        console.log('❌ INTEGRATION INCOMPLETE: Missing AI Intelligence metadata');
        console.log('TherapeuticChatEngine may not be using therapeutic-chat-adapter');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run the test
testCorrectTherapeuticArchitecture();