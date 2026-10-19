import { Lightbulb } from 'lucide-react';
import type { Word } from '../types';
import { getMemoryAid, getMemoryStrategy } from '../lib/memory';

export default function WordMemory({ word }: { word: Word }) {
  const aid = getMemoryAid(word);
  const strategy = getMemoryStrategy(word);

  if (!aid) {
    return (
      <aside className="memory-fallback" aria-label="Memory strategy">
        <Lightbulb size={18} aria-hidden="true" />
        <div>
          <strong>{strategy.title}</strong>
          <p>{strategy.tip}</p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`word-memory ${aid.illustration ? '' : 'memory-text-only'}`}
      aria-label={`Memory aid for ${word.japanese}`}
    >
      {aid.illustration ? (
        <figure className="memory-picture">
          <img
            src={`${import.meta.env.BASE_URL}${aid.imagePath || `illustrations/unit57/${aid.illustration}.webp`}`}
            alt={aid.alt}
            width={384}
            height={384}
            loading="lazy"
            decoding="async"
          />
          <figcaption>{aid.picture}</figcaption>
        </figure>
      ) : null}
      <div className="memory-connections">
        <span className="eyebrow">
          <Lightbulb size={14} aria-hidden="true" /> MAKE IT STICK
        </span>
        {aid.chinese ? (
          <p className="memory-chinese" lang="zh">
            {aid.chinese}
          </p>
        ) : null}
        {aid.chunks ? (
          <p className="memory-chunks" lang="ja">
            {aid.chunks}
          </p>
        ) : null}
        <p className="memory-connection">{aid.connection}</p>
        {aid.characterCues?.length ? (
          <div className="memory-character-cues" aria-label="Kanji meaning cues">
            {aid.characterCues.map(({ character, meanings }) => (
              <span key={character}>
                <span lang="ja">{character}</span> · {meanings.join('; ')}
              </span>
            ))}
          </div>
        ) : null}
        {aid.example ? (
          <div className="memory-example">
            <span className="eyebrow">TRY IT IN CONTEXT</span>
            <p lang="ja">{aid.example}</p>
            <p className="memory-example-reading" lang="ja">
              {aid.exampleReading}
            </p>
            <p className="muted">{aid.exampleMeaning}</p>
          </div>
        ) : null}
        {aid.recall ? (
          <p className="memory-recall">
            <strong>Try it:</strong> {aid.recall}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
