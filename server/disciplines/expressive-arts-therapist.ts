import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class ExpressiveArtsTherapist extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "Expressive Arts Therapist",
    description: "Expert in creative expression for healing and self-discovery",
    expertise: [
      "Art therapy techniques",
      "Music therapy",
      "Creative writing therapy",
      "Drama therapy",
      "Sand tray therapy",
      "Collage and visual arts",
      "Poetry therapy",
      "Storytelling for healing",
      "Creative journaling",
      "Multi-modal arts integration"
    ],
    approach: "Uses creative expression to access unconscious material and facilitate emotional processing",
    applications: [
      "Trauma recovery",
      "Grief and loss",
      "Depression and anxiety",
      "Self-esteem issues",
      "Communication difficulties",
      "Identity exploration",
      "Emotional regulation",
      "Stress management",
      "Relationship issues",
      "Life transitions"
    ],
    assessmentMethods: [
      "Creative expression assessment",
      "Artistic preference evaluation",
      "Symbolic expression analysis",
      "Creative blocks identification",
      "Emotional expression capacity",
      "Therapeutic readiness for arts"
    ],
    interventions: [
      "Guided art creation sessions",
      "Therapeutic writing exercises",
      "Music-based emotional expression",
      "Drama therapy role-play",
      "Visual journaling practice",
      "Creative storytelling work"
    ],
    contraindications: [
      "Severe perfectionism blocking creativity",
      "Active psychosis with reality distortion",
      "Extreme resistance to creative expression"
    ],
    integration: [
      "Enhances all therapeutic modalities",
      "Provides non-verbal processing outlet",
      "Supports insight and integration work"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const creativeCapacity = this.assessCreativeCapacity(currentIssues);
    const expressionNeeds = this.evaluateExpressionNeeds(userProfile);
    const therapeuticReadiness = this.checkTherapeuticReadiness(userProfile);

    return `Expressive Arts Assessment: ${creativeCapacity} ${expressionNeeds} ${therapeuticReadiness}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('creative') || userInput.includes('expression')) {
      interventions.push('Free-form artistic expression session');
      interventions.push('Creative journaling practice');
      interventions.push('Multi-modal arts exploration');
    }
    
    if (userInput.includes('trauma') || userInput.includes('difficult')) {
      interventions.push('Safe container art therapy');
      interventions.push('Symbolic expression through sand tray');
      interventions.push('Narrative therapy through storytelling');
    }
    
    if (userInput.includes('blocked') || userInput.includes('stuck')) {
      interventions.push('Creative breakthrough exercises');
      interventions.push('Stream-of-consciousness writing');
      interventions.push('Intuitive art making');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const artsKeywords = [
      'creative', 'expression', 'art', 'writing', 'music', 'blocked',
      'communication', 'emotions', 'storytelling', 'visual'
    ];
    
    return currentIssues.some(issue => 
      artsKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    ) || goals.some(goal => 
      artsKeywords.some(keyword => goal.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Explore creative expression as healing tool",
        "Develop regular artistic practice",
        "Use arts for emotional processing",
        "Integrate multiple creative modalities"
      ],
      interventions,
      riskFactors: [
        "Perfectionism blocking creative expression",
        "Overwhelming emotional material in artwork",
        "Creative blocks causing frustration"
      ],
      integrationNotes: [
        "Arts expression enhances all therapeutic work",
        "Provides non-verbal processing pathway",
        "Supports insight development and integration"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('trauma_therapist')) {
      guidance.push('Creative expression provides safe trauma processing outlet');
    }
    
    if (otherDisciplines.includes('movement_therapist')) {
      guidance.push('Movement and arts therapies enhance each other beautifully');
    }
    
    if (otherDisciplines.includes('psychodynamic_therapist')) {
      guidance.push('Art can reveal unconscious material and symbolic meanings');
    }

    return guidance;
  }

  private assessCreativeCapacity(issues: string[]): string {
    return "Creative capacity assessment shows potential for artistic expression healing.";
  }

  private evaluateExpressionNeeds(userProfile: any): string {
    return "Expression needs evaluation indicates benefit from non-verbal processing.";
  }

  private checkTherapeuticReadiness(userProfile: any): string {
    return "Therapeutic readiness assessment shows openness to creative exploration.";
  }
}

export const expressiveArtsTherapist = new ExpressiveArtsTherapist();