// components/editor/SpellCheckButton.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { SpellCheck, CheckCircle2, X } from 'lucide-react';

interface SpellCheckButtonProps {
  onCheck: () => void;
  isChecking: boolean;
  errorCount: number;
  correctedText: string | null;
  onApply: () => void;
  onDismiss: () => void;
}

export function SpellCheckButton({
  onCheck,
  isChecking,
  errorCount,
  correctedText,
  onApply,
  onDismiss
}: SpellCheckButtonProps) {
  return (
    <div className="relative">
      {/* 맞춤법 검사 버튼 */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCheck}
        disabled={isChecking}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
          transition-all border
          ${isChecking
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait'
            : errorCount > 0
            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
            : 'bg-white text-gray-700 border-gray-200 hover:border-moss hover:bg-moss/5'
          }
        `}
      >
        <SpellCheck className="w-3.5 h-3.5" />
        <span>
          {isChecking ? '검사 중...' : '맞춤법 검사'}
        </span>
        {errorCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded-full font-bold">
            {errorCount}
          </span>
        )}
      </motion.button>

      {/* 교정된 텍스트 미리보기 */}
      <AnimatePresence>
        {correctedText && errorCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 z-50 w-[400px]"
          >
            <div className="bg-white border-2 border-red-300 rounded-xl shadow-2xl p-4">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                    <SpellCheck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      맞춤법 교정안
                    </div>
                    <div className="text-[11px] text-red-600 font-medium">
                      {errorCount}개 오류 발견
                    </div>
                  </div>
                </div>
                <button
                  onClick={onDismiss}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* 교정된 텍스트 */}
              <div className="mb-4">
                <div className="text-[11px] font-semibold text-gray-600 mb-2">
                  📝 교정된 텍스트
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {correctedText}
                  </p>
                </div>
              </div>

              {/* 적용 버튼 */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onApply}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                           bg-green-600 text-white rounded-lg text-sm font-bold
                           hover:bg-green-700 transition-colors shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>적용하기</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDismiss}
                  className="px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold
                           text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  무시
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}