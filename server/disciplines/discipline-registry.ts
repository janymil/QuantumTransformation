import { BaseDiscipline } from './base-discipline';
import { classicalPsychology } from './classical-psychology';
import { cbtTherapist } from './cbt-therapist';
import { traumaTherapist } from './trauma-therapist';
import { somaticTherapist } from './somatic-therapist';
import { psychodynamicTherapist } from './psychodynamic-therapist';
import { sleepTherapist } from './sleep-therapist';
import { meditationInstructor } from './meditation-instructor';
import { accessConsciousness } from './access-consciousness';
import { quantumFieldExpert } from './quantum-field-expert';
import { breathworkFacilitator } from './breathwork-facilitator';
import { energyHealer } from './energy-healer';
import { nutritionalTherapist } from './nutritional-therapist';
import { movementTherapist } from './movement-therapist';
import { expressiveArtsTherapist } from './expressive-arts-therapist';
import { relationshipCounselor } from './relationship-counselor';
import { lifeCoach } from './life-coach';

/**
 * Central Registry for All Therapeutic Disciplines
 * Provides clean interface for discipline management
 */
export class DisciplineRegistry {
  private disciplines: Map<string, BaseDiscipline> = new Map();

  constructor() {
    // Register all 16 therapeutic disciplines
    this.registerDiscipline('classical_psychologist', classicalPsychology);
    this.registerDiscipline('cbt_therapist', cbtTherapist);
    this.registerDiscipline('trauma_therapist', traumaTherapist);
    this.registerDiscipline('somatic_therapist', somaticTherapist);
    this.registerDiscipline('psychodynamic_therapist', psychodynamicTherapist);
    this.registerDiscipline('sleep_therapist', sleepTherapist);
    this.registerDiscipline('meditation_instructor', meditationInstructor);
    this.registerDiscipline('access_consciousness', accessConsciousness);
    this.registerDiscipline('quantum_field_expert', quantumFieldExpert);
    this.registerDiscipline('breathwork_facilitator', breathworkFacilitator);
    this.registerDiscipline('energy_healer', energyHealer);
    this.registerDiscipline('nutritional_therapist', nutritionalTherapist);
    this.registerDiscipline('movement_therapist', movementTherapist);
    this.registerDiscipline('expressive_arts_therapist', expressiveArtsTherapist);
    this.registerDiscipline('relationship_counselor', relationshipCounselor);
    this.registerDiscipline('life_coach', lifeCoach);
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
    return Array.from(new Set(allInterventions)); // Remove duplicates with Array.from for TS compatibility
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