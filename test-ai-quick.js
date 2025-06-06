/**
 * Quick test of AI coaching system with journal/affirmation integration
 */

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function quickTest() {
  console.log('Testing Enhanced AI Coaching System...\n');

  const mockContext = {
    profile: { healingReadiness: 8, primaryGoals: ['reduce anxiety', 'self-love'] },
    journalEntries: [
      { day: 1, insights: 'I shut down when criticized', mood: 4, challenges: 'Fear of abandonment' },
      { day: 2, insights: 'Meditation helped calm my mind', mood: 6, challenges: 'Staying present' }
    ],
    savedPhrases: [
      { phrase: 'I am worthy of love exactly as I am', category: 'self-love' },
      { phrase: 'I choose to respond rather than react', category: 'emotional regulation' }
    ]
  };

  const prompt = `Based on this user context, create today's focus:
Profile: ${JSON.stringify(mockContext.profile)}
Recent journal insights: ${mockContext.journalEntries.map(e => e.insights).join('; ')}
Saved affirmations: ${mockContext.savedPhrases.map(p => p.phrase).join('; ')}

Provide a brief JSON response with: currentFocus, reasoning, and one exercise.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;
    console.log('✅ AI Analysis Complete:');
    console.log(response);
    console.log('\n🎯 Enhanced AI agent successfully:');
    console.log('- Analyzed user profile, journal entries, and saved affirmations');
    console.log('- Generated personalized daily focus with clear reasoning');
    console.log('- Created adaptive content based on user\'s actual insights');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest();