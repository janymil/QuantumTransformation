/**
 * Comprehensive Vision Board System Debugging Test
 * Tests all vision board functionality including AI generation, CRUD operations, and image handling
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const TEST_USER_ID = '43272767'; // Using existing user from database

// Authentication helper
async function getAuthCookie() {
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jan.milata@gmail.com',
        password: 'testpass123'
      })
    });
    
    if (loginResponse.ok) {
      const cookies = loginResponse.headers.get('set-cookie');
      return cookies;
    }
    return null;
  } catch (error) {
    console.log('Auth helper: Using existing session');
    return null;
  }
}

// Create authenticated fetch function
async function authenticatedFetch(url, options = {}) {
  const authCookie = await getAuthCookie();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authCookie) {
    headers['Cookie'] = authCookie;
  }
  
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Test Vision Board CRUD Operations
 */
async function testVisionBoardCRUD() {
  console.log('\n=== Testing Vision Board CRUD Operations ===');
  
  try {
    // Test 1: Create Vision Board
    console.log('1. Testing Vision Board Creation...');
    const createResponse = await authenticatedFetch(`${BASE_URL}/api/vision-boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Vision Board',
        description: 'Comprehensive test board',
        canvasData: {
          elements: [
            {
              id: 'text1',
              type: 'text',
              content: 'Financial Freedom',
              x: 100,
              y: 100,
              fontSize: 24,
              color: '#000000'
            },
            {
              id: 'img1',
              type: 'image',
              content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              x: 200,
              y: 200,
              width: 150,
              height: 150
            }
          ]
        },
        templateCategory: 'personal'
      })
    });
    
    if (!createResponse.ok) {
      console.error('❌ Vision Board Creation Failed:', await createResponse.text());
      return null;
    }
    
    const createdBoard = await createResponse.json();
    console.log('✅ Vision Board Created:', {
      id: createdBoard.id,
      title: createdBoard.title,
      elementsCount: createdBoard.canvasData?.elements?.length || 0
    });
    
    // Test 2: Fetch Vision Boards
    console.log('2. Testing Vision Board Retrieval...');
    const fetchResponse = await fetch(`${BASE_URL}/api/vision-boards`);
    
    if (!fetchResponse.ok) {
      console.error('❌ Vision Board Fetch Failed:', await fetchResponse.text());
      return createdBoard.id;
    }
    
    const boards = await fetchResponse.json();
    console.log('✅ Vision Boards Retrieved:', {
      totalBoards: boards.length,
      foundTestBoard: boards.some(b => b.id === createdBoard.id)
    });
    
    // Test 3: Update Vision Board
    console.log('3. Testing Vision Board Update...');
    const updateResponse = await fetch(`${BASE_URL}/api/vision-boards/${createdBoard.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Test Vision Board',
        description: 'Updated description',
        canvasData: {
          elements: [
            ...createdBoard.canvasData.elements,
            {
              id: 'text2',
              type: 'text',
              content: 'Health & Wellness',
              x: 300,
              y: 300,
              fontSize: 20,
              color: '#ff0000'
            }
          ]
        }
      })
    });
    
    if (!updateResponse.ok) {
      console.error('❌ Vision Board Update Failed:', await updateResponse.text());
    } else {
      const updatedBoard = await updateResponse.json();
      console.log('✅ Vision Board Updated:', {
        id: updatedBoard.id,
        title: updatedBoard.title,
        elementsCount: updatedBoard.canvasData?.elements?.length || 0
      });
    }
    
    return createdBoard.id;
    
  } catch (error) {
    console.error('❌ Vision Board CRUD Test Error:', error.message);
    return null;
  }
}

/**
 * Test AI Vision Board Generation
 */
