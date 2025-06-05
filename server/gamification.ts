import { db } from "./db";
import { 
  userLevels, 
  microLearningActivities, 
  learningBadges, 
  dailyStreaks,
  knowledgeQuizzes,
  userQuizResults,
  type InsertUserLevel,
  type InsertMicroLearningActivity,
  type InsertLearningBadge,
  type InsertDailyStreak,
  type UserLevel,
  type MicroLearningActivity,
  type LearningBadge,
  type DailyStreak
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Point values for different activities
export const ACTIVITY_POINTS = {
  morning_practice: 25,
  daytime_practice: 15,
  evening_practice: 20,
  journal_entry: 30,
  video_watched: 10,
  affirmation_saved: 5,
  insight_mastered: 15,
  quiz_completed: 20,
  day_completed: 50,
  streak_bonus: 10 // per day in streak
};

// Level progression (points needed for each level)
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 2900, 3500, // Levels 1-11
  4200, 5000, 5900, 6900, 8000, 9200, 10500, 12000, 13600, 15300, // Levels 12-21
  17100, 19000, 21000, 23100, 25300, 27600, 30000, 32500, 35100, 37800 // Levels 22-30
];

export interface ActivityTrackingData {
  practiceType?: string;
  timeSpent?: number;
  completed?: boolean;
  videoId?: string;
  journalLength?: number;
  affirmationText?: string;
  insights?: string[];
  quizScore?: number;
}

/**
 * Initialize user level and streak data for a new challenge
 */
export async function initializeUserGamification(userId: string, challengeType: string): Promise<void> {
  try {
    // Initialize user level
    await db.insert(userLevels).values({
      userId,
      challengeType,
      level: 1,
      totalPoints: 0,
      currentLevelPoints: 0,
      pointsToNextLevel: LEVEL_THRESHOLDS[1]
    }).onConflictDoNothing();

    // Initialize streak tracking
    await db.insert(dailyStreaks).values({
      userId,
      challengeType,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date().toISOString().split('T')[0],
      streakMultiplier: 1.0
    }).onConflictDoNothing();

  } catch (error) {
    console.error("Error initializing user gamification:", error);
    throw error;
  }
}

/**
 * Track a micro-learning activity and award points
 */
export async function trackActivity(
  userId: string,
  challengeType: string,
  day: number,
  activityType: string,
  activityData?: ActivityTrackingData
): Promise<{ pointsEarned: number; levelUp?: boolean; newLevel?: number; badgeEarned?: LearningBadge }> {
  try {
    // Calculate base points for activity
    let basePoints = ACTIVITY_POINTS[activityType as keyof typeof ACTIVITY_POINTS] || 10;
    
    // Get current streak multiplier
    const [streak] = await db
      .select()
      .from(dailyStreaks)
      .where(and(
        eq(dailyStreaks.userId, userId),
        eq(dailyStreaks.challengeType, challengeType)
      ));

    const streakMultiplier = streak?.streakMultiplier || 1.0;
    const finalPoints = Math.round(basePoints * streakMultiplier);

    // Record the activity
    await db.insert(microLearningActivities).values({
      userId,
      challengeType,
      day,
      activityType,
      activityData: activityData || {},
      pointsEarned: finalPoints,
      timeSpent: activityData?.timeSpent || 0
    });

    // Update user level and points
    const levelResult = await updateUserLevel(userId, challengeType, finalPoints);

    // Check for badge eligibility
    const badgeEarned = await checkBadgeEligibility(userId, challengeType, activityType, day);

    // Update streak if this is a daily completion
    if (activityType === 'day_completed') {
      await updateDailyStreak(userId, challengeType);
    }

    return {
      pointsEarned: finalPoints,
      levelUp: levelResult.levelUp,
      newLevel: levelResult.newLevel,
      badgeEarned
    };

  } catch (error) {
    console.error("Error tracking activity:", error);
    throw error;
  }
}

/**
 * Update user level based on points earned
 */
