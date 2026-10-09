import assert from 'node:assert/strict';
import { test } from 'node:test';
import { japaneseVoices, selectJapaneseVoice } from './speech.ts';
import type { VoiceInfo } from './speech.ts';

const voice = (name: string, lang = 'ja-JP', localService = true): VoiceInfo => ({
  name,
  lang,
  localService,
  voiceURI: `${name}:${lang}`,
});

test('automatic Japanese speech skips first-listed novelty voices in favor of Kyoko', () => {
  const voices = [voice('Eddy'), voice('Grandma'), voice('Kyoko'), voice('Samantha', 'en-US')];
  assert.equal(selectJapaneseVoice(voices, 'auto')?.name, 'Kyoko');
  assert.equal(japaneseVoices(voices).length, 3);
  assert.equal(voices[0].name, 'Eddy');
});

test('prefers enhanced voices and Google Japanese when exposed by Chrome', () => {
  const voices = [
    voice('Kyoko'),
    voice('Google 日本語', 'ja-JP', false),
    voice('Otoya (Enhanced)'),
  ];
  assert.equal(selectJapaneseVoice(voices, 'auto')?.name, 'Otoya (Enhanced)');
  assert.equal(selectJapaneseVoice(voices.slice(0, 2), 'auto')?.name, 'Google 日本語');
});

test('respects an explicit Japanese voice choice and falls back if that voice is unavailable', () => {
  const voices = [voice('Eddy'), voice('Kyoko'), voice('English natural', 'en-US')];
  assert.equal(selectJapaneseVoice(voices, voices[0].voiceURI)?.name, 'Eddy');
  assert.equal(selectJapaneseVoice(voices, 'removed-voice')?.name, 'Kyoko');
  assert.equal(selectJapaneseVoice(voices, voices[2].voiceURI)?.name, 'Kyoko');
  assert.equal(selectJapaneseVoice([], 'auto'), undefined);
  assert.equal(selectJapaneseVoice([voice('English natural', 'en-US')], 'auto'), undefined);
});
