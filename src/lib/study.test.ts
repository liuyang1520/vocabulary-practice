import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isCorrectAnswer, makeChoices, shuffle, studyStreak } from './study.ts';
import type { Word } from '../types.ts';

const tea: Word = {
  id: 'tea',
  japanese: 'お茶',
  reading: 'おちゃ',
  meaning: 'tea, green tea',
  level: '1',
  source: 'community',
};

test('accepts complete listed translations, articles, case, and punctuation; rejects partial or empty answers', () => {
  assert.equal(isCorrectAnswer(' GREEN TEA! ', tea, 'ja-en'), true);
  assert.equal(isCorrectAnswer('tea', tea, 'ja-en'), true);
  assert.equal(isCorrectAnswer('te', tea, 'ja-en'), false);
  assert.equal(isCorrectAnswer('', tea, 'ja-en'), false);
  assert.equal(isCorrectAnswer('water', tea, 'ja-en'), false);
  assert.equal(isCorrectAnswer('cat', { ...tea, meaning: 'a cat' }, 'ja-en'), true);
});

test('accepts Japanese script and listed readings, including equivalent full-width katakana', () => {
  for (const answer of ['お茶', 'おちゃ', 'オチャ', 'ｵﾁｬ'])
    assert.equal(isCorrectAnswer(answer, tea, 'en-ja'), true);
  assert.equal(isCorrectAnswer('ocha', tea, 'en-ja'), false);
});

test('dictionary glosses accept the core meaning and optional infinitive without treating parenthetical examples as answers', () => {
  const artifact = { ...tea, meaning: 'work (e.g. book, film, painting); piece' };
  assert.equal(isCorrectAnswer('work', artifact, 'ja-en'), true);
  assert.equal(isCorrectAnswer('piece', artifact, 'ja-en'), true);
  assert.equal(isCorrectAnswer('film', artifact, 'ja-en'), false);
  assert.equal(isCorrectAnswer('painting', artifact, 'ja-en'), false);
  assert.equal(
    isCorrectAnswer('reduce', { ...tea, meaning: 'to reduce; to decrease' }, 'ja-en'),
    true,
  );
  assert.equal(isCorrectAnswer('park', { ...tea, meaning: '(public) park' }, 'ja-en'), true);
});

test('multiple choice excludes overlapping meanings and duplicate labels', () => {
  const pool = [
    tea,
    ...['green tea, tea', 'water', 'cat', 'dog', 'water'].map((meaning, i) => ({
      ...tea,
      id: String(i),
      japanese: String(i),
      meaning,
    })),
  ];
  const choices = makeChoices(tea, pool, 'ja-en');
  assert.equal(choices.length, 4);
  assert.equal(new Set(choices).size, 4);
  assert.ok(choices.includes(tea.meaning));
  assert.ok(!choices.includes('green tea, tea'));
  assert.equal(makeChoices(tea, [tea], 'ja-en').length, 1);
});

test('shuffle preserves the original input and every item', () => {
  const input = [1, 2, 3, 4, 5];
  assert.deepEqual(shuffle(input).sort(), input);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
});

test('reverse multiple choice excludes alternative Japanese forms with the same English meaning', () => {
  const choices = makeChoices(
    tea,
    [
      tea,
      { ...tea, id: 'formal-tea', japanese: '茶', reading: 'ちゃ' },
      { ...tea, id: 'water', japanese: '水', meaning: 'water' },
    ],
    'en-ja',
  );
  assert.ok(!choices.includes('茶'));
  assert.ok(choices.includes('お茶'));
});

test('streak survives an unfinished today, ignores duplicate sessions, and breaks on gaps', () => {
  const today = new Date(2026, 9, 8, 12);
  const stamp = (day: number) => new Date(2026, 9, day, 12).toISOString();
  assert.equal(studyStreak([stamp(8), stamp(7), stamp(7), stamp(6)], today), 3);
  assert.equal(studyStreak([stamp(7), stamp(6)], today), 2);
  assert.equal(studyStreak([stamp(6), stamp(5)], today), 0);
  assert.equal(studyStreak([stamp(8), stamp(6)], today), 1);
});
