import { ArrowRight, BookOpen, Check, Flame, Target } from 'lucide-react';
import type { SavedState, Word } from '../types';
import { isInCollection, levels, levelTitle } from '../data/catalog';
import { localDate, studyStreak } from '../lib/study';
import { Button, EmptyState, Meter } from './ui';

export default function ProgressPage({
  state,
  words,
  onPractice,
  onLearn,
}: {
  state: SavedState;
  words: Word[];
  onPractice: () => void;
  onLearn: () => void;
}) {
  const progress = Object.values(state.progress);
  const learned = progress.filter((entry) => entry.correct >= 3 && entry.lastCorrect).length;
  const attempts = progress.reduce((sum, entry) => sum + entry.attempts, 0);
  const correct = progress.reduce((sum, entry) => sum + entry.correct, 0);
  const learning = Object.values(state.learningProgress);
  const learningAttempts = learning.reduce((sum, entry) => sum + entry.attempts, 0);
  const learningCorrect = learning.reduce((sum, entry) => sum + entry.correct, 0);
  const streak = studyStreak(state.sessions.map((session) => session.completedAt));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const count = state.sessions
      .filter((session) => localDate(new Date(session.completedAt)) === localDate(date))
      .reduce((sum, session) => sum + session.total, 0);
    return {
      label: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date),
      date: localDate(date),
      count,
    };
  });
  const scale = Math.max(state.goal, ...days.map((day) => day.count));

  return (
    <section className="page-enter progress-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SMALL STEPS ADD UP</span>
          <h1>Look how far you’ve come.</h1>
          <p>A little consistency makes a big difference.</p>
        </div>
        <Button variant="secondary" onClick={onPractice}>
          Keep practicing
          <ArrowRight size={16} />
        </Button>
      </div>
      <div className="stats-grid">
        {[
          {
            icon: BookOpen,
            label: 'Words practiced',
            value: progress.length.toLocaleString(),
            detail: `of ${words.length.toLocaleString()} in your library`,
          },
          {
            icon: Check,
            label: 'Words learned',
            value: learned.toLocaleString(),
            detail: '3 correct answers + latest correct',
          },
          {
            icon: Target,
            label: 'Recall & accuracy',
            value: attempts ? `${Math.round((correct / attempts) * 100)}%` : '—',
            detail: `${attempts.toLocaleString()} answers and self-ratings`,
          },
          {
            icon: Flame,
            label: 'Current streak',
            value: `${streak}`,
            detail: streak === 1 ? 'day of completed practice' : 'days of completed practice',
          },
        ].map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-label">
              <span>{stat.label}</span>
              <stat.icon size={17} />
            </div>
            <strong>{stat.value}</strong>
            <p>{stat.detail}</p>
          </div>
        ))}
      </div>
      <div className="lab-progress-card">
        <div>
          <span className="eyebrow">JAPANESE LAB</span>
          <h2>Patterns becoming familiar.</h2>
          <p>
            {state.reviewedLessons.length} {state.reviewedLessons.length === 1 ? 'note' : 'notes'}{' '}
            reviewed · {learning.length} {learning.length === 1 ? 'question' : 'questions'} tried ·{' '}
            {learningAttempts
              ? `${Math.round((learningCorrect / learningAttempts) * 100)}% recall accuracy`
              : 'Your first drill is waiting'}
          </p>
          <p className="small-note">
            Grammar, verb forms, scenarios, and useful extras. Tracked separately from word
            practice.
          </p>
        </div>
        <Button variant="secondary" onClick={onLearn}>
          Open Japanese lab
          <ArrowRight size={16} />
        </Button>
      </div>
      <div className="progress-panels">
        <div className="panel activity-panel">
          <div className="panel-heading">
            <h2>A week of words.</h2>
            <span className="pill">Goal: {state.goal} / day</span>
          </div>
          <p className="muted text-sm">Words practiced in completed sessions.</p>
          <div
            className="activity-chart"
            role="img"
            aria-label={`Practice over the last seven days: ${days.map((day) => `${day.label}, ${day.count} words`).join('; ')}`}
          >
            {days.map((day, i) => (
              <div className={`activity-day ${i === 6 ? 'activity-today' : ''}`} key={day.date}>
                <span className="activity-value">{day.count || '—'}</span>
                <div className="activity-track">
                  <div
                    className="activity-bar"
                    style={{ height: `${(day.count / scale) * 100}%` }}
                  />
                </div>
                <span>{day.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel level-progress">
          <h2>Getting to know your words.</h2>
          <p className="muted text-sm">Three correct answers earns a learned word.</p>
          {levels.map((level) => {
            const list = words.filter((word) => isInCollection(word, level.id));
            const count = list.filter(
              (word) =>
                (state.progress[word.id]?.correct || 0) >= 3 &&
                state.progress[word.id]?.lastCorrect,
            ).length;
            return (
              <div className="level-progress-row" key={level.id}>
                <div>
                  <span>{level.title}</span>
                  <span className="muted">
                    {count} / {list.length}
                  </span>
                </div>
                <Meter
                  value={(count / list.length) * 100}
                  label={`${level.title}: ${count} learned`}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="history-section">
        <div className="section-heading">
          <h2>Recent practice</h2>
          <span className="muted text-sm">
            {state.sessions.length} completed {state.sessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>
        {state.sessions.length ? (
          <div className="table-wrap">
            <table className="word-table history-table">
              <thead>
                <tr>
                  <th>Collection</th>
                  <th>Mode</th>
                  <th>Score</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {state.sessions
                  .slice(-8)
                  .reverse()
                  .map((session) => (
                    <tr key={session.id}>
                      <td>{levelTitle(session.level)}</td>
                      <td className="muted">
                        {session.mode === 'flashcards'
                          ? 'Flashcards'
                          : session.mode === 'choice'
                            ? 'Multiple choice'
                            : 'Type the answer'}
                      </td>
                      <td>
                        <span className="pill">
                          {session.correct} / {session.total}
                        </span>
                      </td>
                      <td className="muted">
                        {new Intl.DateTimeFormat(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        }).format(new Date(session.completedAt))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Your first session starts the story."
            description="Practice a few words and you’ll see your progress here."
          >
            <Button onClick={onPractice}>
              Let’s practice
              <ArrowRight size={16} />
            </Button>
          </EmptyState>
        )}
      </div>
    </section>
  );
}
