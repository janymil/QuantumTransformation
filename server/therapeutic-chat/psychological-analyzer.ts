/**
 * Psychological Analyzer for Deep Journaling
 * Advanced psychological analysis integrated with therapeutic frameworks
 */

export interface PsychologicalProfile {
  attachmentStyle: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
  copingStrategies: string[];
  emotionalPatterns: string[];
  cognitiveStyles: string[];
  defenseMethanisms: string[];
  growthAreas: string[];
  strengths: string[];
  riskFactors: string[];
  therapeuticGoals: string[];
}

export interface EmotionalState {
  primary: string;
  secondary: string[];
  intensity: number; // 1-10
  valence: 'positive' | 'negative' | 'neutral';
  arousal: 'high' | 'medium' | 'low';
  regulation: 'adaptive' | 'maladaptive' | 'neutral';
}

export interface CognitivePattern {
  type: 'automatic_thought' | 'cognitive_distortion' | 'core_belief' | 'schema';
  content: string;
  accuracy: number; // 1-10
  helpfulness: number; // 1-10
  evidence_for: string[];
  evidence_against: string[];
  alternative_thoughts: string[];
}

export class PsychologicalAnalyzer {
  
  /**
   * Analyze emotional state from user input
   */
  analyzeEmotionalState(userInput: string, previousStates?: EmotionalState[]): EmotionalState {
    const input = userInput.toLowerCase();
    
    // Primary emotion detection
    let primary = 'neutral';
    let intensity = 5;
    let valence: 'positive' | 'negative' | 'neutral' = 'neutral';
    let arousal: 'high' | 'medium' | 'low' = 'medium';
    
    // Positive emotions
    if (input.includes('happy') || input.includes('joy') || input.includes('excited')) {
      primary = 'joy';
      valence = 'positive';
      arousal = 'high';
      intensity = 7;
    } else if (input.includes('grateful') || input.includes('thankful') || input.includes('appreciate')) {
      primary = 'gratitude';
      valence = 'positive';
      arousal = 'medium';
      intensity = 6;
    } else if (input.includes('calm') || input.includes('peaceful') || input.includes('serene')) {
      primary = 'calm';
      valence = 'positive';
      arousal = 'low';
      intensity = 6;
    }
    
    // Negative emotions
    else if (input.includes('angry') || input.includes('mad') || input.includes('furious')) {
      primary = 'anger';
      valence = 'negative';
      arousal = 'high';
      intensity = 8;
    } else if (input.includes('sad') || input.includes('depressed') || input.includes('down')) {
      primary = 'sadness';
      valence = 'negative';
      arousal = 'low';
      intensity = 7;
    } else if (input.includes('anxious') || input.includes('worried') || input.includes('nervous')) {
      primary = 'anxiety';
      valence = 'negative';
      arousal = 'high';
      intensity = 7;
    } else if (input.includes('overwhelmed') || input.includes('stressed') || input.includes('pressure')) {
      primary = 'overwhelm';
      valence = 'negative';
      arousal = 'high';
      intensity = 8;
    }
    
    // Secondary emotions
    const secondary: string[] = [];
    if (input.includes('confused')) secondary.push('confusion');
    if (input.includes('frustrated')) secondary.push('frustration');
    if (input.includes('disappointed')) secondary.push('disappointment');
    if (input.includes('hopeful')) secondary.push('hope');
    if (input.includes('proud')) secondary.push('pride');
    
    // Regulation assessment
    let regulation: 'adaptive' | 'maladaptive' | 'neutral' = 'neutral';
    if (input.includes('breathing') || input.includes('meditation') || input.includes('talk to')) {
      regulation = 'adaptive';
    } else if (input.includes('avoid') || input.includes('numb') || input.includes('distract')) {
      regulation = 'maladaptive';
    }
    
    return {
      primary,
      secondary,
      intensity,
      valence,
      arousal,
      regulation
    };
  }
  
