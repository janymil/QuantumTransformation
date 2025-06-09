
/**
 * Fast Prompt Builder for Therapeutic Responses
 * Builds optimized GPT-4o prompts with memory snippets and user insights
 */

export interface MemorySnippet {
  content: string;
  context?: string;
  relevance?: number;
}

export interface UserInsights {
  preferredFramework?: string;
  emotionalState?: string;
  communicationTone?: string;
  challengeLevel?: number;
  themes?: string[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Build a fast, optimized prompt for GPT-4o therapeutic responses
 */
export function buildFastPrompt(
  entryText: string,
  memorySnippets?: MemorySnippet[],
  insights?: UserInsights
): ChatMessage[] {
  const systemMessage = "You are a therapeutic journaling AI trained in psychology, trauma recovery, and motivation coaching. Respond with a 2–3 sentence reflection and 1 follow-up question. Use insights from CBT, ACT, mindfulness, and human emotion. Do not use vague replies like 'I understand.' Be specific.";

  // Build the user content by combining entry, memory, and insights
  let userContent = entryText;

  // Add memory snippets if provided (limit to 3 most relevant)
  if (memorySnippets && memorySnippets.length > 0) {
    const relevantSnippets = memorySnippets
      .slice(0, 3) // Limit to 3 snippets for performance
      .map(snippet => snippet.content)
      .join('\n- ');
    
    userContent += `\n\nRelated past journal entries:\n- ${relevantSnippets}`;
  }

  // Add user insights if provided
  if (insights) {
    const insightSections: string[] = [];
    
    if (insights.preferredFramework) {
      insightSections.push(`Preferred therapeutic approach: ${insights.preferredFramework}`);
    }
    
    if (insights.emotionalState) {
      insightSections.push(`Current emotional state: ${insights.emotionalState}`);
    }
    
    if (insights.communicationTone) {
      insightSections.push(`Preferred communication style: ${insights.communicationTone}`);
    }
    
    if (insights.challengeLevel !== undefined) {
      insightSections.push(`Challenge readiness level: ${insights.challengeLevel}/10`);
    }
    
    if (insights.themes && insights.themes.length > 0) {
      insightSections.push(`Key themes: ${insights.themes.join(', ')}`);
    }

    if (insightSections.length > 0) {
      userContent += `\n\nUser profile:\n${insightSections.join('\n')}`;
    }
  }

  return [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userContent }
  ];
}
