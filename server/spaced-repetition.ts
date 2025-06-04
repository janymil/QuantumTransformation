import { 
  spacedRepetitionConcepts, 
  spacedRepetitionReviews, 
  spacedRepetitionSchedule,
  type SpacedRepetitionConcept,
  type SpacedRepetitionReview,
  type InsertSpacedRepetitionConcept,
  type InsertSpacedRepetitionReview,
  type InsertSpacedRepetitionSchedule
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, desc, asc } from "drizzle-orm";

// SM-2 Spaced Repetition Algorithm Implementation
// Based on SuperMemo 2 algorithm by Piotr Wozniak

export interface SM2Result {
  interval: number;
  repetition: number;
  easinessFactor: number;
}

export interface ReviewResult {
  quality: number; // 0-5 scale (0=total blackout, 5=perfect response)
  responseTime: number; // seconds
  wasSuccessful: boolean;
}

export interface ConceptToReview {
  concept: SpacedRepetitionConcept;
  isOverdue: boolean;
  daysSinceLastReview: number;
  priority: number;
}

/**
 * Core SM-2 Algorithm Implementation
 * @param quality - User's recall quality (0-5 scale)
 * @param repetition - Current repetition number
 * @param easinessFactor - Current easiness factor
 * @param interval - Current interval in days
 */
export function calculateSM2(
  quality: number, 
  repetition: number, 
  easinessFactor: number, 
  interval: number
): SM2Result {
  let newEasinessFactor = easinessFactor;
  let newRepetition = repetition;
  let newInterval = interval;

  // Update easiness factor based on quality
  newEasinessFactor = Math.max(
    1.3,
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  if (quality < 3) {
    // Poor recall - restart the learning process
    newRepetition = 0;
    newInterval = 1;
  } else {
    // Good recall - continue with spaced repetition
    newRepetition = repetition + 1;
    
    if (newRepetition === 1) {
      newInterval = 1;
    } else if (newRepetition === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEasinessFactor);
    }
  }

  return {
    interval: newInterval,
    repetition: newRepetition,
    easinessFactor: newEasinessFactor
  };
}

/**
 * Create a new concept for spaced repetition tracking
 */
export async function createConcept(
  userId: string,
  challengeType: string,
  conceptKey: string,
  conceptTitle: string,
  conceptContent: string,
  sourceDay: number,
  difficultyLevel: number = 1
): Promise<SpacedRepetitionConcept> {
  const [concept] = await db
    .insert(spacedRepetitionConcepts)
    .values({
      userId,
      challengeType,
      conceptKey,
      conceptTitle,
      conceptContent,
      difficultyLevel,
      sourceDay
    })
    .returning();

  // Schedule initial review for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  await db.insert(spacedRepetitionSchedule).values({
    userId,
    conceptId: concept.id,
    scheduledDate: tomorrow,
    challengeType,
    priority: difficultyLevel
  });

  return concept;
}

/**
 * Record a review session and calculate next review date
 */
export async function recordReview(
  userId: string,
  conceptId: number,
  reviewResult: ReviewResult
): Promise<void> {
  // Get the concept and its latest review
  const [concept] = await db
    .select()
    .from(spacedRepetitionConcepts)
    .where(and(
      eq(spacedRepetitionConcepts.id, conceptId),
      eq(spacedRepetitionConcepts.userId, userId)
    ));

  if (!concept) {
    throw new Error("Concept not found");
  }

  // Get the latest review for this concept
  const latestReview = await db
    .select()
    .from(spacedRepetitionReviews)
    .where(and(
      eq(spacedRepetitionReviews.conceptId, conceptId),
      eq(spacedRepetitionReviews.userId, userId)
    ))
    .orderBy(desc(spacedRepetitionReviews.createdAt))
    .limit(1);

  const currentRepetition = latestReview[0]?.repetitionNumber || 0;
  const currentEasinessFactor = latestReview[0]?.easinessFactor || 2.5;
  const currentInterval = latestReview[0]?.interval || 1;

  // Calculate new SM-2 values
  const sm2Result = calculateSM2(
    reviewResult.quality,
    currentRepetition,
    currentEasinessFactor,
    currentInterval
  );

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + sm2Result.interval);

  // Record the review
  await db.insert(spacedRepetitionReviews).values({
    userId,
    conceptId,
    reviewDate: new Date(),
    nextReviewDate,
    interval: sm2Result.interval,
    easinessFactor: sm2Result.easinessFactor,
    repetitionNumber: sm2Result.repetition,
    quality: reviewResult.quality,
    responseTime: reviewResult.responseTime,
    wasSuccessful: reviewResult.wasSuccessful,
    reviewType: 'scheduled'
  });

  // Update or create next scheduled review
  await db.insert(spacedRepetitionSchedule).values({
    userId,
    conceptId,
    scheduledDate: nextReviewDate,
    challengeType: concept.challengeType,
    priority: Math.max(1, 6 - reviewResult.quality) // Higher priority for poorly recalled items
  });
}

/**
 * Get concepts due for review today
 */
