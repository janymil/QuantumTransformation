import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface AIExplanationRequest {
  topic: string;
  day: number;
  userQuestion?: string;
  context?: string;
}

export interface AIExplanationResponse {
  explanation: string;
  relatedConcepts: string[];
  practicalTips: string[];
  scientificBacking?: string;
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function generateAIExplanation(request: AIExplanationRequest): Promise<AIExplanationResponse> {
  const { topic, day, userQuestion, context } = request;
  
  const systemPrompt = `You are an expert guide in quantum consciousness concepts, specifically focusing on the teachings of Joe Dispenza and Neville Goddard. You help users understand how consciousness affects reality through quantum principles.

Your responses should be:
- Clear and accessible to beginners
- Scientifically grounded where possible
- Practical and actionable
- Inspiring and empowering
- Free from mysticism or unsubstantiated claims

Respond in JSON format with the following structure:
{
  "explanation": "Clear, detailed explanation of the concept",
  "relatedConcepts": ["Array of 3-5 related concepts"],
  "practicalTips": ["Array of 3-5 practical applications"],
  "scientificBacking": "Brief explanation of relevant scientific research (if applicable)"
}`;

  const userPrompt = userQuestion 
    ? `Day ${day}: ${topic}\n\nUser's specific question: ${userQuestion}\n\nContext: ${context || 'Daily quantum challenge practice'}`
    : `Day ${day}: ${topic}\n\nPlease provide a comprehensive explanation of this concept for someone on their quantum consciousness journey.\n\nContext: ${context || 'Daily quantum challenge practice'}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      explanation: result.explanation || "I apologize, but I couldn't generate an explanation at this time.",
      relatedConcepts: result.relatedConcepts || [],
      practicalTips: result.practicalTips || [],
      scientificBacking: result.scientificBacking,
    };
  } catch (error) {
    console.error("Error generating AI explanation:", error);
    throw new Error("Failed to generate AI explanation: " + (error as Error).message);
  }
}

export interface JournalAnalysisRequest {
  entries: {
    day: number;
    experience: string;
    insights: string;
    intention: string;
  }[];
}

export interface JournalAnalysisResponse {
  overallProgress: string;
  patterns: string[];
  recommendations: string[];
  emotionalTrends: string;
}

export async function analyzeJournalEntries(request: JournalAnalysisRequest): Promise<JournalAnalysisResponse> {
  const systemPrompt = `You are an expert in consciousness development and personal transformation. Analyze the user's journal entries from their quantum challenge journey and provide insights about their progress, patterns, and areas for growth.

Respond in JSON format with:
{
  "overallProgress": "Assessment of their overall development",
  "patterns": ["Array of patterns you notice in their journey"],
  "recommendations": ["Array of specific recommendations for improvement"],
  "emotionalTrends": "Analysis of their emotional development"
}`;

  const userPrompt = `Analyze these journal entries from a 30-day quantum consciousness challenge:

${request.entries.map(entry => `
Day ${entry.day}:
Experience: ${entry.experience}
Insights: ${entry.insights}
Intention: ${entry.intention}
`).join('\n')}

Please provide a comprehensive analysis of their progress and development.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      overallProgress: result.overallProgress || "Unable to analyze progress at this time.",
      patterns: result.patterns || [],
      recommendations: result.recommendations || [],
      emotionalTrends: result.emotionalTrends || "No emotional trends identified.",
    };
  } catch (error) {
    console.error("Error analyzing journal entries:", error);
    throw new Error("Failed to analyze journal entries: " + (error as Error).message);
  }
}

