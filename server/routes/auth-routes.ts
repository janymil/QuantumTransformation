import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";

export function registerAuthRoutes(app: Express) {
  // Mock registration endpoint for testing
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      
      // Generate a mock user ID for testing
      const userId = Math.random().toString(36).substr(2, 9);
      
      const user = {
        id: userId,
        email: email,
        created: new Date()
      };
      
      // Initialize user data
      await initializeNewUser(userId);
      
      res.json({ 
        message: "User registered successfully", 
        user: user 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // User initialization function
  async function initializeNewUser(userId: string) {
    try {
      const existingProgress = await storage.getUserProgress(userId);
      
      if (!existingProgress) {
        await storage.createUserProgress({
          userId,
          challengeType: "general_quantum",
          currentDay: 1,
          completedDays: [],
          streakCount: 0,
          lastActivityDate: new Date().toISOString().split('T')[0]
        });
        
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

  // Get current user with development bypass
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Development mode: create/return demo user for testing
      const demoUserId = 'demo-user-intelligence-test';
      
      // Check if demo user exists, create if not
      let user = await storage.getUser(demoUserId);
      
      if (!user) {
        // Create demo user for testing the AI Intelligence Layer
        await storage.upsertUser({
          id: demoUserId,
          email: 'demo@intelligence.test',
          firstName: 'Demo',
          lastName: 'User',
          profileImageUrl: null,
        });
        
        user = await storage.getUser(demoUserId);
      }
      
      // Initialize user data if this is their first visit
      await initializeNewUser(demoUserId);
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}