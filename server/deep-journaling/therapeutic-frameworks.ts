/**
 * Therapeutic Frameworks for Deep Journaling
 * Professional psychological frameworks integrated into the journaling system
 */

export interface TherapeuticFramework {
  name: string;
  approach: string;
  techniques: string[];
  applications: string[];
  contraindications?: string[];
}

export const therapeuticFrameworks: Record<string, TherapeuticFramework> = {
  cbt: {
    name: "Cognitive Behavioral Therapy",
    approach: "Identifying and changing negative thought patterns and behaviors",
    techniques: [
      "Thought challenging",
      "Behavioral activation",
      "Cognitive restructuring",
      "Exposure therapy principles",
      "Mindfulness-based techniques"
    ],
    applications: [
      "Anxiety and depression",
      "Negative thought patterns",
      "Behavioral change",
      "Stress management",
      "Goal achievement"
    ]
  },

  dbt: {
    name: "Dialectical Behavior Therapy",
    approach: "Building skills for emotional regulation and interpersonal effectiveness",
    techniques: [
      "Distress tolerance",
      "Emotion regulation",
      "Interpersonal effectiveness",
      "Mindfulness practice",
      "Radical acceptance"
    ],
    applications: [
      "Emotional dysregulation",
      "Relationship difficulties",
      "Crisis management",
      "Self-harm behaviors",
      "Intense emotions"
    ]
  },

  act: {
    name: "Acceptance and Commitment Therapy",
    approach: "Accepting difficult thoughts and feelings while committing to values-based action",
    techniques: [
      "Values clarification",
      "Mindfulness exercises",
      "Defusion techniques",
      "Acceptance practices",
      "Committed action planning"
    ],
    applications: [
      "Values exploration",
      "Life direction",
      "Chronic pain",
      "Anxiety disorders",
      "Behavioral change"
    ]
  },

  psychodynamic: {
    name: "Psychodynamic Therapy",
    approach: "Exploring unconscious patterns and early life experiences",
    techniques: [
      "Free association",
      "Dream analysis",
      "Transference exploration",
      "Defense mechanism identification",
      "Childhood pattern recognition"
    ],
    applications: [
      "Relationship patterns",
      "Unconscious conflicts",
      "Personality development",
      "Emotional depth work",
      "Identity formation"
    ]
  },

  gestalt: {
    name: "Gestalt Therapy",
    approach: "Present-moment awareness and experiential processing",
    techniques: [
      "Here and now focus",
      "Body awareness",
      "Empty chair technique",
      "Experiential exercises",
      "Contact and awareness"
    ],
    applications: [
      "Present-moment awareness",
      "Emotional processing",
      "Relationship work",
      "Creative expression",
      "Body-mind integration"
    ]
  },

  narrative: {
    name: "Narrative Therapy",
    approach: "Re-authoring life stories and identifying unique outcomes",
    techniques: [
      "Externalization",
      "Unique outcome identification",
      "Re-authoring conversations",
      "Definitional ceremonies",
      "Preferred identity exploration"
    ],
    applications: [
      "Identity development",
      "Life story revision",
      "Problem externalization",
      "Strength identification",
      "Cultural sensitivity"
    ]
  }
};

export function selectOptimalFramework(
  userInput: string,
  emotionalState: string,
  sessionGoals: string[]
): TherapeuticFramework[] {
  const frameworks: TherapeuticFramework[] = [];
  
  // Analyze user input for framework indicators
  const input = userInput.toLowerCase();
  
  // CBT indicators
  if (input.includes('think') || input.includes('thought') || input.includes('belief') || 
      emotionalState.includes('anxious') || emotionalState.includes('depressed')) {
    frameworks.push(therapeuticFrameworks.cbt);
  }
  
  // DBT indicators
  if (input.includes('overwhelm') || input.includes('intense') || input.includes('relationship') ||
      emotionalState.includes('intense') || emotionalState.includes('dysregulated')) {
    frameworks.push(therapeuticFrameworks.dbt);
  }
  
  // ACT indicators
  if (input.includes('value') || input.includes('meaning') || input.includes('purpose') ||
      sessionGoals.some(goal => goal.includes('direction') || goal.includes('values'))) {
    frameworks.push(therapeuticFrameworks.act);
  }
  
  // Psychodynamic indicators
  if (input.includes('childhood') || input.includes('pattern') || input.includes('family') ||
      input.includes('relationship') || input.includes('dream')) {
    frameworks.push(therapeuticFrameworks.psychodynamic);
  }
  
  // Gestalt indicators
  if (input.includes('feeling') || input.includes('body') || input.includes('present') ||
      emotionalState.includes('disconnected') || emotionalState.includes('numb')) {
    frameworks.push(therapeuticFrameworks.gestalt);
  }
  
  // Narrative indicators
  if (input.includes('story') || input.includes('identity') || input.includes('who am i') ||
      sessionGoals.some(goal => goal.includes('identity') || goal.includes('purpose'))) {
    frameworks.push(therapeuticFrameworks.narrative);
  }
  
  // Default to CBT if no specific indicators
  if (frameworks.length === 0) {
    frameworks.push(therapeuticFrameworks.cbt);
  }
  
  return frameworks;
}

