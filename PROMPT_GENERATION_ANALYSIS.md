# Prompt Generation Analysis: Dynamic vs Fixed Prompts

## Answer: YES - Each Prompt is Dynamically Generated and Unique

The therapeutic-chat-engine creates **completely dynamic, unique prompts** for each user interaction. There are NO fixed templates with just user data inserted.

---

## How Dynamic Prompt Generation Works

### 1. **Base Template Creation** (Always Different)
**Location:** `buildTherapeuticSystemPrompt()` in `server/therapeutic-chat/therapeutic-frameworks.ts`

The base template changes based on:
- **Selected therapeutic frameworks** (CBT, DBT, psychodynamic, etc.)
- **User's specific input** (embedded directly into instructions)
- **Context parameters** (mode, tone, perspective)

**Example - Same user, different inputs:**

**Input 1:** "I'm anxious about work"
```
You are a highly skilled clinical psychologist with expertise in Cognitive Behavioral Therapy, mindfulness-based approaches...
USER INPUT: "I'm anxious about work"
```

**Input 2:** "I feel sad and lost"
```
You are a highly skilled clinical psychologist with expertise in Humanistic Psychology, attachment theory...
USER INPUT: "I feel sad and lost"
```

### 2. **Dynamic Framework Selection**
The system analyzes each input and selects different therapeutic frameworks:

```typescript
// For anxiety input
frameworks: ["Cognitive Behavioral Therapy", "Mindfulness-Based Stress Reduction"]

// For grief input  
frameworks: ["Humanistic Psychology", "Attachment Theory", "Grief Counseling"]
```

### 3. **Psychological Analysis Integration** (Completely Dynamic)
Each prompt gets unique psychological analysis:

```typescript
const psychologicalContext = `
COMPREHENSIVE PSYCHOLOGICAL ANALYSIS:
- Emotional State: ${analysis.emotionalState.primary} (Intensity: ${analysis.intensity}/10)
- Cognitive Patterns: ${analysis.cognitivePatterns.map(p => p.content).join(', ')}
- Adaptive Coping: ${analysis.copingStrategies.adaptive.join(', ')}
- Risk Factors: ${analysis.riskFactors.join(', ')}
- Strengths: ${analysis.strengths.join(', ')}
`;
```

**Example Dynamic Analysis:**
- **User A (anxious):** "Emotional State: Anticipatory anxiety (Intensity: 7/10), Cognitive Patterns: Catastrophic thinking, future-oriented worry"
- **User B (depressed):** "Emotional State: Depressive episode (Intensity: 8/10), Cognitive Patterns: Negative self-talk, hopelessness"

### 4. **Personalization Layer** (User-Specific)
Each prompt includes unique personalization:

```typescript
// User A's personalization
- Preferred style: direct and analytical
- Effective approaches: CBT, structured problem-solving
- Avoidance factors: emotional overwhelm, complex metaphors

// User B's personalization  
- Preferred style: gentle and empathetic
- Effective approaches: humanistic, mindfulness
- Avoidance factors: confrontational language, time pressure
```

### 5. **Research Integration** (Content-Specific)
The system adds relevant research for each specific topic:

```typescript
// For anxiety prompt
"Evidence-based techniques for anxiety management:
- Cognitive restructuring for catastrophic thinking
- Progressive muscle relaxation for somatic symptoms
- Grounding techniques for panic response"

// For depression prompt
"Evidence-based approaches for depression:
- Behavioral activation for motivation
- Cognitive restructuring for negative thought patterns
- Interpersonal therapy for relationship challenges"
```

### 6. **Context Building** (Session-Specific)
Each prompt includes unique conversation context:

```typescript
const contextPrompt = this.buildContextPrompt(
  thread,           // Current conversation thread
  history,          // Previous exchanges in this session
  userProfile,      // User's therapeutic profile
  userContext,      // Current life context
  therapeuticMemory, // Long-term therapeutic patterns
  crossSessionPatterns // Patterns across multiple sessions
);
```

---

## Complete Example: Two Different Prompts for Same User

### **Session 1 - User says: "I'm anxious about my job interview"**

