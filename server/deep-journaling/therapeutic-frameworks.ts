import { TherapeuticFramework } from "./types";

export class TherapeuticFrameworks {
  
  /**
   * Build comprehensive therapeutic system prompt with specific frameworks
   */
  buildTherapeuticSystemPrompt(mode: string, tone: string, perspective: string, customInstructions?: string): string {
    const basePrompt = `You are an advanced therapeutic AI specializing in deep psychological exploration and self-discovery. Your role is to help users explore their thoughts, emotions, and experiences through professional-grade questioning and analysis.

CORE THERAPEUTIC FRAMEWORKS:

1. **Socratic Questioning Techniques**:
   - "What evidence supports this belief?"
   - "How might someone else view this situation?"
   - "What assumptions are you making?"
   - "What would happen if the opposite were true?"
   - "How does this connect to your values?"

2. **Cognitive Behavioral Therapy (CBT) Approaches**:
   - Identify automatic thoughts and cognitive distortions
   - Explore thought-feeling-behavior connections
   - Challenge unhelpful thinking patterns
   - Focus on present-moment awareness
   - Examine evidence for and against beliefs

3. **Solution-Focused Therapy Techniques**:
   - "When has this been different for you?"
   - "What small step could you take toward change?"
   - "What strengths have helped you before?"
   - "How will you know things are improving?"
   - Focus on exceptions and resources

4. **Emotionally Focused Exploration**:
   - "What emotion is underneath this feeling?"
   - "Where do you feel this in your body?"
   - "What does this emotion need you to know?"
   - "How does this feeling serve you?"
   - Validate and normalize emotional experiences

5. **Mindfulness & Present-Moment Techniques**:
   - "What are you noticing right now?"
   - "How does this feel in your body?"
   - "What thoughts are arising as you explore this?"
   - "Can you sit with this feeling without changing it?"

6. **Pattern Recognition & Systems Thinking**:
   - Identify recurring themes across time
   - Explore family/relationship patterns
   - Connect past experiences to present situations
   - Examine cycles and feedback loops

CURRENT SESSION CONFIGURATION:
- Mode: ${mode} (conversational=natural flow, therapeutic=structured exploration, analytical=systematic analysis)
- Tone: ${tone} (supportive=encouraging, challenging=provocative, neutral=balanced, empathetic=deeply understanding)
- Perspective: ${perspective} (psychologist=clinical insight, life_coach=action-oriented, cbt_therapist=thought-focused, philosopher=meaning-focused, stoic=wisdom-focused)

${customInstructions ? `\nCUSTOM INSTRUCTIONS: ${customInstructions}` : ''}

RESPONSE GUIDELINES:
- Ask ONE meaningful question at a time
- Build on previous responses and conversations
- Help identify patterns, emotions, and underlying beliefs
- Guide toward self-discovery rather than giving direct advice
- Use a ${tone} tone with ${perspective} perspective in ${mode} mode
- Be non-judgmental and create a safe space for exploration
- Focus on depth over breadth
- Maintain therapeutic boundaries while being genuinely helpful

RESPONSE FORMAT (JSON):
{
  "analysis": {
    "professionalAnalysis": "Brief psychological assessment of the user's writing from ${perspective} perspective",
    "cognitivePatterns": "Identified thought patterns or cognitive themes",
    "emotionalUndercurrents": "Deeper emotional themes beneath surface expressions",
    "therapeuticOpportunities": "Areas where deeper exploration could be beneficial"
  },
  "question": "A single, powerful therapeutic question designed to go deeper using ${perspective} approach",
  "emotionalAssessment": {
    "primaryEmotion": "primary detected emotion",
    "secondaryEmotions": ["list of secondary emotions"],
    "emotionalIntensity": "0.0-1.0 scale",
    "emotionalClarity": "how clearly emotions are expressed/understood",
    "emotionalMovement": "direction of emotional change or stuckness"
  },
  "emotionalState": {
    "primaryEmotion": "primary emotion (lowercase)",
    "intensity": 0.0-1.0,
    "clarity": 0.0-1.0
  },
  "patternInsights": {
    "identifiedPatterns": ["patterns noticed in this exchange"],
    "comparisonToPrevious": "how this compares to previous exchanges",
    "developmentalThemes": "growth or regression themes",
    "systemicConnections": "connections to broader life patterns"
  },
  "suggestions": ["2-3 alternative exploration directions based on ${perspective} approach"]
}`;

    return basePrompt;
  }

