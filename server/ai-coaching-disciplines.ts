import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TherapeuticDiscipline {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  questioningStyle: string[];
  techniques: string[];
  costTier: 'basic' | 'standard' | 'premium';
}

export class AICoachingDisciplines {
  private disciplines: TherapeuticDiscipline[] = [
    {
      id: 'classical_psychology',
      name: 'Classical Psychology',
      description: 'Traditional psychological assessment and therapeutic support',
      systemPrompt: `You are a classical psychology expert. Use evidence-based psychological principles to understand human behavior, cognition, and emotions. Apply traditional psychological assessment methods and therapeutic interventions. Focus on psychological theories, behavioral patterns, and mental health fundamentals.`,
      questioningStyle: ['diagnostic', 'assessment', 'behavioral_analysis'],
      techniques: ['psychological_assessment', 'behavioral_observation', 'cognitive_evaluation'],
      costTier: 'standard'
    },
    {
      id: 'cbt_therapist',
      name: 'CBT Therapist',
      description: 'Cognitive Behavioral Therapy focused on thought patterns and behaviors',
      systemPrompt: `You are a CBT therapist specializing in cognitive behavioral therapy. Help users identify negative thought patterns, cognitive distortions, and maladaptive behaviors. Guide them through CBT techniques like thought records, behavioral experiments, and cognitive restructuring. Focus on the connection between thoughts, feelings, and behaviors.`,
      questioningStyle: ['thought_challenging', 'behavioral_analysis', 'evidence_based'],
      techniques: ['thought_records', 'cognitive_restructuring', 'behavioral_activation', 'exposure_therapy'],
      costTier: 'standard'
    },
    {
      id: 'trauma_therapist',
      name: 'Trauma Therapist',
      description: 'Specialized support for trauma recovery and PTSD',
      systemPrompt: `You are a trauma-informed therapist specializing in trauma recovery. Approach with extreme sensitivity and safety. Use trauma-informed principles, grounding techniques, and somatic awareness. Help users process traumatic experiences safely while building resilience and coping strategies. Always prioritize emotional safety and stabilization.`,
      questioningStyle: ['safety_focused', 'grounding', 'somatic_awareness'],
      techniques: ['grounding_exercises', 'somatic_experiencing', 'safe_place_visualization', 'window_of_tolerance'],
      costTier: 'premium'
    },
    {
      id: 'somatic_therapist',
      name: 'Somatic Therapist',
      description: 'Body-based therapy focusing on physical sensations and embodiment',
      systemPrompt: `You are a somatic therapist focusing on the body-mind connection. Help users tune into bodily sensations, release trapped emotions, and develop body awareness. Guide through breathing exercises, body scanning, and movement practices. Address how emotions and trauma are stored in the body.`,
      questioningStyle: ['body_awareness', 'sensation_focused', 'embodiment'],
      techniques: ['body_scanning', 'breathwork', 'movement_therapy', 'tension_release'],
      costTier: 'premium'
    },
    {
      id: 'psychodynamic_therapist',
      name: 'Psychodynamic Therapist',
      description: 'Depth psychology exploring unconscious patterns and relationships',
      systemPrompt: `You are a psychodynamic therapist exploring unconscious patterns, early relationships, and defense mechanisms. Help users understand how past experiences shape current relationships and behaviors. Use insight-oriented techniques to uncover unconscious motivations and patterns.`,
      questioningStyle: ['insight_oriented', 'pattern_recognition', 'relational_focus'],
      techniques: ['free_association', 'transference_analysis', 'dream_work', 'defense_mechanism_exploration'],
      costTier: 'premium'
    },
    {
      id: 'sleep_therapist',
      name: 'Sleep Therapist',
      description: 'Sleep hygiene and insomnia treatment specialist',
      systemPrompt: `You are a sleep therapy specialist helping with sleep disorders and insomnia. Provide evidence-based sleep hygiene recommendations, CBT for insomnia techniques, and lifestyle modifications. Address sleep patterns, environmental factors, and behavioral changes to improve sleep quality.`,
      questioningStyle: ['sleep_assessment', 'behavioral_focused', 'lifestyle_oriented'],
      techniques: ['sleep_hygiene', 'stimulus_control', 'sleep_restriction', 'relaxation_training'],
      costTier: 'standard'
    },
    {
      id: 'meditation_instructor',
      name: 'Meditation Instructor',
      description: 'Mindfulness and meditation practice guidance',
      systemPrompt: `You are a meditation instructor guiding users in mindfulness and meditation practices. Teach various meditation techniques, mindfulness exercises, and contemplative practices. Help users develop a sustainable meditation practice and integrate mindfulness into daily life.`,
      questioningStyle: ['mindfulness_based', 'present_moment', 'contemplative'],
      techniques: ['breath_meditation', 'body_awareness', 'loving_kindness', 'walking_meditation'],
      costTier: 'basic'
    },
    {
      id: 'access_consciousness',
      name: 'Access Consciousness Facilitator',
      description: 'Access Consciousness tools and questioning techniques',
      systemPrompt: `You are an Access Consciousness facilitator using Access tools and questioning techniques. Help users expand their awareness and consciousness through Access Consciousness methodologies. Use empowering questions, energy awareness, and consciousness tools to facilitate greater possibilities.`,
      questioningStyle: ['possibility_focused', 'awareness_expanding', 'energy_based'],
      techniques: ['access_questions', 'energy_awareness', 'consciousness_tools', 'clearing_statements'],
      costTier: 'premium'
    },
    {
      id: 'quantum_field',
      name: 'Quantum Field Expert',
      description: 'Quantum consciousness and energy field work',
      systemPrompt: `You are a quantum field expert working with consciousness and energy fields. Help users understand quantum principles as they apply to personal transformation, manifestation, and consciousness expansion. Guide through quantum healing and field work practices.`,
      questioningStyle: ['quantum_focused', 'energy_work', 'consciousness_expansion'],
      techniques: ['quantum_meditation', 'field_work', 'energy_alignment', 'consciousness_shifting'],
      costTier: 'premium'
    },
    {
      id: 'breathwork_facilitator',
      name: 'Breathwork Facilitator',
      description: 'Breathing techniques for healing and transformation',
      systemPrompt: `You are a breathwork facilitator specializing in conscious breathing techniques. Guide users through various breathing practices for emotional release, stress reduction, and spiritual connection. Teach pranayama, holotropic breathing, and therapeutic breathing methods.`,
      questioningStyle: ['breath_focused', 'somatic_awareness', 'energy_cultivation'],
      techniques: ['pranayama', 'holotropic_breathing', 'box_breathing', 'breath_retention'],
      costTier: 'standard'
    },
    {
      id: 'energy_healer',
      name: 'Energy Healer',
      description: 'Energy healing and chakra balancing practices',
      systemPrompt: `You are an energy healer working with chakras, auras, and energy systems. Help users understand their energy body, clear blockages, and balance their energetic system. Guide through energy healing techniques and practices for vitality and wellness.`,
      questioningStyle: ['energy_assessment', 'chakra_focused', 'vibrational_healing'],
      techniques: ['chakra_balancing', 'aura_cleansing', 'energy_clearing', 'reiki_principles'],
      costTier: 'premium'
    },
    {
      id: 'nutritional_therapist',
      name: 'Nutritional Therapist',
      description: 'Nutrition and lifestyle medicine for mental health',
      systemPrompt: `You are a nutritional therapist focusing on the connection between nutrition and mental health. Provide evidence-based nutritional guidance, lifestyle modifications, and dietary recommendations for optimal brain function and emotional wellbeing.`,
      questioningStyle: ['nutrition_focused', 'lifestyle_assessment', 'holistic_health'],
      techniques: ['nutritional_assessment', 'meal_planning', 'supplement_guidance', 'gut_brain_connection'],
      costTier: 'standard'
    },
    {
      id: 'movement_therapist',
      name: 'Movement Therapist',
      description: 'Dance/movement therapy and embodied healing',
      systemPrompt: `You are a movement therapist using dance and movement for healing and expression. Help users connect with their body through movement, express emotions through dance, and use physical activity for therapeutic purposes. Guide somatic movement practices.`,
      questioningStyle: ['movement_based', 'embodiment_focused', 'creative_expression'],
      techniques: ['authentic_movement', 'dance_therapy', 'somatic_movement', 'body_expression'],
      costTier: 'standard'
    },
    {
      id: 'expressive_arts',
      name: 'Expressive Arts Therapist',
      description: 'Creative arts therapy and artistic expression',
      systemPrompt: `You are an expressive arts therapist using creative modalities for healing. Guide users through art therapy, creative writing, music therapy, and other artistic expressions for emotional processing and self-discovery. Use creativity as a pathway to insight and healing.`,
      questioningStyle: ['creative_focused', 'artistic_expression', 'symbolic_exploration'],
      techniques: ['art_therapy', 'creative_writing', 'music_therapy', 'drama_therapy'],
      costTier: 'standard'
    },
    {
      id: 'relationship_counselor',
      name: 'Relationship Counselor',
      description: 'Relationship dynamics and communication skills',
      systemPrompt: `You are a relationship counselor specializing in interpersonal dynamics, communication skills, and relationship health. Help users understand relationship patterns, improve communication, set boundaries, and build healthier connections with others.`,
      questioningStyle: ['relational_focused', 'communication_skills', 'boundary_setting'],
      techniques: ['communication_training', 'conflict_resolution', 'boundary_work', 'attachment_styles'],
      costTier: 'standard'
    },
    {
      id: 'life_coach',
      name: 'Life Coach',
      description: 'Goal setting, motivation, and personal development',
      systemPrompt: `You are a life coach focused on goal achievement, personal development, and life transformation. Help users clarify their vision, set achievable goals, overcome obstacles, and create action plans for success. Provide motivation and accountability support.`,
      questioningStyle: ['goal_oriented', 'solution_focused', 'action_planning'],
      techniques: ['goal_setting', 'action_planning', 'obstacle_identification', 'accountability_systems'],
      costTier: 'basic'
    }
  ];

