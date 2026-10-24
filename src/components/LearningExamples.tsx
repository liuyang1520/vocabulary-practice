import { Volume2 } from 'lucide-react';
import type { JapaneseExample } from '../data/learning';
import { useSpeech } from './Speech';

export function SentenceAudio({
  example,
  id,
}: {
  example: Pick<JapaneseExample, 'japanese' | 'reading'>;
  id: string;
}) {
  const { speak, speakingId, error } = useSpeech();
  return (
    <span className="pronunciation">
      <button
        type="button"
        className="icon-button"
        aria-label={`Listen to ${example.japanese}`}
        aria-busy={speakingId === id}
        title="Listen in Japanese"
        onClick={() => speak(example.reading, id)}
      >
        <Volume2 size={18} />
      </button>
      {error?.id === id ? (
        <span role="status" className="audio-error">
          {error.message}
        </span>
      ) : null}
    </span>
  );
}

export function ExampleSentence({
  example,
  id,
  showReading,
}: {
  example: JapaneseExample;
  id: string;
  showReading: boolean;
}) {
  return (
    <div className="lab-example">
      <div>
        <p lang="ja" className="lab-example-ja">
          {example.japanese}
        </p>
        {showReading && example.reading !== example.japanese ? (
          <p lang="ja" className="lab-reading">
            {example.reading}
          </p>
        ) : null}
        <p className="lab-translation">{example.meaning}</p>
      </div>
      <SentenceAudio example={example} id={id} />
    </div>
  );
}
