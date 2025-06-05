import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  serial,
  integer,
  boolean,
  date,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User progress tracking - supports multiple challenges per user
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeType: varchar("challenge_type").default("general_quantum").notNull(),
  currentDay: integer("current_day").default(1),
  completedDays: jsonb("completed_days").default([]),
  streakCount: integer("streak_count").default(0),
  lastActivityDate: date("last_activity_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily challenge completions
export const challengeCompletions = pgTable("challenge_completions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeType: varchar("challenge_type").default("general_quantum").notNull(),
  day: integer("day").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
  timeSpent: integer("time_spent"), // in minutes
  rating: integer("rating"), // 1-5 stars
});

// Journal entries
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeType: varchar("challenge_type").default("general_quantum").notNull(),
  day: integer("day").notNull(),
  experience: text("experience"),
  insights: text("insights"),
  intention: text("intention"),
  mood: integer("mood"), // 1-10 scale
  energy: integer("energy"), // 1-10 scale
  challenges: text("challenges"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Saved phrases/quotes
export const savedPhrases = pgTable("saved_phrases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  phrase: text("phrase").notNull(),
  source: varchar("source"), // e.g., "Day 5 - Emotional Coherence"
  category: varchar("category"), // e.g., "affirmation", "insight", "quote"
  createdAt: timestamp("created_at").defaultNow(),
});

