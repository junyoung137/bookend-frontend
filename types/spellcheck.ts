// types/spellcheck.ts

export interface SpellError {
  id: string;
  start: number;
  end: number;
  length: number;
  original: string;
  corrected: string;
  type: 'spelling' | 'grammar' | 'spacing';
  message?: string;
}

export interface SpellCheckResult {
  errors: SpellError[];
  correctedText: string;
  hasErrors: boolean;
}

export interface SpellCheckOptions {
  debounceMs?: number;
  minLength?: number;
  maxLength?: number;
}