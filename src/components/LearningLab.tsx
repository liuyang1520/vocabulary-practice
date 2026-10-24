import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Lightbulb,
  MessageCircle,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import type { SavedState } from '../types';
import type {
  LearningCategory,
  LearningExercise,
  LearningLesson,
  LearningScenario,
} from '../data/learning';
import {
  essentialLessons,
  grammarLessons,
  learningScenarios,
  learningSources,
} from '../data/learning';
import { conjugate, studyVerbs, verbForms } from '../lib/japanese';
import type { StudyVerb, VerbForm } from '../lib/japanese';
import { verbExercises } from '../lib/learning';
import { shuffle } from '../lib/study';
import { Button, EmptyState, Modal, Picker } from './ui';
import { ExampleSentence, SentenceAudio } from './LearningExamples';
import LearningDrill from './LearningDrill';
import type { LearningRound } from './LearningDrill';

const categories = [
  {
    id: 'grammar',
    title: 'Grammar',
    icon: BookOpen,
    description: 'Small patterns. More things you can say.',
  },
  {
    id: 'verbs',
    title: 'Verb forms',
    icon: Shuffle,
    description: 'One verb, many useful possibilities.',
  },
  {
    id: 'scenarios',
    title: 'Real situations',
    icon: MessageCircle,
    description: 'Put the patterns into everyday conversations.',
  },
  {
    id: 'essentials',
    title: 'Useful extras',
    icon: Lightbulb,
    description: 'Numbers, sounds, and the details that make things click.',
  },
] as const;

