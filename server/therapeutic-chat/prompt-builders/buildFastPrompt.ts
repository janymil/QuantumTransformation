/**
 * Fast Prompt Builder for Therapeutic Chat
 * Generates optimized GPT-4o prompts for rapid psychological responses
 */

export interface MemorySnippet {
  content: string;
  relevanceScore: number;
  context: string;
}

export interface UserInsights {
  framework: string;
  tone: string;
  state: string;
  themes: string[];
}

export interface FastPromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Build a fast therapeutic prompt for GPT-4o
 * Optimized for speed and psychological accuracy
 */
export function buildFastPrompt(
  entryText: string,
  memorySnippets: MemorySnippet[] = [],
  insights: UserInsights | null = null
): FastPromptMessage[] {
  
  // Step 1: Build comprehensive system message
  const systemMessage = buildSystemMessage(insights);
  
  // Step 2: Build user prompt with context
  const userPrompt = buildUserPrompt(entryText, memorySnippets, insights);
  
  return [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userPrompt }
  ];
}

/**
 * Build the system message with therapeutic framework context
 */
function buildSystemMessage(insights: UserInsights | null): string {
  let baseSystem = "You are a therapeutic journaling AI trained in psychology, trauma recovery, and motivation coaching. Respond with a 2–3 sentence reflection and 1 follow-up question. Use insights from CBT, ACT, mindfulness, and human emotion. Do not use vague replies like 'I understand.' Be specific.";
  
  // Add framework-specific guidance
  if (insights?.framework) {
    const frameworkGuidance = getFrameworkGuidance(insights.framework);
    baseSystem += `\n\nTHERAPEUTIC FRAMEWORK: Focus on ${insights.framework} principles. ${frameworkGuidance}`;
  }
  
  // Add tone guidance
  if (insights?.tone) {
    const toneGuidance = getToneGuidance(insights.tone);
    baseSystem += `\n\nCOMMUNICATION STYLE: ${toneGuidance}`;
  }
  
  // Add emotional state awareness
  if (insights?.state) {
    baseSystem += `\n\nEMOTIONAL CONTEXT: The user is currently experiencing ${insights.state}. Acknowledge this state appropriately.`;
  }
  
  return baseSystem;
}

/**
 * Build the user prompt with entry text and context
 */
function buildUserPrompt(
  entryText: string,
  memorySnippets: MemorySnippet[],
  insights: UserInsights | null
): string {
  let prompt = "";
  
  // Step 1: Add memory context if available
  if (memorySnippets.length > 0) {
    prompt += "PREVIOUS JOURNAL CONTEXT:\n";
    const topMemories = memorySnippets
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
    
    topMemories.forEach((memory, index) => {
      prompt += `${index + 1}. ${memory.content}\n`;
    });
    prompt += "\n";
  }
  
  // Step 2: Add current themes context
  if (insights?.themes && insights.themes.length > 0) {
    prompt += `RECURRING THEMES: ${insights.themes.slice(0, 3).join(', ')}\n\n`;
  }
  
  // Step 3: Add current journal entry
  prompt += "CURRENT JOURNAL ENTRY:\n";
  prompt += entryText;
  
  // Step 4: Add response guidance
  prompt += "\n\nPlease provide a therapeutic response that:\n";
  prompt += "- Reflects back what you heard with specific details\n";
  prompt += "- Offers a psychological insight or reframe\n";
  prompt += "- Asks one thoughtful follow-up question\n";
  
  return prompt;
}

/**
 * Get framework-specific therapeutic guidance
 */
function getFrameworkGuidance(framework: string): string {
  const frameworks: Record<string, string> = {
    "CBT": "Focus on identifying thought patterns, challenging cognitive distortions, and exploring the connection between thoughts, feelings, and behaviors.",
    "ACT": "Emphasize psychological flexibility, values-based living, and mindful acceptance of difficult emotions while taking committed action.",
    "DBT": "Address emotional regulation, distress tolerance, interpersonal effectiveness, and mindfulness skills for managing intense emotions.",
    "Psychodynamic": "Explore unconscious patterns, past relationships, and how early experiences influence current thoughts and behaviors.",
    "Humanistic": "Focus on self-acceptance, personal growth, authentic self-expression, and the client's inherent capacity for positive change.",
    "Mindfulness": "Encourage present-moment awareness, non-judgmental observation of thoughts and feelings, and cultivating inner calm."
  };
  
  return frameworks[framework] || frameworks["CBT"];
}

