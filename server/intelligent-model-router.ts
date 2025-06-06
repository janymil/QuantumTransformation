import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface ModelRoutingDecision {
  model: 'gpt-4o' | 'gpt-4o-mini';
  reasoning: string;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedCost: number;
  features: string[];
}

export interface QueryAnalysis {
  complexity: number; // 1-10 scale
  emotionalDepth: number; // 1-10 scale
  requires: {
    emotionalIntelligence: boolean;
    memoryIntegration: boolean;
    predictiveAnalysis: boolean;
    breakthroughDetection: boolean;
    complexReasoning: boolean;
  };
  queryType: 'basic_qa' | 'coaching_guidance' | 'emotional_support' | 'breakthrough_analysis' | 'predictive_insight';
}

/**
 * Intelligent Model Router for Cost-Optimized AI Coaching
 * Routes requests to GPT-4o or GPT-4o-mini based on complexity
 */
export class IntelligentModelRouter {

  /**
   * Analyze query complexity and requirements
   */
  async analyzeQueryComplexity(userQuery: string, sessionType: string, challengeType: string): Promise<QueryAnalysis> {
    // Define complexity indicators
    const complexityIndicators = {
      emotional: ['breakthrough', 'stuck', 'struggle', 'anxiety', 'fear', 'breakthrough', 'transformation', 'resistance'],
      predictive: ['predict', 'forecast', 'will I', 'likelihood', 'chances', 'future', 'completion'],
      memory: ['remember', 'previous', 'before', 'pattern', 'always', 'usually', 'history'],
      breakthrough: ['breakthrough', 'stuck', 'plateau', 'not working', 'frustrated', 'blocked'],
      complex: ['why', 'how does', 'explain', 'understand', 'connection', 'relationship', 'integrate']
    };

    const queryLower = userQuery.toLowerCase();
    
    // Calculate complexity scores
    const emotionalDepth = this.calculateIndicatorScore(queryLower, complexityIndicators.emotional);
    const predictiveNeed = this.calculateIndicatorScore(queryLower, complexityIndicators.predictive);
    const memoryNeed = this.calculateIndicatorScore(queryLower, complexityIndicators.memory);
    const breakthroughNeed = this.calculateIndicatorScore(queryLower, complexityIndicators.breakthrough);
    const complexReasoning = this.calculateIndicatorScore(queryLower, complexityIndicators.complex);

    // Overall complexity (1-10)
    const complexity = Math.min(10, Math.max(1, 
      (emotionalDepth * 1.5 + predictiveNeed * 2 + memoryNeed * 1.2 + breakthroughNeed * 2 + complexReasoning * 1.3) / 5
    ));

    // Determine query type
    let queryType: QueryAnalysis['queryType'] = 'basic_qa';
    if (breakthroughNeed > 2) queryType = 'breakthrough_analysis';
    else if (predictiveNeed > 2) queryType = 'predictive_insight';
    else if (emotionalDepth > 3) queryType = 'emotional_support';
    else if (complexity > 6) queryType = 'coaching_guidance';

    return {
      complexity,
      emotionalDepth,
      requires: {
        emotionalIntelligence: emotionalDepth > 3 || sessionType === 'emotional_coaching',
        memoryIntegration: memoryNeed > 2 || complexity > 7,
        predictiveAnalysis: predictiveNeed > 2 || sessionType === 'predictive_coaching',
        breakthroughDetection: breakthroughNeed > 2 || queryType === 'breakthrough_analysis',
        complexReasoning: complexReasoning > 3 || complexity > 8
      },
      queryType
    };
  }

  /**
   * Route to optimal model based on analysis
   */
  async routeToOptimalModel(
    userQuery: string, 
    sessionType: string, 
    challengeType: string,
    userTier: string = 'basic'
  ): Promise<ModelRoutingDecision> {
    
    const analysis = await this.analyzeQueryComplexity(userQuery, sessionType, challengeType);
    
    // Model selection logic
    const useGPT4o = 
      analysis.complexity > 7 ||
      analysis.requires.breakthroughDetection ||
      analysis.requires.predictiveAnalysis ||
      (analysis.requires.emotionalIntelligence && analysis.emotionalDepth > 6) ||
      (analysis.requires.complexReasoning && analysis.complexity > 6) ||
      sessionType === 'supreme_coaching' ||
      userTier === 'premium';

    const model = useGPT4o ? 'gpt-4o' : 'gpt-4o-mini';
    
    // Cost estimation (per request)
    const estimatedCost = useGPT4o ? 0.012 : 0.002;

    // Features enabled
    const features = [];
    if (useGPT4o) {
      features.push('Advanced reasoning', 'Complex emotional analysis', 'Breakthrough detection');
      if (analysis.requires.predictiveAnalysis) features.push('Predictive insights');
      if (analysis.requires.memoryIntegration) features.push('Advanced memory integration');
    } else {
      features.push('Fast response', 'Cost-optimized', 'Standard coaching');
    }

    const reasoning = useGPT4o 
      ? `Complex query (${analysis.complexity}/10) requires advanced reasoning capabilities`
      : `Standard query (${analysis.complexity}/10) suitable for cost-optimized processing`;

    return {
      model,
      reasoning,
      complexity: analysis.complexity > 7 ? 'complex' : analysis.complexity > 4 ? 'moderate' : 'simple',
      estimatedCost,
      features
    };
  }

