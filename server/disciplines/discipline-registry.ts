import { BaseDiscipline } from './base-discipline';
import { classicalPsychology } from './classical-psychology';
import { cbtTherapist } from './cbt-therapist';

/**
 * Central Registry for All Therapeutic Disciplines
 * Provides clean interface for discipline management
 */
export class DisciplineRegistry {
  private disciplines: Map<string, BaseDiscipline> = new Map();

  constructor() {
    this.registerDiscipline('classical_psychologist', classicalPsychology);
    this.registerDiscipline('cbt_therapist', cbtTherapist);
    
    // TODO: Add remaining disciplines as they are converted to modular format
    // this.registerDiscipline('trauma_therapist', traumaTherapist);
    // this.registerDiscipline('somatic_therapist', somaticTherapist);
    // ... etc
  }

  private registerDiscipline(key: string, discipline: BaseDiscipline): void {
    this.disciplines.set(key, discipline);
  }

  getDiscipline(key: string): BaseDiscipline | undefined {
    return this.disciplines.get(key);
  }

  getAllDisciplines(): BaseDiscipline[] {
    return Array.from(this.disciplines.values());
  }

  getApplicableDisciplines(userProfile: any, currentIssues: string[], goals: string[]): BaseDiscipline[] {
    return this.getAllDisciplines().filter(discipline => 
      discipline.isApplicable(userProfile, currentIssues, goals)
    );
  }

  async generateMultidisciplinaryResponse(
    userInput: string, 
    context: any,
    maxDisciplines: number = 3
  ) {
    const applicableDisciplines = this.getApplicableDisciplines(
      context.userProfile, 
      context.currentIssues, 
      context.goals
    ).slice(0, maxDisciplines);

    const responses = await Promise.all(
      applicableDisciplines.map(discipline => 
        discipline.generateResponse(userInput, context)
      )
    );

    return {
      primaryDisciplines: responses.map(r => r.disciplineName),
      integratedAssessment: this.integrateAssessments(responses),
      combinedInterventions: this.combineInterventions(responses),
      integrationGuidance: this.generateIntegrationGuidance(responses),
      responses
    };
  }

  private integrateAssessments(responses: any[]): string {
    const assessments = responses.map(r => r.assessment);
    return `Multidisciplinary Assessment: ${assessments.join(' ')}`;
  }

  private combineInterventions(responses: any[]): string[] {
    const allInterventions = responses.flatMap(r => r.interventions);
    return [...new Set(allInterventions)]; // Remove duplicates
  }

  private generateIntegrationGuidance(responses: any[]): string[] {
    return [
      "Combine evidence-based approaches for maximum effectiveness",
      "Sequence interventions from most supportive to most challenging",
      "Monitor progress across all modalities for comprehensive view",
      "Adapt approach based on client response and preferences"
    ];
  }
}

export const disciplineRegistry = new DisciplineRegistry();