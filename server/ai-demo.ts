import { getChallengeKnowledgeBase, getUserPersonalizationContext } from "./openai";

/**
 * Demonstration of how AI personalization works
 * This shows exactly what context the AI receives for different challenges
 */
export async function demonstrateAIPersonalization(userId: string) {
  console.log("=== AI PERSONALIZATION DEMONSTRATION ===\n");

  // Test 1: Money Blocks Challenge Context
  console.log("1. MONEY BLOCKS CHALLENGE CONTEXT:");
  console.log("When user selects Money Blocks, AI receives:");
  const moneyContext = getChallengeKnowledgeBase("money_blocks_clearing");
  console.log(moneyContext.substring(0, 500) + "...\n");

  // Test 2: Quantum Consciousness Context  
  console.log("2. QUANTUM CONSCIOUSNESS CONTEXT:");
  console.log("When user selects Quantum Consciousness, AI receives:");
  const quantumContext = getChallengeKnowledgeBase("general_quantum");
  console.log(quantumContext.substring(0, 500) + "...\n");

  // Test 3: User Personalization Context
  console.log("3. USER PERSONALIZATION CONTEXT:");
  console.log("AI also receives user's personal data:");
  try {
    const userContext = await getUserPersonalizationContext(userId, "money_blocks_clearing");
    console.log(userContext.substring(0, 300) + "...\n");
  } catch (error) {
    console.log("User context retrieval demo (would include progress, journals, etc.)\n");
  }

  console.log("4. HOW IT WORKS:");
  console.log("- Each AI request includes complete challenge knowledge");
  console.log("- User's progress and journal data gets injected");
  console.log("- Previous conversations are referenced");
  console.log("- AI responds as if it 'knows' the challenge and user");
  console.log("- This creates personalized, context-aware responses\n");

  return {
    moneyBlocksContext: moneyContext.length,
    quantumContext: quantumContext.length,
    explanation: "AI receives different training data per challenge selection"
  };
}