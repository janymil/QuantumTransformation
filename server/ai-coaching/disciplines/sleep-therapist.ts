import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class SleepTherapist extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "Sleep Therapist",
    description: "Specialist in cognitive behavioral therapy for insomnia and sleep disorders",
    expertise: [
      "CBT for insomnia (CBT-I)",
      "Sleep hygiene optimization",
      "Circadian rhythm regulation",
      "Sleep restriction therapy",
      "Stimulus control therapy",
      "Sleep anxiety management",
      "Relaxation training for sleep",
      "Sleep environment optimization",
      "Sleep diary analysis",
      "Chronotherapy techniques"
    ],
    approach: "Uses evidence-based cognitive and behavioral techniques to restore healthy sleep patterns",
    applications: [
      "Chronic insomnia",
      "Sleep onset difficulties",
      "Sleep maintenance problems",
      "Early morning awakening",
      "Sleep anxiety",
      "Shift work sleep disorder",
      "Delayed sleep phase",
      "Sleep-related worry",
      "Nighttime rumination",
      "Sleep performance anxiety"
    ],
    assessmentMethods: [
      "Sleep diary analysis",
      "Sleep efficiency calculation",
      "Circadian rhythm assessment",
      "Sleep environment evaluation",
      "Pre-sleep routine analysis",
      "Sleep-related cognition assessment"
    ],
    interventions: [
      "Sleep restriction protocols",
      "Stimulus control instructions",
      "Cognitive restructuring for sleep",
      "Relaxation training",
      "Sleep hygiene education",
      "Circadian rhythm reset"
    ],
    contraindications: [
      "Untreated sleep apnea",
      "Severe psychiatric crisis",
      "Active substance abuse affecting sleep"
    ],
    integration: [
      "Enhances mental health treatment outcomes",
      "Supports trauma recovery",
      "Improves cognitive therapy effectiveness"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const sleepPatterns = this.analyzeSleepPatterns(currentIssues);
    const sleepEfficiency = this.calculateSleepEfficiency(userProfile);
    const circadianHealth = this.assessCircadianRhythm(userProfile);

    return `Sleep Assessment: ${sleepPatterns} ${sleepEfficiency} ${circadianHealth}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('insomnia') || userInput.includes('can\'t sleep')) {
      interventions.push('Sleep restriction therapy protocol');
      interventions.push('Stimulus control instructions');
      interventions.push('Progressive muscle relaxation for sleep');
    }
    
    if (userInput.includes('worry') || userInput.includes('racing thoughts')) {
      interventions.push('Cognitive restructuring for sleep worries');
      interventions.push('Worry time scheduling');
      interventions.push('Mindfulness for nighttime rumination');
    }
    
    if (userInput.includes('tired') || userInput.includes('fatigue')) {
      interventions.push('Sleep hygiene optimization');
      interventions.push('Circadian rhythm stabilization');
      interventions.push('Sleep debt recovery plan');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const sleepKeywords = [
      'sleep', 'insomnia', 'tired', 'fatigue', 'nighttime', 'bedtime',
      'exhausted', 'restless', 'circadian', 'sleep hygiene'
    ];
    
    return currentIssues.some(issue => 
      sleepKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Implement consistent sleep-wake schedule",
        "Optimize sleep environment for quality rest",
        "Practice evidence-based sleep techniques",
        "Address sleep-related anxiety and worries"
      ],
      interventions,
      riskFactors: [
        "Underlying medical sleep disorders",
        "Medication effects on sleep",
        "Environmental factors disrupting sleep"
      ],
      integrationNotes: [
        "Quality sleep enhances all other therapeutic work",
        "Sleep restoration supports emotional regulation",
        "Circadian health affects mood and cognitive function"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('cbt_therapist')) {
      guidance.push('Sleep improvement enhances CBT effectiveness');
    }
    
    if (otherDisciplines.includes('trauma_therapist')) {
      guidance.push('Sleep stabilization may be needed before trauma processing');
    }
    
    if (otherDisciplines.includes('meditation_instructor')) {
      guidance.push('Meditation practices can support healthy sleep patterns');
    }

    return guidance;
  }

  private analyzeSleepPatterns(issues: string[]): string {
    return "Sleep pattern analysis reveals disrupted sleep architecture and inefficient sleep.";
  }

  private calculateSleepEfficiency(userProfile: any): string {
    return "Sleep efficiency assessment indicates need for sleep consolidation work.";
  }

  private assessCircadianRhythm(userProfile: any): string {
    return "Circadian rhythm evaluation shows misalignment requiring chronotherapy.";
  }
}

export const sleepTherapist = new SleepTherapist();