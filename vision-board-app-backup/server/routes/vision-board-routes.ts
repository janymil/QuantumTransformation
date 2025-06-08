import { Router } from 'express';
import { db } from '../db';
import { 
  visionBoards, 
  visionBoardImages, 
  visionBoardAffirmations,
  dailyRituals,
  eveningReflections,
  userProgress,
  insertVisionBoardSchema,
  insertAffirmationSchema,
  insertDailyRitualSchema,
  insertEveningReflectionSchema,
  LIFE_AREAS
} from '../../shared/schema';
import { VisionBoardAI } from '../ai-engine/vision-board-ai';
import { QuantumAppAPI } from '../services/quantum-app-api';
import { eq, desc, and } from 'drizzle-orm';

const router = Router();
const visionBoardAI = new VisionBoardAI();
const quantumAPI = new QuantumAppAPI();

// Auth middleware - validates user via quantum app
async function validateUser(req: any, res: any, next: any) {
  try {
    const sessionCookie = req.headers.cookie;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'No session found' });
    }

    const user = await quantumAPI.validateUserAuth(sessionCookie);
    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth validation error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Apply auth to all routes
router.use(validateUser);

/**
 * AI-powered life area suggestions based on quantum app data
 */
router.get('/ai/suggest-life-areas', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userData = await quantumAPI.getComprehensiveUserData(userId);
    
    if (!userData.journalEntries?.length && !userData.affirmations?.length) {
      return res.status(400).json({ 
        error: 'insufficient_data',
        message: 'Please add some journal entries or goals in the Quantum Challenges app first.' 
      });
    }

    const suggestions = await visionBoardAI.suggestLifeAreas(userData);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error suggesting life areas:', error);
    res.status(500).json({ error: 'Failed to analyze your data for life area suggestions' });
  }
});

/**
 * Generate complete AI-powered vision board design
 */
router.post('/ai/generate-vision-board', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { selectedLifeAreas } = req.body;

    if (!selectedLifeAreas || !Array.isArray(selectedLifeAreas) || selectedLifeAreas.length === 0) {
      return res.status(400).json({ error: 'Please select at least one life area' });
    }

    const userData = await quantumAPI.getComprehensiveUserData(userId);
    const design = await visionBoardAI.generateVisionBoardDesign(userData, selectedLifeAreas);

    // Save the generated vision board
    const [visionBoard] = await db.insert(visionBoards).values({
      userId,
      title: design.title,
      description: design.description,
      lifeAreas: design.lifeAreas,
      canvasData: {
        items: design.images.map((img, index) => ({
          id: `img-${index}`,
          type: 'image',
          content: img.description,
          x: (index % 3) * 300,
          y: Math.floor(index / 3) * 200,
          width: 280,
          height: 180,
          lifeArea: img.lifeArea,
          searchKeywords: img.searchKeywords
        })),
        canvasWidth: 900,
        canvasHeight: 600,
        backgroundColor: design.backgroundColor
      },
      isAiGenerated: true,
      backgroundColor: design.backgroundColor
    }).returning();

    // Save affirmations
    if (design.affirmations?.length) {
      await db.insert(visionBoardAffirmations).values(
        design.affirmations.map(aff => ({
          userId,
          visionBoardId: visionBoard.id,
          content: aff.content,
          lifeArea: aff.lifeArea,
          isPersonalized: true,
          emotionalTone: aff.emotionalTone,
          source: 'ai'
        }))
      );
    }

    res.json({ 
      visionBoard,
      design,
      message: 'Your personalized vision board has been created!' 
    });
  } catch (error) {
    console.error('Error generating vision board:', error);
    res.status(500).json({ error: 'Failed to generate your personalized vision board' });
  }
});

/**
 * Get user's vision boards
 */
router.get('/vision-boards', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const boards = await db.select()
      .from(visionBoards)
      .where(eq(visionBoards.userId, userId))
      .orderBy(desc(visionBoards.createdAt));

    res.json(boards);
  } catch (error) {
    console.error('Error fetching vision boards:', error);
    res.status(500).json({ error: 'Failed to fetch your vision boards' });
  }
});

/**
 * Get specific vision board with affirmations
 */
router.get('/vision-boards/:id', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const boardId = parseInt(req.params.id);

    const [board] = await db.select()
      .from(visionBoards)
      .where(and(eq(visionBoards.id, boardId), eq(visionBoards.userId, userId)));

    if (!board) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    const affirmations = await db.select()
      .from(visionBoardAffirmations)
      .where(eq(visionBoardAffirmations.visionBoardId, boardId));

    res.json({ board, affirmations });
  } catch (error) {
    console.error('Error fetching vision board:', error);
    res.status(500).json({ error: 'Failed to fetch vision board' });
  }
});

/**
 * Update vision board
 */
