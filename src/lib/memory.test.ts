import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { unit57Memory } from '../data/unit57-memory.ts';
import { chunkReading, getMemoryAid } from './memory.ts';
import { memoryPhrases } from '../data/memory-notes.ts';
import imageIndex from '../data/illustrations.json' with { type: 'json' };
import type { Word } from '../types.ts';

const words: Word[] = ['japanese.json', 'japanese-extended.json'].flatMap((file) =>
  JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8')),
);
const topics: { unit: number; words: string[] }[] = JSON.parse(
  readFileSync(new URL('../data/section4-topics.json', import.meta.url), 'utf8'),
);

test('every unit 57 word has a memory aid with its dictionary reading and a local WebP illustration', () => {
  const expected = topics.find((topic) => topic.unit === 57)!.words;
  assert.deepEqual(unit57Memory.map((aid) => aid.japanese).sort(), [...expected].sort());
  assert.equal(new Set(unit57Memory.map((aid) => aid.illustration)).size, expected.length);

  for (const aid of unit57Memory) {
    const word = words.find((item) => item.japanese === aid.japanese)!;
    assert.equal(aid.reading, word.reading, aid.japanese);
    assert.equal(getMemoryAid(word), aid);
    assert.match(aid.illustration, /^[a-z-]+$/);
    for (const text of [
      aid.chinese,
      aid.connection,
      aid.picture,
      aid.alt,
      aid.example,
      aid.exampleMeaning,
    ])
      assert.ok(text.trim(), `Missing memory content for ${aid.japanese}`);
    assert.match(aid.exampleReading, /^[\u3040-\u30ff\s。]+$/u);
    const image = readFileSync(
      new URL(`../../public/illustrations/unit57/${aid.illustration}.webp`, import.meta.url),
    );
    assert.equal(image.toString('ascii', 0, 4), 'RIFF');
    assert.equal(image.toString('ascii', 8, 12), 'WEBP');
    assert.ok(image.length > 1000 && image.length < 150_000, aid.illustration);
  }
});

test('memory aids do not assume the sorting sense for a different reading or an imported definition', () => {
  const sorting = words.find((word) => word.japanese === '分別')!;
  assert.ok(getMemoryAid(sorting));
  assert.equal(getMemoryAid({ ...sorting, reading: 'ふんべつ', meaning: 'judgment' }), undefined);
  assert.equal(
    getMemoryAid({
      ...sorting,
      source: 'custom',
      level: 'custom',
      id: 'custom:分別',
      meaning: 'my own definition',
    }),
    undefined,
  );
  assert.equal(getMemoryAid(words.find((word) => word.japanese === 'おちゃ')!)?.chinese, '茶');
});

test('every bundled word has a memory cue and indexed images are real local WebP assets', () => {
  const byId = new Map(words.map((word) => [word.id, word]));
  for (const word of words) {
    const aid = getMemoryAid(word);
    assert.ok(aid, word.japanese);
    assert.ok(aid.connection.trim(), word.japanese);
    if (!word.reading && /[\u3400-\u9fff]/u.test(word.japanese)) assert.equal(aid.chunks, '');
  }
  for (const [id, file] of Object.entries(imageIndex)) {
    assert.ok(byId.has(id), id);
    assert.match(file, /^illustrations\/(unit57|vocabulary)\/[a-z0-9-]+\.webp$/);
    const image = readFileSync(new URL(`../../public/${file}`, import.meta.url));
    assert.equal(image.toString('ascii', 0, 4), 'RIFF');
    assert.equal(image.toString('ascii', 8, 12), 'WEBP');
  }
});

test('all beginner words have original practice phrases, and kana chunks preserve small kana and long vowels', () => {
  for (const word of words.filter((word) => word.level === '1')) {
    assert.ok(memoryPhrases[word.japanese], word.japanese);
    const aid = getMemoryAid(word)!;
    assert.ok(
      aid.chinese && aid.example && aid.exampleReading && aid.exampleMeaning,
      word.japanese,
    );
  }
  assert.equal(chunkReading('きょう'), 'きょ・う');
  assert.equal(chunkReading('コーヒー'), 'コー・ヒー');
  assert.equal(chunkReading('きっぷ'), 'き・っ・ぷ');
  assert.equal(getMemoryAid(words.find((word) => word.japanese === 'は')!)?.chunks, 'わ');
});
