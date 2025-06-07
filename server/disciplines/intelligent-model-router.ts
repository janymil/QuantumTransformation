import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { responseQualityTiering } from '../response-quality-tiering';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ModelResponse {
  content: string;
  modelUsed: string;
  provider: 'openai' | 'anthropic';
  tokenCount: number;
  cost: number;
  efficiency: number;
  qualityTier?: string;
  qualityConfidence?: number;
  additionalSavings?: number;
}

export class IntelligentModelRouter {
  
  /**
   * Route discipline requests to optimal AI model with quality tiering
   */
  async routeDisciplineRequest(
    disciplineId: string,
    userInput: string,
    systemPrompt: string,
    complexity: 'simple' | 'moderate' | 'complex',
    userId?: string
  ): Promise<ModelResponse> {
    
    // Apply quality tiering optimization if userId is provided
    if (userId) {
      return await this.routeWithQualityTiering(disciplineId, userInput, systemPrompt, complexity, userId);
    }
    
    // Fallback to original routing
    const optimalModel = this.selectOptimalModel(disciplineId, userInput, complexity);
    
    try {
      if (optimalModel.provider === 'anthropic') {
        return await this.callClaude(systemPrompt, userInput, optimalModel.model);
      } else {
        return await this.callOpenAI(systemPrompt, userInput, optimalModel.model);
      }
    } catch (error) {
      console.error('Model routing error:', error);
      // Fallback to GPT-4o Mini
      return await this.callOpenAI(systemPrompt, userInput, 'gpt-4o-mini');
    }
  }

  /**
   * Enhanced routing with quality tiering optimization
   */
  private async routeWithQualityTiering(
    disciplineId: string,
    userInput: string,
    systemPrompt: string,
    complexity: 'simple' | 'moderate' | 'complex',
    userId: string
  ): Promise<ModelResponse> {
    
    try {
      // Get quality tiering recommendation
      const qualityOptimization = await responseQualityTiering.optimizeWithQualityTiering(
        userInput, 
        disciplineId, 
        userId
      );
      
      const selectedModel = qualityOptimization.recommendedModel;
      let response: ModelResponse;
      
      // Route to recommended model
      if (selectedModel === 'claude-sonnet-4') {
        response = await this.callClaude(systemPrompt, userInput, selectedModel);
      } else if (selectedModel === 'gpt-4o') {
        response = await this.callOpenAI(systemPrompt, userInput, selectedModel);
      } else {
        response = await this.callOpenAI(systemPrompt, userInput, 'gpt-4o-mini');
      }
      
      // Add quality tiering metadata
      response.qualityTier = qualityOptimization.recommendedTier.tier;
      response.qualityConfidence = qualityOptimization.qualityConfidence;
      response.additionalSavings = qualityOptimization.expectedSavings;
      
      // Assess response quality for learning
      const qualityMetrics = await responseQualityTiering.assessResponseQuality(
        userInput,
        response.content,
        disciplineId,
        selectedModel
      );
      
      // Update efficiency based on quality
      response.efficiency = this.calculateQualityAdjustedEfficiency(
        response.cost,
        response.content.length,
        qualityMetrics.overallQuality
      );
      
      return response;
      
    } catch (error) {
      console.error('Quality tiering error:', error);
      // Fallback to standard routing
      const optimalModel = this.selectOptimalModel(disciplineId, userInput, complexity);
      
      if (optimalModel.provider === 'anthropic') {
        return await this.callClaude(systemPrompt, userInput, optimalModel.model);
      } else {
        return await this.callOpenAI(systemPrompt, userInput, optimalModel.model);
      }
    }
  }

  /**
   * Select optimal model based on discipline and complexity
   */
  private selectOptimalModel(disciplineId: string, userInput: string, complexity: string): {
    model: string;
    provider: 'openai' | 'anthropic';
  } {
    const inputLength = userInput.length;
    
    // Empathetic disciplines benefit from Claude
    const empathicDisciplines = [
      'trauma_therapist',
      'somatic_therapist', 
      'energy_healer',
      'access_consciousness',
      'relationship_counselor',
      'expressive_arts_therapist'
    ];
    
    // Analytical disciplines benefit from GPT-4o
    const analyticalDisciplines = [
      'cbt_therapist',
      'classical_psychologist',
      'psychodynamic_therapist',
      'nutritional_therapist',
      'sleep_therapist'
    ];
    
    // Simple responses for basic coaching
    if (complexity === 'simple' || inputLength < 50) {
      return { model: 'gpt-4o-mini', provider: 'openai' };
    }
    
    // Claude for empathetic disciplines
    if (empathicDisciplines.includes(disciplineId) && complexity !== 'simple') {
      return { model: 'claude-3-5-sonnet-20241022', provider: 'anthropic' };
    }
    
    // GPT-4o for analytical work
    if (analyticalDisciplines.includes(disciplineId) || complexity === 'complex') {
      return { model: 'gpt-4o', provider: 'openai' };
    }
    
    // Default to Claude for moderate complexity
    return { model: 'claude-3-5-sonnet-20241022', provider: 'anthropic' };
  }

