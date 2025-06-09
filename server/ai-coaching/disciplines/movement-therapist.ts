import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class MovementTherapist extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "Movement Therapist",
    description: "Expert in therapeutic movement and embodied expression for healing",
    expertise: [
      "Dance movement therapy",
      "Authentic movement",
      "Expressive movement",
      "Therapeutic yoga",
      "Feldenkrais method",
      "Alexander technique",
      "5Rhythms practice",
      "Movement meditation",
      "Body-based trauma release",
      "Embodiment practices"
    ],
    approach: "Uses movement and dance to facilitate emotional expression and psychological healing",
    applications: [
      "Trauma recovery",
      "Emotional expression difficulties",
      "Body image issues",
      "Depression and anxiety",
      "Grief and loss",
      "Self-esteem building",
      "Relationship issues",
      "Creative blocks",
      "Stress management",
      "Identity exploration"
    ],
    assessmentMethods: [
      "Movement pattern analysis",
      "Body awareness assessment",
      "Emotional expression evaluation",
      "Range of motion check",
      "Coordination assessment",
      "Embodiment capacity measurement"
    ],
    interventions: [
      "Guided movement sessions",
      "Expressive dance therapy",
      "Movement meditation practice",
      "Body awareness exercises",
      "Therapeutic movement sequences",
      "Group movement experiences"
    ],
    contraindications: [
      "Severe physical limitations",
      "Recent injuries",
      "Active psychosis with agitation"
    ],
    integration: [
      "Enhances somatic and trauma therapies",
      "Supports emotional expression work",
      "Complements body-based modalities"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const movementPatterns = this.assessMovementPatterns(currentIssues);
    const embodimentLevel = this.evaluateEmbodiment(userProfile);
    const expressionCapacity = this.checkExpression(userProfile);

    return `Movement Assessment: ${movementPatterns} ${embodimentLevel} ${expressionCapacity}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('stuck') || userInput.includes('rigid')) {
      interventions.push('Free-form movement exploration');
      interventions.push('Tension release through dance');
      interventions.push('Fluid movement practice');
    }
    
    if (userInput.includes('emotional') || userInput.includes('expression')) {
      interventions.push('Emotion-based movement sessions');
      interventions.push('Authentic movement practice');
      interventions.push('Gestural expression work');
    }
    
    if (userInput.includes('trauma') || userInput.includes('body')) {
      interventions.push('Gentle trauma-informed movement');
      interventions.push('Body boundary exploration');
      interventions.push('Grounding movement sequences');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const movementKeywords = [
      'movement', 'dance', 'body', 'expression', 'stuck', 'rigid',
      'embodiment', 'creative', 'physical', 'kinesthetic'
    ];
    
    return currentIssues.some(issue => 
      movementKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    ) || goals.some(goal => 
      movementKeywords.some(keyword => goal.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Explore movement as emotional expression",
        "Develop body awareness through movement",
        "Practice authentic movement regularly",
        "Use dance for stress relief and joy"
      ],
      interventions,
      riskFactors: [
        "Physical injury from inappropriate movement",
        "Overwhelming emotional releases",
        "Body shame or self-consciousness"
      ],
      integrationNotes: [
        "Movement enhances all body-based therapies",
        "Supports emotional expression and trauma work",
        "Provides creative outlet for psychological healing"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('somatic_therapist')) {
      guidance.push('Movement therapy enhances somatic awareness and integration');
    }
    
    if (otherDisciplines.includes('trauma_therapist')) {
      guidance.push('Gentle movement supports trauma processing and regulation');
    }
    
    if (otherDisciplines.includes('expressive_arts_therapist')) {
      guidance.push('Movement and arts therapies complement each other beautifully');
    }

    return guidance;
  }

  private assessMovementPatterns(issues: string[]): string {
    return "Movement pattern analysis reveals restrictions and compensation patterns.";
  }

  private evaluateEmbodiment(userProfile: any): string {
    return "Embodiment evaluation shows disconnection requiring movement integration.";
  }

  private checkExpression(userProfile: any): string {
    return "Expression capacity assessment indicates need for creative movement outlets.";
  }
}

export const movementTherapist = new MovementTherapist();