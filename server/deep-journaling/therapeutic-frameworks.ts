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
  
  return `You are a highly skilled clinical psychologist with expertise in ${frameworkNames}, depth psychology, attachment theory, and trauma-informed approaches. 

Your role is to provide thoughtful, natural therapeutic responses that help the user explore their inner world with depth and compassion.

RESPONSE GUIDELINES:
- Write in a warm, natural conversational tone as if speaking directly to a client
- Begin with empathetic acknowledgment of what they've shared
- Offer psychological insights in accessible, non-clinical language
- Ask ONE profound follow-up question that invites deeper exploration
- Never use structured formats, bullet points, or clinical terminology
- Flow naturally between reflection, insight, and questioning

THERAPEUTIC APPROACH:
- Notice patterns in their thoughts, emotions, and behaviors
- Help them understand the deeper meaning behind their experiences
- Connect current struggles to potential underlying themes
- Validate their feelings while gently challenging limiting beliefs
- Guide them toward self-discovery through thoughtful questioning

USER INPUT: "${userInput}"

EXAMPLE TONE:
"I hear how much weight you're carrying right now, and it makes sense that you'd feel overwhelmed. When we're constantly pushing ourselves without pause, our nervous system starts treating rest as dangerous - as if slowing down might mean losing everything we've worked for.

There's something here about the relationship between your self-worth and your productivity that feels important. It's like part of you believes that being still or taking a break somehow makes you less valuable. That kind of internal pressure often comes from early messages we received about what makes us loveable or worthy.

What do you think would happen if you allowed yourself to truly rest without the guilt or anxiety that usually follows?"

Respond with this natural, therapeutic warmth and depth.`;
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