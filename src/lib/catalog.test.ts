import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Word } from '../types.ts';

const words: Word[] = ['japanese.json', 'japanese-extended.json'].flatMap((file) =>
  JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8')),
);
const topics: { unit: number; title: string; words: string[] }[] = JSON.parse(
  readFileSync(new URL('../data/section4-topics.json', import.meta.url), 'utf8'),
);

test('expanded vocabulary retains stable IDs, readable text, original source words, and four collections', () => {
  assert.ok(words.length >= 4000);
  assert.equal(new Set(words.map((word) => word.id)).size, words.length);
  for (const word of words) {
    assert.equal(word.id, `duo:${word.japanese.normalize('NFKC')}`);
    assert.ok(word.meaning.trim());
    assert.match(word.japanese, /[\u3040-\u30ff\u3400-\u9fff]|^(wifi|sns|〇)$/i);
    assert.ok(
      ![word.japanese, word.meaning, word.reading || ''].some((value) => /<[^>]*>/.test(value)),
    );
    assert.ok(['1', '2', '3', '4'].includes(word.level));
  }
  for (const level of ['1', '2', '3', '4'])
    assert.ok(words.filter((word) => word.level === level).length >= 100);
  assert.equal(words.filter((word) => word.source === 'project').length, 713);
  assert.equal(words.filter((word) => word.source === 'community').length, 735);
  for (const word of words.filter((word) => word.source === 'legacy')) {
    assert.ok(word.skill && word.dictionaryId && word.reading);
    assert.ok(word.japanese.length >= 2);
  }
});

test('all 60 Section 4 topics resolve to unique words and the unit 57 reading fits waste sorting', () => {
  assert.deepEqual(
    topics.map((topic) => topic.unit),
    Array.from({ length: 60 }, (_, i) => i + 1),
  );
  const byJapanese = new Map(words.map((word) => [word.japanese, word]));
  for (const topic of topics) {
    assert.ok(topic.title.trim());
    assert.ok(topic.words.length >= 10);
    assert.equal(new Set(topic.words).size, topic.words.length);
    for (const term of topic.words)
      assert.ok(byJapanese.has(term), `${term} missing in unit ${topic.unit}`);
  }
  assert.equal(topics[56].title, 'Reduce waste at home');
  assert.ok(topics[56].words.includes('分別'));
  assert.equal(byJapanese.get('分別')?.reading, 'ぶんべつ');
  assert.equal(byJapanese.get('出店')?.reading, 'でみせ');
});
