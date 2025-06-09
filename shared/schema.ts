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

// Generated Images Gallery
export const generatedImages = pgTable("generated_images", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  imageUrl: text("image_url").notNull(),
  prompt: text("prompt").notNull(),
  size: varchar("size").notNull(),
  quality: varchar("quality").notNull(),
  model: varchar("model").notNull(),
  cost: decimal("cost", { precision: 6, scale: 4 }).notNull(),
  generationType: varchar("generation_type").default("ai_generation"), // ai_generation, vision_board, wallpaper
  tags: jsonb("tags").default([]),
  isFavorited: boolean("is_favorited").default(false),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("generated_images_user_idx").on(table.userId),
  index("generated_images_created_at_idx").on(table.createdAt),
  index("generated_images_generation_type_idx").on(table.generationType),
]);

// Deep Journaling Threads - Core conversation containers
export const journalingThreads = pgTable("journaling_threads", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  threadType: varchar("thread_type").default("free_writing").notNull(), // 'free_writing', 'guided_exploration', 'therapy_session'
  
  // Current state tracking
  currentEmotionalState: varchar("current_emotional_state"), // 'confused', 'anxious', 'hopeful', etc.
  currentTopic: varchar("current_topic"), // Main theme being explored
  progressMarkers: jsonb("progress_markers").default({}), // Psychological progress indicators
  
  // Thread analytics
  totalExchanges: integer("total_exchanges").default(0),
  avgResponseTime: integer("avg_response_time").default(0), // User's average response time in minutes
  emotionalJourney: jsonb("emotional_journey").default([]), // Array of emotional states over time
  recurringTopics: jsonb("recurring_topics").default([]), // Topics that keep coming up
  
  // AI personalization settings
  preferredMode: varchar("preferred_mode").default("conversational"), // 'conversational', 'therapeutic', 'analytical'
  preferredTone: varchar("preferred_tone").default("supportive"), // 'supportive', 'challenging', 'neutral', 'empathetic'
  preferredPerspective: varchar("preferred_perspective").default("psychologist"), // 'psychologist', 'life_coach', 'cbt_therapist', 'philosopher', 'stoic'
  customInstructions: text("custom_instructions"), // User-defined AI behavior preferences
  
  // Metadata
  isActive: boolean("is_active").default(true),
  isArchived: boolean("is_archived").default(false),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("journaling_threads_user_idx").on(table.userId),
  index("journaling_threads_active_idx").on(table.isActive),
  index("journaling_threads_last_active_idx").on(table.lastActiveAt),
  index("journaling_threads_emotional_state_idx").on(table.currentEmotionalState),
]);

// Thread Exchanges - Individual conversation turns
export const threadExchanges = pgTable("thread_exchanges", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => journalingThreads.id, { onDelete: "cascade" }),
  exchangeOrder: integer("exchange_order").notNull(), // Sequential order within thread
  
  // User input
  userInput: text("user_input").notNull(),
  userWordCount: integer("user_word_count").default(0),
  userWritingTime: integer("user_writing_time").default(0), // Time spent writing in seconds
  wasVoiceInput: boolean("was_voice_input").default(false),
  voiceTranscriptionQuality: real("voice_transcription_quality"), // 0-1 confidence score
  
  // AI response components
  aiAnalysis: jsonb("ai_analysis").notNull(), // Professional psychological analysis
  aiQuestion: text("ai_question").notNull(), // Therapeutic question for deeper exploration
  aiPatternInsights: jsonb("ai_pattern_insights").default({}), // Patterns compared to previous exchanges
  aiEmotionalAssessment: jsonb("ai_emotional_assessment").default({}), // Current emotional state analysis
  
  // Response customization
  responseMode: varchar("response_mode").default("conversational"),
  responseTone: varchar("response_tone").default("supportive"),
  responsePerspective: varchar("response_perspective").default("psychologist"),
  customResponseInstructions: text("custom_response_instructions"),
  
  // AI processing metadata
  modelUsed: varchar("model_used").default("gpt-4o"),
  processingTime: integer("processing_time").default(0), // AI response generation time in ms
  tokenCount: integer("token_count").default(0),
  cost: decimal("cost", { precision: 8, scale: 6 }).default("0"),
  
  // User interaction
  userRating: integer("user_rating"), // 1-5 rating of AI response quality
  userFeedback: text("user_feedback"), // Optional user feedback on the response
  isBookmarked: boolean("is_bookmarked").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("thread_exchanges_thread_idx").on(table.threadId),
  index("thread_exchanges_order_idx").on(table.exchangeOrder),
  index("thread_exchanges_created_at_idx").on(table.createdAt),
  index("thread_exchanges_bookmarked_idx").on(table.isBookmarked),
]);

