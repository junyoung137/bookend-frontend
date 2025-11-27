export interface Book {
  id: string;
  title: string;
  words: number;
  sections: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  text: string;
  tags: string[];
  createdAt: string;
  bookId?: string; // 어느 책에서 나온 아이디어인지
}

export interface AISuggestion {
  id: string;
  type: 'paraphrase' | 'tone' | 'expand' | 'grammar';
  content: string;
  original: string;
  position: { start: number; end: number };
}