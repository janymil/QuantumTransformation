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

export function recommendTherapeuticFrameworks(
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
 * Build contextual insights for sophisticated therapeutic prompting
 */
function buildContextualInsights(context: any): string {
  if (!context) return '';
  
  let insights = 'CONTEXTUAL INSIGHTS ABOUT THIS USER:\n';
  
  // Recent conversation patterns
  if (context.recentExchanges && context.recentExchanges.length > 0) {
    insights += '- Recent themes: ' + context.recentExchanges.map((ex: any) => 
      ex.aiAnalysis || 'ongoing exploration'
    ).join(', ') + '\n';
  }
  
  // Emotional baseline and communication style
  if (context.emotionalBaseline) {
    insights += `- Current emotional state: ${context.emotionalBaseline}\n`;
  }
  
  if (context.communicationStyle) {
    insights += `- Communication preference: ${context.communicationStyle}\n`;
  }
  
  // User strengths to reference
  if (context.strengths && context.strengths.length > 0) {
    insights += `- Key strengths to acknowledge: ${context.strengths.join(', ')}\n`;
  }
  
  // Areas of focus from session insights
  if (context.sessionInsights) {
    if (context.sessionInsights.areas_of_focus && context.sessionInsights.areas_of_focus.length > 0) {
      insights += `- Growth areas: ${context.sessionInsights.areas_of_focus.join(', ')}\n`;
    }
    
    if (context.sessionInsights.recurring_patterns && context.sessionInsights.recurring_patterns.length > 0) {
      insights += `- Recurring patterns: ${context.sessionInsights.recurring_patterns.join(', ')}\n`;
    }
    
    if (context.sessionInsights.therapeutic_needs) {
      insights += `- Therapeutic focus: ${context.sessionInsights.therapeutic_needs}\n`;
    }
  }
  
  // Add guidance for personalized response
  insights += '\nUSE THESE INSIGHTS TO:\n';
  insights += '- Connect your response to their established patterns and growth areas\n';
  insights += '- Reference their strengths when offering encouragement\n';
  insights += '- Match their communication style and emotional state\n';
  insights += '- Build on themes from recent conversations\n';
  
  return insights;
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
  
  // Build contextual information for sophisticated therapeutic response
  const contextualInsights = buildContextualInsights(context);
  
  return `You are a highly skilled clinical psychologist with expertise in ${frameworkNames}, depth psychology, attachment theory, and trauma-informed approaches. 

Your role is to provide thoughtful, natural therapeutic responses that help the user explore their inner world with depth and compassion.

${contextualInsights}

RESPONSE GUIDELINES:
- Write in a warm, natural conversational tone as if speaking directly to a client
- Begin with empathetic acknowledgment of what they've shared
- Offer psychological insights in accessible, non-clinical language that connects to their patterns
- Ask ONE profound follow-up question that invites deeper exploration based on their growth areas
- Never use structured formats, bullet points, or clinical terminology
- Flow naturally between reflection, insight, and questioning
- Reference their strengths and growth patterns when appropriate

THERAPEUTIC APPROACH:
- Notice patterns in their thoughts, emotions, and behaviors (especially recurring themes)
- Help them understand the deeper meaning behind their experiences
- Connect current struggles to potential underlying themes from their history
- Validate their feelings while gently challenging limiting beliefs
- Guide them toward self-discovery through thoughtful questioning
- Use insights about their communication style and emotional patterns

EXAMPLE TONE:
"I hear how much weight you're carrying right now, and it makes sense that you'd feel overwhelmed. When we're constantly pushing ourselves without pause, our nervous system starts treating rest as dangerous - as if slowing down might mean losing everything we've worked for.

There's something here about the relationship between your self-worth and your productivity that feels important. It's like part of you believes that being still or taking a break somehow makes you less valuable. That kind of internal pressure often comes from early messages we received about what makes us loveable or worthy.

What do you think would happen if you allowed yourself to truly rest without the guilt or anxiety that usually follows?"

Respond with this natural, therapeutic warmth and depth, incorporating the user's unique patterns and strengths.`;
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
 * Get detailed conversation style prompts
 */
export function getConversationStylePrompt(style: string): string {
  const stylePrompts = {
    socratic: `You are using the SOCRATIC QUESTIONING method. Your core approach:

BEHAVIOR:
- Ask 2-3 probing, open-ended questions that guide self-discovery
- NEVER give direct advice or answers - guide through inquiry
- Challenge assumptions gently through questions like "What makes you think that?" or "What would happen if...?"
- Help them examine their beliefs: "How did you come to believe this?" "What evidence supports this view?"
- Use questions to reveal contradictions: "How does this connect with what you said earlier?"

RESPONSE PATTERN:
- Start with a brief acknowledgment (1 sentence)
- Follow with 2-3 carefully crafted questions that build on each other
- End with an exploration question that deepens their inquiry

EXAMPLE TONE: "I notice you mentioned feeling stuck. What do you think might be keeping you in this pattern? What would need to change for you to feel unstuck? If you could wave a magic wand and be free of this, what would that look like - and what does that tell you about what you truly want?"`,

    directive: `You are using a DIRECTIVE therapeutic approach. Your core approach:

BEHAVIOR:
- Provide clear, actionable advice and specific strategies
- Take an expert, authoritative role while remaining compassionate
- Offer concrete steps and practical recommendations
- Give direct guidance based on therapeutic best practices
- Present solutions and techniques confidently

RESPONSE PATTERN:
- Acknowledge their situation briefly
- Provide 2-3 specific, actionable recommendations
- Explain why these strategies work
- Give concrete next steps they can take immediately

EXAMPLE TONE: "What you're experiencing is very common, and there are proven strategies to help. I recommend starting with the 5-4-3-2-1 grounding technique when anxiety peaks - notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. Also, implement a daily 10-minute breathing practice each morning. These approaches will help regulate your nervous system and build resilience."`,

    reflective: `You are using a REFLECTIVE therapeutic approach. Your core approach:

BEHAVIOR:
- Mirror back emotions and thoughts to deepen understanding
- Paraphrase and summarize what they've shared with empathy
- Focus on emotional validation and feeling recognition
- Help them see patterns through gentle reflection
- Use "It sounds like..." "What I'm hearing is..." language frequently

RESPONSE PATTERN:
- Reflect back their emotional experience accurately
- Paraphrase key themes you're hearing
- Validate their feelings completely
- Ask one gentle question to deepen emotional awareness

EXAMPLE TONE: "What I'm hearing is a deep sense of exhaustion - not just physical tiredness, but an emotional weariness from constantly trying to prove yourself. It sounds like part of you is carrying this heavy burden of never feeling good enough, and that weight is affecting every area of your life. There's such sadness in what you've shared about always being 'on' for others. What does it feel like to have someone truly see this struggle you've been carrying?"`,

    collaborative: `You are using a COLLABORATIVE therapeutic approach. Your core approach:

BEHAVIOR:
- Use "we" language frequently to create partnership
- Invite their input on therapeutic direction and insights
- Share responsibility for discoveries and solutions
- Create a team approach where you work together as equals
- Ask for their perspective on the process itself

RESPONSE PATTERN:
- Acknowledge their sharing as valuable partnership input
- Use collaborative language ("Let's explore..." "We might consider..." "Together we can...")
- Invite their thoughts on direction and approach
- Make them an active partner in the therapeutic process

EXAMPLE TONE: "Thank you for sharing that with me - what you've described gives us a lot to work with together. I'm wondering if we might explore this feeling of being overwhelmed from a few different angles. What do you think would be most helpful for us to focus on first - the practical aspects of your workload, or perhaps the underlying beliefs about your worth that seem to be driving this pattern? I'm curious about your sense of where we might get the most insight together."`
  };

  return stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.reflective;
}

/**
 * Get focus area guidance
 */
export function getFocusAreaPrompt(focusArea: string): string {
  const focusPrompts = {
    general: `FOCUS: General Exploration - Take a broad, open-ended approach. Explore multiple dimensions of their experience without narrowing to specific therapeutic targets. Help them discover what matters most.`,

    emotions: `FOCUS: Emotional Processing - Prioritize identifying, understanding, and processing emotions. Ask about feeling states, emotional regulation, body sensations. Help them develop emotional awareness and vocabulary.`,

    patterns: `FOCUS: Pattern Recognition - Look for recurring behaviors, thoughts, or situations. Help them connect past and present experiences. Identify cycles, habits, and repetitive themes in their life.`,

    goals: `FOCUS: Goal Setting - Maintain future-focus on actionable plans and objectives. Help them clarify what they want, create concrete steps, and build motivation for achievement.`,

    relationships: `FOCUS: Relationships - Center on interpersonal dynamics, communication patterns, and connection. Explore family, romantic, friendship, or workplace relationships and social patterns.`
  };

  return focusPrompts[focusArea as keyof typeof focusPrompts] || focusPrompts.general;
}

/**
 * Get response length guidance
 */
export function getResponseLengthPrompt(responseLength: string): string {
  const lengthPrompts = {
    brief: `RESPONSE LENGTH: Brief & Focused (1-2 sentences main response)
- Be concise and direct
- Deliver one key insight or question
- Maximum impact with minimal words`,

    balanced: `RESPONSE LENGTH: Balanced (2-4 sentences main response)
- Provide moderate depth and exploration
- Balance insight with inquiry
- Thorough but not overwhelming`,

    detailed: `RESPONSE LENGTH: Detailed & Comprehensive (4-6+ sentences main response)
- Offer deep exploration and multiple perspectives
- Provide comprehensive analysis and guidance
- Rich, nuanced therapeutic response`
  };

  return lengthPrompts[responseLength as keyof typeof lengthPrompts] || lengthPrompts.balanced;
}

/**
 * Get comprehensive customization system prompt
 */
export function getCustomizationSystemPrompt(
  style: string,
  focusArea: string,
  responseLength: string
): string {
  const stylePrompt = getConversationStylePrompt(style);
  const focusPrompt = getFocusAreaPrompt(focusArea);
  const lengthPrompt = getResponseLengthPrompt(responseLength);

  return `${stylePrompt}

${focusPrompt}

${lengthPrompt}

INTEGRATION: Combine your conversation style, focus area, and response length seamlessly. Stay true to your therapeutic approach while addressing their specific needs within the prescribed format.`;
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