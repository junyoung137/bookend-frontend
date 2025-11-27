"use client";

import { motion } from "framer-motion";
import { Book } from "@/types/bookshelf";

interface Book3DProps {
  book: Book;
  index: number;
  onClick: () => void;
  isSelected: boolean;
}

export const Book3D = ({ book, index, onClick, isSelected }: Book3DProps) => {
  const thickness = Math.max(20, Math.min(60, book.words / 1000)); // 단어수에 따라 두께
  
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.05, 
        y: -10,
        transition: { duration: 0.2 }
      }}
      onClick={onClick}
      className="relative cursor-pointer"
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      {/* 책 본체 */}
      <div
        className={`
          relative rounded-r-lg shadow-2xl transition-all duration-300
          ${isSelected ? 'ring-4 ring-yellow-400' : ''}
        `}
        style={{
          width: `${thickness}px`,
          height: "280px",
          backgroundColor: book.color,
          transform: "rotateY(-15deg)",
          transformStyle: "preserve-3d"
        }}
      >
        {/* 책등 (제목) */}
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <p 
            className="text-white font-bold text-sm writing-mode-vertical-rl transform rotate-180 text-center line-clamp-6"
            style={{ writingMode: "vertical-rl" }}
          >
            {book.title}
          </p>
        </div>

        {/* 페이지 효과 */}
        <div
          className="absolute top-0 right-0 h-full w-1 bg-white/20"
          style={{ transform: "translateZ(1px)" }}
        />
        
        {/* 그림자 효과 */}
        <div
          className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-black/20 to-transparent rounded-r-lg"
          style={{ transform: "translateZ(1px)" }}
        />
      </div>

      {/* 책 정보 툴팁 (hover 시) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 pointer-events-none"
      >
        <div className="font-bold mb-1">{book.title}</div>
        <div className="text-gray-300">
          {book.words.toLocaleString()} words · {book.sections} sections
        </div>
      </motion.div>
    </motion.div>
  );
};