// User Psychological Profile - Long-term analysis and insights
export const psychologicalProfile = pgTable("psychological_profile", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  
  // Emotional patterns analysis
  emotionalPatterns: jsonb("emotional_patterns").default({}), // Recurring emotional themes
  emotionalTrends: jsonb("emotional_trends").default({}), // Changes over time
  currentDominantEmotion: varchar("current_dominant_emotion"),
  emotionalVolatility: real("emotional_volatility").default(0), // 0-1 scale of emotional stability
  
  // Personality insights
  personalityTraits: jsonb("personality_traits").default({}), // Big 5, cognitive patterns, etc.
  communicationStyle: varchar("communication_style"), // 'direct', 'reflective', 'analytical', 'emotional'
  problemSolvingApproach: varchar("problem_solving_approach"), // 'logical', 'intuitive', 'collaborative', 'avoidant'
  
  // Growth and development areas
  identifiedGrowthAreas: jsonb("identified_growth_areas").default([]),
  identifiedStrengths: jsonb("identified_strengths").default([]),
  progressMarkers: jsonb("progress_markers").default({}),
  developmentGoals: jsonb("development_goals").default([]),
  
  // Recurring themes and topics
  recurringConcerns: jsonb("recurring_concerns").default([]),
  recurringTopics: jsonb("recurring_topics").default([]),
  avoidedTopics: jsonb("avoided_topics").default([]),
  breakthroughMoments: jsonb("breakthrough_moments").default([]),
  
  // Behavioral patterns
  writingPatterns: jsonb("writing_patterns").default({}), // Length, frequency, style analysis
  responsePatterns: jsonb("response_patterns").default({}), // How they typically respond to AI questions
  engagementPatterns: jsonb("engagement_patterns").default({}), // When and how they use the system
  
  // System preferences and effectiveness
  mostEffectiveQuestioningStyles: jsonb("most_effective_questioning_styles").default([]),
  preferredInteractionModes: jsonb("preferred_interaction_modes").default([]),
  systemUsageStatistics: jsonb("system_usage_statistics").default({}),
  
  // Analysis metadata
  lastFullAnalysisAt: timestamp("last_full_analysis_at"),
  analysisConfidenceLevel: real("analysis_confidence_level").default(0), // 0-1 confidence in profile accuracy
  totalDataPoints: integer("total_data_points").default(0), // Number of exchanges analyzed
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("psychological_profile_user_idx").on(table.userId),
  index("psychological_profile_last_analysis_idx").on(table.lastFullAnalysisAt),
]);

