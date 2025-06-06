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
  decimal,
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
  challengeType: varchar("challenge_type").default("free_journal").notNull(),
  day: integer("day"), // Optional - null for free journal entries
  experience: text("experience"),
  insights: text("insights"),
  intention: text("intention"),
  mood: integer("mood"), // 1-10 scale
  energy: integer("energy"), // 1-10 scale
  challenges: text("challenges"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assessment Reflections - Store user reflections from daily assessments
export const assessmentReflections = pgTable("assessment_reflections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  assessmentId: varchar("assessment_id").notNull(), // Links to daily assessment
  reflectionType: varchar("reflection_type").notNull(), // 'journal_reflection', 'evening_integration', 'exercise_reflection', 'daily_assessment'
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  questionPrompt: text("question_prompt"), // The question/prompt that generated this reflection
  wordCount: integer("word_count").default(0),
  characterCount: integer("character_count").default(0),
  challengeType: varchar("challenge_type"),
  day: integer("day"),
  metadata: jsonb("metadata").default({}), // Store additional context like exercise type, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("assessment_reflections_user_idx").on(table.userId),
  index("assessment_reflections_type_idx").on(table.reflectionType),
  index("assessment_reflections_challenge_idx").on(table.challengeType),
  index("assessment_reflections_created_idx").on(table.createdAt)
]);

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

// AI Response History - Save all AI interactions for users
export const aiResponseHistory = pgTable("ai_response_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionType: varchar("session_type").notNull(), // 'coaching', 'questions', 'affirmation', 'explanation'
  userInput: text("user_input").notNull(),
  aiResponse: jsonb("ai_response").notNull(),
  challengeType: varchar("challenge_type"),
  day: integer("day"),
  
  // Analytics fields for cost tracking
  modelUsed: varchar("model_used").default("gpt-4o"), // 'gpt-4o', 'gpt-4o-mini'
  tokenCount: integer("token_count").default(0),
  cost: real("cost").default(0), // Cost in dollars
  responseTime: integer("response_time").default(0), // milliseconds
  responseQuality: integer("response_quality").default(8), // 1-10 scale
  
  // User interaction fields
  tags: jsonb("tags").default([]), // For filtering and search
  isFavorited: boolean("is_favorited").default(false),
  rating: integer("rating"), // 1-5 user rating of response quality
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ai_response_history_user_idx").on(table.userId),
  index("ai_response_history_session_type_idx").on(table.sessionType),
  index("ai_response_history_challenge_type_idx").on(table.challengeType),
  index("ai_response_history_model_idx").on(table.modelUsed),
  index("ai_response_history_created_at_idx").on(table.createdAt),
]);

