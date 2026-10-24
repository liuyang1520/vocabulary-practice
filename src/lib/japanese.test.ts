import assert from 'node:assert/strict';
import { test } from 'node:test';
import { conjugate, matchesJapanese, studyVerbs, verbForms } from './japanese.ts';
import type { VerbForm } from './japanese.ts';

function form(id: string, selected: VerbForm, kana = false) {
  return conjugate(
    studyVerbs.find((verb) => verb.id === id)!,
    selected,
    kana,
  );
}

test('godan sound changes cover all nine endings and the 行く exception', () => {
  for (const [id, te, past] of [
    ['kau', '買って', '買った'],
    ['kaku', '書いて', '書いた'],
    ['oyogu', '泳いで', '泳いだ'],
    ['hanasu', '話して', '話した'],
    ['matsu', '待って', '待った'],
    ['shinu', '死んで', '死んだ'],
    ['asobu', '遊んで', '遊んだ'],
    ['yomu', '読んで', '読んだ'],
    ['kaeru', '帰って', '帰った'],
    ['iku', '行って', '行った'],
  ]) {
    assert.equal(form(id, 'te'), te);
    assert.equal(form(id, 'past'), past);
  }
  assert.equal(form('kau', 'negative'), '買わない');
  assert.equal(form('kau', 'past-negative'), '買わなかった');
  assert.equal(form('hairu', 'negative'), '入らない');
  assert.equal(form('hashiru', 'polite'), '走ります');
});

test('ichidan and irregular verbs produce standard full forms, including changed 来る readings', () => {
  const expectations: Record<string, string[]> = {
    taberu: [
      '食べる',
      '食べます',
      '食べません',
      '食べました',
      '食べませんでした',
      '食べない',
      '食べなかった',
      '食べて',
      '食べた',
      '食べられる',
      '食べよう',
      '食べれば',
      '食べたい',
    ],
    suru: [
      'する',
      'します',
      'しません',
      'しました',
      'しませんでした',
      'しない',
      'しなかった',
      'して',
      'した',
      'できる',
      'しよう',
      'すれば',
      'したい',
    ],
    kuru: [
      '来る',
      '来ます',
      '来ません',
      '来ました',
      '来ませんでした',
      '来ない',
      '来なかった',
      '来て',
      '来た',
      '来られる',
      '来よう',
      '来れば',
      '来たい',
    ],
  };
  for (const [id, expected] of Object.entries(expectations)) {
    assert.deepEqual(
      verbForms.map((item) => form(id, item.id)),
      expected,
    );
  }
  assert.deepEqual(
    [
      'dictionary',
      'polite',
      'negative',
      'te',
      'potential',
      'volitional',
      'conditional',
      'desire',
    ].map((item) => form('kuru', item as VerbForm, true)),
    ['くる', 'きます', 'こない', 'きて', 'こられる', 'こよう', 'くれば', 'きたい'],
  );
  assert.equal(form('benkyou', 'potential'), '勉強できる');
  assert.equal(form('benkyou', 'potential', true), 'べんきょうできる');
});

test('godan potential, volitional, conditional and desire use the right vowel rows', () => {
  assert.equal(form('yomu', 'potential'), '読める');
  assert.equal(form('hanasu', 'volitional'), '話そう');
  assert.equal(form('kaku', 'conditional'), '書けば');
  assert.equal(form('nomu', 'desire'), '飲みたい');
  assert.equal(form('kau', 'polite-past-negative'), '買いませんでした');
});

test('Japanese grading accepts listed kana, width and punctuation variants without erasing meaningful sounds', () => {
  assert.equal(matchesJapanese(' タベマシタ。 ', ['食べました', 'たべました']), true);
  assert.equal(matchesJapanese('ﾀﾍﾞﾏｼﾀ', ['たべました']), true);
  assert.equal(matchesJapanese('待って', ['待って', 'まって']), true);
  assert.equal(matchesJapanese('まて', ['まって']), false);
  assert.equal(matchesJapanese('おばさん', ['おばあさん']), false);
  assert.equal(matchesJapanese('食べます', ['食べました', 'たべました']), false);
  assert.equal(matchesJapanese('', ['です']), false);
  assert.equal(matchesJapanese('...', ['です']), false);
  assert.equal(matchesJapanese('tabemashita', ['たべました']), false);
});
