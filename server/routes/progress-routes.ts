import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { createInsertSchema } from "drizzle-zod";
import { userProgress } from "@shared/schema";
import { z } from "zod";

const insertUserProgressSchema = createInsertSchema(userProgress);
type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export function registerProgressRoutes(app: Express) {
  // Get default progress (for backwards compatibility)
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Get all user progress for all challenges
  app.get('/api/progress/all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allProgress = await storage.getAllUserProgress(userId);
      const completions = await storage.getUserCompletions(userId);
      const achievements = await storage.getUserAchievements(userId);
      
      res.json({ 
        allProgress, 
        completions, 
        achievements 
      });
    } catch (error) {
      console.error("Error fetching all progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Get user progress for specific challenge
  app.get('/api/progress/:challengeType', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challengeType = req.params.challengeType;
      
      const progress = await storage.getUserProgressForChallenge(userId, challengeType);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Start a new challenge
  app.post('/api/progress/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType } = req.body;
      
      if (!challengeType) {
        return res.status(400).json({ message: "Challenge type is required" });
      }

      // Check if challenge already exists
      const existingProgress = await storage.getUserProgressForChallenge(userId, challengeType);
      if (existingProgress) {
        return res.json(existingProgress);
      }

      const newProgress = await storage.createUserProgress({
        userId,
        challengeType,
        currentDay: 1,
        completedDays: [],
        streakCount: 0,
        lastActivityDate: new Date().toISOString().split('T')[0]
      });

      res.json(newProgress);
    } catch (error) {
      console.error("Error starting challenge:", error);
      res.status(500).json({ message: "Failed to start challenge" });
    }
  });

  // Update progress
  app.patch('/api/progress/:challengeType', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challengeType = req.params.challengeType;
      const updates = req.body;
      
      const updatedProgress = await storage.updateChallengeProgress(userId, challengeType, updates);
      res.json(updatedProgress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Quit a challenge
  app.delete('/api/progress/:challengeType/quit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challengeType = req.params.challengeType;
      
      await storage.quitChallenge(userId, challengeType);
      res.json({ message: "Challenge quit successfully" });
    } catch (error) {
      console.error("Error quitting challenge:", error);
      res.status(500).json({ message: "Failed to quit challenge" });
    }
  });

  // Get user challenges overview
  app.get('/api/progress/challenges/overview', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challenges = await storage.getUserChallenges(userId);
      res.json({ challenges });
    } catch (error) {
      console.error("Error fetching challenges overview:", error);
      res.status(500).json({ message: "Failed to fetch challenges overview" });
    }
  });

  // Admin endpoint to unlock all days for a specific challenge
  app.post('/api/admin/progress/unlock-all-days', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType, targetUserId } = req.body;
      
      // Check if current user is admin (your specific ID)
      if (userId !== "43272767") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userToUpdate = targetUserId || userId; // Use current user if no target specified
      
      if (!challengeType) {
        return res.status(400).json({ message: "Challenge type is required" });
      }

      // Get existing progress or create new one
      let progress = await storage.getUserProgressForChallenge(userToUpdate, challengeType);
      
      if (!progress) {
        // Create new progress if it doesn't exist
        progress = await storage.createUserProgress({
          userId: userToUpdate,
          challengeType,
          currentDay: 30, // Set to max day
          completedDays: Array.from({ length: 30 }, (_, i) => i + 1), // All days completed
          streakCount: 30,
          lastActivityDate: new Date().toISOString().split('T')[0]
        });
      } else {
        // Update existing progress to unlock all days
        progress = await storage.updateChallengeProgress(userToUpdate, challengeType, {
          currentDay: 30, // Set to max day to unlock all
          completedDays: Array.from({ length: 30 }, (_, i) => i + 1), // Mark all days as completed
          streakCount: 30,
          lastActivityDate: new Date().toISOString().split('T')[0]
        });
      }

      res.json({ 
        message: `All days unlocked for ${challengeType} challenge`,
        progress,
        unlockedDays: 30
      });
    } catch (error) {
      console.error("Error unlocking all days:", error);
      res.status(500).json({ message: "Failed to unlock all days" });
    }
  });
}