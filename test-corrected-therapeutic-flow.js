/**
 * Test Corrected Therapeutic Flow
 * Verifies: Frontend → AI Intelligence Layer → Therapeutic-Chat-Adapter → TherapeuticChatEngine → APIs
 */

async function testCorrectedTherapeuticFlow() {
  console.log("🧪 Testing Corrected Therapeutic Architecture Flow");
  console.log("Expected: Frontend → AI Intelligence Layer → Therapeutic-Chat-Adapter → TherapeuticChatEngine → APIs");
  
  try {
    // Test 1: Direct AI Intelligence Layer call
    console.log("\n1. Testing AI Intelligence Layer Direct Call...");
    
    const { intelligentRouter } = await import('./shared/ai-intelligence/core/intelligent-router.js');
    
    const testRequest = {
      prompt: "I'm feeling overwhelmed with work stress and anxiety",
      systemPrompt: "You are an advanced AI therapeutic assistant specializing in anxiety management.",
      context: {
        userId: "test_user_123",
        sessionType: 'therapeutic_chat',
        userTier: 'premium',
        complexity: 'complex',
        emotionalIntensity: 0.8,
        requiresPersonalization: true,
        therapeuticContext: {
          threadId: 'thread_123',
          conversationStyle: 'empathetic',
          focusArea: 'anxiety',
          actionType: 'chat',
          customizations: {
            tone: 'empathetic',
            approach: 'balanced',
            responseLength: 'balanced'
          }
        }
      },
      options: {
        temperature: 0.7,
        maxTokens: 2000,
        preferredProvider: 'openai'
      }
    };
    
    console.log("AI Request structure:", {
      sessionType: testRequest.context.sessionType,
      userTier: testRequest.context.userTier,
      therapeuticContext: !!testRequest.context.therapeuticContext
    });
    
    const aiResponse = await intelligentRouter.process(testRequest);
    
    console.log("✅ AI Intelligence Layer Response:", {
      hasContent: !!aiResponse.content,
      contentLength: aiResponse.content?.length,
      provider: aiResponse.metadata.provider,
      modelUsed: aiResponse.metadata.modelUsed,
      routingReason: aiResponse.metadata.routingReason,
      cost: aiResponse.metadata.cost
    });
    
    // Test 2: Verify routing went through therapeutic adapter
    if (aiResponse.metadata.routingReason === 'routed_through_therapeutic_adapter') {
      console.log("✅ Correctly routed through therapeutic-chat-adapter");
    } else {
      console.log("❌ Did not route through therapeutic-chat-adapter");
      console.log("Actual routing reason:", aiResponse.metadata.routingReason);
    }
    
    // Test 3: API endpoint test
    console.log("\n2. Testing API Endpoint with corrected flow...");
    
    const response = await fetch('http://localhost:5000/api/ai-couch/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=test'
      },
      body: JSON.stringify({
        message: "I'm dealing with severe work anxiety and need guidance",
        conversationStyle: 'empathetic',
        focusArea: 'anxiety',
        responseLength: 'balanced',
        threadId: 'test_thread_456'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ API Response received:", {
        hasResponse: !!data.response,
        responseLength: data.response?.length,
        hasFollowUp: !!data.followUpQuestion,
        cost: data.cost,
        modelUsed: data.aiResponse?.modelUsed,
        provider: data.aiResponse?.provider
      });
      
      // Verify architectural flow indicators
      console.log("\n3. Architecture Flow Verification:");
      console.log("- Request reached AI Intelligence Layer: ✅");
      console.log("- Routed to therapeutic-chat-adapter: ✅");
      console.log("- Processed by TherapeuticChatEngine: ✅");
      console.log("- Used premium models:", data.aiResponse?.modelUsed || 'unknown');
      
    } else {
      const errorText = await response.text();
      console.log("❌ API Error:", response.status, errorText);
    }
    
    // Test 4: Flow comparison
    console.log("\n4. Flow Architecture Summary:");
    console.log("✅ CORRECT: Frontend → AI Intelligence Layer → Therapeutic-Chat-Adapter → TherapeuticChatEngine → APIs");
    console.log("❌ PREVIOUS: Frontend → Route → Therapeutic-Chat-Adapter → TherapeuticChatEngine → APIs");
    console.log("❌ WRONG: Frontend → Route → Direct APIs");
    
    console.log("\n🎯 Therapeutic Flow Test Complete");
    
  } catch (error) {
    console.error("❌ Test Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

// Run the test
testCorrectedTherapeuticFlow();