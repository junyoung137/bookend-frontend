"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, List, BookOpen } from "lucide-react";
import { Book3D } from "./Book3D";
import { Book } from "@/types/bookshelf";
import { getBooks, addBook, setCurrentBookId } from "@/lib/storage";

interface BookshelfViewProps {
  onBookSelect: (bookId: string) => void;
}

export const BookshelfView = ({ onBookSelect }: BookshelfViewProps) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");

  useEffect(() => {
    const loadedBooks = getBooks();
    if (loadedBooks.length === 0) {
      // 초기 샘플 책 추가
      const sampleBooks = [
        { title: "첫 번째 소설", words: 45000, sections: 12, color: "#8B7355" },
        { title: "시 모음집", words: 12000, sections: 8, color: "#4A6741" },
        { title: "단편 모음", words: 28000, sections: 15, color: "#6B5B4F" },
      ];
      sampleBooks.forEach(book => addBook(book));
      setBooks(getBooks());
    } else {
      setBooks(loadedBooks);
    }
  }, []);

  const handleBookClick = (bookId: string) => {
    setSelectedBookId(bookId);
    setCurrentBookId(bookId);
    onBookSelect(bookId);
  };

  const handleAddBook = () => {
    if (!newBookTitle.trim()) return;
    
    const colors = ["#8B7355", "#4A6741", "#6B5B4F", "#5A4A3A", "#7A6B5B"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newBook = addBook({
      title: newBookTitle,
      words: 0,
      sections: 0,
      color: randomColor
    });
    
    setBooks(getBooks());
    setNewBookTitle("");
    setIsAdding(false);
    handleBookClick(newBook.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-8">
      {/* 헤더 */}
      <div className="max-w-7xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <BookOpen className="w-10 h-10 text-earth" />
            <h1 className="text-4xl font-bold text-gray-800">나의 서재</h1>
          </div>
          
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-moss text-white rounded-lg hover:bg-moss/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>새 책 만들기</span>
          </button>
        </motion.div>
      </div>

      {/* 3D 책장 */}
      <div className="max-w-7xl mx-auto">
        <div 
          className="relative bg-gradient-to-b from-amber-100 to-amber-200 rounded-2xl p-12 shadow-2xl"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(139, 115, 85, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(139, 115, 85, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px"
          }}
        >
          {/* 책장 선반들 */}
          {books.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">아직 책이 없습니다</p>
              <p className="text-sm">새 책을 만들어보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {books.map((book, index) => (
                <Book3D
                  key={book.id}
                  book={book}
                  index={index}
                  onClick={() => handleBookClick(book.id)}
                  isSelected={selectedBookId === book.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 새 책 추가 모달 */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 w-96 shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-4">새 책 만들기</h3>
            <input
              type="text"
              value={newBookTitle}
              onChange={(e) => setNewBookTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddBook()}
              placeholder="책 제목을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-moss"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAddBook}
                className="flex-1 px-4 py-2 bg-moss text-white rounded-lg hover:bg-moss/90"
              >
                만들기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};