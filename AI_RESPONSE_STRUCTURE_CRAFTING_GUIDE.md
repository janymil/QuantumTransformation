# AI Response Structure & Length Crafting Guide

Here's exactly where you can control the AI response structure, length, and format:

## 1. **Main Response Structure Control**
**File:** `server/therapeutic-chat/therapeutic-frameworks.ts`
**Function:** `buildTherapeuticSystemPrompt()` (Lines 198-211)

### Current Structure Instructions:
```typescript
RESPONSE GUIDELINES:
- Write in a warm, natural conversational tone as if speaking directly to a client
- Begin with empathetic acknowledgment of what they've shared
- Offer psychological insights in accessible, non-clinical language
- Ask ONE profound follow-up question that invites deeper exploration
- Never use structured formats, bullet points, or clinical terminology
- Flow naturally between reflection, insight, and questioning
```

### **Craft Response Length Here:**
```typescript
RESPONSE GUIDELINES:
- Write responses of approximately 3-4 paragraphs (150-250 words)
- Begin with empathetic acknowledgment (1-2 sentences)
- Provide main therapeutic insight (2-3 sentences)
- Include gentle exploration (1-2 sentences)
- End with ONE profound follow-up question
- Never use structured formats, bullet points, or clinical terminology
- Flow naturally between reflection, insight, and questioning
```

### **Craft Response Structure Here:**
```typescript
RESPONSE STRUCTURE:
1. EMOTIONAL ACKNOWLEDGMENT: Begin by reflecting their emotional state
2. THERAPEUTIC INSIGHT: Offer 1-2 key psychological observations
3. PATTERN CONNECTION: Link their experience to broader life themes
4. EXPLORATION QUESTION: Ask one deep question to guide discovery

TONE AND LENGTH:
- Keep responses warm but concise (200-300 words maximum)
- Use paragraph breaks for readability
- Avoid clinical jargon or therapeutic buzzwords
- Structure as natural conversation, not therapy session notes
```

## 2. **Token/Length Limits Control**
**File:** `shared/ai-intelligence/adapters/therapeutic-chat-adapter.ts`
**Lines:** 194, 212, 391

### Current Settings:
```typescript
max_tokens: request.options?.maxTokens || 2000,  // Anthropic
max_tokens: request.options?.maxTokens || 2000   // OpenAI
maxTokens: 2000,                                 // Default option
```

### **Craft Length Limits:**
```typescript
// For shorter responses (100-150 words)
max_tokens: request.options?.maxTokens || 800,

// For medium responses (200-250 words)  
max_tokens: request.options?.maxTokens || 1200,

// For longer responses (300-400 words)
max_tokens: request.options?.maxTokens || 1800,
```

## 3. **Conversation Style Structure**
**File:** `server/therapeutic-chat/therapeutic-frameworks.ts`
**Function:** `getConversationStylePrompt()` (Lines 243+)

### **Craft Different Response Formats:**

#### Socratic Style Structure:
```typescript
socratic: `RESPONSE PATTERN:
- Start with a brief acknowledgment (1 sentence)
- Follow with 2-3 carefully crafted questions that build on each other
- End with an exploration question that deepens their inquiry
- Keep total response under 4 sentences
- Focus on questions rather than statements`
```

#### Directive Style Structure:
```typescript
directive: `RESPONSE PATTERN:
- Acknowledge their situation briefly (1 sentence)
- Provide 2-3 specific, actionable recommendations (3-4 sentences)
- Explain why these strategies work (2-3 sentences)
- Give concrete next steps they can take immediately (1-2 sentences)
- Keep total response under 200 words`
```

#### Reflective Style Structure:
```typescript
reflective: `RESPONSE PATTERN:
- Reflect back the core emotion or theme (2-3 sentences)
- Highlight patterns or insights you notice (2-3 sentences)
- Ask one gentle question that invites them to explore further (1 sentence)
- Use paragraph breaks between reflection, insight, and question
- Keep total response under 150 words`
```

## 4. **Action Button Response Structures**

### "Go Deeper" Structure:
**File:** `server/therapeutic-chat/therapeutic-frameworks.ts`
**Function:** `getDeeperExplorationSystemPrompt()`

```typescript
export function getDeeperExplorationSystemPrompt(context: any): string {
  return `RESPONSE STRUCTURE FOR DEEPER EXPLORATION:
1. ACKNOWLEDGE: Validate what they've shared (1-2 sentences)
2. PROBE DEEPER: Ask about underlying emotions/patterns (2-3 questions)
3. CONNECT: Help them see broader themes (1-2 sentences)
4. INVITE: Ask one profound question for deeper exploration

LENGTH: Keep responses short and focused (100-150 words)
TONE: Gentle but probing, curious and supportive

EXAMPLE STRUCTURE:
"I hear the [emotion] in what you're sharing... What do you think might be underneath this feeling? When else in your life have you felt this way? What would it mean to you if you could understand where this really comes from?"`;
}
```

### "New Direction" Structure:
```typescript
export function getNewDirectionSystemPrompt(context: any): string {
  return `RESPONSE STRUCTURE FOR NEW PERSPECTIVE:
1. ACKNOWLEDGE: Honor their current perspective (1 sentence)
2. REFRAME: Offer alternative viewpoint (2-3 sentences)
3. EXPLORE: Ask about new possibilities (1-2 questions)
4. OPEN: Suggest fresh avenues for exploration

LENGTH: Keep responses focused and clear (120-180 words)
TONE: Curious and opening, not dismissive of current view

EXAMPLE STRUCTURE:
"I understand how you're seeing this situation... Have you considered that this might also be [alternative perspective]? What would change if you looked at it from [new angle]? What possibilities might open up if we explored this differently?"`;
}
```

## 5. **Global Response Format Control**
**File:** `shared/ai-intelligence/adapters/therapeutic-chat-adapter.ts`
**Lines 172-182:** The sophisticated prompt wrapper

```typescript
const sophisticatedPrompt = `${request.systemPrompt}

RESPONSE FORMAT REQUIREMENTS:
- Length: 2-3 paragraphs maximum (150-250 words)
- Structure: Acknowledgment → Insight → Question
- Paragraph breaks: Use line breaks for readability
- No bullet points, numbered lists, or clinical formatting
- End with exactly ONE question for further exploration

ENHANCED USER INPUT: ${enhancedUserInput}

Provide a response following the exact structure and length requirements above.`;
```

## 6. **Temperature Control for Response Style**
**File:** `shared/ai-intelligence/adapters/therapeutic-chat-adapter.ts`

```typescript
// Current setting
temperature: request.options?.temperature || 0.7,

// For more structured, consistent responses
temperature: 0.5,

// For more creative, varied responses  
temperature: 0.8,

// For highly consistent, predictable structure
temperature: 0.3,
```

## **Quick Crafting Summary:**

1. **Overall Structure**: Modify `buildTherapeuticSystemPrompt()` RESPONSE GUIDELINES
2. **Length Limits**: Adjust `max_tokens` values (800=short, 1200=medium, 1800=long)
3. **Paragraph Structure**: Add specific formatting instructions in prompts
4. **Style-Specific Structure**: Modify conversation style templates
5. **Action Button Structure**: Customize button-specific response patterns
6. **Consistency Level**: Adjust temperature values

**Main File to Focus On:** `server/therapeutic-chat/therapeutic-frameworks.ts` - this controls 90% of response structure and formatting.