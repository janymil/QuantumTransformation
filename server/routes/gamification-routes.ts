import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { 
  initializeUserGamification, 
  trackActivity, 
  getUserGamificationStats,
  generateDailyMicroLearning 
} from "../gamification";
import { db } from "../db";
import { microLearningActivities } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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

  // Track verified activity with real validation and duplicate prevention
  app.post('/api/gamification/track-verified-activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType, day, type, verificationData } = req.body;
      
      if (!challengeType || day === undefined || !type || !verificationData) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if this activity has already been completed today
      const existingActivity = await db
        .select()
        .from(microLearningActivities)
        .where(and(
          eq(microLearningActivities.userId, userId),
          eq(microLearningActivities.challengeType, challengeType),
          eq(microLearningActivities.day, day),
          eq(microLearningActivities.activityType, type)
        ))
        .limit(1);

      if (existingActivity.length > 0) {
        return res.status(409).json({ 
          message: "Activity already completed today",
          pointsEarned: 0,
          alreadyCompleted: true
        });
      }

      // Validate based on activity type
      let isValid = false;
      let pointsEarned = 0;
      let unlocked = [];
      let validationMessage = '';

      switch (type) {
        case 'morning_meditation':
          const currentHour = new Date().getHours();
          isValid = verificationData.duration >= 600 && (currentHour >= 5 && currentHour <= 11);
          pointsEarned = isValid ? 30 : 0;
          unlocked = isValid ? ['morning_insights', 'energy_boost'] : [];
          validationMessage = isValid ? 'Morning meditation verified' : 'Must meditate for 10+ minutes between 5-11 AM';
          break;

        case 'video_learning':
          // Require both completion percentage AND minimum watch time
          const minWatchTime = verificationData.videoDuration * 0.8; // 80% of video duration
          isValid = verificationData.completionPercentage >= 80 && verificationData.watchTime >= minWatchTime;
          pointsEarned = isValid ? 10 : 0;
          unlocked = isValid ? ['advanced_techniques'] : [];
          validationMessage = isValid ? 'Video learning verified' : 'Must watch at least 80% of the video';
          break;

        case 'journal_reflection':
          isValid = verificationData.wordCount >= 20 && verificationData.characterCount >= 100;
          pointsEarned = isValid ? 25 : 0;
          unlocked = isValid ? ['personal_insights', 'pattern_recognition'] : [];
          validationMessage = isValid ? 'Journal reflection verified' : 'Must write at least 20 words (100 characters)';
          break;

        case 'evening_integration':
          const eveningHour = new Date().getHours();
          isValid = verificationData.wordCount >= 15 && (eveningHour >= 18 && eveningHour <= 23);
          pointsEarned = isValid ? 35 : 0;
          unlocked = isValid ? ['next_day_preview', 'advanced_practices'] : [];
          validationMessage = isValid ? 'Evening integration verified' : 'Must complete between 6-11 PM with 15+ words';
          break;

        default:
          return res.status(400).json({ message: "Invalid activity type" });
      }

      if (!isValid) {
        return res.status(400).json({ 
          message: validationMessage,
          pointsEarned: 0,
          verificationFailed: true
        });
      }

      // Only track if validation passes
      const result = await trackActivity(userId, challengeType, day, type, verificationData);
      
      res.json({
        ...result,
        unlocked,
        verificationPassed: true,
        message: validationMessage
      });

    } catch (error) {
      console.error("Error tracking verified activity:", error);
      res.status(500).json({ message: "Failed to track verified activity" });
    }
  });

  // Get verified progress for a specific day
  app.get('/api/gamification/verified-progress/:challengeType/:day', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType, day } = req.params;
      const dayNumber = parseInt(day);
      
      if (isNaN(dayNumber)) {
        return res.status(400).json({ message: "Invalid day number" });
      }

      // Get activities for this specific day
      const activities = await db
        .select()
        .from(microLearningActivities)
        .where(and(
          eq(microLearningActivities.userId, userId),
          eq(microLearningActivities.challengeType, challengeType),
          eq(microLearningActivities.day, dayNumber)
        ));

      // Get user's current stats
      const stats = await getUserGamificationStats(userId, challengeType);

      res.json({
        activities,
        stats,
        verifiedProgress: {
          morning_meditation: activities.some(a => a.activityType === 'morning_meditation'),
          video_learning: activities.some(a => a.activityType === 'video_learning'),
          journal_reflection: activities.some(a => a.activityType === 'journal_reflection'),
          evening_integration: activities.some(a => a.activityType === 'evening_integration')
        }
      });

    } catch (error) {
      console.error("Error fetching verified progress:", error);
      res.status(500).json({ message: "Failed to fetch verified progress" });
    }
  });
}