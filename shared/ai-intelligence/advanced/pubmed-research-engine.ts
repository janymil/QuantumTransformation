/**
 * PubMed Research Engine
 * Real-time research integration using validated PubMed API
 */

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi?: string;
  abstract?: string;
  keywords?: string[];
  relevanceScore?: number;
  credibilityScore?: number;
}

interface ResearchResult {
  discipline: string;
  query: string;
  articles: PubMedArticle[];
  totalFound: number;
  qualityScore: number;
  extractedTechniques: string[];
  lastUpdated: Date;
}

class PubMedResearchEngine {
  private apiKey: string;
  private baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  
  // Therapeutic discipline search configurations
  private disciplineQueries = {
    'cognitive_behavioral_therapy': [
      'cognitive behavioral therapy depression',
      'CBT anxiety disorders',
      'cognitive restructuring therapy',
      'behavioral activation depression'
    ],
    'dialectical_behavior_therapy': [
      'dialectical behavior therapy',
      'DBT borderline personality',
      'emotion regulation therapy',
      'distress tolerance skills'
    ],
    'trauma_therapy': [
      'EMDR trauma PTSD therapy',
      'prolonged exposure therapy',
      'cognitive processing therapy',
      'trauma focused therapy'
    ],
    'mindfulness_therapy': [
      'mindfulness meditation therapy',
      'MBSR anxiety depression',
      'mindfulness-based cognitive therapy',
      'acceptance commitment therapy'
    ]
  };

  constructor() {
    this.apiKey = process.env.PUBMED_API_KEY || '';
    if (!this.apiKey) {
      console.warn('PubMed API key not configured');
    }
  }

