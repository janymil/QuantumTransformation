import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class NutritionalTherapist extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "Nutritional Therapist",
    description: "Expert in nutrition's impact on mental health and cognitive function",
    expertise: [
      "Nutritional psychiatry",
      "Gut-brain axis health",
      "Micronutrient therapy",
      "Blood sugar regulation",
      "Anti-inflammatory nutrition",
      "Neurotransmitter support",
      "Mood-food connections",
      "Cognitive enhancement nutrition",
      "Stress nutrition therapy",
      "Supplement protocols"
    ],
    approach: "Uses targeted nutrition strategies to support mental health and optimize brain function",
    applications: [
      "Depression and mood disorders",
      "Anxiety and stress",
      "ADHD and focus issues",
      "Brain fog",
      "Sleep disorders",
      "Chronic fatigue",
      "Digestive issues affecting mood",
      "Inflammation-related mental symptoms",
      "Neurodevelopmental support",
      "Cognitive decline prevention"
    ],
    assessmentMethods: [
      "Nutritional status evaluation",
      "Dietary pattern analysis",
      "Micronutrient deficiency screening",
      "Gut health assessment",
      "Food sensitivity identification",
      "Metabolic function evaluation"
    ],
    interventions: [
      "Personalized nutrition plans",
      "Targeted supplement protocols",
      "Anti-inflammatory meal planning",
      "Blood sugar stabilization",
      "Gut healing protocols",
      "Neurotransmitter support nutrition"
    ],
    contraindications: [
      "Active eating disorders",
      "Severe medical conditions requiring medical nutrition therapy",
      "Medication interactions"
    ],
    integration: [
      "Supports all therapeutic modalities",
      "Enhances medication effectiveness",
      "Provides biological foundation for mental health"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const nutritionalStatus = this.assessNutritionalStatus(currentIssues);
    const gutHealth = this.evaluateGutHealth(userProfile);
    const metabolicFunction = this.checkMetabolicFunction(userProfile);

    return `Nutritional Assessment: ${nutritionalStatus} ${gutHealth} ${metabolicFunction}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('mood') || userInput.includes('depression')) {
      interventions.push('Omega-3 rich foods and supplements');
      interventions.push('B-complex vitamin protocol');
      interventions.push('Anti-inflammatory meal plan');
    }
    
    if (userInput.includes('anxiety') || userInput.includes('stress')) {
      interventions.push('Magnesium supplementation');
      interventions.push('Blood sugar stabilization diet');
      interventions.push('L-theanine and GABA support');
    }
    
    if (userInput.includes('focus') || userInput.includes('brain fog')) {
      interventions.push('Brain-boosting nutrition protocol');
      interventions.push('Cognitive enhancement supplements');
      interventions.push('Elimination of inflammatory foods');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const nutritionKeywords = [
      'nutrition', 'diet', 'food', 'energy', 'fatigue', 'mood',
      'brain fog', 'digestion', 'inflammation', 'supplements'
    ];
    
    return currentIssues.some(issue => 
      nutritionKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Optimize nutrition for mental health support",
        "Address micronutrient deficiencies",
        "Support gut-brain axis health",
        "Implement anti-inflammatory eating patterns"
      ],
      interventions,
      riskFactors: [
        "Nutrient-medication interactions",
        "Underlying eating disorder patterns",
        "Extreme dietary restrictions"
      ],
      integrationNotes: [
        "Nutrition provides biological foundation for all therapies",
        "Brain health supports cognitive and emotional work",
        "Gut health affects neurotransmitter production"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('sleep_therapist')) {
      guidance.push('Nutrition timing affects sleep quality and circadian rhythms');
    }
    
    if (otherDisciplines.includes('cbt_therapist')) {
      guidance.push('Stable blood sugar supports cognitive function and mood stability');
    }
    
    if (otherDisciplines.includes('trauma_therapist')) {
      guidance.push('Nutritional support enhances nervous system resilience');
    }

    return guidance;
  }

  private assessNutritionalStatus(issues: string[]): string {
    return "Nutritional status indicates potential deficiencies affecting mental health.";
  }

  private evaluateGutHealth(userProfile: any): string {
    return "Gut health evaluation shows need for microbiome support and healing.";
  }

  private checkMetabolicFunction(userProfile: any): string {
    return "Metabolic function assessment indicates blood sugar instability affecting mood.";
  }
}

export const nutritionalTherapist = new NutritionalTherapist();