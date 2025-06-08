import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { DeepJournalingRequest } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export class IntelligentModelRouter {
  
  /**
   * Route requests to the optimal AI model based on therapeutic needs and cost efficiency
   */
  async routeTherapeuticRequest(
    request: DeepJournalingRequest,
    systemPrompt: string,
    userPrompt: string,
    complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
  ) {
    // Determine optimal model based on request characteristics
    const modelChoice = this.selectOptimalModel(request, complexity);
    
    switch (modelChoice.provider) {
      case 'anthropic':
        return await this.callAnthropicModel(modelChoice.model, systemPrompt, userPrompt);
      case 'openai':
        return await this.callOpenAIModel(modelChoice.model, systemPrompt, userPrompt);
      default:
        throw new Error('No suitable model available');
    }
  }

  /**
   * Select the most cost-effective and appropriate model for the request
   */
  private selectOptimalModel(request: DeepJournalingRequest, complexity: string) {
    const factors = this.analyzeRequestFactors(request);
    
    // Claude excels at empathetic, nuanced therapeutic responses
    if (factors.needsEmpathy || factors.isEmotionallyComplex || request.customizations?.tone === 'empathetic') {
      return { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', cost: 0.003 };
    }
    
    // Claude is more cost-effective for longer conversations
    if (factors.isLongConversation || complexity === 'complex') {
      return { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', cost: 0.003 };
    }
    
    // GPT-4o for analytical and structured therapeutic frameworks
    if (request.customizations?.mode === 'analytical' || 
        request.customizations?.perspective === 'cbt_therapist') {
      return { provider: 'openai', model: 'gpt-4o', cost: 0.0025 };
    }
    
    // GPT-4o mini for simple interactions to save costs
    if (complexity === 'simple' || factors.isSimpleQuery) {
      return { provider: 'openai', model: 'gpt-4o-mini', cost: 0.00015 };
    }
    
    // Default to Claude for general therapeutic work (better empathy, lower cost)
    return { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', cost: 0.003 };
  }

  /**
   * Analyze request to determine complexity and therapeutic needs
   */
  private analyzeRequestFactors(request: DeepJournalingRequest) {
    const userInput = request.userInput.toLowerCase();
    
    return {
      needsEmpathy: userInput.includes('feel') || userInput.includes('emotion') || 
                    userInput.includes('sad') || userInput.includes('anxious') ||
                    userInput.includes('depressed') || userInput.includes('overwhelmed'),
      
      isEmotionallyComplex: userInput.length > 200 || 
                           (userInput.match(/\b(feel|emotion|heart|soul|pain|joy|love|fear|anger)\b/g) || []).length > 2,
      
      isLongConversation: request.threadId !== undefined,
      
      isSimpleQuery: userInput.length < 50 && 
                     !userInput.includes('?') && 
                     request.actionType !== 'go_deeper',
      
      isAnalytical: request.customizations?.mode === 'analytical' ||
                    request.customizations?.perspective === 'cbt_therapist'
    };
  }

  /**
   * Call Anthropic Claude with optimized parameters
   */
  private async callAnthropicModel(model: string, systemPrompt: string, userPrompt: string) {
    try {
      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 1500,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse JSON response
      let parsedContent;
      try {
        parsedContent = JSON.parse(content.text);
      } catch {
        // If not JSON, wrap in expected format
        parsedContent = {
          analysis: { professionalAnalysis: content.text.substring(0, 200) },
          question: this.extractQuestionFromText(content.text),
          emotionalState: { primaryEmotion: 'neutral', intensity: 0.5, clarity: 0.5 },
          patternInsights: {},
          emotionalAssessment: {},
          suggestions: []
        };
      }

      return {
        ...parsedContent,
        tokenCount: response.usage.input_tokens + response.usage.output_tokens,
        cost: this.calculateAnthropicCost(response.usage.input_tokens, response.usage.output_tokens, model),
        modelUsed: model,
        provider: 'anthropic'
      };

    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to generate therapeutic response with Claude');
    }
  }

  /**
   * Call OpenAI with optimized parameters
   */
  private async callOpenAIModel(model: string, systemPrompt: string, userPrompt: string) {
    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: model === 'gpt-4o-mini' ? 800 : 1500
      });

      const content = response.choices[0].message.content || '{}';
      const parsedContent = JSON.parse(content);

      return {
        ...parsedContent,
        tokenCount: response.usage?.total_tokens || 0,
        cost: this.calculateOpenAICost(response.usage?.total_tokens || 0, model),
        modelUsed: model,
        provider: 'openai'
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate therapeutic response with OpenAI');
    }
  }

  /**
   * Calculate Anthropic costs (Claude pricing)
   */
  private calculateAnthropicCost(inputTokens: number, outputTokens: number, model: string): number {
    const pricing = {
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 }, // per 1K tokens
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
    };
    
    const rates = pricing[model as keyof typeof pricing] || pricing['claude-3-5-sonnet-20241022'];
    return (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
  }

  /**
   * Calculate OpenAI costs
   */
  private calculateOpenAICost(totalTokens: number, model: string): number {
    const pricing = {
      'gpt-4o': { rate: 0.005 }, // average of input/output
      'gpt-4o-mini': { rate: 0.0003 }
    };
    
    const rate = pricing[model as keyof typeof pricing]?.rate || 0.005;
    return (totalTokens / 1000) * rate;
  }

  /**
   * Extract a question from free-form text response
   */
  private extractQuestionFromText(text: string): string {
    const sentences = text.split(/[.!?]+/);
    const question = sentences.find(s => s.trim().includes('?'));
    
    if (question) {
      return question.trim() + '?';
    }
    
    // Generate a therapeutic question if none found
    return "What feelings or thoughts does this bring up for you?";
  }

  /**
   * Get cost analysis and recommendations
   */
  getCostAnalysis(requestHistory: any[]) {
    const modelUsage = requestHistory.reduce((acc, req) => {
      const provider = req.provider || 'openai';
      acc[provider] = (acc[provider] || 0) + (req.cost || 0);
      return acc;
    }, {});

    const totalCost = Object.values(modelUsage).reduce((sum: number, cost: any) => sum + cost, 0);
    
    return {
      totalCost,
      modelBreakdown: modelUsage,
      averageCostPerInteraction: totalCost / requestHistory.length,
      recommendations: this.generateCostOptimizationRecommendations(modelUsage, requestHistory)
    };
  }

  /**
   * Generate cost optimization recommendations
   */
  private generateCostOptimizationRecommendations(modelUsage: any, history: any[]) {
    const recommendations = [];
    
    if (modelUsage.openai > modelUsage.anthropic * 2) {
      recommendations.push("Consider using Claude for more empathetic therapeutic conversations - it's more cost-effective");
    }
    
    if (history.some(req => req.modelUsed === 'gpt-4o' && req.userInput?.length < 50)) {
      recommendations.push("Use GPT-4o mini for shorter, simpler interactions to reduce costs");
    }
    
    if (history.length > 10 && !history.some(req => req.provider === 'anthropic')) {
      recommendations.push("Try Claude for nuanced emotional support - often provides better therapeutic value per dollar");
    }
    
    return recommendations;
  }
}

export const intelligentModelRouter = new IntelligentModelRouter();