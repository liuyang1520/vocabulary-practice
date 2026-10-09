export type Level = '1' | '2' | '3' | '4' | 'custom';
export type Mode = 'flashcards' | 'choice' | 'typing';
export type Direction = 'ja-en' | 'en-ja';

export interface Word {
  id: string;
  japanese: string;
  meaning: string;
  reading?: string;
  level: Level;
  unit?: number;
  source: 'community' | 'project' | 'legacy' | 'companion' | 'custom';
  skill?: string;
  dictionaryId?: string;
}

export interface WordProgress {
  correct: number;
  attempts: number;
  lastCorrect: boolean;
}

export interface SessionResult {
  id: string;
  completedAt: string;
  level: Level | 'all';
  mode: Mode;
  correct: number;
  total: number;
}

export interface SavedState {
  version: 1;
  bookmarks: string[];
  customWords: Word[];
  progress: Record<string, WordProgress>;
  sessions: SessionResult[];
  goal: number;
  showReading: boolean;
  voiceURI: string;
  speechRate: number;
  section4Unit: string;
}
