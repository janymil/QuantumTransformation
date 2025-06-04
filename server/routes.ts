import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateAIExplanation, analyzeJournalEntries, generateDailyAffirmation } from "./openai";
import { insertUserProgressSchema, insertChallengeCompletionSchema, insertJournalEntrySchema, insertSavedPhraseSchema, insertAiChatSessionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Test endpoint without auth to verify server is working
  app.get('/api/test', async (req: any, res) => {
    res.json({ message: "Server is working", timestamp: new Date().toISOString() });
  });

  // User progress routes
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let progress = await storage.getUserProgress(userId);
      
      if (!progress) {
        progress = await storage.createUserProgress({
          userId,
          currentDay: 1,
          completedDays: [],
          streakCount: 0,
        });
      }
      
      const completions = await storage.getUserCompletions(userId);
      const achievements = await storage.getUserAchievements(userId);
      
      res.json({
        progress,
        completions,
        achievements,
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.patch('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = insertUserProgressSchema.partial().parse(req.body);
      
      const updatedProgress = await storage.updateUserProgress(userId, updates);
      res.json(updatedProgress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Challenge completion routes
  app.post('/api/challenges/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const completionData = insertChallengeCompletionSchema.parse({
        ...req.body,
        userId,
      });
      
      // Check if already completed
      const existing = await storage.getDayCompletion(userId, completionData.day);
      if (existing) {
        return res.status(400).json({ message: "Day already completed" });
      }
      
      const completion = await storage.createChallengeCompletion(completionData);
      
      // Update user progress
      const progress = await storage.getUserProgress(userId);
      if (progress) {
        const completedDays = [...(progress.completedDays as number[] || []), completionData.day];
        const newCurrentDay = Math.max(completionData.day + 1, progress.currentDay ?? 0);
        
        // Calculate streak
        const today = new Date().toISOString().split('T')[0];
        const streakCount = progress.lastActivityDate === today ? (progress.streakCount ?? 0) : (progress.streakCount ?? 0) + 1;
        
        await storage.updateUserProgress(userId, {
          completedDays,
          currentDay: newCurrentDay,
          streakCount,
          lastActivityDate: today,
        });
        
        // Check for achievements
        await checkAndUnlockAchievements(userId, completedDays.length, streakCount);
      }
      
      res.json(completion);
    } catch (error) {
      console.error("Error completing challenge:", error);
      res.status(500).json({ message: "Failed to complete challenge" });
    }
  });

  // Journal routes
  app.get('/api/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { day } = req.query;
      
      if (day) {
        const entry = await storage.getJournalEntry(userId, parseInt(day as string));
        res.json(entry);
      } else {
        const entries = await storage.getUserJournalEntries(userId);
        res.json(entries);
      }
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.post('/api/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryData = insertJournalEntrySchema.parse({
        ...req.body,
        userId,
      });
      
      // Check if entry exists, update if so
      const existing = await storage.getJournalEntry(userId, entryData.day);
      if (existing) {
        const updated = await storage.updateJournalEntry(userId, entryData.day, entryData);
        res.json(updated);
      } else {
        const entry = await storage.createJournalEntry(entryData);
        res.json(entry);
      }
    } catch (error) {
      console.error("Error saving journal entry:", error);
      res.status(500).json({ message: "Failed to save journal entry" });
    }
  });

  app.post('/api/journal/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getUserJournalEntries(userId);
      
      if (entries.length === 0) {
        return res.status(400).json({ message: "No journal entries to analyze" });
      }
      
      const analysis = await analyzeJournalEntries({
        entries: entries.map(entry => ({
          day: entry.day,
          experience: entry.experience || "",
          insights: entry.insights || "",
          intention: entry.intention || "",
        }))
      });
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing journal:", error);
      res.status(500).json({ message: "Failed to analyze journal entries" });
    }
  });

  // Saved phrases routes
  app.get('/api/phrases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const phrases = await storage.getUserSavedPhrases(userId);
      res.json(phrases);
    } catch (error) {
      console.error("Error fetching saved phrases:", error);
      res.status(500).json({ message: "Failed to fetch saved phrases" });
    }
  });

  app.post('/api/phrases', isAuthenticated, async (req: any, res) => {
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

  app.delete('/api/phrases/:id', isAuthenticated, async (req: any, res) => {
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

  // AI assistant routes
  app.post('/api/ai/explain', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { topic, day, userQuestion, context } = req.body;
      
      if (!topic || !day) {
        return res.status(400).json({ message: "Topic and day are required" });
      }
      
      const explanation = await generateAIExplanation({
        topic,
        day: parseInt(day),
        userQuestion,
        context,
      });
      
      // Save the chat session
      await storage.createAiChatSession({
        userId,
        day: parseInt(day),
        question: userQuestion || `Explain: ${topic}`,
        response: explanation.explanation,
      });
      
      res.json(explanation);
    } catch (error) {
      console.error("Error generating AI explanation:", error);
      res.status(500).json({ message: "Failed to generate explanation" });
    }
  });

  app.post('/api/ai/affirmation', isAuthenticated, async (req: any, res) => {
    try {
      const { day, userGoals } = req.body;
      
      if (!day) {
        return res.status(400).json({ message: "Day is required" });
      }
      
      const affirmation = await generateDailyAffirmation(parseInt(day), userGoals);
      res.json({ affirmation });
    } catch (error) {
      console.error("Error generating affirmation:", error);
      res.status(500).json({ message: "Failed to generate affirmation" });
    }
  });

  app.get('/api/ai/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { day } = req.query;
      
      const sessions = await storage.getUserAiChatSessions(
        userId, 
        day ? parseInt(day as string) : undefined
      );
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching AI chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Settings routes
  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let settings = await storage.getUserSettings(userId);
      
      if (!settings) {
        settings = await storage.upsertUserSettings(userId, {});
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      const settings = await storage.upsertUserSettings(userId, updates);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Achievement checking helper
  async function checkAndUnlockAchievements(userId: string, completedCount: number, streakCount: number) {
    const existingAchievements = await storage.getUserAchievements(userId);
    const existingIds = existingAchievements.map(a => a.achievementId);
    
    const achievements = [
      { id: "first_step", requirement: completedCount >= 1, name: "First Step" },
      { id: "week_warrior", requirement: completedCount >= 7, name: "Week Warrior" },
      { id: "halfway_hero", requirement: completedCount >= 15, name: "Halfway Hero" },
      { id: "quantum_master", requirement: completedCount >= 30, name: "Quantum Master" },
      { id: "streak_3", requirement: streakCount >= 3, name: "3-Day Streak" },
      { id: "streak_7", requirement: streakCount >= 7, name: "7-Day Streak" },
      { id: "streak_21", requirement: streakCount >= 21, name: "Habit Master" },
    ];
    
    for (const achievement of achievements) {
      if (achievement.requirement && !existingIds.includes(achievement.id)) {
        await storage.createUserAchievement({
          userId,
          achievementId: achievement.id,
        });
      }
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