  /**
   * Conduct autonomous research for a specific therapeutic discipline
   */
  async conductDisciplineResearch(discipline: string, maxArticles = 10): Promise<ResearchResult> {
    const queries = this.disciplineQueries[discipline as keyof typeof this.disciplineQueries];
    if (!queries) {
      throw new Error(`Unknown discipline: ${discipline}`);
    }

    console.log(`Starting PubMed research for ${discipline}...`);
    
    const allArticles: PubMedArticle[] = [];
    const extractedTechniques: Set<string> = new Set();

    // Search using multiple queries for comprehensive coverage
    for (const query of queries) {
      try {
        const articles = await this.searchPubMed(query, Math.ceil(maxArticles / queries.length));
        
        // Score articles for relevance and credibility
        const scoredArticles = articles.map(article => ({
          ...article,
          relevanceScore: this.calculateRelevanceScore(article, discipline),
          credibilityScore: this.calculateCredibilityScore(article)
        }));

        allArticles.push(...scoredArticles);

        // Extract therapeutic techniques
        scoredArticles.forEach(article => {
          const techniques = this.extractTechniques(article, discipline);
          techniques.forEach(tech => extractedTechniques.add(tech));
        });

        // Rate limiting - PubMed allows 3 requests per second
        await this.delay(350);
        
      } catch (error) {
        console.error(`Research query failed for "${query}":`, error);
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueArticles = this.removeDuplicates(allArticles)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, maxArticles);

    const qualityScore = this.calculateOverallQuality(uniqueArticles);

    console.log(`Research completed for ${discipline}: ${uniqueArticles.length} articles, quality: ${qualityScore.toFixed(2)}`);

    return {
      discipline,
      query: queries.join(' | '),
      articles: uniqueArticles,
      totalFound: allArticles.length,
      qualityScore,
      extractedTechniques: Array.from(extractedTechniques),
      lastUpdated: new Date()
    };
  }

  /**
   * Get detailed content for specific articles
   */
  async getArticleDetails(pmid: string): Promise<PubMedArticle | null> {
    try {
      const detailUrl = `${this.baseUrl}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml&api_key=${this.apiKey}`;
      
      const response = await fetch(detailUrl);
      const xmlText = await response.text();
      
      // Parse XML content
      const titleMatch = xmlText.match(/<ArticleTitle[^>]*>(.*?)<\/ArticleTitle>/s);
      const abstractMatch = xmlText.match(/<Abstract[^>]*>(.*?)<\/Abstract>/s);
      const keywordMatches = xmlText.match(/<Keyword[^>]*>(.*?)<\/Keyword>/g);
      const doiMatch = xmlText.match(/<ELocationID EIdType="doi"[^>]*>(.*?)<\/ELocationID>/);

      if (!titleMatch) return null;

      return {
        pmid,
        title: this.cleanXmlText(titleMatch[1]),
        authors: 'Detailed fetch',
        journal: 'From detail fetch',
        year: '2025',
        abstract: abstractMatch ? this.cleanXmlText(abstractMatch[1]) : undefined,
        keywords: keywordMatches ? keywordMatches.map(k => this.cleanXmlText(k)) : [],
        doi: doiMatch ? doiMatch[1] : undefined
      };

    } catch (error) {
      console.error(`Failed to fetch details for PMID ${pmid}:`, error);
      return null;
    }
  }

  /**
   * Search PubMed with specific query
   */
  private async searchPubMed(query: string, maxResults: number): Promise<PubMedArticle[]> {
    try {
      // Step 1: Search for article IDs
      const searchUrl = `${this.baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&api_key=${this.apiKey}`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (!searchData.esearchresult?.idlist?.length) {
        return [];
      }

      const pmids = searchData.esearchresult.idlist;

      // Step 2: Get article summaries
      const summaryUrl = `${this.baseUrl}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json&api_key=${this.apiKey}`;
      
      const summaryResponse = await fetch(summaryUrl);
      const summaryData = await summaryResponse.json();

      // Step 3: Parse and return articles
      const articles: PubMedArticle[] = [];
      for (const pmid of pmids) {
        const article = summaryData.result[pmid];
        if (article?.title) {
          articles.push({
            pmid,
            title: article.title,
            authors: article.authors?.map((a: any) => a.name).join(', ') || 'Unknown',
            journal: article.fulljournalname || article.source || 'Unknown Journal',
            year: article.pubdate ? new Date(article.pubdate).getFullYear().toString() : 'Unknown',
            doi: article.elocationid || undefined
          });
        }
      }

      return articles;

    } catch (error) {
      console.error(`PubMed search failed for query "${query}":`, error);
      return [];
    }
  }

  /**
   * Calculate relevance score based on discipline-specific criteria
   */
  private calculateRelevanceScore(article: PubMedArticle, discipline: string): number {
    const text = (article.title + ' ' + (article.abstract || '')).toLowerCase();
    let score = 0;

    const disciplineKeywords = {
      'cognitive_behavioral_therapy': ['cbt', 'cognitive', 'behavioral', 'therapy', 'depression', 'anxiety'],
      'dialectical_behavior_therapy': ['dbt', 'dialectical', 'emotion regulation', 'borderline'],
      'trauma_therapy': ['trauma', 'ptsd', 'emdr', 'exposure', 'processing'],
      'mindfulness_therapy': ['mindfulness', 'meditation', 'mbsr', 'mbct', 'acceptance']
    };

    const keywords = disciplineKeywords[discipline as keyof typeof disciplineKeywords] || [];
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += keyword.length > 3 ? 0.3 : 0.2; // Longer keywords weighted more
      }
    });

    // Boost recent articles
    const currentYear = new Date().getFullYear();
    const articleYear = parseInt(article.year);
    if (articleYear >= currentYear - 2) score += 0.2;
    else if (articleYear >= currentYear - 5) score += 0.1;

    // Boost articles with abstracts
    if (article.abstract) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate credibility score based on journal and publication factors
   */
  private calculateCredibilityScore(article: PubMedArticle): number {
    let score = 0.5; // Base score

    // High-impact therapeutic journals
    const highImpactJournals = [
      'journal of consulting and clinical psychology',
      'psychological science',
      'clinical psychology review',
      'behaviour research and therapy',
      'cognitive therapy and research',
      'psychological medicine',
      'american journal of psychiatry'
    ];

    const journalLower = article.journal.toLowerCase();
    if (highImpactJournals.some(journal => journalLower.includes(journal))) {
      score += 0.3;
    }

    // Medium-impact journals
    const mediumImpactJournals = [
      'bmc psychology',
      'scientific reports',
      'cognitive behaviour therapy',
      'psychological trauma'
    ];

    if (mediumImpactJournals.some(journal => journalLower.includes(journal))) {
      score += 0.2;
    }

    // Boost for recent publications
    const currentYear = new Date().getFullYear();
    const articleYear = parseInt(article.year);
    if (articleYear >= currentYear - 1) score += 0.2;

    // Boost for DOI presence (indicates proper publication)
    if (article.doi) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Extract therapeutic techniques from article content
   */
  private extractTechniques(article: PubMedArticle, discipline: string): string[] {
    const text = (article.title + ' ' + (article.abstract || '')).toLowerCase();
    const techniques: string[] = [];

    const disciplineTechniques = {
      'cognitive_behavioral_therapy': [
        'cognitive restructuring', 'thought records', 'behavioral activation',
        'exposure therapy', 'activity scheduling', 'problem solving'
      ],
      'dialectical_behavior_therapy': [
        'emotion regulation', 'distress tolerance', 'interpersonal effectiveness',
        'mindfulness skills', 'wise mind', 'radical acceptance'
      ],
      'trauma_therapy': [
        'emdr', 'prolonged exposure', 'cognitive processing therapy',
        'trauma-focused cbt', 'narrative exposure', 'somatic experiencing'
      ],
      'mindfulness_therapy': [
        'mindfulness meditation', 'body scan', 'breathing exercises',
        'loving-kindness', 'present moment awareness', 'acceptance'
      ]
    };

    const possibleTechniques = disciplineTechniques[discipline as keyof typeof disciplineTechniques] || [];
    
    possibleTechniques.forEach(technique => {
      if (text.includes(technique.toLowerCase())) {
        techniques.push(technique);
      }
    });

    return techniques;
  }

  /**
   * Remove duplicate articles based on PMID
   */
  private removeDuplicates(articles: PubMedArticle[]): PubMedArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      if (seen.has(article.pmid)) {
        return false;
      }
      seen.add(article.pmid);
      return true;
    });
  }

  /**
   * Calculate overall quality score for research results
   */
  private calculateOverallQuality(articles: PubMedArticle[]): number {
    if (articles.length === 0) return 0;

    const avgRelevance = articles.reduce((sum, a) => sum + (a.relevanceScore || 0), 0) / articles.length;
    const avgCredibility = articles.reduce((sum, a) => sum + (a.credibilityScore || 0), 0) / articles.length;
    
    // Weight relevance slightly more than credibility for therapeutic applications
    return (avgRelevance * 0.6) + (avgCredibility * 0.4);
  }

  /**
   * Clean XML text content
   */
  private cleanXmlText(text: string): string {
    return text.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Rate limiting helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      const testUrl = `${this.baseUrl}/einfo.fcgi?retmode=json&api_key=${this.apiKey}`;
      const response = await fetch(testUrl);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export { PubMedResearchEngine, type PubMedArticle, type ResearchResult };