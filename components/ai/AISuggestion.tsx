"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X } from "lucide-react";

interface AISuggestionProps {
  suggestion: {
    type: 'paraphrase' | 'tone' | 'expand' | 'grammar';
    content: string;
    original: string;
  };
  position: { top: number; left: number };
  onAccept: () => void;
  onReject: () => void;
}

const suggestionTypes = {
  paraphrase: { label: '다시 표현', color: 'bg-blue-500' },
  tone: { label: '톤 변경', color: 'bg-purple-500' },
  expand: { label: '확장하기', color: 'bg-green-500' },
  grammar: { label: '문법 수정', color: 'bg-red-500' }
};

export const AISuggestion = ({ 
  suggestion, 
  position, 
  onAccept, 
  onReject 
}: AISuggestionProps) => {
  const typeInfo = suggestionTypes[suggestion.type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          zIndex: 50
        }}
        className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-md"
      >
        {/* 타입 라벨 */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`${typeInfo.color} text-white text-xs px-2 py-1 rounded-full flex items-center gap-1`}>
            <Sparkles className="w-3 h-3" />
            {typeInfo.label}
          </span>
        </div>

        {/* 원본 텍스트 */}
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1">원본:</p>
          <p className="text-sm text-gray-700 line-through">{suggestion.original}</p>
        </div>

        {/* 제안 텍스트 */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">제안:</p>
          <p className="text-sm text-gray-900 font-medium">{suggestion.content}</p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-moss text-white rounded-lg hover:bg-moss/90 transition-colors text-sm"
          >
            <Check className="w-4 h-4" />
            적용
          </button>
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            무시
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};