router.patch('/vision-boards/:id', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const boardId = parseInt(req.params.id);
    const updates = req.body;

    const [updated] = await db.update(visionBoards)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(visionBoards.id, boardId), eq(visionBoards.userId, userId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating vision board:', error);
    res.status(500).json({ error: 'Failed to update vision board' });
  }
});

/**
 * Generate personalized affirmations for a life area
 */
router.post('/ai/generate-affirmations', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { lifeArea, count = 3 } = req.body;

    if (!LIFE_AREAS.includes(lifeArea)) {
      return res.status(400).json({ error: 'Invalid life area' });
    }

    const userData = await quantumAPI.getComprehensiveUserData(userId);
    const affirmations = await visionBoardAI.createPersonalizedAffirmations(userData, lifeArea, count);

    res.json({ affirmations });
  } catch (error) {
    console.error('Error generating affirmations:', error);
    res.status(500).json({ error: 'Failed to generate personalized affirmations' });
  }
});

/**
 * Complete daily ritual
 */
router.post('/daily-ritual/complete', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { visionBoardId, duration, affirmationsUsed, emotionalState, notes } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already completed today
    const existingRitual = await db.select()
      .from(dailyRituals)
      .where(and(
        eq(dailyRituals.userId, userId),
        eq(dailyRituals.date, today)
      ));

    if (existingRitual.length > 0) {
      return res.status(400).json({ error: 'Daily ritual already completed today' });
    }

    const [ritual] = await db.insert(dailyRituals).values({
      userId,
      visionBoardId,
      date: today,
      completed: true,
      duration,
      affirmationsUsed,
      emotionalState,
      notes
    }).returning();

    // Update user progress
    await updateUserProgress(userId);

    res.json({ ritual, message: 'Daily ritual completed! Well done.' });
  } catch (error) {
    console.error('Error completing daily ritual:', error);
    res.status(500).json({ error: 'Failed to complete daily ritual' });
  }
});

/**
 * Get evening reflection question
 */
router.get('/evening-reflection/question', async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's active life areas
    const userBoards = await db.select()
      .from(visionBoards)
      .where(eq(visionBoards.userId, userId))
      .orderBy(desc(visionBoards.createdAt))
      .limit(1);

    const lifeAreas = userBoards[0]?.lifeAreas || ['personal_growth'];
    const userData = await quantumAPI.getComprehensiveUserData(userId);
    
    const question = await visionBoardAI.generateReflectionQuestion(userData, lifeAreas);

    res.json({ question });
  } catch (error) {
    console.error('Error generating reflection question:', error);
    res.status(500).json({ 
      question: 'What progress did you make today toward your goals?'
    });
  }
});

/**
 * Submit evening reflection
 */
router.post('/evening-reflection/submit', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { question, response } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userData = await quantumAPI.getComprehensiveUserData(userId);
    const insights = await visionBoardAI.analyzeReflection(response, userData);

    const [reflection] = await db.insert(eveningReflections).values({
      userId,
      date: today,
      question,
      response,
      insights
    }).returning();

    res.json({ reflection, insights });
  } catch (error) {
    console.error('Error submitting evening reflection:', error);
    res.status(500).json({ error: 'Failed to submit reflection' });
  }
});

/**
 * Get user progress and streaks
 */
router.get('/progress', async (req: any, res) => {
  try {
    const userId = req.user.id;

    let [progress] = await db.select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    if (!progress) {
      [progress] = await db.insert(userProgress).values({
        userId,
        totalDaysActive: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalRitualsCompleted: 0,
        totalReflectionsCompleted: 0
      }).returning();
    }

    // Get recent rituals for calendar view
    const recentRituals = await db.select()
      .from(dailyRituals)
      .where(eq(dailyRituals.userId, userId))
      .orderBy(desc(dailyRituals.date))
      .limit(30);

    res.json({ progress, recentRituals });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

/**
 * Helper function to update user progress
 */
async function updateUserProgress(userId: string) {
  try {
    const rituals = await db.select()
      .from(dailyRituals)
      .where(eq(dailyRituals.userId, userId))
      .orderBy(desc(dailyRituals.date));

    const reflections = await db.select()
      .from(eveningReflections)
      .where(eq(eveningReflections.userId, userId));

    // Calculate streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < rituals.length; i++) {
      const ritualDate = new Date(rituals[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (ritualDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    for (const ritual of rituals.reverse()) {
      const ritualDate = new Date(ritual.date);
      
      if (!lastDate || (ritualDate.getTime() - lastDate.getTime()) === 86400000) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
      lastDate = ritualDate;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    await db.update(userProgress)
      .set({
        totalDaysActive: rituals.length,
        currentStreak,
        longestStreak,
        totalRitualsCompleted: rituals.length,
        totalReflectionsCompleted: reflections.length,
        lastRitualDate: rituals[0]?.date,
        updatedAt: new Date()
      })
      .where(eq(userProgress.userId, userId));

  } catch (error) {
    console.error('Error updating user progress:', error);
  }
}

export default router;