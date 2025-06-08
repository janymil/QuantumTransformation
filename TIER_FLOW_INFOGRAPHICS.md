# AI Platform Tier Flow Infographics

## Basic Tier Flow (Cost-Optimized AI Coaching)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BASIC TIER FLOW                                   │
│                        (Cost-Optimized AI Coaching)                            │
└─────────────────────────────────────────────────────────────────────────────────┘

    USER REQUEST
         │
         ▼
┌─────────────────────────┐
│   API Entry Point       │
│ POST /api/ai/smart-     │
│      coaching           │
│                         │
│ File: server/routes.ts  │
│ Line: 1563              │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Request Validation    │
│ • Authentication check  │
│ • Query validation      │
│ • User tier: 'basic'    │
│                         │
│ File: server/routes.ts  │
│ Lines: 1565-1570        │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Vector Personalization │
│ • Initialize systems    │
│ • Index challenge data  │
│ • Get context           │
│                         │
│ File: server/routes.ts  │
│ Lines: 1589-1602        │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Enhanced Prompt       │
│ • Personalized context  │
│ • Challenge-specific    │
│ • Quantum framework     │
│                         │
│ File: server/routes.ts  │
│ Lines: 1605-1614        │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   AI Intelligence       │
│   Layer Router          │
│                         │
│ intelligentRouter.      │
│ processCoachingRequest  │
│                         │
│ File: shared/ai-        │
│ intelligence/core/      │
│ intelligent-router.ts   │
│ Lines: 1617-1628        │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│    Cache Check          │
│ • Check for cached      │
│   response              │
│ • Return if found       │
│                         │
│ File: shared/ai-        │
│ intelligence/core/      │
│ intelligent-router.ts   │
│ Lines: 73-87            │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Routing Decision      │
│ • Session type:         │
│   'ai_coaching'         │
│ • Route to adapter      │
│                         │
│ File: shared/ai-        │
│ intelligence/core/      │
│ intelligent-router.ts   │
│ Lines: 98-100           │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   AI Coaching Adapter   │
│ routeToAICoaching       │
│ Adapter()               │
│                         │
│ File: shared/ai-        │
│ intelligence/adapters/  │
│ ai-coaching-adapter.ts  │
│ Lines: 358-382          │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│    AI Coaching Engine   │
│ coachingEngine.         │
│ generatePersonalized    │
│ Response()              │
│                         │
│ File: server/           │
│ ai-coaching-engine.ts   │
│ Lines: 50-85            │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Cost Optimization     │
│ • GPT-4o-mini priority  │
│ • GPT-4o for complex    │
│ • Template matching     │
│ • Caching strategy      │
│                         │
│ File: server/           │
│ ai-coaching-engine.ts   │
│ Lines: 67-85            │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│    Model Selection      │
│ Intelligent Model       │
│ Router                  │
│                         │
│ • Complexity analysis   │
│ • Cost-benefit routing  │
│                         │
│ File: server/           │
│ ai-coaching-engine.ts   │
│ Line: 70                │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│     API Execution       │
│ GPT-4o-mini (70%) or    │
│ GPT-4o (30%)            │
│                         │
│ Cost: $0.0008-0.003     │
│ Savings: 60-70%         │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Research Integration  │
│ • Citation enhancement  │
│ • Knowledge augmentation│
│                         │
│ File: server/           │
│ ai-coaching-engine.ts   │
│ Lines: 75-80            │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│    Response Return      │
│ • Structured response   │
│ • Cost tracking         │
│ • Usage analytics       │
│                         │
│ File: server/routes.ts  │
│ Lines: 1633-1641        │
└─────────────────────────┘
```

## Premium Tier Flow (Therapeutic Chat)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PREMIUM TIER FLOW                                 │
│                           (Therapeutic Chat Quality)                           │
└─────────────────────────────────────────────────────────────────────────────────┘

    USER REQUEST
         │
         ▼
┌─────────────────────────┐
│   API Entry Point       │
│ POST /api/therapeutic-  │
│      chat/process       │
│                         │
│ File: server/routes.ts  │
│ Line: 2173              │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Request Processing    │
│ • Authentication check  │
│ • Message validation    │
│ • Thread context        │
│                         │
│ File: server/routes.ts  │
│ Lines: 2174-2176        │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   AI Intelligence       │
│   Layer Router          │
│                         │
│ intelligentRouter.      │
│ processCoachingRequest  │
│                         │
│ File: shared/ai-        │
│ intelligence/core/      │
│ intelligent-router.ts   │
│ Lines: 2179-2191        │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│    Session Type         │
│    Detection            │
│                         │
│ requestType:            │
│ 'therapeutic_chat'      │
│                         │
│ File: shared/ai-        │
│ intelligence/core/      │
│ intelligent-router.ts   │
│ Lines: 95-97            │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Therapeutic Chat       │
│       Adapter           │
│                         │
│ routeToTherapeutic      │
│ Adapter()               │
│                         │
│ File: shared/ai-        │
│ intelligence/core/      │
│ intelligent-router.ts   │
│ Lines: 334-353          │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Therapeutic Request   │
│      Enhancement        │
│                         │
│ • Intelligence applied  │
│ • Context enhancement   │
│                         │
│ File: shared/ai-        │
│ intelligence/adapters/  │
│ therapeutic-chat-       │
│ adapter.ts              │
│ Lines: 86-103           │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Deep Journaling       │
│      Engine             │
│                         │
│ processJournaling       │
│ Request()               │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ therapeutic-chat-       │
│ engine.ts               │
│ Lines: 121-122          │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   COMPREHENSIVE         │
│   PSYCHOLOGICAL         │
│   ORCHESTRATION         │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ therapeutic-chat-       │
│ engine.ts               │
│ Lines: 56-81            │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Emotional State       │
│   Analysis              │
│                         │
│ psychologicalAnalyzer.  │
│ analyzeEmotionalState() │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ psychological-          │
│ analyzer.ts             │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Cognitive Patterns    │
│   Detection             │
│                         │
│ psychologicalAnalyzer.  │
│ analyzeCognitivePatterns│
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ psychological-          │
│ analyzer.ts             │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Coping Strategies     │
│   Assessment            │
│                         │
│ psychologicalAnalyzer.  │
│ assessCopingStrategies  │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ psychological-          │
│ analyzer.ts             │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Comprehensive         │
│   Analysis              │
│                         │
│ psychologicalAnalyzer.  │
│ analyzeComprehensively  │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ psychological-          │
│ analyzer.ts             │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Psychological         │
│   Insights Generation   │
│                         │
│ psychologicalAnalyzer.  │
│ generateInsights()      │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ psychological-          │
│ analyzer.ts             │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   User Modeling         │
│   Engine                │
│                         │
│ getPersonalization      │
│ Recommendations()       │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ user-modeling-          │
│ engine.ts               │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Dynamic Framework     │
│   Selection             │
│                         │
│ selectOptimalFramework  │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ dynamic-framework-      │
│ selector.ts             │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Contextual Memory     │
│   Architecture          │
│                         │
│ analyzeCrossSession     │
│ Patterns()              │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ contextual-memory-      │
│ architecture.ts         │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Enhanced System       │
│   Prompt Integration    │
│                         │
│ • Psychological context │
│ • Emotional insights    │
│ • Cognitive patterns    │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ therapeutic-chat-       │
│ engine.ts               │
│ Lines: 262-275          │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  ⚠️  COST OPTIMIZATION   │
│       BYPASS            │
│                         │
│ "bypasses cost          │
│ optimization,           │
│ preserves quality"      │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ therapeutic-chat-       │
│ engine.ts               │
│ Line: 324               │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Direct Premium        │
│   API Access            │
│                         │
│ • GPT-4o only           │
│ • Claude-3.5-Sonnet     │
│ • No model downgrading  │
│ • No caching            │
│ • No templates          │
│                         │
│ Cost: $0.008-0.015      │
│ Quality: Maximum        │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Adaptive Language     │
│   Generation            │
│                         │
│ generateAdaptedResponse │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ adaptive-language-      │
│ generator.ts            │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Breakthrough          │
│   Detection             │
│                         │
│ • Therapeutic progress  │
│ • Emotional shifts      │
│ • Pattern recognition   │
│                         │
│ File: server/           │
│ therapeutic-chat/       │
│ therapeutic-chat-       │
│ engine.ts               │
│ Lines: 118-140          │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Therapeutic           │
│   Response Return       │
│                         │
│ • Psychological depth   │
│ • Personalized insights │
│ • Progress tracking     │
│                         │
│ File: server/routes.ts  │
│ Line: 2193              │
└─────────────────────────┘
```