// AI Response Cache for optimizing repeat requests
export const aiResponseCache = pgTable("ai_response_cache", {
  id: serial("id").primaryKey(),
  inputHash: varchar("input_hash").unique().notNull(),
  response: text("response").notNull(),
  requestType: varchar("request_type").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Usage Tracking - Independent tracking for all AI requests (analytics-focused)
export const aiUsageTracking = pgTable("ai_usage_tracking", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  requestType: varchar("request_type").notNull(), // 'coaching', 'questions', 'chat', 'explanation'
  challengeType: varchar("challenge_type"),
  day: integer("day"),
  
  // Request details
  model: varchar("model").notNull(), // 'gpt-4o', 'gpt-4o-mini'
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  cost: decimal("cost", { precision: 8, scale: 6 }).notNull(), // Precise cost tracking
  
  // Performance metrics
  responseTime: integer("response_time").notNull(), // milliseconds
  requestHash: varchar("request_hash"), // For duplicate detection
  wasFromCache: boolean("was_from_cache").default(false),
  
  // Quality and routing
  modelSelected: varchar("model_selected").notNull(), // 'intelligent_routing', 'manual_selection'
  complexityScore: integer("complexity_score").default(5), // 1-10 scale
  qualityScore: integer("quality_score").default(8), // 1-10 scale (estimated or user-rated)
  
  // Metadata
  userAgent: varchar("user_agent"),
  ipAddress: varchar("ip_address"),
  sessionId: varchar("session_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("ai_usage_tracking_user_idx").on(table.userId),
  index("ai_usage_tracking_model_idx").on(table.model),
  index("ai_usage_tracking_date_idx").on(table.createdAt),
  index("ai_usage_tracking_cost_idx").on(table.cost),
  index("ai_usage_tracking_challenge_idx").on(table.challengeType),
]);



// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertUserProgress = typeof userProgress.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;

export type InsertChallengeCompletion = typeof challengeCompletions.$inferInsert;
export type ChallengeCompletion = typeof challengeCompletions.$inferSelect;

export type InsertJournalEntry = typeof journalEntries.$inferInsert;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertAssessmentReflection = typeof assessmentReflections.$inferInsert;
export type AssessmentReflection = typeof assessmentReflections.$inferSelect;

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

export type InsertAiResponseHistory = typeof aiResponseHistory.$inferInsert;
export type AiResponseHistory = typeof aiResponseHistory.$inferSelect;
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

export type InsertAiResponseCache = typeof aiResponseCache.$inferInsert;
export type AiResponseCache = typeof aiResponseCache.$inferSelect;

// Vision Board System
export const visionBoards = pgTable("vision_boards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  canvasData: jsonb("canvas_data").notNull(), // Complete board layout
  thumbnailUrl: varchar("thumbnail_url"), // Preview image
  isPublic: boolean("is_public").default(false),
  templateCategory: varchar("template_category"), // financial, health, career, etc.
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("vision_boards_user_idx").on(table.userId),
  index("vision_boards_public_idx").on(table.isPublic),
  index("vision_boards_category_idx").on(table.templateCategory),
]);

export const visionBoardItems = pgTable("vision_board_items", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull().references(() => visionBoards.id, { onDelete: "cascade" }),
  itemType: varchar("item_type").notNull(), // 'image', 'text', 'shape', 'drawing'
  content: text("content").notNull(), // image URL, text content, or shape data
  x: real("x").notNull(),
  y: real("y").notNull(),
  width: real("width").notNull(),
  height: real("height").notNull(),
  rotation: real("rotation").default(0),
  opacity: real("opacity").default(1),
  zIndex: integer("z_index").default(0),
  styling: jsonb("styling").default({}), // fonts, colors, filters, etc.
  metadata: jsonb("metadata").default({}), // source info, capture details
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("vision_board_items_board_idx").on(table.boardId),
  index("vision_board_items_type_idx").on(table.itemType),
]);

export const visionBoardTemplates = pgTable("vision_board_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // financial, health, career, relationships
  templateData: jsonb("template_data").notNull(), // Layout structure
  thumbnailUrl: varchar("thumbnail_url"),
  isOfficial: boolean("is_official").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("vision_board_templates_category_idx").on(table.category),
]);



// Insert schemas
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ id: true });
export const insertChallengeCompletionSchema = createInsertSchema(challengeCompletions).omit({ id: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true });
export const insertAssessmentReflectionSchema = createInsertSchema(assessmentReflections).omit({ id: true });
export const insertSavedPhraseSchema = createInsertSchema(savedPhrases).omit({ id: true });
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true });
export const insertAiChatSessionSchema = createInsertSchema(aiChatSessions).omit({ id: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true });
export const insertAiResponseHistorySchema = createInsertSchema(aiResponseHistory).omit({ id: true });
export const insertVisionBoardSchema = createInsertSchema(visionBoards).omit({ id: true });
export const insertVisionBoardItemSchema = createInsertSchema(visionBoardItems).omit({ id: true });
export const insertVisionBoardTemplateSchema = createInsertSchema(visionBoardTemplates).omit({ id: true });

export type InsertVisionBoard = typeof visionBoards.$inferInsert;
export type VisionBoard = typeof visionBoards.$inferSelect;
export type InsertVisionBoardItem = typeof visionBoardItems.$inferInsert;
export type VisionBoardItem = typeof visionBoardItems.$inferSelect;

// ===================================
// AI COUCH SYSTEM - INDEPENDENT MODULE
// ===================================

