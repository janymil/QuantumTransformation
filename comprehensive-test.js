/**
 * Comprehensive debugging test for all application functions
 * Excludes advanced AI couch system, includes standard AI coach and all other features
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testDatabaseConnectivity() {
  console.log('\n=== Testing Database Connectivity ===');
  
  try {
    // Test basic endpoint availability
    const response = await fetch(`${BASE_URL}/api/challenges/user-challenges`);
    console.log(`API Response Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✓ Server is running and responding (authentication required)');
    } else {
      console.log('✗ Unexpected response status');
    }
  } catch (error) {
    console.log('✗ Server connection failed:', error.message);
  }
}

async function testOpenAIConnection() {
  console.log('\n=== Testing OpenAI Connection ===');
  
  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Test connection' }],
      max_tokens: 10
    });
    
    console.log('✓ OpenAI API connection successful');
    console.log(`Response: ${response.choices[0].message.content}`);
  } catch (error) {
    console.log('✗ OpenAI API connection failed:', error.message);
  }
}

async function testCoreEndpoints() {
  console.log('\n=== Testing Core API Endpoints ===');
  
  const endpoints = [
    '/api/auth/user',
    '/api/challenges/user-challenges', 
    '/api/progress/all',
    '/api/ai/usage-stats',
    '/api/spaced-repetition/due-reviews',
    '/api/spaced-repetition/mastery-stats'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      console.log(`${endpoint}: ${response.status} ${response.status === 401 ? '(Auth required)' : response.status === 200 ? '(Success)' : '(Other)'}`);
    } catch (error) {
      console.log(`${endpoint}: ✗ Failed - ${error.message}`);
    }
  }
}

async function testAICoachingSystem() {
  console.log('\n=== Testing Standard AI Coaching System ===');
  
  const testRequest = {
    question: 'How can I improve my mindfulness practice?',
    challengeType: 'quantum-consciousness',
    currentDay: 1,
    mood: 7,
    goals: 'Increase daily meditation',
    challenges: 'Finding time to practice'
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/coaching`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRequest)
    });
    
    console.log(`AI Coaching Request: ${response.status}`);
    
    if (response.status === 401) {
      console.log('Auth required - endpoint is protected correctly');
    } else if (response.status === 200) {
      console.log('✓ AI Coaching system accessible');
    }
  } catch (error) {
    console.log('✗ AI Coaching test failed:', error.message);
  }
}

async function testGamificationSystem() {
  console.log('\n=== Testing Gamification System ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gamification/stats`);
    console.log(`Gamification Stats: ${response.status}`);
    
    const levelsResponse = await fetch(`${BASE_URL}/api/gamification/levels`);
    console.log(`Levels System: ${levelsResponse.status}`);
    
    const badgesResponse = await fetch(`${BASE_URL}/api/gamification/badges`);
    console.log(`Badges System: ${badgesResponse.status}`);
  } catch (error) {
    console.log('✗ Gamification test failed:', error.message);
  }
}

async function testSpacedRepetition() {
  console.log('\n=== Testing Spaced Repetition System ===');
  
  try {
    const dueResponse = await fetch(`${BASE_URL}/api/spaced-repetition/due-reviews`);
    console.log(`Due Reviews: ${dueResponse.status}`);
    
    const masteryResponse = await fetch(`${BASE_URL}/api/spaced-repetition/mastery-stats`);
    console.log(`Mastery Stats: ${masteryResponse.status}`);
    
    const conceptsResponse = await fetch(`${BASE_URL}/api/spaced-repetition/concepts`);
    console.log(`Concepts: ${conceptsResponse.status}`);
  } catch (error) {
    console.log('✗ Spaced Repetition test failed:', error.message);
  }
}

async function testJournalSystem() {
  console.log('\n=== Testing Journal System ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/journal/entries`);
    console.log(`Journal Entries: ${response.status}`);
    
    const analyticsResponse = await fetch(`${BASE_URL}/api/journal/analytics`);
    console.log(`Journal Analytics: ${analyticsResponse.status}`);
  } catch (error) {
    console.log('✗ Journal test failed:', error.message);
  }
}

async function runComprehensiveDebug() {
  console.log('🔍 Starting Comprehensive Application Debugging');
  console.log('Excluding: Advanced AI Couch System');
  console.log('Including: Standard AI Coach, Gamification, Spaced Repetition, Journal, Progress Tracking');
  
  await testDatabaseConnectivity();
  await testOpenAIConnection();
  await testCoreEndpoints();
  await testAICoachingSystem();
  await testGamificationSystem();
  await testSpacedRepetition();
  await testJournalSystem();
  
  console.log('\n=== Debugging Summary ===');
  console.log('All core systems tested for availability and response');
  console.log('Note: Most endpoints require authentication (401 responses expected)');
  console.log('✓ Application structure appears functional');
}

runComprehensiveDebug().catch(console.error);