  /**
   * Identify cognitive patterns and distortions
   */
  analyzeCognitivePatterns(userInput: string): CognitivePattern[] {
    const patterns: CognitivePattern[] = [];
    const input = userInput.toLowerCase();
    
    // All-or-nothing thinking
    if (input.includes('always') || input.includes('never') || input.includes('everything') || input.includes('nothing')) {
      patterns.push({
        type: 'cognitive_distortion',
        content: 'All-or-nothing thinking detected',
        accuracy: 3,
        helpfulness: 2,
        evidence_for: ['Extreme language used'],
        evidence_against: ['Most situations exist on a spectrum'],
        alternative_thoughts: ['Sometimes things happen this way, but not always', 'There are degrees and middle ground']
      });
    }
    
    // Catastrophizing
    if (input.includes('disaster') || input.includes('terrible') || input.includes('worst') || input.includes('ruined')) {
      patterns.push({
        type: 'cognitive_distortion',
        content: 'Catastrophizing detected',
        accuracy: 4,
        helpfulness: 2,
        evidence_for: ['Strong negative language'],
        evidence_against: ['Most feared outcomes don\'t occur', 'There are usually solutions'],
        alternative_thoughts: ['This is challenging but manageable', 'I can handle difficult situations']
      });
    }
    
    // Mind reading
    if (input.includes('they think') || input.includes('they must') || input.includes('obviously they')) {
      patterns.push({
        type: 'cognitive_distortion',
        content: 'Mind reading detected',
        accuracy: 3,
        helpfulness: 2,
        evidence_for: ['Assumptions about others\' thoughts'],
        evidence_against: ['Cannot know others\' thoughts without asking', 'People often think differently than we assume'],
        alternative_thoughts: ['I don\'t know what they\'re thinking', 'I could ask them directly']
      });
    }
    
    // Personalization
    if (input.includes('my fault') || input.includes('because of me') || input.includes('i caused')) {
      patterns.push({
        type: 'cognitive_distortion',
        content: 'Personalization detected',
        accuracy: 4,
        helpfulness: 3,
        evidence_for: ['Taking responsibility for external events'],
        evidence_against: ['Many factors influence outcomes', 'Others have agency in their choices'],
        alternative_thoughts: ['Multiple factors contributed to this', 'I\'m responsible for my part only']
      });
    }
    
    // Should statements
    if (input.includes('should') || input.includes('must') || input.includes('have to') || input.includes('need to')) {
      patterns.push({
        type: 'cognitive_distortion',
        content: 'Should statements detected',
        accuracy: 5,
        helpfulness: 4,
        evidence_for: ['Rigid expectations present'],
        evidence_against: ['Flexibility often leads to better outcomes', 'Preferences vs requirements'],
        alternative_thoughts: ['I would prefer to...', 'It would be nice if...', 'I choose to...']
      });
    }
    
    return patterns;
  }
  
  /**
   * Assess coping strategies from user input
   */
  assessCopingStrategies(userInput: string): {
    adaptive: string[];
    maladaptive: string[];
    suggestions: string[];
  } {
    const input = userInput.toLowerCase();
    const adaptive: string[] = [];
    const maladaptive: string[] = [];
    const suggestions: string[] = [];
    
    // Adaptive strategies
    if (input.includes('talk') || input.includes('friend') || input.includes('family')) {
      adaptive.push('Social support seeking');
    }
    if (input.includes('exercise') || input.includes('walk') || input.includes('run')) {
      adaptive.push('Physical activity');
    }
    if (input.includes('breathe') || input.includes('meditation') || input.includes('mindful')) {
      adaptive.push('Mindfulness practices');
    }
    if (input.includes('journal') || input.includes('write') || input.includes('express')) {
      adaptive.push('Expressive writing');
    }
    if (input.includes('plan') || input.includes('organize') || input.includes('structure')) {
      adaptive.push('Problem-solving');
    }
    
    // Maladaptive strategies
    if (input.includes('avoid') || input.includes('ignore') || input.includes('pretend')) {
      maladaptive.push('Avoidance');
      suggestions.push('Consider gradually facing the situation with support');
    }
    if (input.includes('drink') || input.includes('alcohol') || input.includes('substance')) {
      maladaptive.push('Substance use');
      suggestions.push('Explore healthier ways to manage difficult feelings');
    }
    if (input.includes('isolate') || input.includes('alone') || input.includes('withdraw')) {
      maladaptive.push('Social withdrawal');
      suggestions.push('Reach out to someone you trust');
    }
    if (input.includes('overthink') || input.includes('ruminate') || input.includes('obsess')) {
      maladaptive.push('Rumination');
      suggestions.push('Practice mindfulness to interrupt thought loops');
    }
    
    // Generate suggestions if no adaptive strategies found
    if (adaptive.length === 0) {
      suggestions.push(
        'Try deep breathing exercises',
        'Consider talking to someone you trust',
        'Engage in gentle physical movement',
        'Practice self-compassion'
      );
    }
    
    return { adaptive, maladaptive, suggestions };
  }
  