  /**
   * Get system prompt for "new direction" responses
   */
  getNewDirectionSystemPrompt(): string {
    return `You are an expert therapeutic AI designed to help users explore their thoughts and emotions from completely new perspectives. 

When generating a "new direction" response:

1. **Creative Reframing Techniques**:
   - Use metaphors and analogies from nature, art, or science
   - Apply somatic awareness ("What would your body say about this?")
   - Explore spiritual or philosophical dimensions
   - Use timeline work ("What would 80-year-old you say?")
   - Apply archetypal or mythological frameworks

2. **Alternative Modalities**:
   - Gestalt therapy techniques (empty chair, parts work)
   - Narrative therapy (story reauthoring)
   - Art therapy concepts (colors, shapes, movement)
   - Family systems approaches (relationships, roles)
   - Existential questions (meaning, purpose, mortality)

3. **Unconventional Perspectives**:
   - "What would someone who loves you unconditionally see?"
   - "If this situation were a gift, what would it be teaching you?"
   - "What story does your resistance tell?"
   - "How might this serve your highest growth?"
   - "What would courage look like here?"

4. **Embodied Approaches**:
   - "What does your intuition know that your mind doesn't?"
   - "If your heart could speak, what would it say?"
   - "What would healing feel like in your body?"
   - "Where is your energy blocked or flowing?"

RESPONSE FORMAT (JSON):
{
  "analysis": {
    "professionalAnalysis": "Brief assessment using the new direction approach",
    "newPerspective": "The alternative angle you're taking",
    "potentialBreakthroughs": "Areas where this new direction might lead to insights",
    "creativityRationale": "Why this specific approach might be helpful"
  },
  "question": "A single, powerful question from this completely new direction",
  "emotionalAssessment": {
    "primaryEmotion": "detected emotion",
    "underlyingEmotions": ["secondary emotions"],
    "emotionalComplexity": "assessment of emotional layers",
    "energeticQuality": "the energy or movement present"
  },
  "emotionalState": {
    "primaryEmotion": "primary emotion detected",
    "intensity": 0.0-1.0,
    "clarity": 0.0-1.0
  },
  "patternInsights": {
    "newPatternsPotential": "What new patterns this direction might reveal",
    "alternativeFrameworks": ["Different ways to view their situation"],
    "unexploredTerritory": "Areas not yet examined in their exploration"
  },
  "suggestions": ["Alternative exploration topics using creative approaches"]
}`;
  }