  /**
   * Execute AI request with optimal model
   */
  async executeWithOptimalModel(
    prompt: string,
    systemPrompt: string,
    userQuery: string,
    sessionType: string,
    challengeType: string,
    userTier: string = 'basic',
    options: {
      temperature?: number;
      maxTokens?: number;
      responseFormat?: { type: "json_object" } | { type: "text" };
    } = {}
  ): Promise<{
    response: string;
    modelUsed: string;
    routingDecision: ModelRoutingDecision;
    actualCost: number;
  }> {
    
    const routingDecision = await this.routeToOptimalModel(userQuery, sessionType, challengeType, userTier);
    
    try {
      const response = await openai.chat.completions.create({
        model: routingDecision.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1500,
        ...(options.responseFormat && { response_format: options.responseFormat })
      });

      const responseContent = response.choices[0].message.content || "";
      
      // Calculate actual cost based on token usage
      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;
      
      const actualCost = routingDecision.model === 'gpt-4o' 
        ? (promptTokens * 0.0000025 + completionTokens * 0.00001) // GPT-4o pricing
        : (promptTokens * 0.00000015 + completionTokens * 0.0000006); // GPT-4o-mini pricing

      return {
        response: responseContent,
        modelUsed: routingDecision.model,
        routingDecision,
        actualCost
      };

    } catch (error) {
      console.error(`Error with ${routingDecision.model}:`, error);
      
      // Fallback to GPT-4o-mini if GPT-4o fails
      if (routingDecision.model === 'gpt-4o') {
        const fallbackResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1500
        });

        return {
          response: fallbackResponse.choices[0].message.content || "",
          modelUsed: 'gpt-4o-mini (fallback)',
          routingDecision: { ...routingDecision, model: 'gpt-4o-mini' },
          actualCost: 0.002
        };
      }
      
      throw error;
    }
  }

  /**
   * Get routing statistics and cost savings
   */
  async getRoutingStats(userId: string, days: number = 30): Promise<{
    totalRequests: number;
    gpt4oRequests: number;
    gpt4oMiniRequests: number;
    totalCost: number;
    estimatedCostWithoutRouting: number;
    savings: number;
    savingsPercentage: number;
  }> {
    // This would integrate with your usage tracking system
    // For now, providing example calculation
    
    const totalRequests = 100; // Would come from database
    const gpt4oRequests = 25; // 25% complex requests
    const gpt4oMiniRequests = 75; // 75% simple requests
    
    const totalCost = (gpt4oRequests * 0.012) + (gpt4oMiniRequests * 0.002);
    const estimatedCostWithoutRouting = totalRequests * 0.012; // All GPT-4o
    const savings = estimatedCostWithoutRouting - totalCost;
    const savingsPercentage = (savings / estimatedCostWithoutRouting) * 100;

    return {
      totalRequests,
      gpt4oRequests,
      gpt4oMiniRequests,
      totalCost,
      estimatedCostWithoutRouting,
      savings,
      savingsPercentage
    };
  }

  /**
   * Simple model selection based on prompt characteristics
   */
  selectModel(prompt: string, requestType: string): 'gpt-4o' | 'gpt-4o-mini' {
    const promptLower = prompt.toLowerCase();
    
    // Use GPT-4o for complex analysis requests
    const complexIndicators = [
      'analyze', 'breakthrough', 'complex', 'deep', 'therapeutic',
      'personality', 'trauma', 'resistance', 'pattern', 'integration'
    ];
    
    const hasComplexity = complexIndicators.some(indicator => 
      promptLower.includes(indicator)
    );
    
    // Use GPT-4o for analysis tasks, GPT-4o-mini for content generation
    if (requestType === 'daily_coaching_analysis' || hasComplexity) {
      return 'gpt-4o';
    }
    
    return 'gpt-4o-mini';
  }

  private calculateIndicatorScore(query: string, indicators: string[]): number {
    let score = 0;
    for (const indicator of indicators) {
      if (query.includes(indicator)) {
        score += indicator.length > 6 ? 2 : 1; // Longer, more specific terms get higher weight
      }
    }
    return Math.min(5, score); // Cap at 5
  }
}

// Global instance
export const modelRouter = new IntelligentModelRouter();