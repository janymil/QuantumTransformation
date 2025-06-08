import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";

export function registerAuthRoutes(app: Express) {
  // Development login endpoint for testing
  app.post('/api/auth/dev-login', async (req, res) => {
    try {
      // Create a test user session for development
      const testUser = {
        id: 'dev-user-123',
        email: 'dev@test.com',
        firstName: 'Dev',
        lastName: 'User',
        created: new Date()
      };
      
      // Set up session
      (req as any).user = testUser;
      
      // Initialize user data
      await initializeNewUser(testUser.id);
      
      res.json({ 
        message: "Development login successful", 
        user: testUser 
      });
    } catch (error) {
      console.error("Dev login error:", error);
      res.status(500).json({ message: "Dev login failed" });
    }
  });

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

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Extract user ID from the authenticated user object
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || user?.userId;
      
      if (!userId) {
        console.error("No user ID found in authenticated user object:", user);
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const userData = await storage.getUser(userId);
      
      // Initialize user data if this is their first visit
      await initializeNewUser(userId);
      
      res.json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}