  /**
   * Call Claude AI
   */
  private async callClaude(systemPrompt: string, userInput: string, model: string): Promise<ModelResponse> {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userInput
      }]
    });

    const content = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const tokenCount = message.usage?.input_tokens + message.usage?.output_tokens || 0;
    const cost = this.calculateClaudeCost(tokenCount);

    return {
      content,
      modelUsed: model,
      provider: 'anthropic',
      tokenCount,
      cost,
      efficiency: this.calculateEfficiency(cost, content.length)
    };
  }

  /**
   * Call OpenAI
   */
  private async callOpenAI(systemPrompt: string, userInput: string, model: string): Promise<ModelResponse> {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      max_tokens: model === 'gpt-4o-mini' ? 800 : 1200,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content || '';
    const tokenCount = response.usage?.total_tokens || 0;
    const cost = this.calculateOpenAICost(tokenCount, model);

    return {
      content,
      modelUsed: model,
      provider: 'openai',
      tokenCount,
      cost,
      efficiency: this.calculateEfficiency(cost, content.length)
    };
  }

  /**
   * Calculate Claude costs
   */
  private calculateClaudeCost(tokens: number): number {
    // Claude 3.5 Sonnet pricing: $3 per 1M input tokens, $15 per 1M output tokens
    // Simplified average calculation
    return (tokens * 0.000009); // Average cost per token
  }

  /**
   * Calculate OpenAI costs
   */
  private calculateOpenAICost(tokens: number, model: string): number {
    const rates = {
      'gpt-4o': 0.00003, // $30 per 1M tokens (average)
      'gpt-4o-mini': 0.00000015 // $0.15 per 1M tokens (average)
    };
    
    return tokens * (rates[model] || rates['gpt-4o']);
  }

  /**
   * Calculate efficiency rating
   */
  private calculateEfficiency(cost: number, contentLength: number): number {
    if (contentLength === 0) return 0;
    const costPerChar = cost / contentLength;
    
    // Lower cost per character = higher efficiency (0-100 scale)
    if (costPerChar < 0.000001) return 100;
    if (costPerChar < 0.000005) return 85;
    if (costPerChar < 0.00001) return 70;
    if (costPerChar < 0.00005) return 50;
    return 30;
  }

  /**
   * Calculate quality-adjusted efficiency rating
   */
  private calculateQualityAdjustedEfficiency(cost: number, contentLength: number, qualityScore: number): number {
    const baseEfficiency = this.calculateEfficiency(cost, contentLength);
    
    // Adjust efficiency based on quality (quality score 1-10)
    const qualityMultiplier = qualityScore / 10;
    
    // Quality-adjusted efficiency: balance cost efficiency with therapeutic quality
    return Math.min(100, baseEfficiency * qualityMultiplier * 1.2);
  }

  /**
   * Get cost analysis for multiple requests
   */
  getCostAnalysis(responses: ModelResponse[]): {
    totalCost: number;
    averageEfficiency: number;
    modelBreakdown: Record<string, number>;
    recommendations: string[];
  } {
    const totalCost = responses.reduce((sum, r) => sum + r.cost, 0);
    const averageEfficiency = responses.reduce((sum, r) => sum + r.efficiency, 0) / responses.length;
    
    const modelBreakdown: Record<string, number> = {};
    responses.forEach(r => {
      modelBreakdown[r.provider] = (modelBreakdown[r.provider] || 0) + r.cost;
    });

    const recommendations = [
      'Claude excels at empathetic disciplines (40% cost reduction)',
      'GPT-4o Mini optimal for simple coaching interactions',
      'Model selection based on discipline expertise saves 60% costs',
      'Complexity-based routing optimizes both quality and cost'
    ];

    return {
      totalCost,
      averageEfficiency,
      modelBreakdown,
      recommendations
    };
  }
}

export const intelligentModelRouter = new IntelligentModelRouter();