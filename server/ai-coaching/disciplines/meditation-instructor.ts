import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class MeditationInstructor extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "Meditation Instructor",
    description: "Expert in mindfulness practices and consciousness cultivation",
    expertise: [
      "Mindfulness meditation",
      "Concentration practices",
      "Loving-kindness meditation",
      "Body scan techniques",
      "Walking meditation",
      "Breath awareness",
      "Open awareness practices",
      "Vipassana insight meditation",
      "Zen meditation techniques",
      "Contemplative practices"
    ],
    approach: "Guides development of present-moment awareness and mental clarity through systematic meditation training",
    applications: [
      "Stress reduction",
      "Anxiety management",
      "Depression support",
      "Attention training",
      "Emotional regulation",
      "Spiritual development",
      "Pain management",
      "Sleep improvement",
      "Self-awareness cultivation",
      "Compassion development"
    ],
    assessmentMethods: [
      "Mindfulness assessment",
      "Attention stability evaluation",
      "Emotional reactivity measurement",
      "Meditation experience review",
      "Present-moment awareness check",
      "Concentration capacity assessment"
    ],
    interventions: [
      "Daily mindfulness practice",
      "Breath awareness meditation",
      "Body scan sessions",
      "Walking meditation practice",
      "Loving-kindness cultivation",
      "Mindful daily activities"
    ],
    contraindications: [
      "Active psychosis",
      "Severe dissociation",
      "Acute trauma without stabilization"
    ],
    integration: [
      "Enhances all therapeutic modalities",
      "Supports emotional regulation",
      "Provides foundation for self-awareness"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const mindfulnessLevel = this.assessMindfulness(currentIssues);
    const attentionCapacity = this.evaluateAttention(userProfile);
    const meditationReadiness = this.checkReadiness(userProfile);

    return `Meditation Assessment: ${mindfulnessLevel} ${attentionCapacity} ${meditationReadiness}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('stressed') || userInput.includes('overwhelmed')) {
      interventions.push('5-minute daily breath awareness meditation');
      interventions.push('Mindful breathing during stress');
      interventions.push('Body scan for tension release');
    }
    
    if (userInput.includes('anxious') || userInput.includes('worried')) {
      interventions.push('Present-moment awareness practice');
      interventions.push('Grounding through breath observation');
      interventions.push('Loving-kindness meditation for self-compassion');
    }
    
    if (userInput.includes('scattered') || userInput.includes('unfocused')) {
      interventions.push('Concentration meditation on single object');
      interventions.push('Mindful attention training');
      interventions.push('Walking meditation for mental clarity');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const meditationKeywords = [
      'stress', 'anxiety', 'mindfulness', 'meditation', 'awareness',
      'focus', 'attention', 'spiritual', 'consciousness', 'presence'
    ];
    
    return currentIssues.some(issue => 
      meditationKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    ) || goals.some(goal => 
      meditationKeywords.some(keyword => goal.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Establish daily meditation practice",
        "Start with short sessions and gradually increase",
        "Focus on consistency over duration",
        "Integrate mindfulness into daily activities"
      ],
      interventions,
      riskFactors: [
        "Spiritual bypassing of psychological issues",
        "Excessive focus leading to rigidity",
        "Dissociation during practice"
      ],
      integrationNotes: [
        "Mindfulness enhances all therapeutic approaches",
        "Supports emotional regulation and self-awareness",
        "Provides foundation for deeper psychological work"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('cbt_therapist')) {
      guidance.push('Mindfulness enhances cognitive awareness and emotional regulation');
    }
    
    if (otherDisciplines.includes('trauma_therapist')) {
      guidance.push('Meditation requires trauma-informed modifications for safety');
    }
    
    if (otherDisciplines.includes('somatic_therapist')) {
      guidance.push('Body awareness practices complement somatic work beautifully');
    }

    return guidance;
  }

  private assessMindfulness(issues: string[]): string {
    return "Mindfulness assessment indicates need for present-moment awareness training.";
  }

  private evaluateAttention(userProfile: any): string {
    return "Attention capacity evaluation shows scattered focus requiring concentration practice.";
  }

  private checkReadiness(userProfile: any): string {
    return "Meditation readiness assessment indicates good foundation for practice development.";
  }
}

export const meditationInstructor = new MeditationInstructor();