// AI Couch User Profiles - Psychological and spiritual profiling
export const aiCouchProfiles = pgTable("ai_couch_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Personality Assessment Results
  personalityType: varchar("personality_type"), // MBTI, Enneagram, etc.
  learningStyle: varchar("learning_style"), // visual, auditory, kinesthetic, reading
  dominantMindset: varchar("dominant_mindset"), // rational, emotional, spiritual
  resistancePatterns: jsonb("resistance_patterns").default([]), // Array of identified resistance areas
  motivationTriggers: jsonb("motivation_triggers").default([]), // What drives this user
  
  // Trauma and Healing Assessment
  traumaAreas: jsonb("trauma_areas").default([]), // Identified areas needing healing
  healingReadiness: integer("healing_readiness").default(5), // 1-10 scale
  supportNeeds: jsonb("support_needs").default([]), // Types of support needed
  preferredModalities: jsonb("preferred_modalities").default([]), // therapy, meditation, energy work
  
  // Goals and Intentions
  primaryGoals: jsonb("primary_goals").default([]),
  secondaryGoals: jsonb("secondary_goals").default([]),
  lifeContext: jsonb("life_context"), // age, relationships, work, health
  transformationAreas: jsonb("transformation_areas").default([]),
  
  // AI Couch Settings
  preferredMode: varchar("preferred_mode").default("mixed"), // scientific, spiritual, mixed
  communicationStyle: varchar("communication_style").default("balanced"), // gentle, direct, motivational
  sessionFrequency: varchar("session_frequency").default("daily"), // daily, every_other_day, weekly
  
  // Profile Metadata
  assessmentCompleted: boolean("assessment_completed").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("ai_couch_profile_user_idx").on(table.userId)
]);

// AI Couch Sessions - Conversation and interaction tracking
export const aiCouchSessions = pgTable("ai_couch_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").notNull().references(() => aiCouchProfiles.id),
  
  // Session Details
  sessionType: varchar("session_type").notNull(), // onboarding, daily_checkin, crisis_support, progress_review
  sessionMode: varchar("session_mode").notNull(), // scientific, spiritual, mixed
  emotionalState: varchar("emotional_state"), // detected emotional state
  sessionGoal: varchar("session_goal"), // what user wants from this session
  
  // Conversation Data
  userInput: text("user_input").notNull(),
  aiResponse: text("ai_response").notNull(),
  conversationContext: jsonb("conversation_context"), // previous context for continuity
  
  // Analysis Results
  emotionalTone: varchar("emotional_tone"), // positive, negative, neutral, mixed
  detectedPatterns: jsonb("detected_patterns").default([]), // patterns AI identified
  insights: jsonb("insights").default([]), // key insights from session
  recommendations: jsonb("recommendations").default([]), // AI recommendations
  followUpNeeded: boolean("follow_up_needed").default(false),
  
  // Performance Metrics
  sessionDuration: integer("session_duration"), // in seconds
  userSatisfaction: integer("user_satisfaction"), // 1-10 if user rates
  aiConfidence: integer("ai_confidence").default(8), // AI's confidence in response
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("ai_couch_session_user_idx").on(table.userId),
  index("ai_couch_session_date_idx").on(table.createdAt),
  index("ai_couch_session_type_idx").on(table.sessionType)
]);

// Personalized Challenge Plans - AI-generated adaptive challenges
export const personalizedChallengePlans = pgTable("personalized_challenge_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").notNull().references(() => aiCouchProfiles.id),
  
  // Challenge Metadata
  planName: varchar("plan_name").notNull(),
  baseChallengeType: varchar("base_challenge_type").notNull(), // money_blocks_clearing, etc.
  totalDays: integer("total_days").default(30),
  currentDay: integer("current_day").default(1),
  
  // Personalization Details
  personalizedGoals: jsonb("personalized_goals").notNull(),
  adaptationReasons: jsonb("adaptation_reasons"), // why AI chose this approach
  difficultyLevel: integer("difficulty_level").default(5), // 1-10 scale
  intensityLevel: integer("intensity_level").default(5), // 1-10 scale
  
  // Dynamic Content
  generatedContent: jsonb("generated_content"), // AI-generated exercises, meditations
  adaptiveElements: jsonb("adaptive_elements"), // elements that change based on progress
  
  // Progress Tracking
  completedActivities: jsonb("completed_activities").default([]),
  breakthroughMoments: jsonb("breakthrough_moments").default([]),
  strugglingAreas: jsonb("struggling_areas").default([]),
  adaptationHistory: jsonb("adaptation_history").default([]), // how plan evolved
  
  // Status
  status: varchar("status").default("active"), // active, paused, completed, abandoned
  lastAdaptation: timestamp("last_adaptation"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("personalized_plan_user_idx").on(table.userId),
  index("personalized_plan_status_idx").on(table.status)
]);

