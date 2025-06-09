/**
 * Base Interface for All Therapeutic Disciplines
 * Ensures consistent structure across all modalities
 */

export interface DisciplineExpertise {
  name: string;
  description: string;
  expertise: string[];
  approach: string;
  applications: string[];
  assessmentMethods: string[];
  interventions: string[];
  contraindications: string[];
  integration: string[];
}

export interface DisciplineResponse {
  disciplineName: string;
  assessment: string;
  recommendations: string[];
  interventions: string[];
  riskFactors: string[];
  integrationNotes: string[];
}

export abstract class BaseDiscipline {
  abstract expertise: DisciplineExpertise;
  
  get name(): string { return this.expertise.name; }
  get description(): string { return this.expertise.description; }
  get techniques(): string[] { return this.expertise.interventions; }
  get applications(): string[] { return this.expertise.applications; }
  
  /**
   * Assess user situation from this discipline's perspective
   */
  abstract assess(userProfile: any, currentIssues: string[], goals: string[]): Promise<string>;
  
  /**
   * Generate specific interventions for this discipline
   */
  abstract generateInterventions(userInput: string, assessment: string): Promise<string[]>;
  
  /**
   * Check if this discipline is applicable to the current situation
   */
  abstract isApplicable(userProfile: any, currentIssues: string[], goals: string[]): boolean;
  
  /**
   * Generate coaching response from this discipline's perspective
   */
  abstract generateResponse(userInput: string, context: any): Promise<DisciplineResponse>;
  
  /**
   * Integration guidance for combining with other disciplines
   */
  abstract getIntegrationGuidance(otherDisciplines: string[]): string[];
}