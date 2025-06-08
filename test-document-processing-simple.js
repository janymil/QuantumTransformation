
/**
 * Simple Document Processing Test
 * Tests the document processing system with basic functionality
 */

import { integratedDocumentProcessor } from './shared/document-processing/integrated-processor.js';

async function testDocumentProcessing() {
  console.log('🔬 Testing Document Processing System');
  console.log('====================================');

  try {
    // Test 1: Text Document Processing
    console.log('\n1. Testing Text Document Processing');
    console.log('===================================');

    const testText = `
Cognitive Behavioral Therapy for Anxiety Disorders

Introduction:
Cognitive Behavioral Therapy (CBT) is an evidence-based treatment approach that has shown significant efficacy in treating various anxiety disorders. This therapeutic intervention focuses on identifying and modifying dysfunctional thought patterns and behaviors.

Key Components:
- Cognitive restructuring
- Behavioral activation
- Exposure therapy
- Relapse prevention

Research Findings:
Multiple randomized controlled trials have demonstrated that CBT produces substantial improvements in anxiety symptoms, with effect sizes ranging from 0.68 to 0.91 across different anxiety disorders.

Clinical Applications:
CBT techniques can be applied to treat generalized anxiety disorder, panic disorder, social anxiety disorder, and specific phobias.
    `;

    const textResult = await integratedDocumentProcessor.processDocument(
      Buffer.from(testText, 'utf-8'),
      'test-cbt-document.txt',
      'txt',
      'cognitive_behavioral_therapy'
    );

    if (textResult.processing.success) {
      console.log('✅ Text Processing: SUCCESS');
      console.log(`📊 Quality Score: ${textResult.processing.qualityScore}`);
      console.log(`⏱️ Processing Time: ${textResult.processing.processingTime}ms`);
      console.log(`🧠 Concepts Found: ${textResult.extractedContent.analysis.concepts.length}`);
      console.log(`⚕️ Clinical Terms: ${textResult.extractedContent.analysis.clinicalTerms.length}`);
      console.log(`🔗 BunnyNet URL: ${textResult.bunnyNetUrl}`);
    } else {
      console.log('❌ Text Processing: FAILED');
      console.log('Errors:', textResult.processing.errors);
    }

    // Test 2: PDF Processing (simulated)
    console.log('\n2. Testing PDF Processing');
    console.log('=========================');

    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
72 720 Td
(Anxiety Treatment Research) Tj
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
<< /Size 5 /Root 1 0 R >>
startxref
295
%%EOF

This research document examines evidence-based treatments for anxiety disorders. Clinical studies demonstrate significant efficacy of cognitive-behavioral interventions in reducing anxiety symptoms across diverse patient populations.`;

    const pdfResult = await integratedDocumentProcessor.processDocument(
      Buffer.from(pdfContent, 'utf-8'),
      'test-anxiety-research.pdf',
      'pdf',
      'clinical_psychology'
    );

    if (pdfResult.processing.success) {
      console.log('✅ PDF Processing: SUCCESS');
      console.log(`📊 Quality Score: ${pdfResult.processing.qualityScore}`);
      console.log(`⏱️ Processing Time: ${pdfResult.processing.processingTime}ms`);
      console.log(`📄 Content Length: ${pdfResult.extractedContent.text.length} characters`);
    } else {
      console.log('❌ PDF Processing: FAILED');
      console.log('Errors:', pdfResult.processing.errors);
    }

    // Test 3: Word Document Processing (simulated)
    console.log('\n3. Testing Word Document Processing');
    console.log('===================================');

    const docxContent = `Therapeutic Interventions for Mental Health

This document outlines various therapeutic approaches used in clinical psychology practice:

1. Cognitive Behavioral Therapy (CBT)
   - Identifies negative thought patterns
   - Develops coping strategies
   - Evidence-based effectiveness

2. Dialectical Behavior Therapy (DBT)
   - Emotional regulation skills
   - Mindfulness practices
   - Interpersonal effectiveness

3. Acceptance and Commitment Therapy (ACT)
   - Psychological flexibility
   - Value-based living
   - Mindfulness integration

Research indicates these approaches show significant improvement in patient outcomes across various mental health conditions.`;

    const docxResult = await integratedDocumentProcessor.processDocument(
      Buffer.from(docxContent, 'utf-8'),
      'test-therapeutic-interventions.docx',
      'docx',
      'psychotherapy'
    );

    if (docxResult.processing.success) {
      console.log('✅ Word Processing: SUCCESS');
      console.log(`📊 Quality Score: ${docxResult.processing.qualityScore}`);
      console.log(`⏱️ Processing Time: ${docxResult.processing.processingTime}ms`);
      console.log(`📄 Content Length: ${docxResult.extractedContent.text.length} characters`);
    } else {
      console.log('❌ Word Processing: FAILED');
      console.log('Errors:', docxResult.processing.errors);
    }

    // Test 4: Document Retrieval
    console.log('\n4. Testing Document Retrieval');
    console.log('=============================');

    if (textResult.bunnyNetUrl) {
      try {
        const retrievedContent = await integratedDocumentProcessor.retrieveDocument(textResult.bunnyNetUrl);
        console.log('✅ Document Retrieval: SUCCESS');
        console.log(`📄 Retrieved Length: ${retrievedContent.length} characters`);
      } catch (error) {
        console.log('❌ Document Retrieval: FAILED');
        console.log('Error:', error.message);
      }
    }

    console.log('\n====================================');
    console.log('🎯 DOCUMENT PROCESSING TEST COMPLETE');
    console.log('====================================');

  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Run the test
testDocumentProcessing().catch(console.error);