// Daily Adaptive Activities - AI-generated daily content
export const dailyAdaptiveActivities = pgTable("daily_adaptive_activities", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => personalizedChallengePlans.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Activity Details
  day: integer("day").notNull(),
  activityType: varchar("activity_type").notNull(), // meditation, journaling, exercise, reflection
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  
  // Personalization
  adaptationReason: text("adaptation_reason"), // why AI chose this activity
  difficultyAdjustment: integer("difficulty_adjustment").default(0), // -3 to +3 from base
  personalizedContent: jsonb("personalized_content"), // customized for user
  
  // Progress Tracking
  completed: boolean("completed").default(false),
  completionTime: integer("completion_time"), // minutes spent
  userFeedback: text("user_feedback"),
  emotionalResponse: varchar("emotional_response"), // how user felt
  effectiveness: integer("effectiveness"), // user-rated 1-10
  
  // AI Analysis
  aiObservations: text("ai_observations"), // AI's analysis of user's engagement
  nextDayAdjustments: jsonb("next_day_adjustments"), // how this affects tomorrow
  
  scheduledFor: date("scheduled_for").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("daily_activity_plan_idx").on(table.planId),
  index("daily_activity_user_idx").on(table.userId),
  index("daily_activity_date_idx").on(table.scheduledFor)
]);

// Emotional Pattern Tracking - Long-term emotional intelligence
export const emotionalPatterns = pgTable("emotional_patterns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Pattern Data
  patternType: varchar("pattern_type").notNull(), // mood_cycles, trigger_responses, healing_progression
  patternName: varchar("pattern_name").notNull(),
  description: text("description"),
  
  // Pattern Details
  frequency: varchar("frequency"), // daily, weekly, monthly, triggered
  intensity: integer("intensity").default(5), // 1-10 scale
  triggers: jsonb("triggers").default([]), // what causes this pattern
  manifestations: jsonb("manifestations").default([]), // how it shows up
  
  // Evolution Tracking
  firstObserved: timestamp("first_observed").notNull(),
  lastObserved: timestamp("last_observed").notNull(),
  improvementTrend: varchar("improvement_trend"), // improving, stable, declining
  interventionsUsed: jsonb("interventions_used").default([]),
  
  // AI Analysis
  aiConfidence: integer("ai_confidence").default(7), // 1-10 confidence in pattern
  recommendedActions: jsonb("recommended_actions").default([]),
  
  status: varchar("status").default("active"), // active, resolved, monitoring
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("emotional_pattern_user_idx").on(table.userId),
  index("emotional_pattern_type_idx").on(table.patternType)
]);

// AI Couch Knowledge Base - Dynamic learning and adaptation
export const aiCouchKnowledge = pgTable("ai_couch_knowledge", {
  id: serial("id").primaryKey(),
  
  // Knowledge Entry
  knowledgeType: varchar("knowledge_type").notNull(), // technique, insight, pattern, intervention
  category: varchar("category").notNull(), // trauma_healing, consciousness, manifestation
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  
  // Application Data
  applicableConditions: jsonb("applicable_conditions"), // when to use this knowledge
  contraindications: jsonb("contraindications"), // when NOT to use
  effectivenessRating: integer("effectiveness_rating").default(8), // 1-10 based on outcomes
  
  // Usage Tracking
  timesUsed: integer("times_used").default(0),
  successRate: real("success_rate").default(0.8), // percentage success
  userFeedbackScore: real("user_feedback_score").default(8.0),
  
  // Source and Validation
  source: varchar("source"), // dispenza, neville, access_consciousness, etc.
  validatedBy: varchar("validated_by"), // user_feedback, research, expert_review
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("ai_knowledge_category_idx").on(table.category),
  index("ai_knowledge_type_idx").on(table.knowledgeType)
]);

