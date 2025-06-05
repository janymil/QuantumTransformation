import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { 
  generateAIExplanation, 
  analyzeJournalEntries, 
  generatePersonalizedCoaching,
  generateMicroLearningContent,
  generatePersonalizedAffirmation,
  generateWellnessTip,
  generateMicroChallenges,
  generateDailyAffirmation
} from "../openai";

export function registerAIRoutes(app: Express) {
  // AI explanation for challenge topics
  app.post('/api/ai/explain', isAuthenticated, async (req: any, res) => {
    try {
      const { topic, day, userQuestion, context } = req.body;
      
      const explanation = await generateAIExplanation({
        topic,
        day,
        userQuestion,
        context
      });
      
      res.json(explanation);
    } catch (error) {
      console.error("Error generating AI explanation:", error);
      res.status(500).json({ message: "Failed to generate explanation" });
    }
  });

  // Analyze journal entries
  app.post('/api/ai/analyze-journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeType, entries } = req.body;
      
      let journalEntries = entries;
      if (!journalEntries) {
        // Get user's journal entries if not provided
        if (challengeType) {
          journalEntries = await storage.getJournalEntriesByChallenge(userId, challengeType);
        } else {
          journalEntries = await storage.getUserJournalEntries(userId);
        }
      }
      
      const analysis = await analyzeJournalEntries({ entries: journalEntries });
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing journal entries:", error);
      res.status(500).json({ message: "Failed to analyze journal entries" });
    }
  });

  // Generate personalized coaching
  app.post('/api/ai/coaching', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { 
        currentDay, 
        challengeType, 
        userGoals, 
        preferredPracticeTime, 
        difficultyLevel 
      } = req.body;
      
      // Get user progress and recent journal entries
      const userProgress = await storage.getUserProgressForChallenge(userId, challengeType);
      const recentEntries = await storage.getJournalEntriesByChallenge(userId, challengeType);
      
      const coaching = await generatePersonalizedCoaching({
        userId,
        currentDay,
        completedDays: userProgress?.completedDays || [],
        streakCount: userProgress?.currentStreak || 0,
        recentJournalEntries: recentEntries.slice(-5), // Last 5 entries
        userGoals,
        preferredPracticeTime,
        difficultyLevel
      });
      
      res.json(coaching);
    } catch (error) {
      console.error("Error generating personalized coaching:", error);
      res.status(500).json({ message: "Failed to generate coaching" });
    }
  });

  // Generate micro-learning content
  app.post('/api/ai/micro-learning', isAuthenticated, async (req: any, res) => {
    try {
      const { day, topic, userLevel } = req.body;
      
      const content = await generateMicroLearningContent(day, topic, userLevel);
      res.json(content);
    } catch (error) {
      console.error("Error generating micro-learning content:", error);
      res.status(500).json({ message: "Failed to generate micro-learning content" });
    }
  });

  // Generate personalized affirmation
  app.post('/api/ai/affirmation', isAuthenticated, async (req: any, res) => {
    try {
      const { 
        day, 
        userGoals, 
        currentChallenges, 
        recentInsights, 
        mood, 
        progressLevel 
      } = req.body;
      
      const affirmation = await generatePersonalizedAffirmation({
        day,
        userGoals,
        currentChallenges,
        recentInsights,
        mood,
        progressLevel
      });
      
      res.json({ affirmation });
    } catch (error) {
      console.error("Error generating personalized affirmation:", error);
      res.status(500).json({ message: "Failed to generate affirmation" });
    }
  });

  // Generate wellness tip
  app.post('/api/ai/wellness-tip', isAuthenticated, async (req: any, res) => {
    try {
      const { category, day, preferences } = req.body;
      
      const tip = await generateWellnessTip({ category, day, preferences });
      res.json(tip);
    } catch (error) {
      console.error("Error generating wellness tip:", error);
      res.status(500).json({ message: "Failed to generate wellness tip" });
    }
  });

  // Generate micro challenges
  app.post('/api/ai/micro-challenges', isAuthenticated, async (req: any, res) => {
    try {
      const { day, count } = req.body;
      
      const challenges = await generateMicroChallenges(day, count);
      res.json({ challenges });
    } catch (error) {
      console.error("Error generating micro challenges:", error);
      res.status(500).json({ message: "Failed to generate micro challenges" });
    }
  });

  // Generate daily affirmation
  app.post('/api/ai/daily-affirmation', isAuthenticated, async (req: any, res) => {
    try {
      const { day, userGoals, challengeType } = req.body;
      
      const affirmation = await generateDailyAffirmation(day, userGoals, challengeType);
      res.json({ affirmation });
    } catch (error) {
      console.error("Error generating daily affirmation:", error);
      res.status(500).json({ message: "Failed to generate daily affirmation" });
    }
  });

  // Create AI chat session
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { day, topic, question, context } = req.body;
      
      const session = await storage.createAiChatSession({
        userId,
        day,
        topic,
        question,
        context,
        createdAt: new Date()
      });
      
      res.json(session);
    } catch (error) {
      console.error("Error creating AI chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  // Get AI chat sessions
  app.get('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const day = req.query.day ? parseInt(req.query.day as string) : undefined;
      
      const sessions = await storage.getUserAiChatSessions(userId, day);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching AI chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });
}