import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class TraumaTherapist extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "Trauma Therapist",
    description: "Specialist in trauma-informed care and PTSD treatment methodologies",
    expertise: [
      "EMDR therapy",
      "Somatic experiencing",
      "Trauma-informed care principles",
      "Complex PTSD treatment",
      "Attachment trauma",
      "Developmental trauma",
      "Dissociation treatment",
      "Window of tolerance work",
      "Nervous system regulation",
      "Trauma narrative processing"
    ],
    approach: "Uses trauma-informed, body-aware approaches to process and integrate traumatic experiences safely",
    applications: [
      "PTSD and complex PTSD",
      "Childhood trauma",
      "Sexual assault recovery",
      "Combat trauma",
      "Accident trauma",
      "Medical trauma",
      "Attachment disorders",
      "Dissociative disorders",
      "Trauma-related depression",
      "Anxiety from trauma"
    ],
    assessmentMethods: [
      "Trauma history assessment",
      "PTSD symptom evaluation",
      "Dissociation screening",
      "Attachment style assessment",
      "Window of tolerance evaluation",
      "Nervous system dysregulation indicators"
    ],
    interventions: [
      "EMDR processing sessions",
      "Somatic resourcing",
      "Grounding and stabilization",
      "Narrative exposure therapy",
      "Trauma-focused cognitive processing",
      "Body-based trauma release"
    ],
    contraindications: [
      "Active suicidal ideation",
      "Severe dissociation without stabilization",
      "Active substance abuse",
      "Psychotic episodes"
    ],
    integration: [
      "Essential foundation for complex cases",
      "Enhances effectiveness of other modalities",
      "Requires careful pacing with other interventions"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const traumaIndicators = this.assessTraumaIndicators(currentIssues);
    const stabilityLevel = this.evaluateStabilization(userProfile);
    const resourceLevel = this.assessResources(userProfile);

    return `Trauma Assessment: ${traumaIndicators} ${stabilityLevel} ${resourceLevel}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('triggered') || userInput.includes('flashback')) {
      interventions.push('Grounding techniques (5-4-3-2-1 sensory)');
      interventions.push('Safe space visualization');
      interventions.push('Bilateral stimulation exercises');
    }
    
    if (userInput.includes('numb') || userInput.includes('disconnected')) {
      interventions.push('Gentle body awareness exercises');
      interventions.push('Somatic resourcing techniques');
      interventions.push('Window of tolerance expansion');
    }
    
    if (userInput.includes('hypervigilant') || userInput.includes('on edge')) {
      interventions.push('Nervous system regulation breathing');
      interventions.push('Progressive muscle relaxation');
      interventions.push('Safe attachment visualization');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const traumaKeywords = [
      'trauma', 'ptsd', 'flashback', 'triggered', 'abuse', 'assault',
      'accident', 'hypervigilant', 'dissociation', 'numb', 'disconnected'
    ];
    
    return currentIssues.some(issue => 
      traumaKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Prioritize safety and stabilization first",
        "Build internal and external resources",
        "Process trauma at appropriate pacing",
        "Integrate somatic awareness practices"
      ],
      interventions,
      riskFactors: [
        "Re-traumatization from moving too quickly",
        "Overwhelm from processing without adequate resources",
        "Dissociation during trauma work"
      ],
      integrationNotes: [
        "Trauma work must precede other therapeutic interventions",
        "Somatic approaches enhance trauma processing",
        "Mindfulness requires trauma-informed modifications"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('somatic_therapist')) {
      guidance.push('Somatic work supports trauma processing and regulation');
    }
    
    if (otherDisciplines.includes('meditation_instructor')) {
      guidance.push('Meditation requires trauma-informed modifications and pacing');
    }
    
    if (otherDisciplines.includes('cbt_therapist')) {
      guidance.push('CBT skills helpful after trauma stabilization phase');
    }

    return guidance;
  }

  private assessTraumaIndicators(issues: string[]): string {
    return "Trauma indicators present including hyperarousal and avoidance patterns.";
  }

  private evaluateStabilization(userProfile: any): string {
    return "Current stabilization level requires grounding and resource building.";
  }

  private assessResources(userProfile: any): string {
    return "Internal and external resources need strengthening before processing.";
  }
}

export const traumaTherapist = new TraumaTherapist();