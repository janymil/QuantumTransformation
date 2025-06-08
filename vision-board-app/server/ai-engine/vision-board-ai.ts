import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface UserData {
  id: string;
  journalEntries?: Array<{
    content: string;
    challengeType: string;
    createdAt: string;
  }>;
  affirmations?: Array<{
    content: string;
    category: string;
  }>;
  goals?: Array<{
    description: string;
    category: string;
  }>;
  progress?: Array<{
    challengeType: string;
    completedDays: number;
    totalDays: number;
  }>;
  preferences?: {
    communicationStyle?: string;
    primaryGoals?: string[];
    healingReadiness?: number;
  };
}

export interface LifeAreaSuggestion {
  area: string;
  reason: string;
  priority: number;
  specificGoals: string[];
}

export interface VisionBoardDesign {
  title: string;
  description: string;
  lifeAreas: string[];
  images: Array<{
    description: string;
    lifeArea: string;
    emotionalIntent: string;
    searchKeywords: string[];
  }>;
  affirmations: Array<{
    content: string;
    lifeArea: string;
    emotionalTone: string;
    personalizedReason: string;
  }>;
  backgroundColor: string;
  overallTheme: string;
}

export interface PersonalizedAffirmation {
  content: string;
  lifeArea: string;
  emotionalTone: string;
  reasoning: string;
  userLanguagePattern: string;
}

export class VisionBoardAI {
  
  /**
   * Analyze user data and suggest 3 most relevant life areas
   */
  async suggestLifeAreas(userData: UserData): Promise<LifeAreaSuggestion[]> {
    const prompt = `You are an expert manifestation coach analyzing user data to suggest the 3 most impactful life areas for transformation.

User Data Analysis:
${this.formatUserData(userData)}

Analyze this data and suggest exactly 3 life areas from: health, finances, relationships, career, spirituality, personal_growth

For each area, provide:
- Strong reasoning based on their actual data
- Specific goals derived from their writings
- Priority ranking (1-3)

Respond in JSON format:
{
  "suggestions": [
    {
      "area": "finances",
      "reason": "User frequently mentions money stress in journal entries",
      "priority": 1,
      "specificGoals": ["Achieve financial freedom", "Reduce money anxiety"]
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.suggestions || [];
    } catch (error) {
      console.error('Error suggesting life areas:', error);
      throw new Error('Failed to analyze user data for life area suggestions');
    }
  }

  /**
   * Generate complete personalized vision board design
   */
  async generateVisionBoardDesign(
    userData: UserData, 
    selectedLifeAreas: string[]
  ): Promise<VisionBoardDesign> {
    const prompt = `You are an expert vision board designer and manifestation coach. Create a deeply personalized vision board design.

User Personal Data:
${this.formatUserData(userData)}

Selected Life Areas: ${selectedLifeAreas.join(', ')}

Create a comprehensive vision board design with:

1. PERSONALIZED IMAGES (3 per life area, max 9 total):
   - Base descriptions on their actual goals and desires from their data
   - Include specific emotional intent for each image
   - Provide search keywords for image generation

2. PERSONALIZED AFFIRMATIONS:
   - Use their communication style and language patterns
   - Address their specific challenges mentioned in journals
   - Create 2-3 affirmations per life area

3. OVERALL DESIGN:
   - Cohesive theme that resonates with their personality
   - Appropriate color scheme
   - Emotional impact focus

Respond in JSON format:
{
  "title": "Your Personal Vision",
  "description": "Brief inspiring description",
  "lifeAreas": ["finances", "health"],
  "images": [
    {
      "description": "Specific image description based on user goals",
      "lifeArea": "finances",
      "emotionalIntent": "confidence and abundance",
      "searchKeywords": ["financial freedom", "abundance", "success"]
    }
  ],
  "affirmations": [
    {
      "content": "Money flows to me easily and abundantly",
      "lifeArea": "finances", 
      "emotionalTone": "confident",
      "personalizedReason": "Addresses user's money stress patterns"
    }
  ],
  "backgroundColor": "#f8f9fa",
  "overallTheme": "Peaceful abundance and growth"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result;
    } catch (error) {
      console.error('Error generating vision board design:', error);
      throw new Error('Failed to generate personalized vision board design');
    }
  }

