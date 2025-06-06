/**
 * Direct HTTP client for OpenAI API to bypass SDK timeout issues
 */
export class OpenAIHttpClient {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createChatCompletion(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
    response_format?: { type: string };
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

export const openaiClient = new OpenAIHttpClient(process.env.OPENAI_API_KEY || '');