// User achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: varchar("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// AI chat sessions
export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  day: integer("day"),
  question: text("question").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User preferences and settings
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  reminderTime: varchar("reminder_time"), // e.g., "09:00"
  timezone: varchar("timezone").default("UTC"),
  emailNotifications: boolean("email_notifications").default(true),
  soundEnabled: boolean("sound_enabled").default(true),
  theme: varchar("theme").default("light"),
  preferredPracticeTime: varchar("preferred_practice_time").default("morning"),
  difficultyLevel: varchar("difficulty_level").default("beginner"),
  reminderEnabled: boolean("reminder_enabled").default(true),
  userGoals: text("user_goals"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Spaced Repetition System Tables
export const spacedRepetitionConcepts = pgTable("spaced_repetition_concepts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeType: varchar("challenge_type").notNull(),
  conceptKey: varchar("concept_key").notNull(), // e.g., "day_1_meditation", "visualization_technique_1"
  conceptTitle: varchar("concept_title").notNull(),
  conceptContent: text("concept_content").notNull(),
  difficultyLevel: integer("difficulty_level").default(1), // 1-5 scale
  sourceDay: integer("source_day").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const spacedRepetitionReviews = pgTable("spaced_repetition_reviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  conceptId: integer("concept_id").notNull().references(() => spacedRepetitionConcepts.id),
  reviewDate: timestamp("review_date").notNull(),
  nextReviewDate: timestamp("next_review_date").notNull(),
  interval: integer("interval").notNull(), // Days until next review
  easinessFactor: real("easiness_factor").default(2.5), // SM-2 algorithm factor
  repetitionNumber: integer("repetition_number").default(0),
  quality: integer("quality"), // 0-5 scale (user's recall quality)
  responseTime: integer("response_time"), // Seconds taken to recall
  wasSuccessful: boolean("was_successful"),
  reviewType: varchar("review_type").default("scheduled"), // scheduled, manual, triggered
  createdAt: timestamp("created_at").defaultNow(),
});

export const spacedRepetitionSchedule = pgTable("spaced_repetition_schedule", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  conceptId: integer("concept_id").notNull().references(() => spacedRepetitionConcepts.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  isCompleted: boolean("is_completed").default(false),
  priority: integer("priority").default(1), // 1-5 scale
  challengeType: varchar("challenge_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertUserProgress = typeof userProgress.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;

export type InsertChallengeCompletion = typeof challengeCompletions.$inferInsert;
export type ChallengeCompletion = typeof challengeCompletions.$inferSelect;

export type InsertJournalEntry = typeof journalEntries.$inferInsert;
export type JournalEntry = typeof journalEntries.$inferSelect;

export type InsertSavedPhrase = typeof savedPhrases.$inferInsert;
export type SavedPhrase = typeof savedPhrases.$inferSelect;

export type InsertUserAchievement = typeof userAchievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertAiChatSession = typeof aiChatSessions.$inferInsert;
export type AiChatSession = typeof aiChatSessions.$inferSelect;

export type InsertUserSettings = typeof userSettings.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;

export type InsertSpacedRepetitionConcept = typeof spacedRepetitionConcepts.$inferInsert;
export type SpacedRepetitionConcept = typeof spacedRepetitionConcepts.$inferSelect;

export type InsertSpacedRepetitionReview = typeof spacedRepetitionReviews.$inferInsert;
export type SpacedRepetitionReview = typeof spacedRepetitionReviews.$inferSelect;

export type InsertSpacedRepetitionSchedule = typeof spacedRepetitionSchedule.$inferInsert;
export type SpacedRepetitionSchedule = typeof spacedRepetitionSchedule.$inferSelect;

// Gamification and Micro-Learning System
export const userLevels = pgTable("user_levels", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeType: varchar("challenge_type").notNull(),
  level: integer("level").default(1),
  totalPoints: integer("total_points").default(0),
  currentLevelPoints: integer("current_level_points").default(0),
  pointsToNextLevel: integer("points_to_next_level").default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("user_challenge_level_idx").on(table.userId, table.challengeType)
]);

export const microLearningActivities = pgTable("micro_learning_activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeType: varchar("challenge_type").notNull(),
  day: integer("day").notNull(),
  activityType: varchar("activity_type").notNull(), // 'morning_practice', 'daytime_practice', 'evening_practice', 'journal_entry', 'video_watched', 'affirmation_saved', 'insight_mastered', 'quiz_completed'
  activityData: jsonb("activity_data"), // Store specific activity details
  pointsEarned: integer("points_earned").default(0),
  timeSpent: integer("time_spent"), // in seconds
  completedAt: timestamp("completed_at").defaultNow(),
});

export const learningBadges = pgTable("learning_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeType: varchar("challenge_type").notNull(),
  badgeType: varchar("badge_type").notNull(), // 'streak_master', 'early_bird', 'night_owl', 'knowledge_seeker', 'practice_master', 'insight_collector'
  badgeName: varchar("badge_name").notNull(),
  description: text("description"),
  iconUrl: varchar("icon_url"),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const dailyStreaks = pgTable("daily_streaks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeType: varchar("challenge_type").notNull(),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivityDate: date("last_activity_date"),
  streakMultiplier: real("streak_multiplier").default(1.0), // Points multiplier based on streak
}, (table) => [
  uniqueIndex("user_challenge_streak_idx").on(table.userId, table.challengeType)
]);

export const knowledgeQuizzes = pgTable("knowledge_quizzes", {
  id: serial("id").primaryKey(),
  challengeType: varchar("challenge_type").notNull(),
  day: integer("day").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of answer options
  correctAnswer: integer("correct_answer").notNull(), // Index of correct option
  explanation: text("explanation"),
  points: integer("points").default(10),
  difficulty: varchar("difficulty").default("medium"), // easy, medium, hard
});

export const userQuizResults = pgTable("user_quiz_results", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  quizId: integer("quiz_id").notNull().references(() => knowledgeQuizzes.id),
  selectedAnswer: integer("selected_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  pointsEarned: integer("points_earned").default(0),
  timeSpent: integer("time_spent"), // in seconds
  completedAt: timestamp("completed_at").defaultNow(),
});

export type InsertUserLevel = typeof userLevels.$inferInsert;
export type UserLevel = typeof userLevels.$inferSelect;
export type InsertMicroLearningActivity = typeof microLearningActivities.$inferInsert;
export type MicroLearningActivity = typeof microLearningActivities.$inferSelect;
export type InsertLearningBadge = typeof learningBadges.$inferInsert;
export type LearningBadge = typeof learningBadges.$inferSelect;
export type InsertDailyStreak = typeof dailyStreaks.$inferInsert;
export type DailyStreak = typeof dailyStreaks.$inferSelect;
export type InsertKnowledgeQuiz = typeof knowledgeQuizzes.$inferInsert;
export type KnowledgeQuiz = typeof knowledgeQuizzes.$inferSelect;
export type InsertUserQuizResult = typeof userQuizResults.$inferInsert;
export type UserQuizResult = typeof userQuizResults.$inferSelect;

// Insert schemas
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ id: true });
export const insertChallengeCompletionSchema = createInsertSchema(challengeCompletions).omit({ id: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true });
export const insertSavedPhraseSchema = createInsertSchema(savedPhrases).omit({ id: true });
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true });
export const insertAiChatSessionSchema = createInsertSchema(aiChatSessions).omit({ id: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true });