// Emotional State Tracking - Time-series emotional data
export const emotionalStateHistory = pgTable("emotional_state_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  threadId: integer("thread_id").references(() => journalingThreads.id),
  exchangeId: integer("exchange_id").references(() => threadExchanges.id),
  
  // Emotional state data
  primaryEmotion: varchar("primary_emotion").notNull(), // 'joy', 'sadness', 'anger', 'fear', 'disgust', 'surprise', 'confusion', etc.
  secondaryEmotions: jsonb("secondary_emotions").default([]), // Additional emotions present
  emotionalIntensity: real("emotional_intensity").notNull(), // 0-1 scale
  emotionalClarity: real("emotional_clarity").notNull(), // How clearly the emotion is expressed/understood
  
  // Context
  triggerContext: text("trigger_context"), // What triggered this emotional state
  associatedTopics: jsonb("associated_topics").default([]),
  
  // Detection method
  detectionMethod: varchar("detection_method").default("ai_analysis"), // 'ai_analysis', 'user_reported', 'voice_analysis'
  confidenceScore: real("confidence_score").default(0), // Confidence in the emotional assessment
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("emotional_state_history_user_idx").on(table.userId),
  index("emotional_state_history_thread_idx").on(table.threadId),
  index("emotional_state_history_created_at_idx").on(table.createdAt),
  index("emotional_state_history_primary_emotion_idx").on(table.primaryEmotion),
]);

// Multi-Dimensional User Modeling System - Premium Personalization
export const userTherapeuticProfile = pgTable("user_therapeutic_profile", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Therapeutic Response Patterns - What works for this specific user
  effectiveTherapeuticStyles: jsonb("effective_therapeutic_styles").default({}), // { "socratic": 0.85, "directive": 0.65, "reflective": 0.90, "collaborative": 0.70 }
  preferredQuestioningDepth: integer("preferred_questioning_depth").default(5), // 1-10 scale
  responsiveToFrameworks: jsonb("responsive_to_frameworks").default({}), // { "cbt": 0.8, "dbt": 0.6, "act": 0.9 }
  breakthroughPatterns: jsonb("breakthrough_patterns").default([]), // Session patterns that led to insights
  resistanceIndicators: jsonb("resistance_indicators").default([]), // Patterns showing user resistance
  
  // Communication Style Preferences
  preferredMetaphorTypes: jsonb("preferred_metaphor_types").default([]), // ["nature", "technology", "sports", "music"]
  effectiveExampleTypes: jsonb("effective_example_types").default([]), // ["personal_stories", "analogies", "practical_scenarios"]
  languageComplexityLevel: integer("language_complexity_level").default(5), // 1-10 scale
  culturalContextFactors: jsonb("cultural_context_factors").default({}), // Cultural considerations
  communicationTone: varchar("communication_tone").default("balanced"), // "gentle", "direct", "balanced", "challenging"
  
  // Adaptive Language Generation Profile
  languageAdaptationProfile: jsonb("language_adaptation_profile").default({}), // Complete language adaptation preferences and patterns
  
  // Emotional Triggers and Comfort Zones
  emotionalTriggers: jsonb("emotional_triggers").default([]), // Words/topics that cause strong reactions
  comfortZoneThemes: jsonb("comfort_zone_themes").default([]), // Topics user feels safe discussing
  emotionalRegulationCapacity: integer("emotional_regulation_capacity").default(5), // 1-10 scale
  crisisEscalationRisk: integer("crisis_escalation_risk").default(1), // 1-10 scale
  supportSystemStrength: integer("support_system_strength").default(5), // 1-10 scale
  
  // Learning Pace and Depth Preferences
  cognitiveProcessingSpeed: integer("cognitive_processing_speed").default(5), // 1-10 scale
  preferredInsightDelivery: varchar("preferred_insight_delivery").default("gradual"), // "gradual", "direct", "exploratory"
  conceptualVsExperiential: real("conceptual_vs_experiential").default(0.5), // 0=experiential, 1=conceptual
  sessionLengthPreference: integer("session_length_preference").default(15), // minutes
  challengeLevelTolerance: integer("challenge_level_tolerance").default(5), // 1-10 scale
  
  // Therapeutic Progress Indicators
  overallProgressVelocity: real("overall_progress_velocity").default(0.5), // Progress rate 0-1
  stagnationRiskFactors: jsonb("stagnation_risk_factors").default([]),
  motivationalDrivers: jsonb("motivational_drivers").default([]), // What motivates this user
  sessionEngagementPatterns: jsonb("session_engagement_patterns").default({}),
  goalAchievementHistory: jsonb("goal_achievement_history").default([]),
  
  // Analytics and Quality Metrics
  totalInteractionCount: integer("total_interaction_count").default(0),
  averageSessionSatisfaction: real("average_session_satisfaction").default(0.5), // 0-1 scale
  therapeuticRelationshipStrength: real("therapeutic_relationship_strength").default(0.5), // 0-1 scale
  lastProfileUpdateAt: timestamp("last_profile_update_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("user_therapeutic_profile_user_idx").on(table.userId),
  index("user_therapeutic_profile_progress_idx").on(table.overallProgressVelocity),
  index("user_therapeutic_profile_satisfaction_idx").on(table.averageSessionSatisfaction),
]);

