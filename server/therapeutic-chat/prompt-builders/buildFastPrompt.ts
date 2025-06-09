/**
 * Fast Prompt Builder for Therapeutic Chat
 * Builds optimized GPT-4o prompts for sub-1 second responses
 */

interface MemorySnippet {
  userInput: string;
  aiAnalysis?: any;
  similarity?: number;
}

interface UserInsights {
  framework?: string;
  tone?: string;
  state?: string;
  themes?: string[];
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Build fast therapeutic prompt with memory and insights
 * @param entryText - Current user journal entry
 * @param memorySnippets - Up to 3 relevant past entries
 * @param insights - User psychological profile insights
 * @returns Array of chat messages for GPT-4o
 */
export function buildFastPrompt(
  entryText: string,
  memorySnippets: MemorySnippet[] = [],
  insights: UserInsights = {}
): ChatMessage[] {
  // Base system message with therapeutic guidelines
  const systemMessage = "You are a therapeutic journaling AI trained in psychology, trauma recovery, and motivation coaching. Respond with a 2–3 sentence reflection and 1 follow-up question. Use insights from CBT, ACT, mindfulness, and human emotion. Do not use vague replies like 'I understand.' Be specific.";

  // Build contextual information for user prompt
  let contextualInfo = '';

  // Add user insights if available
  if (insights.framework || insights.state || insights.tone) {
    contextualInfo += '\n--- User Context ---\n';
    
    if (insights.framework) {
      contextualInfo += `Therapeutic approach: ${insights.framework}\n`;
    }
    
    if (insights.state) {
      contextualInfo += `Current emotional state: ${insights.state}\n`;
    }
    
    if (insights.tone) {
      contextualInfo += `Preferred communication tone: ${insights.tone}\n`;
    }
    
    if (insights.themes && insights.themes.length > 0) {
      contextualInfo += `Key themes: ${insights.themes.join(', ')}\n`;
    }
  }

  // Add memory snippets if available (limit to 3 most relevant)
  if (memorySnippets.length > 0) {
    contextualInfo += '\n--- Relevant Past Reflections ---\n';
    
    const topSnippets = memorySnippets.slice(0, 3);
    topSnippets.forEach((snippet, index) => {
      contextualInfo += `${index + 1}. "${snippet.userInput}"\n`;
    });
    
    contextualInfo += '\n';
  }

  // Combine entry with context
  const userPrompt = `${contextualInfo}--- Current Journal Entry ---\n${entryText}`;

  return [
    {
      role: 'system',
      content: systemMessage
    },
    {
      role: 'user',
      content: userPrompt
    }
  ];
}