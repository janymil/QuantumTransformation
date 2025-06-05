// Money Blocks Clearing Challenge - 30 Day Content
export interface DayContent {
  day: number;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  topic: string;
  science: string;
  practice: {
    morning?: {
      title: string;
      steps: string[];
    };
    daytime?: {
      title: string;
      steps: string[];
    };
    evening?: {
      title: string;
      steps: string[];
    };
    steps?: string[];
    tips: string[];
    insights: string[];
  };
  affirmation: string;
  quote?: {
    text: string;
    author: string;
  };
}

import { getMoneyBlocksClearingDayContent } from './days/index';

export function getMoneyBlocksClearingContent(day: number): DayContent {
  return getMoneyBlocksClearingDayContent(day);
}