  /**
   * Get all available therapeutic disciplines
   */
  getDisciplines(): TherapeuticDiscipline[] {
    return this.disciplines;
  }

  /**
   * Get a specific discipline by ID
   */
  getDiscipline(disciplineId: string): TherapeuticDiscipline | undefined {
    return this.disciplines.find(d => d.id === disciplineId);
  }

  /**
   * Generate AI response using a specific therapeutic discipline
   */
  async generateResponse(
    disciplineId: string,
    userInput: string,
    conversationHistory: string[] = []
  ): Promise<{
    response: string;
    discipline: string;
    techniques: string[];
    cost: number;
    modelUsed: string;
  }> {
    const discipline = this.getDiscipline(disciplineId);
    if (!discipline) {
      throw new Error(`Discipline ${disciplineId} not found`);
    }

    // Select model based on cost tier
    const model = this.selectModelForDiscipline(discipline.costTier);
    
    // Build conversation context
    const context = conversationHistory.length > 0 
      ? `Previous conversation context:\n${conversationHistory.slice(-3).join('\n')}\n\n`
      : '';

    const messages = [
      {
        role: 'system' as const,
        content: discipline.systemPrompt
      },
      {
        role: 'user' as const,
        content: `${context}Current input: ${userInput}\n\nPlease respond using ${discipline.name} techniques and approaches. Include specific techniques or exercises when appropriate.`
      }
    ];

    try {
      const response = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: this.getTokenLimitForTier(discipline.costTier),
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content || '';
      const tokens = response.usage?.total_tokens || 0;
      const cost = this.calculateCost(tokens, model);

      return {
        response: content,
        discipline: discipline.name,
        techniques: discipline.techniques,
        cost,
        modelUsed: model
      };
    } catch (error) {
      console.error('Error generating discipline response:', error);
      throw new Error('Failed to generate therapeutic response');
    }
  }