export default function LearningLab({
  state,
  onReview,
  onRate,
  onDrillChange,
}: {
  state: SavedState;
  onReview: (id: string) => void;
  onRate: (id: string, correct: boolean) => void;
  onDrillChange: (active: boolean) => void;
}) {
  const [category, setCategory] = useState<LearningCategory>('grammar');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('all');
  const [mode, setMode] = useState<'choice' | 'typing'>('choice');
  const [focus, setFocus] = useState('all');
  const [round, setRound] = useState<LearningRound | null>(null);
  const [lesson, setLesson] = useState<LearningLesson | null>(null);
  const [scenario, setScenario] = useState<LearningScenario | null>(null);
  const [selectedVerb, setVerb] = useState<StudyVerb>(studyVerbs[0]);
  const [form, setForm] = useState<VerbForm>('te');
  const [hideTranslation, setHideTranslation] = useState(false);
  const progress = Object.values(state.learningProgress);
  const attempts = progress.reduce((sum, item) => sum + item.attempts, 0);
  const correct = progress.reduce((sum, item) => sum + item.correct, 0);
  const needle = query.normalize('NFKC').trim().toLowerCase();
  const matches = (item: unknown) =>
    !needle || JSON.stringify(item).normalize('NFKC').toLowerCase().includes(needle);
  const visibleLessons = (category === 'essentials' ? essentialLessons : grammarLessons)
    .filter((item) => (stage === 'all' || item.stage === stage) && matches(item))
    .sort(
      (a, b) =>
        ['Foundation', 'Building blocks', 'Next steps'].indexOf(a.stage) -
        ['Foundation', 'Building blocks', 'Next steps'].indexOf(b.stage),
    );
  const visibleScenarios = learningScenarios.filter(matches);
  const visibleVerbs = studyVerbs.filter(matches);
  const verb = visibleVerbs.find((item) => item.id === selectedVerb.id) ?? visibleVerbs[0];
  const sectionExercises =
    category === 'verbs'
      ? verbExercises.filter((exercise) =>
          visibleVerbs.some((item) => exercise.id.startsWith(`verbs:${item.id}:`)),
        )
      : category === 'scenarios'
        ? visibleScenarios.map((item) => item.exercise)
        : visibleLessons.map((item) => item.exercise);
  const reviewExercises = sectionExercises.filter(
    (item) => state.learningProgress[item.id]?.lastCorrect === false,
  );
  const pool = focus === 'review' ? reviewExercises : sectionExercises;
  const currentCategory = categories.find((item) => item.id === category)!;

  function startDrill(exercises: LearningExercise[] = pool) {
    if (!exercises.length) return;
    setLesson(null);
    setScenario(null);
    setRound({ id: crypto.randomUUID(), exercises: shuffle(exercises).slice(0, 10), mode });
    onDrillChange(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  if (round)
    return (
      <LearningDrill
        key={round.id}
        round={round}
        onRate={onRate}
        onRetry={startDrill}
        onExit={() => {
          setRound(null);
          onDrillChange(false);
        }}
      />
    );

  return (
    <section className="lab-page page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">BEYOND THE WORD LIST</span>
          <h1>Your Japanese, in action.</h1>
          <p>Understand a pattern. Hear it in context. Make it your own.</p>
        </div>
        <div className="lab-heading-mark" lang="ja" aria-hidden="true">
          学<span>learn · try · repeat</span>
        </div>
      </div>
      <div className="lab-summary" aria-label="Japanese lab progress">
        <span>
          <CheckCheck size={16} />
          <strong>{state.reviewedLessons.length}</strong>{' '}
          {state.reviewedLessons.length === 1 ? 'note reviewed' : 'notes reviewed'}
        </span>
        <span>
          <Sparkles size={16} />
          <strong>{progress.length}</strong>{' '}
          {progress.length === 1 ? 'question tried' : 'questions tried'}
        </span>
        <span>
          <strong>{attempts ? `${Math.round((correct / attempts) * 100)}%` : '—'}</strong> recall
          accuracy
        </span>
        <span className="small-note">Saved in this browser</span>
      </div>
      <Tabs.Root
        value={category}
        onValueChange={(value) => {
          setCategory(value as LearningCategory);
          setQuery('');
          setStage('all');
          setFocus('all');
        }}
      >
        <Tabs.List className="lab-tabs" aria-label="Japanese learning topics">
          {categories.map((item) => (
            <Tabs.Trigger key={item.id} value={item.id}>
              <item.icon size={17} />
              {item.title}
              <span className="lab-tab-count">
                {item.id === 'grammar'
                  ? grammarLessons.length
                  : item.id === 'verbs'
                    ? studyVerbs.length
                    : item.id === 'scenarios'
                      ? learningScenarios.length
                      : essentialLessons.length}
              </span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div className="lab-section-heading">
          <div>
            <h2>{currentCategory.description}</h2>
            <p className="small-note">
              {category === 'verbs'
                ? `${studyVerbs.length} common verbs · ${verbForms.length} forms · explicit verb groups`
                : category === 'scenarios'
                  ? 'Read both roles, listen, then cover the translation and reply aloud.'
                  : 'Open a note for examples, common traps, and a small speaking challenge.'}
            </p>
          </div>
        </div>
        <div className="lab-toolbar">
          <label className="search-field">
            <Search size={17} />
            <span className="sr-only">Search learning material</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search in English or Japanese…"
            />
          </label>
          {category === 'grammar' || category === 'essentials' ? (
            <Picker
              label="Learning stage"
              value={stage}
              onChange={setStage}
              options={[
                { value: 'all', label: 'All stages' },
                ...['Foundation', 'Building blocks', 'Next steps'].map((value) => ({
                  value,
                  label: value,
                })),
              ]}
            />
          ) : null}
        </div>
        <Tabs.Content value="grammar">
          <LessonGrid
            lessons={visibleLessons}
            reviewed={state.reviewedLessons}
            onOpen={setLesson}
          />
        </Tabs.Content>
        <Tabs.Content value="essentials">
          <LessonGrid
            lessons={visibleLessons}
            reviewed={state.reviewedLessons}
            onOpen={setLesson}
          />
        </Tabs.Content>
        <Tabs.Content value="verbs">
          <div className="lab-verb-layout">
            <div className="lab-verb-list" aria-label="Choose a verb">
              {visibleVerbs.length ? (
                visibleVerbs.map((item) => (
                  <button
                    key={item.id}
                    className={verb?.id === item.id ? 'lab-verb-selected' : ''}
                    aria-pressed={verb?.id === item.id}
                    onClick={() => setVerb(item)}
                  >
                    <span lang="ja">{item.japanese}</span>
                    <span>{item.meaning}</span>
                    <ChevronRight size={15} />
                  </button>
                ))
              ) : (
                <p className="small-note lab-no-verbs">
                  No matching verbs. Try “eat”, “帰る”, or “ichidan”.
                </p>
              )}
            </div>
            {verb ? (
              <div className="lab-verb-detail">
                <div className="lab-verb-title">
                  <div>
                    <span className="eyebrow">
                      {verb.group === 'godan'
                        ? 'GROUP 1 · GODAN'
                        : verb.group === 'ichidan'
                          ? 'GROUP 2 · ICHIDAN'
                          : 'GROUP 3 · IRREGULAR'}
                    </span>
                    <h3 lang="ja">
                      {verb.japanese}
                      {state.showReading ? <span>{verb.reading}</span> : null}
                    </h3>
                    <p className="muted">{verb.meaning}</p>
                  </div>
                  <SentenceAudio example={verb} id={`verb:${verb.id}`} />
                </div>
                {verb.note ? <p className="lab-callout">{verb.note}</p> : null}
                <label className="field-label" htmlFor="verb-form">
                  Explore a form
                </label>
                <Picker
                  id="verb-form"
                  label="Verb form"
                  value={form}
                  onChange={(value) => setForm(value as VerbForm)}
                  options={verbForms.map((item) => ({ value: item.id, label: item.label }))}
                />
                <div className="lab-verb-focus">
                  <span className="eyebrow">
                    {verbForms.find((item) => item.id === form)!.label}
                  </span>
                  <div>
                    <strong lang="ja">{conjugate(verb, form)}</strong>
                    <SentenceAudio
                      example={{
                        japanese: conjugate(verb, form),
                        reading: conjugate(verb, form, true),
                      }}
                      id={`verb:${verb.id}:${form}`}
                    />
                  </div>
                  {state.showReading ? <p lang="ja">{conjugate(verb, form, true)}</p> : null}
                  <p>{verbForms.find((item) => item.id === form)!.use}</p>
                </div>
                <div className="lab-actions">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      startDrill(
                        verbExercises.filter((item) => item.id.startsWith(`verbs:${verb.id}:`)),
                      )
                    }
                  >
                    Practice this verb
                    <ArrowRight size={15} />
                  </Button>
                  {form !== 'dictionary' ? (
                    <button
                      className="text-button"
                      onClick={() =>
                        startDrill(sectionExercises.filter((item) => item.id.endsWith(`:${form}`)))
                      }
                    >
                      Practice this form
                      <ArrowRight size={15} />
                    </button>
                  ) : null}
                </div>
                <details className="lab-all-forms">
                  <summary>Compare all {verbForms.length} forms</summary>
                  <div className="table-wrap">
                    <table className="lab-form-table">
                      <caption className="sr-only">All forms of {verb.japanese}</caption>
                      <thead>
                        <tr>
                          <th>Form</th>
                          <th>Japanese</th>
                          {state.showReading ? <th>Reading</th> : null}
                          <th>
                            <span className="sr-only">Audio</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {verbForms.map((item) => (
                          <tr key={item.id}>
                            <td>{item.label}</td>
                            <td lang="ja">{conjugate(verb, item.id)}</td>
                            {state.showReading ? (
                              <td lang="ja">{conjugate(verb, item.id, true)}</td>
                            ) : null}
                            <td>
                              <SentenceAudio
                                example={{
                                  japanese: conjugate(verb, item.id),
                                  reading: conjugate(verb, item.id, true),
                                }}
                                id={`table:${verb.id}:${item.id}`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            ) : (
              <EmptyState
                title="No matching verbs."
                description="Try another Japanese spelling, reading, or English meaning."
              />
            )}
          </div>
          <details className="lab-rules">
            <summary>How the verb groups work</summary>
            <div className="lab-rule-grid">
              <div>
                <h3>Group 1 · godan</h3>
                <p>
                  The last kana changes its vowel row: 書く → 書きます / 書かない / 書ける. For う,
                  the negative uses わ: 買わない.
                </p>
                <p>
                  て-form: う・つ・る → って; む・ぶ・ぬ → んで; く → いて; ぐ → いで; す → して.
                  行く is the key exception: 行って.
                </p>
              </div>
              <div>
                <h3>Group 2 · ichidan</h3>
                <p>
                  Drop る, then add the ending: 食べる → 食べます / 食べない / 食べて. Potential:
                  食べられる.
                </p>
                <p>
                  Many いる / える verbs belong here, but 帰る, 入る, and 走る are godan. Learn the
                  group with the verb.
                </p>
              </div>
              <div>
                <h3>Group 3 · irregular</h3>
                <p>
                  する → します / しない / して / できる. Compounds such as 勉強する follow the same
                  changes.
                </p>
                <p>
                  来る changes reading: くる → きます / こない / きて / こられる. These tables show
                  standard full potential forms; casual speech may shorten ichidan and 来る forms.
                </p>
              </div>
            </div>
          </details>
        </Tabs.Content>
        <Tabs.Content value="scenarios">
          <div className="lab-card-grid lab-scenario-grid">
            {visibleScenarios.map((item, i) => (
              <button
                className="lab-note-card"
                key={item.id}
                onClick={() => {
                  setScenario(item);
                  setHideTranslation(false);
                }}
              >
                <span className="lab-card-kicker">
                  <span className="eyebrow">SCENE {String(i + 1).padStart(2, '0')}</span>
                  {state.reviewedLessons.includes(`scenarios:${item.id}`) ? (
                    <Check size={16} className="lab-success" aria-label="Reviewed" />
                  ) : (
                    <MessageCircle size={16} />
                  )}
                </span>
                <h3>{item.title}</h3>
                <p>{item.setting}</p>
                <span className="lab-card-footer">
                  {item.lines.length} lines · listen & role-play
                  <ArrowRight size={15} />
                </span>
              </button>
            ))}
          </div>
          {!visibleScenarios.length ? (
            <EmptyState
              title="No matching scenes."
              description="Try a situation like café, train, or home."
            />
          ) : null}
        </Tabs.Content>
      </Tabs.Root>
      <section className="lab-practice-panel" aria-label="Practice Japanese patterns">
        <div>
          <span className="eyebrow">NOW TRY IT FROM MEMORY</span>
          <h2>Make the pattern stick.</h2>
          <p>Up to 10 questions from the material above, with an explanation after every answer.</p>
        </div>
        <div className="lab-practice-controls">
          <div className="lab-control-pair">
            <div>
              <label className="field-label" htmlFor="lab-mode">
                Answer mode
              </label>
              <Picker
                id="lab-mode"
                label="Drill answer mode"
                value={mode}
                onChange={(value) => setMode(value as 'choice' | 'typing')}
                options={[
                  { value: 'choice', label: 'Multiple choice' },
                  { value: 'typing', label: 'Type in Japanese' },
                ]}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="lab-focus">
                Focus
              </label>
              <Picker
                id="lab-focus"
                label="Drill focus"
                value={focus}
                onChange={setFocus}
                options={[
                  { value: 'all', label: 'All matching material' },
                  { value: 'review', label: `Needs review (${reviewExercises.length})` },
                ]}
              />
            </div>
          </div>
          <Button onClick={() => startDrill()} disabled={!pool.length}>
            {focus === 'review'
              ? 'Review missed questions'
              : `Practice ${currentCategory.title.toLowerCase()}`}
            <ArrowRight size={16} />
          </Button>
          {!pool.length ? (
            <p className="small-note">
              {focus === 'review'
                ? 'No missed questions in this selection. Try all matching material.'
                : 'Clear your search or change the stage to find practice material.'}
            </p>
          ) : null}
          {mode === 'typing' ? (
            <p className="small-note">
              Fill the blank or recall the model form or reply. This checks the listed answer and
              reading; it does not grade free writing.
            </p>
          ) : null}
        </div>
      </section>
      <div className="lab-routine">
        <Lightbulb size={19} />
        <p>
          <strong>A five-minute routine.</strong> Read one pattern, listen to an example, cover the
          translation, then say a new sentence about your day. Return tomorrow and try it before
          looking.
        </p>
      </div>
      <details className="lab-sources">
        <summary>About these notes & further learning</summary>
        <p>
          Original study notes, dialogues, and exercises for beginner and early intermediate
          practice. Stages are study suggestions, not JLPT certification. Grammar references for
          further study:
        </p>
        <div>
          {learningSources.map((source) => (
            <a
              key={source.url}
              className="inline-link"
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              {source.label}
            </a>
          ))}
        </div>
        <p>
          Audio uses the same Japanese voice and speed selected in Study settings. Notes and drill
          answers are saved locally, separately from word practice.
        </p>
      </details>
      <Modal
        open={!!lesson}
        onOpenChange={(open) => {
          if (!open) setLesson(null);
        }}
        title={lesson?.title ?? 'Study note'}
        description={lesson?.subtitle ?? ''}
      >
        {lesson ? (
          <div className="lab-detail">
            <span className="pill">{lesson.stage}</span>
            <p className="lab-pattern" lang="ja">
              {lesson.pattern}
            </p>
            <p>{lesson.explanation}</p>
            <h3>See it in context</h3>
            {lesson.examples.map((item, i) => (
              <ExampleSentence
                key={item.japanese}
                example={item}
                id={`lesson:${lesson.id}:${i}`}
                showReading={state.showReading}
              />
            ))}
            <div className="lab-note-box">
              <h3>What to notice</h3>
              <ul>
                {lesson.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
            <div className="lab-challenge">
              <span className="eyebrow">MAKE IT YOURS</span>
              <p>{lesson.tryIt}</p>
            </div>
            <div className="lab-detail-footer">
              <ReviewButton
                reviewed={state.reviewedLessons.includes(`${lesson.category}:${lesson.id}`)}
                onClick={() => onReview(`${lesson.category}:${lesson.id}`)}
              />
              <Button onClick={() => startDrill([lesson.exercise])}>
                Try a question
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={!!scenario}
        onOpenChange={(open) => {
          if (!open) setScenario(null);
        }}
        title={scenario?.title ?? 'Practice scene'}
        description={scenario?.setting ?? ''}
      >
        {scenario ? (
          <div className="lab-detail">
            <p className="lab-callout">
              <strong>Your goal:</strong> {scenario.goal}
            </p>
            <label className="lab-toggle">
              <input
                type="checkbox"
                checked={hideTranslation}
                onChange={(event) => setHideTranslation(event.target.checked)}
              />
              Cover the English translations
            </label>
            <div className="lab-dialogue">
              {scenario.lines.map((item, i) => (
                <div
                  key={`${scenario.id}:${i}`}
                  className={`lab-dialogue-line ${item.role === 0 ? 'lab-your-line' : ''}`}
                >
                  <span className="eyebrow">{scenario.roles[item.role]}</span>
                  <div className="lab-example">
                    <div>
                      <p className="lab-example-ja" lang="ja">
                        {item.japanese}
                      </p>
                      {state.showReading && item.reading !== item.japanese ? (
                        <p className="lab-reading" lang="ja">
                          {item.reading}
                        </p>
                      ) : null}
                      {hideTranslation ? null : <p className="lab-translation">{item.meaning}</p>}
                    </div>
                    <SentenceAudio example={item} id={`scene:${scenario.id}:${i}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="lab-note-box">
              <h3>What to notice</h3>
              <ul>
                {scenario.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
            <div className="lab-challenge">
              <span className="eyebrow">YOUR TURN · CHANGE THE SCENE</span>
              <p>{scenario.mission}</p>
            </div>
            <div className="lab-related">
              <span className="small-note">Patterns in this scene</span>
              {scenario.grammarIds.map((id) => {
                const related = grammarLessons.find((item) => item.id === id)!;
                return (
                  <button
                    className="pill"
                    key={id}
                    onClick={() => {
                      setScenario(null);
                      setLesson(related);
                    }}
                  >
                    {related.title}
                    <ChevronRight size={13} />
                  </button>
                );
              })}
            </div>
            <div className="lab-detail-footer">
              <ReviewButton
                reviewed={state.reviewedLessons.includes(`scenarios:${scenario.id}`)}
                onClick={() => onReview(`scenarios:${scenario.id}`)}
              />
              <Button onClick={() => startDrill([scenario.exercise])}>
                Practice a reply
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

function LessonGrid({
  lessons,
  reviewed,
  onOpen,
}: {
  lessons: LearningLesson[];
  reviewed: string[];
  onOpen: (lesson: LearningLesson) => void;
}) {
  if (!lessons.length)
    return (
      <EmptyState
        title="No matching notes."
        description="Try a different word or choose all stages."
      />
    );
  return (
    <div className="lab-card-grid">
      {lessons.map((item) => (
        <button className="lab-note-card" key={item.id} onClick={() => onOpen(item)}>
          <span className="lab-card-kicker">
            <span className="eyebrow">{item.stage}</span>
            {reviewed.includes(`${item.category}:${item.id}`) ? (
              <Check size={16} className="lab-success" aria-label="Reviewed" />
            ) : (
              <BookOpen size={16} />
            )}
          </span>
          <h3>{item.title}</h3>
          <p>{item.subtitle}</p>
          <span className="lab-card-pattern" lang="ja">
            {item.pattern}
          </span>
          <span className="lab-card-footer">
            Learn · listen · try
            <ArrowRight size={15} />
          </span>
        </button>
      ))}
    </div>
  );
}

function ReviewButton({ reviewed, onClick }: { reviewed: boolean; onClick: () => void }) {
  return (
    <Button variant="secondary" aria-pressed={reviewed} onClick={onClick}>
      {reviewed ? <Check size={16} /> : <RotateCcw size={16} />}
      {reviewed ? 'Reviewed' : 'Mark reviewed'}
    </Button>
  );
}