  /**
   * Get system prompt for customized responses
   */
  getCustomizationSystemPrompt(mode: string, tone: string, perspective: string, customInstructions: string): string {
    return `You are a therapeutic AI that adapts responses based on specific customization requests.

CURRENT CUSTOMIZATION SETTINGS:
- Mode: ${mode}
- Tone: ${tone}  
- Perspective: ${perspective}
- Custom instructions: ${customInstructions}

PERSPECTIVE-SPECIFIC APPROACHES:

**Psychologist**: Focus on clinical assessment, diagnostic patterns, therapeutic interventions, evidence-based approaches
**Life Coach**: Emphasize goal-setting, action steps, accountability, strengths-based solutions, future-focused thinking
**CBT Therapist**: Target thought patterns, cognitive distortions, behavioral connections, homework assignments, skill-building
**Philosopher**: Explore meaning, values, existential questions, ethical dimensions, wisdom traditions
**Stoic**: Apply stoic principles of acceptance, virtue, emotional regulation, perspective-taking, resilience

TONE ADAPTATIONS:
**Supportive**: Warm, encouraging, validating, nurturing, confidence-building
**Challenging**: Direct, provocative, confrontational (respectfully), growth-pushing, assumption-questioning
**Neutral**: Balanced, objective, clinical, non-directive, exploratory
**Empathetic**: Deeply understanding, emotionally attuned, compassionate, validating

MODE ADJUSTMENTS:
**Conversational**: Natural, flowing, collaborative, less structured, organic development
**Therapeutic**: Structured, session-like, goal-oriented, techniques-focused, professional boundaries
**Analytical**: Systematic, detailed, research-oriented, pattern-focused, comprehensive assessment

Regenerate your response to the user's writing using these specific parameters. Maintain therapeutic value while adapting to the requested style.

RESPONSE FORMAT (JSON):
{
  "analysis": {
    "professionalAnalysis": "Analysis tailored to the ${perspective} perspective with ${tone} tone",
    "customizationApplication": "How you applied the requested customizations",
    "perspectiveRationale": "Why this perspective is helpful for this user's situation"
  },
  "question": "Question reflecting the requested ${tone} tone and ${perspective} perspective in ${mode} mode",
  "emotionalAssessment": {
    "primaryEmotion": "detected emotion",
    "responseToCustomization": "How customization affects emotional exploration",
    "therapeuticFit": "How well this approach matches the user's needs"
  },
  "emotionalState": {
    "primaryEmotion": "primary emotion",
    "intensity": 0.0-1.0,
    "clarity": 0.0-1.0
  },
  "patternInsights": {
    "customizedInsights": "Insights from the specified ${perspective} perspective",
    "approachEffectiveness": "How this customized approach might be most helpful"
  }
}`;
  }

  /**
   * Get therapeutic frameworks data
   */
  getFrameworks(): TherapeuticFramework[] {
    return [
      {
        name: "Socratic Questioning",
        description: "Guides users to discover insights through carefully crafted questions",
        questioningStyle: [
          "What evidence supports this belief?",
          "How might someone else view this situation?",
          "What assumptions are you making here?",
          "What would happen if the opposite were true?"
        ],
        focusAreas: ["Critical thinking", "Assumption challenging", "Self-discovery", "Perspective-taking"],
        techniques: ["Evidence examination", "Alternative perspectives", "Assumption testing", "Logical analysis"]
      },
      {
        name: "Cognitive Behavioral Therapy",
        description: "Identifies thought patterns, cognitive distortions, and behavioral connections",
        questioningStyle: [
          "What thoughts went through your mind when this happened?",
          "How did that thought make you feel?",
          "What evidence contradicts this thought?",
          "How might you think about this differently?"
        ],
        focusAreas: ["Thought patterns", "Emotional regulation", "Behavioral change", "Cognitive restructuring"],
        techniques: ["Thought records", "Behavioral experiments", "Cognitive restructuring", "Mindfulness"]
      },
      {
        name: "Solution-Focused Therapy",
        description: "Helps users identify strengths and resources they already possess",
        questioningStyle: [
          "When has this been different for you?",
          "What small step could you take toward change?",
          "What strengths have helped you before?",
          "How will you know things are improving?"
        ],
        focusAreas: ["Strengths identification", "Exception finding", "Goal setting", "Resource mobilization"],
        techniques: ["Miracle question", "Exception finding", "Scaling questions", "Strength identification"]
      },
      {
        name: "Emotional Regulation",
        description: "Helps users understand and process complex emotional states",
        questioningStyle: [
          "What emotion is underneath this feeling?",
          "Where do you feel this in your body?",
          "What does this emotion need you to know?",
          "How does this feeling serve you?"
        ],
        focusAreas: ["Emotional awareness", "Body sensation", "Emotional intelligence", "Self-compassion"],
        techniques: ["Emotion labeling", "Body scanning", "Emotional validation", "Self-soothing"]
      },
      {
        name: "Mindfulness-Based",
        description: "Guides attention to current experience and present-moment awareness",
        questioningStyle: [
          "What are you noticing right now?",
          "How does this feel in your body?",
          "What thoughts are arising as you explore this?",
          "Can you sit with this feeling without changing it?"
        ],
        focusAreas: ["Present moment", "Non-judgmental awareness", "Acceptance", "Mindful observation"],
        techniques: ["Mindful breathing", "Body awareness", "Thought observation", "Acceptance practices"]
      },
      {
        name: "Gestalt Therapy",
        description: "Focuses on present-moment experience and holistic awareness",
        questioningStyle: [
          "What are you aware of right now?",
          "How do you experience this in your body?",
          "What wants to emerge for you?",
          "What are you avoiding or pushing away?"
        ],
        focusAreas: ["Present moment", "Holistic awareness", "Contact and boundaries", "Organismic wisdom"],
        techniques: ["Empty chair", "Two-chair work", "Contact experiments", "Awareness exercises"]
      }
    ];
  }

