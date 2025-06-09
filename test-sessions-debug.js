/**
 * Test Sessions Debug Script
 * Tests the therapeutic chat sessions endpoint to debug why saved conversations aren't appearing
 */

async function testSessionsEndpoint() {
  try {
    // Test direct sessions endpoint call
    const response = await fetch('http://localhost:5000/api/therapeutic-chat/sessions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    console.log('Sessions response status:', response.status);
    console.log('Sessions response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const sessions = await response.json();
      console.log('Sessions data:', sessions);
      console.log('Number of sessions:', sessions.length);
    } else {
      const error = await response.text();
      console.log('Sessions error:', error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testSessionsEndpoint();