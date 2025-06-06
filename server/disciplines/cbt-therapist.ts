import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class CBTTherapist extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "CBT Therapist",
    description: "Expert in cognitive-behavioral therapy techniques for thought pattern restructuring",
    expertise: [
      "Cognitive restructuring",
      "Behavioral activation",
      "Thought record techniques",
      "Exposure therapy",
      "Problem-solving therapy",
      "Mindfulness-based CBT",
      "Acceptance and commitment therapy",
      "Dialectical behavior therapy skills",
      "Relapse prevention",
      "Homework assignments"
    ],
    approach: "Identifies and modifies dysfunctional thought patterns and behaviors through structured, evidence-based interventions",
    applications: [
      "Depression and mood disorders",
      "Anxiety disorders",
      "Panic disorder",
      "Social anxiety",
      "OCD",
      "PTSD",
      "Eating disorders",
      "Substance abuse",
      "Chronic pain",
      "Insomnia"
    ],
    assessmentMethods: [
      "Thought records",
      "Behavioral experiments",
      "Mood tracking",
      "Cognitive bias identification",
      "Functional analysis",
      "Avoidance pattern assessment"
    ],
    interventions: [
      "Daily thought challenging",
      "Behavioral activation scheduling",
      "Exposure hierarchy development",
      "Cognitive restructuring exercises",
      "Problem-solving skill training",
      "Mindfulness practice integration"
    ],
    contraindications: [
      "Active psychosis",
      "Severe cognitive impairment",
      "Active substance intoxication"
    ],
    integration: [
      "Excellent foundation for other therapeutic approaches",
      "Complements mindfulness and somatic work",
      "Enhances trauma therapy effectiveness"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const cognitivePatterns = this.identifyCognitiveDistortions(currentIssues);
    const behavioralPatterns = this.assessBehavioralAvoidance(currentIssues);
    const moodPatterns = this.evaluateMoodPatterns(userProfile);

    return `CBT Assessment: ${cognitivePatterns} ${behavioralPatterns} ${moodPatterns}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('anxious') || userInput.includes('worry')) {
      interventions.push('Thought challenging worksheet for anxiety');
      interventions.push('Progressive muscle relaxation');
      interventions.push('Grounding techniques (5-4-3-2-1)');
    }
    
    if (userInput.includes('depressed') || userInput.includes('sad')) {
      interventions.push('Behavioral activation - schedule pleasant activities');
      interventions.push('Thought record for negative thinking');
      interventions.push('Activity monitoring and mood tracking');
    }
    
    if (userInput.includes('avoidance') || userInput.includes('avoiding')) {
      interventions.push('Exposure hierarchy development');
      interventions.push('Gradual exposure exercises');
      interventions.push('Fear ladder construction');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const cbtKeywords = [
      'anxiety', 'depression', 'worry', 'negative thoughts', 'panic',
      'avoidance', 'phobia', 'obsessive', 'compulsive', 'mood'
    ];
    
    return currentIssues.some(issue => 
      cbtKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Start daily thought records to identify cognitive patterns",
        "Implement behavioral activation techniques",
        "Practice mindfulness-based cognitive skills",
        "Develop coping strategy toolkit"
      ],
      interventions,
      riskFactors: [
        "Cognitive rigidity preventing perspective shifts",
        "Behavioral avoidance reinforcing problems",
        "Lack of homework completion reducing effectiveness"
      ],
      integrationNotes: [
        "CBT provides excellent foundation for trauma work",
        "Cognitive skills enhance meditation practice",
        "Behavioral techniques support somatic awareness"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('meditation_instructor')) {
      guidance.push('Mindfulness enhances cognitive awareness in CBT');
    }
    
    if (otherDisciplines.includes('trauma_therapist')) {
      guidance.push('CBT skills prepare clients for trauma processing');
    }
    
    if (otherDisciplines.includes('somatic_therapist')) {
      guidance.push('Body awareness supports cognitive-behavioral insights');
    }

    return guidance;
  }

  private identifyCognitiveDistortions(issues: string[]): string {
    return "Cognitive distortions identified: catastrophizing, all-or-nothing thinking, mind reading.";
  }

  private assessBehavioralAvoidance(issues: string[]): string {
    return "Behavioral patterns show avoidance cycles maintaining anxiety.";
  }

  private evaluateMoodPatterns(userProfile: any): string {
    return "Mood patterns indicate reactive emotional responses to triggers.";
  }
}

export const cbtTherapist = new CBTTherapist();