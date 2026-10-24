export type VerbGroup = 'godan' | 'ichidan' | 'suru' | 'kuru';

export interface StudyVerb {
  id: string;
  japanese: string;
  reading: string;
  meaning: string;
  group: VerbGroup;
  note?: string;
}

export const verbForms = [
  {
    id: 'dictionary',
    label: 'Dictionary',
    use: 'Plain nonpast: habits, facts, or future actions.',
  },
  {
    id: 'polite',
    label: 'Polite · ます',
    use: 'A neutral, polite way to describe habits or future actions.',
  },
  { id: 'polite-negative', label: 'Polite negative', use: 'Do not / will not do something.' },
  { id: 'polite-past', label: 'Polite past', use: 'An action that happened, expressed politely.' },
  {
    id: 'polite-past-negative',
    label: 'Polite past negative',
    use: 'An action that did not happen, expressed politely.',
  },
  {
    id: 'negative',
    label: 'Plain negative · ない',
    use: 'A negative statement or a building block for other patterns.',
  },
  {
    id: 'past-negative',
    label: 'Plain past negative',
    use: 'Did not do something, in plain style.',
  },
  {
    id: 'te',
    label: 'て-form',
    use: 'Connect actions; add ください for a request. This form alone has no tense.',
  },
  {
    id: 'past',
    label: 'Plain past · た',
    use: 'A past action; also used in experiences and conditionals.',
  },
  {
    id: 'potential',
    label: 'Potential · can',
    use: 'Ability or possibility. These are the standard full forms.',
  },
  {
    id: 'volitional',
    label: 'Volitional · let’s',
    use: 'A casual suggestion or intention. The polite equivalent uses ましょう.',
  },
  {
    id: 'conditional',
    label: 'Conditional · ば',
    use: 'If the action or condition happens; usage depends on context.',
  },
  {
    id: 'desire',
    label: 'Desire · たい',
    use: 'Want to do something. Usually describes your own wish in statements.',
  },
] as const;

export type VerbForm = (typeof verbForms)[number]['id'];

const endings: Record<
  string,
  { a: string; i: string; e: string; o: string; te: string; past: string }
> = {
  う: { a: 'わ', i: 'い', e: 'え', o: 'お', te: 'って', past: 'った' },
  く: { a: 'か', i: 'き', e: 'け', o: 'こ', te: 'いて', past: 'いた' },
  ぐ: { a: 'が', i: 'ぎ', e: 'げ', o: 'ご', te: 'いで', past: 'いだ' },
  す: { a: 'さ', i: 'し', e: 'せ', o: 'そ', te: 'して', past: 'した' },
  つ: { a: 'た', i: 'ち', e: 'て', o: 'と', te: 'って', past: 'った' },
  ぬ: { a: 'な', i: 'に', e: 'ね', o: 'の', te: 'んで', past: 'んだ' },
  ぶ: { a: 'ば', i: 'び', e: 'べ', o: 'ぼ', te: 'んで', past: 'んだ' },
  む: { a: 'ま', i: 'み', e: 'め', o: 'も', te: 'んで', past: 'んだ' },
  る: { a: 'ら', i: 'り', e: 'れ', o: 'ろ', te: 'って', past: 'った' },
};

/** Only conjugate curated verbs with an explicit group; endings cannot reliably identify it. */
export function conjugate(verb: StudyVerb, form: VerbForm, kana = false): string {
  const word = kana ? verb.reading : verb.japanese;
  if (form === 'dictionary') return word;
  let stem: string;
  let negative: string;
  let te: string;
  let past: string;
  let potential: string;
  let volitional: string;
  let conditional: string;

  if (verb.group === 'suru') {
    const base = word.slice(0, -2);
    stem = base + 'し';
    negative = base + 'しない';
    te = base + 'して';
    past = base + 'した';
    potential = base + 'できる';
    volitional = base + 'しよう';
    conditional = base + 'すれば';
  } else if (verb.group === 'kuru') {
    stem = kana ? 'き' : '来';
    negative = kana ? 'こない' : '来ない';
    te = kana ? 'きて' : '来て';
    past = kana ? 'きた' : '来た';
    potential = kana ? 'こられる' : '来られる';
    volitional = kana ? 'こよう' : '来よう';
    conditional = kana ? 'くれば' : '来れば';
  } else if (verb.group === 'ichidan') {
    stem = word.slice(0, -1);
    negative = stem + 'ない';
    te = stem + 'て';
    past = stem + 'た';
    potential = stem + 'られる';
    volitional = stem + 'よう';
    conditional = stem + 'れば';
  } else {
    const base = word.slice(0, -1);
    const ending = endings[word.slice(-1)];
    if (!ending) throw new Error(`Unsupported verb ending: ${word}`);
    stem = base + ending.i;
    negative = base + ending.a + 'ない';
    const isGo = verb.id === 'iku';
    te = base + (isGo ? 'って' : ending.te);
    past = base + (isGo ? 'った' : ending.past);
    potential = base + ending.e + 'る';
    volitional = base + ending.o + 'う';
    conditional = base + ending.e + 'ば';
  }

  switch (form) {
    case 'polite':
      return stem + 'ます';
    case 'polite-negative':
      return stem + 'ません';
    case 'polite-past':
      return stem + 'ました';
    case 'polite-past-negative':
      return stem + 'ませんでした';
    case 'negative':
      return negative;
    case 'past-negative':
      return negative.slice(0, -1) + 'かった';
    case 'te':
      return te;
    case 'past':
      return past;
    case 'potential':
      return potential;
    case 'volitional':
      return volitional;
    case 'conditional':
      return conditional;
    case 'desire':
      return stem + 'たい';
  }
}

