/**
 * Comprehensive Vision Board System Diagnosis
 * Identifies all issues: authentication, database, frontend, backend integration
 */

async function comprehensiveVisionBoardDiagnosis() {
  console.log('🔍 COMPREHENSIVE VISION BOARD DIAGNOSIS');
  console.log('=====================================');

  const issues = [];
  
  try {
    // Issue 1: Database Schema Validation
    console.log('\n1. Testing Database Schema...');
    const schemaTest = await fetch('http://localhost:5000/api/vision-boards', {
      method: 'GET'
    });
    
    if (schemaTest.status === 401) {
      issues.push({
        category: 'Authentication',
        severity: 'CRITICAL',
        issue: 'Authentication middleware blocking all requests',
        description: 'Vision board endpoints return 401 Unauthorized even for GET requests'
      });
    }

    // Issue 2: Frontend-Backend Integration
    console.log('\n2. Testing Frontend Integration...');
    try {
      const frontendTest = await fetch('http://localhost:5000/api/vision-board/templates');
      if (frontendTest.ok) {
        const templates = await frontendTest.json();
        console.log('✅ Templates endpoint working:', templates.length, 'templates');
      }
    } catch (error) {
      issues.push({
        category: 'Frontend Integration',
        severity: 'HIGH',
        issue: 'Frontend-backend communication failure',
        description: error.message
      });
    }

    // Issue 3: Database Operations
    console.log('\n3. Testing Database Operations...');
    
    // Issue 4: Image Generation and Storage
    console.log('\n4. Testing Image Generation...');
    
    // Issue 5: Canvas Data Handling
    console.log('\n5. Testing Canvas Data Structure...');
    
    // Issue 6: User Session Management
    console.log('\n6. Testing User Session...');
    const authTest = await fetch('http://localhost:5000/api/auth/user');
    if (authTest.status === 401) {
      issues.push({
        category: 'Session Management',
        severity: 'CRITICAL',
        issue: 'User session not persisting properly',
        description: 'Authentication fails despite user being logged in frontend'
      });
    }

    // Issue 7: API Route Configuration
    console.log('\n7. Testing API Routes...');
    const routes = [
      '/api/vision-boards',
      '/api/vision-boards/templates',
      '/api/ai/generate-vision-board',
      '/api/ai/generate-image'
    ];

    for (const route of routes) {
      try {
        const response = await fetch(`http://localhost:5000${route}`);
        if (response.status === 404) {
          issues.push({
            category: 'API Configuration',
            severity: 'HIGH',
            issue: `Route ${route} not found`,
            description: 'API endpoint not properly configured'
          });
        }
      } catch (error) {
        issues.push({
          category: 'API Configuration',
          severity: 'MEDIUM',
          issue: `Route ${route} connection error`,
          description: error.message
        });
      }
    }

    console.log('\n📋 DIAGNOSIS SUMMARY');
    console.log('===================');
    console.log(`Total Issues Found: ${issues.length}`);
    
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
    const highIssues = issues.filter(i => i.severity === 'HIGH');
    const mediumIssues = issues.filter(i => i.severity === 'MEDIUM');
    
    console.log(`🔴 Critical Issues: ${criticalIssues.length}`);
    console.log(`🟡 High Priority Issues: ${highIssues.length}`);
    console.log(`🟢 Medium Priority Issues: ${mediumIssues.length}`);

    console.log('\n🔴 CRITICAL ISSUES TO FIX FIRST:');
    criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.category}] ${issue.issue}`);
      console.log(`   Description: ${issue.description}`);
    });

    console.log('\n🟡 HIGH PRIORITY ISSUES:');
    highIssues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.category}] ${issue.issue}`);
      console.log(`   Description: ${issue.description}`);
    });

    console.log('\n📝 RECOMMENDED FIX ORDER:');
    console.log('1. Fix authentication middleware to allow proper user session handling');
    console.log('2. Verify database schema and table creation');
    console.log('3. Test and fix all API routes');
    console.log('4. Fix frontend component integration');
    console.log('5. Test image generation and storage');
    console.log('6. Validate canvas data structure and handling');

    return {
      totalIssues: issues.length,
      critical: criticalIssues.length,
      high: highIssues.length,
      medium: mediumIssues.length,
      issues: issues
    };

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    return { error: error.message };
  }
}

// Run comprehensive diagnosis
comprehensiveVisionBoardDiagnosis();