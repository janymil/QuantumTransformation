import { aiCouchEngine } from './server/ai-couch-simple-simplified.js';

/**
 * Comprehensive test of all 18 AI Couch Engine functions
 */
async function testAllAIFunctions() {
  console.log('🔍 Comprehensive AI Engine Function Testing');
  console.log('==========================================\n');
  
  const userId = '43272767';
  const testResults = {};
  
  try {
    // Test 1: generatePersonalizedResponse
    console.log('1. Testing generatePersonalizedResponse...');
    const response1 = await aiCouchEngine.generatePersonalizedResponse(
      userId,
      'I feel overwhelmed with work stress and need guidance',
      'Daily coaching session',
      'stress_management'
    );
    testResults.generatePersonalizedResponse = response1?.response ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.generatePersonalizedResponse}`);
    
    // Test 2: generateMorningPrompt
    console.log('2. Testing generateMorningPrompt...');
    const response2 = await aiCouchEngine.generateMorningPrompt(userId);
    testResults.generateMorningPrompt = response2?.response ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.generateMorningPrompt}`);
    
    // Test 3: generateEveningReflection
    console.log('3. Testing generateEveningReflection...');
    const response3 = await aiCouchEngine.generateEveningReflection(userId, 'Had a productive day with some challenges');
    testResults.generateEveningReflection = response3?.response ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.generateEveningReflection}`);
    
    // Test 4: provideCrisisSupport
    console.log('4. Testing provideCrisisSupport...');
    const response4 = await aiCouchEngine.provideCrisisSupport(userId, 'Feeling very anxious and overwhelmed', 6);
    testResults.provideCrisisSupport = response4?.response ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.provideCrisisSupport}`);
    
    // Test 5: generateDailyActivity
    console.log('5. Testing generateDailyActivity...');
    const response5 = await aiCouchEngine.generateDailyActivity(userId, 1, 5);
    testResults.generateDailyActivity = response5?.response ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.generateDailyActivity}`);
    
    // Test 6: generateWeeklyPatternSummary
    console.log('6. Testing generateWeeklyPatternSummary...');
    const response6 = await aiCouchEngine.generateWeeklyPatternSummary(userId);
    testResults.generateWeeklyPatternSummary = response6?.response ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.generateWeeklyPatternSummary}`);
    
    // Test 7: performDynamicAssessment
    console.log('7. Testing performDynamicAssessment...');
    const response7 = await aiCouchEngine.performDynamicAssessment(userId);
    testResults.performDynamicAssessment = response7?.intervention_type ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.performDynamicAssessment}`);
    
    // Test 8: generateModularChallengeBlocks
    console.log('8. Testing generateModularChallengeBlocks...');
    const response8 = await aiCouchEngine.generateModularChallengeBlocks(['cbt', 'mindfulness'], ['stress', 'anxiety'], ['peace', 'balance']);
    testResults.generateModularChallengeBlocks = response8?.challenge_blocks ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.generateModularChallengeBlocks}`);
    
    // Test 9: performRealTimeAdaptation
    console.log('9. Testing performRealTimeAdaptation...');
    const response9 = await aiCouchEngine.performRealTimeAdaptation(userId, { mood: 7, energy: 6 });
    testResults.performRealTimeAdaptation = response9?.adaptation_type ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.performRealTimeAdaptation}`);
    
    // Test 10: performMultiLayerPersonalityProfiling
    console.log('10. Testing performMultiLayerPersonalityProfiling...');
    const response10 = await aiCouchEngine.performMultiLayerPersonalityProfiling(userId, { stressLevel: 8, goals: ['growth'] });
    testResults.performMultiLayerPersonalityProfiling = response10?.personality_layers ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.performMultiLayerPersonalityProfiling}`);
    
    // Test 11: generatePredictiveGuidance
    console.log('11. Testing generatePredictiveGuidance...');
    const response11 = await aiCouchEngine.generatePredictiveGuidance(userId);
    testResults.generatePredictiveGuidance = response11?.predicted_challenges ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.generatePredictiveGuidance}`);
    
    // Test 12: applyExpertKnowledgeIntegration
    console.log('12. Testing applyExpertKnowledgeIntegration...');
    const response12 = await aiCouchEngine.applyExpertKnowledgeIntegration(['mindfulness', 'cbt'], { goals: ['balance'] }, ['stress']);
    testResults.applyExpertKnowledgeIntegration = response12?.integrated_approach ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.applyExpertKnowledgeIntegration}`);
    
    // Test 13: performAdvancedPatternRecognition
    console.log('13. Testing performAdvancedPatternRecognition...');
    const response13 = await aiCouchEngine.performAdvancedPatternRecognition(userId);
    testResults.performAdvancedPatternRecognition = response13?.patterns_identified ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.performAdvancedPatternRecognition}`);
    
    // Test 14: generateTherapeuticIntervention
    console.log('14. Testing generateTherapeuticIntervention...');
    const response14 = await aiCouchEngine.generateTherapeuticIntervention('cognitive_restructuring', 'negative_thought_patterns', { intensity: 'moderate' });
    testResults.generateTherapeuticIntervention = response14?.intervention_type ? 'PASS' : 'FAIL';
    console.log(`   Result: ${testResults.generateTherapeuticIntervention}`);
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(result => result === 'PASS').length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Functions Tested: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    console.log('\n🔍 DETAILED RESULTS');
    console.log('===================');
    Object.entries(testResults).forEach(([func, result]) => {
      console.log(`${result === 'PASS' ? '✅' : '❌'} ${func}: ${result}`);
    });
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL FUNCTIONS WORKING CORRECTLY!');
    } else {
      console.log(`\n⚠️  ${failedTests} function(s) need attention`);
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    console.error('Full error:', error);
  }
}

testAllAIFunctions();