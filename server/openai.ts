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

export async function generateDailyAffirmation(day: number, userGoals?: string): Promise<string> {
  const systemPrompt = `Generate a powerful, personalized daily affirmation based on quantum consciousness principles and the teachings of Joe Dispenza and Neville Goddard. The affirmation should be:
- Present tense and positive
- Emotionally resonant
- Aligned with quantum field principles
- Inspiring and empowering`;

  const userPrompt = `Create a daily affirmation for Day ${day} of the quantum challenge.${userGoals ? ` The user's goals: ${userGoals}` : ''}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    return response.choices[0].message.content || "I am the conscious creator of my reality, and I choose thoughts that serve my highest good.";
  } catch (error) {
    console.error("Error generating affirmation:", error);
    return "I am the conscious creator of my reality, and I choose thoughts that serve my highest good.";
  }
}
