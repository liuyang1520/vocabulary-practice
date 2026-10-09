import assert from 'node:assert/strict';
import { test } from 'node:test';
import { importWords, parseCsv, wordsToCsv } from './csv.ts';

test('CSV handles BOM, quoted commas, escaped quotes, multiline fields, and CRLF', () => {
  assert.deepEqual(
    parseCsv('\uFEFFword,meaning\r\n猫,"cat, cats"\r\n挨拶,"say ""hello""\npolitely"'),
    [
      ['word', 'meaning'],
      ['猫', 'cat, cats'],
      ['挨拶', 'say "hello"\npolitely'],
    ],
  );
});

test('import accepts legacy headers and optional kana; skips duplicate personal words', () => {
  const existing = importWords('Word,Meaning\n猫,"cat, cats"', []);
  const imported = importWords(
    'word,translation,reading\n猫,cat,ねこ\n犬,dog,いぬ\n犬,dog,いぬ',
    existing,
  );
  assert.equal(imported.length, 1);
  assert.equal(imported[0].japanese, '犬');
  assert.equal(imported[0].reading, 'いぬ');
  assert.equal(imported[0].source, 'custom');
});

test('rejects malformed rows and incomplete quotes without partially importing', () => {
  for (const csv of ['', '猫,', '猫,cat,cats,ねこ', '猫,"cat', '猫,cat\n犬'])
    assert.throws(() => importWords(csv, []));
});

test('CSV export round-trips commas, quotes, and readings', () => {
  const words = importWords(
    'word,meaning,reading\n猫,"cat, cats",ねこ\n挨拶,"say ""hello""",あいさつ',
    [],
  );
  assert.deepEqual(importWords(wordsToCsv(words), []), words);
});
