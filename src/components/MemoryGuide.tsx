import { Lightbulb } from 'lucide-react';

export default function MemoryGuide() {
  return (
    <details className="memory-guide">
      <summary>
        <Lightbulb size={20} aria-hidden="true" />
        <span>
          <strong>Make Japanese stick.</strong>
          <span>A simple routine for Chinese + English speakers</span>
        </span>
        <span className="memory-guide-toggle" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="memory-guide-body">
        <ol className="memory-steps">
          <li>
            <strong>Connect the meaning.</strong>
            <p>
              Use familiar Chinese characters as a cue: <span lang="ja">環境</span> →{' '}
              <span lang="zh">环境／環境</span>. For loanwords, try English:{' '}
              <span lang="ja">リサイクル</span> → recycle. Check the Japanese definition before
              making the link.
            </p>
          </li>
          <li>
            <strong>Give it a Japanese voice.</strong>
            <p>
              Listen, then say the reading in chunks: <span lang="ja">かん・きょう</span>. Keep long
              vowels and small <span lang="ja">っ／ッ</span>. Learn the Japanese sound separately
              from the Chinese reading.
            </p>
          </li>
          <li>
            <strong>Picture it. Say one sentence.</strong>
            <p>
              Imagine a smaller pile of rubbish and say <span lang="ja">ごみを減らします。</span> “I
              reduce rubbish.” Use the illustration and the phrase as one memory.
            </p>
          </li>
          <li>
            <strong>Cover it and recall it.</strong>
            <p>
              Try both directions before revealing the answer. Try a review later today, tomorrow,
              in three days, and in a week; revisit missed words sooner. Save difficult words for
              another session.
            </p>
          </li>
        </ol>
        <p className="memory-guide-note">
          Start with five words. Reveal or check an answer to see its memory aid. Use the kanji
          cues, Japanese sound, and illustration together. In Vocabulary, select a word’s lightbulb
          to study its memory aid. Chinese translations and practice phrases are included where
          available.
        </p>
        <p className="memory-guide-sources">
          Learn more:{' '}
          <a href="https://kotoba.ninjal.ac.jp/qa/yokuaru/qa-58/" target="_blank" rel="noreferrer">
            Japanese and Chinese readings (NINJAL)
          </a>
          {' · '}
          <a href="https://doi.org/10.1126/science.1152408" target="_blank" rel="noreferrer">
            Recall practice research
          </a>
        </p>
      </div>
    </details>
  );
}