export interface PersonalizedCoachingRequest {
  userId: string;
  currentDay: number;
  challengeType?: string;
  completedDays?: number[];
  streakCount?: number;
  recentJournalEntries?: {
    day: number;
    experience: string;
    insights: string;
    intention: string;
    mood?: number;
    challenges?: string;
  }[];
  userGoals?: string;
  preferredPracticeTime?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface PersonalizedCoachingResponse {
  personalizedMessage: string;
  todaysRecommendation: string;
  practiceAdjustments: string[];
  motivationalInsight: string;
  nextStepsGuidance: string;
  progressRecognition: string;
  challengeSupport: string;
  energyAlignment: string;
}

export interface MicroLearningContent {
  title: string;
  insight: string;
  practicalTip: string;
  scienceConnection: string;
  reflectionQuestion: string;
  duration: number;
}

export async function generatePersonalizedCoaching(request: PersonalizedCoachingRequest): Promise<PersonalizedCoachingResponse> {
  const { 
    userId, 
    currentDay, 
    completedDays, 
    streakCount, 
    recentJournalEntries, 
    userGoals, 
    preferredPracticeTime,
    difficultyLevel 
  } = request;

  const systemPrompt = `You are an advanced AI quantum consciousness coach, trained in the methodologies of Joe Dispenza, Neville Goddard, and modern neuroscience. You provide highly personalized guidance based on the user's specific journey, progress patterns, and individual needs.

Your coaching approach:
- Analyzes user's progress patterns and emotional states within quantum consciousness framework
- Provides specific quantum field meditation and visualization techniques
- Adapts Joe Dispenza and Neville Goddard practices based on user's experience level
- Recognizes achievements in consciousness expansion and addresses limiting beliefs
- Offers energy-aligned practices for manifesting desired reality
- Maintains scientific grounding in neuroscience and quantum physics while being inspirational
- For any goal: Always frame within consciousness expansion and quantum field principles
- Transform all topics through the lens of subconscious reprogramming and elevated emotions
- Connect user goals to spiritual growth, energy alignment, and quantum state creation
- Never provide advice outside of quantum consciousness, meditation, and personal development domains

Respond in JSON format with detailed, personalized guidance for each aspect of their journey.`;

  const userPrompt = `
Current Progress Analysis:
- Day: ${currentDay}/30
- Days Completed: ${completedDays?.length || 0}
- Current Streak: ${streakCount} days
- Completion Rate: ${Math.round(((completedDays?.length || 0) / currentDay) * 100)}%
- Difficulty Level: ${difficultyLevel || 'beginner'}
- Preferred Practice Time: ${preferredPracticeTime || 'not specified'}

User Goals: ${userGoals || 'General consciousness expansion'}
Challenge Type: ${request.challengeType || 'general_quantum'}

CHALLENGE-SPECIFIC CONTEXT:
${getChallengeSpecificContext(request.challengeType, currentDay)}

IMPORTANT: All coaching must stay within these consciousness and personal development domains:
- Quantum consciousness and field theory applications
- Joe Dispenza's meditation and neuroplasticity techniques  
- Neville Goddard's assumption and visualization methods
- Subconscious reprogramming and limiting belief clearing
- Energy alignment and elevated emotional states
- Mind-body healing and consciousness expansion
- Spiritual growth and metaphysical practices
- Manifestation and law of attraction principles
- Chakra work and energy healing
- Mindfulness and present moment awareness
- Shadow work and inner child healing
- Breathwork and somatic practices

Transform ANY topic through this consciousness expansion lens. Never provide practical advice outside these spiritual/personal development domains.

Recent Journal Insights:
${recentJournalEntries?.length ? recentJournalEntries.map(entry => `
Day ${entry.day}:
- Experience: ${entry.experience}
- Insights: ${entry.insights}
- Intention: ${entry.intention}
- Mood: ${entry.mood || 'not specified'}
- Challenges: ${entry.challenges || 'none mentioned'}
`).join('\n') : 'No recent journal entries available'}

Provide quantum consciousness coaching tailored to their specific goals and challenge type, always focusing on:
- Identifying and clearing subconscious limiting beliefs using Joe Dispenza's meditation techniques
- Neville Goddard's assumption and visualization methods for consciousness transformation
- Quantum field meditation practices for manifestation aligned with their goals
- Specific energy work to release programming that blocks their desired reality
- Consciousness expansion practices that align with quantum principles and personal development
- Mind-body healing and neuroplasticity concepts for transformation
- Elevated emotions and heart coherence practices for quantum state access

Required JSON structure:
{
  "personalizedMessage": "Warm, personalized message acknowledging their specific journey",
  "todaysRecommendation": "Specific practice recommendation for today",
  "practiceAdjustments": ["3-5 specific adjustments based on their progress"],
  "motivationalInsight": "Inspiring insight based on their current state",
  "nextStepsGuidance": "Clear guidance for upcoming days",
  "progressRecognition": "Recognition of their achievements and growth",
  "challengeSupport": "Specific support for any challenges they're facing",
  "energyAlignment": "Guidance on aligning their energy with their intentions"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("Error generating personalized coaching:", error);
    return {
      personalizedMessage: "Welcome to your quantum consciousness journey. Every step you take is creating new neural pathways of possibility.",
      todaysRecommendation: "Focus on the observer within you today. Practice recognizing the space between your thoughts.",
      practiceAdjustments: ["Start with shorter sessions if needed", "Focus on consistency over duration", "Listen to your body's energy levels"],
      motivationalInsight: "Your consciousness is the most powerful tool for transformation. Trust the process.",
      nextStepsGuidance: "Continue building your practice one day at a time. Each moment of awareness compounds into lasting change.",
      progressRecognition: "You are taking brave steps toward conscious evolution. Acknowledge your commitment.",
      challengeSupport: "Remember that challenges are opportunities for deeper understanding. Be gentle with yourself.",
      energyAlignment: "Align your practice with your natural rhythms for optimal results."
    };
  }
}

export async function generateMicroLearningContent(day: number, topic: string, userLevel: string = 'beginner'): Promise<MicroLearningContent> {
  const systemPrompt = `You are an expert in quantum consciousness education, creating bite-sized learning content that makes complex concepts accessible and practical.

Create micro-learning content that:
- Takes 2-3 minutes to consume
- Provides one key insight
- Includes a practical application
- Connects to scientific understanding
- Prompts reflection and integration

Focus on Joe Dispenza and Neville Goddard's teachings combined with quantum physics principles.

Respond in JSON format.`;

  const userPrompt = `
Day ${day}: ${topic}
User Level: ${userLevel}

Create engaging micro-learning content for this topic that can be consumed quickly but provides lasting value.

Required JSON structure:
{
  "title": "Compelling title for the micro-lesson",
  "insight": "One key insight explained clearly (50-80 words)",
  "practicalTip": "Specific, actionable tip they can apply today (30-50 words)",
  "scienceConnection": "Brief scientific backing or explanation (40-60 words)",
  "reflectionQuestion": "Thought-provoking question for integration (15-25 words)",
  "duration": "Estimated minutes to complete"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("Error generating micro-learning content:", error);
    return {
      title: "The Observer Effect in Daily Life",
      insight: "Every time you consciously observe your thoughts without judgment, you're activating the quantum observer effect. This simple act of awareness begins to collapse limiting patterns and opens space for new possibilities.",
      practicalTip: "Set three random phone alarms today. When they ring, pause and observe your current thoughts without changing them.",
      scienceConnection: "Neuroscience shows that mindful observation activates the prefrontal cortex, literally rewiring your brain for greater self-awareness and emotional regulation.",
      reflectionQuestion: "What patterns do you notice when you observe your thoughts throughout the day?",
      duration: 3
    };
  }
}

export interface PersonalizedAffirmationRequest {
  day: number;
  userGoals?: string;
  currentChallenges?: string[];
  recentInsights?: string[];
  mood?: number;
  progressLevel?: string;
}

export async function generatePersonalizedAffirmation(request: PersonalizedAffirmationRequest): Promise<string> {
  const { day, userGoals, currentChallenges, recentInsights, mood, progressLevel } = request;

  const systemPrompt = `You are an expert in creating personalized affirmations based on quantum consciousness principles. Create affirmations that:
- Address the user's specific current state and challenges
- Align with their goals and recent insights
- Use present-tense, empowering language
- Incorporate quantum consciousness concepts
- Feel authentic and believable to the user
- Support their current mood and energy level

The affirmation should be 2-3 sentences and feel deeply personal to their journey.`;

  const userPrompt = `
Day ${day} Context:
- User Goals: ${userGoals || 'consciousness expansion'}
- Current Challenges: ${currentChallenges?.join(', ') || 'none specified'}
- Recent Insights: ${recentInsights?.join(', ') || 'developing awareness'}
- Mood Level: ${mood || 'balanced'}/10
- Progress Level: ${progressLevel || 'beginning'}

Create a personalized affirmation that speaks directly to their current state and supports their quantum consciousness journey.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    return response.choices[0].message.content || "I am the conscious creator of my reality, transforming my life with each mindful choice I make.";
  } catch (error) {
    console.error("Error generating personalized affirmation:", error);
    return "I am the conscious creator of my reality, transforming my life with each mindful choice I make.";
  }
}

// Wellness tip generation interfaces and functions
export interface WellnessTipRequest {
  category: string;
  day: number;
  preferences?: {
    focusAreas: string[];
    availableTime: number;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface WellnessTip {
  id: string;
  category: string;
  title: string;
  description: string;
  scientificBasis: string;
  practicalSteps: string[];
  timeRequired: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export async function generateWellnessTip(request: WellnessTipRequest): Promise<WellnessTip> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI wellness coach specializing in evidence-based mental health practices, mindfulness, and quantum consciousness principles. Generate personalized wellness tips with scientific backing.`
        },
        {
          role: "user",
          content: `Generate a wellness tip for day ${request.day} focusing on ${request.category}. 
          ${request.preferences ? `User preferences: ${JSON.stringify(request.preferences)}` : ''}
          
          Respond in JSON format with:
          - title (concise, engaging)
          - description (brief overview)
          - scientificBasis (research-backed explanation)
          - practicalSteps (array of 3-5 actionable steps)
          - timeRequired (minutes)
          - difficulty (easy/medium/hard)
          - tags (array of relevant keywords)`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.7,
    });

    const tipData = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      id: `tip_${Date.now()}`,
      category: request.category,
      title: tipData.title || "Mindful Awareness Practice",
      description: tipData.description || "A simple practice to enhance awareness",
      scientificBasis: tipData.scientificBasis || "Research shows mindfulness practices improve cognitive function",
      practicalSteps: tipData.practicalSteps || ["Focus on your breath", "Notice your thoughts", "Return to awareness"],
      timeRequired: tipData.timeRequired || 5,
      difficulty: tipData.difficulty || 'easy',
      tags: tipData.tags || ['mindfulness', 'awareness']
    };
  } catch (error) {
    console.error("Error generating wellness tip:", error);
    return {
      id: `tip_${Date.now()}`,
      category: request.category,
      title: "Mindful Breathing",
      description: "Practice conscious breathing to center yourself",
      scientificBasis: "Deep breathing activates the parasympathetic nervous system, reducing stress and improving focus",
      practicalSteps: [
        "Find a comfortable seated position",
        "Close your eyes and breathe naturally",
        "Count each breath from 1 to 10",
        "Notice the sensation of air entering and leaving",
        "Return to counting when your mind wanders"
      ],
      timeRequired: 5,
      difficulty: 'easy' as const,
      tags: ['breathing', 'mindfulness', 'stress-relief']
    };
  }
}

