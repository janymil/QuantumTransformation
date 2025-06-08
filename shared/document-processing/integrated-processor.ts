/**
 * Integrated Document Processing Pipeline
 * Combines PDF/Word processing with BunnyNet storage and AI knowledge extraction
 */

import { bunnyNetService } from '../bunnynet-integration';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ExtractedContent {
  text: string;
  metadata: {
    pages?: number;
    wordCount: number;
    author?: string;
    title?: string;
    creationDate?: Date;
  };
  analysis: {
    concepts: string[];
    keyPhrases: string[];
    clinicalTerms: string[];
    citations: string[];
    readabilityScore: number;
    credibilityScore: number;
  };
  quality: {
    textQuality: number;
    structureScore: number;
    completeness: number;
    credibilityIndicators: string[];
  };
}

export interface ProcessedDocument {
  id: string;
  originalFilename: string;
  bunnyNetUrl: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'image';
  extractedContent: ExtractedContent;
  knowledgeBase: {
    concepts: string[];
    relationships: string[];
    clinicalRelevance: number;
    evidenceLevel: string;
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

export class IntegratedDocumentProcessor {
  /**
   * Process and store document with full pipeline
   */
  async processDocument(
    fileBuffer: Buffer,
    filename: string,
    fileType: 'pdf' | 'docx' | 'txt' | 'image',
    discipline: string = 'general'
  ): Promise<ProcessedDocument> {
    const startTime = Date.now();
    const documentId = `${discipline}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Step 1: Extract content based on file type
      console.log(`Processing ${fileType} document: ${filename}`);
      let extractedContent: ExtractedContent;

      switch (fileType) {
        case 'pdf':
          extractedContent = await documentProcessor.processPDF(fileBuffer);
          break;
        case 'docx':
          extractedContent = await documentProcessor.processWordDocument(fileBuffer);
          break;
        case 'image':
          extractedContent = await documentProcessor.processScannedDocument(fileBuffer);
          break;
        case 'txt':
          const textContent = fileBuffer.toString('utf-8');
          extractedContent = await this.processTextDocument(textContent);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Step 2: Upload to BunnyNet storage
      console.log('Uploading to BunnyNet CDN...');
      const uploadResult = await bunnyNetService.uploadDocument(
        fileBuffer,
        filename,
        discipline,
        'processed'
      );

      if (!uploadResult.success) {
        throw new Error(`BunnyNet upload failed: ${uploadResult.error}`);
      }

      // Step 3: Process with AI knowledge extraction
      console.log('Extracting knowledge with AI engine...');
      const knowledgeResult = await knowledgeAcquisitionEngine.processDocument({
        text: extractedContent.text,
        metadata: extractedContent.metadata,
        source: uploadResult.url,
        discipline
      });

      // Step 4: Calculate processing metrics
      const processingTime = Date.now() - startTime;
      const qualityScore = this.calculateOverallQuality(extractedContent, knowledgeResult);

      const processedDocument: ProcessedDocument = {
        id: documentId,
        originalFilename: filename,
        bunnyNetUrl: uploadResult.url,
        fileType,
        extractedContent,
        knowledgeBase: {
          concepts: knowledgeResult.concepts || [],
          relationships: knowledgeResult.relationships || [],
          clinicalRelevance: knowledgeResult.clinicalRelevance || 0,
          evidenceLevel: knowledgeResult.evidenceLevel || 'moderate'
        },
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

      console.log(`Document processing completed in ${processingTime}ms`);
      console.log(`Quality score: ${qualityScore}`);
      console.log(`Public URL: ${uploadResult.url}`);

      return processedDocument;

    } catch (error) {
      console.error('Document processing failed:', error);
      
      return {
        id: documentId,
        originalFilename: filename,
        bunnyNetUrl: '',
        fileType,
        extractedContent: this.getEmptyExtractedContent(),
        knowledgeBase: {
          concepts: [],
          relationships: [],
          clinicalRelevance: 0,
          evidenceLevel: 'low'
        },
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
   * Process multiple documents in batch
   */
  async processBatch(
    documents: Array<{
      buffer: Buffer;
      filename: string;
      fileType: 'pdf' | 'docx' | 'txt' | 'image';
      discipline?: string;
    }>
  ): Promise<ProcessedDocument[]> {
    console.log(`Processing batch of ${documents.length} documents`);
    
    const results: ProcessedDocument[] = [];
    
    for (const doc of documents) {
      try {
        const result = await this.processDocument(
          doc.buffer,
          doc.filename,
          doc.fileType,
          doc.discipline || 'general'
        );
        results.push(result);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to process ${doc.filename}:`, error);
        // Continue with other documents
      }
    }
    
    console.log(`Batch processing completed: ${results.filter(r => r.processing.success).length}/${documents.length} successful`);
    return results;
  }

  /**
   * Retrieve processed document from BunnyNet
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
   * Search processed documents by content
   */
  async searchDocuments(
    query: string,
    discipline?: string,
    limit: number = 10
  ): Promise<Array<{
    url: string;
    relevanceScore: number;
    excerpt: string;
    metadata: any;
  }>> {
    // This would integrate with the knowledge base search
    // For now, return a placeholder structure
    return [];
  }

  /**
   * Process plain text document
   */
  private async processTextDocument(text: string): Promise<ExtractedContent> {
    const metadata = {
      wordCount: text.split(/\s+/).length,
      language: 'en'
    };

    const structure = {
      headings: [],
      paragraphs: text.split('\n\n').filter(p => p.trim().length > 0),
      tables: [],
      images: 0
    };

    const analysis = {
      concepts: [],
      keyPhrases: [],
      sentiment: 0,
      readabilityScore: 0.5,
      clinicalTerms: [],
      citations: []
    };

    const quality = {
      textQuality: 0.8,
      structureScore: 0.6,
      completeness: 0.7,
      credibilityIndicators: []
    };

    return {
      text,
      metadata,
      structure,
      analysis,
      quality
    };
  }

  /**
   * Calculate overall document quality score
   */
  private calculateOverallQuality(
    extractedContent: ExtractedContent,
    knowledgeResult: any
  ): number {
    const textQuality = extractedContent.quality.textQuality || 0;
    const structureScore = extractedContent.quality.structureScore || 0;
    const completeness = extractedContent.quality.completeness || 0;
    const clinicalRelevance = knowledgeResult.clinicalRelevance || 0;

    return Math.round(((textQuality + structureScore + completeness + clinicalRelevance) / 4) * 100) / 100;
  }

  /**
   * Get empty extracted content structure
   */
  private getEmptyExtractedContent(): ExtractedContent {
    return {
      text: '',
      metadata: {},
      structure: {
        headings: [],
        paragraphs: [],
        tables: [],
        images: 0
      },
      analysis: {
        concepts: [],
        keyPhrases: [],
        sentiment: 0,
        readabilityScore: 0,
        clinicalTerms: [],
        citations: []
      },
      quality: {
        textQuality: 0,
        structureScore: 0,
        completeness: 0,
        credibilityIndicators: []
      }
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
      successRate: 0,
      averageQuality: 0,
      storageUsed: 0,
      disciplineBreakdown: {}
    };
  }
}

// Export singleton instance
export const integratedDocumentProcessor = new IntegratedDocumentProcessor();