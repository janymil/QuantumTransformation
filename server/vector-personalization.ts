import OpenAI from "openai";
import { ChromaClient } from "chromadb";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { aiResponseHistory, journalEntries, userProgress } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

const chroma = new ChromaClient();

interface EmbeddingDocument {
  id: string;
  content: string;
  metadata: {
    type: 'challenge_content' | 'user_interaction' | 'journal_entry' | 'progress_data';
    challengeType: string;
    day?: number;
    userId?: string;
    timestamp?: string;
    relevanceScore?: number;
  };
}

interface PersonalizedContext {
  challengeContent: string[];
  userHistory: string[];
  relevantInsights: string[];
  personalizedPrompt: string;
}

/**
 * Advanced Vector-Based AI Personalization System
 * Provides semantic search and intelligent context selection
 */
export class VectorPersonalizationEngine {
  private collectionName = "quantum_coaching_embeddings";
  private collection: any = null;

  async initialize() {
    try {
      // Create or get collection for embeddings
      this.collection = await chroma.getOrCreateCollection({
        name: this.collectionName,
        metadata: { "hnsw:space": "cosine" }
      });
      console.log("Vector personalization engine initialized");
    } catch (error) {
      console.error("Failed to initialize vector engine:", error);
      throw error;
    }
  }

  /**
   * Create embeddings for challenge content and store in vector database
   */
  async indexChallengeContent() {
    const challengeContents = [
      {
        type: 'money_blocks_clearing',
        content: `Money Blocks Clearing Challenge focuses on transforming financial limitations through quantum consciousness. Day 1 covers identifying core money beliefs from childhood and family patterns, understanding money as energy reflection, and Joe Dispenza techniques for becoming aware of unconscious money programs. Day 2 involves releasing victim mentality around money, understanding how past experiences create present financial reality, and energy clearing techniques. Day 3 centers on embodying abundance consciousness, creating new neural pathways for prosperity thinking, and heart coherence practices for abundance frequency. Day 4 focuses on future self creation, embodying financially successful personality, and clearing fear-based money decisions. Day 5 integrates spiritual abundance with practical steps, maintaining elevated emotions while taking inspired action.`
      },
      {
        type: 'general_quantum',
        content: `Quantum Consciousness Challenge explores consciousness as fundamental reality creator. Day 1 introduces quantum field awareness, understanding how consciousness creates reality, and Joe Dispenza's personality-reality connection principles. Day 2 focuses on breaking limited patterns, moving beyond past conditioning, understanding neuroplasticity, and creating new neural pathways through elevated states. Day 3 masters elevated emotions, generating elevated emotions independent of external conditions, heart-brain coherence, and understanding how emotions influence quantum field. Day 4 embodies future self, quantum jumping through consciousness shifts, understanding time as illusion, and creating new personal reality. Day 5 integrates supernatural living, sustaining elevated states, maintaining quantum awareness and expanded consciousness.`
      },
      {
        type: 'relationships',
        content: `Relationship Transformation Challenge focuses on heart-centered love and connection mastery. Day 1 establishes self-love foundation, understanding relationship with self as template for all relationships, inner child healing, and creating loving internal dialogue. Day 2 opens heart center, activating unconditional love frequency, healing past relationship trauma through forgiveness, and opening to receive and give love freely. Day 3 creates healthy boundaries, maintaining open heart while setting clear limits, authentic communication, and balancing self-care with relationship nurturing. Day 4 manifests aligned relationships, embodying love you wish to receive, creating relationship vision from elevated consciousness. Day 5 integrates love in all interactions, maintaining relationship consciousness in daily life.`
      },
      {
        type: 'health_vitality',
        content: `Health and Vitality Challenge connects mind-body consciousness for optimal wellness. Day 1 establishes mind-body connection through conscious awareness, understanding body as consciousness expression, and foundational health practices. Day 2 releases stored emotions and trauma from cellular memory, energy clearing techniques, and emotional healing practices. Day 3 activates body's healing intelligence, cellular regeneration techniques, and vitality restoration practices. Day 4 creates optimal health blueprint, designing vital energy systems, and health manifestation techniques. Day 5 integrates healing practices, sustaining vitality, and maintaining mind-body harmony.`
      },
      {
        type: 'career_purpose',
        content: `Career and Purpose Challenge aligns soul calling with practical manifestation. Day 1 discovers authentic purpose and soul calling, identifying passion and natural talents, understanding purpose as consciousness expression. Day 2 clears career limitations and societal programming, releasing fear-based career decisions, and breaking through limiting beliefs about success. Day 3 aligns passion with practical manifestation steps, creating inspired action plans, and balancing spiritual purpose with material needs. Day 4 embodies professional confidence and leadership energy, developing authentic authority, and creating influential presence. Day 5 creates inspired action and purposeful contribution, maintaining purpose-driven career, and serving others through authentic expression.`
      }
    ];

    const embeddings = await Promise.all(
      challengeContents.map(async (challenge) => {
        const embedding = await this.createEmbedding(challenge.content);
        return {
          id: `challenge_${challenge.type}`,
          embedding,
          metadata: {
            type: 'challenge_content',
            challengeType: challenge.type,
            contentLength: challenge.content.length
          },
          document: challenge.content
        };
      })
    );

    await this.collection.add({
      ids: embeddings.map(e => e.id),
      embeddings: embeddings.map(e => e.embedding),
      metadatas: embeddings.map(e => e.metadata),
      documents: embeddings.map(e => e.document)
    });

    console.log(`Indexed ${embeddings.length} challenge content embeddings`);
  }