// Therapeutic Interaction Analysis - Track what works for each user
export const therapeuticInteractionAnalysis = pgTable("therapeutic_interaction_analysis", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  threadId: integer("thread_id").references(() => journalingThreads.id),
  exchangeId: integer("exchange_id").references(() => threadExchanges.id),
  
  // Interaction Effectiveness Metrics
  userEngagementScore: real("user_engagement_score"), // 0-1 scale based on response length, time spent, etc.
  emotionalResonanceScore: real("emotional_resonance_score"), // 0-1 scale based on emotional response
  insightGenerationScore: real("insight_generation_score"), // 0-1 scale based on user's insights
  therapeuticAllianceStrength: real("therapeutic_alliance_strength"), // 0-1 scale
  sessionSatisfactionRating: integer("session_satisfaction_rating"), // 1-10 user rating
  
  // Technique Effectiveness
  techniquesUsed: jsonb("techniques_used").default([]), // ["socratic_questioning", "reframing", "validation"]
  frameworksApplied: jsonb("frameworks_applied").default([]), // ["cbt", "dbt", "act"]
  questioningStyle: varchar("questioning_style"), // "open_ended", "focused", "challenging", "supportive"
  interventionType: varchar("intervention_type"), // "clarification", "interpretation", "confrontation", "support"
  
  // User Response Analysis
  userResponseLength: integer("user_response_length"), // Character count of user's response
  emotionalShiftDetected: boolean("emotional_shift_detected").default(false),
  newInsightsIdentified: boolean("new_insights_identified").default(false),
  resistanceEncountered: boolean("resistance_encountered").default(false),
  breakthroughMomentDetected: boolean("breakthrough_moment_detected").default(false),
  
  // Context Factors
  sessionTimeOfDay: varchar("session_time_of_day"), // "morning", "afternoon", "evening", "night"
  userMoodAtStart: integer("user_mood_at_start"), // 1-10 scale
  userMoodAtEnd: integer("user_mood_at_end"), // 1-10 scale
  sessionDuration: integer("session_duration"), // minutes
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("therapeutic_interaction_analysis_user_idx").on(table.userId),
  index("therapeutic_interaction_analysis_engagement_idx").on(table.userEngagementScore),
  index("therapeutic_interaction_analysis_satisfaction_idx").on(table.sessionSatisfactionRating),
  index("therapeutic_interaction_analysis_created_at_idx").on(table.createdAt),
]);

