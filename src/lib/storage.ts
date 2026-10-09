import { useEffect, useState } from 'react';
import type { SavedState, SessionResult, Word, WordProgress } from '../types';

export const STORAGE_KEY = 'kotoba-state-v1';
export function emptyState(): SavedState {
  return {
    version: 1,
    bookmarks: [],
    customWords: [],
    progress: {},
    sessions: [],
    goal: 10,
    showReading: true,
    voiceURI: 'auto',
    speechRate: 1,
    section4Unit: '57',
  };
}

function loadState(): SavedState {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!value || value.version !== 1) return emptyState();
    const state = emptyState();
    if (Array.isArray(value.bookmarks))
      state.bookmarks = value.bookmarks.filter((id: unknown) => typeof id === 'string');
    if ([5, 10, 20, 30].includes(value.goal)) state.goal = value.goal;
    if (typeof value.showReading === 'boolean') state.showReading = value.showReading;
    if (typeof value.voiceURI === 'string' && value.voiceURI.length <= 300)
      state.voiceURI = value.voiceURI;
    if ([0.8, 1, 1.1].includes(value.speechRate)) state.speechRate = value.speechRate;
    if (
      value.section4Unit === 'all' ||
      /^(?:[1-9]|[1-5][0-9]|60)$/.test(String(value.section4Unit))
    )
      state.section4Unit = String(value.section4Unit);
    if (Array.isArray(value.customWords)) {
      state.customWords = value.customWords
        .filter(
          (word: Word) =>
            word &&
            typeof word.japanese === 'string' &&
            word.japanese.trim().length > 0 &&
            word.japanese.length <= 500 &&
            typeof word.meaning === 'string' &&
            word.meaning.trim().length > 0 &&
            word.meaning.length <= 500,
        )
        .slice(0, 5000)
        .map((word: Word) => ({
          ...word,
          id: `custom:${word.japanese.normalize('NFKC')}`,
          level: 'custom',
          source: 'custom',
          reading: typeof word.reading === 'string' ? word.reading : undefined,
        }));
    }
    if (value.progress && typeof value.progress === 'object') {
      state.progress = Object.fromEntries(
        Object.entries(value.progress).filter((entry) => {
          const progress = entry[1] as WordProgress | null;
          return (
            progress &&
            Number.isInteger(progress.correct) &&
            Number.isInteger(progress.attempts) &&
            progress.correct >= 0 &&
            progress.attempts >= progress.correct &&
            typeof progress.lastCorrect === 'boolean'
          );
        }),
      ) as Record<string, WordProgress>;
    }
    if (Array.isArray(value.sessions)) {
      state.sessions = value.sessions
        .filter(
          (session: SessionResult) =>
            session &&
            typeof session.id === 'string' &&
            !Number.isNaN(Date.parse(session.completedAt)) &&
            ['1', '2', '3', '4', 'custom', 'all'].includes(session.level) &&
            ['flashcards', 'choice', 'typing'].includes(session.mode) &&
            Number.isInteger(session.total) &&
            session.total > 0 &&
            Number.isInteger(session.correct) &&
            session.correct >= 0 &&
            session.correct <= session.total,
        )
        .slice(-1000);
    }
    return state;
  } catch {
    return emptyState();
  }
}

export function useSavedState() {
  const [state, setState] = useState<SavedState>(loadState);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  return { state, setState, storageError };
}
