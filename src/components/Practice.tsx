import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Check, RotateCcw, Sparkles, X } from 'lucide-react';
import type { Direction, Level, Mode, Word } from '../types';
import { answerLabel, makeChoices } from '../lib/study';
import { isCorrectAnswer } from '../lib/study';
import { levelTitle } from '../data/catalog';
import { Button, Meter } from './ui';
import Pronunciation from './Pronunciation';

export interface StudySession {
  id: string;
  words: Word[];
  pool: Word[];
  sourceWords: Word[];
  level: Level | 'all';
  mode: Mode;
  direction: Direction;
}

interface Props {
  session: StudySession;
  bookmarks: string[];
  showReading: boolean;
  onBookmark: (id: string) => void;
  onRate: (word: Word, correct: boolean) => void;
  onComplete: (correct: number, total: number) => void;
  onExit: () => void;
  onRestart: (words?: Word[]) => void;
}

export default function Practice({
  session,
  bookmarks,
  showReading,
  onBookmark,
  onRate,
  onComplete,
  onExit,
  onRestart,
}: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [selected, setSelected] = useState('');
  const [scores, setScores] = useState<boolean[]>([]);
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const revealRef = useRef<HTMLButtonElement>(null);
  const rememberRef = useRef<HTMLButtonElement>(null);
  const word = session.words[index];
  const choices = useMemo(
    () => makeChoices(word, session.pool, session.direction),
    [word, session.pool, session.direction],
  );
  const japanesePrompt = session.direction === 'ja-en';
  const correctCount = scores.filter(Boolean).length;

  useEffect(() => {
    if (result !== null) continueRef.current?.focus();
  }, [result]);

  useEffect(() => {
    if (session.mode === 'flashcards') {
      if (revealed) rememberRef.current?.focus();
      else revealRef.current?.focus();
    }
  }, [index, revealed, session.mode]);

  function grade(answer: string) {
    if (result !== null) return;
    const correct =
      session.mode === 'choice'
        ? answer === answerLabel(word, session.direction)
        : isCorrectAnswer(answer, word, session.direction);
    setSelected(answer);
    setResult(correct);
    setScores([...scores, correct]);
    onRate(word, correct);
  }

  function advance(nextScores = scores) {
    if (index === session.words.length - 1) {
      setCompleted(true);
      onComplete(nextScores.filter(Boolean).length, session.words.length);
    } else {
      setIndex(index + 1);
      setRevealed(false);
      setInput('');
      setResult(null);
      setSelected('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function rateFlashcard(correct: boolean) {
    const nextScores = [...scores, correct];
    setScores(nextScores);
    onRate(word, correct);
    advance(nextScores);
  }

  if (completed) {
    const missed = session.words.filter((_, i) => !scores[i]);
    return (
      <section className="session-complete page-enter">
        <div className="complete-icon">
          <Check size={30} />
        </div>
        <span className="eyebrow">A LITTLE MORE, EVERY DAY</span>
        <h1>
          That’s a good start.
          <br />
          <span className="text-muted">Keep it going.</span>
        </h1>
        <p>
          You practiced {session.words.length} words in {levelTitle(session.level)}.
        </p>
        <div className="complete-stats">
          <div>
            <strong>
              {correctCount}/{scores.length}
            </strong>
            <span>{session.mode === 'flashcards' ? 'Remembered' : 'Correct answers'}</span>
          </div>
          <div>
            <strong>{Math.round((correctCount / scores.length) * 100)}%</strong>
            <span>{session.mode === 'flashcards' ? 'Recall' : 'Accuracy'}</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => onRestart()}>
            <RotateCcw size={16} />
            Practice again
          </Button>
          {missed.length ? (
            <Button variant="secondary" onClick={() => onRestart(missed)}>
              Review {missed.length} missed {missed.length === 1 ? 'word' : 'words'}
              <ArrowRight size={16} />
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onExit}>
            Back to practice
          </Button>
        </div>
        <p className="small-note">Your progress is saved in this browser.</p>
      </section>
    );
  }

  return (
    <section className="practice-session page-enter">
      <div className="session-heading">
        <button className="text-button" onClick={onExit}>
          <ArrowLeft size={16} />
          End session
        </button>
        <span className="muted text-sm">{levelTitle(session.level)}</span>
        <span className="session-count">
          {index + 1}
          <span> / {session.words.length}</span>
        </span>
      </div>
      <Meter value={(index / session.words.length) * 100} label="Session progress" />
      <div className="session-meta">
        <span className="eyebrow">
          {session.mode === 'flashcards'
            ? 'FLASHCARDS'
            : session.mode === 'choice'
              ? 'MULTIPLE CHOICE'
              : 'TYPE THE ANSWER'}
        </span>
        <span className="muted text-sm">
          {correctCount} {session.mode === 'flashcards' ? 'remembered' : 'correct'}
        </span>
      </div>
      <div className="study-card">
        <div className="study-card-top">
          <span className="pill">
            {japanesePrompt ? 'Japanese → English' : 'English → Japanese'}
          </span>
          <div className="flex gap-2">
            <Pronunciation word={word} />
            <button
              className={`icon-button ${bookmarks.includes(word.id) ? 'is-bookmarked' : ''}`}
              onClick={() => onBookmark(word.id)}
              aria-label={bookmarks.includes(word.id) ? 'Unsave word' : 'Save word'}
              aria-pressed={bookmarks.includes(word.id)}
            >
              <Bookmark size={18} />
            </button>
          </div>
        </div>
        <p className="prompt-label">
          {session.mode === 'flashcards'
            ? 'Can you remember this word?'
            : japanesePrompt
              ? 'What does this word mean?'
              : 'How do you say this in Japanese?'}
        </p>
        <h1
          className={`study-word ${japanesePrompt ? 'japanese' : 'english'}`}
          lang={japanesePrompt ? 'ja' : 'en'}
        >
          {japanesePrompt ? word.japanese : word.meaning}
        </h1>
        {japanesePrompt && showReading && word.reading && word.reading !== word.japanese ? (
          <p className="study-reading" lang="ja">
            {word.reading}
          </p>
        ) : null}
        {session.mode === 'flashcards' ? (
          <div className="flashcard-answer">
            {revealed ? (
              <>
                <span className="eyebrow">{japanesePrompt ? 'MEANING' : 'JAPANESE'}</span>
                <p lang={japanesePrompt ? 'en' : 'ja'}>{answerLabel(word, session.direction)}</p>
                {!japanesePrompt && word.reading && word.reading !== word.japanese ? (
                  <span lang="ja" className="muted">
                    {word.reading}
                  </span>
                ) : null}
              </>
            ) : (
              <p className="muted">Take a moment. You’ve got this.</p>
            )}
          </div>
        ) : null}
      </div>
      {session.mode === 'flashcards' ? (
        <div className="study-actions">
          {revealed ? (
            <>
              <Button variant="secondary" onClick={() => rateFlashcard(false)}>
                <RotateCcw size={17} />
                Still learning
              </Button>
              <Button ref={rememberRef} onClick={() => rateFlashcard(true)}>
                <Check size={17} />
                Got it
              </Button>
            </>
          ) : (
            <Button ref={revealRef} className="reveal-button" onClick={() => setRevealed(true)}>
              Reveal answer
              <ArrowRight size={17} />
            </Button>
          )}
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (result !== null) advance();
            else if (session.mode === 'typing' && input.trim()) grade(input);
          }}
        >
          {session.mode === 'choice' ? (
            <div className="answer-choices">
              {choices.map((choice, i) => (
                <button
                  type="button"
                  key={choice}
                  disabled={result !== null}
                  onClick={() => grade(choice)}
                  className={`answer-choice ${result !== null && choice === answerLabel(word, session.direction) ? 'answer-correct' : ''} ${result === false && selected === choice ? 'answer-wrong' : ''}`}
                >
                  <span className="choice-number">{i + 1}</span>
                  <span lang={japanesePrompt ? 'en' : 'ja'}>{choice}</span>
                  {result !== null && choice === answerLabel(word, session.direction) ? (
                    <Check size={18} />
                  ) : null}
                  {result === false && selected === choice ? <X size={18} /> : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="typing-answer">
              <label htmlFor="study-answer" className="sr-only">
                {japanesePrompt ? 'English meaning' : 'Japanese word'}
              </label>
              <input
                ref={inputRef}
                id="study-answer"
                className="input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  japanesePrompt
                    ? 'Type the English meaning…'
                    : 'Type the Japanese word or reading…'
                }
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={result !== null}
              />
              <Button ref={continueRef} type="submit" disabled={result === null && !input.trim()}>
                {result !== null ? 'Continue' : 'Check answer'}
                <ArrowRight size={17} />
              </Button>
            </div>
          )}
          {result !== null ? (
            <div
              className={`answer-feedback ${result ? 'feedback-correct' : 'feedback-wrong'}`}
              role="status"
            >
              <div>
                {result ? <Check size={20} /> : <RotateCcw size={20} />}
                <div>
                  <strong>{result ? 'Nicely done.' : 'One to remember.'}</strong>
                  <p>
                    {answerLabel(word, session.direction)}
                    {!japanesePrompt && word.reading && word.reading !== word.japanese
                      ? ` · ${word.reading}`
                      : ''}
                  </p>
                </div>
              </div>
              {session.mode === 'choice' ? (
                <Button ref={continueRef} type="submit">
                  {index === session.words.length - 1 ? 'See results' : 'Next word'}
                  <ArrowRight size={17} />
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="study-hint">
              <Sparkles size={14} />
              {session.mode === 'typing'
                ? japanesePrompt
                  ? 'Any listed meaning is accepted. Press Enter to check.'
                  : 'Kanji or a listed kana reading is accepted. Press Enter to check.'
                : 'Choose the translation that fits.'}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
