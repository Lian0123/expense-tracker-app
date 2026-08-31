import type { TimeScene } from '../types/domain';
export const sceneMeta: Record<
  TimeScene,
  { label: string; en: string; greeting: string; enGreeting: string; tint: string }
> = {
  morning: {
    label: '清晨',
    en: 'Morning',
    greeting: '早安，今天也慢慢來。',
    enGreeting: 'Good morning. Take today one gentle step at a time.',
    tint: '#ffd6a3',
  },
  noon: {
    label: '中午',
    en: 'Noon',
    greeting: '午安，替今天留一點空白。',
    enGreeting: 'Good afternoon. Leave a little room for yourself today.',
    tint: '#bde8e1',
  },
  dusk: {
    label: '傍晚',
    en: 'Dusk',
    greeting: '夕陽好漂亮，謝謝你記下今天。',
    enGreeting: 'What a lovely sunset. Thank you for showing up today.',
    tint: '#f7b18b',
  },
  evening: {
    label: '晚上',
    en: 'Evening',
    greeting: '晚安，讓數字幫你安心。',
    enGreeting: 'Good evening. Let your numbers bring a little calm.',
    tint: '#8bb8d8',
  },
  'deep-night': {
    label: '深夜',
    en: 'Deep night',
    greeting: '夜深了，記一筆就好，去休息吧。',
    enGreeting: 'It is late. One small entry is enough, then get some rest.',
    tint: '#5c709c',
  },
};

export function getTimeScene(hour = new Date().getHours()): TimeScene {
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 15) return 'noon';
  if (hour >= 15 && hour < 18) return 'dusk';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'deep-night';
}
