/**
 * API Routes for Advanced Knowledge Acquisition Engine
 * Handles document uploads, autonomous research, and model training
 */

import { Router } from 'express';
import multer from 'multer';
import { advancedKnowledgeEngine } from './knowledge-acquisition-engine';
import { bunnyNetService } from '@shared/bunnynet-integration';
import { db } from '../../../server/db';
import { knowledgeSources, extractedKnowledge, modelTrainingData, researchQueries } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, Word, and text files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

/**
 * Upload and process document for knowledge extraction
 */
router.post('/knowledge/upload-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { discipline, credibilityScore, author } = req.body;
    
    if (!discipline) {
      return res.status(400).json({ error: 'Discipline is required' });
    }

    console.log(`Processing document upload: ${req.file.originalname} for ${discipline}`);

    // Upload to BunnyNet first
    const uploadResult = await bunnyNetService.uploadDocument(
      req.file.buffer,
      req.file.originalname,
      discipline,
      'uploaded'
    );

    if (!uploadResult.success) {
      return res.status(500).json({ error: 'File upload to storage failed', details: uploadResult.error });
    }

    // Process document through knowledge engine with BunnyNet URL
    const knowledgeSource = await advancedKnowledgeEngine.processUploadedDocument(
      req.file.buffer,
      req.file.originalname,
      discipline,
      {
        credibilityScore: credibilityScore ? parseFloat(credibilityScore) : 0.8,
        author: author || undefined,
        bunnyNetUrl: uploadResult.url
      }
    );

    if (!knowledgeSource) {
      return res.status(422).json({ error: 'Document processing failed - insufficient content or quality' });
    }

    res.json({
      success: true,
      knowledgeSource: {
        id: knowledgeSource.id,
        title: knowledgeSource.title,
        discipline: knowledgeSource.discipline,
        credibilityScore: knowledgeSource.metadata.credibilityScore,
        relevanceScore: knowledgeSource.metadata.relevanceScore,
        extractedTechniques: knowledgeSource.extractedKnowledge.therapeuticTechniques.length,
        evidenceBased: knowledgeSource.extractedKnowledge.evidenceBased
      },
      message: 'Document processed and integrated into knowledge base'
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      error: 'Document processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Start autonomous research for a specific discipline
 */
router.post('/knowledge/start-research', async (req, res) => {
  try {
    const { discipline, topic, keywords, maxResults } = req.body;
    
    if (!discipline) {
      return res.status(400).json({ error: 'Discipline is required' });
    }

    console.log(`Starting autonomous research for ${discipline}${topic ? ` on topic: ${topic}` : ''}`);

    // Create research query record
    const queryId = await db.insert(researchQueries).values({
      topic: topic || `General ${discipline} research`,
      discipline,
      keywords: keywords || [],
      maxResults: maxResults || 10,
      status: 'in_progress'
    }).returning({ id: researchQueries.id });

    // Start research process
    const sources = await advancedKnowledgeEngine.conductDisciplineResearch(discipline);

    // Update query status
    await db.update(researchQueries)
      .set({ 
        status: 'completed',
        resultsFound: sources.length,
        lastExecuted: new Date()
      })
      .where(eq(researchQueries.id, queryId[0].id));

    res.json({
      success: true,
      queryId: queryId[0].id,
      sourcesFound: sources.length,
      sources: sources.map(source => ({
        id: source.id,
        title: source.title,
        type: source.type,
        credibilityScore: source.metadata.credibilityScore,
        relevanceScore: source.metadata.relevanceScore,
        evidenceBased: source.extractedKnowledge.evidenceBased
      })),
      message: `Research completed for ${discipline}`
    });

  } catch (error) {
    console.error('Research start error:', error);
    res.status(500).json({ 
      error: 'Research initiation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get knowledge sources by discipline
 */
router.get('/knowledge/sources/:discipline', async (req, res) => {
  try {
    const { discipline } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const sources = await db.select({
      id: knowledgeSources.id,
      title: knowledgeSources.title,
      type: knowledgeSources.type,
      author: knowledgeSources.author,
      publishDate: knowledgeSources.publishDate,
      credibilityScore: knowledgeSources.credibilityScore,
      relevanceScore: knowledgeSources.relevanceScore,
      citations: knowledgeSources.citations,
      peerReviewed: knowledgeSources.peerReviewed,
      createdAt: knowledgeSources.createdAt
    })
    .from(knowledgeSources)
    .where(eq(knowledgeSources.discipline, discipline))
    .orderBy(desc(knowledgeSources.credibilityScore))
    .limit(parseInt(limit as string))
    .offset(parseInt(offset as string));

    res.json({
      sources,
      total: sources.length,
      discipline
    });

  } catch (error) {
    console.error('Knowledge sources fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge sources' });
  }
});

/**
 * Get extracted knowledge for a specific source
 */
router.get('/knowledge/source/:sourceId/details', async (req, res) => {
  try {
    const { sourceId } = req.params;

    const sourceData = await db.select()
      .from(knowledgeSources)
      .where(eq(knowledgeSources.id, sourceId))
      .limit(1);

    if (sourceData.length === 0) {
      return res.status(404).json({ error: 'Knowledge source not found' });
    }

    const knowledge = await db.select()
      .from(extractedKnowledge)
      .where(eq(extractedKnowledge.sourceId, sourceId))
      .limit(1);

    res.json({
      source: sourceData[0],
      extractedKnowledge: knowledge[0] || null
    });

  } catch (error) {
    console.error('Source details fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch source details' });
  }
});

/**
 * Train specialized models from knowledge base
 */
router.post('/knowledge/train-models', async (req, res) => {
  try {
    const { disciplines } = req.body;
    
    console.log(`Starting model training for disciplines: ${disciplines?.join(', ') || 'all'}`);

    const trainingResults = await advancedKnowledgeEngine.trainSpecializedModels();

    res.json({
      success: true,
      results: trainingResults,
      message: `Model training completed for ${trainingResults.modelsUpdated.length} models`
    });

  } catch (error) {
    console.error('Model training error:', error);
    res.status(500).json({ 
      error: 'Model training failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate response using trained models
 */
router.post('/knowledge/generate-response', async (req, res) => {
  try {
    const { prompt, discipline, complexity = 'moderate' } = req.body;
    
    if (!prompt || !discipline) {
      return res.status(400).json({ error: 'Prompt and discipline are required' });
    }

    const response = await advancedKnowledgeEngine.generateResponse(
      prompt,
      discipline,
      complexity as 'simple' | 'moderate' | 'complex'
    );

    res.json({
      success: true,
      response: {
        content: response.content,
        confidence: response.confidence,
        evidenceBased: response.evidenceBased,
        sources: response.sources,
        modelUsed: response.modelUsed
      }
    });

  } catch (error) {
    console.error('Response generation error:', error);
    res.status(500).json({ 
      error: 'Response generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get learning analytics and statistics
 */
router.get('/knowledge/analytics', async (req, res) => {
  try {
    const analytics = await advancedKnowledgeEngine.getLearningAnalytics();

    res.json({
      success: true,
      analytics: {
        totalSources: analytics.totalSources,
        disciplineBreakdown: analytics.disciplineBreakdown,
        modelPerformance: analytics.modelPerformance,
        costSavings: {
          monthlyApiCosts: analytics.costSavings.monthlyApiCosts,
          savedCosts: analytics.costSavings.savedCosts,
          infrastructureCosts: analytics.costSavings.infrastructureCosts,
          netSavings: analytics.costSavings.netSavings,
          roi: analytics.costSavings.netSavings / analytics.costSavings.infrastructureCosts
        },
        qualityMetrics: {
          knowledgeQuality: analytics.knowledgeQuality,
          researchEffectiveness: analytics.researchEffectiveness
        }
      }
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * Get research queries history
 */
router.get('/knowledge/research-history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const queries = await db.select()
      .from(researchQueries)
      .orderBy(desc(researchQueries.createdAt))
      .limit(parseInt(limit as string));

    res.json({
      queries: queries.map(query => ({
        id: query.id,
        topic: query.topic,
        discipline: query.discipline,
        status: query.status,
        resultsFound: query.resultsFound,
        lastExecuted: query.lastExecuted,
        createdAt: query.createdAt
      }))
    });

  } catch (error) {
    console.error('Research history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch research history' });
  }
});

/**
 * Get model training data statistics
 */
router.get('/knowledge/training-data/:discipline', async (req, res) => {
  try {
    const { discipline } = req.params;

    const trainingData = await db.select()
      .from(modelTrainingData)
      .where(eq(modelTrainingData.discipline, discipline))
      .orderBy(desc(modelTrainingData.createdAt));

    const stats = {
      totalTrainingExamples: trainingData.length,
      validatedExamples: trainingData.filter(d => d.isValidated).length,
      averageConfidence: trainingData.reduce((sum, d) => sum + Number(d.confidence), 0) / trainingData.length,
      modelsInvolved: [...new Set(trainingData.map(d => d.modelName))],
      recentExamples: trainingData.slice(0, 10).map(d => ({
        id: d.id,
        modelName: d.modelName,
        confidence: d.confidence,
        isValidated: d.isValidated,
        createdAt: d.createdAt
      }))
    };

    res.json({
      discipline,
      stats
    });

  } catch (error) {
    console.error('Training data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch training data statistics' });
  }
});

/**
 * Start autonomous research engine
 */
router.post('/knowledge/start-autonomous-research', async (req, res) => {
  try {
    console.log('Starting autonomous research engine...');
    
    // Start the autonomous research system
    await advancedKnowledgeEngine.startAutonomousResearch();

    res.json({
      success: true,
      message: 'Autonomous research engine started successfully',
      status: 'running'
    });

  } catch (error) {
    console.error('Autonomous research start error:', error);
    res.status(500).json({ 
      error: 'Failed to start autonomous research engine',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get supported disciplines and their configurations
 */
router.get('/knowledge/disciplines', async (req, res) => {
  try {
    const disciplines = {
      'cognitive_behavioral_therapy': {
        name: 'Cognitive Behavioral Therapy',
        description: 'Evidence-based therapy focusing on thoughts, feelings, and behaviors',
        keywords: ['CBT', 'cognitive therapy', 'behavioral therapy', 'thought records'],
        specialists: ['Aaron Beck', 'Judith Beck', 'David Burns']
      },
      'dialectical_behavior_therapy': {
        name: 'Dialectical Behavior Therapy',
        description: 'Therapy combining CBT with mindfulness and distress tolerance',
        keywords: ['DBT', 'dialectical', 'mindfulness', 'distress tolerance'],
        specialists: ['Marsha Linehan', 'Kelly Koerner']
      },
      'trauma_therapy': {
        name: 'Trauma Therapy',
        description: 'Specialized approaches for trauma and PTSD treatment',
        keywords: ['PTSD', 'trauma', 'EMDR', 'exposure therapy'],
        specialists: ['Bessel van der Kolk', 'Judith Herman']
      },
      'mindfulness_therapy': {
        name: 'Mindfulness-Based Therapy',
        description: 'Therapeutic approaches incorporating mindfulness and meditation',
        keywords: ['mindfulness', 'MBSR', 'MBCT', 'meditation'],
        specialists: ['Jon Kabat-Zinn', 'Mark Williams']
      }
    };

    res.json({
      disciplines,
      total: Object.keys(disciplines).length
    });

  } catch (error) {
    console.error('Disciplines fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch disciplines' });
  }
});

export { router as knowledgeRoutes };