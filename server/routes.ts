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
import { 
  validateAIRequest, 
  getCachedResponse, 
  cacheResponse, 
  trackUsage,
  createInputHash,
  getUserAIStats 
} from "./ai-cost-control";
import { generateAIExplanation, analyzeJournalEntries, generatePersonalizedCoaching } from "./openai";
import { registerGamificationRoutes } from "./routes/gamification-routes";
import { generatePersonalizedAffirmation } from "./openai";
import { initializeUserGamification } from "./gamification";

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
        
        // Initialize gamification for the default challenge
        await initializeUserGamification(userId, "general_quantum");
        
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
  registerGamificationRoutes(app);

  // AI Routes with Global Caching System
  app.post("/api/ai/explain", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { topic, day, userQuestion, challengeType, userTier = 'basic' } = req.body;

      const inputHash = createInputHash(userQuestion || topic, 'explanation', challengeType, day);

      const validation = await validateAIRequest({
        userId,
        requestType: 'explanation',
        input: userQuestion || topic,
        challengeType,
        day,
        userTier
      });

      if (!validation.allowed) {
        return res.status(429).json({ 
          error: validation.reason,
          remainingRequests: validation.remainingRequests 
        });
      }

      // Check global cache first
      const cachedResponse = await getCachedResponse(inputHash);
      if (cachedResponse) {
        await trackUsage(userId, 'explanation', inputHash, 0, 0);
        return res.json({
          ...cachedResponse,
          fromCache: true,
          remainingRequests: validation.remainingRequests
        });
      }

      // Generate new AI response
      const aiResponse = await generateAIExplanation({
        topic: topic || challengeType,
        day,
        userQuestion,
        context: `Challenge: ${challengeType}, Day: ${day}`
      });

      const tokensUsed = Math.ceil((userQuestion?.length || 0) / 4) + Math.ceil(JSON.stringify(aiResponse).length / 4);
      const cost = Math.ceil(tokensUsed * 0.00002 * 100);

      await cacheResponse(inputHash, 'explanation', aiResponse, userId, challengeType, day, tokensUsed);
      await trackUsage(userId, 'explanation', inputHash, tokensUsed, cost);

      res.json({
        ...aiResponse,
        fromCache: false,
        tokensUsed,
        remainingRequests: validation.remainingRequests
      });

    } catch (error) {
      console.error("AI explanation error:", error);
      res.status(500).json({ error: "Failed to generate AI explanation" });
    }
  });

  // AI Usage Statistics endpoint
  app.get("/api/ai/usage-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await getUserAIStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Usage stats error:", error);
      res.status(500).json({ error: "Failed to get usage statistics" });
    }
  });

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

  // AI personalized affirmation endpoint
  app.post('/api/ai/personalized-affirmation', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Generating personalized affirmation with request:", req.body);
      const request = req.body;
      const affirmation = await generatePersonalizedAffirmation(request);
      console.log("Generated affirmation:", affirmation);
      res.json({ affirmation });
    } catch (error) {
      console.error("Error generating personalized affirmation:", error);
      res.status(500).json({ message: "Failed to generate affirmation", error: error.message });
    }
  });

  // Test endpoint for affirmation generation (remove in production)
  app.post('/api/test/personalized-affirmation', async (req: any, res) => {
    try {
      console.log("Test generating personalized affirmation with request:", req.body);
      const request = req.body;
      const affirmation = await generatePersonalizedAffirmation(request);
      console.log("Test generated affirmation:", affirmation);
      res.json({ affirmation });
    } catch (error) {
      console.error("Test error generating personalized affirmation:", error);
      res.status(500).json({ message: "Failed to generate affirmation", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}