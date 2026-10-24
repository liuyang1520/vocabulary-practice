import type { LearningExercise } from '../data/learning.ts';
import { conjugate, studyVerbs, verbForms } from './japanese.ts';
import type { StudyVerb, VerbForm } from './japanese.ts';

export function verbExercise(verb: StudyVerb, form: VerbForm): LearningExercise {
  const description = verbForms.find((item) => item.id === form)!;
  const answer = conjugate(verb, form);
  return {
    id: `verbs:${verb.id}:${form}`,
    category: 'verbs',
    topic: description.label,
    context: `${verb.japanese} (${verb.reading}) · ${verb.meaning} · ${verb.group === 'godan' ? 'Group 1 / godan' : verb.group === 'ichidan' ? 'Group 2 / ichidan' : 'Group 3 / irregular'}`,
    prompt: `Give the requested form of ${verb.japanese}.`,
    answer,
    reading: conjugate(verb, form, true),
    distractors: [
      ...new Set(
        verbForms.filter((item) => item.id !== form).map((item) => conjugate(verb, item.id)),
      ),
    ].filter((item) => item !== answer),
    explanation: `${verb.japanese} → ${answer} (${conjugate(verb, form, true)}). ${description.use}${verb.note ? ` ${verb.note}` : ''}`,
  };
}

export const verbExercises = studyVerbs.flatMap((verb) =>
  verbForms.filter((form) => form.id !== 'dictionary').map((form) => verbExercise(verb, form.id)),
);

export function exerciseAnswers(exercise: LearningExercise): string[] {
  return [
    exercise.answer,
    ...(exercise.reading ? [exercise.reading] : []),
    ...(exercise.alternatives ?? []),
  ];
}
