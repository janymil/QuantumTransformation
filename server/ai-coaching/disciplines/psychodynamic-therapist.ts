import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class PsychodynamicTherapist extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "Psychodynamic Therapist",
    description: "Expert in unconscious patterns, defense mechanisms, and relational dynamics",
    expertise: [
      "Unconscious pattern analysis",
      "Defense mechanism identification",
      "Transference and countertransference",
      "Attachment theory application",
      "Object relations therapy",
      "Psychoanalytic interpretation",
      "Dream analysis",
      "Free association techniques",
      "Resistance analysis",
      "Character structure assessment"
    ],
    approach: "Explores unconscious motivations and early relationship patterns to create lasting psychological change",
    applications: [
      "Relationship difficulties",
      "Recurring life patterns",
      "Personality disorders",
      "Depression with underlying dynamics",
      "Identity issues",
      "Attachment problems",
      "Self-sabotage patterns",
      "Emotional dysregulation",
      "Career and life transitions",
      "Family of origin issues"
    ],
    assessmentMethods: [
      "Psychodynamic formulation",
      "Defense mechanism assessment",
      "Attachment pattern evaluation",
      "Transference pattern analysis",
      "Character structure assessment",
      "Unconscious conflict identification"
    ],
    interventions: [
      "Interpretation of unconscious patterns",
      "Transference exploration",
      "Defense mechanism analysis",
      "Attachment pattern work",
      "Dream exploration",
      "Free association exercises"
    ],
    contraindications: [
      "Active psychosis",
      "Severe borderline personality during crisis",
      "Active substance abuse"
    ],
    integration: [
      "Provides depth understanding for other approaches",
      "Enhances insight-oriented work",
      "Complements cognitive and somatic therapies"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const unconsciousPatterns = this.analyzeUnconscious(currentIssues);
    const defenseStructure = this.assessDefenses(userProfile);
    const attachmentStyle = this.evaluateAttachment(userProfile);

    return `Psychodynamic Assessment: ${unconsciousPatterns} ${defenseStructure} ${attachmentStyle}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('pattern') || userInput.includes('always')) {
      interventions.push('Explore recurring relationship patterns');
      interventions.push('Identify unconscious repetition compulsions');
      interventions.push('Connect current patterns to early experiences');
    }
    
    if (userInput.includes('relationship') || userInput.includes('partner')) {
      interventions.push('Analyze transference in relationships');
      interventions.push('Explore attachment dynamics');
      interventions.push('Examine projection mechanisms');
    }
    
    if (userInput.includes('dream') || userInput.includes('fantasy')) {
      interventions.push('Dream analysis and interpretation');
      interventions.push('Explore symbolic meanings');
      interventions.push('Connect unconscious material to conscious experience');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const psychodynamicKeywords = [
      'pattern', 'relationship', 'recurring', 'unconscious', 'defense',
      'attachment', 'childhood', 'family', 'identity', 'personality'
    ];
    
    return currentIssues.some(issue => 
      psychodynamicKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Explore unconscious patterns and motivations",
        "Examine early relationship dynamics",
        "Work through transference patterns",
        "Integrate insight with emotional experience"
      ],
      interventions,
      riskFactors: [
        "Overwhelming unconscious material without proper support",
        "Resistance to insight and self-examination",
        "Regression during exploratory work"
      ],
      integrationNotes: [
        "Provides depth and insight for cognitive work",
        "Enhances understanding of somatic responses",
        "Supports trauma work through developmental lens"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('cbt_therapist')) {
      guidance.push('Psychodynamic insights inform cognitive pattern recognition');
    }
    
    if (otherDisciplines.includes('trauma_therapist')) {
      guidance.push('Developmental trauma requires psychodynamic understanding');
    }
    
    if (otherDisciplines.includes('somatic_therapist')) {
      guidance.push('Body responses reflect unconscious dynamics and defenses');
    }

    return guidance;
  }

  private analyzeUnconscious(issues: string[]): string {
    return "Unconscious patterns reveal repetition compulsions and unresolved conflicts.";
  }

  private assessDefenses(userProfile: any): string {
    return "Defense structure shows adaptive and maladaptive coping mechanisms.";
  }

  private evaluateAttachment(userProfile: any): string {
    return "Attachment assessment indicates early relational patterns affecting current relationships.";
  }
}

export const psychodynamicTherapist = new PsychodynamicTherapist();