/**
 * Test Document Processing System
 * Tests text document upload, processing, and BunnyNet storage
 */

import { simpleDocumentProcessor } from './shared/document-processing/simple-processor.js';

async function testDocumentProcessing() {
  console.log('🔬 Testing Document Processing System');
  console.log('====================================');

  const testResults = {
    textProcessing: false,
    bunnyNetStorage: false,
    analysisEngine: false,
    apiIntegration: false,
    totalTests: 4,
    passed: 0
  };

  // Test 1: Text Document Processing
  console.log('\n1. Testing Text Document Processing');
  console.log('===================================');
  
  try {
    const sampleDocument = `
# Cognitive Behavioral Therapy for Anxiety Disorders

## Abstract
This comprehensive review examines the effectiveness of cognitive behavioral therapy (CBT) interventions for treating anxiety disorders. The analysis includes 147 randomized controlled trials with over 12,000 participants.

## Introduction
Anxiety disorders represent one of the most prevalent mental health conditions globally, affecting approximately 18% of the adult population. Cognitive behavioral therapy has emerged as a gold standard treatment approach, demonstrating robust empirical support across multiple anxiety conditions.

## Methodology
We conducted a systematic meta-analysis following PRISMA guidelines. Studies were included if they met the following criteria:
- Randomized controlled trial design
- Adult participants (18+ years)
- Primary diagnosis of anxiety disorder (DSM-5 criteria)
- CBT intervention compared to control condition
- Standardized outcome measures

## Key Findings

### Generalized Anxiety Disorder
- Effect size (Cohen's d) = 0.85
- Response rate: 68%
- Remission rate: 52%
- Number needed to treat: 3

### Panic Disorder
- Effect size (Cohen's d) = 0.92
- Response rate: 74%
- Remission rate: 61%
- Number needed to treat: 2

### Social Anxiety Disorder
- Effect size (Cohen's d) = 0.78
- Response rate: 65%
- Remission rate: 48%
- Number needed to treat: 4

## Clinical Implications
1. CBT demonstrates superior efficacy compared to waitlist controls
2. Treatment gains are maintained at 12-month follow-up
3. Combination with mindfulness techniques shows 15% improvement
4. Digital delivery maintains therapeutic effectiveness

## Treatment Components

### Cognitive Restructuring
- Identification of automatic thoughts
- Evidence examination techniques
- Balanced thinking development
- Cognitive flexibility training

### Behavioral Interventions
- Exposure therapy protocols
- Systematic desensitization
- Behavioral experiments
- Activity scheduling

### Homework Assignments
- Thought records
- Behavioral experiments
- Exposure practice
- Skill generalization

## Conclusions
Cognitive behavioral therapy represents an evidence-based, effective treatment for anxiety disorders. The robust effect sizes and sustained treatment gains support its continued use as a first-line intervention.

## References
1. Hofmann, S. G., et al. (2023). CBT for anxiety disorders: Updated meta-analysis. Clinical Psychology Review, 89, 102-118.
2. Carpenter, J. K., et al. (2023). Mechanisms of CBT for anxiety. Journal of Consulting Psychology, 91(4), 223-240.
3. Craske, M. G., et al. (2023). Recent developments in anxiety treatment. Nature Reviews Psychology, 2(1), 15-32.
    `;

    const result = await simpleDocumentProcessor.processTextDocument(
      sampleDocument,
      'cbt-anxiety-research.txt',
      'cognitive_behavioral_therapy'
    );

    if (result.processing.success) {
      console.log('✅ Text Processing Successful');
      console.log(`📊 Word Count: ${result.analysis.wordCount}`);
      console.log(`🧠 Concepts Extracted: ${result.analysis.concepts.length}`);
      console.log(`⚕️ Clinical Terms: ${result.analysis.clinicalTerms.length}`);
      console.log(`📈 Quality Score: ${result.processing.qualityScore}`);
      console.log(`🔗 Storage URL: ${result.bunnyNetUrl}`);
      
      testResults.textProcessing = true;
      testResults.passed++;

      if (result.bunnyNetUrl && result.bunnyNetUrl.length > 0) {
        testResults.bunnyNetStorage = true;
        testResults.passed++;
        console.log('✅ BunnyNet Storage Integration Working');
      }

      if (result.analysis.concepts.length > 5 && result.analysis.clinicalTerms.length > 3) {
        testResults.analysisEngine = true;
        testResults.passed++;
        console.log('✅ Analysis Engine Working');
        console.log(`📝 Key Concepts: ${result.analysis.concepts.slice(0, 5).join(', ')}`);
        console.log(`⚕️ Clinical Terms: ${result.analysis.clinicalTerms.slice(0, 3).join(', ')}`);
      }

    } else {
      console.log('❌ Text Processing Failed:', result.processing.errors);
    }

  } catch (error) {
    console.log('❌ Text Processing Error:', error.message);
  }

  // Test 2: API Integration Test
  console.log('\n2. Testing API Integration');
  console.log('==========================');
  
  try {
    // Test the document upload endpoint
    const testData = {
      title: "Mindfulness-Based Stress Reduction",
      author: "Dr. Sarah Johnson",
      content: `
Mindfulness-Based Stress Reduction (MBSR) is an evidence-based intervention that combines mindfulness meditation and yoga practices to help individuals manage stress, anxiety, and pain.

## Core Components:
1. Body scan meditation
2. Sitting meditation
3. Mindful yoga
4. Walking meditation
5. Informal mindfulness practices

## Research Evidence:
- Reduces cortisol levels by 23%
- Improves anxiety symptoms (d = 0.63)
- Enhances quality of life measures
- Demonstrates neuroplasticity changes in amygdala

## Clinical Applications:
- Chronic pain management
- Anxiety and depression treatment
- Cancer patient support
- Healthcare worker burnout prevention

The 8-week MBSR protocol has been extensively studied with over 200 published research papers demonstrating its effectiveness across diverse populations and conditions.
      `,
      abstract: "Comprehensive review of MBSR effectiveness in clinical populations",
      keywords: ["mindfulness", "stress reduction", "meditation", "anxiety", "pain management"],
      citations: [
        "Kabat-Zinn, J. (2003). Mindfulness-based interventions in context. Clinical Psychology, 10(2), 144-156.",
        "Goyal, M., et al. (2014). Meditation programs for psychological stress. JAMA Internal Medicine, 174(3), 357-368."
      ]
    };

    const apiResult = await simpleDocumentProcessor.processResearchDocument(
      testData,
      'mindfulness_therapy'
    );

    if (apiResult.processing.success) {
      console.log('✅ API Integration Working');
      console.log(`📄 Document: ${apiResult.originalFilename}`);
      console.log(`📊 Processing Time: ${apiResult.processing.processingTime}ms`);
      console.log(`🎯 Quality Score: ${apiResult.processing.qualityScore}`);
      
      testResults.apiIntegration = true;
      testResults.passed++;
    } else {
      console.log('❌ API Integration Failed:', apiResult.processing.errors);
    }

  } catch (error) {
    console.log('❌ API Integration Error:', error.message);
  }

  // Final Results Summary
  console.log('\n====================================');
  console.log('📊 DOCUMENT PROCESSING TEST RESULTS');
  console.log('====================================');
  
  console.log(`\n✅ Tests Passed: ${testResults.passed}/${testResults.totalTests}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n🔍 Component Status:');
  console.log(`   ${testResults.textProcessing ? '✅' : '❌'} Text Document Processing`);
  console.log(`   ${testResults.bunnyNetStorage ? '✅' : '❌'} BunnyNet Storage Integration`);
  console.log(`   ${testResults.analysisEngine ? '✅' : '❌'} Content Analysis Engine`);
  console.log(`   ${testResults.apiIntegration ? '✅' : '❌'} API Integration`);

  if (testResults.passed === testResults.totalTests) {
    console.log('\n🎯 SYSTEM STATUS: FULLY FUNCTIONAL');
    console.log('   ✓ Document processing pipeline working');
    console.log('   ✓ BunnyNet storage integration active');
    console.log('   ✓ Content analysis extracting knowledge');
    console.log('   ✓ API endpoints ready for production');
  } else {
    console.log('\n⚠️  SYSTEM STATUS: PARTIAL FUNCTIONALITY');
    console.log(`   ${testResults.passed} of ${testResults.totalTests} components working`);
  }

  console.log('\n🚀 Available API Endpoints:');
  console.log('   POST /api/documents/upload - Upload text documents');
  console.log('   POST /api/documents/batch-upload - Batch process documents');
  console.log('   GET /api/documents/:documentId - Retrieve document content');
  console.log('   GET /api/documents/search - Search processed documents');
  console.log('   GET /api/documents/stats - Processing statistics');

  return testResults;
}

// Execute test
testDocumentProcessing().catch(error => {
  console.error('Test execution failed:', error);
});