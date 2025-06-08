/**
 * Advanced PDF and Document Processing Engine
 * Extracts text, metadata, and structure from PDFs, Word docs, and scanned documents
 */

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import natural from 'natural';
import nlp from 'compromise';
import Tesseract from 'tesseract.js';
import { createWorker } from 'tesseract.js';

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount?: number;
  wordCount?: number;
  language?: string;
  keywords?: string[];
}

export interface ExtractedContent {
  text: string;
  metadata: DocumentMetadata;
  structure: {
    headings: string[];
    paragraphs: string[];
    tables: any[];
    images: number;
  };
  analysis: {
    concepts: string[];
    keyPhrases: string[];
    sentiment: number;
    readabilityScore: number;
    clinicalTerms: string[];
    citations: string[];
  };
  quality: {
    textQuality: number;
    structureScore: number;
    completeness: number;
    credibilityIndicators: string[];
  };
}

export class DocumentProcessor {
  private tokenizer: any;
  private stemmer: any;
  private sentiment: any;

  constructor() {
    this.tokenizer = natural.WordTokenizer;
    this.stemmer = natural.PorterStemmer;
    this.sentiment = natural.SentimentAnalyzer;
    this.initializeNLP();
  }

  private initializeNLP() {
    // Initialize natural language processing components
    natural.PorterStemmer.attach();
  }

  /**
   * Process PDF document
   */
  async processPDF(buffer: Buffer): Promise<ExtractedContent> {
    try {
      const data = await pdfParse(buffer, {
        max: 0, // Parse all pages
        version: 'v1.10.100'
      });

      const extractedText = data.text;
      const metadata = this.extractPDFMetadata(data);
      const structure = this.analyzeDocumentStructure(extractedText);
      const analysis = await this.performTextAnalysis(extractedText);
      const quality = this.assessDocumentQuality(extractedText, structure, metadata);

      return {
        text: extractedText,
        metadata,
        structure,
        analysis,
        quality
      };

    } catch (error) {
      console.error('PDF processing failed:', error);
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  /**
   * Process Word document
   */
  async processWordDocument(buffer: Buffer): Promise<ExtractedContent> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const extractedText = result.value;
      
      // Extract metadata from Word document
      const metadata: DocumentMetadata = {
        wordCount: extractedText.split(/\s+/).length,
        language: this.detectLanguage(extractedText)
      };

      const structure = this.analyzeDocumentStructure(extractedText);
      const analysis = await this.performTextAnalysis(extractedText);
      const quality = this.assessDocumentQuality(extractedText, structure, metadata);

      return {
        text: extractedText,
        metadata,
        structure,
        analysis,
        quality
      };

    } catch (error) {
      console.error('Word document processing failed:', error);
      throw new Error(`Word document processing failed: ${error.message}`);
    }
  }

  /**
   * Process scanned document using OCR
   */
  async processScannedDocument(imageBuffer: Buffer): Promise<ExtractedContent> {
    try {
      const worker = await createWorker('eng');
      
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:()[]{}"\'-/ '
      });

      const { data: { text, confidence } } = await worker.recognize(imageBuffer);
      await worker.terminate();

      const metadata: DocumentMetadata = {
        wordCount: text.split(/\s+/).length,
        language: this.detectLanguage(text)
      };

      const structure = this.analyzeDocumentStructure(text);
      const analysis = await this.performTextAnalysis(text);
      const quality = this.assessDocumentQuality(text, structure, metadata, confidence);

      return {
        text,
        metadata,
        structure,
        analysis,
        quality
      };

    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Extract metadata from PDF
   */
  private extractPDFMetadata(pdfData: any): DocumentMetadata {
    const info = pdfData.info || {};
    
    return {
      title: info.Title,
      author: info.Author,
      subject: info.Subject,
      creator: info.Creator,
      producer: info.Producer,
      creationDate: info.CreationDate ? new Date(info.CreationDate) : undefined,
      modificationDate: info.ModDate ? new Date(info.ModDate) : undefined,
      pageCount: pdfData.numpages,
      wordCount: pdfData.text ? pdfData.text.split(/\s+/).length : 0,
      language: this.detectLanguage(pdfData.text)
    };
  }

