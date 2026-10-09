import type { Direction, Word } from '../types.ts';

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function normalizeAnswer(answer: string): string {
  return answer
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[.!?。！？]/g, '')
    .replace(/\s+/g, ' ');
}

export function isCorrectAnswer(answer: string, word: Word, direction: Direction): boolean {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return false;
  if (direction === 'en-ja') {
    return [word.japanese, word.reading].some(
      (value) => value && normalizeAnswer(value) === normalized,
    );
  }
  return splitMeanings(word.meaning).some((value) =>
    [value, value.replace(/\([^)]*\)/g, ' '), value.replace(/[()]/g, '')].some((variant) => {
      const expected = normalizeAnswer(variant);
      return normalized === expected || normalized === expected.replace(/^(?:a|an|the|to) /, '');
    }),
  );
}

export function splitMeanings(meaning: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < meaning.length; i++) {
    if (meaning[i] === '(') depth++;
    else if (meaning[i] === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0 && /[,;]/.test(meaning[i])) {
      parts.push(meaning.slice(start, i));
      start = i + 1;
    }
  }
  return [...parts, meaning.slice(start)].map((part) => part.trim()).filter(Boolean);
}

export function answerLabel(word: Word, direction: Direction): string {
  return direction === 'ja-en' ? word.meaning : word.japanese;
}

export function makeChoices(word: Word, pool: Word[], direction: Direction): string[] {
  const correct = answerLabel(word, direction);
  // Exclude synonyms so a distractor cannot also be an accepted answer.
  const distractors = [
    ...new Set(
      shuffle(pool)
        .filter((candidate) => candidate.id !== word.id)
        .filter((candidate) => {
          const overlappingMeaning =
            splitMeanings(candidate.meaning).some((meaning) =>
              isCorrectAnswer(meaning, word, 'ja-en'),
            ) ||
            splitMeanings(word.meaning).some((meaning) =>
              isCorrectAnswer(meaning, candidate, 'ja-en'),
            );
          return (
            !overlappingMeaning &&
            (direction === 'ja-en' || !isCorrectAnswer(candidate.japanese, word, direction))
          );
        })
        .map((candidate) => answerLabel(candidate, direction)),
    ),
  ].slice(0, 3);
  return shuffle([correct, ...distractors]);
}

export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function studyStreak(completedDates: string[], today = new Date()): number {
  const days = new Set(completedDates.map((date) => localDate(new Date(date))));
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