// AI Couch Daily Assessments - Dynamic personalized content
export const aiCouchDailyAssessments = pgTable("ai_couch_daily_assessments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").notNull().references(() => aiCouchProfiles.id),
  
  // Assessment Details
  assessmentDate: date("assessment_date").notNull(),
  currentFocus: varchar("current_focus").notNull(), // What AI determined to focus on
  reasoning: text("reasoning").notNull(), // Why AI chose this focus
  
  // Generated Content
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  exercises: jsonb("exercises").notNull(), // Array of daily exercises
  reflectionQuestions: jsonb("reflection_questions").notNull(), // Array of questions
  completionCriteria: jsonb("completion_criteria").notNull(), // Array of criteria
  
  // Therapeutic Context
  therapeuticApproaches: jsonb("therapeutic_approaches").notNull(), // Which modalities used
  nextSteps: text("next_steps"), // What this prepares for
  progressIndicators: jsonb("progress_indicators"), // How to measure success
  
  // Completion Tracking
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  userResponses: jsonb("user_responses"), // User's responses to exercises/questions
  
  // AI Adaptation
  aiConfidence: integer("ai_confidence").default(8), // AI's confidence in this assessment
  adaptationNotes: text("adaptation_notes"), // Notes for next day's adaptation
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ai_daily_assessments_user_idx").on(table.userId),
  index("ai_daily_assessments_date_idx").on(table.assessmentDate),
  index("ai_daily_assessments_completed_idx").on(table.isCompleted)
]);

// AI Couch Progress Tracking - Track user's journey and patterns
export const aiCouchProgressTracking = pgTable("ai_couch_progress_tracking", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  profileId: integer("profile_id").notNull().references(() => aiCouchProfiles.id),
  
  // Progress Metrics
  trackingDate: date("tracking_date").notNull(),
  overallProgress: integer("overall_progress").default(0), // 0-100 scale
  currentPhase: varchar("current_phase").notNull(), // foundation, growth, integration, mastery
  focusAreas: jsonb("focus_areas").notNull(), // Current focus areas
  
  // Emotional & Mental State
  emotionalBaseline: integer("emotional_baseline").default(5), // 1-10 scale
  stressLevel: integer("stress_level").default(5), // 1-10 scale
  motivationLevel: integer("motivation_level").default(7), // 1-10 scale
  clarityLevel: integer("clarity_level").default(5), // 1-10 scale
  
  // Achievement Tracking
  completedAssessments: integer("completed_assessments").default(0),
  streakDays: integer("streak_days").default(0),
  totalEngagementMinutes: integer("total_engagement_minutes").default(0),
  
  // Pattern Recognition
  identifiedPatterns: jsonb("identified_patterns"), // AI-identified patterns
  breakthroughMoments: jsonb("breakthrough_moments"), // Significant insights
  challengeAreas: jsonb("challenge_areas"), // Areas of resistance
  
  // Adaptive Insights
  aiInsights: text("ai_insights"), // AI's analysis of progress
  recommendedAdjustments: jsonb("recommended_adjustments"), // What to adjust
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ai_progress_tracking_user_idx").on(table.userId),
  index("ai_progress_tracking_date_idx").on(table.trackingDate)
]);

// Type exports for AI Couch system
export type InsertAiCouchProfile = typeof aiCouchProfiles.$inferInsert;
export type AiCouchProfile = typeof aiCouchProfiles.$inferSelect;
export type AiCouchDailyAssessment = typeof aiCouchDailyAssessments.$inferSelect;
export type InsertAiCouchDailyAssessment = typeof aiCouchDailyAssessments.$inferInsert;

export type InsertAiCouchSession = typeof aiCouchSessions.$inferInsert;
export type AiCouchSession = typeof aiCouchSessions.$inferSelect;

export type InsertPersonalizedChallengePlan = typeof personalizedChallengePlans.$inferInsert;
export type PersonalizedChallengePlan = typeof personalizedChallengePlans.$inferSelect;

export type InsertDailyAdaptiveActivity = typeof dailyAdaptiveActivities.$inferInsert;
export type DailyAdaptiveActivity = typeof dailyAdaptiveActivities.$inferSelect;

export type InsertEmotionalPattern = typeof emotionalPatterns.$inferInsert;
export type EmotionalPattern = typeof emotionalPatterns.$inferSelect;

export type InsertAiCouchKnowledge = typeof aiCouchKnowledge.$inferInsert;
export type AiCouchKnowledge = typeof aiCouchKnowledge.$inferSelect;