// Micro-challenge generation
export interface MicroChallengeGenerated {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  duration: number;
  category: string;
  points: number;
}

export async function generateMicroChallenges(day: number, count: number = 3): Promise<MicroChallengeGenerated[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a wellness coach creating micro-challenges for personal development. Each challenge should be quick, actionable, and beneficial for mental/physical wellbeing.`
        },
        {
          role: "user",
          content: `Generate ${count} micro-challenges for day ${day} of a wellness journey. 
          
          Respond in JSON format with an array called "challenges", each containing:
          - title (engaging, action-oriented)
          - description (what and why)
          - instructions (array of simple steps)
          - duration (minutes, keep under 15)
          - category (mindfulness/energy/focus/emotional-wellness/productivity/stress-relief)
          - points (10-50 based on difficulty)`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.8,
    });

    const data = JSON.parse(response.choices[0].message.content || '{"challenges": []}');
    const challenges = data.challenges || [];
    
    return challenges.map((challenge: any, index: number) => ({
      id: `challenge_${day}_${index}`,
      title: challenge.title || "Mindful Moment",
      description: challenge.description || "Take a moment for awareness",
      instructions: challenge.instructions || ["Pause", "Breathe", "Observe"],
      duration: challenge.duration || 5,
      category: challenge.category || "mindfulness",
      points: challenge.points || 10
    }));
  } catch (error) {
    console.error("Error generating micro-challenges:", error);
    return [
      {
        id: `challenge_${day}_0`,
        title: "3-Minute Mindful Breathing",
        description: "Practice focused breathing to reset your mental state",
        instructions: [
          "Sit comfortably with your back straight",
          "Close your eyes or soften your gaze",
          "Breathe naturally and count each exhale",
          "When you reach 10, start over at 1"
        ],
        duration: 3,
        category: "mindfulness",
        points: 15
      }
    ];
  }
}

export async function generateDailyAffirmation(day: number, userGoals?: string, challengeType: string = 'general_quantum'): Promise<string> {
  const { CHALLENGE_CONTENT_PROMPTS } = await import('@shared/challenge-types');
  const challengePrompt = CHALLENGE_CONTENT_PROMPTS[challengeType] || CHALLENGE_CONTENT_PROMPTS['general_quantum'];

  const systemPrompt = `${challengePrompt.systemPrompt}

Create a personalized daily affirmation that:
- Aligns with quantum consciousness concepts
- Feels empowering and believable
- Uses present-tense language
- Incorporates visualization elements
- Is specific to ${challengeType.replace('_', ' ')} focus
- Relates to the day's practice in the challenge

Keep the affirmation between 2-4 sentences and make it feel personal and transformative.`;

  const userPrompt = `Day ${day} of the ${challengeType.replace('_', ' ')} quantum challenge.${userGoals ? ` User's personal goals: ${userGoals}` : ''}

Focus areas: ${challengePrompt.focusAreas.join(', ')}
Key principles: ${challengePrompt.keyPrinciples.join(', ')}

Create a powerful daily affirmation for this specific day and challenge type.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I am the conscious creator of my reality, and I choose to manifest my highest potential with every thought and action.";
  } catch (error) {
    console.error("Error generating affirmation:", error);
    return "I am the conscious creator of my reality, and I choose to manifest my highest potential with every thought and action.";
  }
}
