import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Trophy } from 'lucide-react';
import type { LearningExercise } from '../data/learning';
import { matchesJapanese } from '../lib/japanese';
import { exerciseAnswers } from '../lib/learning';
import { shuffle } from '../lib/study';
import { Button, Meter } from './ui';
import { SentenceAudio } from './LearningExamples';

export interface LearningRound {
  id: string;
  exercises: LearningExercise[];
  mode: 'choice' | 'typing';
}

export default function LearningDrill({
  round,
  onExit,
  onRate,
  onRetry,
}: {
  round: LearningRound;
  onExit: () => void;
  onRate: (id: string, correct: boolean) => void;
  onRetry: (exercises: LearningExercise[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState<boolean | null>(null);
  const [choices, setChoices] = useState(() => choicesFor(round.exercises[0]));
  const [confirmExit, setConfirmExit] = useState(false);
  const graded = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const exercise = round.exercises[index];
  const finished = index === round.exercises.length;
  const score = answers.filter(Boolean).length;

  useEffect(() => {
    if (finished) headingRef.current?.focus();
    else if (checked !== null) nextRef.current?.focus();
    else if (round.mode === 'typing') inputRef.current?.focus();
    else headingRef.current?.focus();
  }, [index, checked, finished, round.mode]);

  function grade(value: string) {
    if (!value.trim() || graded.current) return;
    graded.current = true;
    const correct = matchesJapanese(value, exerciseAnswers(exercise));
    setInput(value);
    setChecked(correct);
    setAnswers((previous) => [...previous, correct]);
    onRate(exercise.id, correct);
  }

  function advance() {
    if (checked === null) return;
    const next = index + 1;
    setIndex(next);
    setInput('');
    setChecked(null);
    graded.current = false;
    if (next < round.exercises.length) setChoices(choicesFor(round.exercises[next]));
  }

  if (finished) {
    const missed = round.exercises.filter((_, i) => !answers[i]);
    return (
      <section className="lab-round lab-results page-enter">
        <Trophy size={32} className="accent" />
        <span className="eyebrow">A LITTLE MORE CONFIDENCE</span>
        <h1 ref={headingRef} tabIndex={-1}>
          Practice, put to use.
        </h1>
        <p className="lab-score">
          {score}
          <span> / {answers.length} correct</span>
        </p>
        <p className="muted">
          {missed.length
            ? 'Take another look at the patterns below, then try them again.'
            : 'Now try using one of these patterns in a sentence about your own day.'}
        </p>
        <div className="lab-result-list">
          {round.exercises.map((item, i) => (
            <div key={item.id}>
              {answers[i] ? (
                <Check size={17} className="lab-success" />
              ) : (
                <RotateCcw size={17} className="accent" />
              )}
              <div>
                <strong>{item.topic}</strong>
                <p lang="ja">{item.answer}</p>
                {!answers[i] ? <p className="small-note">{item.explanation}</p> : null}
              </div>
              <SentenceAudio
                example={{ japanese: item.answer, reading: item.reading || item.answer }}
                id={`result:${item.id}`}
              />
            </div>
          ))}
        </div>
        <div className="lab-actions">
          {missed.length ? (
            <Button onClick={() => onRetry(missed)}>
              <RotateCcw size={16} />
              Retry missed questions
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onExit}>
            Back to Japanese lab
            <ArrowRight size={16} />
          </Button>
        </div>
        <p className="small-note">
          Your answers are saved in this browser, separately from vocabulary progress.
        </p>
      </section>
    );
  }

  return (
    <section className="lab-round page-enter">
      <div className="session-heading">
        <button className="text-button" onClick={() => setConfirmExit(true)}>
          <ArrowLeft size={16} />
          End drill
        </button>
        <span className="muted text-sm">
          {round.mode === 'choice' ? 'Choose the answer' : 'Type in Japanese'}
        </span>
        <span>
          {index + 1} / {round.exercises.length}
        </span>
      </div>
      {confirmExit ? (
        <div className="lab-callout" role="alert">
          <p>Leave this drill? Answers already checked are saved.</p>
          <div className="lab-actions">
            <Button variant="secondary" onClick={() => setConfirmExit(false)}>
              Keep practicing
            </Button>
            <Button onClick={onExit}>Leave drill</Button>
          </div>
        </div>
      ) : null}
      <Meter value={(index / round.exercises.length) * 100} label="Drill progress" />
      <div className="lab-question">
        <span className="eyebrow">{exercise.topic}</span>
        <p className="lab-context">{exercise.context}</p>
        <h1 ref={headingRef} tabIndex={-1} lang={exercise.prompt.includes('＿＿') ? 'ja' : 'en'}>
          {exercise.prompt}
        </h1>
        <p className="small-note">
          {round.mode === 'typing'
            ? exercise.category === 'scenarios' && !exercise.prompt.includes('＿＿')
              ? 'Recall the model reply from this scene. The listed Japanese sentence or its kana reading is accepted.'
              : 'Enter the missing text or requested form. Kanji or a listed kana reading is accepted.'
            : 'Choose the answer that fits this situation.'}
        </p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (checked !== null) advance();
          else grade(input);
        }}
      >
        {round.mode === 'choice' ? (
          <div className="answer-choices">
            {choices.map((choice, i) => (
              <button
                type="button"
                key={choice}
                disabled={checked !== null}
                className={`answer-choice ${checked !== null && choice === exercise.answer ? 'answer-correct' : ''} ${checked === false && choice === input ? 'answer-wrong' : ''}`}
                onClick={() => grade(choice)}
              >
                <span className="choice-number">{i + 1}</span>
                <span lang="ja">{choice}</span>
                {checked !== null && choice === exercise.answer ? <Check size={18} /> : null}
              </button>
            ))}
          </div>
        ) : (
          <div className="typing-answer">
            <label className="sr-only" htmlFor="lab-answer">
              Your Japanese answer
            </label>
            <input
              ref={inputRef}
              id="lab-answer"
              className="input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="日本語で…"
              lang="ja"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={checked !== null}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault();
              }}
            />
            <Button type="submit" disabled={checked !== null || !input.trim()}>
              Check answer
              <Check size={16} />
            </Button>
          </div>
        )}
        {checked !== null ? (
          <div
            className={`answer-feedback ${checked ? 'feedback-correct' : 'feedback-wrong'}`}
            role="status"
          >
            <div>
              <div>
                <strong>{checked ? 'That fits.' : 'A useful pattern to revisit.'}</strong>
                <p lang="ja">
                  {exercise.answer}
                  {exercise.reading && exercise.reading !== exercise.answer
                    ? ` · ${exercise.reading}`
                    : ''}
                </p>
                <p className="lab-feedback-explanation">{exercise.explanation}</p>
              </div>
              <SentenceAudio
                example={{
                  japanese: exercise.answer,
                  reading: exercise.reading || exercise.answer,
                }}
                id={`answer:${exercise.id}`}
              />
            </div>
            <Button ref={nextRef} type="submit">
              {index === round.exercises.length - 1 ? 'See results' : 'Next question'}
              <ArrowRight size={16} />
            </Button>
          </div>
        ) : null}
      </form>
    </section>
  );
}

function choicesFor(exercise: LearningExercise) {
  return shuffle([exercise.answer, ...shuffle(exercise.distractors).slice(0, 3)]);
}
