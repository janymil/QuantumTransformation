import { pgTable, serial, varchar, text, jsonb, integer, decimal, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./schema";

// AI Interaction History with detailed analytics tracking
export const aiInteractionHistory = pgTable("ai_interaction_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionType: varchar("session_type").notNull(), // 'coaching', 'explanation', 'guidance', 'breakthrough'
  userInput: text("user_input").notNull(),
  aiResponse: jsonb("ai_response").notNull(),
  challengeType: varchar("challenge_type"),
  day: integer("day"),
  
  // Analytics fields
  modelUsed: varchar("model_used").notNull(), // 'gpt-4o', 'gpt-4o-mini', 'claude-3-sonnet'
  tokenCount: integer("token_count").default(0),
  cost: decimal("cost", { precision: 10, scale: 6 }).default("0"),
  responseTime: integer("response_time").default(0), // milliseconds
  responseQuality: integer("response_quality").default(8), // 1-10 scale
  
  // User interaction fields
  isFavorited: boolean("is_favorited").default(false),
  userFeedback: text("user_feedback"),
  rating: integer("rating"), // 1-5 user rating
  isArchived: boolean("is_archived").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ai_interaction_user_idx").on(table.userId),
  index("ai_interaction_session_type_idx").on(table.sessionType),
  index("ai_interaction_challenge_type_idx").on(table.challengeType),
  index("ai_interaction_model_idx").on(table.modelUsed),
  index("ai_interaction_created_at_idx").on(table.createdAt),
]);

export type InsertAiInteraction = typeof aiInteractionHistory.$inferInsert;
export type AiInteraction = typeof aiInteractionHistory.$inferSelect;