// User Communication Patterns - Learn how each user communicates best
export const userCommunicationPatterns = pgTable("user_communication_patterns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Language and Communication Style
  vocabularyComplexity: integer("vocabulary_complexity").default(5), // 1-10 scale
  sentenceStructurePreference: varchar("sentence_structure_preference").default("balanced"), // "simple", "complex", "balanced"
  communicationRhythm: varchar("communication_rhythm").default("moderate"), // "fast", "moderate", "slow"
  
  // Metaphor and Example Preferences
  effectiveMetaphors: jsonb("effective_metaphors").default([]), // Specific metaphors that resonated
  preferredExampleCategories: jsonb("preferred_example_categories").default([]), // ["nature", "technology", "relationships"]
  analogyReceptiveness: real("analogy_receptiveness").default(0.5), // 0-1 scale
  
  // Cultural and Personal Context
  culturalBackground: jsonb("cultural_background").default({}), // Cultural factors affecting communication
  personalValueSystem: jsonb("personal_value_system").default([]), // Core values identified
  worldviewOrientation: varchar("worldview_orientation").default("balanced"), // "optimistic", "realistic", "pessimistic", "balanced"
  
  // Response Patterns
  typicalResponseLength: integer("typical_response_length"), // Average character count
  emotionalExpressionStyle: varchar("emotional_expression_style").default("moderate"), // "reserved", "moderate", "expressive"
  introspectionCapacity: integer("introspection_capacity").default(5), // 1-10 scale
  
  // Learning and Processing Style
  informationProcessingStyle: varchar("information_processing_style").default("sequential"), // "visual", "auditory", "kinesthetic", "sequential", "random"
  feedbackReceptiveness: real("feedback_receptiveness").default(0.5), // 0-1 scale
  changeReadiness: real("change_readiness").default(0.5), // 0-1 scale
  
  // Quality Metrics
  communicationEffectivenessScore: real("communication_effectiveness_score").default(0.5), // 0-1 scale
  lastAnalysisUpdate: timestamp("last_analysis_update").defaultNow(),
  totalSamplesAnalyzed: integer("total_samples_analyzed").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("user_communication_patterns_user_idx").on(table.userId),
  index("user_communication_patterns_effectiveness_idx").on(table.communicationEffectivenessScore),
]);

