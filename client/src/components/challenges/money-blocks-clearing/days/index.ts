// Day content imports for Money Blocks Clearing Challenge
import { day00Content } from './day-00';
import { day01Content } from './day-01';
import { day02Content } from './day-02';
import { day03Content } from './day-03';
import { day04Content } from './day-04';

// Day content map
export const moneyBlocksClearingDays: Record<number, any> = {
  0: day00Content,
  1: day01Content,
  2: day02Content,
  3: day03Content,
  4: day04Content,
  // Additional days will be added here as they're created
};

// For days not yet created, generate basic content structure
const generatePlaceholderDay = (day: number) => ({
  day,
  title: `Day ${day}: Money Blocks Clearing Journey`,
  subtitle: "Continue your transformative journey to financial freedom",
  description: "Today's practice focuses on deepening your understanding and clearing of money blocks through conscious awareness and transformation techniques.",
  duration: "25-30 minutes",
  topic: "Money Block Transformation",
  science: "Continued practice of neural reprogramming strengthens new pathways and creates lasting change in your relationship with money and abundance.",
  
  practice: {
    morning: {
      title: "Morning Money Clearing Practice",
      steps: [
        "Begin with 5 minutes of centering breath work",
        "Set your intention for today's money consciousness practice",
        "Scan for any money-related thoughts or concerns",
        "Apply clearing techniques from previous days",
        "Visualize abundant energy flowing through your day"
      ]
    },
    
    daytime: {
      title: "Conscious Money Awareness",
      steps: [
        "Notice all money-related thoughts and feelings throughout the day",
        "Apply transformation techniques when limiting beliefs arise",
        "Practice gratitude for all forms of abundance you encounter",
        "Make conscious choices aligned with your new money beliefs"
      ]
    },
    
    evening: {
      title: "Integration and Reflection",
      steps: [
        "Reflect on your money consciousness growth today",
        "Celebrate any shifts or breakthroughs you experienced",
        "Clear any remaining blocks that surfaced",
        "Set intentions for continued expansion tomorrow"
      ]
    },
    
    tips: [
      "Consistency in practice creates lasting transformation",
      "Each day builds upon previous days' clearing work",
      "Trust the process even when change feels gradual",
      "Your willingness to grow is already creating shifts"
    ],
    
    insights: [
      "Daily practice compounds into significant transformation",
      "Each cleared block opens space for greater abundance",
      "Your commitment to growth inspires positive change",
      "Small daily shifts create profound long-term results"
    ]
  },
  
  affirmation: `I am dedicated to my money consciousness transformation and embrace the abundance that flows to me each day.`,
  
  quote: {
    text: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu"
  }
});

// Export function to get day content
export const getMoneyBlocksClearingDayContent = (day: number) => {
  return moneyBlocksClearingDays[day] || generatePlaceholderDay(day);
};