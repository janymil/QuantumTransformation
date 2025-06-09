import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class BreathworkFacilitator extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "Breathwork Facilitator",
    description: "Expert in conscious breathing techniques and respiratory healing",
    expertise: [
      "Holotropic breathwork",
      "Pranayama techniques",
      "Transformational breathing",
      "Rebirthing breathwork",
      "Coherent breathing",
      "Box breathing methods",
      "Wim Hof method",
      "Breath awareness meditation",
      "Respiratory trauma release",
      "Nervous system regulation"
    ],
    approach: "Uses conscious breathing patterns to access altered states and facilitate healing",
    applications: [
      "Trauma release",
      "Anxiety management",
      "Stress reduction",
      "Emotional regulation",
      "Energy enhancement",
      "Spiritual exploration",
      "Pain management",
      "Depression support",
      "Addiction recovery",
      "Performance optimization"
    ],
    assessmentMethods: [
      "Breathing pattern analysis",
      "Respiratory capacity evaluation",
      "Nervous system assessment",
      "Breath awareness measurement",
      "Emotional breath connection",
      "Trauma response evaluation"
    ],
    interventions: [
      "Daily breathing practice",
      "Therapeutic breathwork sessions",
      "Nervous system regulation breathing",
      "Emotional release breathing",
      "Energy cultivation techniques",
      "Breath-based meditation"
    ],
    contraindications: [
      "Severe cardiovascular disease",
      "Respiratory disorders",
      "Pregnancy complications",
      "Severe mental health crisis"
    ],
    integration: [
      "Enhances all therapeutic modalities",
      "Supports somatic and trauma work",
      "Complements meditation practice"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const breathingPatterns = this.assessBreathingPatterns(currentIssues);
    const nervousSystemState = this.evaluateNervousSystem(userProfile);
    const breathworkReadiness = this.checkReadiness(userProfile);

    return `Breathwork Assessment: ${breathingPatterns} ${nervousSystemState} ${breathworkReadiness}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('anxious') || userInput.includes('panic')) {
      interventions.push('4-7-8 breathing for anxiety relief');
      interventions.push('Coherent breathing at 5 breaths per minute');
      interventions.push('Box breathing for nervous system regulation');
    }
    
    if (userInput.includes('trauma') || userInput.includes('release')) {
      interventions.push('Gentle connected breathing session');
      interventions.push('Breath awareness for trauma integration');
      interventions.push('Somatic breathwork for release');
    }
    
    if (userInput.includes('energy') || userInput.includes('vitality')) {
      interventions.push('Energizing breath techniques');
      interventions.push('Wim Hof breathing method');
      interventions.push('Pranayama for vitality enhancement');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const breathworkKeywords = [
      'breathing', 'breath', 'anxiety', 'stress', 'trauma', 'energy',
      'panic', 'tension', 'regulation', 'nervous system'
    ];
    
    return currentIssues.some(issue => 
      breathworkKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Establish daily conscious breathing practice",
        "Learn nervous system regulation techniques",
        "Practice breath awareness throughout the day",
        "Explore therapeutic breathwork sessions"
      ],
      interventions,
      riskFactors: [
        "Overwhelming emotional releases during sessions",
        "Hyperventilation in sensitive individuals",
        "Contraindications with certain medical conditions"
      ],
      integrationNotes: [
        "Breathing work enhances all therapeutic approaches",
        "Provides direct nervous system regulation",
        "Supports somatic and trauma healing"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('trauma_therapist')) {
      guidance.push('Breathwork supports trauma processing and nervous system regulation');
    }
    
    if (otherDisciplines.includes('meditation_instructor')) {
      guidance.push('Conscious breathing enhances meditation depth and stability');
    }
    
    if (otherDisciplines.includes('somatic_therapist')) {
      guidance.push('Breath awareness supports body-based healing work');
    }

    return guidance;
  }

  private assessBreathingPatterns(issues: string[]): string {
    return "Breathing pattern analysis indicates shallow, restricted breathing requiring attention.";
  }

  private evaluateNervousSystem(userProfile: any): string {
    return "Nervous system evaluation shows dysregulation benefiting from breath regulation.";
  }

  private checkReadiness(userProfile: any): string {
    return "Breathwork readiness assessment indicates good capacity for conscious breathing work.";
  }
}

export const breathworkFacilitator = new BreathworkFacilitator();