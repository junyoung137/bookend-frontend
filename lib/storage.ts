import { Book, Idea } from '@/types/bookshelf';

const STORAGE_KEYS = {
  BOOKS: 'bookend_books',
  IDEAS: 'bookend_ideas',
  CURRENT_BOOK: 'bookend_current_book',
  AI_SUGGESTIONS: 'bookend_ai_suggestions'
} as const;

// Books
export const getBooks = (): Book[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
  return data ? JSON.parse(data) : [];
};

export const saveBooks = (books: Book[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
};

export const addBook = (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => {
  const books = getBooks();
  const newBook: Book = {
    ...book,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveBooks([...books, newBook]);
  return newBook;
};

export const updateBook = (id: string, updates: Partial<Book>) => {
  const books = getBooks();
  const updated = books.map(book => 
    book.id === id 
      ? { ...book, ...updates, updatedAt: new Date().toISOString() }
      : book
  );
  saveBooks(updated);
};

export const deleteBook = (id: string) => {
  const books = getBooks();
  saveBooks(books.filter(book => book.id !== id));
};

// Ideas
export const getIdeas = (): Idea[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.IDEAS);
  return data ? JSON.parse(data) : [];
};

export const saveIdeas = (ideas: Idea[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(ideas));
};

export const addIdea = (idea: Omit<Idea, 'id' | 'createdAt'>) => {
  const ideas = getIdeas();
  const newIdea: Idea = {
    ...idea,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  saveIdeas([...ideas, newIdea]);
  return newIdea;
};

export const deleteIdea = (id: string) => {
  const ideas = getIdeas();
  saveIdeas(ideas.filter(idea => idea.id !== id));
};

// Current Book
export const getCurrentBookId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.CURRENT_BOOK);
};

export const setCurrentBookId = (id: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CURRENT_BOOK, id);
};