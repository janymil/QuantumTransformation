import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { 
  initializeUserGamification, 
  trackActivity, 
  getUserGamificationStats,
  generateDailyMicroLearning 
} from "../gamification";

export function registerGamificationRoutes(app: Express) {
  
  // Initialize gamification for a user and challenge
  app.post('/api/gamification/initialize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType } = req.body;
      
      if (!challengeType) {
        return res.status(400).json({ message: "Challenge type is required" });
      }

      await initializeUserGamification(userId, challengeType);
      res.json({ message: "Gamification initialized successfully" });
    } catch (error) {
      console.error("Error initializing gamification:", error);
      res.status(500).json({ message: "Failed to initialize gamification" });
    }
  });

  // Track a learning activity
  app.post('/api/gamification/track-activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType, day, activityType, activityData } = req.body;
      
      if (!challengeType || day === undefined || !activityType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await trackActivity(userId, challengeType, day, activityType, activityData);
      res.json(result);
    } catch (error) {
      console.error("Error tracking activity:", error);
      res.status(500).json({ message: "Failed to track activity" });
    }
  });

  // Get user's gamification stats
  app.get('/api/gamification/stats/:challengeType', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType } = req.params;
      
      const stats = await getUserGamificationStats(userId, challengeType);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching gamification stats:", error);
      res.status(500).json({ message: "Failed to fetch gamification stats" });
    }
  });

  // Get daily micro-learning content
  app.get('/api/gamification/micro-learning/:challengeType/:day', isAuthenticated, async (req: any, res) => {
    try {
      const { challengeType, day } = req.params;
      const dayNumber = parseInt(day);
      
      if (isNaN(dayNumber)) {
        return res.status(400).json({ message: "Invalid day number" });
      }

      const content = await generateDailyMicroLearning(challengeType, dayNumber);
      res.json(content);
    } catch (error) {
      console.error("Error fetching micro-learning content:", error);
      res.status(500).json({ message: "Failed to fetch micro-learning content" });
    }
  });

  // Award points for specific practice completion
  app.post('/api/gamification/practice-completed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType, day, practiceType, timeSpent, completed } = req.body;
      
      if (!challengeType || day === undefined || !practiceType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await trackActivity(userId, challengeType, day, `${practiceType}_practice`, {
        practiceType,
        timeSpent,
        completed
      });

      res.json(result);
    } catch (error) {
      console.error("Error tracking practice completion:", error);
      res.status(500).json({ message: "Failed to track practice completion" });
    }
  });

  // Award points for journal entry
  app.post('/api/gamification/journal-completed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType, day, journalLength } = req.body;
      
      if (!challengeType || day === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await trackActivity(userId, challengeType, day, 'journal_entry', {
        journalLength: journalLength || 0
      });

      res.json(result);
    } catch (error) {
      console.error("Error tracking journal completion:", error);
      res.status(500).json({ message: "Failed to track journal completion" });
    }
  });

  // Award points for video watched
  app.post('/api/gamification/video-watched', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType, day, videoId, timeSpent } = req.body;
      
      if (!challengeType || day === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await trackActivity(userId, challengeType, day, 'video_watched', {
        videoId,
        timeSpent
      });

      res.json(result);
    } catch (error) {
      console.error("Error tracking video completion:", error);
      res.status(500).json({ message: "Failed to track video completion" });
    }
  });

  // Award points for day completion
  app.post('/api/gamification/day-completed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType, day } = req.body;
      
      if (!challengeType || day === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await trackActivity(userId, challengeType, day, 'day_completed', {
        completed: true
      });

      res.json(result);
    } catch (error) {
      console.error("Error tracking day completion:", error);
      res.status(500).json({ message: "Failed to track day completion" });
    }
  });
}