import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  essentialLessons,
  grammarLessons,
  learningExercises,
  learningScenarios,
} from '../data/learning.ts';
import { exerciseAnswers, verbExercises } from './learning.ts';
import { matchesJapanese, studyVerbs, verbForms } from './japanese.ts';

test('every practice question has a unique stable ID and at least three unambiguous distractors', () => {
  const exercises = [...learningExercises, ...verbExercises];
  assert.equal(new Set(exercises.map((item) => item.id)).size, exercises.length);
  for (const item of exercises) {
    assert.ok(item.context && item.prompt && item.explanation, item.id);
    assert.ok(matchesJapanese(item.answer, exerciseAnswers(item)), item.id);
    if (item.reading) assert.ok(matchesJapanese(item.reading, exerciseAnswers(item)), item.id);
    assert.ok(item.distractors.length >= 3, item.id);
    assert.equal(new Set(item.distractors).size, item.distractors.length, item.id);
    for (const distractor of item.distractors) {
      assert.equal(
        matchesJapanese(distractor, exerciseAnswers(item)),
        false,
        `${item.id}: ${distractor}`,
      );
    }
  }
  assert.equal(verbExercises.length, studyVerbs.length * (verbForms.length - 1));
});

test('every study note and scene has examples, reading support, a speaking task, and valid related patterns', () => {
  const lessons = [...grammarLessons, ...essentialLessons];
  assert.equal(new Set(lessons.map((item) => item.id)).size, lessons.length);
  for (const lesson of lessons) {
    assert.ok(lesson.examples.length >= 2 && lesson.notes.length >= 2 && lesson.tryIt, lesson.id);
    for (const item of lesson.examples)
      assert.ok(item.japanese && item.reading && item.meaning, lesson.id);
  }
  assert.equal(new Set(learningScenarios.map((item) => item.id)).size, learningScenarios.length);
  for (const scene of learningScenarios) {
    assert.ok(
      scene.lines.length >= 4 && scene.goal && scene.mission && scene.notes.length,
      scene.id,
    );
    assert.ok(
      scene.lines.some((item) => item.role === 0) && scene.lines.some((item) => item.role === 1),
      scene.id,
    );
    for (const item of scene.lines)
      assert.ok(item.japanese && item.reading && item.meaning, scene.id);
    for (const id of scene.grammarIds)
      assert.ok(
        grammarLessons.some((item) => item.id === id),
        `${scene.id}: ${id}`,
      );
  }
});