async function updateUserLevel(userId: string, challengeType: string, pointsEarned: number): Promise<{ levelUp: boolean; newLevel?: number }> {
  const [currentLevel] = await db
    .select()
    .from(userLevels)
    .where(and(
      eq(userLevels.userId, userId),
      eq(userLevels.challengeType, challengeType)
    ));

  if (!currentLevel) {
    await initializeUserGamification(userId, challengeType);
    return { levelUp: false };
  }

  const newTotalPoints = currentLevel.totalPoints + pointsEarned;
  const currentLevelIndex = currentLevel.level - 1;
  let newLevel = currentLevel.level;
  let levelUp = false;

  // Check if user should level up
  while (newLevel < LEVEL_THRESHOLDS.length && newTotalPoints >= LEVEL_THRESHOLDS[newLevel]) {
    newLevel++;
    levelUp = true;
  }

  const currentLevelPoints = newTotalPoints - (LEVEL_THRESHOLDS[newLevel - 1] || 0);
  const pointsToNextLevel = (LEVEL_THRESHOLDS[newLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) - newTotalPoints;

  await db
    .update(userLevels)
    .set({
      level: newLevel,
      totalPoints: newTotalPoints,
      currentLevelPoints,
      pointsToNextLevel: Math.max(0, pointsToNextLevel),
      updatedAt: new Date()
    })
    .where(and(
      eq(userLevels.userId, userId),
      eq(userLevels.challengeType, challengeType)
    ));

  return { levelUp, newLevel: levelUp ? newLevel : undefined };
}

/**
 * Update daily streak and multiplier
 */
async function updateDailyStreak(userId: string, challengeType: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  const [currentStreak] = await db
    .select()
    .from(dailyStreaks)
    .where(and(
      eq(dailyStreaks.userId, userId),
      eq(dailyStreaks.challengeType, challengeType)
    ));

  if (!currentStreak) return;

  const lastActivityDate = currentStreak.lastActivityDate;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = 1;
  if (lastActivityDate === yesterdayStr) {
    // Continue streak
    newStreak = currentStreak.currentStreak + 1;
  } else if (lastActivityDate === today) {
    // Already completed today
    return;
  }

  const longestStreak = Math.max(newStreak, currentStreak.longestStreak);
  
  // Calculate streak multiplier (increases every 7 days, max 2.0x)
  const streakMultiplier = Math.min(2.0, 1.0 + (Math.floor(newStreak / 7) * 0.1));

  await db
    .update(dailyStreaks)
    .set({
      currentStreak: newStreak,
      longestStreak,
      lastActivityDate: today,
      streakMultiplier
    })
    .where(and(
      eq(dailyStreaks.userId, userId),
      eq(dailyStreaks.challengeType, challengeType)
    ));
}

/**
 * Check if user is eligible for new badges
 */
async function checkBadgeEligibility(userId: string, challengeType: string, activityType: string, day: number): Promise<LearningBadge | undefined> {
  // Get user's current activities
  const activities = await db
    .select()
    .from(microLearningActivities)
    .where(and(
      eq(microLearningActivities.userId, userId),
      eq(microLearningActivities.challengeType, challengeType)
    ));

  const streak = await db
    .select()
    .from(dailyStreaks)
    .where(and(
      eq(dailyStreaks.userId, userId),
      eq(dailyStreaks.challengeType, challengeType)
    ));

  // Check existing badges to avoid duplicates
  const existingBadges = await db
    .select()
    .from(learningBadges)
    .where(and(
      eq(learningBadges.userId, userId),
      eq(learningBadges.challengeType, challengeType)
    ));

  const existingBadgeTypes = existingBadges.map(b => b.badgeType);

  // Badge eligibility checks
  const badges = [];

  // Streak Master (7-day streak)
  if (streak[0]?.currentStreak >= 7 && !existingBadgeTypes.includes('streak_master')) {
    badges.push({
      badgeType: 'streak_master',
      badgeName: 'Streak Master',
      description: 'Maintained a 7-day practice streak',
      iconUrl: '🔥'
    });
  }

  // Early Bird (morning practices)
  const morningPractices = activities.filter(a => a.activityType === 'morning_practice').length;
  if (morningPractices >= 7 && !existingBadgeTypes.includes('early_bird')) {
    badges.push({
      badgeType: 'early_bird',
      badgeName: 'Early Bird',
      description: 'Completed 7 morning practices',
      iconUrl: '🌅'
    });
  }

  // Knowledge Seeker (watched 5 videos)
  const videosWatched = activities.filter(a => a.activityType === 'video_watched').length;
  if (videosWatched >= 5 && !existingBadgeTypes.includes('knowledge_seeker')) {
    badges.push({
      badgeType: 'knowledge_seeker',
      badgeName: 'Knowledge Seeker',
      description: 'Watched 5 educational videos',
      iconUrl: '🎓'
    });
  }

  // Journal Master (10 journal entries)
  const journalEntries = activities.filter(a => a.activityType === 'journal_entry').length;
  if (journalEntries >= 10 && !existingBadgeTypes.includes('journal_master')) {
    badges.push({
      badgeType: 'journal_master',
      badgeName: 'Journal Master',
      description: 'Created 10 journal entries',
      iconUrl: '📔'
    });
  }

  // Award the first eligible badge
  if (badges.length > 0) {
    const badge = badges[0];
    const [newBadge] = await db
      .insert(learningBadges)
      .values({
        userId,
        challengeType,
        ...badge
      })
      .returning();
    
    return newBadge;
  }

  return undefined;
}

/**
 * Get user's gamification stats
 */
export async function getUserGamificationStats(userId: string, challengeType: string) {
  try {
    const [level] = await db
      .select()
      .from(userLevels)
      .where(and(
        eq(userLevels.userId, userId),
        eq(userLevels.challengeType, challengeType)
      ));

    const [streak] = await db
      .select()
      .from(dailyStreaks)
      .where(and(
        eq(dailyStreaks.userId, userId),
        eq(dailyStreaks.challengeType, challengeType)
      ));

    const badges = await db
      .select()
      .from(learningBadges)
      .where(and(
        eq(learningBadges.userId, userId),
        eq(learningBadges.challengeType, challengeType)
      ))
      .orderBy(desc(learningBadges.earnedAt));

    const recentActivities = await db
      .select()
      .from(microLearningActivities)
      .where(and(
        eq(microLearningActivities.userId, userId),
        eq(microLearningActivities.challengeType, challengeType)
      ))
      .orderBy(desc(microLearningActivities.completedAt))
      .limit(10);

    return {
      level: level || null,
      streak: streak || null,
      badges,
      recentActivities,
      nextLevelProgress: level ? {
        current: level.currentLevelPoints,
        needed: level.pointsToNextLevel,
        percentage: Math.round((level.currentLevelPoints / (level.currentLevelPoints + level.pointsToNextLevel)) * 100)
      } : null
    };

  } catch (error) {
    console.error("Error getting gamification stats:", error);
    throw error;
  }
}

/**
 * Get daily micro-learning content based on the day's actual content
 */
export async function generateDailyMicroLearning(challengeType: string, day: number) {
  // This would integrate with your existing day content
  // For now, return a structured format that can be populated with real content
  
  const baseContent = {
    day,
    challengeType,
    microLessons: [
      {
        id: `${challengeType}_day${day}_concept1`,
        title: "Core Concept",
        content: "Key learning from today's practice",
        points: 10,
        type: "concept"
      },
      {
        id: `${challengeType}_day${day}_practice`,
        title: "Practice Tip",
        content: "Practical application tip",
        points: 15,
        type: "practice"
      }
    ],
    quiz: {
      question: "What is the main focus of today's practice?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0,
      explanation: "Explanation of the correct answer",
      points: 20
    },
    rewards: {
      completionPoints: ACTIVITY_POINTS.day_completed,
      availableBadges: ["daily_learner", "practice_master"]
    }
  };

  return baseContent;
}