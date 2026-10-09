export interface VoiceInfo {
  lang: string;
  name: string;
  voiceURI: string;
  localService: boolean;
}

export function japaneseVoices<T extends VoiceInfo>(voices: readonly T[]): T[] {
  return voices
    .filter((voice) => /^ja(?:[-_]|$)/i.test(voice.lang))
    .sort((a, b) => {
      const difference = voiceScore(b) - voiceScore(a);
      return difference || a.name.localeCompare(b.name);
    });
}

function voiceScore(voice: VoiceInfo): number {
  // Chrome's first Japanese voice may be a novelty voice. Prefer enhanced voices
  // and the standard Japanese voices supplied by Google, Microsoft, and Apple.
  if (/natural|neural|premium|enhanced/i.test(voice.name)) return 100;
  if (/google/i.test(voice.name)) return 80;
  if (/nanami|keita|haruka|ayumi|ichiro/i.test(voice.name)) return 60;
  if (/kyoko|otoya/i.test(voice.name)) return 50;
  if (/eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley/i.test(voice.name)) return -10;
  return 10;
}

export function selectJapaneseVoice<T extends VoiceInfo>(
  voices: readonly T[],
  preferredURI: string,
): T | undefined {
  const japanese = japaneseVoices(voices);
  return japanese.find((voice) => voice.voiceURI === preferredURI) || japanese[0];
}
