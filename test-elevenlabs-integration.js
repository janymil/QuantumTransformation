/**
 * Test ElevenLabs Integration
 * Tests voice fetching, text-to-speech generation, and cost estimation
 */

const BASE_URL = 'http://localhost:5000';

async function testElevenLabsIntegration() {
  console.log('🎵 Testing ElevenLabs Integration...\n');

  try {
    // Test 1: Get available voices
    console.log('1. Testing voice fetching...');
    const voicesResponse = await fetch(`${BASE_URL}/api/elevenlabs/voices`, {
      headers: {
        'Cookie': 'connect.sid=your-session-cookie' // You'd need actual session
      }
    });
    
    if (voicesResponse.ok) {
      const voicesData = await voicesResponse.json();
      console.log(`✅ Found ${voicesData.voices?.length || 0} voices`);
      if (voicesData.voices?.length > 0) {
        console.log(`   First voice: ${voicesData.voices[0].name} (${voicesData.voices[0].voice_id})`);
      }
    } else {
      console.log(`❌ Voice fetching failed: ${voicesResponse.status}`);
    }

    // Test 2: Cost estimation
    console.log('\n2. Testing cost estimation...');
    const testText = "I am confident and capable of achieving my financial goals.";
    const costResponse = await fetch(`${BASE_URL}/api/elevenlabs/cost-estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=your-session-cookie'
      },
      body: JSON.stringify({
        text: testText,
        voice_id: '21m00Tcm4TlvDq8ikWAM',
        subscription_tier: 'free'
      })
    });

    if (costResponse.ok) {
      const costData = await costResponse.json();
      console.log(`✅ Cost estimation successful`);
      console.log(`   Characters: ${costData.characterCount}`);
      console.log(`   Estimated cost: $${costData.estimatedCost.toFixed(4)}`);
      console.log(`   Within limit: ${costData.withinLimit ? 'Yes' : 'No'}`);
    } else {
      console.log(`❌ Cost estimation failed: ${costResponse.status}`);
    }

    // Test 3: Direct API call to ElevenLabs (to verify API key)
    console.log('\n3. Testing direct ElevenLabs API...');
    const directResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': 'sk_1fa30a342618cb1fcfee56db845ce36ed49ab8ec92926a4d'
      }
    });

    if (directResponse.ok) {
      const directData = await directResponse.json();
      console.log(`✅ Direct API call successful`);
      console.log(`   Available voices: ${directData.voices?.length || 0}`);
    } else {
      console.log(`❌ Direct API call failed: ${directResponse.status} - ${await directResponse.text()}`);
    }

    // Test 4: Text-to-speech generation (requires authentication)
    console.log('\n4. Note: Text-to-speech generation requires user authentication');
    console.log('   Use the frontend component to test audio generation');

    console.log('\n🎉 ElevenLabs integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test database schema
async function testDatabaseSchema() {
  console.log('\n📊 Testing database schema...');
  
  const { db } = await import('./server/db.js');
  const { voiceClones, affirmationAudio } = await import('./shared/schema.js');
  
  try {
    // Test voice clones table
    console.log('Testing voice_clones table...');
    const voiceResult = await db.select().from(voiceClones).limit(1);
    console.log('✅ Voice clones table accessible');

    // Test affirmation audio table
    console.log('Testing affirmation_audio table...');
    const audioResult = await db.select().from(affirmationAudio).limit(1);
    console.log('✅ Affirmation audio table accessible');

  } catch (error) {
    console.log('❌ Database schema test failed:', error.message);
    console.log('💡 Run: npm run db:push to update database schema');
  }
}

// Run tests
async function runAllTests() {
  await testElevenLabsIntegration();
  
  try {
    await testDatabaseSchema();
  } catch (error) {
    console.log('⚠️  Database tests skipped (schema not yet pushed)');
  }
}

runAllTests();