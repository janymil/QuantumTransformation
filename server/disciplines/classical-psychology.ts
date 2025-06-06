import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class ClassicalPsychology extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "Classical Psychologist",
    description: "Expert in foundational psychological theories and evidence-based therapeutic approaches",
    expertise: [
      "Behavioral psychology principles",
      "Learning theory and conditioning",
      "Personality assessment and theory",
      "Developmental psychology",
      "Social psychology dynamics",
      "Cognitive processes and biases",
      "Psychological assessment tools",
      "Research-based interventions",
      "Diagnostic evaluation",
      "Psychological testing and measurement",
      "Individual differences analysis",
      "Psychoeducation and skill building"
    ],
    approach: "Applies scientifically validated psychological principles and methodologies for comprehensive assessment and treatment",
    applications: [
      "Mental health diagnosis and treatment",
      "Behavioral modification",
      "Personality disorders",
      "Learning difficulties",
      "Cognitive assessment",
      "Psychological evaluation",
      "Treatment planning",
      "Progress monitoring",
      "Skill development",
      "Psychoeducation"
    ],
    assessmentMethods: [
      "Standardized psychological tests",
      "Clinical interviews",
      "Behavioral observation",
      "Cognitive assessment batteries",
      "Personality inventories",
      "Functional analysis",
      "Risk assessment protocols",
      "Progress measurement scales"
    ],
    interventions: [
      "Evidence-based therapy protocols",
      "Behavioral modification programs",
      "Cognitive skill training",
      "Psychoeducational interventions",
      "Assessment-guided treatment planning",
      "Progress monitoring systems",
      "Relapse prevention strategies"
    ],
    contraindications: [
      "Active psychosis requiring medical intervention",
      "Severe substance intoxication",
      "Medical emergencies",
      "Court-ordered evaluations (require specific credentials)"
    ],
    integration: [
      "Provides scientific foundation for other approaches",
      "Enhances diagnostic accuracy",
      "Supports evidence-based treatment decisions",
      "Complements therapeutic modalities with research backing"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const behavioralPatterns = this.analyzeBehavioralPatterns(currentIssues);
    const cognitiveFactors = this.assessCognitiveFactors(userProfile);
    const developmentalConsiderations = this.evaluateDevelopmentalFactors(userProfile);

    return `Psychological Assessment: ${behavioralPatterns} ${cognitiveFactors} ${developmentalConsiderations}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('anxiety') || userInput.includes('worry')) {
      interventions.push('Systematic desensitization protocol');
      interventions.push('Cognitive restructuring exercises');
      interventions.push('Behavioral activation scheduling');
    }
    
    if (userInput.includes('habit') || userInput.includes('behavior')) {
      interventions.push('Functional behavior analysis');
      interventions.push('Operant conditioning strategies');
      interventions.push('Environmental modification');
    }
    
    if (userInput.includes('learning') || userInput.includes('skill')) {
      interventions.push('Skill acquisition protocols');
      interventions.push('Practice scheduling optimization');
      interventions.push('Performance feedback systems');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const psychologicalKeywords = [
      'behavior', 'habit', 'learning', 'assessment', 'diagnosis',
      'anxiety', 'depression', 'personality', 'cognitive', 'development'
    ];
    
    return currentIssues.some(issue => 
      psychologicalKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    ) || goals.some(goal => 
      psychologicalKeywords.some(keyword => goal.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Complete comprehensive psychological assessment",
        "Establish baseline behavioral measurements",
        "Implement evidence-based intervention protocols",
        "Monitor progress using validated scales"
      ],
      interventions,
      riskFactors: [
        "Untreated underlying psychological conditions",
        "Non-compliance with evidence-based protocols",
        "Lack of appropriate professional supervision"
      ],
      integrationNotes: [
        "Provides scientific foundation for other therapeutic approaches",
        "Assessment results can guide selection of complementary modalities",
        "Progress monitoring enhances effectiveness of all interventions"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('cbt_therapist')) {
      guidance.push('Psychological assessment informs CBT case formulation');
    }
    
    if (otherDisciplines.includes('trauma_therapist')) {
      guidance.push('PTSD screening and assessment protocols enhance trauma work');
    }
    
    if (otherDisciplines.includes('somatic_therapist')) {
      guidance.push('Psychological testing can identify somatic manifestations');
    }

    return guidance;
  }

  private analyzeBehavioralPatterns(issues: string[]): string {
    // Analyze behavioral patterns using learning theory
    return "Behavioral analysis indicates patterns consistent with operant conditioning factors.";
  }

  private assessCognitiveFactors(userProfile: any): string {
    // Assess cognitive biases and thinking patterns
    return "Cognitive assessment reveals processing patterns affecting decision-making.";
  }

  private evaluateDevelopmentalFactors(userProfile: any): string {
    // Consider developmental psychology factors
    return "Developmental considerations indicate stage-appropriate intervention needs.";
  }
}

export const classicalPsychology = new ClassicalPsychology();