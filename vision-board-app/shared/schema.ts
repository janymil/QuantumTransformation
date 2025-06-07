import { pgTable, serial, varchar, text, timestamp, boolean, jsonb, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Vision Board Tables (vb_ prefix for separation)

// Vision Boards
export const visionBoards = pgTable("vb_vision_boards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").default("active"), // active, archived, template
  canvasData: jsonb("canvas_data").notNull(), // stores board layout, images, positions
  lifeAreas: jsonb("life_areas").notNull(), // ["health", "finances", "relationships"]
  isAiGenerated: boolean("is_ai_generated").default(false),
  templateCategory: varchar("template_category"),
  backgroundColor: varchar("background_color").default("#ffffff"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("vb_vision_boards_user_idx").on(table.userId),
  index("vb_vision_boards_status_idx").on(table.status),
]);

// Vision Board Images
export const visionBoardImages = pgTable("vb_vision_board_images", {
  id: serial("id").primaryKey(),
  visionBoardId: integer("vision_board_id").notNull().references(() => visionBoards.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  altText: varchar("alt_text"),
  position: jsonb("position").notNull(), // {x, y, width, height, rotation, zIndex}
  lifeArea: varchar("life_area"), // health, finances, relationships, etc.
  isAiGenerated: boolean("is_ai_generated").default(false),
  sourceType: varchar("source_type").default("upload"), // upload, ai, url, template
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("vb_vision_board_images_board_idx").on(table.visionBoardId),
]);

// Affirmations
export const visionBoardAffirmations = pgTable("vb_affirmations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  visionBoardId: integer("vision_board_id").references(() => visionBoards.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  lifeArea: varchar("life_area").notNull(),
  isPersonalized: boolean("is_personalized").default(false),
  isActive: boolean("is_active").default(true),
  source: varchar("source").default("ai"), // ai, user, template
  emotionalTone: varchar("emotional_tone"), // confident, grateful, excited, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("vb_affirmations_user_idx").on(table.userId),
  index("vb_affirmations_life_area_idx").on(table.lifeArea),
]);

// Daily Rituals
export const dailyRituals = pgTable("vb_daily_rituals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  visionBoardId: integer("vision_board_id").notNull().references(() => visionBoards.id),
  date: timestamp("date").notNull(),
  completed: boolean("completed").default(false),
  duration: integer("duration"), // in seconds
  affirmationsUsed: jsonb("affirmations_used"), // array of affirmation IDs
  emotionalState: varchar("emotional_state"), // before/after ritual
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("vb_daily_rituals_user_date_idx").on(table.userId, table.date),
]);

// Evening Reflections
export const eveningReflections = pgTable("vb_evening_reflections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").notNull(),
  question: text("question").notNull(),
  response: text("response"),
  emotionalTone: varchar("emotional_tone"),
  insights: text("insights"), // AI-generated insights
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("vb_evening_reflections_user_idx").on(table.userId),
]);

// User Progress Tracking
export const userProgress = pgTable("vb_user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  totalDaysActive: integer("total_days_active").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalRitualsCompleted: integer("total_rituals_completed").default(0),
  totalReflectionsCompleted: integer("total_reflections_completed").default(0),
  lifeAreasProgress: jsonb("life_areas_progress"), // progress per life area
  milestones: jsonb("milestones"), // achieved milestones
  lastRitualDate: timestamp("last_ritual_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("vb_user_progress_user_idx").on(table.userId),
]);

// Life Area Templates
export const lifeAreaTemplates = pgTable("vb_life_area_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(), // health, finances, relationships, career, spirituality, personal_growth
  description: text("description"),
  defaultImages: jsonb("default_images"), // array of default image URLs
  defaultAffirmations: jsonb("default_affirmations"),
  suggestedQuestions: jsonb("suggested_questions"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("vb_life_area_templates_category_idx").on(table.category),
]);

// AI Generation History
export const aiGenerationHistory = pgTable("vb_ai_generation_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  generationType: varchar("generation_type").notNull(), // vision_board, affirmation, image, reflection
  inputData: jsonb("input_data"), // user's input data used for generation
  outputData: jsonb("output_data"), // AI's generated content
  tokensUsed: integer("tokens_used"),
  cost: varchar("cost"), // cost in credits/dollars
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("vb_ai_generation_history_user_idx").on(table.userId),
  index("vb_ai_generation_history_type_idx").on(table.generationType),
]);

// Export types
export type VisionBoard = typeof visionBoards.$inferSelect;
export type InsertVisionBoard = typeof visionBoards.$inferInsert;
export type VisionBoardImage = typeof visionBoardImages.$inferSelect;
export type InsertVisionBoardImage = typeof visionBoardImages.$inferInsert;
export type VisionBoardAffirmation = typeof visionBoardAffirmations.$inferSelect;
export type InsertVisionBoardAffirmation = typeof visionBoardAffirmations.$inferInsert;
export type DailyRitual = typeof dailyRituals.$inferSelect;
export type InsertDailyRitual = typeof dailyRituals.$inferInsert;
export type EveningReflection = typeof eveningReflections.$inferSelect;
export type InsertEveningReflection = typeof eveningReflections.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;
export type LifeAreaTemplate = typeof lifeAreaTemplates.$inferSelect;
export type InsertLifeAreaTemplate = typeof lifeAreaTemplates.$inferInsert;
export type AiGenerationHistory = typeof aiGenerationHistory.$inferSelect;
export type InsertAiGenerationHistory = typeof aiGenerationHistory.$inferInsert;

// Zod schemas for validation
export const insertVisionBoardSchema = createInsertSchema(visionBoards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAffirmationSchema = createInsertSchema(visionBoardAffirmations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyRitualSchema = createInsertSchema(dailyRituals).omit({
  id: true,
  createdAt: true,
});

export const insertEveningReflectionSchema = createInsertSchema(eveningReflections).omit({
  id: true,
  createdAt: true,
});

// Life areas enum
export const LIFE_AREAS = [
  "health",
  "finances", 
  "relationships",
  "career",
  "spirituality",
  "personal_growth"
] as const;

export type LifeArea = typeof LIFE_AREAS[number];