  /**
   * Create embedding for text using OpenAI
   */
  private async createEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      encoding_format: "float"
    });
    return response.data[0].embedding;
  }

  /**
   * Index user interactions and progress for personalized retrieval
   */
  async indexUserData(userId: string) {
    try {
      // Get user's journal entries
      const journals = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(desc(journalEntries.createdAt))
        .limit(10);

      // Get user progress
      const [progress] = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId))
        .limit(1);

      // Get AI interaction history
      const aiHistory = await db
        .select()
        .from(aiResponseHistory)
        .where(eq(aiResponseHistory.userId, userId))
        .orderBy(desc(aiResponseHistory.createdAt))
        .limit(5);

      const userDocuments = [];

      // Index journal entries
      for (const journal of journals) {
        const content = `Day ${journal.day} Journal: Experience: ${journal.experience || 'Not recorded'}, Insights: ${journal.insights || 'Not recorded'}, Challenges: ${journal.challenges || 'Not recorded'}`;
        const embedding = await this.createEmbedding(content);
        
        userDocuments.push({
          id: `user_${userId}_journal_${journal.id}`,
          embedding,
          metadata: {
            type: 'journal_entry',
            userId,
            day: journal.day,
            timestamp: journal.createdAt?.toISOString()
          },
          document: content
        });
      }

      // Index progress data
      if (progress) {
        const progressContent = `User Progress: Current Day ${progress.currentDay}, Completed Days: ${(progress.completedDays as number[])?.length || 0}, Streak: ${progress.streakCount || 0} days, Challenge: ${progress.challengeType || 'general'}`;
        const embedding = await this.createEmbedding(progressContent);
        
        userDocuments.push({
          id: `user_${userId}_progress`,
          embedding,
          metadata: {
            type: 'progress_data',
            userId,
            currentDay: progress.currentDay,
            challengeType: progress.challengeType
          },
          document: progressContent
        });
      }

      if (userDocuments.length > 0) {
        await this.collection.add({
          ids: userDocuments.map(d => d.id),
          embeddings: userDocuments.map(d => d.embedding),
          metadatas: userDocuments.map(d => d.metadata),
          documents: userDocuments.map(d => d.document)
        });

        console.log(`Indexed ${userDocuments.length} user documents for ${userId}`);
      }

    } catch (error) {
      console.error("Error indexing user data:", error);
    }
  }

  /**
   * Get personalized context using semantic search with simplified output for hybrid routing
   */
  async getPersonalizedContext(
    userId: string, 
    query: string, 
    challengeType: string,
    maxResults: number = 10
  ): Promise<{
    personalizedPrompt: string;
    relevantContext: string[];
    userInsights: string[];
    challengeContent: string[];
  }> {
    try {
      const queryEmbedding = await this.createEmbedding(query);

      // Search for relevant content
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: maxResults,
        where: {
          $or: [
            { challengeType: challengeType },
            { userId: userId },
            { type: 'challenge_content' }
          ]
        }
      });

      const challengeContent: string[] = [];
      const userHistory: string[] = [];
      const relevantInsights: string[] = [];

      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          const doc = results.documents[0][i];
          const metadata = results.metadatas?.[0]?.[i];
          
          if (metadata?.type === 'challenge_content') {
            challengeContent.push(doc);
          } else if (metadata?.type === 'journal_entry' || metadata?.type === 'progress_data') {
            userHistory.push(doc);
          }
        }
      }

      const personalizedPrompt = `
CHALLENGE CONTEXT (${challengeType}):
${challengeContent.join('\n\n')}

USER INSIGHTS & HISTORY:
${userHistory.join('\n\n')}

Use this context to provide highly personalized guidance that references specific techniques and builds upon the user's documented experiences.`;

      return {
        personalizedPrompt,
        relevantContext: [...challengeContent, ...userHistory],
        userInsights: userHistory,
        challengeContent
      };

    } catch (error) {
      console.error("Error getting personalized context:", error);
      return {
        personalizedPrompt: `Provide guidance for ${challengeType} challenge based on quantum consciousness principles.`,
        relevantContext: [],
        userInsights: [],
        challengeContent: []
      };
    }
  }



  /**
   * Create optimized personalized prompt with semantic context
   */
  private createPersonalizedPrompt(
    challengeContent: string[],
    userHistory: string[],
    challengeType: string,
    query: string
  ): string {
    return `
ADVANCED PERSONALIZED QUANTUM CONSCIOUSNESS COACHING

CHALLENGE FOCUS: ${challengeType.replace('_', ' ').toUpperCase()}

RELEVANT CHALLENGE CONTENT:
${challengeContent.slice(0, 2).join('\n\n')}

USER PERSONALIZATION DATA:
${userHistory.slice(0, 3).join('\n')}

USER QUERY: ${query}

PERSONALIZATION INSTRUCTIONS:
- Reference specific challenge techniques and practices from the content above
- Build upon user's documented experiences and insights
- Adapt Joe Dispenza and Neville Goddard methods to this specific challenge and user context
- Address user's current progress level and specific challenges mentioned
- Provide practical, actionable guidance that connects to their personal journey
- Maintain quantum consciousness framework while being personally relevant

Provide a highly personalized, contextually aware response that demonstrates deep understanding of both the challenge content and the user's individual journey.
`;
  }

  /**
   * Generate personalized AI response using vector context
   */
  async generatePersonalizedResponse(
    userId: string,
    query: string,
    challengeType: string
  ): Promise<string> {
    try {
      // Get personalized context using semantic search
      const context = await this.getPersonalizedContext(userId, query, challengeType);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: context.personalizedPrompt
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      return response.choices[0].message.content || "Unable to generate personalized response.";

    } catch (error) {
      console.error("Error generating personalized response:", error);
      throw error;
    }
  }
}

// Global instance
export const vectorPersonalization = new VectorPersonalizationEngine();