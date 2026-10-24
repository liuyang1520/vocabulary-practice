import { lazy, Suspense, useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  Flame,
  Layers,
  Moon,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
} from 'lucide-react';
import type { Direction, Level, Mode } from './types';
import { defaultWords, isInCollection, levels, section4Topics } from './data/catalog';
import { useSavedState } from './lib/storage';
import { localDate, shuffle, studyStreak } from './lib/study';
import { Button, EmptyState, Meter, Picker } from './components/ui';
import Practice from './components/Practice';
import type { StudySession } from './components/Practice';
import Library from './components/Library';
import ProgressPage from './components/ProgressPage';
import ImportWords from './components/ImportWords';
import Settings from './components/Settings';
import Pronunciation from './components/Pronunciation';
import MemoryGuide from './components/MemoryGuide';
import { SpeechProvider } from './components/Speech';

const LearningLab = lazy(() => import('./components/LearningLab'));

const featuredWord = defaultWords.find((word) => word.japanese === 'おちゃ')!;

export default function App() {
  const { state, setState, storageError } = useSavedState();
  const [tab, setTab] = useState('practice');
  const [level, setLevel] = useState<Level>('4');
  const [mode, setMode] = useState<Mode>('flashcards');
  const [direction, setDirection] = useState<Direction>('ja-en');
  const [length, setLength] = useState('10');
  const [focus, setFocus] = useState('all');
  const [session, setSession] = useState<StudySession | null>(null);
  const [learningDrill, setLearningDrill] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );
  const words = useMemo(() => [...defaultWords, ...state.customWords], [state.customWords]);
  const savedIds = useMemo(() => new Set(state.bookmarks), [state.bookmarks]);
  const eligible = words.filter(
    (word) =>
      isInCollection(word, level, state.section4Unit) &&
      (focus === 'all' ||
        (focus === 'saved' && savedIds.has(word.id)) ||
        (focus === 'review' && state.progress[word.id] && !state.progress[word.id].lastCorrect)),
  );
  const todayCount = state.sessions
    .filter((item) => localDate(new Date(item.completedAt)) === localDate(new Date()))
    .reduce((sum, item) => sum + item.total, 0);
  const streak = studyStreak(state.sessions.map((item) => item.completedAt));
  const goalPercent = Math.min(100, (todayCount / state.goal) * 100);

  function toggleBookmark(id: string) {
    setState((previous) => ({
      ...previous,
      bookmarks: previous.bookmarks.includes(id)
        ? previous.bookmarks.filter((item) => item !== id)
        : [...previous.bookmarks, id],
    }));
  }

  function startPractice(
    pool = eligible,
    selectedLevel: Level | 'all' = level,
    practiceLength = Number(length),
  ) {
    if (!pool.length) return;
    setSession({
      id: crypto.randomUUID(),
      words: shuffle(pool).slice(0, practiceLength),
      pool: words,
      sourceWords: pool,
      level: selectedLevel,
      mode,
      direction,
    });
    setTab('practice');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem('kotoba-theme', next);
    } catch {
      /* Theme still works for this visit. */
    }
  }

  return (
    <SpeechProvider preferences={state}>
      <Tabs.Root
        value={tab}
        onValueChange={(value) => {
          setTab(value);
          setNotice('');
        }}
        className="app-shell"
      >
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <header className="site-header">
          <div className="header-inner">
            <a href={import.meta.env.BASE_URL} className="brand" aria-label="Kotoba home">
              <span className="brand-mark" aria-hidden="true" lang="ja">
                言
              </span>
              <span>
                kotoba<span className="accent">.</span>
              </span>
            </a>
            <Tabs.List className="main-nav" aria-label="Main navigation">
              <Tabs.Trigger value="practice" disabled={learningDrill}>
                Practice
              </Tabs.Trigger>
              <Tabs.Trigger value="library" disabled={Boolean(session) || learningDrill}>
                Vocabulary<span className="nav-count">{words.length.toLocaleString()}</span>
              </Tabs.Trigger>
              <Tabs.Trigger value="learn" disabled={Boolean(session)}>
                Japanese lab
              </Tabs.Trigger>
              <Tabs.Trigger value="progress" disabled={Boolean(session) || learningDrill}>
                Progress
              </Tabs.Trigger>
            </Tabs.List>
            <div className="header-actions">
              <span className="local-label">
                <span className="live-dot" />
                All yours. Always.
              </span>
              <button
                className="icon-button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                title="Switch theme"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button
                className="icon-button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Study settings"
                title="Study settings"
              >
                <Settings2 size={18} />
              </button>
            </div>
          </div>
        </header>
        <main className="main-container" id="main-content">
          {storageError ? (
            <p role="alert" className="storage-warning">
              Browser storage is unavailable. You can practice, but your progress won’t be saved
              after you leave.
            </p>
          ) : null}
          {notice ? (
            <div className="notice" role="status">
              <Check size={16} />
              {notice}
              <button className="text-button" onClick={() => setNotice('')}>
                Dismiss
              </button>
            </div>
          ) : null}
          <Tabs.Content value="practice">
            {session ? (
              <Practice
                key={session.id}
                session={session}
                bookmarks={state.bookmarks}
                showReading={state.showReading}
                onBookmark={toggleBookmark}
                onExit={() => setSession(null)}
                onRate={(word, correct) =>
                  setState((previous) => {
                    const progress = previous.progress[word.id] || {
                      correct: 0,
                      attempts: 0,
                      lastCorrect: false,
                    };
                    return {
                      ...previous,
                      progress: {
                        ...previous.progress,
                        [word.id]: {
                          correct: progress.correct + Number(correct),
                          attempts: progress.attempts + 1,
                          lastCorrect: correct,
                        },
                      },
                    };
                  })
                }
                onComplete={(correct, total) =>
                  setState((previous) => ({
                    ...previous,
                    sessions: [
                      ...previous.sessions,
                      {
                        id: session.id,
                        level: session.level,
                        mode: session.mode,
                        correct,
                        total,
                        completedAt: new Date().toISOString(),
                      },
                    ].slice(-1000),
                  }))
                }
                onRestart={(missed) => {
                  const pool = missed || session.sourceWords;
                  startPractice(pool, session.level, missed?.length || session.words.length);
                }}
              />
            ) : (
              <div className="page-enter">
                <section className="hero">
                  <div className="hero-copy">
                    <div className="hero-badge">
                      <span className="live-dot" />A LITTLE JAPANESE, EVERY DAY
                    </div>
                    <h1>
                      Small steps.
                      <br />
                      <span className="text-muted">More Japanese.</span>
                    </h1>
                    <p>
                      A few new words. A little more confidence.
                      <br className="desktop-break" /> Words, patterns, and real conversations.
                    </p>
                    <div className="hero-actions">
                      <Button onClick={() => startPractice()} disabled={!eligible.length}>
                        Let’s practice
                        <ArrowRight size={17} />
                      </Button>
                      <Button variant="secondary" onClick={() => setTab('library')}>
                        Explore vocabulary
                        <BookOpen size={17} />
                      </Button>
                    </div>
                    <div className="hero-footnote">
                      <span>
                        <Layers size={14} />
                        {defaultWords.length.toLocaleString()} words, ready to learn
                      </span>
                      <span className="separator-dot" />
                      No account needed
                    </div>
                  </div>
                  <div className="hero-art">
                    <span className="hero-art-label">ONE WORD CAN OPEN A NEW WORLD.</span>
                    <div className="sun-circle" aria-hidden="true" />
                    <div className="featured-card">
                      <div className="featured-card-top">
                        <span>01 / FIRST WORDS</span>
                        <Pronunciation word={featuredWord} />
                      </div>
                      <div className="featured-word" lang="ja">
                        お茶
                      </div>
                      {state.showReading ? (
                        <p className="featured-reading" lang="ja">
                          おちゃ
                        </p>
                      ) : null}
                      <div className="featured-meaning">
                        <span>tea; green tea</span>
                        <span className="pill">noun</span>
                      </div>
                      <div className="featured-card-bottom">
                        <span>A good place to begin.</span>
                        <span lang="ja" aria-hidden="true">
                          ことば
                        </span>
                      </div>
                    </div>
                    <span className="hero-art-bottom" lang="ja">
                      言葉を、少しずつ。<span>A few words at a time.</span>
                    </span>
                  </div>
                </section>
                <section className="daily-strip" aria-label="Daily study summary">
                  <div className="daily-greeting">
                    <span className="daily-icon">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <strong>
                        {todayCount >= state.goal
                          ? 'A little progress, made.'
                          : todayCount
                            ? 'You’re making room for more.'
                            : 'Your next chapter starts here.'}
                      </strong>
                      <p>
                        {todayCount >= state.goal
                          ? 'Daily goal complete. Keep going if you feel like it.'
                          : `Just ${Math.max(0, state.goal - todayCount)} words to reach your daily goal.`}
                      </p>
                    </div>
                  </div>
                  <div className="daily-goal">
                    <div>
                      <span>Today’s practice</span>
                      <strong>
                        {todayCount}
                        <span> / {state.goal} words</span>
                      </strong>
                    </div>
                    <Meter value={goalPercent} label="Daily goal progress" />
                  </div>
                  <div className="streak">
                    <Flame size={20} />
                    <div>
                      <strong>{streak}-day streak</strong>
                      <span>{streak ? 'Keep the habit growing.' : 'Start something good.'}</span>
                    </div>
                  </div>
                </section>
                <section className="lab-home-card" aria-label="Explore the Japanese lab">
                  <div>
                    <span className="eyebrow">PUT YOUR WORDS TO WORK</span>
                    <h2>A little grammar. A whole new conversation.</h2>
                    <p>
                      Grammar notes, a verb-form explorer, and everyday scenes. Learn a pattern,
                      then try it from memory.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => setTab('learn')}>
                    Explore Japanese lab
                    <ArrowRight size={16} />
                  </Button>
                </section>
                <section className="collections-section">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">01 — CHOOSE YOUR COLLECTION</span>
                      <h2>Start where you are.</h2>
                    </div>
                    <button className="text-button muted" onClick={() => setTab('library')}>
                      View all vocabulary
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="collection-grid">
                    {levels.map((item) => {
                      const list = words.filter((word) => isInCollection(word, item.id));
                      const learned = list.filter(
                        (word) =>
                          (state.progress[word.id]?.correct || 0) >= 3 &&
                          state.progress[word.id]?.lastCorrect,
                      ).length;
                      return (
                        <button
                          key={item.id}
                          className={`collection-card ${level === item.id ? 'collection-selected' : ''}`}
                          onClick={() => {
                            setLevel(item.id);
                            setFocus('all');
                          }}
                          aria-pressed={level === item.id}
                        >
                          <div className="collection-top">
                            <span className="collection-kanji" lang="ja" aria-hidden="true">
                              {item.kanji}
                            </span>
                            <span className="pill">{item.tag}</span>
                            <span className="selection-indicator">
                              {level === item.id ? <Check size={13} /> : null}
                            </span>
                          </div>
                          <div className="collection-name">
                            <span className="collection-number">0{item.id}</span>
                            <h3>{item.title}</h3>
                          </div>
                          <p>{item.description}</p>
                          <div className="collection-bottom">
                            <span>{list.length} words</span>
                            <span>{learned} learned</span>
                          </div>
                          <Meter
                            value={(learned / list.length) * 100}
                            label={`${item.title}: ${learned} learned`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="personal-collection">
                    <span>
                      <Bookmark size={16} />
                      Your words deserve a place, too.
                      {state.customWords.length ? (
                        <span className="muted">
                          {' '}
                          {state.customWords.length} in your personal list.
                        </span>
                      ) : null}
                    </span>
                    <div className="flex items-center gap-4">
                      {state.customWords.length ? (
                        <button
                          className={`text-button ${level === 'custom' ? 'accent' : ''}`}
                          onClick={() => {
                            setLevel('custom');
                            setFocus('all');
                          }}
                        >
                          Practice my words
                          <ChevronRight size={15} />
                        </button>
                      ) : null}
                      <button className="text-button" onClick={() => setImportOpen(true)}>
                        <Upload size={14} />
                        Add vocabulary
                      </button>
                    </div>
                  </div>
                </section>
                <MemoryGuide />
                <section className="practice-setup" id="practice-setup">
                  <div className="setup-intro">
                    <span className="eyebrow">02 — MAKE IT YOUR PRACTICE</span>
                    <h2>
                      A few words.
                      <br /> Your way.
                    </h2>
                    <p>
                      Flip a card, pick an answer,
                      <br />
                      or put your memory to the test.
                    </p>
                    <span className="setup-arrow" aria-hidden="true">
                      <ArrowDown size={22} />
                    </span>
                  </div>
                  <div className="setup-controls">
                    <Tabs.Root value={mode} onValueChange={(value) => setMode(value as Mode)}>
                      <Tabs.List className="mode-tabs" aria-label="Practice mode">
                        <Tabs.Trigger value="flashcards">
                          <Layers size={16} />
                          Flashcards
                        </Tabs.Trigger>
                        <Tabs.Trigger value="choice">
                          <Check size={16} />
                          Multiple choice
                        </Tabs.Trigger>
                        <Tabs.Trigger value="typing">
                          <BookOpen size={16} />
                          Type the answer
                        </Tabs.Trigger>
                      </Tabs.List>
                      <Tabs.Content value="flashcards" className="mode-description">
                        Recall the translation, then reveal the answer and rate your memory.
                      </Tabs.Content>
                      <Tabs.Content value="choice" className="mode-description">
                        Choose the right translation from a few possible answers.
                      </Tabs.Content>
                      <Tabs.Content value="typing" className="mode-description">
                        Type a translation from memory. Any listed meaning is accepted.
                      </Tabs.Content>
                    </Tabs.Root>
                    {level === '4' ? (
                      <div className="unit-selection">
                        <label className="field-label" htmlFor="practice-unit">
                          Section 4 topic
                        </label>
                        <Picker
                          id="practice-unit"
                          label="Section 4 practice topic"
                          value={state.section4Unit}
                          onChange={(section4Unit) =>
                            setState((previous) => ({ ...previous, section4Unit }))
                          }
                          options={[
                            { value: 'all', label: 'All Section 4 topics' },
                            ...section4Topics.map((topic) => ({
                              value: String(topic.unit),
                              label: `Unit ${topic.unit} · ${topic.title}`,
                            })),
                          ]}
                        />
                        <p className="small-note">
                          Companion vocabulary for each unit’s topic. Your Duolingo lesson may
                          introduce different words.
                        </p>
                      </div>
                    ) : null}
                    <div className="setup-fields">
                      <div>
                        <label className="field-label" htmlFor="study-direction">
                          Direction
                        </label>
                        <Picker
                          id="study-direction"
                          label="Study direction"
                          value={direction}
                          onChange={(value) => setDirection(value as Direction)}
                          options={[
                            { value: 'ja-en', label: 'Japanese → English' },
                            { value: 'en-ja', label: 'English → Japanese' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor="session-length">
                          Session length
                        </label>
                        <Picker
                          id="session-length"
                          label="Session length"
                          value={length}
                          onChange={setLength}
                          options={[5, 10, 20, 30].map((value) => ({
                            value: String(value),
                            label: `${value} words`,
                          }))}
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor="study-focus">
                          Focus
                        </label>
                        <Picker
                          id="study-focus"
                          label="Study focus"
                          value={focus}
                          onChange={setFocus}
                          options={[
                            { value: 'all', label: 'All collection words' },
                            { value: 'saved', label: 'Saved words' },
                            { value: 'review', label: 'Needs another look' },
                          ]}
                        />
                      </div>
                    </div>
                    {eligible.length ? (
                      <div className="setup-footer">
                        <p>
                          <span className="live-dot" />
                          {Math.min(Number(length), eligible.length)} words ·{' '}
                          {mode === 'flashcards'
                            ? 'Flip, remember, repeat.'
                            : mode === 'choice'
                              ? 'Find the right meaning.'
                              : 'Make the words stick.'}
                        </p>
                        <Button onClick={() => startPractice()}>
                          Start practice
                          <ArrowRight size={17} />
                        </Button>
                      </div>
                    ) : (
                      <EmptyState
                        title={
                          focus === 'saved'
                            ? 'Save a few words first.'
                            : focus === 'review'
                              ? 'Nothing needs another look yet.'
                              : 'Add some words to begin.'
                        }
                        description={
                          focus === 'saved'
                            ? 'Bookmark words in this collection from the vocabulary page.'
                            : focus === 'review'
                              ? 'Missed words from this collection will appear here after practice.'
                              : 'Your personal collection is waiting for its first words.'
                        }
                      >
                        <Button
                          variant="secondary"
                          onClick={() => (focus === 'all' ? setImportOpen(true) : setFocus('all'))}
                        >
                          {focus === 'all' ? 'Add vocabulary' : 'Practice all collection words'}
                          <ArrowRight size={15} />
                        </Button>
                      </EmptyState>
                    )}
                  </div>
                </section>
                <div className="practice-source-note">
                  <ShieldCheck size={15} />
                  <span>
                    Duolingo vocabulary snapshots and a Section 4 topic companion.{' '}
                    <button className="inline-link" onClick={() => setTab('library')}>
                      See sources
                    </button>
                  </span>
                </div>
              </div>
            )}
          </Tabs.Content>
          <Tabs.Content value="library">
            <Library
              words={words}
              state={state}
              onBookmark={toggleBookmark}
              onImport={() => setImportOpen(true)}
              onDelete={(id) =>
                setState((previous) => ({
                  ...previous,
                  customWords: previous.customWords.filter((word) => word.id !== id),
                  bookmarks: previous.bookmarks.filter((item) => item !== id),
                  progress: Object.fromEntries(
                    Object.entries(previous.progress).filter(([key]) => key !== id),
                  ),
                }))
              }
              onStudy={(list, selectedLevel) => startPractice(list, selectedLevel)}
            />
          </Tabs.Content>
          <Tabs.Content value="learn">
            <Suspense
              fallback={
                <p role="status" className="lab-callout">
                  Opening Japanese lab…
                </p>
              }
            >
              <LearningLab
                state={state}
                onDrillChange={setLearningDrill}
                onReview={(id) =>
                  setState((previous) => ({
                    ...previous,
                    reviewedLessons: previous.reviewedLessons.includes(id)
                      ? previous.reviewedLessons.filter((item) => item !== id)
                      : [...previous.reviewedLessons, id],
                  }))
                }
                onRate={(id, correct) =>
                  setState((previous) => {
                    const entry = previous.learningProgress[id] || {
                      correct: 0,
                      attempts: 0,
                      lastCorrect: false,
                    };
                    return {
                      ...previous,
                      learningProgress: {
                        ...previous.learningProgress,
                        [id]: {
                          correct: entry.correct + Number(correct),
                          attempts: entry.attempts + 1,
                          lastCorrect: correct,
                        },
                      },
                    };
                  })
                }
              />
            </Suspense>
          </Tabs.Content>
          <Tabs.Content value="progress">
            <ProgressPage
              state={state}
              words={words}
              onPractice={() => setTab('practice')}
              onLearn={() => setTab('learn')}
            />
          </Tabs.Content>
        </main>
        <footer className="site-footer">
          <div>
            <a className="footer-brand" href={import.meta.env.BASE_URL}>
              kotoba<span className="accent">.</span>
            </a>
            <span>Words become worlds.</span>
          </div>
          <span className="footer-note">
            Made for a little progress, every day.<span lang="ja">少しずつ。</span>
          </span>
        </footer>
        <ImportWords
          open={importOpen}
          onOpenChange={setImportOpen}
          words={words}
          onImport={(imported) => {
            setState((previous) => ({
              ...previous,
              customWords: [...previous.customWords, ...imported],
            }));
            setNotice(
              `${imported.length} ${imported.length === 1 ? 'word added' : 'words added'} to your personal vocabulary.`,
            );
          }}
        />
        <Settings
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          state={state}
          onUpdate={(preferences) => setState((previous) => ({ ...previous, ...preferences }))}
          onReset={() => {
            setSession(null);
            setLearningDrill(false);
            setTab('practice');
            setState((previous) => ({
              ...previous,
              progress: {},
              sessions: [],
              reviewedLessons: [],
              learningProgress: {},
            }));
          }}
        />
      </Tabs.Root>
    </SpeechProvider>
  );
}