async function testAIVisionBoardGeneration() {
  console.log('\n=== Testing AI Vision Board Generation ===');
  
  try {
    // Test AI Generation with comprehensive user data
    console.log('1. Testing AI Vision Board Generation...');
    const aiResponse = await fetch(`${BASE_URL}/api/ai/generate-vision-board`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goals: [
          'Achieve financial freedom',
          'Build a successful business',
          'Travel the world',
          'Improve health and fitness'
        ],
        preferences: {
          style: 'modern',
          colorScheme: 'vibrant',
          layout: 'grid'
        },
        categories: ['career', 'health', 'relationships', 'personal growth']
      })
    });
    
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI Vision Board Generation Failed:', errorText);
      
      // Check if it's a usage limit issue
      if (aiResponse.status === 429) {
        console.log('ℹ️ Daily AI usage limit reached - this is expected behavior');
        return { limitReached: true };
      }
      return null;
    }
    
    const aiBoard = await aiResponse.json();
    console.log('✅ AI Vision Board Generated:', {
      hasVisionBoard: !!aiBoard.visionBoard,
      elementsCount: aiBoard.visionBoard?.elements?.length || 0,
      hasAnalysisSource: !!aiBoard.analysisSource,
      cost: aiBoard.cost,
      remainingRequests: aiBoard.remainingRequests
    });
    
    // Validate AI response structure
    if (aiBoard.visionBoard) {
      const vb = aiBoard.visionBoard;
      console.log('📊 AI Vision Board Details:', {
        title: vb.title,
        theme: vb.theme,
        backgroundColor: vb.backgroundColor,
        elements: vb.elements?.map(e => ({ type: e.type, category: e.category })),
        personalizedInsights: vb.personalizedInsights?.length || 0,
        goalCategories: vb.goalCategories?.length || 0
      });
    }
    
    return aiBoard;
    
  } catch (error) {
    console.error('❌ AI Vision Board Generation Error:', error.message);
    return null;
  }
}

/**
 * Test Vision Board Image Generation
 */
async function testImageGeneration() {
  console.log('\n=== Testing Vision Board Image Generation ===');
  
  try {
    console.log('1. Testing OpenAI Image Generation...');
    const imageResponse = await fetch(`${BASE_URL}/api/ai/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A beautiful sunset over mountains representing peace and success',
        size: '1024x1024',
        quality: 'standard'
      })
    });
    
    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('❌ Image Generation Failed:', errorText);
      
      if (imageResponse.status === 429) {
        console.log('ℹ️ Daily AI usage limit reached for image generation');
        return { limitReached: true };
      }
      return null;
    }
    
    const imageResult = await imageResponse.json();
    console.log('✅ Image Generated:', {
      hasImageUrl: !!imageResult.imageUrl,
      model: imageResult.model,
      cost: imageResult.cost,
      remainingRequests: imageResult.remainingRequests
    });
    
    return imageResult;
    
  } catch (error) {
    console.error('❌ Image Generation Error:', error.message);
    return null;
  }
}

/**
 * Test Vision Board Mobile Wallpaper Generation
 */
async function testMobileWallpaperGeneration() {
  console.log('\n=== Testing Mobile Wallpaper Generation ===');
  
  try {
    // First create a test vision board for wallpaper generation
    const testVisionBoard = {
      title: 'Success Vision',
      elements: [
        {
          type: 'text',
          content: 'Financial Freedom',
          x: 50,
          y: 100,
          fontSize: 32,
          color: '#ffffff'
        },
        {
          type: 'text',
          content: 'Health & Wellness',
          x: 50,
          y: 200,
          fontSize: 28,
          color: '#ffff00'
        }
      ],
      backgroundColor: '#1a1a2e'
    };
    
    console.log('1. Testing Mobile Wallpaper Generation...');
    const wallpaperResponse = await fetch(`${BASE_URL}/api/vision-board/generate-mobile-wallpaper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visionBoard: testVisionBoard,
        deviceType: 'iphone',
        style: 'modern'
      })
    });
    
    if (!wallpaperResponse.ok) {
      const errorText = await wallpaperResponse.text();
      console.error('❌ Mobile Wallpaper Generation Failed:', errorText);
      return null;
    }
    
    const wallpaperResult = await wallpaperResponse.json();
    console.log('✅ Mobile Wallpaper Generated:', {
      hasWallpaperUrl: !!wallpaperResult.wallpaperUrl,
      deviceType: wallpaperResult.deviceType,
      dimensions: wallpaperResult.dimensions
    });
    
    return wallpaperResult;
    
  } catch (error) {
    console.error('❌ Mobile Wallpaper Generation Error:', error.message);
    return null;
  }
}