export const studyVerbs: StudyVerb[] = [
  { id: 'taberu', japanese: '食べる', reading: 'たべる', meaning: 'eat', group: 'ichidan' },
  { id: 'nomu', japanese: '飲む', reading: 'のむ', meaning: 'drink', group: 'godan' },
  {
    id: 'iku',
    japanese: '行く',
    reading: 'いく',
    meaning: 'go',
    group: 'godan',
    note: 'Exception: 行く → 行って / 行った, rather than the usual く ending change.',
  },
  {
    id: 'kuru',
    japanese: '来る',
    reading: 'くる',
    meaning: 'come',
    group: 'kuru',
    note: 'The reading changes: くる → きます → こない. Listen to each form.',
  },
  {
    id: 'suru',
    japanese: 'する',
    reading: 'する',
    meaning: 'do',
    group: 'suru',
    note: 'Irregular: します, しない, して, and potential できる.',
  },
  { id: 'miru', japanese: '見る', reading: 'みる', meaning: 'see / watch', group: 'ichidan' },
  { id: 'kiku', japanese: '聞く', reading: 'きく', meaning: 'listen / ask', group: 'godan' },
  { id: 'hanasu', japanese: '話す', reading: 'はなす', meaning: 'speak', group: 'godan' },
  { id: 'yomu', japanese: '読む', reading: 'よむ', meaning: 'read', group: 'godan' },
  { id: 'kaku', japanese: '書く', reading: 'かく', meaning: 'write', group: 'godan' },
  {
    id: 'kau',
    japanese: '買う',
    reading: 'かう',
    meaning: 'buy',
    group: 'godan',
    note: 'For う verbs, the plain negative changes う to わ: 買わない.',
  },
  { id: 'matsu', japanese: '待つ', reading: 'まつ', meaning: 'wait', group: 'godan' },
  {
    id: 'kaeru',
    japanese: '帰る',
    reading: 'かえる',
    meaning: 'return home',
    group: 'godan',
    note: 'A godan verb despite its える ending: 帰ります, 帰って, 帰らない.',
  },
  {
    id: 'hairu',
    japanese: '入る',
    reading: 'はいる',
    meaning: 'enter',
    group: 'godan',
    note: 'A godan exception to the common いる / える shortcut: 入って, 入らない.',
  },
  {
    id: 'hashiru',
    japanese: '走る',
    reading: 'はしる',
    meaning: 'run',
    group: 'godan',
    note: 'Another いる-ending godan verb: 走ります, 走って.',
  },
  { id: 'oyogu', japanese: '泳ぐ', reading: 'およぐ', meaning: 'swim', group: 'godan' },
  { id: 'asobu', japanese: '遊ぶ', reading: 'あそぶ', meaning: 'play / hang out', group: 'godan' },
  { id: 'shinu', japanese: '死ぬ', reading: 'しぬ', meaning: 'die', group: 'godan' },
  { id: 'toru', japanese: '取る', reading: 'とる', meaning: 'take', group: 'godan' },
  { id: 'tsukuru', japanese: '作る', reading: 'つくる', meaning: 'make', group: 'godan' },
  { id: 'okiru', japanese: '起きる', reading: 'おきる', meaning: 'wake up', group: 'ichidan' },
  { id: 'neru', japanese: '寝る', reading: 'ねる', meaning: 'sleep / go to bed', group: 'ichidan' },
  {
    id: 'akeru',
    japanese: '開ける',
    reading: 'あける',
    meaning: 'open something',
    group: 'ichidan',
  },
  {
    id: 'oboeru',
    japanese: '覚える',
    reading: 'おぼえる',
    meaning: 'memorize / remember',
    group: 'ichidan',
  },
  { id: 'kariru', japanese: '借りる', reading: 'かりる', meaning: 'borrow', group: 'ichidan' },
  {
    id: 'benkyou',
    japanese: '勉強する',
    reading: 'べんきょうする',
    meaning: 'study',
    group: 'suru',
  },
  {
    id: 'renshuu',
    japanese: '練習する',
    reading: 'れんしゅうする',
    meaning: 'practice',
    group: 'suru',
  },
];

export function normalizeJapanese(answer: string): string {
  return answer
    .normalize('NFKC')
    .trim()
    .replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[\s。！？!?.,、]/g, '');
}

export function matchesJapanese(answer: string, accepted: readonly string[]): boolean {
  const normalized = normalizeJapanese(answer);
  return !!normalized && accepted.some((candidate) => normalizeJapanese(candidate) === normalized);
}
