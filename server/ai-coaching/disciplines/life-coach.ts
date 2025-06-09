import { BaseDiscipline, DisciplineExpertise, DisciplineResponse } from './base-discipline';

export class LifeCoach extends BaseDiscipline {
  expertise: DisciplineExpertise = {
    name: "Life Coach",
    description: "Expert in goal achievement, motivation, and personal development",
    expertise: [
      "Goal setting and achievement",
      "Motivation and accountability",
      "Time management",
      "Decision making",
      "Career development",
      "Life planning",
      "Habit formation",
      "Performance optimization",
      "Leadership development",
      "Personal branding"
    ],
    approach: "Focuses on forward momentum, goal achievement, and unlocking human potential",
    applications: [
      "Career transitions",
      "Goal achievement",
      "Motivation challenges",
      "Time management issues",
      "Decision paralysis",
      "Life direction confusion",
      "Habit development",
      "Performance improvement",
      "Leadership skills",
      "Work-life balance"
    ],
    assessmentMethods: [
      "Goal clarity evaluation",
      "Motivation pattern analysis",
      "Strengths assessment",
      "Values clarification",
      "Time usage analysis",
      "Achievement history review"
    ],
    interventions: [
      "SMART goal setting",
      "Action plan development",
      "Accountability systems",
      "Habit tracking protocols",
      "Decision-making frameworks",
      "Performance monitoring"
    ],
    contraindications: [
      "Severe depression without treatment",
      "Active mental health crisis",
      "Unresolved trauma blocking progress"
    ],
    integration: [
      "Provides practical structure for therapeutic work",
      "Supports motivation and accountability",
      "Complements psychological healing with action"
    ]
  };

  async assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string> {
    const goalClarity = this.assessGoalClarity(goals);
    const motivationLevel = this.evaluateMotivation(userProfile);
    const actionReadiness = this.checkActionReadiness(userProfile);

    return `Life Coaching Assessment: ${goalClarity} ${motivationLevel} ${actionReadiness}`;
  }

  async generateInterventions(userInput: string, assessment: string): Promise<string[]> {
    const interventions = [];
    
    if (userInput.includes('goal') || userInput.includes('achievement')) {
      interventions.push('SMART goal setting workshop');
      interventions.push('Action plan creation');
      interventions.push('Milestone tracking system');
    }
    
    if (userInput.includes('motivation') || userInput.includes('stuck')) {
      interventions.push('Motivation wheel assessment');
      interventions.push('Accountability partner system');
      interventions.push('Reward and consequence structure');
    }
    
    if (userInput.includes('time') || userInput.includes('productivity')) {
      interventions.push('Time audit and optimization');
      interventions.push('Priority matrix development');
      interventions.push('Productivity system implementation');
    }

    return interventions;
  }

  isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean {
    const coachingKeywords = [
      'goal', 'motivation', 'career', 'time', 'productivity', 'achievement',
      'planning', 'direction', 'performance', 'leadership'
    ];
    
    return currentIssues.some(issue => 
      coachingKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    ) || goals.some(goal => 
      coachingKeywords.some(keyword => goal.toLowerCase().includes(keyword))
    );
  }

  async generateResponse(userInput: string, context: any): Promise<DisciplineResponse> {
    const assessment = await this.assess(context.userProfile, context.currentIssues, context.goals);
    const interventions = await this.generateInterventions(userInput, assessment);
    
    return {
      disciplineName: this.expertise.name,
      assessment,
      recommendations: [
        "Set clear, specific, and measurable goals",
        "Create accountability systems for progress",
        "Develop daily habits supporting your vision",
        "Track progress and celebrate achievements"
      ],
      interventions,
      riskFactors: [
        "Goal setting without addressing underlying blocks",
        "Over-focus on achievement without self-care",
        "Perfectionism preventing action"
      ],
      integrationNotes: [
        "Coaching provides structure for therapeutic insights",
        "Goal achievement builds confidence and momentum",
        "Action-oriented approach complements reflection-based work"
      ]
    };
  }

  getIntegrationGuidance(otherDisciplines: string[]): string[] {
    const guidance = [];
    
    if (otherDisciplines.includes('cbt_therapist')) {
      guidance.push('Cognitive skills support goal achievement and decision making');
    }
    
    if (otherDisciplines.includes('trauma_therapist')) {
      guidance.push('Trauma healing may be needed before major goal pursuit');
    }
    
    if (otherDisciplines.includes('nutritional_therapist')) {
      guidance.push('Physical health supports sustained performance and goal achievement');
    }

    return guidance;
  }

  private assessGoalClarity(goals: string[]): string {
    return "Goal clarity assessment indicates need for specific, measurable objectives.";
  }

  private evaluateMotivation(userProfile: any): string {
    return "Motivation evaluation shows varying levels requiring sustainable systems.";
  }

  private checkActionReadiness(userProfile: any): string {
    return "Action readiness assessment indicates capacity for structured goal pursuit.";
  }
}

export const lifeCoach = new LifeCoach();