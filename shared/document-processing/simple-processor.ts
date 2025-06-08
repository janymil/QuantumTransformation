/**
 * Simplified Document Processing for Replit Infrastructure
 * Handles text extraction and basic analysis with BunnyNet storage
 */

import { bunnyNetService } from '../bunnynet-integration';

export interface ProcessedDocument {
  id: string;
  originalFilename: string;
  bunnyNetUrl: string;
  fileType: 'txt' | 'json';
  content: string;
  analysis: {
    wordCount: number;
    concepts: string[];
    keyPhrases: string[];
    clinicalTerms: string[];
    readabilityScore: number;
  };
  storage: {
    uploadedAt: Date;
    size: number;
    publicUrl: string;
    disciplineFolder: string;
  };
  processing: {
    processingTime: number;
    qualityScore: number;
    success: boolean;
    errors?: string[];
  };
}

export class SimpleDocumentProcessor {
  /**
   * Process text document and store in BunnyNet
   */
  async processTextDocument(
    text: string,
    filename: string,
    discipline: string = 'general'
  ): Promise<ProcessedDocument> {
    const startTime = Date.now();
    const documentId = `${discipline}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`Processing text document: ${filename}`);

      // Create text buffer for upload
      const textBuffer = Buffer.from(text, 'utf-8');

      // Upload to BunnyNet storage
      console.log('Uploading to BunnyNet CDN...');
      const uploadResult = await bunnyNetService.uploadDocument(
        textBuffer,
        filename,
        discipline,
        'research'
      );

      if (!uploadResult.success) {
        throw new Error(`BunnyNet upload failed: ${uploadResult.error}`);
      }

      // Perform text analysis
      const analysis = this.analyzeText(text);

      // Calculate processing metrics
      const processingTime = Date.now() - startTime;
      const qualityScore = this.calculateQualityScore(text, analysis);

      const processedDocument: ProcessedDocument = {
        id: documentId,
        originalFilename: filename,
        bunnyNetUrl: uploadResult.url,
        fileType: filename.endsWith('.json') ? 'json' : 'txt',
        content: text,
        analysis,
        storage: {
          uploadedAt: new Date(),
          size: uploadResult.size,
          publicUrl: uploadResult.url,
          disciplineFolder: discipline
        },
        processing: {
          processingTime,
          qualityScore,
          success: true
        }
      };

      console.log(`Document processed successfully in ${processingTime}ms`);
      console.log(`Quality score: ${qualityScore}`);
      console.log(`Public URL: ${uploadResult.url}`);

      return processedDocument;

    } catch (error) {
      console.error('Document processing failed:', error);
      
      return {
        id: documentId,
        originalFilename: filename,
        bunnyNetUrl: '',
        fileType: 'txt',
        content: '',
        analysis: this.getEmptyAnalysis(),
        storage: {
          uploadedAt: new Date(),
          size: 0,
          publicUrl: '',
          disciplineFolder: discipline
        },
        processing: {
          processingTime: Date.now() - startTime,
          qualityScore: 0,
          success: false,
          errors: [error.message]
        }
      };
    }
  }

  /**
   * Process research document from JSON format
   */
  async processResearchDocument(
    documentData: {
      title: string;
      author: string;
      content: string;
      abstract?: string;
      keywords?: string[];
      citations?: string[];
    },
    discipline: string = 'general'
  ): Promise<ProcessedDocument> {
    const filename = `${documentData.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const fullText = [
      documentData.title,
      documentData.author,
      documentData.abstract || '',
      documentData.content,
      ...(documentData.keywords || []),
      ...(documentData.citations || [])
    ].join('\n\n');

    return this.processTextDocument(fullText, filename, discipline);
  }

  /**
   * Batch process multiple text documents
   */
  async processBatch(
    documents: Array<{
      text: string;
      filename: string;
      discipline?: string;
    }>
  ): Promise<ProcessedDocument[]> {
    console.log(`Processing batch of ${documents.length} documents`);
    
    const results: ProcessedDocument[] = [];
    
    for (const doc of documents) {
      try {
        const result = await this.processTextDocument(
          doc.text,
          doc.filename,
          doc.discipline || 'general'
        );
        results.push(result);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to process ${doc.filename}:`, error);
      }
    }
    
    console.log(`Batch processing completed: ${results.filter(r => r.processing.success).length}/${documents.length} successful`);
    return results;
  }

  /**
   * Retrieve document from BunnyNet
   */
  async retrieveDocument(bunnyNetUrl: string): Promise<string> {
    try {
      const response = await fetch(bunnyNetUrl);
      if (!response.ok) {
        throw new Error(`Failed to retrieve document: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Document retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Analyze text content
   */
  private analyzeText(text: string): {
    wordCount: number;
    concepts: string[];
    keyPhrases: string[];
    clinicalTerms: string[];
    readabilityScore: number;
  } {
    // Basic word count
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    // Extract concepts (nouns and important terms)
    const concepts = this.extractConcepts(text);

    // Extract key phrases
    const keyPhrases = this.extractKeyPhrases(text);

    // Extract clinical terms
    const clinicalTerms = this.extractClinicalTerms(text);

    // Calculate readability score
    const readabilityScore = this.calculateReadabilityScore(text);

    return {
      wordCount,
      concepts: concepts.slice(0, 20),
      keyPhrases: keyPhrases.slice(0, 10),
      clinicalTerms: clinicalTerms.slice(0, 15),
      readabilityScore
    };
  }

  /**
   * Extract key concepts from text
   */
  private extractConcepts(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Get most frequent words
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Extract key phrases
   */
  private extractKeyPhrases(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences
      .filter(sentence => sentence.length > 20 && sentence.length < 200)
      .map(sentence => sentence.trim())
      .slice(0, 10);
  }

  /**
   * Extract clinical and therapeutic terms
   */
  private extractClinicalTerms(text: string): string[] {
    const clinicalPatterns = [
      /\b(therapy|treatment|intervention|assessment|diagnosis|symptom|disorder|syndrome|condition)\b/gi,
      /\b(cognitive|behavioral|psychotherapy|counseling|therapeutic|clinical|psychological)\b/gi,
      /\b(anxiety|depression|trauma|stress|PTSD|OCD|ADHD|bipolar|schizophrenia)\b/gi,
      /\b(DSM-5|ICD-10|criteria|scale|inventory|questionnaire)\b/gi,
      /\b(efficacy|effectiveness|outcome|response|remission|recovery)\b/gi
    ];

    const terms = new Set<string>();
    clinicalPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => terms.add(match.toLowerCase()));
    });

    return Array.from(terms);
  }

  /**
   * Calculate readability score
   */
  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;

    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    // Simple readability formula
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * (avgWordLength / 5));
    
    // Normalize to 0-1 scale
    return Math.max(0, Math.min(1, score / 100));
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(text: string, analysis: any): number {
    const textLength = text.length;
    const wordCount = analysis.wordCount;
    const conceptCount = analysis.concepts.length;
    const clinicalRelevance = analysis.clinicalTerms.length;

    const lengthScore = Math.min(1, textLength / 1000);
    const contentScore = Math.min(1, wordCount / 500);
    const conceptScore = Math.min(1, conceptCount / 10);
    const relevanceScore = Math.min(1, clinicalRelevance / 5);

    return Math.round(((lengthScore + contentScore + conceptScore + relevanceScore) / 4) * 100) / 100;
  }

  /**
   * Get empty analysis structure
   */
  private getEmptyAnalysis() {
    return {
      wordCount: 0,
      concepts: [],
      keyPhrases: [],
      clinicalTerms: [],
      readabilityScore: 0
    };
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(): Promise<{
    totalProcessed: number;
    successRate: number;
    averageQuality: number;
    storageUsed: number;
    disciplineBreakdown: Record<string, number>;
  }> {
    // This would query the database for actual statistics
    return {
      totalProcessed: 0,
      successRate: 1.0,
      averageQuality: 0.85,
      storageUsed: 0,
      disciplineBreakdown: {
        'cognitive_behavioral_therapy': 0,
        'mindfulness_therapy': 0,
        'trauma_therapy': 0,
        'general': 0
      }
    };
  }
}

// Export singleton instance
export const simpleDocumentProcessor = new SimpleDocumentProcessor();