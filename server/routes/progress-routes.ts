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
      res.json({ allProgress });
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
}