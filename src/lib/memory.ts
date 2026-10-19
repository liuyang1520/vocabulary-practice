import { unit57Memory, type MemoryAid } from '../data/unit57-memory.ts';
import type { Word } from '../types.ts';
import illustrations from '../data/illustrations.json' with { type: 'json' };
import lexicalData from '../data/memory-lexicon.json' with { type: 'json' };
import { memoryConnections, memoryMeanings, memoryPhrases } from '../data/memory-notes.ts';
import { splitMeanings } from './study.ts';

const aidsByWord = new Map(unit57Memory.map((aid) => [aid.japanese, aid]));
const imageIndex: Record<string, string> = illustrations;
const lexicon: {
  words: Record<
    string,
    { reading: string; meaning: string; partOfSpeech: string[]; dictionaryId: string }
  >;
  kanji: Record<string, string[]>;
} = lexicalData;
const phrasesByDictionary = new Map<string, [string, string, string, string]>();
const connectionsByDictionary = new Map<string, string>();
function dictionaryKey(source: { dictionaryId: string; reading: string; meaning: string }): string {
  const meaning = (splitMeanings(source.meaning)[0] || source.meaning)
    .replace(/\([^)]*\)/gu, '')
    .trim()
    .replace(/^(?:a|an|the|to)\s+/iu, '')
    .toLowerCase();
  return `${source.dictionaryId}:${source.reading}:${meaning}`;
}
for (const [japanese, phrase] of Object.entries(memoryPhrases)) {
  const source = lexicon.words[`duo:${japanese}`];
  if (source) phrasesByDictionary.set(dictionaryKey(source), phrase);
}
for (const [japanese, connection] of Object.entries(memoryConnections)) {
  const source = lexicon.words[`duo:${japanese}`];
  if (source) connectionsByDictionary.set(dictionaryKey(source), connection);
}
const pronunciationChunks: Record<string, string> = {
  は: 'わ',
  を: 'お',
  こんにちは: 'こ・ん・に・ち・わ',
  こんばんは: 'こ・ん・ば・ん・わ',
};

export function chunkReading(reading: string): string {
  const chunks: string[] = [];
  for (const character of reading) {
    if (/[ゃゅょぁぃぅぇぉャュョァィゥェォー]/u.test(character) && chunks.length) {
      chunks[chunks.length - 1] += character;
    } else {
      chunks.push(character);
    }
  }
  return chunks.join('・');
}

function recallPrompt(meaning: string, tags: string[]): string {
  if (tags.includes('prt'))
    return `Use this word in a short phrase for “${meaning}.” Recall what it connects or marks in the phrase.`;
  if (tags.includes('pn'))
    return `Point to who or what “${meaning}” refers to, then say the Japanese word without looking.`;
  if (tags.some((tag) => /^(v[1-5]|vs|vk|vz)/u.test(tag)))
    return `Act out “${meaning}” in your mind. Cover the reading and say the Japanese action aloud.`;
  if (tags.some((tag) => tag.startsWith('adj')))
    return `Picture something with the quality “${meaning},” then recall the Japanese word from the scene.`;
  if (tags.includes('int') || tags.includes('exp'))
    return `Imagine the moment when someone would say “${meaning}.” Use their tone and gesture to recall the Japanese expression.`;
  if (tags.includes('num') || tags.includes('ctr'))
    return `Picture what you are counting for “${meaning}.” Recall the complete Japanese expression aloud.`;
  return `Cover the word and recall the Japanese for “${meaning}.” Then reverse it: look at the Japanese and recall the meaning.`;
}

export function getMemoryAid(word: Word): MemoryAid | undefined {
  if (word.source === 'custom') return undefined;
  const aid = aidsByWord.get(word.japanese);
  // A different reading can carry a different meaning (e.g. 分別).
  if (aid) return (word.reading || word.japanese) === aid.reading ? aid : undefined;

  const source = lexicon.words[word.id];
  const sourceMatches = source?.reading === (word.reading || '');
  const key = sourceMatches ? dictionaryKey(source) : '';
  const phrase = memoryPhrases[word.japanese] || phrasesByDictionary.get(key);
  const meaning = memoryMeanings[word.japanese] || splitMeanings(word.meaning)[0] || word.meaning;
  const reading = word.reading || (/^[\u3040-\u30ff]+$/u.test(word.japanese) ? word.japanese : '');
  const characterCues = [...new Set(word.japanese)].flatMap((character) =>
    lexicon.kanji[character] ? [{ character, meanings: lexicon.kanji[character] }] : [],
  );
  const tags = sourceMatches ? source.partOfSpeech : [];
  const connection =
    memoryConnections[word.japanese] ||
    connectionsByDictionary.get(key) ||
    (characterCues.length
      ? `Use the familiar characters as visual cues for “${meaning}.” Learn the whole word’s Japanese meaning and reading together; the character meanings below are memory cues.`
      : /^[\u30a0-\u30ff\s]+$/u.test(word.japanese)
        ? `Connect “${word.japanese}” with its English meaning, “${meaning}.” Listen to the Japanese rhythm and link the sound to one clear scene.`
        : `Link “${word.japanese}” to one scene for “${meaning}.” Say the reading in chunks, then imagine the scene again without looking at the word.`);
  return {
    japanese: word.japanese,
    reading,
    chinese: phrase?.[0] || '',
    chunks: pronunciationChunks[word.japanese] || chunkReading(reading),
    connection,
    picture: `Use this scene to recall “${meaning}.”`,
    illustration: imageIndex[word.id] || '',
    imagePath: imageIndex[word.id],
    alt: `Vocabulary illustration for ${word.japanese}: ${meaning}.`,
    example: phrase?.[1] || '',
    exampleReading: phrase?.[2] || '',
    exampleMeaning: phrase?.[3] || '',
    characterCues,
    recall: recallPrompt(meaning, tags),
  };
}

export function getMemoryStrategy(word: Word): { title: string; tip: string } {
  if (/^[\u30a0-\u30ff\s]+$/u.test(word.japanese)) {
    return {
      title: 'Try an English connection',
      tip: 'Look for a familiar loanword in the katakana. Check the listed meaning, listen to the Japanese pronunciation, then picture one scene and say the word aloud.',
    };
  }
  if (/[\u3400-\u9fff]/u.test(word.japanese)) {
    return {
      title: 'Use Chinese as a meaning cue',
      tip: 'Check the listed meaning before connecting familiar characters to Chinese. Listen to the Japanese reading, attach it to one vivid scene, then cover the answer and recall it.',
    };
  }
  return {
    title: 'Give the sound a scene',
    tip: 'Listen to the word, repeat its kana in short chunks, and imagine one scene for the listed meaning. Cover the answer and try saying the Japanese word from that scene.',
  };
}
