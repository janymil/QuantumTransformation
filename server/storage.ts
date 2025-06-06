import {
  users,
  userProgress,
  challengeCompletions,
  journalEntries,
  assessmentReflections,
  savedPhrases,
  userAchievements,
  aiChatSessions,
  userSettings,
  spacedRepetitionConcepts,
  spacedRepetitionReviews,
  spacedRepetitionSchedule,
  aiUsageTracking,
  visionBoards,
  type User,
  type UpsertUser,
  type UserProgress,
  type InsertUserProgress,
  type ChallengeCompletion,
  type InsertChallengeCompletion,
  type JournalEntry,
  type InsertJournalEntry,
  type AssessmentReflection,
  type InsertAssessmentReflection,
  type SavedPhrase,
  type InsertSavedPhrase,
  type UserAchievement,
  type InsertUserAchievement,
  type AiChatSession,
  type InsertAiChatSession,
  type UserSettings,
  type InsertUserSettings,
  type VisionBoard,
  type InsertVisionBoard,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Progress operations
  getUserProgress(userId: string): Promise<UserProgress | undefined>;
  getUserProgressForChallenge(userId: string, challengeType: string): Promise<UserProgress | undefined>;
  getAllUserProgress(userId: string): Promise<UserProgress[]>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(userId: string, updates: Partial<InsertUserProgress>): Promise<UserProgress>;
  updateChallengeProgress(userId: string, challengeType: string, updates: Partial<InsertUserProgress>): Promise<UserProgress>;
  
  // Challenge completion operations
  createChallengeCompletion(completion: InsertChallengeCompletion): Promise<ChallengeCompletion>;
  getUserCompletions(userId: string): Promise<ChallengeCompletion[]>;
  getDayCompletion(userId: string, day: number, challengeType?: string): Promise<ChallengeCompletion | undefined>;
  
  // Journal operations
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(userId: string, day: number, updates: Partial<InsertJournalEntry>, challengeType?: string): Promise<JournalEntry>;
  getJournalEntry(userId: string, day: number, challengeType?: string): Promise<JournalEntry | undefined>;
  getUserJournalEntries(userId: string): Promise<JournalEntry[]>;
  getJournalEntriesByChallenge(userId: string, challengeType: string): Promise<JournalEntry[]>;
  getJournalEntriesForActiveChallenges(userId: string): Promise<{ challengeType: string; entries: JournalEntry[] }[]>;
  getArchivedJournalEntries(userId: string): Promise<{ challengeType: string; entries: JournalEntry[] }[]>;
  deleteJournalEntry(userId: string, entryId: number): Promise<void>;
  
  // Saved phrases operations
  createSavedPhrase(phrase: InsertSavedPhrase): Promise<SavedPhrase>;
  getUserSavedPhrases(userId: string): Promise<SavedPhrase[]>;
  deleteSavedPhrase(userId: string, phraseId: number): Promise<void>;
  
  // Achievements operations
  createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  
  // AI chat operations
  createAiChatSession(session: InsertAiChatSession): Promise<AiChatSession>;
  getUserAiChatSessions(userId: string, day?: number): Promise<AiChatSession[]>;
  
  // Settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  
  // Multi-challenge operations
  getUserChallenges(userId: string): Promise<UserProgress[]>;
  
  // Quit challenge operations
  quitChallenge(userId: string, challengeType: string): Promise<void>;
  
  // AI Couch profile operations
  getAICouchProfile(userId: string): Promise<any>;
  updateAICouchProfile(userId: string, updates: any): Promise<any>;
  
  // Assessment reflection operations
  createAssessmentReflection(reflection: InsertAssessmentReflection): Promise<AssessmentReflection>;
  getUserAssessmentReflections(userId: string): Promise<AssessmentReflection[]>;
  getAssessmentReflectionsByType(userId: string, reflectionType: string): Promise<AssessmentReflection[]>;
  
  // Vision board operations
  createVisionBoard(visionBoard: InsertVisionBoard): Promise<VisionBoard>;
  getVisionBoards(userId: string): Promise<VisionBoard[]>;
  getVisionBoard(id: number, userId: string): Promise<VisionBoard | undefined>;
  updateVisionBoard(id: number, userId: string, updates: Partial<InsertVisionBoard>): Promise<VisionBoard | undefined>;
  deleteVisionBoard(id: number, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Progress operations
  async getUserProgress(userId: string): Promise<UserProgress | undefined> {
    // For backwards compatibility, return the most recent progress record
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .orderBy(desc(userProgress.updatedAt))
      .limit(1);
    return progress;
  }

  async getUserProgressForChallenge(userId: string, challengeType: string): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.challengeType, challengeType)));
    return progress;
  }

  async getAllUserProgress(userId: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .orderBy(desc(userProgress.updatedAt));
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [newProgress] = await db
      .insert(userProgress)
      .values(progress)
      .returning();
    return newProgress;
  }

  async updateUserProgress(userId: string, updates: Partial<InsertUserProgress>): Promise<UserProgress> {
    const [updatedProgress] = await db
      .update(userProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProgress.userId, userId))
      .returning();
    return updatedProgress;
  }

  async updateChallengeProgress(userId: string, challengeType: string, updates: Partial<InsertUserProgress>): Promise<UserProgress> {
    const [updatedProgress] = await db
      .update(userProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(userProgress.userId, userId), eq(userProgress.challengeType, challengeType)))
      .returning();
    return updatedProgress;
  }

  // Challenge completion operations
  async createChallengeCompletion(completion: InsertChallengeCompletion): Promise<ChallengeCompletion> {
    const [newCompletion] = await db
      .insert(challengeCompletions)
      .values(completion)
      .returning();
    return newCompletion;
  }

  async getUserCompletions(userId: string): Promise<ChallengeCompletion[]> {
    return await db
      .select()
      .from(challengeCompletions)
      .where(eq(challengeCompletions.userId, userId))
      .orderBy(desc(challengeCompletions.day));
  }

  async getDayCompletion(userId: string, day: number, challengeType?: string): Promise<ChallengeCompletion | undefined> {
    const conditions = [
      eq(challengeCompletions.userId, userId),
      eq(challengeCompletions.day, day)
    ];
    
    if (challengeType) {
      conditions.push(eq(challengeCompletions.challengeType, challengeType));
    }
    
    const [completion] = await db
      .select()
      .from(challengeCompletions)
      .where(and(...conditions));
    return completion;
  }

  // Journal operations
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [newEntry] = await db
      .insert(journalEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async updateJournalEntry(userId: string, day: number, updates: Partial<InsertJournalEntry>, challengeType?: string): Promise<JournalEntry> {
    const conditions = [
      eq(journalEntries.userId, userId),
      eq(journalEntries.day, day)
    ];
    
    if (challengeType) {
      conditions.push(eq(journalEntries.challengeType, challengeType));
    }
    
    const [updatedEntry] = await db
      .update(journalEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(...conditions))
      .returning();
    return updatedEntry;
  }

  async getJournalEntry(userId: string, day: number, challengeType?: string): Promise<JournalEntry | undefined> {
    // Validate input parameters to prevent database errors
    if (!userId || isNaN(day) || day < 1) {
      console.error(`Invalid parameters for getJournalEntry: userId=${userId}, day=${day}, challengeType=${challengeType}`);
      return undefined;
    }
    
    const conditions = [
      eq(journalEntries.userId, userId),
      eq(journalEntries.day, day)
    ];
    
    if (challengeType && challengeType !== 'undefined') {
      conditions.push(eq(journalEntries.challengeType, challengeType));
    }
    
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(and(...conditions));
    
    return entry;
  }

  async getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.day));
  }

  async getJournalEntriesByChallenge(userId: string, challengeType: string): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.challengeType, challengeType)
      ))
      .orderBy(desc(journalEntries.day));
  }

  async getJournalEntriesForActiveChallenges(userId: string): Promise<{ challengeType: string; entries: JournalEntry[] }[]> {
    // Get unique active challenge types
    const activeChallenges = await db
      .selectDistinct({ challengeType: userProgress.challengeType })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    
    const result = [];
    for (const challenge of activeChallenges) {
      const entries = await this.getJournalEntriesByChallenge(userId, challenge.challengeType);
      if (entries.length > 0) {
        result.push({
          challengeType: challenge.challengeType,
          entries
        });
      }
    }
    return result;
  }

  async getArchivedJournalEntries(userId: string): Promise<{ challengeType: string; entries: JournalEntry[] }[]> {
    // Get all journal entries
    const allEntries = await this.getUserJournalEntries(userId);
    
    // Get active challenge types
    const activeChallenges = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    
    const activeChallengeTypes = new Set(activeChallenges.map(p => p.challengeType));
    
    // Group archived entries by challenge type
    const archivedByType = new Map<string, JournalEntry[]>();
    
    for (const entry of allEntries) {
      if (!activeChallengeTypes.has(entry.challengeType)) {
        if (!archivedByType.has(entry.challengeType)) {
          archivedByType.set(entry.challengeType, []);
        }
        archivedByType.get(entry.challengeType)!.push(entry);
      }
    }
    
    return Array.from(archivedByType.entries()).map(([challengeType, entries]) => ({
      challengeType,
      entries
    }));
  }

  async deleteJournalEntry(userId: string, entryId: number): Promise<void> {
    await db
      .delete(journalEntries)
      .where(and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.id, entryId)
      ));
  }

  // Saved phrases operations
  async createSavedPhrase(phrase: InsertSavedPhrase): Promise<SavedPhrase> {
    const [newPhrase] = await db
      .insert(savedPhrases)
      .values(phrase)
      .returning();
    return newPhrase;
  }

  async getUserSavedPhrases(userId: string): Promise<SavedPhrase[]> {
    return await db
      .select()
      .from(savedPhrases)
      .where(eq(savedPhrases.userId, userId))
      .orderBy(desc(savedPhrases.createdAt));
  }

  async deleteSavedPhrase(userId: string, phraseId: number): Promise<void> {
    await db
      .delete(savedPhrases)
      .where(and(
        eq(savedPhrases.userId, userId),
        eq(savedPhrases.id, phraseId)
      ));
  }

  // Achievements operations
  async createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const [newAchievement] = await db
      .insert(userAchievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));
  }

  // AI chat operations
  async createAiChatSession(session: InsertAiChatSession): Promise<AiChatSession> {
    const [newSession] = await db
      .insert(aiChatSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getUserAiChatSessions(userId: string, day?: number): Promise<AiChatSession[]> {
    const conditions = [eq(aiChatSessions.userId, userId)];
    if (day !== undefined) {
      conditions.push(eq(aiChatSessions.day, day));
    }
    
    return await db
      .select()
      .from(aiChatSessions)
      .where(and(...conditions))
      .orderBy(desc(aiChatSessions.createdAt));
  }

  // Settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(userId: string, settingsData: Partial<InsertUserSettings>): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values({ userId, ...settingsData })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...settingsData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return settings;
  }

  // Multi-challenge operations
  async getUserChallenges(userId: string): Promise<UserProgress[]> {
    const challenges = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .orderBy(userProgress.createdAt);
    return challenges;
  }

  async quitChallenge(userId: string, challengeType: string): Promise<void> {
    // Delete all data related to this specific challenge for the user
    await db.transaction(async (tx) => {
      // Delete user progress for this challenge
      await tx.delete(userProgress)
        .where(and(
          eq(userProgress.userId, userId),
          eq(userProgress.challengeType, challengeType)
        ));

      // Delete challenge completions for this challenge
      await tx.delete(challengeCompletions)
        .where(and(
          eq(challengeCompletions.userId, userId),
          eq(challengeCompletions.challengeType, challengeType)
        ));

      // Delete journal entries for this challenge
      await tx.delete(journalEntries)
        .where(and(
          eq(journalEntries.userId, userId),
          eq(journalEntries.challengeType, challengeType)
        ));

      // Delete spaced repetition schedule for this challenge
      await tx.delete(spacedRepetitionSchedule)
        .where(and(
          eq(spacedRepetitionSchedule.userId, userId),
          eq(spacedRepetitionSchedule.challengeType, challengeType)
        ));

      // Delete spaced repetition concepts for this challenge
      await tx.delete(spacedRepetitionConcepts)
        .where(and(
          eq(spacedRepetitionConcepts.userId, userId),
          eq(spacedRepetitionConcepts.challengeType, challengeType)
        ));
    });
  }

  // AI Couch profile operations
  async getAICouchProfile(userId: string): Promise<any> {
    try {
      // Import schema on demand to avoid circular dependencies
      const { aiCouchProfiles } = await import("@shared/schema");
      
      const [profile] = await db
        .select()
        .from(aiCouchProfiles)
        .where(eq(aiCouchProfiles.userId, userId))
        .limit(1);
      
      return profile;
    } catch (error) {
      console.error("Error getting AI Couch profile:", error);
      return null;
    }
  }

  async updateAICouchProfile(userId: string, updates: any): Promise<any> {
    try {
      // Import schema on demand to avoid circular dependencies
      const { aiCouchProfiles } = await import("@shared/schema");
      
      const [profile] = await db
        .update(aiCouchProfiles)
        .set({
          ...updates,
          lastUpdated: new Date()
        })
        .where(eq(aiCouchProfiles.userId, userId))
        .returning();
      
      return profile;
    } catch (error) {
      console.error("Error updating AI Couch profile:", error);
      throw error;
    }
  }

  // Get all users for admin management
  async getAllUsers(): Promise<any[]> {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          isBlocked: sql<boolean>`false`,
          blockReason: sql<string>`null`,
          blockedAt: sql<Date>`null`,
          // User activity metrics
          totalChallenges: sql<number>`COUNT(DISTINCT user_progress.challenge_type)`,
          totalJournalEntries: sql<number>`COUNT(DISTINCT journal_entries.id)`,
          totalAffirmations: sql<number>`COUNT(DISTINCT saved_phrases.id)`,
          totalAIInteractions: sql<number>`COUNT(DISTINCT ai_usage_tracking.id)`,
          lastActivity: sql<Date>`MAX(GREATEST(
            COALESCE(user_progress.updated_at, '1970-01-01'::timestamp),
            COALESCE(journal_entries.created_at, '1970-01-01'::timestamp),
            COALESCE(ai_usage_tracking.created_at, '1970-01-01'::timestamp)
          ))`
        })
        .from(users)
        .leftJoin(userProgress, eq(userProgress.userId, users.id))
        .leftJoin(journalEntries, eq(journalEntries.userId, users.id))
        .leftJoin(savedPhrases, eq(savedPhrases.userId, users.id))
        .leftJoin(aiUsageTracking, eq(aiUsageTracking.userId, users.id))
        .groupBy(
          users.id,
          users.email,
          users.firstName,
          users.lastName,
          users.profileImageUrl,
          users.createdAt,
          users.updatedAt
        )
        .orderBy(desc(users.createdAt));

      return allUsers;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Update user details
  async updateUser(userId: string, updates: Partial<{
    firstName: string;
    lastName: string;
    email: string;
  }>): Promise<any> {
    try {
      const updatedUser = await db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Block user access (simplified without blocked_users table)
  async blockUser(userId: string, reason: string, adminId: string): Promise<void> {
    try {
      // For now, we'll just log the block action
      console.log(`User ${userId} blocked by ${adminId} for reason: ${reason}`);
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  // Unblock user access
  async unblockUser(userId: string): Promise<void> {
    try {
      // For now, we'll just log the unblock action
      console.log(`User ${userId} unblocked`);
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  // Delete user and all associated data
  async deleteUser(userId: string): Promise<void> {
    try {
      // Delete in order due to foreign key constraints
      await db.delete(aiUsageTracking).where(eq(aiUsageTracking.userId, userId));
      await db.delete(savedPhrases).where(eq(savedPhrases.userId, userId));
      await db.delete(journalEntries).where(eq(journalEntries.userId, userId));
      await db.delete(userProgress).where(eq(userProgress.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Assessment reflection operations
  async createAssessmentReflection(reflection: InsertAssessmentReflection): Promise<AssessmentReflection> {
    try {
      const [newReflection] = await db.insert(assessmentReflections).values(reflection).returning();
      return newReflection;
    } catch (error) {
      console.error('Error creating assessment reflection:', error);
      throw error;
    }
  }

  async getUserAssessmentReflections(userId: string): Promise<AssessmentReflection[]> {
    try {
      return await db
        .select()
        .from(assessmentReflections)
        .where(eq(assessmentReflections.userId, userId))
        .orderBy(desc(assessmentReflections.createdAt));
    } catch (error) {
      console.error('Error getting user assessment reflections:', error);
      throw error;
    }
  }

  async getAssessmentReflectionsByType(userId: string, reflectionType: string): Promise<AssessmentReflection[]> {
    try {
      return await db
        .select()
        .from(assessmentReflections)
        .where(and(
          eq(assessmentReflections.userId, userId),
          eq(assessmentReflections.reflectionType, reflectionType)
        ))
        .orderBy(desc(assessmentReflections.createdAt));
    } catch (error) {
      console.error('Error getting assessment reflections by type:', error);
      throw error;
    }
  }

  async getUserStatistics(): Promise<any> {
    try {
      // Get total users count
      const totalUsers = await db
        .select({ count: sql`COUNT(*)` })
        .from(users);

      // Get user registration stats by month
      const userRegistrations = await db
        .select({
          month: sql`TO_CHAR(created_at, 'YYYY-MM')`,
          count: sql`COUNT(*)`
        })
        .from(users)
        .groupBy(sql`TO_CHAR(created_at, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(created_at, 'YYYY-MM') DESC`)
        .limit(12);

      // Get active users (users with any progress)
      const activeUsers = await db
        .select({ count: sql`COUNT(DISTINCT user_id)` })
        .from(userProgress);

      // Get challenge participation stats
      const challengeParticipation = await db
        .select({
          challengeType: userProgress.challengeType,
          userCount: sql`COUNT(DISTINCT user_id)`,
          avgProgress: sql`AVG(current_day)`,
          completionRate: sql`AVG(CASE WHEN jsonb_array_length(completed_days) >= 21 THEN 1 ELSE 0 END) * 100`
        })
        .from(userProgress)
        .groupBy(userProgress.challengeType)
        .orderBy(sql`COUNT(DISTINCT user_id) DESC`);

      // Get journal activity stats
      const journalStats = await db
        .select({
          totalEntries: sql`COUNT(*)`,
          activeJournalers: sql`COUNT(DISTINCT user_id)`,
          avgMood: sql`AVG(mood)`,
          avgEnergy: sql`AVG(energy)`
        })
        .from(journalEntries);

      // Get day completion statistics
      const dayCompletions = await db
        .select({
          challengeType: userProgress.challengeType,
          totalDaysCompleted: sql`SUM(jsonb_array_length(completed_days))`,
          avgCompletedDays: sql`AVG(jsonb_array_length(completed_days))`,
          userCount: sql`COUNT(DISTINCT user_id)`
        })
        .from(userProgress)
        .groupBy(userProgress.challengeType);

      // Get user retention data (users who completed at least 7 days)
      const retentionStats = await db
        .select({
          sevenDayRetention: sql`COUNT(CASE WHEN jsonb_array_length(completed_days) >= 7 THEN 1 END)`,
          fourteenDayRetention: sql`COUNT(CASE WHEN jsonb_array_length(completed_days) >= 14 THEN 1 END)`,
          twentyOneDayRetention: sql`COUNT(CASE WHEN jsonb_array_length(completed_days) >= 21 THEN 1 END)`,
          totalActiveUsers: sql`COUNT(*)`
        })
        .from(userProgress);

      // Get user streak statistics
      const streakStats = await db
        .select({
          avgStreak: sql`AVG(streak_count)`,
          maxStreak: sql`MAX(streak_count)`,
          usersWithStreaks: sql`COUNT(CASE WHEN streak_count > 0 THEN 1 END)`
        })
        .from(userProgress);

      // Get most popular challenge types
      const popularChallenges = await db
        .select({
          challengeType: userProgress.challengeType,
          participants: sql`COUNT(DISTINCT user_id)`,
          avgCurrentDay: sql`AVG(current_day)`,
          totalDaysCompleted: sql`SUM(jsonb_array_length(completed_days))`
        })
        .from(userProgress)
        .groupBy(userProgress.challengeType)
        .orderBy(sql`COUNT(DISTINCT user_id) DESC`)
        .limit(10);

      return {
        userOverview: {
          totalUsers: Number(totalUsers[0]?.count) || 0,
          activeUsers: Number(activeUsers[0]?.count) || 0,
          activationRate: totalUsers[0]?.count ? 
            ((Number(activeUsers[0]?.count) / Number(totalUsers[0]?.count)) * 100).toFixed(1) : 0
        },
        userRegistrations: userRegistrations.map(reg => ({
          month: reg.month,
          count: Number(reg.count)
        })),
        challengeMetrics: {
          totalChallengeParticipations: challengeParticipation.reduce((sum, ch) => sum + Number(ch.userCount), 0),
          avgProgressPerUser: challengeParticipation.length > 0 ? 
            (challengeParticipation.reduce((sum, ch) => sum + Number(ch.avgProgress), 0) / challengeParticipation.length).toFixed(1) : 0,
          overallCompletionRate: challengeParticipation.length > 0 ? 
            (challengeParticipation.reduce((sum, ch) => sum + Number(ch.completionRate), 0) / challengeParticipation.length).toFixed(1) : 0
        },
        challengeParticipation: challengeParticipation.map(ch => ({
          challengeType: ch.challengeType,
          userCount: Number(ch.userCount),
          avgProgress: Number(ch.avgProgress).toFixed(1),
          completionRate: Number(ch.completionRate).toFixed(1)
        })),
        journalActivity: {
          totalEntries: Number(journalStats[0]?.totalEntries) || 0,
          activeJournalers: Number(journalStats[0]?.activeJournalers) || 0,
          avgMood: Number(journalStats[0]?.avgMood).toFixed(1) || 0,
          avgEnergy: Number(journalStats[0]?.avgEnergy).toFixed(1) || 0
        },
        dayCompletions: dayCompletions.map(dc => ({
          challengeType: dc.challengeType,
          totalDaysCompleted: Number(dc.totalDaysCompleted) || 0,
          avgCompletedDays: Number(dc.avgCompletedDays).toFixed(1),
          userCount: Number(dc.userCount)
        })),
        retentionMetrics: {
          sevenDayRetention: retentionStats[0] ? 
            ((Number(retentionStats[0].sevenDayRetention) / Number(retentionStats[0].totalActiveUsers)) * 100).toFixed(1) : 0,
          fourteenDayRetention: retentionStats[0] ? 
            ((Number(retentionStats[0].fourteenDayRetention) / Number(retentionStats[0].totalActiveUsers)) * 100).toFixed(1) : 0,
          twentyOneDayRetention: retentionStats[0] ? 
            ((Number(retentionStats[0].twentyOneDayRetention) / Number(retentionStats[0].totalActiveUsers)) * 100).toFixed(1) : 0
        },
        streakMetrics: {
          avgStreak: Number(streakStats[0]?.avgStreak).toFixed(1) || 0,
          maxStreak: Number(streakStats[0]?.maxStreak) || 0,
          usersWithStreaks: Number(streakStats[0]?.usersWithStreaks) || 0
        },
        popularChallenges: popularChallenges.map(pc => ({
          challengeType: pc.challengeType,
          participants: Number(pc.participants),
          avgCurrentDay: Number(pc.avgCurrentDay).toFixed(1),
          totalDaysCompleted: Number(pc.totalDaysCompleted) || 0
        }))
      };
    } catch (error) {
      console.error("Error getting user statistics:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
