import { Editor } from '@tiptap/react';

export interface EditorState {
  content: string;
  wordCount: number;
  characterCount: number;
  isModified: boolean;
  lastSaved: Date | null;
}

export interface GhostPreviewItem {
  id: string;
  type: 'paraphrase' | 'tone' | 'expand';
  content: string;
  score: number;
}

export interface EditorStore {
  editor: Editor | null;
  state: EditorState;
  setEditor: (editor: Editor | null) => void;
  updateContent: (content: string) => void;
  save: () => Promise<void>;
}

export interface Section {
  id: string;
  content: string;
  order: number;
  aiApplied?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  sections: Section[];
  order: number;
  status?: 'draft' | 'review' | 'complete';
  lastModified?: Date | string | number;
}

export interface Suggestion {
  id: string;
  type: "paraphrase" | "tone" | "expand";
  title: string;
  preview: string;
  originalText: string;
  transformedText: string;
  score: number;
  icon: any;
  emoji: string;
  isTransforming?: boolean;
}

export const MAX_CHARS_PER_SECTION = 300;