  /**
   * Create personalized affirmations based on user's language patterns
   */
  async createPersonalizedAffirmations(
    userData: UserData,
    lifeArea: string,
    count: number = 3
  ): Promise<PersonalizedAffirmation[]> {
    const prompt = `Create ${count} deeply personalized affirmations for the life area: ${lifeArea}

User Data Analysis:
${this.formatUserData(userData)}

Requirements:
- Use their natural communication style and vocabulary
- Address their specific challenges and goals
- Create emotional resonance based on their personality
- Ensure affirmations feel authentic, not generic

Respond in JSON format:
{
  "affirmations": [
    {
      "content": "Personalized affirmation in their style",
      "lifeArea": "${lifeArea}",
      "emotionalTone": "confident/grateful/excited",
      "reasoning": "Why this affirmation fits their specific needs",
      "userLanguagePattern": "Matches their communication style"
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.affirmations || [];
    } catch (error) {
      console.error('Error creating personalized affirmations:', error);
      throw new Error('Failed to create personalized affirmations');
    }
  }

  /**
   * Generate personalized evening reflection question
   */
  async generateReflectionQuestion(
    userData: UserData,
    lifeAreas: string[]
  ): Promise<string> {
    const prompt = `Generate a personalized evening reflection question based on user's journey and selected life areas.

User Context:
${this.formatUserData(userData)}

Life Areas Focus: ${lifeAreas.join(', ')}

Create a thoughtful question that:
- Connects to their specific goals and challenges
- Encourages positive reflection
- Builds on their current progress
- Feels personally relevant

Respond with just the question text, no JSON.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.choices[0].message.content?.trim() || 
        "What progress did you make today toward your goals?";
    } catch (error) {
      console.error('Error generating reflection question:', error);
      return "What progress did you make today toward your goals?";
    }
  }

  /**
   * Analyze evening reflection response for insights
   */
  async analyzeReflection(
    reflectionResponse: string,
    userData: UserData
  ): Promise<string> {
    const prompt = `Analyze this evening reflection response and provide encouraging insights.

User's Reflection: "${reflectionResponse}"

User Context:
${this.formatUserData(userData)}

Provide 2-3 sentences of:
- Positive acknowledgment of their progress
- Gentle insight or pattern recognition
- Encouraging forward momentum

Keep tone warm, supportive, and personally relevant.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.choices[0].message.content?.trim() || 
        "Your reflection shows beautiful awareness and commitment to growth.";
    } catch (error) {
      console.error('Error analyzing reflection:', error);
      return "Your reflection shows beautiful awareness and commitment to growth.";
    }
  }

  /**
   * Format user data for AI prompts
   */
  private formatUserData(userData: UserData): string {
    let formatted = `User ID: ${userData.id}\n`;

    if (userData.journalEntries?.length) {
      formatted += `\nRecent Journal Entries:\n`;
      userData.journalEntries.slice(0, 5).forEach((entry, i) => {
        formatted += `${i + 1}. [${entry.challengeType}] ${entry.content.substring(0, 200)}...\n`;
      });
    }

    if (userData.affirmations?.length) {
      formatted += `\nUser's Affirmations:\n`;
      userData.affirmations.forEach((aff, i) => {
        formatted += `${i + 1}. [${aff.category}] ${aff.content}\n`;
      });
    }

    if (userData.goals?.length) {
      formatted += `\nUser's Goals:\n`;
      userData.goals.forEach((goal, i) => {
        formatted += `${i + 1}. [${goal.category}] ${goal.description}\n`;
      });
    }

    if (userData.progress?.length) {
      formatted += `\nProgress Status:\n`;
      userData.progress.forEach(prog => {
        formatted += `- ${prog.challengeType}: ${prog.completedDays}/${prog.totalDays} days\n`;
      });
    }

    if (userData.preferences) {
      formatted += `\nUser Preferences:\n`;
      if (userData.preferences.communicationStyle) {
        formatted += `- Communication Style: ${userData.preferences.communicationStyle}\n`;
      }
      if (userData.preferences.primaryGoals?.length) {
        formatted += `- Primary Goals: ${userData.preferences.primaryGoals.join(', ')}\n`;
      }
      if (userData.preferences.healingReadiness) {
        formatted += `- Healing Readiness: ${userData.preferences.healingReadiness}/10\n`;
      }
    }

    return formatted;
  }
}