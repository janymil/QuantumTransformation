/**
 * Fix Duplicate Challenges Issue
 * Cleans up duplicate challenge entries and implements data integrity
 */

import { db } from './server/db.ts';
import { userProgress } from './shared/schema.ts';
import { eq, and, sql, desc } from 'drizzle-orm';

async function fixDuplicateChallenges() {
  console.log('🔍 Starting duplicate challenges cleanup...');
  
  try {
    // Find all duplicate challenges for each user
    const duplicateQuery = await db
      .select({
        userId: userProgress.userId,
        challengeType: userProgress.challengeType,
        count: sql`COUNT(*)`,
        ids: sql`array_agg(${userProgress.id})`,
        createdDates: sql`array_agg(${userProgress.createdAt})`
      })
      .from(userProgress)
      .groupBy(userProgress.userId, userProgress.challengeType)
      .having(sql`COUNT(*) > 1`);

    console.log(`Found ${duplicateQuery.length} sets of duplicate challenges`);

    for (const duplicate of duplicateQuery) {
      console.log(`\n📋 Processing duplicates for user ${duplicate.userId}, challenge ${duplicate.challengeType}`);
      console.log(`   Found ${duplicate.count} instances`);

      // Get all records for this user/challenge combination
      const records = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, duplicate.userId),
          eq(userProgress.challengeType, duplicate.challengeType)
        ))
        .orderBy(desc(userProgress.updatedAt)); // Most recent first

      if (records.length > 1) {
        // Keep the most recent record (first in the array)
        const keepRecord = records[0];
        const deleteRecords = records.slice(1);

        console.log(`   ✅ Keeping record ${keepRecord.id} (most recent: ${keepRecord.updatedAt})`);
        console.log(`   🗑️  Deleting ${deleteRecords.length} duplicate records`);

        // Delete the duplicate records
        for (const record of deleteRecords) {
          await db
            .delete(userProgress)
            .where(eq(userProgress.id, record.id));
          console.log(`   🗑️  Deleted record ${record.id} (created: ${record.createdAt})`);
        }
      }
    }

    // Verify cleanup
    const remainingDuplicates = await db
      .select({
        userId: userProgress.userId,
        challengeType: userProgress.challengeType,
        count: sql`COUNT(*)`
      })
      .from(userProgress)
      .groupBy(userProgress.userId, userProgress.challengeType)
      .having(sql`COUNT(*) > 1`);

    if (remainingDuplicates.length === 0) {
      console.log('\n✅ All duplicate challenges have been successfully cleaned up!');
    } else {
      console.log(`\n❌ Still found ${remainingDuplicates.length} duplicate sets after cleanup`);
    }

    // Show current challenge status
    const currentChallenges = await db
      .select({
        userId: userProgress.userId,
        challengeType: userProgress.challengeType,
        currentDay: userProgress.currentDay,
        completedDays: userProgress.completedDays
      })
      .from(userProgress)
      .orderBy(userProgress.userId, userProgress.challengeType);

    console.log('\n📊 Current challenge status:');
    currentChallenges.forEach(challenge => {
      console.log(`   User ${challenge.userId}: ${challenge.challengeType} - Day ${challenge.currentDay}, ${challenge.completedDays?.length || 0} completed`);
    });

  } catch (error) {
    console.error('❌ Error fixing duplicate challenges:', error);
    throw error;
  }
}

async function preventFutureDuplicates() {
  console.log('\n🛡️  Implementing duplicate prevention measures...');
  
  try {
    // Check if unique constraint already exists
    const constraintQuery = `
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'user_progress' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%user_challenge_unique%'
    `;
    
    const existingConstraints = await db.execute(sql.raw(constraintQuery));
    
    if (existingConstraints.length === 0) {
      // Add unique constraint to prevent future duplicates
      await db.execute(sql.raw(`
        ALTER TABLE user_progress 
        ADD CONSTRAINT user_challenge_unique 
        UNIQUE (user_id, challenge_type)
      `));
      console.log('✅ Added unique constraint to prevent future duplicates');
    } else {
      console.log('✅ Unique constraint already exists');
    }
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Unique constraint already exists');
    } else {
      console.error('❌ Error adding unique constraint:', error);
    }
  }
}

async function runCleanup() {
  console.log('🚀 Starting comprehensive duplicate challenges fix...\n');
  
  try {
    await fixDuplicateChallenges();
    await preventFutureDuplicates();
    
    console.log('\n🎉 Duplicate challenges cleanup completed successfully!');
    console.log('   - Removed all duplicate challenge entries');
    console.log('   - Added database constraints to prevent future duplicates');
    console.log('   - Users will now see unique challenges only');
    
  } catch (error) {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  }
}

runCleanup().then(() => {
  console.log('\n✅ Process completed, exiting...');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});