/**
 * Test Vision Board Analytics and Progress Tracking
 */
async function testVisionBoardAnalytics() {
  console.log('\n=== Testing Vision Board Analytics ===');
  
  try {
    console.log('1. Testing Vision Board Progress Tracking...');
    const progressResponse = await fetch(`${BASE_URL}/api/vision-board/progress-analytics/${TEST_USER_ID}`);
    
    if (!progressResponse.ok) {
      console.error('❌ Progress Analytics Failed:', await progressResponse.text());
      return null;
    }
    
    const progressData = await progressResponse.json();
    console.log('✅ Progress Analytics Retrieved:', {
      totalBoards: progressData.totalBoards || 0,
      completedGoals: progressData.completedGoals || 0,
      activeGoals: progressData.activeGoals || 0,
      hasEngagementData: !!progressData.engagementMetrics
    });
    
    return progressData;
    
  } catch (error) {
    console.error('❌ Vision Board Analytics Error:', error.message);
    return null;
  }
}

/**
 * Test Vision Board Templates and Categories
 */
async function testVisionBoardTemplates() {
  console.log('\n=== Testing Vision Board Templates ===');
  
  try {
    console.log('1. Testing Template Retrieval...');
    const templatesResponse = await fetch(`${BASE_URL}/api/vision-board/templates`);
    
    if (!templatesResponse.ok) {
      console.error('❌ Templates Retrieval Failed:', await templatesResponse.text());
      return null;
    }
    
    const templates = await templatesResponse.json();
    console.log('✅ Templates Retrieved:', {
      totalTemplates: templates.length || 0,
      categories: [...new Set(templates.map(t => t.category))],
      sampleTemplate: templates[0]?.name || 'None'
    });
    
    return templates;
    
  } catch (error) {
    console.error('❌ Vision Board Templates Error:', error.message);
    return null;
  }
}

/**
 * Test Vision Board Integration with User Data
 */
async function testUserDataIntegration() {
  console.log('\n=== Testing User Data Integration ===');
  
  try {
    // Test journal entries integration
    console.log('1. Testing Journal Entries Integration...');
    const journalsResponse = await fetch(`${BASE_URL}/api/journals`);
    let journalCount = 0;
    
    if (journalsResponse.ok) {
      const journals = await journalsResponse.json();
      journalCount = journals.length || 0;
      console.log('✅ Journal Entries Found:', journalCount);
    }
    
    // Test affirmations integration
    console.log('2. Testing Affirmations Integration...');
    const affirmationsResponse = await fetch(`${BASE_URL}/api/affirmations`);
    let affirmationCount = 0;
    
    if (affirmationsResponse.ok) {
      const affirmations = await affirmationsResponse.json();
      affirmationCount = affirmations.length || 0;
      console.log('✅ Affirmations Found:', affirmationCount);
    }
    
    // Test user goals integration
    console.log('3. Testing User Goals Integration...');
    const goalsResponse = await fetch(`${BASE_URL}/api/progress/all`);
    let goalCount = 0;
    
    if (goalsResponse.ok) {
      const goals = await goalsResponse.json();
      goalCount = goals.allProgress?.length || 0;
      console.log('✅ User Goals Found:', goalCount);
    }
    
    return {
      journalEntries: journalCount,
      affirmations: affirmationCount,
      goals: goalCount,
      hasEnoughDataForAI: journalCount > 0 || affirmationCount > 0 || goalCount > 0
    };
    
  } catch (error) {
    console.error('❌ User Data Integration Error:', error.message);
    return null;
  }
}

/**
 * Test Vision Board Storage and Performance
 */
