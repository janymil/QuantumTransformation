import { trackAuthenticUsage } from "./authentic-usage-tracker";
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

/**
 * Generate authentic OpenAI API usage data for testing analytics
 */
export async function generateAuthenticUsageData() {
  console.log("Starting authentic usage data generation...");
  
  const testQueries = [
    { query: "How do I practice meditation for quantum consciousness?", challengeType: "general_quantum", day: 1 },
    { query: "What are limiting beliefs about money?", challengeType: "money_blocks_clearing", day: 2 },
    { query: "How to release emotional blocks?", challengeType: "emotional_mastery", day: 3 },
    { query: "Explain the observer effect in consciousness", challengeType: "general_quantum", day: 4 },
    { query: "Help me understand visualization techniques", challengeType: "future_self_creation", day: 5 }
  ];

  const userId = "43272767"; // Use actual authenticated user ID
  
  for (const testData of testQueries) {
    try {
      console.log(`Processing: ${testData.query.substring(0, 50)}...`);
      
      const startTime = Date.now();
      
      // Make actual OpenAI API call
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use mini for cost efficiency
        messages: [
          {
            role: "system",
            content: "You are an AI quantum consciousness coach. Provide helpful, practical guidance."
          },
          {
            role: "user", 
            content: testData.query
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const responseTime = Date.now() - startTime;
      
      // Track authentic usage with real API response data
      await trackAuthenticUsage({
        userId,
        requestType: 'coaching',
        challengeType: testData.challengeType,
        day: testData.day,
        model: response.model,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0
        },
        responseTime,
        wasFromCache: false,
        userInput: testData.query,
        response: response.choices[0].message.content || ""
      });
      
      console.log(`✓ Tracked: ${response.usage?.total_tokens} tokens, $${(response.usage?.total_tokens || 0) * 0.00015 / 1000}`);
      
      // Add small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`Error processing query: ${testData.query}`, error);
    }
  }
  
  console.log("Authentic usage data generation completed!");
}