## Key Architectural Differences Summary

| Component | Basic Tier | Premium Tier |
|-----------|------------|--------------|
| **Entry Point** | `/api/ai/smart-coaching` | `/api/therapeutic-chat/process` |
| **Main File** | `server/routes.ts:1563` | `server/routes.ts:2173` |
| **Router** | `intelligent-router.ts` | `intelligent-router.ts` |
| **Adapter** | `ai-coaching-adapter.ts` | `therapeutic-chat-adapter.ts` |
| **Engine** | `ai-coaching-engine.ts` | `therapeutic-chat-engine.ts` |
| **Cost Optimization** | ✅ Full optimization | ❌ Bypassed for quality |
| **Model Selection** | GPT-4o-mini/GPT-4o | GPT-4o/Claude-3.5-Sonnet |
| **Caching** | ✅ Aggressive caching | ❌ No therapeutic caching |
| **Psychology Analysis** | ❌ Basic | ✅ Comprehensive (5 methods) |
| **Cost Range** | $0.0008-0.003 | $0.008-0.015 |
| **Savings** | 60-70% | 0% (quality priority) |

## File Dependencies Map

```
Basic Tier Files:
├── server/routes.ts (entry)
├── shared/ai-intelligence/core/intelligent-router.ts
├── shared/ai-intelligence/adapters/ai-coaching-adapter.ts
├── server/ai-coaching-engine.ts
└── server/unified-research-integration.ts

Premium Tier Files:
├── server/routes.ts (entry)
├── shared/ai-intelligence/core/intelligent-router.ts
├── shared/ai-intelligence/adapters/therapeutic-chat-adapter.ts
├── server/therapeutic-chat/therapeutic-chat-engine.ts
├── server/therapeutic-chat/psychological-analyzer.ts
├── server/therapeutic-chat/user-modeling-engine.ts
├── server/therapeutic-chat/dynamic-framework-selector.ts
├── server/therapeutic-chat/contextual-memory-architecture.ts
└── server/therapeutic-chat/adaptive-language-generator.ts
```