/**
 * Build system prompt for therapeutic analysis
 */
export function buildTherapeuticSystemPrompt(
  frameworks: TherapeuticFramework[],
  userInput: string,
  context: any
): string {
  const frameworkNames = frameworks.map(f => f.name).join(', ');
  
  return `You are an advanced therapeutic AI coach with deep expertise in ${frameworkNames} and profound understanding of human psychology. Your role is to provide insightful, personalized therapeutic responses that reveal underlying patterns and offer substantive psychological insights.

CRITICAL: Analyze the user's specific concerns deeply and provide substantive insights, not generic questions.

For this user input: "${userInput}"

Your response must:

1. **Deep Psychological Analysis**: Identify core emotional patterns, underlying beliefs, and psychological dynamics at play. Connect their experience to broader human psychological patterns.

2. **Specific Insights**: Provide concrete observations about what this reveals about their inner world, relationships, fears, or unconscious patterns. Use professional psychological frameworks.

3. **Somatic & Emotional Intelligence**: Notice physical manifestations, nervous system activation, and emotional undertones. Address the body-mind connection.

4. **Pattern Recognition**: Identify recurring themes, defense mechanisms, or behavioral patterns that may be emerging.

5. **Profound Questions**: Ask 1-2 deeply probing questions that help uncover unconscious patterns, hidden emotions, or core beliefs.

EXAMPLE QUALITY LEVEL:
"The urgency you describe around your ideas reveals a fascinating tension between creative potential and your relationship with productivity. This burning sensation often emerges when we feel disconnected from deeper purpose or when perfectionism creates internal pressure. Your difficulty sleeping and constant thinking suggests your nervous system is in activation mode, possibly reflecting fears about missing opportunities or not being enough. This pattern may connect to earlier experiences where your ideas weren't valued or where you learned to equate worth with productivity.

What specific belief about yourself drives this urgent need to bring every idea to life immediately?"

Provide a response demonstrating deep psychological understanding with specific, actionable insights rather than surface-level exploration.`;
}

/**
 * Get system prompt for new direction responses
 */
export function getNewDirectionSystemPrompt(context: any): string {
  return `You are a therapeutic companion helping the user explore their situation from a new perspective.

Your role is to:
1. Acknowledge what they've shared
2. Offer a fresh angle or perspective
3. Ask questions that open new avenues of exploration
4. Help them see possibilities they might not have considered

Respond with curiosity and gentle guidance to help them shift their perspective constructively.`;
}

/**
 * Get system prompt for response customization
 */
export function getCustomizationSystemPrompt(
  style: string,
  mode: string,
  focus: string
): string {
  return `You are a therapeutic companion adapting your response style based on user preferences.

Current settings:
- Style: ${style}
- Mode: ${mode}  
- Focus: ${focus}

Adjust your response to match these preferences while maintaining therapeutic effectiveness and empathy.`;
}

export function generateTherapeuticQuestions(
  framework: TherapeuticFramework,
  userInput: string,
  context: {
    emotionalState: string;
    sessionGoals: string[];
    previousSessions?: any[];
  }
): string[] {
  const questions: string[] = [];
  
  switch (framework.name) {
    case "Cognitive Behavioral Therapy":
      questions.push(
        "What thoughts went through your mind when this happened?",
        "How accurate or helpful are these thoughts?",
        "What evidence supports or contradicts this thinking?",
        "What would you tell a friend in this situation?",
        "What small action could you take toward feeling better?"
      );
      break;
      
    case "Dialectical Behavior Therapy":
      questions.push(
        "What emotions are you experiencing right now, and how intense are they?",
        "What skills could help you manage this situation effectively?",
        "How can you balance acceptance of what is with working toward change?",
        "What would be the wise mind approach here?",
        "What self-care do you need right now?"
      );
      break;
      
    case "Acceptance and Commitment Therapy":
      questions.push(
        "What values are most important to you in this situation?",
        "How can you move toward what matters to you, even with these difficult feelings?",
        "What would you do if this struggle wasn't holding you back?",
        "How can you be present with these experiences without being controlled by them?",
        "What committed action aligns with your deeper values?"
      );
      break;
      
    case "Psychodynamic Therapy":
      questions.push(
        "Does this situation remind you of anything from your past?",
        "What patterns do you notice in how you respond to similar situations?",
        "What might your reaction tell you about your deeper needs or fears?",
        "How do your early experiences influence how you see this situation?",
        "What unconscious beliefs might be at play here?"
      );
      break;
      
    case "Gestalt Therapy":
      questions.push(
        "What are you aware of in your body right now?",
        "If this feeling had a voice, what would it say?",
        "What do you need in this moment?",
        "How are you avoiding or moving toward this experience?",
        "What wants to emerge or be expressed?"
      );
      break;
      
    case "Narrative Therapy":
      questions.push(
        "How would you prefer this story to unfold?",
        "What strengths and resources do you have that this problem overlooks?",
        "When has this problem been less influential in your life?",
        "What would others who care about you say about your character?",
        "How would you like to be remembered in this situation?"
      );
      break;
  }
  
  return questions;
}