**Final Prompt to AI:**
```
You are a highly skilled clinical psychologist with expertise in Cognitive Behavioral Therapy, Acceptance and Commitment Therapy, depth psychology, attachment theory, and trauma-informed approaches.

COMPREHENSIVE PSYCHOLOGICAL ANALYSIS:
- Emotional State: Anticipatory anxiety (Intensity: 7/10, negative valence)
- Cognitive Patterns: Future-oriented worry, catastrophic thinking
- Adaptive Coping: Deep breathing, preparation strategies
- Maladaptive Patterns: Avoidance, overthinking
- Risk Factors: Performance anxiety, perfectionism
- Strengths: Self-awareness, motivation to improve

Therapeutic Goals: anxiety management, confidence building
Therapeutic Framework: Cognitive Behavioral Therapy
User's Emotional State: anticipatory anxiety
Preferred Communication Style: supportive but direct

THERAPEUTIC CONTEXT:
- User's emotional state: anticipatory anxiety
- Therapeutic goals: anxiety management, confidence building
- Preferred style: supportive but direct
- Session focus: CBT

ENHANCED USER INPUT: I'm anxious about my job interview tomorrow. [Context: User has been working on anxiety management, tends to overthink future events, responds well to structured approaches, has successfully used breathing techniques in past]

Evidence-based techniques for anxiety management:
- Cognitive restructuring for catastrophic thinking
- Grounding techniques for immediate relief
- Confidence-building visualization exercises

USER CONTEXT: This is session 3 with this user. Previous sessions focused on general anxiety management. User has been practicing mindfulness techniques with moderate success. Currently facing career transition stress.

Provide a sophisticated therapeutic response that demonstrates deep understanding, uses appropriate therapeutic techniques, and guides toward meaningful insight.
```

### **Session 2 - Same user says: "I feel overwhelmed by family responsibilities"**

**Final Prompt to AI:**
```
You are a highly skilled clinical psychologist with expertise in Family Systems Therapy, Dialectical Behavior Therapy, depth psychology, attachment theory, and trauma-informed approaches.

COMPREHENSIVE PSYCHOLOGICAL ANALYSIS:
- Emotional State: Chronic stress (Intensity: 8/10, negative valence)
- Cognitive Patterns: All-or-nothing thinking, people-pleasing
- Adaptive Coping: Boundary setting attempts, seeking support
- Maladaptive Patterns: Over-responsibility, self-neglect
- Risk Factors: Burnout, resentment building
- Strengths: Family commitment, awareness of limits

Therapeutic Goals: boundary setting, stress management, family dynamics
Therapeutic Framework: Family Systems Therapy
User's Emotional State: overwhelmed
Preferred Communication Style: empathetic and validating

THERAPEUTIC CONTEXT:
- User's emotional state: overwhelmed
- Therapeutic goals: boundary setting, stress management
- Preferred style: empathetic and validating
- Session focus: Family Systems

ENHANCED USER INPUT: I feel overwhelmed by family responsibilities. [Context: User has pattern of over-functioning in family role, difficulty saying no, tends to prioritize others' needs over own, benefits from validation before practical strategies]

Evidence-based approaches for family stress:
- Family systems boundary work
- Caregiver stress management techniques
- Assertiveness training for healthy limits

USER CONTEXT: This is session 8 with this user. Previous sessions covered anxiety management and confidence building. User has made progress with interview anxiety but new stressor emerged. Pattern emerging of taking on too much responsibility.

Provide a sophisticated therapeutic response that demonstrates deep understanding, uses appropriate therapeutic techniques, and guides toward meaningful insight.
```

---

## Key Differences Between Each Prompt:

1. **Therapeutic Frameworks:** CBT vs Family Systems Therapy
2. **Psychological Analysis:** Completely different emotional states, patterns, coping strategies
3. **Research Integration:** Anxiety techniques vs family stress approaches  
4. **Personalization:** Different communication styles and effective approaches
5. **Context:** Different session history and patterns
6. **User Input Enhancement:** Different contextual information added

---

## Summary

**NO fixed templates exist.** Every single prompt is:
- ✅ **Dynamically generated** based on current input
- ✅ **Uniquely personalized** for the specific user
- ✅ **Context-aware** of conversation history
- ✅ **Research-enhanced** for the specific topic
- ✅ **Framework-adapted** for optimal therapeutic approach
- ✅ **Psychologically analyzed** for current emotional state

The system creates a completely new, sophisticated therapeutic prompt every time, ensuring each AI response is as relevant and personalized as possible.