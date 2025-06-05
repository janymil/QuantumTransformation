import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserProgressSchema, insertSavedPhraseSchema, insertUserAchievementSchema, insertUserSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { registerAuthRoutes } from "./routes/auth-routes";
import { registerChallengeRoutes } from "./routes/challenge-routes";
import { registerProgressRoutes } from "./routes/progress-routes";
import { registerJournalRoutes } from "./routes/journal-routes";
import { registerAIRoutes } from "./routes/ai-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // User initialization function
  async function initializeNewUser(userId: string) {
    try {
      // Check if user already has progress data
      const existingProgress = await storage.getUserProgress(userId);
      
      if (!existingProgress) {
        // Initialize user progress
        await storage.createUserProgress({
          userId,
          challengeType: "general_quantum",
          currentDay: 1,
          completedDays: [],
          streakCount: 0,
          lastActivityDate: new Date().toISOString().split('T')[0]
        });
        
        // Initialize user settings
        await storage.upsertUserSettings(userId, {
          preferredPracticeTime: 'morning',
          difficultyLevel: 'beginner',
          reminderEnabled: true,
          theme: 'light'
        });
        
        console.log(`Initialized data for new user: ${userId}`);
      }
    } catch (error) {
      console.error("Error initializing new user:", error);
    }
  }

  // Achievement checking function
  async function checkAndUnlockAchievements(userId: string, completedCount: number, streakCount: number) {
    const achievements = [
      { id: 'first_day', name: 'First Step', description: 'Complete your first day', condition: () => completedCount >= 1 },
      { id: 'week_warrior', name: 'Week Warrior', description: 'Complete 7 days', condition: () => completedCount >= 7 },
      { id: 'streak_master', name: 'Streak Master', description: 'Maintain a 7-day streak', condition: () => streakCount >= 7 },
      { id: 'transformation_complete', name: 'Transformation Complete', description: 'Complete the full 30-day journey', condition: () => completedCount >= 30 }
    ];

    for (const achievement of achievements) {
      if (achievement.condition()) {
        const existing = await storage.getUserAchievements(userId);
        const hasAchievement = existing.some(a => a.achievementId === achievement.id);
        
        if (!hasAchievement) {
          await storage.createUserAchievement({
            userId,
            achievementId: achievement.id,
            unlockedAt: new Date()
          });
        }
      }
    }
  }

  // Register modular route handlers
  registerAuthRoutes(app);
  registerChallengeRoutes(app);
  registerProgressRoutes(app);
  registerJournalRoutes(app);
  registerAIRoutes(app);

  // Test endpoint without auth to verify server is working
  app.get('/api/test', async (req: any, res) => {
    res.json({ message: "Server is working", timestamp: new Date().toISOString() });
  });

  // Saved phrases routes
  app.get('/api/saved-phrases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const phrases = await storage.getUserSavedPhrases(userId);
      res.json(phrases);
    } catch (error) {
      console.error("Error fetching saved phrases:", error);
      res.status(500).json({ message: "Failed to fetch saved phrases" });
    }
  });

  app.post('/api/saved-phrases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const phraseData = insertSavedPhraseSchema.parse({
        ...req.body,
        userId,
      });
      
      const phrase = await storage.createSavedPhrase(phraseData);
      res.json(phrase);
    } catch (error) {
      console.error("Error saving phrase:", error);
      res.status(500).json({ message: "Failed to save phrase" });
    }
  });

  app.delete('/api/saved-phrases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const phraseId = parseInt(req.params.id);
      await storage.deleteSavedPhrase(userId, phraseId);
      res.json({ message: "Phrase deleted successfully" });
    } catch (error) {
      console.error("Error deleting phrase:", error);
      res.status(500).json({ message: "Failed to delete phrase" });
    }
  });

  // User settings routes
  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settingsData = insertUserSettingsSchema.partial().parse(req.body);
      const settings = await storage.upsertUserSettings(userId, settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Saved phrases endpoints
  app.get('/api/saved-phrases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const savedPhrases = await storage.getUserSavedPhrases(userId);
      res.json(savedPhrases);
    } catch (error) {
      console.error("Error fetching saved phrases:", error);
      res.status(500).json({ message: "Failed to fetch saved phrases" });
    }
  });

  app.post('/api/saved-phrases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { text, category, day, challengeType } = req.body;
      
      const savedPhrase = await storage.createSavedPhrase({
        userId,
        phrase: text,
        category: category || 'affirmation',
        source: challengeType ? `${challengeType} Day ${day}` : null
      });
      
      res.json(savedPhrase);
    } catch (error) {
      console.error("Error saving phrase:", error);
      res.status(500).json({ message: "Failed to save phrase" });
    }
  });

  app.delete('/api/saved-phrases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const phraseId = parseInt(req.params.id);
      await storage.deleteSavedPhrase(userId, phraseId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting phrase:", error);
      res.status(500).json({ message: "Failed to delete phrase" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}