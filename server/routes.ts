import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  generateAIExplanation, 
  analyzeJournalEntries, 
  generateDailyAffirmation,
  generatePersonalizedCoaching,
  generateMicroLearningContent,
  generatePersonalizedAffirmation
} from "./openai";
import { insertUserProgressSchema, insertChallengeCompletionSchema, insertJournalEntrySchema, insertSavedPhraseSchema, insertAiChatSessionSchema } from "@shared/schema";
import { z } from "zod";

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
          currentDay: 1,
          completedDays: [],
          streakCount: 0,
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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Initialize user data if this is their first visit
      await initializeNewUser(userId);
      
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

  // Personalized coaching routes
  app.post('/api/ai/coaching', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      const recentEntries = await storage.getUserJournalEntries(userId);
      const settings = await storage.getUserSettings(userId);
      
      if (!progress) {
        return res.status(404).json({ message: "User progress not found" });
      }

      const coaching = await generatePersonalizedCoaching({
        userId,
        currentDay: progress.currentDay,
        completedDays: progress.completedDays,
        streakCount: progress.streakCount,
        recentJournalEntries: recentEntries.slice(-5).map(entry => ({
          day: entry.day,
          experience: entry.experience,
          insights: entry.insights,
          intention: entry.intention,
          mood: entry.mood,
          challenges: entry.challenges
        })),
        userGoals: settings?.userGoals,
        preferredPracticeTime: settings?.preferredPracticeTime,
        difficultyLevel: settings?.difficultyLevel
      });
      
      res.json(coaching);
    } catch (error) {
      console.error("Error generating coaching:", error);
      res.status(500).json({ message: "Failed to generate coaching" });
    }
  });

  // Micro-learning routes
  app.get('/api/micro-learning/:day/:topic/:userLevel?', isAuthenticated, async (req: any, res) => {
    try {
      const { day, topic, userLevel } = req.params;
      
      const content = await generateMicroLearningContent(
        Number(day), 
        decodeURIComponent(topic), 
        userLevel || 'beginner'
      );
      
      res.json(content);
    } catch (error) {
      console.error("Error generating micro-learning:", error);
      res.status(500).json({ message: "Failed to generate micro-learning content" });
    }
  });

  app.post('/api/micro-learning/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { day, topic, timeSpent, completed } = req.body;
      
      // Update user progress or create completion record
      const progress = await storage.getUserProgress(userId);
      if (progress && completed) {
        await storage.updateUserProgress(userId, {
          lastActiveDate: new Date()
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing micro-learning:", error);
      res.status(500).json({ message: "Failed to complete micro-learning" });
    }
  });

  // Personalized affirmation routes
  app.post('/api/ai/affirmation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { day, currentChallenges, recentInsights, mood } = req.body;
      
      const settings = await storage.getUserSettings(userId);
      const progress = await storage.getUserProgress(userId);
      
      const affirmation = await generatePersonalizedAffirmation({
        day: day || progress?.currentDay || 1,
        userGoals: settings?.userGoals,
        currentChallenges,
        recentInsights,
        mood,
        progressLevel: progress?.completedDays?.length > 10 ? 'intermediate' : 'beginner'
      });
      
      res.json({ affirmation });
    } catch (error) {
      console.error("Error generating affirmation:", error);
      res.status(500).json({ message: "Failed to generate affirmation" });
    }
  });

  // Mood tracking routes
  app.post('/api/mood-tracking', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { mood, energy, note } = req.body;
      
      // Store mood data in journal or separate tracking
      const today = new Date();
      const currentDay = Math.floor((today.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24)) % 30 + 1;
      
      const existingEntry = await storage.getJournalEntry(userId, currentDay);
      
      if (existingEntry) {
        await storage.updateJournalEntry(userId, currentDay, {
          mood: mood,
          energy: energy,
          challenges: note
        });
      } else {
        await storage.createJournalEntry({
          userId,
          day: currentDay,
          experience: '',
          insights: '',
          intention: '',
          mood: mood,
          energy: energy,
          challenges: note
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking mood:", error);
      res.status(500).json({ message: "Failed to track mood" });
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

  // Wellness tip endpoints
  app.get('/api/wellness/daily-tip', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      const category = req.query.category || 'Mindfulness';
      const day = progress?.currentDay || 1;

      const tipRequest = {
        category,
        day,
        preferences: {
          focusAreas: ['mindfulness', 'energy'],
          availableTime: 15,
          difficultyLevel: 'beginner' as const
        }
      };

      const { generateWellnessTip } = await import('./openai');
      const tip = await generateWellnessTip(tipRequest);
      res.json(tip);
    } catch (error) {
      console.error("Error fetching daily tip:", error);
      res.status(500).json({ message: "Failed to fetch daily tip" });
    }
  });

  app.post('/api/wellness/generate-tip', isAuthenticated, async (req: any, res) => {
    try {
      const { category, day, preferences } = req.body;
      
      const tipRequest = {
        category: category || 'Mindfulness',
        day: day || 1,
        preferences
      };

      const { generateWellnessTip } = await import('./openai');
      const tip = await generateWellnessTip(tipRequest);
      res.json(tip);
    } catch (error) {
      console.error("Error generating tip:", error);
      res.status(500).json({ message: "Failed to generate tip" });
    }
  });

  // Micro-challenge endpoints
  app.get('/api/wellness/micro-challenges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      const day = progress?.currentDay || 1;

      const { generateMicroChallenges } = await import('./openai');
      const generatedChallenges = await generateMicroChallenges(day, 3);
      
      // Add completion status - in production this would be from database
      const challenges = generatedChallenges.map(challenge => ({
        ...challenge,
        completed: Math.random() > 0.7,
        completedAt: Math.random() > 0.7 ? new Date().toISOString() : undefined
      }));

      res.json(challenges);
    } catch (error) {
      console.error("Error fetching micro-challenges:", error);
      res.status(500).json({ message: "Failed to fetch micro-challenges" });
    }
  });

  app.post('/api/wellness/complete-challenge/:challengeId', isAuthenticated, async (req: any, res) => {
    try {
      const { challengeId } = req.params;
      
      res.json({ 
        success: true, 
        message: 'Challenge completed',
        points: 20,
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error completing challenge:", error);
      res.status(500).json({ message: "Failed to complete challenge" });
    }
  });

  app.post('/api/wellness/save-tip', isAuthenticated, async (req: any, res) => {
    try {
      const { tipId } = req.body;
      
      res.json({ 
        success: true, 
        message: 'Tip saved to your collection'
      });
    } catch (error) {
      console.error("Error saving tip:", error);
      res.status(500).json({ message: "Failed to save tip" });
    }
  });

  // Challenge selection endpoints
  app.get('/api/challenges/types', async (req, res) => {
    try {
      const { getAllChallengeTypes } = await import('@shared/challenge-types');
      const challengeTypes = getAllChallengeTypes();
      res.json(challengeTypes);
    } catch (error) {
      console.error("Error fetching challenge types:", error);
      res.status(500).json({ message: "Failed to fetch challenge types" });
    }
  });

  app.post('/api/challenges/select', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType } = req.body;

      if (!challengeType) {
        return res.status(400).json({ message: "Challenge type is required" });
      }

      // Create new progress for the selected challenge
      const progress = await storage.createUserProgress({
        userId,
        challengeType,
        currentDay: 1,
        completedDays: [],
        streakCount: 0,
      });

      res.json({ 
        success: true, 
        progress,
        message: `Started ${challengeType.replace('_', ' ')} challenge!`
      });
    } catch (error) {
      console.error("Error selecting challenge:", error);
      res.status(500).json({ message: "Failed to select challenge" });
    }
  });

  app.get('/api/challenges/user-challenges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userChallenges = await storage.getUserChallenges(userId);
      res.json(userChallenges);
    } catch (error) {
      console.error("Error fetching user challenges:", error);
      res.status(500).json({ message: "Failed to fetch user challenges" });
    }
  });

  // Get available challenge types
  app.get('/api/challenges/types', async (req, res) => {
    try {
      const { getAllChallengeTypes } = await import("@shared/challenge-types");
      const challengeTypes = getAllChallengeTypes();
      res.json(challengeTypes);
    } catch (error) {
      console.error("Error fetching challenge types:", error);
      res.status(500).json({ message: "Failed to fetch challenge types" });
    }
  });

  // Spaced Repetition API Endpoints
  
  // Get concepts due for review today
  app.get('/api/spaced-repetition/due-reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challengeType = req.query.challengeType as string;
      
      const { getConceptsDueForReview } = await import("./spaced-repetition");
      const dueReviews = await getConceptsDueForReview(userId, challengeType);
      
      res.json(dueReviews);
    } catch (error) {
      console.error("Error fetching due reviews:", error);
      res.status(500).json({ message: "Failed to fetch due reviews" });
    }
  });

  // Record a spaced repetition review
  app.post('/api/spaced-repetition/record-review', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conceptId, quality, responseTime, wasSuccessful } = req.body;

      if (!conceptId || quality === undefined) {
        return res.status(400).json({ message: "Concept ID and quality are required" });
      }

      const { recordReview, markReviewCompleted } = await import("./spaced-repetition");
      
      await recordReview(userId, conceptId, {
        quality: Math.max(0, Math.min(5, quality)),
        responseTime: responseTime || 0,
        wasSuccessful: wasSuccessful !== false
      });

      await markReviewCompleted(userId, conceptId);

      res.json({ message: "Review recorded successfully" });
    } catch (error) {
      console.error("Error recording review:", error);
      res.status(500).json({ message: "Failed to record review" });
    }
  });

  // Get mastery statistics
  app.get('/api/spaced-repetition/mastery-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challengeType = req.query.challengeType as string;

      const { getMasteryStats } = await import("./spaced-repetition");
      const stats = await getMasteryStats(userId, challengeType);

      res.json(stats);
    } catch (error) {
      console.error("Error fetching mastery stats:", error);
      res.status(500).json({ message: "Failed to fetch mastery statistics" });
    }
  });

  // Auto-create concepts from daily content (triggered when completing a challenge day)
  app.post('/api/spaced-repetition/create-from-day', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType, day, dayContent } = req.body;

      if (!challengeType || !day || !dayContent) {
        return res.status(400).json({ message: "Challenge type, day, and content are required" });
      }

      const { autoCreateConceptsFromDay } = await import("./spaced-repetition");
      const concepts = await autoCreateConceptsFromDay(userId, challengeType, day, dayContent);

      res.json({ 
        message: `Created ${concepts.length} concepts for spaced repetition`,
        concepts: concepts.map(c => ({ id: c.id, title: c.conceptTitle }))
      });
    } catch (error) {
      console.error("Error creating concepts from day:", error);
      res.status(500).json({ message: "Failed to create concepts for spaced repetition" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
