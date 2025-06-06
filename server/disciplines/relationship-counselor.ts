import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class RelationshipCounselor extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "Relationship Counselor",
    description: "Expert in interpersonal dynamics and relationship healing",
    expertise: [
      "Attachment theory application",
      "Communication skills training",
      "Conflict resolution",
      "Emotional intimacy building",
      "Boundary setting",
      "Trust rebuilding",
      "Relationship patterns analysis",
      "Family systems work",
      "Couples therapy techniques",
      "Interpersonal effectiveness"
    ],
    approach: "Works with relationship dynamics to improve communication and deepen connection",
    applications: [
      "Romantic relationship issues",
      "Family conflicts",
      "Friendship difficulties",
      "Workplace relationships",
      "Communication problems",
      "Trust issues",
      "Attachment difficulties",
      "Boundary violations",
      "Codependency patterns",
      "Social anxiety"
    ],
    assessmentMethods: [
      "Relationship pattern analysis",
      "Attachment style assessment",
      "Communication style evaluation",
      "Conflict pattern identification",
      "Boundary assessment",
      "Intimacy capacity evaluation"
    ],
    interventions: [
      "Communication skills practice",
      "Conflict resolution training",
      "Boundary setting exercises",
      "Attachment repair work",
      "Intimacy building activities",
      "Relationship visioning"
    ],
    contraindications: [
      "Active domestic violence",
      "Severe personality disorders in crisis",
      "Active substance abuse affecting relationships"
    ],
    integration: [
      "Enhances individual therapy outcomes",
      "Supports trauma and attachment work",
      "Complements family therapy approaches"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const relationshipPatterns = this.assessRelationshipPatterns(currentIssues);
    const attachmentStyle = this.evaluateAttachmentStyle(userProfile);
    const communicationSkills = this.checkCommunicationSkills(userProfile);

    return `Relationship Assessment: ${relationshipPatterns} ${attachmentStyle} ${communicationSkills}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('communication') || userInput.includes('argue')) {
      interventions.push('Active listening skill development');
      interventions.push('I-statement communication practice');
      interventions.push('Conflict de-escalation techniques');
    }
    
    if (userInput.includes('trust') || userInput.includes('betrayal')) {
      interventions.push('Trust rebuilding exercises');
      interventions.push('Transparency and accountability practices');
      interventions.push('Emotional safety creation');
    }
    
    if (userInput.includes('boundary') || userInput.includes('codependent')) {
      interventions.push('Healthy boundary setting practice');
      interventions.push('Codependency pattern interruption');
      interventions.push('Individual identity strengthening');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const relationshipKeywords = [
      'relationship', 'partner', 'family', 'communication', 'conflict',
      'trust', 'boundary', 'intimacy', 'attachment', 'social'
    ];
    
    return currentIssues.some(issue => 
      relationshipKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Develop healthy communication patterns",
        "Strengthen attachment security",
        "Practice setting clear boundaries",
        "Build emotional intimacy skills"
      ],
      interventions,
      riskFactors: [
        "Enabling unhealthy relationship dynamics",
        "Boundary violations during vulnerable work",
        "Triggering of attachment trauma"
      ],
      integrationNotes: [
        "Relationship work enhances individual therapy",
        "Attachment healing supports trauma recovery",
        "Communication skills benefit all life areas"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('trauma_therapist')) {
      guidance.push('Attachment trauma affects all relationship patterns');
    }
    
    if (otherDisciplines.includes('psychodynamic_therapist')) {
      guidance.push('Early relationship patterns influence current dynamics');
    }
    
    if (otherDisciplines.includes('cbt_therapist')) {
      guidance.push('Cognitive patterns affect relationship interpretation');
    }

    return guidance;
  }

  private assessRelationshipPatterns(issues: string[]): string {
    return "Relationship pattern analysis reveals recurring conflict and communication difficulties.";
  }

  private evaluateAttachmentStyle(userProfile: any): string {
    return "Attachment style evaluation indicates insecure patterns affecting relationships.";
  }

  private checkCommunicationSkills(userProfile: any): string {
    return "Communication skills assessment shows need for assertiveness and listening training.";
  }
}

export const relationshipCounselor = new RelationshipCounselor();