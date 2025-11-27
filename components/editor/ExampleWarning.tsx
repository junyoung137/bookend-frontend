"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Loader2, X } from "lucide-react";
import { QualityMetrics } from "@/utils/textAnalysis";

interface ExampleWarningProps {
  metrics: QualityMetrics;
  isGenerating: boolean;
  generatedExamples: string[];
  showInsertOptions: boolean;
  selectedSentenceIndex: number | null;
  onGenerate: () => void;
  onApply: (position: 'end' | 'after-sentence') => void;
  onClose: () => void;
  onSelectSentence: (index: number | null) => void;
}

export function ExampleWarning({
  metrics,
  isGenerating,
  generatedExamples,
  showInsertOptions,
  selectedSentenceIndex,
  onGenerate,
  onApply,
  onClose,
  onSelectSentence,
}: ExampleWarningProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-amber-50 rounded-xl border-2 border-amber-300"
    >
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-amber-800 mb-1">
            예시를 추가하면 더 명확해져요
          </h4>
          <p className="text-xs text-amber-700 leading-relaxed mb-3">
            현재 {metrics.exampleCount}개의 예시가 있습니다. 
            {metrics.exampleCount === 0 
              ? ' AI가 제공하는 예시를 추가해 보세요.'
              : ' AI가 제공하는 예시를 추가해 보세요.'
            }
          </p>
          
          {!isGenerating && generatedExamples.length === 0 && (
            <button
              onClick={onGenerate}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:shadow-md transition-all font-medium text-sm flex items-center justify-center gap-2"
            >
              예시 추가하기
            </button>
          )}
          
          {isGenerating && (
            <div className="flex items-center justify-center py-4 gap-2 text-amber-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI가 예시를 생성하는 중...</span>
            </div>
          )}
          
          <AnimatePresence>
            {showInsertOptions && generatedExamples.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-3"
              >
                <div className="bg-white/80 rounded-lg p-3 space-y-2 border border-amber-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-800">생성된 예시:</span>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {generatedExamples.map((example, i) => (
                    <p key={i} className="text-xs text-gray-700 leading-relaxed pl-2 border-l-2 border-amber-500">
                      {example}
                    </p>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-amber-800">어디에 추가할까요?</p>
                  
                  <button
                    onClick={() => onApply('end')}
                    className="w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-left"
                  >
                    <div className="text-xs font-medium text-gray-800">글 끝에 추가</div>
                    <div className="text-[10px] text-gray-500">모든 내용 뒤에 예시를 추가합니다</div>
                  </button>

                  {metrics.sentences.length > 1 && (
                    <div className="space-y-2">
                      <button
                        onClick={() => onSelectSentence(selectedSentenceIndex === null ? 0 : null)}
                        className="w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-left"
                      >
                        <div className="text-xs font-medium text-gray-800">특정 문장 뒤에 추가</div>
                        <div className="text-[10px] text-gray-500">원하는 위치를 선택하세요</div>
                      </button>

                      <AnimatePresence>
                        {selectedSentenceIndex !== null && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-6 space-y-1 max-h-40 overflow-y-auto"
                          >
                            {metrics.sentences.map((sentence, idx) => (
                              <label
                                key={idx}
                                className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                                  selectedSentenceIndex === idx
                                    ? 'bg-amber-100 border border-amber-400'
                                    : 'hover:bg-gray-50 border border-transparent'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="sentence"
                                  checked={selectedSentenceIndex === idx}
                                  onChange={() => onSelectSentence(idx)}
                                  className="mt-0.5"
                                />
                                <span className="text-[10px] text-gray-700 leading-relaxed">
                                  {sentence.substring(0, 60)}{sentence.length > 60 ? '...' : ''}
                                </span>
                              </label>
                            ))}
                            
                            <button
                              onClick={() => onApply('after-sentence')}
                              disabled={selectedSentenceIndex === null}
                              className="w-full mt-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                            >
                              이 문장 뒤에 추가
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}