// Personalization Insights - Store discovered patterns and preferences
export const personalizationInsights = pgTable("personalization_insights", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Insight Classification
  insightType: varchar("insight_type").notNull(), // "communication_preference", "therapeutic_response", "emotional_pattern", "behavioral_trend"
  insightCategory: varchar("insight_category").notNull(), // "effectiveness", "preference", "trigger", "strength", "challenge"
  
  // Insight Details
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  confidence: real("confidence").notNull(), // 0-1 scale
  evidence: jsonb("evidence").default([]), // Supporting data points
  
  // Application Guidelines
  recommendedActions: jsonb("recommended_actions").default([]), // How to apply this insight
  contraindications: jsonb("contraindications").default([]), // When not to apply
  contextFactors: jsonb("context_factors").default([]), // Conditions that affect this insight
  
  // Validation and Quality
  isValidated: boolean("is_validated").default(false),
  validationDate: timestamp("validation_date"),
  effectiveness: real("effectiveness"), // 0-1 scale based on outcomes
  lastApplied: timestamp("last_applied"),
  applicationCount: integer("application_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("personalization_insights_user_idx").on(table.userId),
  index("personalization_insights_type_idx").on(table.insightType),
  index("personalization_insights_confidence_idx").on(table.confidence),
  index("personalization_insights_effectiveness_idx").on(table.effectiveness),
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

// Deep Journaling Types
export type InsertJournalingThread = typeof journalingThreads.$inferInsert;
export type JournalingThread = typeof journalingThreads.$inferSelect;

export type InsertThreadExchange = typeof threadExchanges.$inferInsert;
export type ThreadExchange = typeof threadExchanges.$inferSelect;

export type InsertPsychologicalProfile = typeof psychologicalProfile.$inferInsert;
export type PsychologicalProfile = typeof psychologicalProfile.$inferSelect;

export type InsertEmotionalStateHistory = typeof emotionalStateHistory.$inferInsert;
export type EmotionalStateHistory = typeof emotionalStateHistory.$inferSelect;

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

// Voice Clones Schema for ElevenLabs integration
export const voiceClones = pgTable("voice_clones", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  voiceId: varchar("voice_id").notNull().unique(), // ElevenLabs voice ID
  voiceName: varchar("voice_name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("voice_clones_user_idx").on(table.userId),
  index("voice_clones_voice_id_idx").on(table.voiceId),
]);

// Affirmation Audio Schema for storing generated voice files
export const affirmationAudio = pgTable("affirmation_audio", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  affirmationId: integer("affirmation_id").references(() => savedPhrases.id),
  voiceId: varchar("voice_id").notNull(), // ElevenLabs voice ID used
  audioUrl: varchar("audio_url"), // CDN URL for the audio file
  charactersUsed: integer("characters_used").notNull(),
  cost: decimal("cost", { precision: 8, scale: 6 }).notNull(),
  duration: integer("duration"), // Audio duration in seconds
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("affirmation_audio_user_idx").on(table.userId),
  index("affirmation_audio_affirmation_idx").on(table.affirmationId),
]);

export type InsertVoiceClone = typeof voiceClones.$inferInsert;
export type VoiceClone = typeof voiceClones.$inferSelect;
export type InsertAffirmationAudio = typeof affirmationAudio.$inferInsert;
export type AffirmationAudio = typeof affirmationAudio.$inferSelect;

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

export type InsertGeneratedImage = typeof generatedImages.$inferInsert;
export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertVisionBoardItem = typeof visionBoardItems.$inferInsert;
export type VisionBoardItem = typeof visionBoardItems.$inferSelect;

// ===================================
// THERAPEUTIC CHAT SYSTEM - INDEPENDENT MODULE  
// ===================================

// Therapeutic Chat Sessions - Dedicated table for therapeutic conversations
export const therapeuticChatSessions = pgTable("therapeutic_chat_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  sessionType: varchar("session_type").default("general"), // general, anxiety, depression, relationships
  conversationStyle: varchar("conversation_style").default("socratic"), // socratic, directive, reflective, collaborative
  focusArea: varchar("focus_area").default("general"), // general, emotions, relationships, work, personal_growth
  responseLength: varchar("response_length").default("balanced"), // concise, balanced, detailed
  isActive: boolean("is_active").default(true),
  messageCount: integer("message_count").default(0),
  lastActivity: timestamp("last_activity"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("therapeutic_chat_sessions_user_idx").on(table.userId),
  index("therapeutic_chat_sessions_active_idx").on(table.isActive),
  index("therapeutic_chat_sessions_last_activity_idx").on(table.lastActivity),
]);

// Therapeutic Chat Messages - Individual messages in conversations
export const therapeuticChatMessages = pgTable("therapeutic_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => therapeuticChatSessions.id, { onDelete: "cascade" }),
  messageType: varchar("message_type").notNull(), // user, ai
  content: text("content").notNull(),
  emotionalTone: varchar("emotional_tone"), // welcoming, supportive, challenging, reflective
  aiAnalysis: jsonb("ai_analysis"), // AI's professional analysis (if applicable)
  aiQuestion: text("ai_question"), // Follow-up question from AI (if applicable)
  actionType: varchar("action_type"), // go_deeper, new_direction, regular, customize_response
  processingTime: integer("processing_time"), // Response time in milliseconds
  tokens: integer("tokens"), // Token count for AI responses
  cost: decimal("cost", { precision: 10, scale: 6 }), // Cost of API call
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("therapeutic_chat_messages_session_idx").on(table.sessionId),
  index("therapeutic_chat_messages_type_idx").on(table.messageType),
  index("therapeutic_chat_messages_created_at_idx").on(table.createdAt),
]);

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

// Multi-Dimensional User Modeling Types
export type InsertUserTherapeuticProfile = typeof userTherapeuticProfile.$inferInsert;
export type UserTherapeuticProfile = typeof userTherapeuticProfile.$inferSelect;

export type InsertTherapeuticInteractionAnalysis = typeof therapeuticInteractionAnalysis.$inferInsert;
export type TherapeuticInteractionAnalysis = typeof therapeuticInteractionAnalysis.$inferSelect;

