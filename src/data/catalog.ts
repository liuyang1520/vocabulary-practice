import vocabulary from './japanese.json';
import extendedVocabulary from './japanese-extended.json';
import topics from './section4-topics.json';
import type { Level, Word } from '../types';

export const defaultWords = [...vocabulary, ...extendedVocabulary] as Word[];
export const section4Topics = topics;
const topicWords = new Set(topics.flatMap((topic) => topic.words));
const unitWords = new Map(topics.map((topic) => [String(topic.unit), new Set(topic.words)]));

export function isInCollection(word: Word, level: Level | 'all', unit = 'all'): boolean {
  if (level === 'all') return true;
  if (level === '4')
    return (
      word.source !== 'custom' &&
      ((unit === 'all' ? topicWords : unitWords.get(unit))?.has(word.japanese) || false)
    );
  return word.level === level;
}
export const levels: {
  id: Level;
  title: string;
  tag: string;
  description: string;
  kanji: string;
  source: string;
}[] = [
  {
    id: '1',
    title: 'First words',
    tag: 'Beginner',
    description: 'Greetings, introductions, and the little essentials.',
    kanji: '一',
    source: 'Duolingo section 1 · community snapshot',
  },
  {
    id: '2',
    title: 'Everyday Japanese',
    tag: 'Elementary',
    description: 'Family, food, places, and everyday conversations.',
    kanji: '二',
    source: 'Duolingo section 2 · partial community snapshot',
  },
  {
    id: '3',
    title: 'A wider vocabulary',
    tag: 'Extended practice',
    description: 'Build your range with more words and expressions.',
    kanji: '三',
    source: 'Original export + legacy Duolingo course vocabulary',
  },
  {
    id: '4',
    title: 'Section 4 companion',
    tag: 'Unit topics',
    description: 'Practice everyday topics from all 60 Section 4 units.',
    kanji: '四',
    source: 'Curated companion words for the 2026 Section 4 unit topics',
  },
];

export function levelTitle(level: Level | 'all'): string {
  if (level === 'all') return 'All vocabulary';
  return levels.find((item) => item.id === level)?.title || 'My vocabulary';
}
