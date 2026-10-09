import { Volume2 } from 'lucide-react';
import type { Word } from '../types';
import { useSpeech } from './Speech';

export default function Pronunciation({ word }: { word: Word }) {
  const { speak, speakingId, error } = useSpeech();
  return (
    <span className="pronunciation">
      <button
        type="button"
        className="icon-button"
        onClick={() => speak(word.reading || word.japanese, word.id)}
        aria-label={`Listen to ${word.japanese}`}
        aria-busy={speakingId === word.id}
        title="Listen to pronunciation"
      >
        <Volume2 size={19} />
      </button>
      {error?.id === word.id ? (
        <span role="status" className="audio-error">
          {error.message}
        </span>
      ) : null}
    </span>
  );
}
