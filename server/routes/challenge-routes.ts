import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { createInsertSchema } from "drizzle-zod";
import { challengeCompletions } from "@shared/schema";
import { z } from "zod";
import { getAllChallengeTypes } from "@shared/challenge-types";

const insertChallengeCompletionSchema = createInsertSchema(challengeCompletions);
type InsertChallengeCompletion = z.infer<typeof insertChallengeCompletionSchema>;

export function registerChallengeRoutes(app: Express) {
  // Get all available challenge types
  app.get('/api/challenges/types', async (req: any, res) => {
    try {
      const challengeTypes = getAllChallengeTypes();
      res.json(challengeTypes);
    } catch (error) {
      console.error("Error fetching challenge types:", error);
      res.status(500).json({ message: "Failed to fetch challenge types" });
    }
  });

  // Get user's active challenges
  app.get('/api/challenges/user-challenges', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Challenge route - req.user:", req.user);
      console.log("Challenge route - req.isAuthenticated():", req.isAuthenticated?.());
      
      const userId = req.user.claims.sub;
      console.log("Challenge route - userId:", userId);
      
      const userChallenges = await storage.getUserChallenges(userId);
      console.log("Challenge route - userChallenges:", userChallenges);
      
      res.json(userChallenges);
    } catch (error) {
      console.error("Error fetching user challenges:", error);
      res.status(500).json({ message: "Failed to fetch user challenges" });
    }
  });

  // Start a new challenge
  app.post('/api/challenges/select', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType } = req.body;
      
      if (!challengeType) {
        return res.status(400).json({ message: "Challenge type is required" });
      }

      // Check if user already has this challenge
      const existingProgress = await storage.getUserProgressForChallenge(userId, challengeType);
      if (existingProgress) {
        return res.status(400).json({ message: "You are already participating in this challenge" });
      }

      // Create new challenge progress
      const progress = await storage.createUserProgress({
        userId,
        challengeType,
        currentDay: 1,
        completedDays: [],
        streakCount: 0,
        lastActivityDate: new Date().toISOString().split('T')[0]
      });

      res.json(progress);
    } catch (error) {
      console.error("Error starting challenge:", error);
      res.status(500).json({ message: "Failed to start challenge" });
    }
  });

  // Quit a challenge
  app.delete('/api/challenges/quit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType } = req.body;
      
      if (!challengeType) {
        return res.status(400).json({ message: "Challenge type is required" });
      }

      await storage.quitChallenge(userId, challengeType);
      res.json({ message: "Challenge quit successfully" });
    } catch (error) {
      console.error("Error quitting challenge:", error);
      res.status(500).json({ message: "Failed to quit challenge" });
    }
  });

  // Get all user completions
  app.get('/api/challenges/completions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const completions = await storage.getUserCompletions(userId);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching completions:", error);
      res.status(500).json({ message: "Failed to fetch completions" });
    }
  });
  // Complete a challenge day
  app.post('/api/challenge/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { day, challengeType, timeSpent, rating, notes } = req.body;
      
      if (day === undefined || day === null || !challengeType) {
        return res.status(400).json({ message: "Day and challenge type are required" });
      }

      // Check if already completed
      const existingCompletion = await storage.getDayCompletion(userId, day, challengeType);
      if (existingCompletion) {
        return res.json(existingCompletion);
      }

      const completion = await storage.createChallengeCompletion({
        userId,
        day,
        challengeType,
        timeSpent: timeSpent || 0,
        rating: rating || 5,
        completedAt: new Date()
      });

      // Update user progress
      const userProgress = await storage.getUserProgressForChallenge(userId, challengeType);
      if (userProgress) {
        const completedDays = [...((userProgress.completedDays as number[]) || [])];
        if (!completedDays.includes(day)) {
          completedDays.push(day);
        }
        
        const currentStreak = calculateStreak(completedDays);
        const lastCompletedDay = Math.max(...completedDays);
        
        await storage.updateChallengeProgress(userId, challengeType, {
          currentDay: Math.max(lastCompletedDay, userProgress.currentDay || 1),
          completedDays,
          streakCount: currentStreak,
          lastActivityDate: new Date().toISOString()
        });
      }

      res.json(completion);
    } catch (error) {
      console.error("Error completing challenge:", error);
      res.status(500).json({ message: "Failed to complete challenge" });
    }
  });

  // Get challenge completion status
  app.get('/api/challenge/completion/:day', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const day = parseInt(req.params.day);
      const challengeType = req.query.challengeType as string;
      
      const completion = await storage.getDayCompletion(userId, day, challengeType);
      res.json(completion);
    } catch (error) {
      console.error("Error fetching completion:", error);
      res.status(500).json({ message: "Failed to fetch completion status" });
    }
  });

  // Get all user completions
  app.get('/api/challenge/completions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const completions = await storage.getUserCompletions(userId);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching completions:", error);
      res.status(500).json({ message: "Failed to fetch completions" });
    }
  });
}

function calculateStreak(completedDays: number[]): number {
  if (completedDays.length === 0) return 0;
  
  const sortedDays = [...completedDays].sort((a, b) => b - a);
  let streak = 1;
  
  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i-1] - sortedDays[i] === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}