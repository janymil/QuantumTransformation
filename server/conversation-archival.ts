
import { db } from './db';
import { journalingThreads, threadExchanges, aiResponseHistory } from '@shared/schema';
import { eq, and, lt, desc } from 'drizzle-orm';

interface ArchivedConversation {
  id: string;
  userId: string;
  archivedAt: string;
  threads: any[];
  exchanges: any[];
  aiResponses: any[];
  metadata: {
    totalThreads: number;
    totalExchanges: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export class ConversationArchivalService {
  private config = {
    storageZone: process.env.BUNNYCDN_STORAGE_ZONE || 'vision-board-storage',
    accessKey: process.env.BUNNYCDN_ACCESS_KEY,
    region: 'ny' // New York region
  };

  /**
   * Archive conversations older than specified months to BunnyCDN
   */
  async archiveOldConversations(userId: string, olderThanMonths: number = 6): Promise<{
    success: boolean;
    archivedFile?: string;
    conversationsArchived?: number;
    error?: string;
  }> {
    try {
      if (!this.config.accessKey) {
        throw new Error('BunnyCDN access key not configured');
      }

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - olderThanMonths);

      console.log(`Archiving conversations older than ${cutoffDate.toISOString()} for user ${userId}`);

      // Get old threads
      const oldThreads = await db
        .select()
        .from(journalingThreads)
        .where(and(
          eq(journalingThreads.userId, userId),
          lt(journalingThreads.createdAt, cutoffDate)
        ))
        .orderBy(desc(journalingThreads.createdAt));

      if (oldThreads.length === 0) {
        return {
          success: true,
          conversationsArchived: 0
        };
      }

      // Get exchanges for these threads
      const threadIds = oldThreads.map(t => t.id);
      const oldExchanges = await db
        .select()
        .from(threadExchanges)
        .where(and(
          eq(threadExchanges.userId, userId),
          lt(threadExchanges.createdAt, cutoffDate)
        ));

      // Get AI responses
      const oldAiResponses = await db
        .select()
        .from(aiResponseHistory)
        .where(and(
          eq(aiResponseHistory.userId, userId),
          lt(aiResponseHistory.createdAt, cutoffDate)
        ));

      // Create archive object
      const archiveData: ArchivedConversation = {
        id: `archive_${userId}_${Date.now()}`,
        userId,
        archivedAt: new Date().toISOString(),
        threads: oldThreads,
        exchanges: oldExchanges,
        aiResponses: oldAiResponses,
        metadata: {
          totalThreads: oldThreads.length,
          totalExchanges: oldExchanges.length,
          dateRange: {
            start: oldThreads[oldThreads.length - 1]?.createdAt?.toISOString() || '',
            end: oldThreads[0]?.createdAt?.toISOString() || ''
          }
        }
      };

      // Upload to BunnyCDN
      const filename = `archives/${userId}/${archiveData.id}.json`;
      const uploadSuccess = await this.uploadToBunnyCDN(filename, JSON.stringify(archiveData, null, 2));

      if (!uploadSuccess) {
        throw new Error('Failed to upload archive to BunnyCDN');
      }

      // Delete from database after successful upload
      await this.deleteConversationsFromDatabase(threadIds, userId);

      // Store archive record in database
      await this.storeArchiveRecord(userId, archiveData.id, filename, oldThreads.length);

      console.log(`Successfully archived ${oldThreads.length} conversations for user ${userId}`);

      return {
        success: true,
        archivedFile: filename,
        conversationsArchived: oldThreads.length
      };

    } catch (error) {
      console.error('Archival error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Restore archived conversations from BunnyCDN back to database
   */
  async restoreConversations(userId: string, archiveId: string): Promise<{
    success: boolean;
    conversationsRestored?: number;
    error?: string;
  }> {
    try {
      if (!this.config.accessKey) {
        throw new Error('BunnyCDN access key not configured');
      }

      // Get archive record
      const archiveRecord = await this.getArchiveRecord(userId, archiveId);
      if (!archiveRecord) {
        throw new Error('Archive record not found');
      }

      // Download from BunnyCDN
      const archiveData = await this.downloadFromBunnyCDN(archiveRecord.filename);
      if (!archiveData) {
        throw new Error('Failed to download archive from BunnyCDN');
      }

      const parsedData: ArchivedConversation = JSON.parse(archiveData);

      // Restore threads
      const restoredThreads = [];
      for (const thread of parsedData.threads) {
        const [restoredThread] = await db
          .insert(journalingThreads)
          .values({
            ...thread,
            id: undefined, // Let database generate new ID
            restoredAt: new Date(),
            originalId: thread.id
          })
          .returning();
        restoredThreads.push(restoredThread);
      }

      // Create ID mapping for exchanges
      const threadIdMap = new Map();
      parsedData.threads.forEach((originalThread, index) => {
        threadIdMap.set(originalThread.id, restoredThreads[index].id);
      });

      // Restore exchanges with new thread IDs
      for (const exchange of parsedData.exchanges) {
        const newThreadId = threadIdMap.get(exchange.threadId);
        if (newThreadId) {
          await db
            .insert(threadExchanges)
            .values({
              ...exchange,
              id: undefined,
              threadId: newThreadId,
              restoredAt: new Date(),
              originalId: exchange.id
            });
        }
      }

      // Restore AI responses
      for (const response of parsedData.aiResponses) {
        await db
          .insert(aiResponseHistory)
          .values({
            ...response,
            id: undefined,
            restoredAt: new Date(),
            originalId: response.id
          });
      }

      // Mark archive as restored
      await this.markArchiveAsRestored(userId, archiveId);

      console.log(`Successfully restored ${parsedData.threads.length} conversations for user ${userId}`);

      return {
        success: true,
        conversationsRestored: parsedData.threads.length
      };

    } catch (error) {
      console.error('Restoration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get list of available archives for user
   */
  async getUserArchives(userId: string): Promise<Array<{
    id: string;
    filename: string;
    conversationCount: number;
    archivedAt: string;
    isRestored: boolean;
  }>> {
    try {
      // This would need a database table to track archives
      // For now, we'll return empty array
      return [];
    } catch (error) {
      console.error('Error getting user archives:', error);
      return [];
    }
  }

  /**
   * Upload data to BunnyCDN
   */
  private async uploadToBunnyCDN(filename: string, data: string): Promise<boolean> {
    try {
      const url = `https://ny.storage.bunnycdn.com/${this.config.storageZone}/${filename}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'AccessKey': this.config.accessKey!,
          'Content-Type': 'application/json'
        },
        body: data
      });

      return response.ok;
    } catch (error) {
      console.error('BunnyCDN upload error:', error);
      return false;
    }
  }

  /**
   * Download data from BunnyCDN
   */
  private async downloadFromBunnyCDN(filename: string): Promise<string | null> {
    try {
      const url = `https://${this.config.storageZone}.b-cdn.net/${filename}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('BunnyCDN download error:', error);
      return null;
    }
  }

  /**
   * Delete conversations from database after successful archival
   */
  private async deleteConversationsFromDatabase(threadIds: number[], userId: string): Promise<void> {
    // Delete exchanges first (foreign key constraint)
    for (const threadId of threadIds) {
      await db
        .delete(threadExchanges)
        .where(eq(threadExchanges.threadId, threadId));
    }

    // Delete threads
    for (const threadId of threadIds) {
      await db
        .delete(journalingThreads)
        .where(and(
          eq(journalingThreads.id, threadId),
          eq(journalingThreads.userId, userId)
        ));
    }
  }

  /**
   * Store archive record (would need new database table)
   */
  private async storeArchiveRecord(userId: string, archiveId: string, filename: string, conversationCount: number): Promise<void> {
    // TODO: Create archive_records table and implement this
    console.log(`Archive record: ${userId} - ${archiveId} - ${filename} - ${conversationCount} conversations`);
  }

  /**
   * Get archive record (would need new database table)
   */
  private async getArchiveRecord(userId: string, archiveId: string): Promise<{ filename: string } | null> {
    // TODO: Implement with archive_records table
    return { filename: `archives/${userId}/${archiveId}.json` };
  }

  /**
   * Mark archive as restored (would need new database table)
   */
  private async markArchiveAsRestored(userId: string, archiveId: string): Promise<void> {
    // TODO: Implement with archive_records table
    console.log(`Marked archive ${archiveId} as restored for user ${userId}`);
  }
}

export const conversationArchival = new ConversationArchivalService();