  /**
   * Get questioning strategies for specific emotions
   */
  getEmotionalQuestioningStrategies(emotion: string): string[] {
    const strategies: Record<string, string[]> = {
      anger: [
        "What boundary might have been crossed here?",
        "What need isn't being met that's underneath this anger?",
        "How might this anger be protecting you?",
        "What would you want to say if you felt completely safe?"
      ],
      sadness: [
        "What loss are you grieving?",
        "What does this sadness want you to know?",
        "How might honoring this feeling serve you?",
        "What comfort do you need right now?"
      ],
      fear: [
        "What specifically are you afraid might happen?",
        "What would you do if you knew you were completely safe?",
        "How has this fear protected you in the past?",
        "What would courage look like in this situation?"
      ],
      anxiety: [
        "What are you trying to control that's outside your control?",
        "What would happen if you trusted yourself to handle whatever comes?",
        "How might your body be asking you to slow down?",
        "What would peace feel like right now?"
      ],
      confusion: [
        "What clarity are you seeking?",
        "What would help you trust your inner knowing?",
        "What decision are you avoiding making?",
        "How might this confusion be serving you?"
      ],
      shame: [
        "What story are you telling yourself about who you are?",
        "How would someone who loves you unconditionally see this?",
        "What would self-compassion sound like right now?",
        "What would you say to a dear friend in this situation?"
      ]
    };

    return strategies[emotion.toLowerCase()] || [
      "What is this emotion trying to tell you?",
      "How might you honor this feeling?",
      "What do you need most right now?",
      "How can you be gentle with yourself in this moment?"
    ];
  }

  /**
   * Get perspective-specific question starters
   */
  getPerspectiveQuestions(perspective: string): string[] {
    const questions: Record<string, string[]> = {
      psychologist: [
        "From a psychological perspective, what patterns do you notice?",
        "How might this relate to your attachment style or early experiences?",
        "What defense mechanisms might be at play here?",
        "How does this fit into your overall mental health picture?"
      ],
      life_coach: [
        "What outcome would you most like to create?",
        "What's one small action you could take today?",
        "How does this align with your values and goals?",
        "What resources do you already have to address this?"
      ],
      cbt_therapist: [
        "What thoughts automatically come up in this situation?",
        "How might you challenge this thinking pattern?",
        "What evidence supports or contradicts this belief?",
        "What behavioral experiment could you try?"
      ],
      philosopher: [
        "What does this experience teach you about the human condition?",
        "How might this challenge contribute to your wisdom?",
        "What meaning are you making from this situation?",
        "How does this connect to your deeper values and purpose?"
      ],
      stoic: [
        "What aspects of this situation are within your control?",
        "How might you practice virtue in response to this challenge?",
        "What would Marcus Aurelius or Epictetus say about this?",
        "How can you use this difficulty as training for resilience?"
      ]
    };

    return questions[perspective] || [
      "What perspective might be most helpful right now?",
      "How would you like to approach this exploration?",
      "What framework resonates most with you?",
      "What kind of support would be most valuable?"
    ];
  }
}

export const therapeuticFrameworks = new TherapeuticFrameworks();