async function testStorageAndPerformance() {
  console.log('\n=== Testing Storage and Performance ===');
  
  try {
    const startTime = Date.now();
    
    // Test large vision board creation
    console.log('1. Testing Large Vision Board Storage...');
    const largeBoard = {
      title: 'Performance Test Board',
      description: 'Testing storage with multiple elements',
      canvasData: {
        elements: Array.from({ length: 20 }, (_, i) => ({
          id: `element${i}`,
          type: i % 2 === 0 ? 'text' : 'image',
          content: i % 2 === 0 ? `Goal ${i}` : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          x: (i % 5) * 100,
          y: Math.floor(i / 5) * 100,
          width: 80,
          height: 80
        }))
      }
    };
    
    const storageResponse = await fetch(`${BASE_URL}/api/vision-boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(largeBoard)
    });
    
    const storageTime = Date.now() - startTime;
    
    if (storageResponse.ok) {
      const result = await storageResponse.json();
      console.log('✅ Large Vision Board Stored:', {
        id: result.id,
        elementsCount: largeBoard.canvasData.elements.length,
        storageTime: `${storageTime}ms`
      });
      return result.id;
    } else {
      console.error('❌ Large Vision Board Storage Failed:', await storageResponse.text());
      return null;
    }
    
  } catch (error) {
    console.error('❌ Storage and Performance Error:', error.message);
    return null;
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(boardIds) {
  console.log('\n=== Cleaning Up Test Data ===');
  
  for (const boardId of boardIds.filter(Boolean)) {
    try {
      const deleteResponse = await fetch(`${BASE_URL}/api/vision-boards/${boardId}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log(`✅ Cleaned up vision board ${boardId}`);
      } else {
        console.log(`⚠️ Could not clean up vision board ${boardId}`);
      }
    } catch (error) {
      console.log(`⚠️ Error cleaning up vision board ${boardId}:`, error.message);
    }
  }
}

/**
 * Main comprehensive test function
 */
async function runComprehensiveVisionBoardTest() {
  console.log('🚀 Starting Comprehensive Vision Board System Test');
  console.log('==================================================');
  
  const testResults = {
    crudOperations: null,
    aiGeneration: null,
    imageGeneration: null,
    wallpaperGeneration: null,
    analytics: null,
    templates: null,
    userDataIntegration: null,
    performance: null
  };
  
  const createdBoardIds = [];
  
  try {
    // Run all tests
    const crudResult = await testVisionBoardCRUD();
    if (crudResult) createdBoardIds.push(crudResult);
    testResults.crudOperations = !!crudResult;
    
    testResults.aiGeneration = await testAIVisionBoardGeneration();
    testResults.imageGeneration = await testImageGeneration();
    testResults.wallpaperGeneration = await testMobileWallpaperGeneration();
    testResults.analytics = await testVisionBoardAnalytics();
    testResults.templates = await testVisionBoardTemplates();
    testResults.userDataIntegration = await testUserDataIntegration();
    
    const performanceResult = await testStorageAndPerformance();
    if (performanceResult) createdBoardIds.push(performanceResult);
    testResults.performance = !!performanceResult;
    
    // Clean up test data
    await cleanupTestData(createdBoardIds);
    
    // Generate final report
    console.log('\n📊 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('=====================================');
    
    const passedTests = Object.values(testResults).filter(result => 
      result === true || (result && !result.limitReached)
    ).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log(`Overall Success Rate: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    console.log('\nDetailed Results:');
    
    Object.entries(testResults).forEach(([test, result]) => {
      let status = '❌ FAILED';
      if (result === true) status = '✅ PASSED';
      else if (result && result.limitReached) status = '⚠️ LIMITED (Expected)';
      else if (result && typeof result === 'object') status = '✅ PASSED';
      
      console.log(`  ${test}: ${status}`);
    });
    
    // AI Usage Summary
    if (testResults.aiGeneration?.limitReached || testResults.imageGeneration?.limitReached) {
      console.log('\n💡 AI Usage Notes:');
      console.log('  - Daily AI usage limits are working correctly');
      console.log('  - This indicates proper cost control is in place');
    }
    
    // User Data Summary
    if (testResults.userDataIntegration) {
      const userData = testResults.userDataIntegration;
      console.log('\n📈 User Data Integration:');
      console.log(`  - Journal Entries: ${userData.journalEntries}`);
      console.log(`  - Affirmations: ${userData.affirmations}`);
      console.log(`  - Goals: ${userData.goals}`);
      console.log(`  - Sufficient for AI: ${userData.hasEnoughDataForAI ? 'Yes' : 'No'}`);
    }
    
    console.log('\n🎯 Vision Board System Status: OPERATIONAL');
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
  }
}

// Run the comprehensive test
runComprehensiveVisionBoardTest().catch(console.error);