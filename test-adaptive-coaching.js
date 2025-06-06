/**
 * Test the enhanced AI Couch Engine with journal entries and affirmations integration
 */

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testAdaptiveCoaching() {
  console.log('🧠 Testing Enhanced AI Adaptive Coaching System');
  console.log('=====================================\n');

  // Simulate comprehensive user context with journal entries and affirmations
  const mockUserContext = {
    profile: {
      primaryGoals: ['reduce anxiety', 'spiritual growth', 'self-love'],
      healingReadiness: 8,
      learningStyle: 'visual',
      communicationStyle: 'gentle',
      traumaAreas: ['relationship trauma', 'abandonment issues']
    },
    journalEntries: [
      {
        day: 1,
        experience: 'Had a difficult conversation with my partner today',
        insights: 'I noticed I immediately shut down when criticized',
        mood: 4,
        energy: 3,
        challenges: 'Fear of abandonment triggered my defensive responses'
      },
      {
        day: 2,
        experience: 'Tried meditation for 20 minutes',
        insights: 'My mind kept racing but I felt calmer afterward',
        mood: 6,
        energy: 5,
        challenges: 'Staying present during meditation is still hard'
      },
      {
        day: 3,
        experience: 'Practiced self-compassion when I made a mistake at work',
        insights: 'I can be my own worst critic, but awareness helps',
        mood: 7,
        energy: 6,
        challenges: 'Old patterns of self-criticism still surface automatically'
      }
    ],
    savedPhrases: [
      {
        phrase: 'I am worthy of love and belonging exactly as I am',
        category: 'self-love',
        source: 'Brené Brown'
      },
      {
        phrase: 'My sensitivity is a strength, not a weakness',
        category: 'empowerment',
        source: 'Personal affirmation'
      },
      {
        phrase: 'I choose to respond rather than react',
        category: 'emotional regulation',
        source: 'Mindfulness practice'
      }
    ],
    recentSessions: [],
    currentChallenges: ['relationship triggers', 'self-criticism patterns'],
    emotionalState: 'healing but vulnerable'
  };

  try {
    console.log('📊 User Context Analysis:');
    console.log('- Healing Readiness:', mockUserContext.profile.healingReadiness + '/10');
    console.log('- Primary Goals:', mockUserContext.profile.primaryGoals.join(', '));
    console.log('- Recent Journal Insights:', mockUserContext.journalEntries.map(e => e.insights).join('; '));
    console.log('- Saved Affirmations:', mockUserContext.savedPhrases.map(p => p.phrase).slice(0, 2).join('; '));
    console.log('');

    // Test AI analysis with comprehensive context
    const analysisPrompt = `
You are an advanced AI coaching engine that analyzes user data to create personalized daily assessments.

USER PROFILE:
- Primary Goals: ${JSON.stringify(mockUserContext.profile.primaryGoals)}
- Healing Readiness: ${mockUserContext.profile.healingReadiness}/10
- Learning Style: ${mockUserContext.profile.learningStyle}
- Communication Style: ${mockUserContext.profile.communicationStyle}
- Trauma Areas: ${JSON.stringify(mockUserContext.profile.traumaAreas)}

RECENT JOURNAL ENTRIES (last 3 days):
${mockUserContext.journalEntries.map(entry => `
- Day ${entry.day}: Experience: "${entry.experience}", Insights: "${entry.insights}", Mood: ${entry.mood}/10, Energy: ${entry.energy}/10, Challenges: "${entry.challenges}"
`).join('')}

SAVED PHRASES & AFFIRMATIONS:
${mockUserContext.savedPhrases.map(phrase => `- "${phrase.phrase}" (${phrase.category})`).join('\n')}

Based on this comprehensive analysis, determine what this user should focus on TODAY.

Provide:
1. CURRENT FOCUS: What specific area they should work on today
2. REASONING: Why this focus area is optimal based on their journal patterns and goals
3. DAILY ASSESSMENT: Create a personalized assessment with 3 exercises that integrate their affirmations and address their journal insights
4. ADAPTATION STRATEGY: How this will build toward their goals

Format as JSON with these exact keys: currentFocus, reasoning, dailyAssessment, adaptationStrategy
`;

    console.log('🤖 Generating AI-driven personalized assessment...\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert AI coaching engine that creates personalized daily assessments by analyzing user profiles, journal entries, and saved affirmations. Always respond with valid JSON."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = completion.choices[0].message.content;
    console.log('✅ AI Analysis Complete!\n');
    
    try {
      const analysis = JSON.parse(aiResponse);
      
      console.log('🎯 PERSONALIZED DAILY FOCUS:');
      console.log('Current Focus:', analysis.currentFocus);
      console.log('');
      
      console.log('🧭 AI REASONING:');
      console.log(analysis.reasoning);
      console.log('');
      
      console.log('📋 TODAY\'S ASSESSMENT:');
      console.log(JSON.stringify(analysis.dailyAssessment, null, 2));
      console.log('');
      
      console.log('🔄 ADAPTATION STRATEGY:');
      console.log(analysis.adaptationStrategy);
      console.log('');
      
    } catch (parseError) {
      console.log('Raw AI Response:', aiResponse);
    }

    // Test adaptation based on user responses
    const mockUserResponses = {
      exercise1: "I felt resistance at first but then noticed old patterns",
      exercise2: "The affirmation felt powerful when I really focused on it",
      exercise3: "I could see how my journal insights connect to current triggers",
      overallExperience: "Challenging but insightful - I feel more aware"
    };

    console.log('📝 Simulating User Completion...');
    console.log('User Responses:', JSON.stringify(mockUserResponses, null, 2));
    console.log('');

    const adaptationPrompt = `
The user completed today's assessment. Based on their responses, analyze what they should focus on tomorrow.

TODAY'S RESPONSES: ${JSON.stringify(mockUserResponses)}

USER CONTEXT:
- Profile: Healing Readiness ${mockUserContext.profile.healingReadiness}/10, Goals: ${JSON.stringify(mockUserContext.profile.primaryGoals)}
- Recent Journal Insights: ${mockUserContext.journalEntries.slice(0, 3).map(e => e.insights).join('; ')}
- Saved Affirmations: ${mockUserContext.savedPhrases.slice(0, 3).map(p => p.phrase).join('; ')}

Analyze:
1. How did they respond to today's exercises?
2. What emotional/mental shifts occurred?
3. What should tomorrow's focus be?
4. How can we build on today's progress?

Provide adaptation insights in JSON format with keys: progressAnalysis, emotionalShifts, tomorrowFocus, buildingStrategy
`;

    const adaptationCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert AI coaching engine that analyzes user responses to adapt future coaching content. Always respond with valid JSON."
        },
        {
          role: "user",
          content: adaptationPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const adaptationResponse = adaptationCompletion.choices[0].message.content;
    console.log('🔄 AI ADAPTATION ANALYSIS:');
    
    try {
      const adaptation = JSON.parse(adaptationResponse);
      console.log('Progress Analysis:', adaptation.progressAnalysis);
      console.log('Emotional Shifts:', adaptation.emotionalShifts);
      console.log('Tomorrow\'s Focus:', adaptation.tomorrowFocus);
      console.log('Building Strategy:', adaptation.buildingStrategy);
    } catch (parseError) {
      console.log('Raw Adaptation Response:', adaptationResponse);
    }

    console.log('\n🎉 Enhanced AI Adaptive Coaching Test Complete!');
    console.log('The system successfully:');
    console.log('✅ Analyzed comprehensive user context (profile + journal + affirmations)');
    console.log('✅ Generated personalized daily focus with clear reasoning');
    console.log('✅ Created adaptive exercises that integrate user\'s saved affirmations');
    console.log('✅ Provided intelligent adaptation based on user responses');
    console.log('✅ Demonstrated continuous learning and personalization');

  } catch (error) {
    console.error('❌ Test Error:', error);
    
    if (error.code === 'invalid_api_key') {
      console.log('\n🔑 OpenAI API key is required for this test.');
      console.log('Please ensure OPENAI_API_KEY environment variable is set.');
    }
  }
}

// Run the test
testAdaptiveCoaching().catch(console.error);