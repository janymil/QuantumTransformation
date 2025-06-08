// Debug script to test therapeutic chat sessions endpoint
const fetch = require('node:fetch');

async function testSessions() {
  try {
    // Test with authenticated request (assuming user is logged in)
    const response = await fetch('http://localhost:5000/api/therapeutic-chat/sessions', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    // Also test database directly
    const { db } = require('./server/db');
    const { journalingThreads, threadExchanges } = require('./shared/schema');
    const { eq, and, desc, sql } = require('drizzle-orm');
    
    console.log('\n--- Direct database query ---');
    const sessions = await db
      .select({
        id: journalingThreads.id,
        title: journalingThreads.title,
        threadType: journalingThreads.threadType,
        lastActivity: journalingThreads.updatedAt,
        entriesCount: sql`count(${threadExchanges.id})`.as('entriesCount')
      })
      .from(journalingThreads)
      .leftJoin(threadExchanges, eq(journalingThreads.id, threadExchanges.threadId))
      .where(and(
        eq(journalingThreads.userId, '43272767'),
        eq(journalingThreads.threadType, 'therapy_session')
      ))
      .groupBy(journalingThreads.id)
      .orderBy(desc(journalingThreads.updatedAt))
      .limit(20);
    
    console.log('Database results:', JSON.stringify(sessions, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

testSessions();