export type InsertUserCommunicationPatterns = typeof userCommunicationPatterns.$inferInsert;
export type UserCommunicationPatterns = typeof userCommunicationPatterns.$inferSelect;

export type InsertPersonalizationInsights = typeof personalizationInsights.$inferInsert;
export type PersonalizationInsights = typeof personalizationInsights.$inferSelect;

// ===================================
// AI INTELLIGENCE LAYER SCHEMA
// ===================================

// AI Learning Data for continuous improvement
export const aiLearningData = pgTable("ai_learning_data", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  requestType: varchar("request_type").notNull(),
  inputHash: varchar("input_hash").notNull(),
  userInput: text("user_input").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  aiResponse: text("ai_response").notNull(),
  userFeedback: integer("user_feedback"), // 1-5 rating
  wasSuccessful: boolean("was_successful").default(true),
  learningPoints: text("learning_points"), // JSON string of learning insights
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ai_learning_data_user_idx").on(table.userId),
  index("ai_learning_data_type_idx").on(table.requestType),
  index("ai_learning_data_feedback_idx").on(table.userFeedback),
  uniqueIndex("ai_learning_data_unique_idx").on(table.inputHash, table.userId),
]);

// AI Model Performance Tracking
export const aiModelPerformance = pgTable("ai_model_performance", {
  id: serial("id").primaryKey(),
  modelName: varchar("model_name").notNull(),
  provider: varchar("provider").notNull(), // local, openai, anthropic
  requestType: varchar("request_type").notNull(),
  
  // Performance Metrics
  totalRequests: integer("total_requests").default(0),
  successfulRequests: integer("successful_requests").default(0),
  averageResponseTime: integer("average_response_time").default(0), // milliseconds
  averageCost: decimal("average_cost", { precision: 10, scale: 8 }).default("0"),
  averageUserRating: real("average_user_rating").default(0), // 0-5 scale
  
  // Quality Metrics
  cacheHitRate: real("cache_hit_rate").default(0), // percentage
  errorRate: real("error_rate").default(0), // percentage
  userSatisfactionScore: real("user_satisfaction_score").default(0), // 0-100
  
  // Optimization Data
  optimalComplexityRange: varchar("optimal_complexity_range"), // simple, moderate, complex
  recommendedUsage: text("recommended_usage"),
  limitations: text("limitations"),
  
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("ai_model_performance_model_idx").on(table.modelName),
  index("ai_model_performance_provider_idx").on(table.provider),
  index("ai_model_performance_rating_idx").on(table.averageUserRating),
  uniqueIndex("ai_model_performance_unique_idx").on(table.modelName, table.provider, table.requestType),
]);

// AI Intelligence Layer Types (using existing tables for cache and tracking)
export type InsertAiLearningData = typeof aiLearningData.$inferInsert;
export type AiLearningData = typeof aiLearningData.$inferSelect;

export type InsertAiModelPerformance = typeof aiModelPerformance.$inferInsert;
export type AiModelPerformance = typeof aiModelPerformance.$inferSelect;