  /**
   * Generate psychological insights based on analysis
   */
  generateInsights(
    emotionalState: EmotionalState,
    cognitivePatterns: CognitivePattern[],
    copingStrategies: { adaptive: string[]; maladaptive: string[]; suggestions: string[] }
  ): {
    keyInsights: string[];
    therapeuticFocus: string[];
    recommendations: string[];
    riskFactors: string[];
  } {
    const keyInsights: string[] = [];
    const therapeuticFocus: string[] = [];
    const recommendations: string[] = [];
    const riskFactors: string[] = [];
    
    // Emotional insights
    if (emotionalState.intensity > 7) {
      keyInsights.push(`High emotional intensity (${emotionalState.intensity}/10) suggests significant distress`);
      therapeuticFocus.push('Emotion regulation skills');
      recommendations.push('Practice grounding techniques when emotions feel overwhelming');
    }
    
    if (emotionalState.regulation === 'maladaptive') {
      keyInsights.push('Current coping strategies may not be serving you well');
      therapeuticFocus.push('Adaptive coping strategy development');
      riskFactors.push('Maladaptive emotion regulation');
    }
    
    // Cognitive insights
    if (cognitivePatterns.length > 2) {
      keyInsights.push(`Multiple cognitive patterns identified (${cognitivePatterns.length})`);
      therapeuticFocus.push('Cognitive restructuring');
      recommendations.push('Challenge negative thought patterns with evidence-based questioning');
    }
    
    // Coping insights
    if (copingStrategies.adaptive.length === 0) {
      keyInsights.push('Limited adaptive coping strategies identified');
      therapeuticFocus.push('Coping skills development');
      riskFactors.push('Insufficient coping resources');
    }
    
    if (copingStrategies.maladaptive.length > 0) {
      keyInsights.push(`Maladaptive coping patterns: ${copingStrategies.maladaptive.join(', ')}`);
      therapeuticFocus.push('Replacing maladaptive behaviors');
      riskFactors.push('Maladaptive coping behaviors');
    }
    
    // General recommendations
    recommendations.push(
      'Continue regular self-reflection through journaling',
      'Practice self-compassion during difficult times',
      'Consider professional support if distress persists'
    );
    
    return {
      keyInsights,
      therapeuticFocus,
      recommendations,
      riskFactors
    };
  }
  
  /**
   * Comprehensive psychological analysis
   */
  analyzeComprehensively(userInput: string, previousAnalyses?: any[]): {
    emotionalState: EmotionalState;
    cognitivePatterns: CognitivePattern[];
    copingStrategies: { adaptive: string[]; maladaptive: string[]; suggestions: string[] };
    insights: {
      keyInsights: string[];
      therapeuticFocus: string[];
      recommendations: string[];
      riskFactors: string[];
    };
  } {
    const emotionalState = this.analyzeEmotionalState(userInput, previousAnalyses?.map(a => a.emotionalState));
    const cognitivePatterns = this.analyzeCognitivePatterns(userInput);
    const copingStrategies = this.assessCopingStrategies(userInput);
    const insights = this.generateInsights(emotionalState, cognitivePatterns, copingStrategies);
    
    return {
      emotionalState,
      cognitivePatterns,
      copingStrategies,
      insights
    };
  }
}

export const psychologicalAnalyzer = new PsychologicalAnalyzer();