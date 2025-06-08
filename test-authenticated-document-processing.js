/**
 * Test Authenticated Document Processing System
 * Verifies full API integration with proper authentication
 */

import fetch from 'node-fetch';

// Authentication helper
async function getAuthCookie() {
  try {
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      })
    });

    if (loginResponse.status === 401) {
      // User doesn't exist, create account
      const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'testpass123',
          email: 'test@example.com'
        })
      });

      if (registerResponse.ok) {
        console.log('✅ Test user created successfully');
        // Try login again
        const retryLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'testuser',
            password: 'testpass123'
          })
        });
        
        if (retryLoginResponse.ok) {
          return retryLoginResponse.headers.get('set-cookie');
        }
      }
    } else if (loginResponse.ok) {
      return loginResponse.headers.get('set-cookie');
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

async function authenticatedFetch(url, options = {}) {
  const cookie = await getAuthCookie();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Cookie': cookie || ''
    }
  });
}

async function testAuthenticatedDocumentProcessing() {
  console.log('🔐 Testing Authenticated Document Processing System');
  console.log('=====================================================\n');

  try {
    // Test 1: Document Upload with Authentication
    console.log('1. Testing Authenticated Document Upload');
    console.log('========================================');

    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    
    // Create test document
    const testContent = `
# Advanced Therapeutic Interventions for Anxiety Disorders

## Introduction
This document outlines evidence-based therapeutic interventions for treating anxiety disorders, including cognitive-behavioral therapy (CBT), exposure therapy, and mindfulness-based approaches.

## Key Methodologies
- Cognitive restructuring techniques
- Systematic desensitization
- Mindfulness meditation practices
- Acceptance and commitment therapy (ACT)

## Clinical Applications
These interventions have shown significant efficacy in treating generalized anxiety disorder, social anxiety, and panic disorder across diverse populations.

## Research Findings
Meta-analyses indicate that CBT combined with mindfulness approaches yields superior outcomes compared to single-modality treatments.
    `;

    formData.append('document', Buffer.from(testContent), {
      filename: 'authenticated-test-document.txt',
      contentType: 'text/plain'
    });
    formData.append('discipline', 'cognitive_behavioral_therapy');

    const uploadResponse = await authenticatedFetch('http://localhost:5000/api/documents/upload', {
      method: 'POST',
      body: formData
    });

    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      console.log('✅ Authenticated Upload Successful');
      console.log(`📄 Document ID: ${uploadResult.document.id}`);
      console.log(`📊 Quality Score: ${uploadResult.document.qualityScore}`);
      console.log(`🔗 Storage URL: ${uploadResult.document.url}`);
      console.log(`🧠 Concepts: ${uploadResult.document.extractedContent.concepts.join(', ')}`);
    } else {
      console.log(`❌ Upload Failed: Status ${uploadResponse.status}`);
      const errorText = await uploadResponse.text();
      console.log(`Error: ${errorText}`);
    }

    // Test 2: Document Statistics with Authentication
    console.log('\n2. Testing Authenticated Document Statistics');
    console.log('============================================');

    const statsResponse = await authenticatedFetch('http://localhost:5000/api/documents/stats');
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Document Statistics Retrieved');
      console.log(`📈 Total Documents: ${stats.totalDocuments || 0}`);
      console.log(`💾 Total Storage Used: ${stats.totalStorageUsed || '0 bytes'}`);
      console.log(`⚡ Average Processing Time: ${stats.averageProcessingTime || '0ms'}`);
    } else {
      console.log(`❌ Statistics Failed: Status ${statsResponse.status}`);
    }

    // Test 3: Document Search with Authentication
    console.log('\n3. Testing Authenticated Document Search');
    console.log('=======================================');

    const searchResponse = await authenticatedFetch('http://localhost:5000/api/documents/search?query=anxiety&discipline=cognitive_behavioral_therapy');
    
    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      console.log('✅ Document Search Successful');
      console.log(`🔍 Results Found: ${searchResults.documents?.length || 0}`);
      if (searchResults.documents?.length > 0) {
        console.log(`📝 First Result: ${searchResults.documents[0].filename}`);
      }
    } else {
      console.log(`❌ Search Failed: Status ${searchResponse.status}`);
    }

    // Test 4: Batch Upload with Authentication
    console.log('\n4. Testing Authenticated Batch Upload');
    console.log('====================================');

    const batchFormData = new FormData();
    
    // Create multiple test documents
    const doc1 = Buffer.from('Anxiety treatment protocols for clinical practice. CBT interventions show significant efficacy.');
    const doc2 = Buffer.from('Mindfulness-based stress reduction techniques for anxiety management in therapeutic settings.');
    
    batchFormData.append('documents', doc1, {
      filename: 'batch-doc-1.txt',
      contentType: 'text/plain'
    });
    batchFormData.append('documents', doc2, {
      filename: 'batch-doc-2.txt',
      contentType: 'text/plain'
    });
    batchFormData.append('discipline', 'clinical_psychology');

    const batchResponse = await authenticatedFetch('http://localhost:5000/api/documents/batch-upload', {
      method: 'POST',
      body: batchFormData
    });

    if (batchResponse.ok) {
      const batchResult = await batchResponse.json();
      console.log('✅ Batch Upload Successful');
      console.log(`📚 Documents Processed: ${batchResult.results?.length || 0}`);
      console.log(`⏱️ Total Processing Time: ${batchResult.totalProcessingTime || 0}ms`);
    } else {
      console.log(`❌ Batch Upload Failed: Status ${batchResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Test Error:', error);
  }

  console.log('\n====================================');
  console.log('🏁 AUTHENTICATED DOCUMENT PROCESSING TEST COMPLETE');
  console.log('====================================');
}

// Run the test
testAuthenticatedDocumentProcessing().catch(console.error);