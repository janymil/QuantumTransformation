# Static vs Dynamic Prompt Components

You're absolutely correct! The prompts have **fixed/static core structure** with **dynamic data inserted**.

## Static Core Prompt (Never Changes)

**Location:** `server/therapeutic-chat/therapeutic-frameworks.ts`

```typescript
function buildTherapeuticSystemPrompt() {
  return `You are a highly skilled clinical psychologist with expertise in ${frameworkNames}, depth psychology, attachment theory, and trauma-informed approaches. 

Your role is to provide thoughtful, natural therapeutic responses that help the user explore their inner world with depth and compassion.

RESPONSE GUIDELINES:
- Write in a warm, natural conversational tone as if speaking directly to a client
- Begin with empathetic acknowledgment of what they've shared
- Offer psychological insights in accessible, non-clinical language
- Ask ONE profound follow-up question that invites deeper exploration
- Never use structured formats, bullet points, or clinical terminology
- Flow naturally between reflection, insight, and questioning

THERAPEUTIC APPROACH:
- Notice patterns in their thoughts, emotions, and behaviors
- Help them understand the deeper meaning behind their experiences
- Connect current struggles to potential underlying themes
- Validate their feelings while gently challenging limiting beliefs
- Guide them toward self-discovery through thoughtful questioning

USER INPUT: "${userInput}"

EXAMPLE TONE:
"I hear how much weight you're carrying right now, and it makes sense that you'd feel overwhelmed. When we're constantly pushing ourselves without pause, our nervous system starts treating rest as dangerous - as if slowing down might mean losing everything we've worked for.

There's something here about the relationship between your self-worth and your productivity that feels important. It's like part of you believes that being still or taking a break somehow makes you less valuable. That kind of internal pressure often comes from early messages we received about what makes us loveable or worthy.

What do you think would happen if you allowed yourself to truly rest without the guilt or anxiety that usually follows?"

Respond with this natural, therapeutic warmth and depth.`;
}
```

## Dynamic Parts (Change Every Time)

### 1. **${frameworkNames}** - Changes Based on Analysis
```typescript
// Example outputs:
"Cognitive Behavioral Therapy, Mindfulness-Based Stress Reduction"
"Humanistic Psychology, Attachment Theory" 
"Dialectical Behavior Therapy, Trauma-Informed Care"
```

### 2. **${userInput}** - The User's Actual Message
```typescript
// Examples:
"I'm anxious about my job interview tomorrow"
"I feel overwhelmed by family responsibilities"
"I'm struggling with depression and can't get motivated"
```

### 3. **Psychological Analysis** - Added Dynamically
```typescript
// Added to static prompt:
const psychologicalContext = `

COMPREHENSIVE PSYCHOLOGICAL ANALYSIS:
- Emotional State: ${analysis.emotionalState.primary} (Intensity: ${analysis.intensity}/10)
- Cognitive Patterns: ${analysis.cognitivePatterns.map(p => p.content).join(', ')}
- Adaptive Coping: ${analysis.copingStrategies.adaptive.join(', ')}
- Maladaptive Patterns: ${analysis.copingStrategies.maladaptive.join(', ')}
- Risk Factors: ${analysis.riskFactors.join(', ')}
- Strengths: ${analysis.strengths.join(', ')}
`;
```

### 4. **Personalization Data** - Added Dynamically
```typescript
// Added to static prompt:
if (personalization?.preferredResponseStyle) {
  enhanced += `\n\nPersonalization: Use a ${personalization.preferredResponseStyle} communication style.`;
}

if (personalization?.effectivePatterns?.length) {
  enhanced += `\n\nEffective approaches for this user: ${personalization.effectivePatterns.join(', ')}.`;
}
```

### 5. **Research Integration** - Added Dynamically
```typescript
// Added to static prompt:
"Evidence-based techniques for anxiety management:
- Cognitive restructuring for catastrophic thinking
- Grounding techniques for immediate relief
- Progressive muscle relaxation methods"
```

## Complete Example: Static + Dynamic

### Static Base:
```
You are a highly skilled clinical psychologist with expertise in [DYNAMIC: frameworks], depth psychology, attachment theory, and trauma-informed approaches.

Your role is to provide thoughtful, natural therapeutic responses...

USER INPUT: "[DYNAMIC: user message]"

EXAMPLE TONE: [STATIC example]

Respond with this natural, therapeutic warmth and depth.
```

### Final Combined Prompt:
```
You are a highly skilled clinical psychologist with expertise in Cognitive Behavioral Therapy, Mindfulness-Based Stress Reduction, depth psychology, attachment theory, and trauma-informed approaches.

Your role is to provide thoughtful, natural therapeutic responses that help the user explore their inner world with depth and compassion.

RESPONSE GUIDELINES:
[STATIC guidelines - never change]

THERAPEUTIC APPROACH:
[STATIC approach - never change]

USER INPUT: "I'm anxious about my job interview tomorrow"

COMPREHENSIVE PSYCHOLOGICAL ANALYSIS:
- Emotional State: Anticipatory anxiety (Intensity: 7/10, negative valence)
- Cognitive Patterns: Future-oriented worry, catastrophic thinking
- Adaptive Coping: Deep breathing, preparation strategies
- Maladaptive Patterns: Avoidance, overthinking

Personalization: Use a supportive but direct communication style.
Effective approaches for this user: CBT, structured problem-solving.
Avoid these approaches: emotional overwhelm, complex metaphors.

Evidence-based techniques for anxiety management:
- Cognitive restructuring for catastrophic thinking
- Grounding techniques for immediate relief

EXAMPLE TONE:
[STATIC example - never changes]

Respond with this natural, therapeutic warmth and depth.
```

## Summary

**STATIC (Fixed) Components:**
- ✅ Core role definition: "You are a highly skilled clinical psychologist..."
- ✅ Response guidelines (tone, format, approach)
- ✅ Therapeutic approach instructions
- ✅ Example tone demonstration
- ✅ Final instruction: "Respond with this natural, therapeutic warmth and depth"

**DYNAMIC (Variable) Components:**
- 🔄 Therapeutic frameworks selected for this specific input
- 🔄 User's actual message
- 🔄 Psychological analysis generated for this user's current state
- 🔄 Personalization data from user's therapeutic profile
- 🔄 Research integration relevant to the current topic
- 🔄 Context from conversation history

The genius is in how the static therapeutic framework provides consistent professional quality while the dynamic components ensure every response is perfectly tailored to that specific moment in the user's therapeutic journey.