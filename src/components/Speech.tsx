import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { japaneseVoices, selectJapaneseVoice } from '../lib/speech';
import type { SavedState } from '../types';

interface SpeechContextValue {
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | undefined;
  speakingId: string | null;
  error: { id: string; message: string } | null;
  speak: (text: string, id: string) => void;
}

const SpeechContext = createContext<SpeechContextValue | null>(null);

export function useSpeech() {
  const context = useContext(SpeechContext);
  if (!context) throw new Error('Speech controls need a SpeechProvider.');
  return context;
}

export function SpeechProvider({
  preferences,
  children,
}: {
  preferences: Pick<SavedState, 'voiceURI' | 'speechRate'>;
  children: ReactNode;
}) {
  const supported = 'speechSynthesis' in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [error, setError] = useState<SpeechContextValue['error']>(null);
  const request = useRef(0);
  const pendingCleanup = useRef<(() => void) | null>(null);
  // Retain the utterance until it finishes; some Chrome versions otherwise
  // garbage-collect it before delivering the end event.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const update = () => setVoices(japaneseVoices(synth.getVoices()));
    update();
    synth.addEventListener('voiceschanged', update);
    return () => {
      request.current++;
      pendingCleanup.current?.();
      synth.removeEventListener('voiceschanged', update);
      synth.cancel();
    };
  }, [supported]);

  function speak(text: string, id: string) {
    if (!supported) {
      setError({ id, message: 'Audio is unavailable in this browser.' });
      return;
    }
    const synth = window.speechSynthesis;
    const token = ++request.current;
    pendingCleanup.current?.();
    pendingCleanup.current = null;
    synth.cancel();
    setError(null);
    setSpeakingId(id);

    const play = () => {
      if (token !== request.current) return;
      const voice = selectJapaneseVoice(synth.getVoices(), preferences.voiceURI);
      if (!voice) {
        setSpeakingId(null);
        setError({
          id,
          message: 'Add a Japanese voice in your device’s speech settings, then try again.',
        });
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.voice = voice;
      utterance.rate = preferences.speechRate;
      utteranceRef.current = utterance;
      const finish = () => {
        if (token !== request.current) return;
        setSpeakingId(null);
        utteranceRef.current = null;
      };
      utterance.onend = finish;
      utterance.onerror = (event) => {
        if (token !== request.current) return;
        finish();
        if (!['interrupted', 'canceled'].includes(event.error))
          setError({
            id,
            message: 'Couldn’t play this voice. Try another voice in Study settings.',
          });
      };
      synth.resume();
      synth.speak(utterance);
    };

    if (japaneseVoices(synth.getVoices()).length) play();
    else {
      // Chrome can return an empty voice list on first load. Wait for the list
      // without losing subsequent clicks or queuing obsolete pronunciations.
      let timer: ReturnType<typeof setTimeout>;
      const ready = () => {
        if (!japaneseVoices(synth.getVoices()).length) return;
        pendingCleanup.current?.();
        pendingCleanup.current = null;
        play();
      };
      synth.addEventListener('voiceschanged', ready);
      timer = setTimeout(() => {
        synth.removeEventListener('voiceschanged', ready);
        pendingCleanup.current = null;
        play();
      }, 1500);
      pendingCleanup.current = () => {
        clearTimeout(timer);
        synth.removeEventListener('voiceschanged', ready);
      };
    }
  }

  return (
    <SpeechContext.Provider
      value={{
        supported,
        voices,
        selectedVoice: selectJapaneseVoice(voices, preferences.voiceURI),
        speakingId,
        error,
        speak,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
}
