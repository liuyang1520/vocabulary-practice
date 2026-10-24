import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyState, parseSavedState } from './storage.ts';

test('existing vocabulary saves keep their progress and gain empty Japanese lab progress', () => {
  const oldSave = {
    ...emptyState(),
    bookmarks: ['tea'],
    progress: { tea: { attempts: 4, correct: 3, lastCorrect: true } },
    goal: 20,
  };
  const { reviewedLessons: _reviewed, learningProgress: _learning, ...legacy } = oldSave;
  const restored = parseSavedState(JSON.stringify(legacy));
  assert.deepEqual(restored.bookmarks, ['tea']);
  assert.deepEqual(restored.progress, oldSave.progress);
  assert.equal(restored.goal, 20);
  assert.deepEqual(restored.reviewedLessons, []);
  assert.deepEqual(restored.learningProgress, {});
});

test('reviewed notes and drill results round-trip independently of word progress', () => {
  const saved = {
    ...emptyState(),
    reviewedLessons: ['grammar:time'],
    learningProgress: { 'verbs:iku:te': { attempts: 2, correct: 1, lastCorrect: true } },
  };
  assert.deepEqual(parseSavedState(JSON.stringify(saved)), saved);
});

test('malformed storage and invalid learning counters do not break loading', () => {
  for (const value of [null, '', '{broken', 'null', '42'])
    assert.deepEqual(parseSavedState(value), emptyState());
  const restored = parseSavedState(
    JSON.stringify({
      version: 1,
      reviewedLessons: ['grammar:time', 4, null],
      learningProgress: {
        valid: { attempts: 1, correct: 0, lastCorrect: false },
        invalid: { attempts: 1, correct: 2, lastCorrect: true },
        missing: null,
      },
    }),
  );
  assert.deepEqual(restored.reviewedLessons, ['grammar:time']);
  assert.deepEqual(Object.keys(restored.learningProgress), ['valid']);
});