  /**
   * Analyze document structure
   */
  private analyzeDocumentStructure(text: string): any {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Identify headings (lines that are shorter and may contain key indicators)
    const headings = lines.filter(line => {
      const trimmed = line.trim();
      return (
        trimmed.length < 100 &&
        (trimmed.match(/^(Chapter|Section|\d+\.|\d+\.\d+|Abstract|Introduction|Conclusion|References|Bibliography)/i) ||
         trimmed.match(/^[A-Z][A-Za-z\s]{2,50}$/) ||
         trimmed.endsWith(':'))
      );
    });

    // Identify paragraphs (longer text blocks)
    const paragraphs = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 100 && !headings.includes(line);
    });

    // Identify tables (lines with multiple columns or specific patterns)
    const tables = lines.filter(line => {
      return line.includes('\t') || line.match(/\s{3,}/g) || line.match(/\|\s*\w+\s*\|/);
    });

    // Count potential images (references to figures, images, etc.)
    const imageReferences = text.match(/(Figure|Fig\.|Image|Chart|Graph|Diagram)\s*\d+/gi) || [];

    return {
      headings: headings.slice(0, 20), // Limit to prevent overflow
      paragraphs: paragraphs.slice(0, 50),
      tables: tables.slice(0, 10),
      images: imageReferences.length
    };
  }

  /**
   * Perform comprehensive text analysis
   */
  private async performTextAnalysis(text: string): Promise<any> {
    // Tokenize and process text
    const tokens = new this.tokenizer().tokenize(text.toLowerCase());
    const filteredTokens = tokens.filter(token => 
      token.length > 2 && 
      !natural.stopwords.includes(token) &&
      /^[a-zA-Z]+$/.test(token)
    );

    // Extract key concepts using NLP
    const doc = nlp(text);
    const concepts = [
      ...doc.nouns().out('array'),
      ...doc.topics().out('array'),
      ...doc.people().out('array'),
      ...doc.places().out('array')
    ].filter((concept, index, arr) => 
      concept.length > 2 && 
      arr.indexOf(concept) === index
    ).slice(0, 20);

    // Extract key phrases
    const sentences = doc.sentences().out('array');
    const keyPhrases = sentences
      .filter(sentence => sentence.length > 10 && sentence.length < 200)
      .slice(0, 10);

    // Sentiment analysis
    const sentimentScore = this.calculateSentiment(filteredTokens);

    // Clinical terms detection
    const clinicalTerms = this.extractClinicalTerms(text);

    // Citation extraction
    const citations = this.extractCitations(text);

    // Readability score
    const readabilityScore = this.calculateReadabilityScore(text);

    return {
      concepts,
      keyPhrases,
      sentiment: sentimentScore,
      readabilityScore,
      clinicalTerms,
      citations
    };
  }

  /**
   * Calculate sentiment score
   */
  private calculateSentiment(tokens: string[]): number {
    if (tokens.length === 0) return 0;

    // Simple sentiment calculation based on positive/negative words
    const positiveWords = ['effective', 'successful', 'improved', 'beneficial', 'positive', 'significant', 'better', 'enhanced', 'excellent', 'good'];
    const negativeWords = ['ineffective', 'failed', 'worse', 'negative', 'harmful', 'poor', 'bad', 'declined', 'reduced', 'problematic'];

    let score = 0;
    tokens.forEach(token => {
      if (positiveWords.includes(token)) score += 1;
      if (negativeWords.includes(token)) score -= 1;
    });

    return Math.max(-1, Math.min(1, score / tokens.length * 10));
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

    return Array.from(terms).slice(0, 15);
  }

  /**
   * Extract citations and references
   */
  private extractCitations(text: string): string[] {
    const citationPatterns = [
      /\([^)]*\d{4}[^)]*\)/g, // (Author, 2023)
      /\[[^\]]*\d{4}[^\]]*\]/g, // [Author, 2023]
      /doi:\s*10\.\d+\/\S+/gi, // DOI references
      /PMID:\s*\d+/gi, // PubMed IDs
      /ISBN:\s*[\d-]+/gi // ISBN numbers
    ];

    const citations = new Set<string>();
    citationPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => citations.add(match.trim()));
    });

    return Array.from(citations).slice(0, 20);
  }

  /**
   * Calculate readability score (simplified Flesch Reading Ease)
   */
  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Simplified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Normalize to 0-1 scale
    return Math.max(0, Math.min(1, score / 100));
  }

  /**
   * Count syllables in a word
   */
  private countSyllables(word: string): number {
    const vowels = 'aeiouy';
    let syllableCount = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i].toLowerCase());
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }

    // Handle silent e
    if (word.endsWith('e') && syllableCount > 1) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  }

  /**
   * Detect document language
   */
  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const englishIndicators = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase().split(/\s+/).slice(0, 100);
    
    const englishCount = words.filter(word => englishIndicators.includes(word)).length;
    const englishRatio = englishCount / Math.min(words.length, 100);

    return englishRatio > 0.1 ? 'en' : 'unknown';
  }

  /**
   * Assess overall document quality
   */
  private assessDocumentQuality(
    text: string, 
    structure: any, 
    metadata: DocumentMetadata, 
    ocrConfidence?: number
  ): any {
    // Text quality assessment
    const textLength = text.length;
    const wordCount = text.split(/\s+/).length;
    const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
    const lexicalDiversity = uniqueWords / wordCount;

    const textQuality = Math.min(1, (
      (textLength > 1000 ? 0.3 : textLength / 1000 * 0.3) +
      (lexicalDiversity * 0.3) +
      (ocrConfidence ? ocrConfidence / 100 * 0.4 : 0.4)
    ));

    // Structure quality
    const hasHeadings = structure.headings.length > 0 ? 0.3 : 0;
    const hasParagraphs = structure.paragraphs.length > 0 ? 0.3 : 0;
    const hasOrganization = structure.headings.length > 2 ? 0.4 : structure.headings.length * 0.2;
    const structureScore = hasHeadings + hasParagraphs + hasOrganization;

    // Completeness assessment
    const hasMetadata = (metadata.author ? 0.2 : 0) + (metadata.title ? 0.2 : 0) + (metadata.creationDate ? 0.1 : 0);
    const hasReferences = text.includes('References') || text.includes('Bibliography') ? 0.2 : 0;
    const hasAbstract = text.includes('Abstract') || text.includes('Summary') ? 0.2 : 0;
    const completeness = Math.min(1, hasMetadata + hasReferences + hasAbstract + 0.1);

    // Credibility indicators
    const credibilityIndicators = [];
    if (metadata.author) credibilityIndicators.push('Author identified');
    if (metadata.creationDate) credibilityIndicators.push('Publication date available');
    if (text.match(/doi:|PMID:|ISBN:/i)) credibilityIndicators.push('Academic identifiers present');
    if (text.match(/university|college|institute|journal|research/i)) credibilityIndicators.push('Academic affiliation');
    if (text.includes('peer review') || text.includes('peer-reviewed')) credibilityIndicators.push('Peer reviewed');

    return {
      textQuality: Math.round(textQuality * 100) / 100,
      structureScore: Math.round(structureScore * 100) / 100,
      completeness: Math.round(completeness * 100) / 100,
      credibilityIndicators
    };
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor();