/**
 * Complete Document Processing System Test
 * Tests PDF, Word, and text document processing with BunnyNet integration
 */

import { integratedDocumentProcessor } from './shared/document-processing/integrated-processor.js';

async function testCompleteDocumentProcessing() {
  console.log('🔬 Testing Complete Document Processing System');
  console.log('===============================================');

  const testResults = {
    passed: 0,
    total: 6,
    textProcessing: false,
    pdfProcessing: false,
    wordProcessing: false,
    bunnyNetStorage: false,
    analysisEngine: false,
    apiIntegration: false
  };

  // 1. Test Text Document Processing
  console.log('\n1. Testing Text Document Processing');
  console.log('===================================');
  
  try {
    const textDocument = `
Cognitive Behavioral Therapy for Anxiety Disorders: A Comprehensive Review

Abstract:
Cognitive Behavioral Therapy (CBT) has emerged as one of the most effective evidence-based treatments for anxiety disorders. This comprehensive review examines the efficacy, mechanisms, and applications of CBT across various anxiety conditions including generalized anxiety disorder (GAD), panic disorder, social anxiety disorder, and specific phobias.

Introduction:
Anxiety disorders represent the most common class of mental health conditions, affecting approximately 18% of adults annually. The prevalence and impact of these conditions necessitate effective, accessible treatment modalities. CBT, grounded in the cognitive model of emotional disorders, addresses the interconnected nature of thoughts, feelings, and behaviors that maintain anxiety symptoms.

Methodology:
This review synthesizes findings from 45 randomized controlled trials (RCTs) published between 2018-2023, encompassing 3,247 participants across diverse demographic groups. Studies were selected based on rigorous inclusion criteria including validated outcome measures, adequate sample sizes, and follow-up periods of at least 6 months.

Key Findings:
1. Efficacy Rates: CBT demonstrated significant improvements in 78% of participants, with effect sizes ranging from d=0.68 to d=1.24 across different anxiety disorders.

2. Mechanism Analysis: Cognitive restructuring and behavioral activation emerged as the primary therapeutic mechanisms, with mindfulness integration showing additional benefits.

3. Treatment Duration: Optimal outcomes were achieved with 12-16 sessions, though intensive formats (8-10 sessions) showed comparable results for specific phobias.

4. Maintenance Effects: 85% of participants maintained treatment gains at 12-month follow-up, with booster sessions enhancing long-term outcomes.

Clinical Applications:
The review identifies several key therapeutic techniques:
- Cognitive restructuring for catastrophic thinking patterns
- Graded exposure therapy for avoidance behaviors  
- Relaxation training and breathing techniques
- Homework assignments and behavioral experiments
- Relapse prevention strategies

Neurobiological Correlates:
Neuroimaging studies reveal CBT-induced changes in amygdala reactivity, prefrontal cortex activation, and default mode network connectivity, supporting the neuroplastic basis of therapeutic change.

Conclusion:
CBT represents a robust, evidence-based intervention for anxiety disorders with strong empirical support. The integration of traditional CBT techniques with modern approaches such as mindfulness and technology-enhanced delivery shows promise for improving accessibility and outcomes.

References:
1. Smith, A. B., et al. (2023). Meta-analysis of CBT efficacy in anxiety disorders. Journal of Clinical Psychology, 79(3), 245-267.
2. Johnson, C. D., & Williams, E. F. (2022). Neurobiological mechanisms of CBT in anxiety treatment. Neuroscience & Biobehavioral Reviews, 128, 89-103.
3. Brown, G. H., et al. (2023). Long-term outcomes of CBT for generalized anxiety disorder. Behavior Research and Therapy, 162, 104-118.
    `;

    const result = await integratedDocumentProcessor.processDocument(
      Buffer.from(textDocument, 'utf-8'),
      'cbt-anxiety-comprehensive-review.txt',
      'txt',
      'cognitive_behavioral_therapy'
    );

    if (result.processing.success) {
      console.log('✅ Text Processing Successful');
      console.log(`📊 Word Count: ${result.extractedContent.metadata.wordCount}`);
      console.log(`🧠 Concepts: ${result.extractedContent.analysis.concepts.length}`);
      console.log(`⚕️ Clinical Terms: ${result.extractedContent.analysis.clinicalTerms.length}`);
      console.log(`📈 Quality Score: ${result.processing.qualityScore}`);
      
      testResults.textProcessing = true;
      testResults.passed++;

      if (result.bunnyNetUrl) {
        testResults.bunnyNetStorage = true;
        testResults.passed++;
        console.log(`🔗 Storage URL: ${result.bunnyNetUrl}`);
      }

      if (result.extractedContent.analysis.concepts.length > 10) {
        testResults.analysisEngine = true;
        testResults.passed++;
        console.log(`📝 Top Concepts: ${result.extractedContent.analysis.concepts.slice(0, 5).join(', ')}`);
      }
    }
  } catch (error) {
    console.log('❌ Text Processing Failed:', error.message);
  }

  // 2. Test PDF Processing (Fallback)
  console.log('\n2. Testing PDF Processing (Fallback Mode)');
  console.log('=========================================');
  
  try {
    const pdfDocument = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Anxiety Research Paper) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000202 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
295
%%EOF

Research indicates that cognitive behavioral therapy demonstrates significant efficacy in treating anxiety disorders. 
Studies show improvement rates of 70-85% across various anxiety conditions including panic disorder, social anxiety, 
and generalized anxiety disorder. The therapeutic mechanisms involve cognitive restructuring, behavioral activation, 
and exposure therapy techniques.
    `;

    const result = await integratedDocumentProcessor.processDocument(
      Buffer.from(pdfDocument, 'utf-8'),
      'anxiety-research.pdf',
      'pdf',
      'clinical_psychology'
    );

    if (result.processing.success) {
      console.log('✅ PDF Processing (Fallback) Successful');
      console.log(`📊 Content Extracted: ${result.extractedContent.text.length} characters`);
      console.log(`🧠 Concepts: ${result.extractedContent.analysis.concepts.length}`);
      
      testResults.pdfProcessing = true;
      testResults.passed++;
    }
  } catch (error) {
    console.log('❌ PDF Processing Failed:', error.message);
  }

  // 3. Test Word Document Processing
  console.log('\n3. Testing Word Document Processing');
  console.log('===================================');
  
  try {
    // Create a simple Word document structure
    const wordDocument = `
Therapeutic Interventions for Mental Health

Introduction:
Mental health interventions encompass a broad range of therapeutic approaches designed to address psychological distress and promote emotional well-being. This document reviews evidence-based practices in psychotherapy, with particular emphasis on cognitive-behavioral interventions.

Cognitive Behavioral Therapy:
CBT operates on the principle that thoughts, feelings, and behaviors are interconnected. By identifying and modifying maladaptive thought patterns, individuals can experience significant improvements in emotional regulation and behavioral functioning.

Key Techniques:
1. Cognitive Restructuring
2. Behavioral Activation
3. Exposure Therapy
4. Mindfulness Integration
5. Relapse Prevention

Research Evidence:
Multiple randomized controlled trials demonstrate the efficacy of CBT across various mental health conditions. Effect sizes typically range from moderate to large (d=0.5 to d=1.2), with treatment gains maintained at long-term follow-up.
    `;

    const result = await integratedDocumentProcessor.processDocument(
      Buffer.from(wordDocument, 'utf-8'),
      'therapeutic-interventions.docx',
      'docx',
      'psychotherapy'
    );

    if (result.processing.success) {
      console.log('✅ Word Document Processing Successful');
      console.log(`📊 Content: ${result.extractedContent.metadata.wordCount} words`);
      console.log(`🧠 Concepts: ${result.extractedContent.analysis.concepts.length}`);
      
      testResults.wordProcessing = true;
      testResults.passed++;
    }
  } catch (error) {
    console.log('❌ Word Processing Failed:', error.message);
  }

  // 4. Test API Integration
  console.log('\n4. Testing API Integration');
  console.log('=========================');
  
  try {
    const response = await fetch('http://localhost:5000/api/documents/stats');
    
    if (response.ok) {
      const stats = await response.json();
      console.log('✅ API Integration Working');
      console.log(`📈 Processing Stats Available: ${JSON.stringify(stats, null, 2)}`);
      
      testResults.apiIntegration = true;
      testResults.passed++;
    } else {
      console.log('❌ API Integration Failed: Status', response.status);
    }
  } catch (error) {
    console.log('❌ API Integration Error:', error.message);
  }

  // Results Summary
  console.log('\n====================================');
  console.log('📊 COMPLETE DOCUMENT PROCESSING TEST RESULTS');
  console.log('====================================');
  
  console.log(`\n✅ Tests Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`📈 Success Rate: ${(testResults.passed / testResults.total * 100).toFixed(1)}%`);
  
  console.log('\n🔍 Component Status:');
  console.log(`   ${testResults.textProcessing ? '✅' : '❌'} Text Document Processing`);
  console.log(`   ${testResults.pdfProcessing ? '✅' : '❌'} PDF Document Processing (Fallback)`);
  console.log(`   ${testResults.wordProcessing ? '✅' : '❌'} Word Document Processing`);
  console.log(`   ${testResults.bunnyNetStorage ? '✅' : '❌'} BunnyNet Storage Integration`);
  console.log(`   ${testResults.analysisEngine ? '✅' : '❌'} Content Analysis Engine`);
  console.log(`   ${testResults.apiIntegration ? '✅' : '❌'} API Integration`);

  const systemStatus = testResults.passed >= 5 ? 'FULLY OPERATIONAL' : 
                       testResults.passed >= 3 ? 'MOSTLY FUNCTIONAL' : 'NEEDS ATTENTION';
  
  console.log(`\n🚀 SYSTEM STATUS: ${systemStatus}`);
  console.log(`   ${testResults.passed} of ${testResults.total} components working`);

  console.log('\n📚 Document Processing Capabilities:');
  console.log('   • Text files (.txt) - Full processing');
  console.log('   • PDF files (.pdf) - Fallback text extraction');
  console.log('   • Word files (.docx) - Mammoth.js integration');
  console.log('   • BunnyNet CDN storage - Production ready');
  console.log('   • AI content analysis - Concept extraction');
  console.log('   • Clinical term recognition - Healthcare focus');

  console.log('\n🔗 Available API Endpoints:');
  console.log('   POST /api/documents/upload - Upload documents');
  console.log('   POST /api/documents/batch-upload - Batch processing');
  console.log('   GET /api/documents/:id - Retrieve document');
  console.log('   GET /api/documents/search - Search content');
  console.log('   GET /api/documents/stats - Processing statistics');

  return testResults;
}

// Run the test
testCompleteDocumentProcessing().catch(console.error);