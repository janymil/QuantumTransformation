import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserProgressSchema, insertSavedPhraseSchema, insertUserAchievementSchema, insertUserSettingsSchema, insertAiResponseHistorySchema, aiResponseHistory, journalingThreads, threadExchanges } from "@shared/schema";
import { aiInteractionHistory } from "@shared/ai-interaction-schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
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
import { costOptimizationEngine } from "./ai-cost-optimization";
import { generateAIExplanation, analyzeJournalEntries, generatePersonalizedCoaching } from "./openai";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
import { aiCouchEngine } from "./ai-couch-simple";
import { db } from "./db";
import { eq, desc, and, ilike, or, gte, count, avg, sum, sql } from "drizzle-orm";
import { conductMarketResearch, analyzePricingStrategy } from "./market-research";
import { 
  determineCacheStrategy, 
  getEnhancedCachedResponse, 
  getCacheAnalytics,
  initializeEnhancedCaching 
} from "./enhanced-caching";
import { registerGamificationRoutes } from "./routes/gamification-routes";
import { generatePersonalizedAffirmation } from "./openai";
import { vectorPersonalization } from "./vector-personalization";
import { emotionalIntelligence } from "./emotional-intelligence";
import { advancedMemory } from "./advanced-memory";
import { predictiveIntelligence } from "./predictive-intelligence";
import { modelRouter } from "./intelligent-model-router";
import { initializeUserGamification } from "./gamification";
// import { registerDeepJournalingRoutes } from "./deep-journaling-engine"; // Function not available
import { multidisciplinaryAIEngine } from "./multidisciplinary-ai-engine";
import { responseQualityTiering } from "./response-quality-tiering";
export async function registerRoutes(app: Express): Promise<Server> {
  // Cross-domain authentication endpoints (must be before auth middleware)
  
  // API endpoint to provide user data to Vision Board app
  app.get('/api/cross-domain/user/:userId', async (req, res) => {
    try {
      console.log('Cross-domain request received:', {
        method: req.method,
        headers: Object.keys(req.headers),
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        userId: req.params.userId,
        origin: req.headers.origin,
        userAgent: req.headers['user-agent']
      });

      // Verify JWT token from Vision Board app
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('No authorization header found. Headers received:', Object.keys(req.headers));
        return res.status(401).json({ 
          error: 'No valid token provided',
          debug: {
            headersReceived: Object.keys(req.headers),
            authHeaderPresent: !!authHeader,
            authHeaderValue: authHeader ? authHeader.substring(0, 20) + '...' : 'null'
          }
        });
      }

      const token = authHeader.split(' ')[1];
      let decoded;
      
      try {
        // Try multiple JWT secrets to handle cross-domain authentication
        const secretsToTry = [
          process.env.JWT_SECRET,
          'your-secret-key',
          'quantum-secret-key', 
          'vision-board-secret',
          'jwt-secret-quantum',
          'quantum-challenges-vision-board-secret-2025',
          'quantum-challenges-2025-secure-key-d46aef1e6a339b'
        ].filter(Boolean) as string[];
        
        let validationSuccess = false;
        let lastError: any;
        
        for (const secret of secretsToTry) {
          try {
            decoded = jwt.verify(token, secret) as any;
            console.log('JWT verified successfully with secret:', secret.substring(0, 10) + '...');
            validationSuccess = true;
            break;
          } catch (error: any) {
            lastError = error;
            continue;
          }
        }
        
        if (!validationSuccess) {
          console.error('JWT verification failed with all secrets. Last error:', lastError?.message);
          return res.status(401).json({ 
            error: 'Invalid or expired token',
            reason: 'Token signature verification failed',
            details: lastError?.message
          });
        }
      } catch (jwtError: any) {
        console.error('JWT verification failed:', jwtError?.message || 'Unknown error');
        return res.status(401).json({ error: 'Invalid or expired token', details: jwtError?.message || 'Unknown error' });
      }
      
      // Log token details for debugging
      console.log('Token decoded successfully:', {
        aud: decoded.aud,
        iss: decoded.iss,
        userId: decoded.userId || decoded.id || decoded.sub,
        exp: decoded.exp
      });
      
      // Flexible audience/issuer validation
      const hasValidAudience = !decoded.aud || 
        decoded.aud === 'vision-board-app' || 
        decoded.aud === 'quantum-challenges-app';
      const hasValidIssuer = !decoded.iss || 
        decoded.iss === 'quantum-challenges-app' || 
        decoded.iss === 'vision-board-app';
      
      if (!hasValidAudience && !hasValidIssuer) {
        console.error('Token validation failed:', { aud: decoded.aud, iss: decoded.iss });
        return res.status(401).json({ 
          error: 'Invalid token audience or issuer',
          expected: { aud: 'vision-board-app or quantum-challenges-app', iss: 'quantum-challenges-app or vision-board-app' },
          received: { aud: decoded.aud, iss: decoded.iss }
        });
      }

      // Flexible user ID extraction
      const tokenUserId = decoded.userId || decoded.id || decoded.sub;
      const requestUserId = req.params.userId;
      
      if (tokenUserId && tokenUserId !== requestUserId) {
        console.error('Token userId mismatch:', { tokenUserId, requestUserId });
        return res.status(403).json({ error: 'Token userId mismatch' });
      }

      // Get ALL comprehensive user data
      const user = await storage.getUser(requestUserId);
      const journalEntries = await storage.getUserJournalEntries(requestUserId);
      const userProgress = await storage.getUserProgress(requestUserId);
      const affirmations = await storage.getUserSavedPhrases(requestUserId);
      const userAchievements = await storage.getUserAchievements(requestUserId);
      const userSettings = await storage.getUserSettings(requestUserId);
      
      // Handle userProgress as either array or single object
      const progressArray = Array.isArray(userProgress) ? userProgress : (userProgress ? [userProgress] : []);
      const activeProgress = progressArray.filter((p: any) => p.status === 'active' || p.currentDay > 0);
      const streakCount = progressArray.length > 0 ? Math.max(...progressArray.map((p: any) => p.streakCount || 0)) : 0;

      console.log('Cross-domain comprehensive data successfully fetched for user:', requestUserId, {
        journalCount: journalEntries?.length || 0,
        affirmationsCount: affirmations?.length || 0,
        progressCount: progressArray.length,
        achievementsCount: userAchievements?.length || 0
      });

      // Return comprehensive user data for Vision Board personalization
      res.json({
        user: {
          id: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          profileImageUrl: user?.profileImageUrl,
          createdAt: user?.createdAt,
          updatedAt: user?.updatedAt
        },
        journalEntries: journalEntries || [],
        progress: progressArray,
        profile: user,
        affirmations: affirmations || [],
        achievements: userAchievements || [],
        settings: userSettings || {},
        aiHistory: [],
        spacedRepetition: [],
        goals: progressArray.length > 0 ? progressArray.map((p: any) => ({
          id: p.id,
          type: p.challengeType,
          currentDay: p.currentDay,
          status: p.status || (p.currentDay > 0 ? 'active' : 'pending'),
          completedDays: p.completedDays || []
        })) : [],
        preferences: {
          communicationStyle: 'supportive',
          primaryGoals: ['manifestation', 'abundance', 'personal-growth'],
          healingReadiness: 'ready',
          aiUsagePreferences: {},
          notificationSettings: {}
        },
        activeChallenges: activeProgress,
        recentActivity: {
          lastLogin: user?.updatedAt,
          streakCount: streakCount,
          totalDays: progressArray.reduce((sum: number, p: any) => sum + (p.currentDay || 0), 0),
          lastJournalEntry: journalEntries?.length > 0 ? journalEntries[0]?.createdAt : null,
          lastAIInteraction: null,
          totalAchievements: userAchievements?.length || 0
        },
        analytics: {
          totalJournalEntries: journalEntries?.length || 0,
          totalAffirmations: affirmations?.length || 0,
          totalChallengesStarted: progressArray.length,
          totalChallengesCompleted: progressArray.filter((p: any) => p.status === 'completed').length,
          averageSessionLength: 15,
          personalityInsights: {
            dominantEmotions: ['optimistic', 'determined'],
            growthAreas: ['consistency', 'self-compassion'],
            strengths: ['persistence', 'openness']
          }
        }
      });
    } catch (error) {
      console.error('Error fetching cross-domain user data:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });

  // Generate cross-domain JWT token for Vision Board app
  app.post('/api/cross-domain/generate-token', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          aud: 'vision-board-app',
          iss: 'quantum-challenges-app'
        },
        process.env.JWT_SECRET || 'quantum-challenges-vision-board-secret-2025',
        { expiresIn: '1h' }
      );

      res.json({ token });
    } catch (error) {
      console.error('Error generating cross-domain token:', error);
      res.status(500).json({ error: 'Failed to generate authentication token' });
    }
  });

  // Vision Board API endpoints (placed first to avoid frontend routing conflicts)
  app.get('/api/vision-board/templates', async (req, res) => {
    try {
      const templates = [
        {
          id: 'financial_freedom',
          name: 'Financial Freedom',
          category: 'wealth',
          description: 'Manifest abundance and financial prosperity',
          thumbnail: '/templates/financial_freedom.jpg',
          elements: [
            { type: 'text', content: 'Financial Freedom', position: { x: 100, y: 50 }, style: { fontSize: 32, fontWeight: 'bold', color: '#2d5a27' } },
            { type: 'text', content: '$1,000,000', position: { x: 300, y: 150 }, style: { fontSize: 28, color: '#2d5a27' } },
            { type: 'text', content: 'Multiple Income Streams', position: { x: 50, y: 250 }, style: { fontSize: 20, color: '#2d5a27' } }
          ]
        },
        {
          id: 'health_wellness',
          name: 'Health & Wellness',
          category: 'health',
          description: 'Focus on physical and mental well-being',
          thumbnail: '/templates/health_wellness.jpg',
          elements: [
            { type: 'text', content: 'Vibrant Health', position: { x: 100, y: 50 }, style: { fontSize: 32, fontWeight: 'bold', color: '#2d5a27' } },
            { type: 'text', content: 'Daily Exercise', position: { x: 50, y: 150 }, style: { fontSize: 20, color: '#2d5a27' } },
            { type: 'text', content: 'Nutritious Food', position: { x: 300, y: 200 }, style: { fontSize: 20, color: '#2d5a27' } }
          ]
        }
      ];
      
      res.json(templates);
    } catch (error) {
      console.error('Error fetching vision board templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  app.get('/api/vision-board/categories', async (req, res) => {
    try {
      const categories = [
        { id: 'wealth', name: 'Wealth & Abundance', icon: '💰', description: 'Financial goals and prosperity' },
        { id: 'health', name: 'Health & Wellness', icon: '🌿', description: 'Physical and mental well-being' },
        { id: 'career', name: 'Career & Success', icon: '🎯', description: 'Professional achievements' },
        { id: 'relationships', name: 'Love & Relationships', icon: '❤️', description: 'Meaningful connections' },
        { id: 'lifestyle', name: 'Lifestyle & Travel', icon: '✈️', description: 'Experiences and adventures' },
        { id: 'personal', name: 'Personal Growth', icon: '🧘', description: 'Self-improvement and mindfulness' }
      ];
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching vision board categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  app.get('/api/vision-board/examples', async (req, res) => {
    try {
      const examples = [
        {
          id: 'entrepreneur_success',
          title: 'Entrepreneur Success Story',
          description: 'Vision board for building a successful business',
          category: 'career',
          imageUrl: '/examples/entrepreneur.jpg',
          elements: ['Company Logo', 'Revenue Goals', 'Team Vision', 'Market Leadership']
        },
        {
          id: 'healthy_lifestyle',
          title: 'Healthy Lifestyle Goals',
          description: 'Complete wellness transformation',
          category: 'health',
          imageUrl: '/examples/wellness.jpg',
          elements: ['Fitness Goals', 'Nutrition Plan', 'Mental Health', 'Energy & Vitality']
        }
      ];
      
      res.json(examples);
    } catch (error) {
      console.error('Error fetching vision board examples:', error);
      res.status(500).json({ message: 'Failed to fetch examples' });
    }
  });

  app.get('/api/vision-board/progress-analytics/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const visionBoards = await storage.getVisionBoards(userId);
      
      const analytics = {
        totalBoards: visionBoards.length,
        completedGoals: 0,
        activeGoals: visionBoards.length * 3,
        engagementMetrics: {
          boardsCreatedThisMonth: visionBoards.filter(board => {
            const boardDate = new Date(board.createdAt);
            const now = new Date();
            return boardDate.getMonth() === now.getMonth() && boardDate.getFullYear() === now.getFullYear();
          }).length,
          lastActivityDate: visionBoards.length > 0 ? visionBoards[0].updatedAt : null,
          averageElementsPerBoard: visionBoards.length > 0 ? 
            visionBoards.reduce((sum, board) => sum + (board.canvasData?.elements?.length || 0), 0) / visionBoards.length : 0
        }
      };
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching vision board analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  app.post('/api/vision-board/generate-mobile-wallpaper', async (req, res) => {
    try {
      const { visionBoard, deviceType = 'iphone', style = 'modern' } = req.body;
      
      if (!visionBoard) {
        return res.status(400).json({ message: 'Vision board data is required' });
      }
      
      const dimensions = {
        iphone: { width: 1170, height: 2532 },
        android: { width: 1080, height: 2340 },
        ipad: { width: 1620, height: 2160 }
      };
      
      const deviceDimensions = dimensions[deviceType] || dimensions.iphone;
      
      const wallpaperData = {
        wallpaperUrl: `/api/vision-board/wallpaper/${Date.now()}.png`,
        deviceType,
        dimensions: deviceDimensions,
        style,
        elements: visionBoard.elements || [],
        backgroundColor: visionBoard.backgroundColor || '#ffffff'
      };
      
      res.json(wallpaperData);
    } catch (error) {
      console.error('Error generating mobile wallpaper:', error);
      res.status(500).json({ message: 'Failed to generate wallpaper' });
    }
  });

  // Auth middleware (applied after cross-domain endpoints)
  await setupAuth(app);

  // Cross-domain authentication for Vision Board app
  app.post('/api/auth/generate-vision-token', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user data for the Vision Board app
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create JWT token with user data and permissions
      const tokenPayload = {
        userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
        aud: 'vision-board-app',
        iss: 'quantum-challenges-app'
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'quantum-challenges-vision-board-secret-2025');
      
      res.json({ 
        token, 
        redirectUrl: 'https://512db387-5e5e-48d6-b6f6-0dc504422590-00-1mwcu5ml07laq.kirk.replit.dev',
        user: {
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('Error generating vision token:', error);
      res.status(500).json({ error: 'Failed to generate authentication token' });
    }
  });

  // Debug endpoint to see what requests are coming in
  app.all('/api/cross-domain/debug', (req, res) => {
    console.log('DEBUG - Request received:', {
      method: req.method,
      headers: req.headers,
      query: req.query,
      body: req.body,
      url: req.url
    });
    res.json({ message: 'Debug info logged' });
  });



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

  // BunnyCDN upload routes
  app.post('/api/bunnycdn/upload', isAuthenticated, async (req, res) => {
    try {
      // Dynamic import of multer
      const multer = await import('multer');
      const upload = multer.default({ storage: multer.default.memoryStorage() });
      
      upload.single('file')(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ success: false, error: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const storageZone = process.env.BUNNYCDN_STORAGE_ZONE || 'vision-board-storage';
        const accessKey = process.env.BUNNYCDN_ACCESS_KEY;
        
        if (!accessKey) {
          return res.status(500).json({ success: false, error: 'BunnyCDN credentials not configured' });
        }

        try {
          // Generate unique filename
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const extension = req.file.originalname.split('.').pop() || 'jpg';
          const filename = `vision-board-${timestamp}-${randomString}.${extension}`;

          // Upload to BunnyCDN
          const uploadUrl = `https://ny.storage.bunnycdn.com/${storageZone}/${filename}`;
          
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'AccessKey': accessKey,
              'Content-Type': req.file.mimetype
            },
            body: req.file.buffer
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`BunnyCDN upload failed: ${uploadResponse.status} ${errorText}`);
          }

          const cdnUrl = `https://${storageZone}.b-cdn.net/${filename}`;
          
          res.json({ 
            success: true, 
            url: cdnUrl,
            filename: filename 
          });

        } catch (uploadError) {
          console.error('BunnyCDN upload error:', uploadError);
          res.status(500).json({ 
            success: false, 
            error: uploadError instanceof Error ? uploadError.message : 'Upload failed' 
          });
        }
      });
    } catch (error) {
      console.error('Upload route error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  app.delete('/api/bunnycdn/delete', isAuthenticated, async (req, res) => {
    try {
      const { filename } = req.body;
      
      if (!filename) {
        return res.status(400).json({ success: false, error: 'Filename required' });
      }

      const storageZone = process.env.BUNNYCDN_STORAGE_ZONE || 'vision-board-storage';
      const accessKey = process.env.BUNNYCDN_ACCESS_KEY;
      
      if (!accessKey) {
        return res.status(500).json({ success: false, error: 'BunnyCDN credentials not configured' });
      }

      const deleteUrl = `https://ny.storage.bunnycdn.com/${storageZone}/${filename}`;
      
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'AccessKey': accessKey
        }
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error('BunnyCDN delete error:', deleteResponse.status, errorText);
      }

      res.json({ success: deleteResponse.ok });

    } catch (error) {
      console.error('Delete route error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // Register modular route handlers
  registerAuthRoutes(app);
  registerChallengeRoutes(app);
  registerProgressRoutes(app);
  registerJournalRoutes(app);
  registerGamificationRoutes(app);

  // Enhanced AI Routes with Smart Caching System
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

      // Determine smart caching strategy
      const cacheStrategy = determineCacheStrategy(userQuestion || topic, challengeType, day, userTier);
      
      // Try enhanced cache lookup
      const cachedResponse = await getEnhancedCachedResponse(inputHash, cacheStrategy);
      if (cachedResponse) {
        await trackUsage(userId, 'explanation', inputHash, 0, 0);
        return res.json({
          ...cachedResponse,
          cacheStrategy: cacheStrategy.reason,
          remainingRequests: validation.remainingRequests
        });
      }

      // Generate fresh AI response only if strategy allows
      if (!cacheStrategy.generateFresh) {
        // Fallback to basic cached response
        const basicCached = await getCachedResponse(inputHash);
        if (basicCached) {
          await trackUsage(userId, 'explanation', inputHash, 0, 0);
          return res.json({
            ...basicCached,
            fromCache: true,
            cacheStrategy: 'fallback_global',
            remainingRequests: validation.remainingRequests
          });
        }
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
        cacheStrategy: 'fresh_generated',
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
      const { unifiedAnalytics } = await import('./unified-analytics');
      const stats = await unifiedAnalytics.getUsageStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Usage stats error:", error);
      res.status(500).json({ error: "Failed to get usage statistics" });
    }
  });

  // Enhanced Cache Analytics endpoint
  app.get("/api/ai/cache-analytics", isAuthenticated, async (req: any, res) => {
    try {
      const analytics = await getCacheAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Cache analytics error:", error);
      res.status(500).json({ error: "Failed to get cache analytics" });
    }
  });

  // Initialize Enhanced Caching endpoint (admin only)
  app.post("/api/ai/initialize-cache", isAuthenticated, async (req: any, res) => {
    try {
      await initializeEnhancedCaching();
      res.json({ 
        message: "Enhanced caching system initialized successfully",
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      console.error("Cache initialization error:", error);
      res.status(500).json({ error: "Failed to initialize caching system" });
    }
  });

  // Cache Verification endpoint - test cache system functionality
  app.get("/api/ai/verify-cache", isAuthenticated, async (req: any, res) => {
    try {
      const { verifyCacheSystem } = await import("./cache-verification");
      const verification = await verifyCacheSystem();
      
      res.json({
        status: verification.systemStatus,
        testResults: verification.testResults,
        summary: verification.summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Cache verification error:", error);
      res.status(500).json({ error: "Failed to verify cache system" });
    }
  });

  // Cache Statistics endpoint
  app.get("/api/ai/cache-stats", isAuthenticated, async (req: any, res) => {
    try {
      const { getCacheStatistics } = await import("./cache-verification");
      const stats = await getCacheStatistics();
      
      if (stats) {
        res.json(stats);
      } else {
        res.status(500).json({ error: "Failed to retrieve cache statistics" });
      }
    } catch (error) {
      console.error("Cache statistics error:", error);
      res.status(500).json({ error: "Failed to get cache statistics" });
    }
  });

  // Advanced Vector-Based AI Personalization endpoint
  app.post("/api/ai/vector-coaching", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { query, challengeType = 'general_quantum', userTier = 'basic' } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Validate AI request
      const validation = await validateAIRequest({
        userId,
        requestType: 'vector_coaching',
        input: query,
        challengeType,
        userTier
      });

      if (!validation.allowed) {
        return res.status(429).json({ 
          error: validation.reason,
          remainingRequests: validation.remainingRequests
        });
      }

      // Initialize vector personalization if needed
      try {
        await vectorPersonalization.initialize();
        await vectorPersonalization.indexChallengeContent();
        await vectorPersonalization.indexUserData(userId);
      } catch (initError) {
        console.log("Vector personalization init (may already be initialized):", initError);
      }

      // Generate highly personalized response using semantic search
      const personalizedResponse = await vectorPersonalization.generatePersonalizedResponse(
        userId,
        query,
        challengeType
      );

      // Track usage (skip for now due to type mismatch)
      // await trackUsage(parseInt(userId), 'vector_coaching', query, personalizedResponse, challengeType);

      // Store in response history (skip for now due to schema mismatch)
      // await db.insert(aiResponseHistory).values({
      //   userId,
      //   sessionType: 'vector_coaching',
      //   userInput: query,
      //   aiResponse: personalizedResponse,
      //   challengeType,
      //   metadata: { 
      //     personalizationMethod: 'vector_semantic_search',
      //     vectorSearchUsed: true
      //   }
      // });

      res.json({
        response: personalizedResponse,
        personalizationMethod: 'vector_semantic_search',
        challengeType,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Vector coaching error:", error);
      res.status(500).json({ error: "Failed to generate personalized response" });
    }
  });

  // Initialize Vector Personalization System endpoint
  app.post("/api/ai/initialize-vector-system", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      await vectorPersonalization.initialize();
      await vectorPersonalization.indexChallengeContent();
      await vectorPersonalization.indexUserData(userId);

      res.json({
        message: "Vector personalization system initialized successfully",
        features: [
          "Semantic search for relevant content",
          "User behavior and progress indexing",
          "Challenge-specific content embeddings",
          "Intelligent context selection"
        ],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Vector system initialization error:", error);
      res.status(500).json({ error: "Failed to initialize vector personalization system" });
    }
  });

  // Emotional Intelligence Analysis endpoint
  app.get("/api/ai/emotional-profile/:challengeType", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType } = req.params;

      const emotionalProfile = await emotionalIntelligence.analyzeEmotionalProfile(userId, challengeType);
      const insights = await emotionalIntelligence.identifyEmotionalInsights(userId, challengeType);

      res.json({
        emotionalProfile,
        insights,
        analysisDate: new Date().toISOString()
      });

    } catch (error) {
      console.error("Emotional analysis error:", error);
      res.status(500).json({ error: "Failed to analyze emotional profile" });
    }
  });

  // AI Response Management Routes
  app.get('/api/ai/responses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { 
        search, 
        challengeType, 
        modelUsed, 
        sessionType, 
        dateRange, 
        qualityMin = "1",
        limit = "50",
        offset = "0" 
      } = req.query;

      // Build query conditions
      const conditions = [eq(aiResponseHistory.userId, userId)];

      if (challengeType && challengeType !== 'all') {
        conditions.push(eq(aiResponseHistory.challengeType, challengeType));
      }

      if (modelUsed && modelUsed !== 'all') {
        conditions.push(eq(aiResponseHistory.modelUsed, modelUsed));
      }

      if (sessionType && sessionType !== 'all') {
        conditions.push(eq(aiResponseHistory.sessionType, sessionType));
      }

      if (qualityMin && parseInt(qualityMin) > 1) {
        conditions.push(gte(aiResponseHistory.responseQuality, parseInt(qualityMin)));
      }

      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        }
        
        if (startDate) {
          conditions.push(gte(aiResponseHistory.createdAt, startDate));
        }
      }

      const responses = await db
        .select()
        .from(aiResponseHistory)
        .where(and(...conditions))
        .orderBy(desc(aiResponseHistory.createdAt))
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      res.json(responses);
    } catch (error) {
      console.error("Error fetching AI responses:", error);
      res.status(500).json({ message: "Failed to fetch AI responses" });
    }
  });

  app.get('/api/ai/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get total responses
      const totalResponses = await db
        .select({ count: count() })
        .from(aiResponseHistory)
        .where(eq(aiResponseHistory.userId, userId));

      // Get model distribution
      const modelDistribution = await db
        .select({
          model: aiResponseHistory.modelUsed,
          count: count()
        })
        .from(aiResponseHistory)
        .where(eq(aiResponseHistory.userId, userId))
        .groupBy(aiResponseHistory.modelUsed);

      // Get average metrics
      const avgMetrics = await db
        .select({
          avgQuality: avg(aiResponseHistory.responseQuality),
          avgCost: avg(aiResponseHistory.cost),
          avgResponseTime: avg(aiResponseHistory.responseTime),
          totalCost: sum(aiResponseHistory.cost)
        })
        .from(aiResponseHistory)
        .where(eq(aiResponseHistory.userId, userId));

      // Get high quality percentage (8+ rating)
      const highQuality = await db
        .select({ count: count() })
        .from(aiResponseHistory)
        .where(and(
          eq(aiResponseHistory.userId, userId),
          gte(aiResponseHistory.responseQuality, 8)
        ));

      // Calculate cost savings based on model usage
      const gpt4oMiniRequests = await db
        .select({ count: count() })
        .from(aiResponseHistory)
        .where(and(
          eq(aiResponseHistory.userId, userId),
          eq(aiResponseHistory.modelUsed, 'gpt-4o-mini')
        ));

      const total = totalResponses[0]?.count || 0;
      const costSavings = total > 0 ? Math.round((gpt4oMiniRequests[0]?.count || 0) / total * 75) : 0;

      const analytics = {
        totalResponses: total,
        modelDistribution: modelDistribution.reduce((acc, item) => {
          if (item.model) {
            acc[item.model] = item.count;
          }
          return acc;
        }, {} as Record<string, number>),
        avgQuality: Math.round((Number(avgMetrics[0]?.avgQuality) || 0) * 10) / 10,
        avgCostPerResponse: Number(avgMetrics[0]?.avgCost) || 0,
        totalCost: Number(avgMetrics[0]?.totalCost) || 0,
        avgResponseTime: {
          "gpt-4o": Math.round(Number(avgMetrics[0]?.avgResponseTime) || 0),
          "gpt-4o-mini": Math.round((Number(avgMetrics[0]?.avgResponseTime) || 0) * 0.7)
        },
        highQualityPercentage: total > 0 ? Math.round((highQuality[0]?.count || 0) / total * 100) : 0,
        costSavings
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching AI analytics:", error);
      res.status(500).json({ message: "Failed to fetch AI analytics" });
    }
  });

  // User conversation history management endpoints
  app.patch('/api/ai/responses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const responseId = parseInt(req.params.id);
      const { userInput } = req.body;

      const [updated] = await db
        .update(aiResponseHistory)
        .set({ userInput, updatedAt: new Date() })
        .where(and(
          eq(aiResponseHistory.id, responseId),
          eq(aiResponseHistory.userId, userId)
        ))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating response:", error);
      res.status(500).json({ message: "Failed to update response" });
    }
  });

  app.patch('/api/ai/responses/:id/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const responseId = parseInt(req.params.id);
      const { isFavorited } = req.body;

      const [updated] = await db
        .update(aiResponseHistory)
        .set({ isFavorited, updatedAt: new Date() })
        .where(and(
          eq(aiResponseHistory.id, responseId),
          eq(aiResponseHistory.userId, userId)
        ))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating favorite:", error);
      res.status(500).json({ message: "Failed to update favorite" });
    }
  });

  app.patch('/api/ai/responses/:id/archive', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const responseId = parseInt(req.params.id);
      const { isArchived } = req.body;

      const [updated] = await db
        .update(aiResponseHistory)
        .set({ isArchived, updatedAt: new Date() })
        .where(and(
          eq(aiResponseHistory.id, responseId),
          eq(aiResponseHistory.userId, userId)
        ))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error archiving response:", error);
      res.status(500).json({ message: "Failed to archive response" });
    }
  });

  // Admin Analytics endpoint (password protected in frontend)
  app.get('/api/admin/analytics', async (req, res) => {
    try {
      // Use unified analytics system for consistent data across platform
      const { unifiedAnalytics } = await import('./unified-analytics');
      
      // Get comprehensive analytics data from single source of truth
      const analytics = await unifiedAnalytics.getAdminAnalytics();
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      res.status(500).json({ message: "Failed to fetch admin analytics" });
    }
  });

  // Admin get all users endpoint
  app.get('/api/admin/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Admin get all users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  });

  // Admin update user endpoint
  app.put('/api/admin/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error('Admin update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Admin block user endpoint
  app.post('/api/admin/users/:userId/block', async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.id || 'admin';
      
      await storage.blockUser(userId, reason, adminId);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin block user error:', error);
      res.status(500).json({ error: 'Failed to block user' });
    }
  });

  // Admin unblock user endpoint
  app.post('/api/admin/users/:userId/unblock', async (req, res) => {
    try {
      const { userId } = req.params;
      
      await storage.unblockUser(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin unblock user error:', error);
      res.status(500).json({ error: 'Failed to unblock user' });
    }
  });

  // Admin delete user endpoint
  app.delete('/api/admin/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Assessment reflections endpoints
  app.post('/api/assessment-reflections', async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const reflectionData = {
        ...req.body,
        userId: req.user.id,
        wordCount: req.body.content?.trim().split(/\s+/).length || 0,
        characterCount: req.body.content?.length || 0
      };

      const reflection = await storage.createAssessmentReflection(reflectionData);
      res.json(reflection);
    } catch (error) {
      console.error('Create assessment reflection error:', error);
      res.status(500).json({ error: 'Failed to create reflection' });
    }
  });

  // Assessment reflections endpoints
  app.post('/api/assessment-reflections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reflectionData = {
        ...req.body,
        userId,
        wordCount: req.body.content ? req.body.content.split(' ').length : 0,
        characterCount: req.body.content ? req.body.content.length : 0
      };

      const reflection = await storage.createAssessmentReflection(reflectionData);
      res.json(reflection);
    } catch (error) {
      console.error('Create assessment reflection error:', error);
      res.status(500).json({ error: 'Failed to create reflection' });
    }
  });

  app.get('/api/assessment-reflections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reflections = await storage.getUserAssessmentReflections(userId);
      res.json(reflections);
    } catch (error) {
      console.error('Get assessment reflections error:', error);
      res.status(500).json({ error: 'Failed to get reflections' });
    }
  });

  app.get('/api/assessment-reflections/:type', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type } = req.params;
      const reflections = await storage.getAssessmentReflectionsByType(userId, type);
      res.json(reflections);
    } catch (error) {
      console.error('Get assessment reflections by type error:', error);
      res.status(500).json({ error: 'Failed to get reflections' });
    }
  });

  // Admin User Statistics endpoint (password protected in frontend)
  app.get('/api/admin/user-statistics', async (req, res) => {
    try {
      // Get user interaction statistics and metrics
      const userStats = await storage.getUserStatistics();
      
      res.json(userStats);
    } catch (error) {
      console.error("Admin user statistics error:", error);
      res.status(500).json({ error: "Failed to get user statistics" });
    }
  });

  // Enhanced AI Coaching with Emotional Intelligence
  app.post("/api/ai/enhanced-coaching", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { query, challengeType = 'general_quantum', userTier = 'basic' } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Validate AI request
      const validation = await validateAIRequest({
        userId,
        requestType: 'enhanced_coaching',
        input: query,
        challengeType,
        userTier
      });

      if (!validation.allowed) {
        return res.status(429).json({ 
          error: validation.reason,
          remainingRequests: validation.remainingRequests
        });
      }

      // Initialize systems if needed
      try {
        await vectorPersonalization.initialize();
        await vectorPersonalization.indexChallengeContent();
        await vectorPersonalization.indexUserData(userId);
      } catch (initError) {
        console.log("Systems already initialized");
      }

      // Get personalized context using semantic search
      const personalizedContext = await vectorPersonalization.getPersonalizedContext(
        userId, 
        query, 
        challengeType
      );

      // Create enhanced system prompt
      const systemPrompt = `You are an advanced AI quantum consciousness coach specializing in ${challengeType}. 

${personalizedContext.personalizedPrompt}

Provide personalized, actionable guidance that:
- References specific challenge techniques and practices
- Builds upon user's documented experiences and insights
- Adapts Joe Dispenza and Neville Goddard methods to this specific challenge
- Addresses user's current progress level and challenges
- Maintains quantum consciousness framework while being personally relevant`;

      // Use intelligent model routing (automatically selects GPT-4o or GPT-4o-mini based on complexity)
      const aiResult = await modelRouter.executeWithOptimalModel(
        query,
        systemPrompt,
        query,
        'enhanced_coaching',
        challengeType,
        userTier,
        { temperature: 0.7, maxTokens: 1500 }
      );

      // Get emotional profile and enhance response if using complex model
      let emotionalInsights = null;
      let finalResponse = aiResult.response;

      if (aiResult.routingDecision.complexity === 'complex' || aiResult.routingDecision.model === 'gpt-4o') {
        emotionalInsights = await emotionalIntelligence.identifyEmotionalInsights(userId, challengeType);
        finalResponse = await emotionalIntelligence.generateEmotionallyAdaptedResponse(
          userId,
          query,
          challengeType,
          aiResult.response
        );
      }

      // Track usage with actual cost
      await trackUsage(userId, 'enhanced_coaching', createInputHash(query, 'enhanced_coaching'), 1000, 0.01);

      res.json({
        response: finalResponse,
        emotionalInsights,
        personalizationMethod: 'intelligent_hybrid_routing_with_vector_search',
        modelUsed: aiResult.modelUsed,
        complexity: aiResult.routingDecision.complexity,
        actualCost: aiResult.actualCost,
        challengeType,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Enhanced coaching error:", error);
      res.status(500).json({ error: "Failed to generate enhanced response" });
    }
  });

  // Emotional Evolution Tracking endpoint
  app.get("/api/ai/emotional-evolution", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { days = 30 } = req.query;

      const emotionalEvolution = await emotionalIntelligence.trackEmotionalEvolution(
        userId, 
        parseInt(days as string)
      );

      res.json({
        evolutionAnalysis: emotionalEvolution,
        analysisDate: new Date().toISOString(),
        periodDays: parseInt(days as string)
      });

    } catch (error) {
      console.error("Emotional evolution tracking error:", error);
      res.status(500).json({ error: "Failed to track emotional evolution" });
    }
  });

  // Advanced Memory System endpoints
  app.get("/api/ai/memory-profile/:challengeType", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType } = req.params;

      const longTermMemory = await advancedMemory.buildLongTermMemory(userId);
      const memoryMaintenance = await advancedMemory.performMemoryMaintenance(userId);

      res.json({
        longTermProfile: longTermMemory,
        memoryMaintenance,
        analysisDate: new Date().toISOString()
      });

    } catch (error) {
      console.error("Memory profile error:", error);
      res.status(500).json({ error: "Failed to build memory profile" });
    }
  });

  // Predictive Intelligence endpoints
  app.get("/api/ai/predictive-insights/:challengeType", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType } = req.params;

      const behaviorPatterns = await predictiveIntelligence.analyzeBehaviorPatterns(userId, challengeType);
      const completionForecast = await predictiveIntelligence.predictCompletionLikelihood(userId, challengeType);
      const insights = await predictiveIntelligence.generatePredictiveInsights(userId, challengeType);
      const optimalTiming = await predictiveIntelligence.determineOptimalTiming(userId, challengeType);

      res.json({
        behaviorPatterns,
        completionForecast,
        insights,
        optimalTiming,
        analysisDate: new Date().toISOString()
      });

    } catch (error) {
      console.error("Predictive insights error:", error);
      res.status(500).json({ error: "Failed to generate predictive insights" });
    }
  });

  // Proactive Coaching Message endpoint
  app.post("/api/ai/proactive-message", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType = 'general_quantum' } = req.body;

      const proactiveMessage = await predictiveIntelligence.generateProactiveMessage(userId, challengeType);

      res.json({
        message: proactiveMessage,
        generatedAt: new Date().toISOString(),
        challengeType
      });

    } catch (error) {
      console.error("Proactive message error:", error);
      res.status(500).json({ error: "Failed to generate proactive message" });
    }
  });

  // Supreme AI Coaching endpoint - combines all systems
  app.post("/api/ai/supreme-coaching", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { query, challengeType = 'general_quantum', userTier = 'basic' } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Validate AI request
      const validation = await validateAIRequest({
        userId,
        requestType: 'supreme_coaching',
        input: query,
        challengeType,
        userTier
      });

      if (!validation.allowed) {
        return res.status(429).json({ 
          error: validation.reason,
          remainingRequests: validation.remainingRequests
        });
      }

      // Initialize all systems
      try {
        await vectorPersonalization.initialize();
        await vectorPersonalization.indexChallengeContent();
        await vectorPersonalization.indexUserData(userId);
      } catch (initError) {
        console.log("Systems already initialized");
      }

      // Generate base response using vector personalization
      const baseResponse = await vectorPersonalization.generatePersonalizedResponse(
        userId,
        query,
        challengeType
      );

      // Enhance with emotional intelligence
      const emotionallyAdaptedResponse = await emotionalIntelligence.generateEmotionallyAdaptedResponse(
        userId,
        query,
        challengeType,
        baseResponse
      );

      // Enhance with advanced memory
      const memoryEnhancedResponse = await advancedMemory.generateMemoryEnhancedResponse(
        userId,
        query,
        challengeType,
        emotionallyAdaptedResponse
      );

      // Get comprehensive insights
      const emotionalInsights = await emotionalIntelligence.identifyEmotionalInsights(userId, challengeType);
      const predictiveInsights = await predictiveIntelligence.generatePredictiveInsights(userId, challengeType);
      const completionForecast = await predictiveIntelligence.predictCompletionLikelihood(userId, challengeType);

      // Track usage
      await trackUsage(userId, 'supreme_coaching', createInputHash(query, 'supreme_coaching'), 1200, 0.015);

      res.json({
        response: memoryEnhancedResponse,
        emotionalInsights,
        predictiveInsights,
        completionForecast,
        personalizationMethod: 'vector_emotional_memory_predictive_intelligence',
        challengeType,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Supreme coaching error:", error);
      res.status(500).json({ error: "Failed to generate supreme coaching response" });
    }
  });

  // Intelligent Cost-Optimized AI Coaching endpoint
  app.post("/api/ai/smart-coaching", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { query, challengeType = 'general_quantum', userTier = 'basic' } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Validate AI request
      const validation = await validateAIRequest({
        userId,
        requestType: 'smart_coaching',
        input: query,
        challengeType,
        userTier
      });

      if (!validation.allowed) {
        return res.status(429).json({ 
          error: validation.reason,
          remainingRequests: validation.remainingRequests
        });
      }

      // Initialize systems
      try {
        await vectorPersonalization.initialize();
        await vectorPersonalization.indexChallengeContent();
        await vectorPersonalization.indexUserData(userId);
      } catch (initError) {
        console.log("Systems already initialized");
      }

      // Get personalized context using semantic search
      const personalizedContext = await vectorPersonalization.getPersonalizedContext(
        userId, 
        query, 
        challengeType
      );

      // Create enhanced system prompt
      const systemPrompt = `You are an advanced AI quantum consciousness coach specializing in ${challengeType}. 

${personalizedContext.personalizedPrompt}

Provide personalized, actionable guidance that:
- References specific challenge techniques and practices
- Builds upon user's documented experiences and insights
- Adapts Joe Dispenza and Neville Goddard methods to this specific challenge
- Addresses user's current progress level and challenges
- Maintains quantum consciousness framework while being personally relevant`;

      // Use intelligent model routing
      const aiResult = await modelRouter.executeWithOptimalModel(
        query,
        systemPrompt,
        query,
        'smart_coaching',
        challengeType,
        userTier,
        { temperature: 0.7, maxTokens: 1500 }
      );

      // Get additional insights based on complexity
      let additionalInsights = {};
      if (aiResult.routingDecision.complexity === 'complex') {
        const emotionalInsights = await emotionalIntelligence.identifyEmotionalInsights(userId, challengeType);
        const predictiveInsights = await predictiveIntelligence.generatePredictiveInsights(userId, challengeType);
        additionalInsights = { emotionalInsights, predictiveInsights };
      }

      // Track usage with actual cost
      await trackUsage(userId, 'smart_coaching', createInputHash(query, 'smart_coaching'), 800, 0.008);

      res.json({
        response: aiResult.response,
        modelUsed: aiResult.modelUsed,
        routingDecision: aiResult.routingDecision,
        actualCost: aiResult.actualCost,
        ...additionalInsights,
        personalizationMethod: 'intelligent_model_routing_with_vector_search',
        challengeType,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Smart coaching error:", error);
      res.status(500).json({ error: "Failed to generate smart coaching response" });
    }
  });

  // Model routing analytics endpoint
  app.get("/api/ai/routing-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { days = 30 } = req.query;

      const routingStats = await modelRouter.getRoutingStats(userId, parseInt(days as string));

      res.json({
        stats: routingStats,
        period: `${days} days`,
        analysisDate: new Date().toISOString()
      });

    } catch (error) {
      console.error("Routing stats error:", error);
      res.status(500).json({ error: "Failed to get routing statistics" });
    }
  });

  // Market Research endpoint for pricing analysis
  app.get("/api/market-research", isAuthenticated, async (req: any, res) => {
    try {
      console.log("Starting market research analysis...");
      const researchData = await conductMarketResearch();
      const analysis = await analyzePricingStrategy(researchData);
      
      res.json({
        timestamp: new Date().toISOString(),
        analysis,
        researchData
      });
    } catch (error) {
      console.error("Market research error:", error);
      res.status(500).json({ error: "Failed to conduct market research" });
    }
  });

  // Test endpoint without auth to verify server is working
  app.get('/api/test', async (req: any, res) => {
    res.json({ message: "Server is working", timestamp: new Date().toISOString() });
  });

  // Cache demonstration endpoint - no auth required for testing
  app.get('/api/cache-demo', async (req: any, res) => {
    try {
      const { determineCacheStrategy, getTemplateResponse } = await import("./enhanced-caching");
      const { createInputHash } = await import("./deep-journaling/ai-cost-control");
      
      const testQuestions = [
        "How long should I practice today's meditation?",
        "What if I'm having trouble with this exercise?",
        "How does this connect to quantum physics?"
      ];
      
      const results = [];
      
      for (const question of testQuestions) {
        const startTime = Date.now();
        
        // Test caching strategy
        const strategy = determineCacheStrategy(question, 'general_quantum', 1, 'basic');
        
        let responseSource = 'unknown';
        let cost = 0.02;
        let hasResponse = false;
        
        // Check if template response exists
        if (strategy.useTemplateResponse) {
          const templateResponse = getTemplateResponse(strategy.reason);
          if (templateResponse) {
            responseSource = 'template';
            cost = 0;
            hasResponse = true;
          }
        }
        
        const responseTime = Date.now() - startTime;
        
        results.push({
          question,
          strategy: strategy.reason,
          useTemplate: strategy.useTemplateResponse,
          usePreGenerated: strategy.usePreGenerated,
          generateFresh: strategy.generateFresh,
          responseSource,
          responseTime,
          cost,
          hasResponse
        });
      }
      
      const summary = {
        totalQuestions: results.length,
        templateHits: results.filter(r => r.responseSource === 'template').length,
        avgResponseTime: Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length),
        costSavings: results.filter(r => r.cost === 0).length * 0.02
      };
      
      res.json({
        message: "Cache system demonstration",
        results,
        summary,
        explanation: "This shows how the enhanced caching system routes different question types to appropriate response sources",
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Cache demo error:", error);
      res.status(500).json({ error: "Failed to demonstrate cache system" });
    }
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

  // AI personalized coaching endpoint - Advanced AI Couch Engine
  app.post('/api/ai/coaching', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userGoals, currentChallenges, mood, challengeType, currentDay } = req.body;
      
      console.log("Generating advanced AI coaching with sophisticated engine:", { userId, challengeType, currentDay });
      
      // Track AI usage
      await trackUsage(
        userId,
        'advanced_coaching',
        JSON.stringify({ userGoals, currentChallenges, mood, challengeType }),
        0,
        0
      );
      
      // Use advanced AI coaching engine with multidisciplinary approach
      const userInput = `Goals: ${userGoals}. Challenges: ${Array.isArray(currentChallenges) ? currentChallenges.join(', ') : currentChallenges}. Energy level: ${mood}/10.`;
      const context = `Day ${currentDay} of ${challengeType} challenge. User seeking personalized coaching and guidance.`;
      
      const advancedCoaching = await aiCouchEngine.generatePersonalizedResponse(
        userId,
        userInput,
        context,
        'advanced_coaching'
      );
      
      // Parse the AI response and structure it for the frontend
      const structuredResponse = {
        personalizedMessage: advancedCoaching.response || "Your personalized guidance is ready.",
        todaysRecommendation: `Based on your goals and current energy level (${mood}/10), focus on integrating multiple therapeutic approaches that support your growth today.`,
        practiceAdjustments: [
          "Apply consciousness expansion techniques suited to your current state",
          "Integrate trauma-informed practices with manifestation work", 
          "Use breathwork and energy healing as foundational support",
          "Practice quantum consciousness techniques for deeper transformation"
        ],
        modalities_used: advancedCoaching.modalities_used || [],
        emotional_tone: advancedCoaching.emotional_tone || 'supportive',
        patterns_detected: advancedCoaching.patterns_detected || [],
        timestamp: advancedCoaching.timestamp
      };
      
      console.log("Generated advanced coaching response with modalities:", structuredResponse.modalities_used);
      
      // Save to response history
      await db.insert(aiResponseHistory).values({
        userId,
        sessionType: 'advanced_coaching',
        userInput: userInput,
        aiResponse: structuredResponse,
        challengeType: challengeType,
        day: currentDay,
        tags: ['advanced_coaching', 'multidisciplinary', 'ai_couch', challengeType || 'general']
      });
      
      res.json(structuredResponse);
    } catch (error) {
      console.error("Error generating advanced AI coaching:", error);
      res.status(500).json({ message: "Failed to generate advanced coaching", error: (error as Error).message });
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
      res.status(500).json({ message: "Failed to generate affirmation", error: (error as Error).message });
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
      res.status(500).json({ message: "Failed to generate affirmation", error: (error as Error).message });
    }
  });

  // AI Response History endpoints
  app.get('/api/ai/response-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { 
        sessionType, 
        challengeType, 
        searchQuery, 
        isFavorited, 
        limit = 50, 
        offset = 0 
      } = req.query;

      // Build conditions array
      const conditions = [eq(aiResponseHistory.userId, userId)];
      
      if (sessionType) {
        conditions.push(eq(aiResponseHistory.sessionType, sessionType));
      }
      if (challengeType) {
        conditions.push(eq(aiResponseHistory.challengeType, challengeType));
      }
      if (isFavorited === 'true') {
        conditions.push(eq(aiResponseHistory.isFavorited, true));
      }
      if (searchQuery) {
        const searchCondition = or(
          ilike(aiResponseHistory.userInput, `%${searchQuery}%`),
          ilike(aiResponseHistory.aiResponse, `%${searchQuery}%`)
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      const responses = await db
        .select()
        .from(aiResponseHistory)
        .where(and(...conditions))
        .orderBy(desc(aiResponseHistory.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      res.json(responses);
    } catch (error) {
      console.error("Error fetching AI response history:", error);
      res.status(500).json({ message: "Failed to fetch response history", error: (error as Error).message });
    }
  });

  // Toggle favorite status
  app.patch('/api/ai/response-history/:id/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const responseId = parseInt(req.params.id);
      const { isFavorited } = req.body;

      await db
        .update(aiResponseHistory)
        .set({ isFavorited, updatedAt: new Date() })
        .where(and(
          eq(aiResponseHistory.id, responseId),
          eq(aiResponseHistory.userId, userId)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating favorite status:", error);
      res.status(500).json({ message: "Failed to update favorite status", error: (error as Error).message });
    }
  });

  // Rate AI response
  app.patch('/api/ai/response-history/:id/rate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const responseId = parseInt(req.params.id);
      const { rating } = req.body;

      await db
        .update(aiResponseHistory)
        .set({ rating, updatedAt: new Date() })
        .where(and(
          eq(aiResponseHistory.id, responseId),
          eq(aiResponseHistory.userId, userId)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Error rating response:", error);
      res.status(500).json({ message: "Failed to rate response", error: (error as Error).message });
    }
  });

  // Delete AI response from history
  app.delete('/api/ai/response-history/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const responseId = parseInt(req.params.id);

      await db
        .delete(aiResponseHistory)
        .where(and(
          eq(aiResponseHistory.id, responseId),
          eq(aiResponseHistory.userId, userId)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting response:", error);
      res.status(500).json({ message: "Failed to delete response", error: (error as Error).message });
    }
  });

  // Generate authentic usage data (admin only)
  app.post("/api/admin/generate-usage", isAuthenticated, async (req: any, res) => {
    try {
      const { generateAuthenticUsageData } = await import('./generate-authentic-usage');
      await generateAuthenticUsageData();
      res.json({ message: "Authentic usage data generated successfully", status: "complete" });
    } catch (error) {
      console.error("Error generating usage data:", error);
      res.status(500).json({ error: "Failed to generate usage data" });
    }
  });

  // ===================================
  // AI COUCH SYSTEM ROUTES - INDEPENDENT MODULE
  // ===================================

  // AI Couch onboarding assessment
  app.post('/api/ai-couch/assessment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const assessmentData = req.body;
      const profile = await aiCouchEngine.createUserProfile(userId, assessmentData);
      
      res.json({ 
        success: true, 
        profile,
        message: "AI Couch profile created successfully" 
      });
    } catch (error) {
      console.error("Error creating AI Couch profile:", error);
      res.status(500).json({ message: "Failed to create profile", error: (error as Error).message });
    }
  });

  // Get AI Couch profile
  app.get('/api/ai-couch/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get existing profile from database
      const profile = await storage.getAICouchProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error getting AI Couch profile:", error);
      res.status(500).json({ message: "Failed to get profile", error: (error as Error).message });
    }
  });

  // Update AI Couch profile
  app.put('/api/ai-couch/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const updatedData = req.body;
      
      // Update profile in database
      const profile = await storage.updateAICouchProfile(userId, updatedData);
      
      // Trigger AI reassessment based on updated profile
      await aiCouchEngine.performDynamicAssessment(userId);
      
      res.json({ 
        success: true, 
        profile,
        message: "Profile updated and AI coaching adapted to your changes" 
      });
    } catch (error) {
      console.error("Error updating AI Couch profile:", error);
      res.status(500).json({ message: "Failed to update profile", error: (error as Error).message });
    }
  });

  // Get today's personalized daily assessment (AI-driven)
  app.get('/api/ai-couch/daily-assessment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      // Check if user has today's assessment
      const today = new Date().toISOString().split('T')[0];
      const { aiCouchDailyAssessments } = await import('@shared/schema');
      
      const [existingAssessment] = await db
        .select()
        .from(aiCouchDailyAssessments)
        .where(and(
          eq(aiCouchDailyAssessments.userId, userId),
          eq(aiCouchDailyAssessments.assessmentDate, today)
        ))
        .limit(1);

      if (existingAssessment) {
        return res.json(existingAssessment);
      }

      // Create new AI-driven daily assessment
      const dailyPlan = await aiCouchEngine.generateDailyAssessment(userId);
      
      // Get user profile
      const profile = await storage.getAICouchProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Save to database
      const [newAssessment] = await db
        .insert(aiCouchDailyAssessments)
        .values({
          userId,
          profileId: profile.id,
          assessmentDate: today,
          currentFocus: dailyPlan.currentFocus,
          reasoning: dailyPlan.reasoning,
          title: dailyPlan.dailyAssessment.title,
          description: dailyPlan.dailyAssessment.description,
          exercises: dailyPlan.dailyAssessment.exercises,
          reflectionQuestions: dailyPlan.dailyAssessment.reflectionQuestions,
          completionCriteria: dailyPlan.dailyAssessment.completionCriteria,
          therapeuticApproaches: dailyPlan.progressIndicators,
          nextSteps: dailyPlan.nextSteps,
          progressIndicators: dailyPlan.progressIndicators,
        })
        .returning();

      res.json(newAssessment);
    } catch (error) {
      console.error("Error getting daily assessment:", error);
      res.status(500).json({ message: "Failed to get daily assessment", error: (error as Error).message });
    }
  });

  // Complete daily assessment with user responses
  app.post('/api/ai-couch/complete-assessment/:assessmentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { assessmentId } = req.params;
      const { userResponses } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      const { aiCouchDailyAssessments } = await import('@shared/schema');

      // Update assessment as completed
      const [updatedAssessment] = await db
        .update(aiCouchDailyAssessments)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          userResponses,
          updatedAt: new Date()
        })
        .where(and(
          eq(aiCouchDailyAssessments.id, parseInt(assessmentId)),
          eq(aiCouchDailyAssessments.userId, userId)
        ))
        .returning();

      if (!updatedAssessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Process responses for next day adaptation
      const adaptationInsights = await aiCouchEngine.processDailyCheckIn(userId, userResponses);

      res.json({ 
        success: true, 
        assessment: updatedAssessment,
        adaptationInsights 
      });
    } catch (error) {
      console.error("Error completing assessment:", error);
      res.status(500).json({ message: "Failed to complete assessment", error: (error as Error).message });
    }
  });

  // Get user's assessment history and progress
  app.get('/api/ai-couch/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiCouchDailyAssessments } = await import('@shared/schema');

      const assessments = await db
        .select()
        .from(aiCouchDailyAssessments)
        .where(eq(aiCouchDailyAssessments.userId, userId))
        .orderBy(desc(aiCouchDailyAssessments.assessmentDate))
        .limit(30);

      const completedCount = assessments.filter(a => a.isCompleted).length;
      
      // Calculate current streak of completed assessments
      let currentStreak = 0;
      for (const assessment of assessments) {
        if (assessment.isCompleted) {
          currentStreak++;
        } else {
          break;
        }
      }

      res.json({
        assessments,
        stats: {
          totalAssessments: assessments.length,
          completedAssessments: completedCount,
          completionRate: assessments.length > 0 ? (completedCount / assessments.length) * 100 : 0,
          currentStreak
        }
      });
    } catch (error) {
      console.error("Error getting progress:", error);
      res.status(500).json({ message: "Failed to get progress", error: (error as Error).message });
    }
  });

  // AI Couch intelligent multidisciplinary coaching session
  app.post('/api/ai-couch/session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { multidisciplinaryAIEngine } = await import('./multidisciplinary-ai-engine');
      
      const { 
        userInput, 
        sessionType = 'intelligent_coaching'
      } = req.body;

      const session = await multidisciplinaryAIEngine.processCoachingRequest(
        userId, 
        userInput, 
        sessionType
      );
      
      res.json(session);
    } catch (error: unknown) {
      console.error("Error conducting multidisciplinary session:", error);
      res.status(500).json({ 
        message: "Failed to conduct session", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate personalized challenge plan
  app.post('/api/ai-couch/generate-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const { 
        baseChallengeType, 
        userSpecificNeeds 
      } = req.body;

      // Get user profile first
      const { aiCouchProfiles } = await import('@shared/schema');
      const [profile] = await db
        .select()
        .from(aiCouchProfiles)
        .where(eq(aiCouchProfiles.userId, userId));

      if (!profile) {
        return res.status(400).json({ message: "AI Couch profile required. Please complete assessment first." });
      }

      const plan = await aiCouchEngine.generatePersonalizedChallenge(
        userId,
        baseChallengeType,
        30
      );
      
      res.json(plan);
    } catch (error) {
      console.error("Error generating personalized plan:", error);
      res.status(500).json({ message: "Failed to generate plan", error: (error as Error).message });
    }
  });

  // Generate daily adaptive activity
  app.post('/api/ai-couch/daily-activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const { 
        planId, 
        day, 
        userCurrentState 
      } = req.body;

      const activity = await aiCouchEngine.generateDailyActivity(
        userId,
        planId,
        day
      );
      
      res.json(activity);
    } catch (error) {
      console.error("Error generating daily activity:", error);
      res.status(500).json({ message: "Failed to generate activity", error: (error as Error).message });
    }
  });

  // Get AI Couch user profile
  app.get('/api/ai-couch/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiCouchProfiles } = await import('@shared/schema');
      
      const [profile] = await db
        .select()
        .from(aiCouchProfiles)
        .where(eq(aiCouchProfiles.userId, userId));
      
      res.json(profile || null);
    } catch (error) {
      console.error("Error fetching AI Couch profile:", error);
      res.status(500).json({ message: "Failed to fetch profile", error: (error as Error).message });
    }
  });

  // Get user's personalized challenge plans
  app.get('/api/ai-couch/plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { personalizedChallengePlans } = await import('@shared/schema');
      
      const plans = await db
        .select({
          id: personalizedChallengePlans.id,
          userId: personalizedChallengePlans.userId,
          planName: personalizedChallengePlans.planName,
          baseChallengeType: personalizedChallengePlans.baseChallengeType,
          status: personalizedChallengePlans.status,
          currentDay: personalizedChallengePlans.currentDay,
          totalDays: personalizedChallengePlans.totalDays,
          createdAt: personalizedChallengePlans.createdAt
        })
        .from(personalizedChallengePlans)
        .where(eq(personalizedChallengePlans.userId, userId))
        .orderBy(desc(personalizedChallengePlans.createdAt));
      
      res.json(plans);
    } catch (error) {
      console.error("Error fetching personalized plans:", error);
      res.status(500).json({ message: "Failed to fetch plans", error: (error as Error).message });
    }
  });

  // Get daily activities for a plan
  app.get('/api/ai-couch/plans/:planId/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const planId = parseInt(req.params.planId);
      const { dailyAdaptiveActivities } = await import('@shared/schema');
      
      const activities = await db
        .select()
        .from(dailyAdaptiveActivities)
        .where(and(
          eq(dailyAdaptiveActivities.planId, planId),
          eq(dailyAdaptiveActivities.userId, userId)
        ))
        .orderBy(dailyAdaptiveActivities.day);
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching plan activities:", error);
      res.status(500).json({ message: "Failed to fetch activities", error: (error as Error).message });
    }
  });

  // Complete daily activity
  app.patch('/api/ai-couch/activities/:activityId/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activityId = parseInt(req.params.activityId);
      const { 
        completionTime, 
        userFeedback, 
        emotionalResponse, 
        effectiveness 
      } = req.body;
      
      const { dailyAdaptiveActivities } = await import('@shared/schema');
      
      await db
        .update(dailyAdaptiveActivities)
        .set({
          completed: true,
          completionTime,
          userFeedback,
          emotionalResponse,
          effectiveness,
          completedAt: new Date()
        })
        .where(and(
          eq(dailyAdaptiveActivities.id, activityId),
          eq(dailyAdaptiveActivities.userId, userId)
        ));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing activity:", error);
      res.status(500).json({ message: "Failed to complete activity", error: (error as Error).message });
    }
  });

  // Get AI Couch session history
  app.get('/api/ai-couch/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = 20, offset = 0, sessionType } = req.query;
      const { aiCouchSessions } = await import('@shared/schema');
      
      const conditions = [eq(aiCouchSessions.userId, userId)];
      if (sessionType) {
        conditions.push(eq(aiCouchSessions.sessionType, sessionType as string));
      }
      
      const sessions = await db
        .select()
        .from(aiCouchSessions)
        .where(and(...conditions))
        .orderBy(desc(aiCouchSessions.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching AI Couch sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions", error: (error as Error).message });
    }
  });

  // Update AI Couch profile preferences
  app.patch('/api/ai-couch/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const { aiCouchProfiles } = await import('@shared/schema');
      
      await db
        .update(aiCouchProfiles)
        .set({
          ...updates,
          lastUpdated: new Date()
        })
        .where(eq(aiCouchProfiles.userId, userId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating AI Couch profile:", error);
      res.status(500).json({ message: "Failed to update profile", error: (error as Error).message });
    }
  });

  // Daily companion functionality - morning prompt
  app.get('/api/ai-couch/morning-prompt', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const prompt = await aiCouchEngine.generateMorningPrompt(userId);
      res.json(prompt);
    } catch (error) {
      console.error("Error generating morning prompt:", error);
      res.status(500).json({ message: "Failed to generate morning prompt", error: (error as Error).message });
    }
  });

  // Daily companion functionality - evening reflection
  app.post('/api/ai-couch/evening-reflection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dayExperiences } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const reflection = await aiCouchEngine.generateEveningReflection(userId, dayExperiences);
      res.json(reflection);
    } catch (error) {
      console.error("Error generating evening reflection:", error);
      res.status(500).json({ message: "Failed to generate evening reflection", error: (error as Error).message });
    }
  });

  // Weekly pattern analysis
  app.get('/api/ai-couch/weekly-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const summary = await aiCouchEngine.generateWeeklyPatternSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error generating weekly summary:", error);
      res.status(500).json({ message: "Failed to generate weekly summary", error: (error as Error).message });
    }
  });

  // Crisis support mode
  app.post('/api/ai-couch/crisis-support', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { crisisInput, severityLevel = 3 } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const support = await aiCouchEngine.provideCrisisSupport(userId, crisisInput, severityLevel);
      res.json(support);
    } catch (error) {
      console.error("Error providing crisis support:", error);
      res.status(500).json({ message: "Failed to provide crisis support", error: (error as Error).message });
    }
  });

  // Generate therapeutic intervention
  app.post('/api/ai-couch/intervention', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetPattern, interventionType } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const intervention = await aiCouchEngine.generateTherapeuticIntervention(
        userId, 
        targetPattern, 
        interventionType
      );
      res.json(intervention);
    } catch (error) {
      console.error("Error generating therapeutic intervention:", error);
      res.status(500).json({ message: "Failed to generate intervention", error: (error as Error).message });
    }
  });

  // Dynamic assessment engine
  app.get('/api/ai-couch/dynamic-assessment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const assessment = await aiCouchEngine.performDynamicAssessment(userId);
      res.json(assessment);
    } catch (error) {
      console.error("Error performing dynamic assessment:", error);
      res.status(500).json({ message: "Failed to perform assessment", error: (error as Error).message });
    }
  });

  // Generate modular challenge blocks
  app.post('/api/ai-couch/challenge-blocks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { blockTypes, userCurrentLevel } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const blocks = await aiCouchEngine.generateModularChallengeBlocks(
        userId, 
        blockTypes, 
        userCurrentLevel
      );
      res.json(blocks);
    } catch (error) {
      console.error("Error generating challenge blocks:", error);
      res.status(500).json({ message: "Failed to generate challenge blocks", error: (error as Error).message });
    }
  });

  // Real-time adaptation
  app.post('/api/ai-couch/adapt', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { todaysInputs } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const adaptation = await aiCouchEngine.performRealTimeAdaptation(userId, todaysInputs);
      res.json(adaptation);
    } catch (error) {
      console.error("Error performing real-time adaptation:", error);
      res.status(500).json({ message: "Failed to perform adaptation", error: (error as Error).message });
    }
  });

  // Multi-layer personality profiling
  app.post('/api/ai-couch/personality-profiling', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { assessmentInputs } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const profile = await aiCouchEngine.performMultiLayerPersonalityProfiling(userId, assessmentInputs);
      res.json(profile);
    } catch (error) {
      console.error("Error performing personality profiling:", error);
      res.status(500).json({ message: "Failed to perform personality profiling", error: (error as Error).message });
    }
  });

  // Predictive guidance
  app.get('/api/ai-couch/predictive-guidance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const guidance = await aiCouchEngine.generatePredictiveGuidance(userId);
      res.json(guidance);
    } catch (error) {
      console.error("Error generating predictive guidance:", error);
      res.status(500).json({ message: "Failed to generate predictive guidance", error: (error as Error).message });
    }
  });

  // Expert knowledge integration
  app.post('/api/ai-couch/expert-knowledge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { expertDomain, userIssue } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const guidance = await aiCouchEngine.applyExpertKnowledgeIntegration(
        userId, 
        expertDomain, 
        userIssue
      );
      res.json(guidance);
    } catch (error) {
      console.error("Error applying expert knowledge:", error);
      res.status(500).json({ message: "Failed to apply expert knowledge", error: (error as Error).message });
    }
  });

  // Advanced pattern recognition
  app.get('/api/ai-couch/pattern-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const patterns = await aiCouchEngine.performAdvancedPatternRecognition(userId);
      res.json(patterns);
    } catch (error) {
      console.error("Error performing pattern analysis:", error);
      res.status(500).json({ message: "Failed to perform pattern analysis", error: (error as Error).message });
    }
  });

  // Multidisciplinary Expert Assessment
  app.post('/api/ai-couch/multidisciplinary-assessment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currentIssues, goals } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const assessment = await aiCouchEngine.performMultidisciplinaryAssessment(userId, currentIssues, goals);
      res.json(assessment);
    } catch (error) {
      console.error("Error in multidisciplinary assessment:", error);
      res.status(500).json({ message: "Failed to perform assessment" });
    }
  });

  // Expert Domain Guidance
  app.post('/api/ai-couch/expert-guidance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { expertDomain, userIssue } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const guidance = await aiCouchEngine.applyExpertKnowledgeIntegration(userId, expertDomain, userIssue);
      res.json(guidance);
    } catch (error) {
      console.error("Error in expert guidance:", error);
      res.status(500).json({ message: "Failed to provide expert guidance" });
    }
  });

  // CBT Therapist Session
  app.post('/api/ai-couch/cbt-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userIssue } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const guidance = await aiCouchEngine.applyExpertKnowledgeIntegration(userId, 'cbt_therapist', userIssue);
      res.json(guidance);
    } catch (error) {
      console.error("Error in CBT session:", error);
      res.status(500).json({ message: "Failed to provide CBT guidance" });
    }
  });

  // Trauma Therapy Session
  app.post('/api/ai-couch/trauma-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userIssue } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const guidance = await aiCouchEngine.applyExpertKnowledgeIntegration(userId, 'trauma_therapist', userIssue);
      res.json(guidance);
    } catch (error) {
      console.error("Error in trauma therapy session:", error);
      res.status(500).json({ message: "Failed to provide trauma therapy guidance" });
    }
  });

  // EFT Tapping Session
  app.post('/api/ai-couch/eft-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userIssue } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const guidance = await aiCouchEngine.applyExpertKnowledgeIntegration(userId, 'eft_practitioner', userIssue);
      res.json(guidance);
    } catch (error) {
      console.error("Error in EFT session:", error);
      res.status(500).json({ message: "Failed to provide EFT guidance" });
    }
  });

  // Meditation Instruction Session
  app.post('/api/ai-couch/meditation-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userIssue } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const guidance = await aiCouchEngine.applyExpertKnowledgeIntegration(userId, 'meditation_instructor', userIssue);
      res.json(guidance);
    } catch (error) {
      console.error("Error in meditation session:", error);
      res.status(500).json({ message: "Failed to provide meditation guidance" });
    }
  });

  // Nutritional Psychiatry Session
  app.post('/api/ai-couch/nutrition-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userIssue } = req.body;
      const { aiCouchEngine } = await import('./ai-couch-engine');
      
      const guidance = await aiCouchEngine.applyExpertKnowledgeIntegration(userId, 'nutritional_psychiatrist', userIssue);
      res.json(guidance);
    } catch (error) {
      console.error("Error in nutrition session:", error);
      res.status(500).json({ message: "Failed to provide nutritional guidance" });
    }
  });

  // Get Available Expert Domains
  app.get('/api/ai-couch/expert-domains', isAuthenticated, async (req: any, res) => {
    try {
      const { multidisciplinaryExpertise } = await import('./multidisciplinary-expertise');
      
      const domains = Object.keys(multidisciplinaryExpertise).map(key => ({
        id: key,
        name: multidisciplinaryExpertise[key].name,
        description: multidisciplinaryExpertise[key].description,
        applications: multidisciplinaryExpertise[key].applications,
        techniques: multidisciplinaryExpertise[key].techniques.slice(0, 3) // First 3 techniques
      }));
      
      res.json(domains);
    } catch (error) {
      console.error("Error fetching expert domains:", error);
      res.status(500).json({ message: "Failed to fetch expert domains" });
    }
  });

  // AI Vision Board Guide
  app.post('/api/ai/vision-board-guide', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { userGoals, userTier = 'basic' } = req.body;
      
      if (!userGoals) {
        return res.status(400).json({ error: 'User goals are required' });
      }

      // Import cost control functions
      const { 
        validateAIRequest, 
        getCachedResponse, 
        cacheResponse, 
        trackUsage,
        createInputHash 
      } = await import('./ai-cost-control');

      // Validate AI request with cost controls
      const inputHash = createInputHash(userGoals, 'vision_guide');
      const validation = await validateAIRequest({
        userId,
        requestType: 'vision_guide',
        input: userGoals,
        userTier
      });

      if (!validation.allowed) {
        return res.status(429).json({ 
          error: validation.reason,
          remainingRequests: validation.remainingRequests 
        });
      }

      // Check cache first
      if (validation.cachedResponse) {
        await trackUsage(userId, 'vision_guide', inputHash, 0, 0);
        return res.json({ 
          ...validation.cachedResponse, 
          fromCache: true,
          remainingRequests: validation.remainingRequests
        });
      }

      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are an expert vision board coach and manifestation specialist. Analyze the user's goals and provide a comprehensive, personalized vision board creation guide.

User's Goals and Aspirations:
${userGoals}

Create a detailed, actionable guide with the following structure (respond in JSON format):

{
  "goalAnalysis": {
    "primaryGoals": ["array of 3-5 main goals extracted"],
    "timeframe": "short-term/medium-term/long-term based on their timeline",
    "motivationType": "achievement-focused/experience-focused/impact-focused etc",
    "emotionalTheme": "primary emotional driver"
  },
  "imageRecommendations": [
    {
      "category": "Professional/Career",
      "suggestions": ["specific image ideas"],
      "reasoning": "why these images align with their goals"
    }
  ],
  "layoutSuggestions": {
    "style": "Central Focus/Grid Layout/Flow Design etc",
    "description": "detailed layout recommendation",
    "positioning": ["specific positioning tips"]
  },
  "textElements": {
    "affirmations": ["5 personalized present-tense affirmations"],
    "powerWords": ["motivational words that align with their goals"],
    "deadlines": ["key dates and milestones to include"]
  },
  "colorTheme": {
    "recommended": "Energetic/Calm/Nature/Passionate/Focused/Loving",
    "reasoning": "why this theme matches their goals and personality",
    "alternatives": ["2-3 backup theme options"]
  },
  "manifestationTips": ["5-7 specific manifestation techniques for their goals"],
  "actionSteps": ["5-7 concrete next steps they should take"]
}

Make recommendations specific to their exact goals, timeline, and aspirations. Focus on practical, actionable advice that will help them create a powerful vision board for manifestation.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert vision board coach and manifestation specialist. Provide detailed, personalized guidance for creating effective vision boards."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const guide = JSON.parse(response.choices[0].message.content);

      res.json({ 
        success: true, 
        guide,
        message: "Personalized vision board guide generated successfully"
      });

    } catch (error) {
      console.error('Vision board guide generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate vision board guide',
        details: error.message 
      });
    }
  });

  // AI Vision Board Suggestions - Contextual board analysis and improvements
  app.post('/api/ai/vision-board-suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { boardData, userGoals, focusArea, currentContent, userTier = 'basic' } = req.body;
      
      if (!boardData || !userGoals || !focusArea) {
        return res.status(400).json({ error: 'Board data, user goals, and focus area are required' });
      }

      // Import cost control functions
      const { 
        validateAIRequest, 
        getCachedResponse, 
        cacheResponse, 
        trackUsage,
        createInputHash 
      } = await import('./ai-cost-control');

      // Create input for validation and caching
      const inputText = JSON.stringify({ boardData, userGoals, focusArea });
      const inputHash = createInputHash(inputText, 'vision_suggestions', focusArea);

      // Validate AI request with cost controls
      const validation = await validateAIRequest({
        userId,
        requestType: 'vision_suggestions',
        input: inputText,
        challengeType: focusArea,
        userTier
      });

      if (!validation.allowed) {
        return res.status(429).json({ 
          error: validation.reason,
          remainingRequests: validation.remainingRequests 
        });
      }

      // Check cache first
      if (validation.cachedResponse) {
        await trackUsage(userId, 'vision_suggestions', inputHash, 0, 0);
        return res.json({ 
          ...validation.cachedResponse, 
          fromCache: true,
          remainingRequests: validation.remainingRequests
        });
      }

      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const analysisPrompt = `You are an expert vision board consultant specializing in contextual analysis and improvement recommendations. 

CURRENT VISION BOARD ANALYSIS:
- Title: ${boardData.title}
- Description: ${boardData.description}
- Total items on board: ${boardData.items?.length || 0}
- Background color: ${boardData.backgroundColor}
- Focus area: ${focusArea}
- User goals: ${userGoals}

CURRENT BOARD CONTENT:
${boardData.items?.map(item => `- ${item.type}: ${item.content || 'visual element'}`).join('\n') || 'Empty board'}

TASK: Analyze this vision board and provide 5-8 specific, actionable suggestions to enhance its effectiveness for manifestation and goal achievement.

For each suggestion, consider:
1. What's missing that would strengthen the vision
2. How current elements could be enhanced
3. Specific text phrases that would be powerful
4. Visual elements that would support the goals
5. Layout improvements for better flow
6. Color psychology for the chosen focus area

Respond with a JSON object containing an array of suggestions. Each suggestion should have:
- type: 'text', 'image', 'element', 'color', or 'layout'
- title: Brief descriptive title
- description: Clear explanation of what to add/change
- content: Specific content to add (if applicable)
- reasoning: Why this suggestion enhances manifestation
- confidence: 0.0-1.0 confidence score
- category: Category like 'motivation', 'visual', 'affirmation', etc.
- preview: Short preview of the suggested content (if applicable)

Focus on practical, implementable suggestions that directly support their ${focusArea} goals.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert vision board consultant who analyzes existing boards and provides specific, actionable improvement suggestions for better manifestation results."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 3000
      });

      const aiResponse = JSON.parse(response.choices[0].message.content);
      const responseData = {
        success: true, 
        suggestions: aiResponse.suggestions || [],
        analysis: aiResponse.analysis || "Analysis complete",
        message: "Vision board suggestions generated successfully"
      };

      // Calculate usage for tracking
      const tokensUsed = Math.ceil(inputText.length / 4) + Math.ceil(JSON.stringify(responseData).length / 4);
      const cost = Math.ceil(tokensUsed * 0.00003 * 100); // GPT-4o pricing

      // Cache the response for future use
      await cacheResponse(inputHash, responseData, 'vision_suggestions', 24); // 24 hour cache

      // Track usage
      await trackUsage(userId, 'vision_suggestions', inputHash, tokensUsed, cost);

      res.json({ 
        ...responseData,
        remainingRequests: validation.remainingRequests
      });

    } catch (error) {
      console.error('Vision board suggestions error:', error);
      res.status(500).json({ 
        error: 'Failed to generate vision board suggestions',
        details: error.message 
      });
    }
  });

  // AI Image Generation
  app.post('/api/ai/generate-image', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { prompt, size = '1024x1024', quality = 'standard', userTier = 'basic' } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Import cost control functions
      const { 
        validateAIRequest, 
        getCachedResponse, 
        cacheResponse, 
        trackUsage,
        createInputHash 
      } = await import('./ai-cost-control');

      // Validate AI request with cost controls
      const inputHash = createInputHash(prompt, 'image_generation');
      const validation = await validateAIRequest({
        userId,
        requestType: 'image_generation',
        input: prompt,
        userTier
      });

      if (!validation.allowed) {
        return res.status(429).json({ 
          error: validation.reason,
          remainingRequests: validation.remainingRequests 
        });
      }

      // Check cache first
      if (validation.cachedResponse) {
        await trackUsage(userId, 'image_generation', inputHash, 0, 0);
        return res.json({ 
          ...validation.cachedResponse, 
          fromCache: true,
          remainingRequests: validation.remainingRequests
        });
      }

      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const startTime = Date.now();
      
      // Generate image using DALL-E
      const response = await openai.images.generate({
        model: "dall-e-3", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        prompt: prompt,
        n: 1,
        size: size as "1024x1024" | "1792x1024" | "1024x1792",
        quality: quality as "standard" | "hd"
      });

      const responseTime = Date.now() - startTime;
      const imageUrl = response.data[0]?.url;
      
      if (!imageUrl) {
        throw new Error('No image URL received from OpenAI');
      }

      // Calculate cost (DALL-E pricing: ~$0.04 for standard, ~$0.08 for HD)
      const cost = quality === 'hd' ? 0.08 : 0.04;

      // Save generated image to user's gallery
      const savedImage = await storage.saveGeneratedImage({
        userId: userId.toString(),
        imageUrl,
        prompt,
        size,
        quality,
        model: 'dall-e-3',
        cost,
        generationType: 'ai_generation'
      });

      const result = {
        imageUrl,
        prompt,
        size,
        quality,
        model: 'dall-e-3',
        cost,
        remainingRequests: validation.remainingRequests,
        savedToGallery: true,
        galleryId: savedImage.id
      };

      // Cache the response
      await cacheResponse(inputHash, 'image_generation', result, 24); // 24 hour cache
      
      // Track usage
      await trackUsage(userId.toString(), 'image_generation', inputHash, responseTime, cost);

      res.json(result);
      
    } catch (error: any) {
      console.error('Error generating image:', error);
      
      if (error.message?.includes('429')) {
        res.status(429).json({ 
          error: 'Rate limit exceeded. Please try again later.',
          type: 'rate_limit'
        });
      } else if (error.message?.includes('content_policy')) {
        res.status(400).json({ 
          error: 'Content violates policy. Please modify your prompt.',
          type: 'content_policy'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to generate image. Please try again.',
          type: 'generation_error'
        });
      }
    }
  });

  // AI Vision Board Generator (Data Analysis)
  app.post('/api/ai/generate-vision-board', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { 
        includeJournals = true, 
        includeAffirmations = true, 
        includeChallenges = true, 
        includeUserProfile = true,
        userTier = 'basic'
      } = req.body;

      // Import cost control functions
      const { 
        validateAIRequest, 
        getCachedResponse, 
        cacheResponse, 
        trackUsage,
        createInputHash 
      } = await import('./ai-cost-control');

      // Create input hash based on user data flags and user ID
      const dataFlags = `${includeJournals}-${includeAffirmations}-${includeChallenges}-${includeUserProfile}`;
      const inputHash = createInputHash(userId + dataFlags, 'vision_board_generation');
      
      const validation = await validateAIRequest({
        userId,
        requestType: 'vision_board_generation',
        input: dataFlags,
        userTier
      });

      if (!validation.allowed) {
        return res.status(429).json({ 
          error: validation.reason,
          remainingRequests: validation.remainingRequests 
        });
      }

      // Check cache first (shorter cache for personalized content)
      if (validation.cachedResponse) {
        await trackUsage(userId, 'vision_board_generation', inputHash, 0, 0);
        return res.json({ 
          ...validation.cachedResponse, 
          fromCache: true,
          remainingRequests: validation.remainingRequests
        });
      }

      const storage = req.storage;
      let userDataAnalysis = '';

      // Gather user data for analysis
      if (includeJournals) {
        const journals = await storage.getUserJournalEntries(userId);
        if (journals.length > 0) {
          const recentJournals = journals.slice(-10); // Last 10 entries
          userDataAnalysis += `\n\nRecent Journal Insights:\n${recentJournals.map(j => 
            `Date: ${j.date}, Mood: ${j.mood || 'N/A'}, Entry: ${j.content?.slice(0, 200)}...`
          ).join('\n')}`;
        }
      }

      if (includeAffirmations) {
        const affirmations = await storage.getUserAffirmations(userId);
        if (affirmations.length > 0) {
          userDataAnalysis += `\n\nPersonal Affirmations:\n${affirmations.map(a => 
            `- ${a.content}`
          ).join('\n')}`;
        }
      }

      if (includeChallenges) {
        const challenges = await storage.getUserChallenges(userId);
        if (challenges.length > 0) {
          userDataAnalysis += `\n\nActive Challenges & Goals:\n${challenges.map(c => 
            `Challenge: ${c.currentChallenge}, Day: ${c.currentDay}, Progress: ${c.completionPercentage}%`
          ).join('\n')}`;
        }
      }

      if (includeUserProfile) {
        const profile = await storage.getUserProfile(userId);
        if (profile) {
          userDataAnalysis += `\n\nUser Profile Context:\n`;
          if (profile.preferences) userDataAnalysis += `Preferences: ${JSON.stringify(profile.preferences)}\n`;
          if (profile.goals) userDataAnalysis += `Stated Goals: ${profile.goals}\n`;
        }
      }

      // Check if we have sufficient data
      if (userDataAnalysis.trim().length < 100) {
        return res.status(400).json({ 
          error: 'insufficient data',
          message: 'Not enough personal data for AI analysis. Please add more journal entries, affirmations, or goals.'
        });
      }

      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const startTime = Date.now();

      const prompt = `You are an expert manifestation coach and vision board designer. Analyze the user's personal data and create a comprehensive, personalized vision board design.

User Personal Data Analysis:
${userDataAnalysis}

Based on this analysis, create a detailed vision board design in JSON format with the following structure:

{
  "title": "Personalized title based on user's main aspirations",
  "theme": "Overall theme (e.g., 'Abundance & Growth', 'Professional Success', 'Holistic Wellness')",
  "backgroundColor": "Hex color that reflects the user's energy and goals",
  "elements": [
    {
      "id": "unique_id",
      "type": "text|image|icon",
      "content": "Text content or image description",
      "position": {"x": number, "y": number},
      "size": {"width": number, "height": number},
      "style": {
        "fontSize": number,
        "fontWeight": "normal|bold",
        "color": "hex_color",
        "backgroundColor": "hex_color",
        "borderRadius": number
      },
      "reasoning": "Why this element was chosen based on user data"
    }
  ],
  "personalizedInsights": [
    "Insight 1 based on user's patterns",
    "Insight 2 about their manifestation style",
    "Insight 3 about recommended focus areas"
  ],
  "goalCategories": ["financial", "career", "health", "relationships", "personal", "travel", "lifestyle"],
  "manifestationTips": [
    "Specific tip based on user's data",
    "Actionable advice for their goals",
    "Personalized manifestation strategy"
  ]
}

Design the vision board with 6-12 elements strategically placed. Include inspirational quotes that resonate with their journal themes, visual representations of their stated goals, and colors that reflect their emotional patterns. Make it deeply personal and meaningful.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000
      });

      const responseTime = Date.now() - startTime;
      const cost = 0.15; // Estimated cost for comprehensive analysis

      let visionBoard;
      try {
        visionBoard = JSON.parse(response.choices[0].message.content || '{}');
      } catch (parseError) {
        throw new Error('Failed to parse AI response');
      }

      if (!visionBoard.elements || !Array.isArray(visionBoard.elements)) {
        throw new Error('Invalid vision board structure received');
      }

      const result = {
        visionBoard,
        analysisSource: {
          journalsAnalyzed: includeJournals,
          affirmationsAnalyzed: includeAffirmations,
          challengesAnalyzed: includeChallenges,
          profileAnalyzed: includeUserProfile
        },
        cost,
        remainingRequests: validation.remainingRequests
      };

      // Cache the response for 6 hours (shorter for personalized content)
      await cacheResponse(inputHash, 'vision_board_generation', result, 6);
      
      // Track usage
      await trackUsage(userId, 'vision_board_generation', inputHash, responseTime, cost);

      res.json(result);
      
    } catch (error: any) {
      console.error('Error generating vision board:', error);
      
      if (error.message?.includes('429') || error.message?.includes('limit')) {
        res.status(429).json({ 
          error: 'Usage limit reached. This feature requires premium access.',
          type: 'usage_limit'
        });
      } else if (error.message?.includes('insufficient data')) {
        res.status(400).json({ 
          error: 'insufficient data',
          message: 'Please add more journal entries, affirmations, or goals for better AI analysis.'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to generate personalized vision board. Please try again.',
          type: 'generation_error'
        });
      }
    }
  });

  // Vision Board API Routes
  app.get('/api/vision-boards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const visionBoards = await storage.getVisionBoards(userId);
      res.json(visionBoards);
    } catch (error) {
      console.error("Error fetching vision boards:", error);
      res.status(500).json({ message: "Failed to fetch vision boards" });
    }
  });

  app.post('/api/vision-boards', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Vision board save attempt - User object:', {
        userExists: !!req.user,
        userKeys: req.user ? Object.keys(req.user) : [],
        claims: req.user?.claims,
        isAuthenticated: req.isAuthenticated?.(),
        sessionUser: req.session?.user
      });
      
      const userId = req.user?.claims?.sub || req.user?.id || req.session?.user?.id;
      if (!userId) {
        console.log('No user ID found in request');
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { title, description, canvasData, templateCategory } = req.body;

      const visionBoard = await storage.createVisionBoard({
        userId: userId.toString(),
        title: title || "My Vision Board",
        description: description || "",
        canvasData,
        templateCategory: templateCategory || "general"
      });

      res.json(visionBoard);
    } catch (error) {
      console.error("Error saving vision board:", error);
      res.status(500).json({ message: "Failed to save vision board" });
    }
  });

  app.get('/api/vision-boards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const boardId = parseInt(req.params.id);
      
      const visionBoard = await storage.getVisionBoard(boardId, userId);
      if (!visionBoard) {
        return res.status(404).json({ message: "Vision board not found" });
      }

      res.json(visionBoard);
    } catch (error) {
      console.error("Error fetching vision board:", error);
      res.status(500).json({ message: "Failed to fetch vision board" });
    }
  });

  app.put('/api/vision-boards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const boardId = parseInt(req.params.id);
      const { title, description, canvasData, templateCategory } = req.body;

      const updatedBoard = await storage.updateVisionBoard(boardId, userId, {
        title,
        description,
        canvasData,
        templateCategory
      });

      if (!updatedBoard) {
        return res.status(404).json({ message: "Vision board not found" });
      }

      res.json(updatedBoard);
    } catch (error) {
      console.error("Error updating vision board:", error);
      res.status(500).json({ message: "Failed to update vision board" });
    }
  });

  app.delete('/api/vision-boards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || req.session?.user?.id;
      const boardId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const deleted = await storage.deleteVisionBoard(boardId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Vision board not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vision board:", error);
      res.status(500).json({ message: "Failed to delete vision board" });
    }
  });

  // Vision Board Templates and Categories Endpoints
  app.get('/api/vision-board/templates', async (req, res) => {
    try {
      const templates = [
        {
          id: 'financial_freedom',
          name: 'Financial Freedom',
          category: 'wealth',
          description: 'Manifest abundance and financial prosperity',
          thumbnail: '/templates/financial_freedom.jpg',
          elements: [
            { type: 'text', content: 'Financial Freedom', position: { x: 100, y: 50 }, style: { fontSize: 32, fontWeight: 'bold', color: '#2d5a27' } },
            { type: 'text', content: '$1,000,000', position: { x: 300, y: 150 }, style: { fontSize: 28, color: '#2d5a27' } },
            { type: 'text', content: 'Multiple Income Streams', position: { x: 50, y: 250 }, style: { fontSize: 20, color: '#2d5a27' } }
          ]
        },
        {
          id: 'health_wellness',
          name: 'Health & Wellness',
          category: 'health',
          description: 'Focus on physical and mental well-being',
          thumbnail: '/templates/health_wellness.jpg',
          elements: [
            { type: 'text', content: 'Vibrant Health', position: { x: 100, y: 50 }, style: { fontSize: 32, fontWeight: 'bold', color: '#2d5a27' } },
            { type: 'text', content: 'Daily Exercise', position: { x: 50, y: 150 }, style: { fontSize: 20, color: '#2d5a27' } },
            { type: 'text', content: 'Nutritious Food', position: { x: 300, y: 200 }, style: { fontSize: 20, color: '#2d5a27' } }
          ]
        },
        {
          id: 'career_success',
          name: 'Career Success',
          category: 'career',
          description: 'Achieve professional goals and recognition',
          thumbnail: '/templates/career_success.jpg',
          elements: [
            { type: 'text', content: 'Career Excellence', position: { x: 100, y: 50 }, style: { fontSize: 32, fontWeight: 'bold', color: '#2d5a27' } },
            { type: 'text', content: 'Leadership Role', position: { x: 50, y: 150 }, style: { fontSize: 20, color: '#2d5a27' } },
            { type: 'text', content: 'Industry Recognition', position: { x: 250, y: 200 }, style: { fontSize: 20, color: '#2d5a27' } }
          ]
        },
        {
          id: 'relationships',
          name: 'Love & Relationships',
          category: 'relationships',
          description: 'Attract meaningful connections and love',
          thumbnail: '/templates/relationships.jpg',
          elements: [
            { type: 'text', content: 'Loving Relationships', position: { x: 100, y: 50 }, style: { fontSize: 32, fontWeight: 'bold', color: '#2d5a27' } },
            { type: 'text', content: 'Soulmate Connection', position: { x: 50, y: 150 }, style: { fontSize: 20, color: '#2d5a27' } },
            { type: 'text', content: 'Strong Family Bonds', position: { x: 250, y: 200 }, style: { fontSize: 20, color: '#2d5a27' } }
          ]
        },
        {
          id: 'travel_adventure',
          name: 'Travel & Adventure',
          category: 'lifestyle',
          description: 'Explore the world and create memories',
          thumbnail: '/templates/travel_adventure.jpg',
          elements: [
            { type: 'text', content: 'World Explorer', position: { x: 100, y: 50 }, style: { fontSize: 32, fontWeight: 'bold', color: '#2d5a27' } },
            { type: 'text', content: 'Europe Trip', position: { x: 50, y: 150 }, style: { fontSize: 20, color: '#2d5a27' } },
            { type: 'text', content: 'Adventure Memories', position: { x: 250, y: 200 }, style: { fontSize: 20, color: '#2d5a27' } }
          ]
        },
        {
          id: 'personal_growth',
          name: 'Personal Growth',
          category: 'personal',
          description: 'Develop mindfulness and self-awareness',
          thumbnail: '/templates/personal_growth.jpg',
          elements: [
            { type: 'text', content: 'Inner Peace', position: { x: 100, y: 50 }, style: { fontSize: 32, fontWeight: 'bold', color: '#2d5a27' } },
            { type: 'text', content: 'Daily Meditation', position: { x: 50, y: 150 }, style: { fontSize: 20, color: '#2d5a27' } },
            { type: 'text', content: 'Emotional Balance', position: { x: 250, y: 200 }, style: { fontSize: 20, color: '#2d5a27' } }
          ]
        }
      ];
      
      res.json(templates);
    } catch (error) {
      console.error('Error fetching vision board templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  app.get('/api/vision-board/categories', async (req, res) => {
    try {
      const categories = [
        { id: 'wealth', name: 'Wealth & Abundance', icon: '💰', description: 'Financial goals and prosperity' },
        { id: 'health', name: 'Health & Wellness', icon: '🌿', description: 'Physical and mental well-being' },
        { id: 'career', name: 'Career & Success', icon: '🎯', description: 'Professional achievements' },
        { id: 'relationships', name: 'Love & Relationships', icon: '❤️', description: 'Meaningful connections' },
        { id: 'lifestyle', name: 'Lifestyle & Travel', icon: '✈️', description: 'Experiences and adventures' },
        { id: 'personal', name: 'Personal Growth', icon: '🧘', description: 'Self-improvement and mindfulness' },
        { id: 'creativity', name: 'Creativity & Arts', icon: '🎨', description: 'Creative expression and projects' },
        { id: 'family', name: 'Family & Home', icon: '🏠', description: 'Family goals and home life' }
      ];
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching vision board categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  app.get('/api/vision-board/examples', async (req, res) => {
    try {
      const examples = [
        {
          id: 'entrepreneur_success',
          title: 'Entrepreneur Success Story',
          description: 'Vision board for building a successful business',
          category: 'career',
          imageUrl: '/examples/entrepreneur.jpg',
          elements: [
            'Company Logo',
            'Revenue Goals',
            'Team Vision',
            'Market Leadership'
          ]
        },
        {
          id: 'healthy_lifestyle',
          title: 'Healthy Lifestyle Goals',
          description: 'Complete wellness transformation',
          category: 'health',
          imageUrl: '/examples/wellness.jpg',
          elements: [
            'Fitness Goals',
            'Nutrition Plan',
            'Mental Health',
            'Energy & Vitality'
          ]
        },
        {
          id: 'dream_home',
          title: 'Dream Home Manifestation',
          description: 'Creating the perfect living space',
          category: 'lifestyle',
          imageUrl: '/examples/dream_home.jpg',
          elements: [
            'House Design',
            'Location',
            'Interior Style',
            'Garden & Outdoor Space'
          ]
        }
      ];
      
      res.json(examples);
    } catch (error) {
      console.error('Error fetching vision board examples:', error);
      res.status(500).json({ message: 'Failed to fetch examples' });
    }
  });

  app.get('/api/vision-board/progress-analytics/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      
      // Get user's vision boards
      const visionBoards = await storage.getVisionBoards(userId);
      
      // Calculate analytics
      const analytics = {
        totalBoards: visionBoards.length,
        completedGoals: 0, // Would need goal tracking implementation
        activeGoals: visionBoards.length * 3, // Estimated based on boards
        engagementMetrics: {
          boardsCreatedThisMonth: visionBoards.filter(board => {
            const boardDate = new Date(board.createdAt);
            const now = new Date();
            return boardDate.getMonth() === now.getMonth() && boardDate.getFullYear() === now.getFullYear();
          }).length,
          lastActivityDate: visionBoards.length > 0 ? visionBoards[0].updatedAt : null,
          averageElementsPerBoard: visionBoards.length > 0 ? 
            visionBoards.reduce((sum, board) => sum + (board.canvasData?.elements?.length || 0), 0) / visionBoards.length : 0
        },
        categoryBreakdown: visionBoards.reduce((acc, board) => {
          const category = board.templateCategory || 'general';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {})
      };
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching vision board analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  app.post('/api/vision-board/generate-mobile-wallpaper', async (req, res) => {
    try {
      const { visionBoard, deviceType = 'iphone', style = 'modern' } = req.body;
      
      if (!visionBoard) {
        return res.status(400).json({ message: 'Vision board data is required' });
      }
      
      // Device dimensions
      const dimensions = {
        iphone: { width: 1170, height: 2532 },
        android: { width: 1080, height: 2340 },
        ipad: { width: 1620, height: 2160 }
      };
      
      const deviceDimensions = dimensions[deviceType] || dimensions.iphone;
      
      // Generate wallpaper (simplified implementation)
      const wallpaperData = {
        wallpaperUrl: `/api/vision-board/wallpaper/${Date.now()}.png`, // Would generate actual image
        deviceType,
        dimensions: deviceDimensions,
        style,
        elements: visionBoard.elements || [],
        backgroundColor: visionBoard.backgroundColor || '#ffffff'
      };
      
      res.json(wallpaperData);
    } catch (error) {
      console.error('Error generating mobile wallpaper:', error);
      res.status(500).json({ message: 'Failed to generate wallpaper' });
    }
  });

  // AI Cost Optimization & Savings Endpoints
  app.get('/api/ai-cost-optimization/status', isAuthenticated, async (req: any, res) => {
    try {
      const status = costOptimizationEngine.getOptimizationStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting optimization status:', error);
      res.status(500).json({ message: 'Failed to get optimization status' });
    }
  });

  app.get('/api/ai-cost-optimization/savings-report/:days?', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const days = parseInt(req.params.days) || 30;
      
      const report = await costOptimizationEngine.getCostSavingsReport(userId, days);
      res.json(report);
    } catch (error) {
      console.error('Error generating savings report:', error);
      res.status(500).json({ message: 'Failed to generate savings report' });
    }
  });

  app.post('/api/ai-cost-optimization/config', isAuthenticated, async (req: any, res) => {
    try {
      const { config } = req.body;
      costOptimizationEngine.updateConfig(config);
      res.json({ success: true, message: 'Optimization configuration updated' });
    } catch (error) {
      console.error('Error updating optimization config:', error);
      res.status(500).json({ message: 'Failed to update optimization configuration' });
    }
  });

  // ElevenLabs Voice API Cost Estimation
  app.post('/api/elevenlabs/cost-estimate', isAuthenticated, async (req: any, res) => {
    try {
      const { text, voice_id, subscription_tier = 'free' } = req.body;
      
      const characterCount = text.length;
      
      // ElevenLabs pricing structure
      const pricing = {
        free: { limit: 10000, overage: 0.00030 },
        starter: { limit: 30000, overage: 0.00030 },
        creator: { limit: 100000, overage: 0.00024 },
        pro: { limit: 500000, overage: 0.00018 }
      };
      
      const tierPricing = pricing[subscription_tier] || pricing.free;
      
      let cost = 0;
      if (characterCount > tierPricing.limit) {
        cost = (characterCount - tierPricing.limit) * tierPricing.overage;
      }
      
      res.json({
        characterCount,
        subscription_tier,
        monthlyLimit: tierPricing.limit,
        estimatedCost: cost,
        withinLimit: characterCount <= tierPricing.limit,
        costPerCharacter: tierPricing.overage
      });
    } catch (error) {
      console.error('Error estimating ElevenLabs cost:', error);
      res.status(500).json({ message: 'Failed to estimate cost' });
    }
  });

  // ElevenLabs Voice Cloning and Text-to-Speech Endpoints
  
  // Get available voices
  app.get('/api/elevenlabs/voices', isAuthenticated, async (req: any, res) => {
    try {
      const { elevenlabsService } = await import('./elevenlabs-simple');
      const voices = await elevenlabsService.getAvailableVoices();
      res.json({ voices });
    } catch (error) {
      console.error('Error fetching voices:', error);
      res.status(500).json({ message: 'Failed to fetch voices' });
    }
  });

  // Get user's voice clones
  app.get('/api/elevenlabs/user-voices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { elevenlabsService } = await import('./elevenlabs-simple');
      const userVoices = await elevenlabsService.getUserVoiceClones(userId);
      res.json({ voices: userVoices });
    } catch (error) {
      console.error('Error fetching user voices:', error);
      res.status(500).json({ message: 'Failed to fetch user voices' });
    }
  });

  // Generate affirmation audio
  app.post('/api/elevenlabs/generate-affirmation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { text, voice_id } = req.body;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: 'Text is required' });
      }

      if (text.length > 5000) {
        return res.status(400).json({ message: 'Text too long (max 5000 characters)' });
      }

      const { elevenlabsService } = await import('./elevenlabs-simple');
      const result = await elevenlabsService.generateAffirmationAudio(userId, text.trim(), voice_id);

      // Store the audio generation record
      await storage.createAffirmationAudio({
        userId,
        affirmationId: null, // Could link to saved phrases if needed
        voiceId: voice_id || 'default',
        audioUrl: result.audioUrl,
        charactersUsed: result.charactersUsed,
        cost: result.cost.toString(),
        duration: null
      });

      // Return audio as base64 for immediate playback
      const audioBase64 = result.audioBuffer.toString('base64');
      
      res.json({
        success: true,
        audioData: `data:audio/mpeg;base64,${audioBase64}`,
        cost: result.cost,
        charactersUsed: result.charactersUsed,
        message: 'Affirmation audio generated successfully'
      });

    } catch (error) {
      console.error('Error generating affirmation audio:', error);
      res.status(500).json({ 
        message: 'Failed to generate affirmation audio',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate text-to-speech
  app.post('/api/elevenlabs/text-to-speech', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { text, voice_id, settings } = req.body;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: 'Text is required' });
      }

      if (!voice_id) {
        return res.status(400).json({ message: 'Voice ID is required' });
      }

      if (text.length > 5000) {
        return res.status(400).json({ message: 'Text too long (max 5000 characters)' });
      }

      const { elevenlabsService } = await import('./elevenlabs-simple');
      const result = await elevenlabsService.generateSpeech(userId, text.trim(), voice_id, settings || {});

      // Return audio as base64 for immediate playback
      const audioBase64 = result.audioBuffer.toString('base64');
      
      res.json({
        success: true,
        audioData: `data:audio/mpeg;base64,${audioBase64}`,
        cost: result.cost,
        charactersUsed: result.charactersUsed,
        message: 'Text-to-speech generated successfully'
      });

    } catch (error) {
      console.error('Error generating text-to-speech:', error);
      res.status(500).json({ 
        message: 'Failed to generate text-to-speech',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get ElevenLabs usage statistics
  app.get('/api/elevenlabs/usage-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { elevenlabsService } = await import('./elevenlabs-simple');
      const stats = await elevenlabsService.getUsageStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      res.status(500).json({ message: 'Failed to fetch usage statistics' });
    }
  });

  // Get user's affirmation audio history
  app.get('/api/elevenlabs/affirmation-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const audioHistory = await storage.getUserAffirmationAudio(userId);
      res.json({ history: audioHistory });
    } catch (error) {
      console.error('Error fetching affirmation history:', error);
      res.status(500).json({ message: 'Failed to fetch affirmation history' });
    }
  });

  // Get unified daily AI usage statistics across ALL AI systems
  app.get('/api/ai/daily-usage-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { checkDailyAILimit, getDailyAIStats, getUserTier } = await import('./unified-ai-limits');
      
      const userTier = getUserTier(userId);
      const limitInfo = await checkDailyAILimit(userId, userTier);
      const stats = await getDailyAIStats(userId);
      
      res.json({
        ...limitInfo,
        breakdown: stats,
        userTier
      });
    } catch (error) {
      console.error('Error fetching daily AI usage stats:', error);
      res.status(500).json({ message: 'Failed to fetch AI usage statistics' });
    }
  });

  // AI Coaching Hub with Response Quality Tiering
  app.post('/api/ai-coaching/coaching-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userInput, sessionType = 'multidisciplinary_coaching' } = req.body;

      // Process through enhanced multidisciplinary engine with quality tiering
      const response = await multidisciplinaryAIEngine.processCoachingRequest(
        userId, 
        userInput, 
        sessionType
      );

      res.json({
        ...response,
        optimizationApplied: 'response_quality_tiering',
        timestamp: new Date().toISOString()
      });

    } catch (error: unknown) {
      console.error("Error in AI coaching session:", error);
      res.status(500).json({ 
        message: "Failed to process coaching session", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Deep Journaling with Response Quality Tiering
  app.post('/api/deep-journaling/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userInput, threadId, actionType, customizations } = req.body;

      const { multidisciplinaryAIEngine } = await import('./deep-journaling/multidisciplinary-ai-engine');
      
      const response = await multidisciplinaryAIEngine.processCoachingRequest(
        userId,
        userInput,
        'deep_journaling'
      );

      res.json({
        ...response,
        optimizationApplied: 'response_quality_tiering',
        timestamp: new Date().toISOString()
      });

    } catch (error: unknown) {
      console.error("Error in deep journaling analysis:", error);
      res.status(500).json({ 
        message: "Failed to process journaling request", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Therapeutic Chat Routes - Conversational Interface Like Mindsera
  app.get('/api/therapeutic-chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const sessions = await db
        .select({
          id: journalingThreads.id,
          title: journalingThreads.title,
          lastMessage: journalingThreads.currentTopic,
          createdAt: journalingThreads.createdAt,
          updatedAt: journalingThreads.updatedAt,
          emotionalJourney: journalingThreads.emotionalJourney
        })
        .from(journalingThreads)
        .where(and(eq(journalingThreads.userId, userId), eq(journalingThreads.threadType, 'therapy_session')))
        .orderBy(desc(journalingThreads.updatedAt))
        .limit(20);

      // Enhanced analytics for each session
      const sessionsWithAnalytics = await Promise.all(
        sessions.map(async (session) => {
          // Get exchange count
          const [exchangeCount] = await db
            .select({ count: count() })
            .from(threadExchanges)
            .where(eq(threadExchanges.threadId, session.id));
          
          // Get latest exchange for analysis
          const latestExchange = await db
            .select()
            .from(threadExchanges)
            .where(eq(threadExchanges.threadId, session.id))
            .orderBy(desc(threadExchanges.createdAt))
            .limit(1);

          // Extract emotional insights and brief analysis
          let emotionalInsight = 'emotional processing';
          let briefAnalysis = 'Therapeutic conversation about personal growth and self-reflection';
          
          if (latestExchange.length > 0) {
            const exchange = latestExchange[0];
            
            // Extract emotional insight from AI analysis
            if (exchange.aiEmotionalAssessment) {
              try {
                const assessment = typeof exchange.aiEmotionalAssessment === 'string' 
                  ? JSON.parse(exchange.aiEmotionalAssessment) 
                  : exchange.aiEmotionalAssessment;
                emotionalInsight = assessment.insight || assessment.primaryEmotion || 'emotional processing';
              } catch (e) {
                emotionalInsight = exchange.aiEmotionalAssessment.toString().slice(0, 30);
              }
            }
            
            // Create brief analysis from user input
            if (exchange.userInput && exchange.userInput.length > 10) {
              briefAnalysis = exchange.userInput.slice(0, 80) + (exchange.userInput.length > 80 ? '...' : '');
            }
          }
          
          return {
            ...session,
            exchangeCount: exchangeCount.count,
            messageCount: exchangeCount.count * 2, // Each exchange has user + AI message
            emotionalJourney: [emotionalInsight],
            lastMessage: briefAnalysis,
            conversationStats: {
              totalExchanges: exchangeCount.count,
              lastActivity: session.updatedAt || session.createdAt,
              emotionalFocus: emotionalInsight
            }
          };
        })
      );

      res.json(sessionsWithAnalytics);
    } catch (error) {
      console.error("Error fetching therapeutic chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get('/api/therapeutic-chat/sessions/:sessionId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = parseInt(req.params.sessionId);
      
      // Verify session belongs to user
      const session = await db
        .select()
        .from(journalingThreads)
        .where(and(eq(journalingThreads.id, sessionId), eq(journalingThreads.userId, userId)))
        .limit(1);

      if (session.length === 0) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Get all exchanges for this session
      const exchanges = await db
        .select()
        .from(threadExchanges)
        .where(eq(threadExchanges.threadId, sessionId))
        .orderBy(threadExchanges.exchangeOrder);

      // Convert to message format
      const messages = [];
      for (const exchange of exchanges) {
        // Add user message
        messages.push({
          id: `user-${exchange.id}`,
          type: 'user',
          content: exchange.userInput,
          timestamp: exchange.createdAt
        });

        // Add AI response
        messages.push({
          id: `ai-${exchange.id}`,
          type: 'ai',
          content: typeof exchange.aiAnalysis === 'string' ? exchange.aiAnalysis : (exchange.aiAnalysis as any)?.response || exchange.aiAnalysis,
          timestamp: exchange.createdAt,
          emotionalTone: (exchange.aiEmotionalAssessment as any)?.insight || 'supportive'
        });
      }

      res.json(messages);
    } catch (error) {
      console.error("Error fetching session messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Therapeutic Chat Processing endpoint (no database save)
  app.post('/api/therapeutic-chat/process', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userInput: message, conversationStyle = 'socratic', focusArea = 'general', responseLength = 'balanced', actionType } = req.body;

      if (!message?.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Generate specialized therapeutic prompts based on action type
      let therapeuticPrompt;
      
      if (actionType === 'go_deeper') {
        therapeuticPrompt = `You are a professional therapist conducting deep therapeutic exploration. The user wants to go deeper into their previous discussion. Your role is to:

1. Ask probing, insightful follow-up questions that uncover underlying patterns
2. Guide them to examine root causes, beliefs, and emotional connections
3. Help them discover insights they might not have considered
4. Use therapeutic techniques to explore deeper layers of their experience
5. Challenge them gently to explore different perspectives

The user's deeper exploration request: "${message}"

Provide your response in this JSON format:
{
  "response": "Deep therapeutic response with follow-up questions that guide deeper exploration",
  "followUpQuestion": "A profound question that uncovers underlying patterns or beliefs",
  "emotionalInsight": "deeper understanding"
}`;

      } else if (actionType === 'new_direction') {
        therapeuticPrompt = `You are a professional therapist shifting therapeutic direction. The user wants to explore their concerns from a completely different angle. Your role is to:

1. Take a fresh, innovative approach to their situation
2. Challenge assumptions and reveal new perspectives
3. Ask questions that explore unexplored aspects
4. Use creative therapeutic techniques to reframe their experience
5. Guide them toward breakthrough insights

The user's direction change request: "${message}"

Provide your response in this JSON format:
{
  "response": "A fresh therapeutic response that shifts perspective and explores new angles",
  "followUpQuestion": "An innovative question that reveals unexplored aspects or challenges assumptions",
  "emotionalInsight": "new perspective"
}`;

      } else {
        // Build style-specific therapeutic approach
        const styleInstructions = getStyleInstructions(conversationStyle);
        const focusInstructions = getFocusInstructions(focusArea);
        const lengthInstructions = getLengthInstructions(responseLength);
        
        therapeuticPrompt = `You are a professional therapeutic companion. ${styleInstructions}

FOCUS AREA: ${focusInstructions}

RESPONSE LENGTH: ${lengthInstructions}

The user just shared: "${message}"

${getStyleSpecificPrompt(conversationStyle)}

Provide your response in this JSON format:
{
  "response": "Your therapeutic response following the ${conversationStyle} style",
  "followUpQuestion": "A ${conversationStyle}-style question focused on ${focusArea}",
  "emotionalInsight": "Brief emotional insight (1-3 words)"
}`;
      }

      function getStyleInstructions(style: string) {
        switch(style) {
          case 'socratic':
            return 'Use the Socratic method - guide the client to self-discovery through thoughtful questioning. Avoid giving direct advice. Instead, ask probing questions that help them examine their thoughts, beliefs, and assumptions. Help them discover insights themselves through your questions.';
          case 'directive':
            return 'Take a direct, guidance-focused approach. Provide clear advice, specific strategies, and actionable recommendations. Be authoritative yet supportive, offering concrete steps and techniques they can implement.';
          case 'reflective':
            return 'Use reflective listening techniques. Mirror back their emotions and thoughts to help them gain clarity. Paraphrase what they\'ve shared, reflect their feelings, and help them see patterns through your reflections.';
          case 'collaborative':
            return 'Work as partners in the therapeutic process. Use "we" language, invite their input on direction, and create a team approach to exploring their concerns. Share responsibility for insights and solutions.';
          default:
            return 'Respond with empathy and genuine understanding, providing thoughtful insights when appropriate.';
        }
      }

      function getFocusInstructions(focus: string) {
        switch(focus) {
          case 'emotions':
            return 'Focus specifically on emotional processing - help them identify, understand, and work through their emotions. Guide them toward emotional awareness and regulation.';
          case 'patterns':
            return 'Focus on identifying recurring behaviors, thoughts, or situations. Help them recognize cycles, habits, and connections between past and present patterns.';
          case 'goals':
            return 'Focus on future-oriented work - goal setting, creating actionable plans, and building motivation for positive change and achievement.';
          case 'relationships':
            return 'Focus on interpersonal dynamics, communication patterns, and relationship challenges. Explore their connections with others and social interactions.';
          default:
            return 'Take a broad, exploratory approach to their overall wellbeing and life situation.';
        }
      }

      function getLengthInstructions(length: string) {
        switch(length) {
          case 'brief':
            return 'Keep your response concise and focused - 1-2 sentences maximum. Be direct and impactful.';
          case 'detailed':
            return 'Provide a comprehensive response - 4-6 sentences that thoroughly explore multiple perspectives and offer deep insights.';
          default:
            return 'Provide a balanced response - 2-4 sentences that offer moderate depth and exploration.';
        }
      }

      function getStyleSpecificPrompt(style: string) {
        switch(style) {
          case 'socratic':
            return 'Ask questions that lead them to discover insights themselves. Use phrases like "What do you think might be behind...?", "How does this connect to...?", "What would happen if...?"';
          case 'directive':
            return 'Provide specific advice and recommendations. Use phrases like "I recommend...", "You should try...", "The best approach would be..."';
          case 'reflective':
            return 'Reflect their emotions and thoughts back to them. Use phrases like "It sounds like you\'re feeling...", "What I\'m hearing is...", "You seem to be experiencing..."';
          case 'collaborative':
            return 'Use collaborative language and invite partnership. Use phrases like "Let\'s explore this together...", "What do you think we should focus on?", "How can we work on this together?"';
          default:
            return 'Respond naturally and supportively to continue the conversation.';
        }
      }

      console.log("Therapeutic Chat - Processing message:", message);

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: therapeuticPrompt },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 800
      });

      console.log("Therapeutic Chat - OpenAI Raw Response:", aiResponse.choices[0].message.content);
      
      let therapeuticData;
      try {
        therapeuticData = JSON.parse(aiResponse.choices[0].message.content || '{}');
        console.log("Therapeutic Chat - Parsed data:", therapeuticData);
      } catch (parseError) {
        console.error("Therapeutic Chat - JSON parse error:", parseError);
        therapeuticData = {
          response: "I understand what you're sharing with me. That sounds really challenging.",
          followUpQuestion: "Can you tell me more about how this is affecting you?",
          emotionalInsight: "processing"
        };
      }

      res.json({
        response: therapeuticData.response,
        followUpQuestion: therapeuticData.followUpQuestion,
        emotionalInsight: therapeuticData.emotionalInsight
      });

    } catch (error) {
      console.error("Error in therapeutic chat processing:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Voice Transcription endpoint for Therapeutic Chat
  app.post('/api/therapeutic-chat/transcribe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      if (!req.files || !req.files.audio) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const audioFile = req.files.audio;
      
      // Create a temporary file for OpenAI Whisper API
      const tempFilePath = `/tmp/audio_${Date.now()}.wav`;
      await audioFile.mv(tempFilePath);

      console.log("Transcribing audio file:", tempFilePath);

      // Use OpenAI Whisper API for transcription
      const transcription = await openai.audio.transcriptions.create({
        file: require('fs').createReadStream(tempFilePath),
        model: "whisper-1",
        language: "en",
        response_format: "text"
      });

      // Clean up temporary file
      require('fs').unlinkSync(tempFilePath);

      console.log("Transcription result:", transcription);

      res.json({
        transcription: transcription,
        success: true
      });

    } catch (error) {
      console.error("Error in voice transcription:", error);
      res.status(500).json({ 
        message: "Failed to transcribe audio",
        error: error.message 
      });
    }
  });

  // Save Therapeutic Chat Conversation endpoint (only when user finishes)
  app.post('/api/therapeutic-chat/save-conversation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { threadId, title, messages, conversationStyle, focusArea } = req.body;

      if (!messages || messages.length === 0) {
        return res.status(400).json({ message: "No messages to save" });
      }

      let sessionId = threadId;

      if (threadId) {
        // Update existing conversation
        console.log(`Updating existing conversation ${threadId}`);
        
        // Verify the thread belongs to the user
        const existingThread = await db
          .select()
          .from(journalingThreads)
          .where(and(eq(journalingThreads.id, threadId), eq(journalingThreads.userId, userId)))
          .limit(1);

        if (existingThread.length === 0) {
          return res.status(404).json({ message: "Thread not found or access denied" });
        }

        // Update thread title and metadata
        await db
          .update(journalingThreads)
          .set({
            title: title || existingThread[0].title,
            currentTopic: 'therapeutic_chat',
            updatedAt: new Date(),
            lastActiveAt: new Date()
          })
          .where(eq(journalingThreads.id, threadId));

        // Get current exchange count to continue ordering
        const [exchangeCount] = await db
          .select({ count: count() })
          .from(threadExchanges)
          .where(eq(threadExchanges.threadId, threadId));

        let exchangeOrder = (exchangeCount.count || 0) + 1;

        // Save new message exchanges only (ones not already in database)
        for (let i = 0; i < messages.length; i += 2) {
          const userMessage = messages[i];
          const aiMessage = messages[i + 1];

          if (userMessage && userMessage.type === 'user') {
            // Check if this exchange already exists
            const existingExchange = await db
              .select()
              .from(threadExchanges)
              .where(and(
                eq(threadExchanges.threadId, threadId),
                eq(threadExchanges.userInput, userMessage.content || ''),
                eq(threadExchanges.aiAnalysis, aiMessage?.content || '')
              ))
              .limit(1);

            if (existingExchange.length === 0) {
              // Only insert new exchanges
              await db
                .insert(threadExchanges)
                .values({
                  threadId: threadId,
                  exchangeOrder: exchangeOrder,
                  userInput: userMessage.content || '',
                  aiAnalysis: aiMessage?.content || '',
                  aiQuestion: aiMessage?.content || '',
                  aiEmotionalAssessment: { insight: aiMessage?.emotionalTone || 'supportive' },
                  processingTime: 1000
                });
              
              exchangeOrder++;
            }
          }
        }

        sessionId = threadId;
      } else {
        // Create new thread for the finished conversation
        const [newSession] = await db
          .insert(journalingThreads)
          .values({
            userId,
            title: title || 'Therapeutic Chat Session',
            threadType: 'therapy_session',
            currentTopic: 'therapeutic_chat'
          })
          .returning();

        // Save all message exchanges to database
        let exchangeOrder = 1;
        for (let i = 0; i < messages.length; i += 2) {
          const userMessage = messages[i];
          const aiMessage = messages[i + 1];

          if (userMessage && userMessage.type === 'user') {
            await db
              .insert(threadExchanges)
              .values({
                threadId: newSession.id,
                exchangeOrder: exchangeOrder,
                userInput: userMessage.content || '',
                aiAnalysis: aiMessage?.content || '',
                aiQuestion: aiMessage?.content || '',
                aiEmotionalAssessment: { insight: aiMessage?.emotionalTone || 'supportive' },
                processingTime: 1000
              });
            
            exchangeOrder++;
          }
        }

        sessionId = newSession.id;
      }

      res.json({
        success: true,
        threadId: sessionId,
        message: threadId ? "Conversation updated successfully" : "Conversation saved successfully"
      });

    } catch (error) {
      console.error("Error saving therapeutic conversation:", error);
      res.status(500).json({ message: "Failed to save conversation" });
    }
  });

  app.post('/api/therapeutic-chat/message', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId, message, therapeuticMode, conversationStyle, focusArea } = req.body;

      if (!message?.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }

      let currentSessionId = sessionId;

      // Create new session if none provided
      if (!currentSessionId) {
        const [newSession] = await db
          .insert(journalingThreads)
          .values({
            userId,
            title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
            threadType: 'therapy_session',
            currentTopic: 'therapeutic_chat'
          })
          .returning();
        
        currentSessionId = newSession.id;
      }

      // Get conversation context from previous exchanges
      const previousExchanges = await db
        .select({
          userInput: threadExchanges.userInput,
          aiAnalysis: threadExchanges.aiAnalysis,
          aiQuestion: threadExchanges.aiQuestion,
          aiEmotionalAssessment: threadExchanges.aiEmotionalAssessment
        })
        .from(threadExchanges)
        .where(eq(threadExchanges.threadId, currentSessionId))
        .orderBy(desc(threadExchanges.exchangeOrder))
        .limit(5);

      // Build conversation context
      const conversationHistory = previousExchanges.reverse().map(exchange => [
        { role: 'user', content: exchange.userInput },
        { role: 'assistant', content: `${JSON.stringify(exchange.aiAnalysis)}\n\n${exchange.aiQuestion}` }
      ]).flat();

      // Generate therapeutic response using AI
      const therapeuticPrompt = `You are a professional therapeutic companion engaging in a flowing conversation. Your role is to:

1. Respond with empathy and genuine understanding
2. Provide thoughtful insights when appropriate  
3. Ask meaningful follow-up questions to deepen the conversation
4. Maintain a warm, supportive tone while being professionally helpful

Therapeutic Mode: ${therapeuticMode}
Conversation Style: ${conversationStyle}  
Focus Area: ${focusArea}

The user just shared: "${message}"

Respond as a therapeutic companion would - with understanding, insight, and a thoughtful question that continues the conversation naturally. Keep your response conversational and engaging, not clinical.

Provide your response in this JSON format:
{
  "response": "Your empathetic response with insights",
  "followUpQuestion": "A thoughtful question to continue the conversation",
  "emotionalInsight": "Brief emotional insight (1-3 words like 'exploring vulnerability' or 'processing change')"
}`;

      console.log("Sending therapeutic prompt to OpenAI...");
      console.log("Message:", message);
      console.log("Conversation history length:", conversationHistory.length);

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: therapeuticPrompt },
          ...conversationHistory,
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 800
      });

      console.log("OpenAI Raw Response:", aiResponse.choices[0].message.content);
      
      let therapeuticData;
      try {
        therapeuticData = JSON.parse(aiResponse.choices[0].message.content || '{}');
        console.log("Parsed therapeutic data:", therapeuticData);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // Fallback therapeutic response
        therapeuticData = {
          response: "I understand what you're sharing with me. That sounds really challenging.",
          followUpQuestion: "Can you tell me more about how this is affecting you?",
          emotionalInsight: "processing"
        };
      }

      // Get next exchange order
      const nextOrder = previousExchanges.length + 1;

      // Save the exchange
      const [newExchange] = await db
        .insert(threadExchanges)
        .values({
          threadId: currentSessionId,
          exchangeOrder: nextOrder,
          userInput: message,
          aiAnalysis: therapeuticData.response,
          aiQuestion: therapeuticData.followUpQuestion || "How does this make you feel?",
          aiEmotionalAssessment: { insight: therapeuticData.emotionalInsight },
          processingTime: 2000
        })
        .returning();

      // Update session current topic and last active
      await db
        .update(journalingThreads)
        .set({
          currentTopic: message.slice(0, 50),
          updatedAt: new Date(),
          lastActiveAt: new Date()
        })
        .where(eq(journalingThreads.id, currentSessionId));

      res.json({
        response: therapeuticData.response,
        followUpQuestion: therapeuticData.followUpQuestion,
        emotionalInsight: therapeuticData.emotionalInsight,
        sessionId: currentSessionId,
        messageId: `ai-${newExchange.id}`
      });

    } catch (error) {
      console.error("Error processing therapeutic chat message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Response Quality Assessment endpoint
  app.post('/api/ai-coaching/quality-assessment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userInput, response, modelUsed } = req.body;

      const qualityMetrics = await responseQualityTiering.assessResponseQuality(
        userInput,
        response,
        userId
      );

      res.json({
        qualityMetrics,
        modelUsed,
        assessmentDate: new Date().toISOString()
      });

    } catch (error: unknown) {
      console.error("Error in quality assessment:", error);
      res.status(500).json({ 
        message: "Failed to assess response quality", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Cost Optimization Analytics
  app.get('/api/ai-coaching/optimization-analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { days = 30 } = req.query;

      const analytics = await responseQualityTiering.calculateQualityTieringSavings(
        { tier: 'premium', requiredQuality: 8, preferredModels: ['gpt-4o'], costMultiplier: 1.0, useCases: [] },
        { tier: 'standard', requiredQuality: 6, preferredModels: ['gpt-3.5-turbo'], costMultiplier: 0.1, useCases: [] },
        userId,
        parseInt(days as string)
      );

      res.json({
        analytics,
        period: `${days} days`,
        userId: userId.slice(0, 8) + '...',
        timestamp: new Date().toISOString()
      });

    } catch (error: unknown) {
      console.error("Error fetching optimization analytics:", error);
      res.status(500).json({ 
        message: "Failed to fetch analytics", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete therapeutic chat session endpoint
  app.delete('/api/therapeutic-chat/sessions/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = parseInt(req.params.sessionId);

      if (!sessionId || isNaN(sessionId)) {
        return res.status(400).json({ message: "Valid session ID is required" });
      }

      // Verify the session belongs to the user
      const existingSession = await db
        .select()
        .from(journalingThreads)
        .where(and(
          eq(journalingThreads.id, sessionId), 
          eq(journalingThreads.userId, userId),
          eq(journalingThreads.threadType, 'therapy_session')
        ))
        .limit(1);

      if (existingSession.length === 0) {
        return res.status(404).json({ message: "Session not found or access denied" });
      }

      // Delete all related exchanges first
      await db
        .delete(threadExchanges)
        .where(eq(threadExchanges.threadId, sessionId));

      // Delete the session
      await db
        .delete(journalingThreads)
        .where(eq(journalingThreads.id, sessionId));

      res.json({
        success: true,
        message: "Therapeutic chat session deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting therapeutic chat session:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Therapeutic Analytics Routes
  
  // Emotional State Analysis
  app.get('/api/therapeutic-analytics/emotional-state', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
      const { timeFilter = 'month' } = req.query;
      
      let dateFilter = sql`1=1`;
      const now = new Date();
      
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = sql`${threadExchanges.createdAt} >= ${weekAgo}`;
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = sql`${threadExchanges.createdAt} >= ${monthAgo}`;
      }

      // Analyze emotional patterns from therapeutic chat sessions
      const exchanges = await db
        .select({
          userInput: threadExchanges.userInput,
          aiAnalysis: threadExchanges.aiAnalysis,
          createdAt: threadExchanges.createdAt
        })
        .from(threadExchanges)
        .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(and(
          eq(journalingThreads.userId, userId),
          eq(journalingThreads.threadType, 'therapy_session'),
          dateFilter
        ))
        .orderBy(desc(threadExchanges.createdAt));

      // Extract emotions using simple keyword analysis
      const emotionKeywords = {
        'Anxiety': ['anxious', 'worried', 'nervous', 'stressed', 'panic', 'overwhelmed'],
        'Sadness': ['sad', 'depressed', 'down', 'melancholy', 'grief', 'sorrow', 'lonely'],
        'Anger': ['angry', 'mad', 'frustrated', 'irritated', 'rage', 'annoyed'],
        'Fear': ['afraid', 'scared', 'terrified', 'fearful', 'phobia', 'dread'],
        'Joy': ['happy', 'joyful', 'excited', 'elated', 'cheerful', 'delighted'],
        'Love': ['love', 'affection', 'care', 'compassion', 'warmth', 'tenderness'],
        'Confusion': ['confused', 'uncertain', 'unclear', 'bewildered', 'puzzled'],
        'Stress': ['stress', 'pressure', 'tension', 'strain', 'burden', 'exhausted']
      };

      const emotionCounts = {};
      const emotionEntries = {};

      exchanges.forEach(exchange => {
        const text = (exchange.userInput + ' ' + (exchange.aiAnalysis || '')).toLowerCase();
        
        Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
          const hasEmotion = keywords.some(keyword => text.includes(keyword));
          if (hasEmotion) {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
            if (!emotionEntries[emotion]) emotionEntries[emotion] = [];
            emotionEntries[emotion].push(exchange.userInput);
          }
        });
      });

      const emotions = Object.entries(emotionCounts).map(([emotion, count]) => ({
        emotion,
        count,
        intensity: Math.min(100, count * 10),
        relatedEntries: emotionEntries[emotion] || []
      })).sort((a, b) => b.count - a.count);

      res.json({ emotions });
    } catch (error) {
      console.error('Error analyzing emotional state:', error);
      res.status(500).json({ message: 'Failed to analyze emotional state' });
    }
  });

  // Habit Tracking Analytics
  app.get('/api/therapeutic-analytics/habits', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
      const { timeFilter = 'month' } = req.query;
      
      let dateFilter = sql`1=1`;
      const now = new Date();
      
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = sql`${journalingThreads.createdAt} >= ${weekAgo}`;
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = sql`${journalingThreads.createdAt} >= ${monthAgo}`;
      }

      // Get therapeutic sessions
      const sessions = await db
        .select({
          id: journalingThreads.id,
          createdAt: journalingThreads.createdAt,
          title: journalingThreads.title
        })
        .from(journalingThreads)
        .where(and(
          eq(journalingThreads.userId, userId),
          eq(journalingThreads.threadType, 'therapy_session'),
          dateFilter
        ))
        .orderBy(desc(journalingThreads.createdAt));

      // Calculate statistics
      const totalSessions = sessions.length;
      const sessionDates = sessions.map(s => s.createdAt?.toISOString().split('T')[0]).filter(Boolean);
      const uniqueDates = [...new Set(sessionDates)];
      
      // Create calendar data for current month
      const calendar = {};
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        calendar[dateStr] = sessionDates.includes(dateStr);
      }

      // Calculate streaks
      const sortedDates = uniqueDates.sort();
      let longestStreak = 0;
      let currentStreak = 0;
      
      if (sortedDates.length > 0) {
        currentStreak = 1;
        longestStreak = 1;
        
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (dayDiff === 1) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
        }
      }

      // Estimate journaling time (rough calculation)
      const avgTimePerSession = 15; // minutes
      const totalJournalingTime = `${totalSessions * avgTimePerSession} minutes`;

      res.json({
        totalJournalingTime,
        longestStreak,
        currentStreak,
        entriesThisMonth: uniqueDates.length,
        calendar
      });
    } catch (error) {
      console.error('Error analyzing habits:', error);
      res.status(500).json({ message: 'Failed to analyze habits' });
    }
  });

  // Personality Insights (placeholder for now)
  app.get('/api/therapeutic-analytics/personality', isAuthenticated, async (req, res) => {
    try {
      // This would require more sophisticated analysis
      res.json({
        traits: [],
        message: 'Personality analysis requires more therapeutic session data'
      });
    } catch (error) {
      console.error('Error analyzing personality:', error);
      res.status(500).json({ message: 'Failed to analyze personality' });
    }
  });

  // Recurring Topics Analysis
  app.get('/api/therapeutic-analytics/topics', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
      const { timeFilter = 'month' } = req.query;
      
      let dateFilter = sql`1=1`;
      const now = new Date();
      
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = sql`${threadExchanges.createdAt} >= ${weekAgo}`;
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = sql`${threadExchanges.createdAt} >= ${monthAgo}`;
      }

      const exchanges = await db
        .select({
          userInput: threadExchanges.userInput,
          aiAnalysis: threadExchanges.aiAnalysis,
          createdAt: threadExchanges.createdAt
        })
        .from(threadExchanges)
        .innerJoin(journalingThreads, eq(threadExchanges.threadId, journalingThreads.id))
        .where(and(
          eq(journalingThreads.userId, userId),
          eq(journalingThreads.threadType, 'therapy_session'),
          dateFilter
        ))
        .orderBy(desc(threadExchanges.createdAt));

      // Simple topic extraction using keywords
      const topicKeywords = {
        'Relationships': ['relationship', 'partner', 'family', 'friend', 'marriage', 'divorce'],
        'Work/Career': ['work', 'job', 'career', 'boss', 'colleague', 'employment'],
        'Self-Esteem': ['confidence', 'self-worth', 'self-esteem', 'identity', 'value'],
        'Health': ['health', 'illness', 'medical', 'physical', 'body', 'exercise'],
        'Money': ['money', 'financial', 'debt', 'income', 'wealth', 'budget'],
        'Future/Goals': ['future', 'goals', 'dreams', 'plans', 'ambitions', 'hope']
      };

      const topicCounts = {};
      exchanges.forEach(exchange => {
        const text = (exchange.userInput + ' ' + (exchange.aiAnalysis || '')).toLowerCase();
        
        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
          const hasTopic = keywords.some(keyword => text.includes(keyword));
          if (hasTopic) {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          }
        });
      });

      const topics = Object.entries(topicCounts).map(([topic, frequency]) => ({
        topic,
        frequency,
        trend: 'stable',
        relatedSessions: []
      })).sort((a, b) => b.frequency - a.frequency);

      res.json({ topics });
    } catch (error) {
      console.error('Error analyzing topics:', error);
      res.status(500).json({ message: 'Failed to analyze topics' });
    }
  });

  // AI Suggestions (placeholder for now)
  app.get('/api/therapeutic-analytics/suggestions', isAuthenticated, async (req, res) => {
    try {
      res.json({
        suggestions: [],
        message: 'AI suggestions will be generated based on your therapeutic progress'
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      res.status(500).json({ message: 'Failed to generate suggestions' });
    }
  });

  // Register deep journaling routes
  // registerDeepJournalingRoutes(app); // Function not available

  const httpServer = createServer(app);
  return httpServer;
}