// Knowledge Sources for advanced learning system
export const knowledgeSources = pgTable("knowledge_sources", {
  id: varchar("id").primaryKey(),
  type: varchar("type").notNull(), // 'web_research', 'uploaded_document', 'academic_paper', 'clinical_study'
  discipline: varchar("discipline").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  content: text("content").notNull(),
  processedContent: text("processed_content"),
  author: varchar("author"),
  publishDate: timestamp("publish_date"),
  credibilityScore: decimal("credibility_score", { precision: 3, scale: 2 }).notNull(),
  relevanceScore: decimal("relevance_score", { precision: 3, scale: 2 }).notNull(),
  citations: integer("citations"),
  peerReviewed: boolean("peer_reviewed").default(false),
  source: varchar("source").notNull(),
  bunnyNetUrl: text("bunny_net_url"),
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Extracted Knowledge from sources
export const extractedKnowledge = pgTable("extracted_knowledge", {
  id: serial("id").primaryKey(),
  sourceId: varchar("source_id").notNull().references(() => knowledgeSources.id),
  keyPoints: text("key_points").array(),
  therapeuticTechniques: text("therapeutic_techniques").array(),
  evidenceBased: boolean("evidence_based").default(false),
  applicableScenarios: text("applicable_scenarios").array(),
  contraindications: text("contraindications").array(),
  clinicalEvidence: text("clinical_evidence").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Model Training Data
export const modelTrainingData = pgTable("model_training_data", {
  id: serial("id").primaryKey(),
  modelName: varchar("model_name").notNull(),
  discipline: varchar("discipline").notNull(),
  inputText: text("input_text").notNull(),
  expectedOutput: text("expected_output").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(),
  sourceId: varchar("source_id").references(() => knowledgeSources.id),
  isValidated: boolean("is_validated").default(false),
  performanceScore: decimal("performance_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Research Queries for autonomous research
export const researchQueries = pgTable("research_queries", {
  id: serial("id").primaryKey(),
  topic: varchar("topic").notNull(),
  discipline: varchar("discipline").notNull(),
  keywords: text("keywords").array(),
  dateRangeStart: timestamp("date_range_start"),
  dateRangeEnd: timestamp("date_range_end"),
  sourceTypes: text("source_types").array(),
  maxResults: integer("max_results").default(10),
  status: varchar("status").default('pending'), // 'pending', 'in_progress', 'completed', 'failed'
  resultsFound: integer("results_found").default(0),
  lastExecuted: timestamp("last_executed"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge Integration Tracking
export const knowledgeIntegration = pgTable("knowledge_integration", {
  id: serial("id").primaryKey(),
  sourceId: varchar("source_id").notNull().references(() => knowledgeSources.id),
  modelName: varchar("model_name").notNull(),
  integratedAt: timestamp("integrated_at").defaultNow(),
  performanceImprovement: decimal("performance_improvement", { precision: 5, scale: 4 }),
  validatedInPractice: boolean("validated_in_practice").default(false),
  userFeedbackScore: decimal("user_feedback_score", { precision: 3, scale: 2 }),
  effectivenessRating: decimal("effectiveness_rating", { precision: 3, scale: 2 }),
});

export type InsertKnowledgeSource = typeof knowledgeSources.$inferInsert;
export type KnowledgeSource = typeof knowledgeSources.$inferSelect;
export type InsertExtractedKnowledge = typeof extractedKnowledge.$inferInsert;
export type ExtractedKnowledge = typeof extractedKnowledge.$inferSelect;
export type InsertModelTrainingData = typeof modelTrainingData.$inferInsert;
export type ModelTrainingData = typeof modelTrainingData.$inferSelect;
export type InsertResearchQuery = typeof researchQueries.$inferInsert;
export type ResearchQuery = typeof researchQueries.$inferSelect;
export type InsertKnowledgeIntegration = typeof knowledgeIntegration.$inferInsert;
export type KnowledgeIntegration = typeof knowledgeIntegration.$inferSelect;

// Therapeutic Chat System Types
export type InsertTherapeuticChatSession = typeof therapeuticChatSessions.$inferInsert;
export type TherapeuticChatSession = typeof therapeuticChatSessions.$inferSelect;
export type InsertTherapeuticChatMessage = typeof therapeuticChatMessages.$inferInsert;
export type TherapeuticChatMessage = typeof therapeuticChatMessages.$inferSelect;

// Therapeutic Chat Insert Schemas
export const insertTherapeuticChatSessionSchema = createInsertSchema(therapeuticChatSessions).omit({ id: true });
export const insertTherapeuticChatMessageSchema = createInsertSchema(therapeuticChatMessages).omit({ id: true });