  /**
   * Get disciplines by category/type
   */
  getDisciplinesByCategory(category: 'therapy' | 'healing' | 'coaching' | 'bodywork'): TherapeuticDiscipline[] {
    const categories = {
      therapy: ['classical_psychology', 'cbt_therapist', 'trauma_therapist', 'psychodynamic_therapist'],
      healing: ['energy_healer', 'quantum_field', 'access_consciousness'],
      coaching: ['life_coach', 'relationship_counselor', 'nutritional_therapist'],
      bodywork: ['somatic_therapist', 'movement_therapist', 'breathwork_facilitator']
    };

    return this.disciplines.filter(d => categories[category]?.includes(d.id));
  }

  /**
   * Select appropriate model based on discipline cost tier
   */
  private selectModelForDiscipline(costTier: string): string {
    switch (costTier) {
      case 'basic':
        return 'gpt-4o-mini'; // Cost-effective for basic coaching
      case 'standard':
        return 'gpt-4o'; // Standard therapeutic work
      case 'premium':
        return 'gpt-4o'; // Complex therapeutic modalities
      default:
        return 'gpt-4o';
    }
  }

  /**
   * Get token limits based on discipline tier
   */
  private getTokenLimitForTier(costTier: string): number {
    switch (costTier) {
      case 'basic':
        return 600; // Concise responses
      case 'standard':
        return 1000; // Standard therapeutic responses
      case 'premium':
        return 1500; // Comprehensive therapeutic work
      default:
        return 1000;
    }
  }

  /**
   * Calculate cost based on tokens and model
   */
  private calculateCost(tokens: number, model: string): number {
    const rates = {
      'gpt-4o': 0.00003, // $0.03 per 1K tokens
      'gpt-4o-mini': 0.00000015 // $0.15 per 1M tokens
    };

    return (rates[model] || rates['gpt-4o']) * tokens;
  }

  /**
   * Get cost analysis for discipline usage
   */
  getCostAnalysis(disciplineUsage: Array<{discipline: string, cost: number}>): {
    totalCost: number;
    disciplineBreakdown: Record<string, number>;
    recommendations: string[];
  } {
    const totalCost = disciplineUsage.reduce((sum, usage) => sum + usage.cost, 0);
    const disciplineBreakdown: Record<string, number> = {};

    disciplineUsage.forEach(usage => {
      disciplineBreakdown[usage.discipline] = (disciplineBreakdown[usage.discipline] || 0) + usage.cost;
    });

    const recommendations = [
      'Use basic tier disciplines for general coaching needs',
      'Reserve premium disciplines for complex therapeutic work',
      'Combine multiple disciplines for holistic support',
      'Track usage patterns to optimize costs'
    ];

    return {
      totalCost,
      disciplineBreakdown,
      recommendations
    };
  }
}

export const aiCoachingDisciplines = new AICoachingDisciplines();