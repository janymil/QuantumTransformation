import {
  users,
  userProgress,
  challengeCompletions,
  journalEntries,
  savedPhrases,
  userAchievements,
  aiChatSessions,
  userSettings,
  spacedRepetitionConcepts,
  spacedRepetitionReviews,
  spacedRepetitionSchedule,
  type User,
  type UpsertUser,
  type UserProgress,
  type InsertUserProgress,
  type ChallengeCompletion,
  type InsertChallengeCompletion,
  type JournalEntry,
  type InsertJournalEntry,
  type SavedPhrase,
  type InsertSavedPhrase,
  type UserAchievement,
  type InsertUserAchievement,
  type AiChatSession,
  type InsertAiChatSession,
  type UserSettings,
  type InsertUserSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