export async function getConceptsDueForReview(
  userId: string,
  challengeType?: string
): Promise<ConceptToReview[]> {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  let query = db
    .select({
      concept: spacedRepetitionConcepts,
      schedule: spacedRepetitionSchedule
    })
    .from(spacedRepetitionSchedule)
    .innerJoin(
      spacedRepetitionConcepts,
      eq(spacedRepetitionSchedule.conceptId, spacedRepetitionConcepts.id)
    )
    .where(
      and(
        eq(spacedRepetitionSchedule.userId, userId),
        eq(spacedRepetitionSchedule.isCompleted, false),
        lte(spacedRepetitionSchedule.scheduledDate, today)
      )
    );

  if (challengeType) {
    query = query.where(eq(spacedRepetitionSchedule.challengeType, challengeType));
  }

  const results = await query.orderBy(asc(spacedRepetitionSchedule.priority));

  return results.map(result => {
    const daysSinceScheduled = Math.floor(
      (today.getTime() - new Date(result.schedule.scheduledDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    return {
      concept: result.concept,
      isOverdue: daysSinceScheduled > 0,
      daysSinceLastReview: daysSinceScheduled,
      priority: result.schedule.priority || 1
    };
  });
}

/**
 * Get mastery statistics for a user's concepts
 */
export async function getMasteryStats(
  userId: string,
  challengeType?: string
): Promise<{
  totalConcepts: number;
  masteredConcepts: number;
  reviewingConcepts: number;
  strugglingConcepts: number;
  averageEasinessFactor: number;
}> {
  let conceptsQuery = db
    .select()
    .from(spacedRepetitionConcepts)
    .where(eq(spacedRepetitionConcepts.userId, userId));

  if (challengeType) {
    conceptsQuery = conceptsQuery.where(eq(spacedRepetitionConcepts.challengeType, challengeType));
  }

  const concepts = await conceptsQuery;

  if (concepts.length === 0) {
    return {
      totalConcepts: 0,
      masteredConcepts: 0,
      reviewingConcepts: 0,
      strugglingConcepts: 0,
      averageEasinessFactor: 2.5
    };
  }

  let masteredCount = 0;
  let reviewingCount = 0;
  let strugglingCount = 0;
  let totalEasinessFactor = 0;
  let factorCount = 0;

  for (const concept of concepts) {
    // Get latest review for this concept
    const latestReview = await db
      .select()
      .from(spacedRepetitionReviews)
      .where(and(
        eq(spacedRepetitionReviews.conceptId, concept.id),
        eq(spacedRepetitionReviews.userId, userId)
      ))
      .orderBy(desc(spacedRepetitionReviews.createdAt))
      .limit(1);

    if (latestReview[0]) {
      const review = latestReview[0];
      totalEasinessFactor += review.easinessFactor || 2.5;
      factorCount++;

      // Mastered: interval >= 21 days and easiness factor >= 2.5
      if (review.interval >= 21 && review.easinessFactor >= 2.5) {
        masteredCount++;
      }
      // Struggling: easiness factor < 2.0 or recent poor performance
      else if (review.easinessFactor < 2.0 || (review.quality || 0) < 3) {
        strugglingCount++;
      }
      // Reviewing: everything else
      else {
        reviewingCount++;
      }
    } else {
      // New concept - count as reviewing
      reviewingCount++;
    }
  }

  return {
    totalConcepts: concepts.length,
    masteredConcepts: masteredCount,
    reviewingConcepts: reviewingCount,
    strugglingConcepts: strugglingCount,
    averageEasinessFactor: factorCount > 0 ? totalEasinessFactor / factorCount : 2.5
  };
}

/**
 * Auto-create concepts from daily challenge completion
 */
export async function autoCreateConceptsFromDay(
  userId: string,
  challengeType: string,
  day: number,
  dayContent: {
    mainTechnique: string;
    keyInsights: string[];
    visualizationMethod?: string;
    breathworkTechnique?: string;
  }
): Promise<SpacedRepetitionConcept[]> {
  const concepts: SpacedRepetitionConcept[] = [];

  // Create concept for main technique
  if (dayContent.mainTechnique) {
    const concept = await createConcept(
      userId,
      challengeType,
      `${challengeType}_day_${day}_main_technique`,
      `Day ${day}: Main Technique`,
      dayContent.mainTechnique,
      day,
      2 // Medium difficulty
    );
    concepts.push(concept);
  }

  // Create concepts for key insights
  for (let i = 0; i < dayContent.keyInsights.length; i++) {
    const insight = dayContent.keyInsights[i];
    const concept = await createConcept(
      userId,
      challengeType,
      `${challengeType}_day_${day}_insight_${i + 1}`,
      `Day ${day}: Key Insight ${i + 1}`,
      insight,
      day,
      1 // Lower difficulty for insights
    );
    concepts.push(concept);
  }

  // Create concept for visualization if present
  if (dayContent.visualizationMethod) {
    const concept = await createConcept(
      userId,
      challengeType,
      `${challengeType}_day_${day}_visualization`,
      `Day ${day}: Visualization Method`,
      dayContent.visualizationMethod,
      day,
      3 // Higher difficulty for complex visualizations
    );
    concepts.push(concept);
  }

  // Create concept for breathwork if present
  if (dayContent.breathworkTechnique) {
    const concept = await createConcept(
      userId,
      challengeType,
      `${challengeType}_day_${day}_breathwork`,
      `Day ${day}: Breathwork Technique`,
      dayContent.breathworkTechnique,
      day,
      2 // Medium difficulty
    );
    concepts.push(concept);
  }

  return concepts;
}

/**
 * Mark a scheduled review as completed
 */
export async function markReviewCompleted(
  userId: string,
  conceptId: number
): Promise<void> {
  await db
    .update(spacedRepetitionSchedule)
    .set({
      isCompleted: true,
      completedAt: new Date()
    })
    .where(
      and(
        eq(spacedRepetitionSchedule.userId, userId),
        eq(spacedRepetitionSchedule.conceptId, conceptId),
        eq(spacedRepetitionSchedule.isCompleted, false)
      )
    );
}