/**
 * Get tone-specific communication guidance
 */
function getToneGuidance(tone: string): string {
  const tones: Record<string, string> = {
    "warm": "Use a caring, empathetic tone with gentle encouragement and emotional validation.",
    "clear": "Be direct and straightforward while remaining supportive. Focus on practical insights and actionable guidance.",
    "soft": "Use gentle, soothing language with emphasis on comfort and emotional safety.",
    "structured": "Provide organized, step-by-step responses with clear psychological concepts and frameworks.",
    "compassionate": "Show deep understanding and kindness, emphasizing emotional support and validation.",
    "thoughtful": "Use reflective, contemplative language that encourages deeper self-exploration.",
    "neutral": "Maintain a balanced, professional tone that is neither too warm nor too clinical."
  };
  
  return tones[tone] || tones["neutral"];
}

/**
 * Validate and clean prompt inputs
 */
export function validatePromptInputs(
  entryText: string,
  memorySnippets: MemorySnippet[] = [],
  insights: UserInsights | null = null
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate entry text
  if (!entryText || entryText.trim().length === 0) {
    errors.push("Entry text is required");
  }
  
  if (entryText.length > 5000) {
    errors.push("Entry text is too long (max 5000 characters)");
  }
  
  // Validate memory snippets
  if (memorySnippets.length > 10) {
    errors.push("Too many memory snippets (max 10)");
  }
  
  memorySnippets.forEach((snippet, index) => {
    if (!snippet.content || snippet.content.trim().length === 0) {
      errors.push(`Memory snippet ${index + 1} has no content`);
    }
    if (typeof snippet.relevanceScore !== 'number' || snippet.relevanceScore < 0 || snippet.relevanceScore > 1) {
      errors.push(`Memory snippet ${index + 1} has invalid relevance score`);
    }
  });
  
  // Validate insights
  if (insights) {
    const validFrameworks = ["CBT", "ACT", "DBT", "Psychodynamic", "Humanistic", "Mindfulness"];
    const validTones = ["warm", "clear", "soft", "structured", "compassionate", "thoughtful", "neutral"];
    
    if (!validFrameworks.includes(insights.framework)) {
      errors.push(`Invalid framework: ${insights.framework}`);
    }
    
    if (!validTones.includes(insights.tone)) {
      errors.push(`Invalid tone: ${insights.tone}`);
    }
    
    if (insights.themes && insights.themes.length > 10) {
      errors.push("Too many themes (max 10)");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate estimated token count for prompt optimization
 */
export function estimateTokenCount(messages: FastPromptMessage[]): number {
  // Rough estimation: 4 characters = 1 token
  let totalChars = 0;
  
  messages.forEach(message => {
    totalChars += message.content.length;
    totalChars += 10; // Add overhead for role and formatting
  });
  
  return Math.ceil(totalChars / 4);
}

/**
 * Optimize prompt for token limits
 */
export function optimizePromptForTokens(
  entryText: string,
  memorySnippets: MemorySnippet[],
  insights: UserInsights | null,
  maxTokens: number = 1500
): FastPromptMessage[] {
  let optimizedMemorySnippets = [...memorySnippets];
  
  // Build initial prompt
  let prompt = buildFastPrompt(entryText, optimizedMemorySnippets, insights);
  let tokenCount = estimateTokenCount(prompt);
  
  // Reduce memory snippets if over token limit
  while (tokenCount > maxTokens && optimizedMemorySnippets.length > 0) {
    optimizedMemorySnippets = optimizedMemorySnippets.slice(0, -1);
    prompt = buildFastPrompt(entryText, optimizedMemorySnippets, insights);
    tokenCount = estimateTokenCount(prompt);
  }
  
  // If still over limit, truncate entry text
  if (tokenCount > maxTokens) {
    const maxEntryLength = Math.floor(entryText.length * (maxTokens / tokenCount) * 0.8);
    const truncatedEntry = entryText.substring(0, maxEntryLength) + "...";
    prompt = buildFastPrompt(truncatedEntry, optimizedMemorySnippets, insights);
  }
  
  return prompt;
}