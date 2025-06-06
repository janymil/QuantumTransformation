import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class SomaticTherapist extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "Somatic Therapist",
    description: "Expert in body-based healing and nervous system regulation",
    expertise: [
      "Body awareness cultivation",
      "Nervous system regulation",
      "Polyvagal theory application",
      "Somatic experiencing",
      "Embodiment practices",
      "Tension and trauma release",
      "Movement therapy",
      "Breathwork integration",
      "Sensory awareness",
      "Body-mind connection"
    ],
    approach: "Works with the body's innate wisdom to process emotions and trauma through somatic awareness",
    applications: [
      "Trauma recovery",
      "Anxiety and stress",
      "Chronic pain",
      "Depression",
      "Emotional regulation",
      "Body dysmorphia",
      "Eating disorders",
      "Sleep disorders",
      "Relationship issues",
      "Performance enhancement"
    ],
    assessmentMethods: [
      "Body scan assessment",
      "Nervous system state evaluation",
      "Movement pattern analysis",
      "Breathing pattern observation",
      "Tension mapping",
      "Embodiment capacity assessment"
    ],
    interventions: [
      "Body awareness exercises",
      "Nervous system regulation techniques",
      "Somatic resourcing",
      "Movement and dance therapy",
      "Breathing pattern correction",
      "Progressive muscle release"
    ],
    contraindications: [
      "Severe body dysmorphia",
      "Active eating disorder crisis",
      "Recent physical trauma"
    ],
    integration: [
      "Enhances all therapeutic modalities",
      "Provides grounding for cognitive work",
      "Supports trauma processing"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const bodyAwareness = this.assessBodyAwareness(currentIssues);
    const nervousSystemState = this.evaluateNervousSystem(userProfile);
    const embodimentLevel = this.checkEmbodiment(userProfile);

    return `Somatic Assessment: ${bodyAwareness} ${nervousSystemState} ${embodimentLevel}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('tense') || userInput.includes('tight')) {
      interventions.push('Progressive muscle relaxation sequence');
      interventions.push('Tension release through movement');
      interventions.push('Body scan meditation');
    }
    
    if (userInput.includes('anxious') || userInput.includes('stressed')) {
      interventions.push('Nervous system regulation breathing');
      interventions.push('Grounding through body awareness');
      interventions.push('Vagal tone enhancement exercises');
    }
    
    if (userInput.includes('disconnected') || userInput.includes('numb')) {
      interventions.push('Gentle embodiment practices');
      interventions.push('Sensory awareness exercises');
      interventions.push('Movement for reconnection');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const somaticKeywords = [
      'body', 'physical', 'tension', 'pain', 'stress', 'anxiety',
      'numb', 'disconnected', 'embodiment', 'movement', 'breathing'
    ];
    
    return currentIssues.some(issue => 
      somaticKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Develop daily body awareness practice",
        "Learn nervous system regulation techniques",
        "Integrate movement into daily routine",
        "Practice embodied presence"
      ],
      interventions,
      riskFactors: [
        "Overwhelming body sensations without proper support",
        "Re-traumatization through forced body awareness",
        "Dissociation during somatic work"
      ],
      integrationNotes: [
        "Somatic work enhances all other therapeutic approaches",
        "Body awareness supports cognitive and emotional processing",
        "Movement practices complement meditation and mindfulness"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('trauma_therapist')) {
      guidance.push('Somatic techniques essential for trauma processing safety');
    }
    
    if (otherDisciplines.includes('meditation_instructor')) {
      guidance.push('Body awareness enhances meditation depth and stability');
    }
    
    if (otherDisciplines.includes('breathwork_facilitator')) {
      guidance.push('Somatic awareness supports conscious breathing practices');
    }

    return guidance;
  }

  private assessBodyAwareness(issues: string[]): string {
    return "Body awareness assessment indicates disconnection patterns requiring attention.";
  }

  private evaluateNervousSystem(userProfile: any): string {
    return "Nervous system evaluation shows dysregulation requiring regulation practices.";
  }

  private checkEmbodiment(userProfile: any): string {
    return "Embodiment capacity assessment reveals need for grounding and presence work.";
  }
}

export const somaticTherapist = new SomaticTherapist();