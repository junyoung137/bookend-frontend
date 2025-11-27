// components/editor/RightPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { TrendingUp, FileText, ChevronRight, ChevronLeft, Lightbulb, SpellCheck, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QualityPanel } from "./QualityPanel";
import { FactCheckPanel } from "@/components/fact-check/FactCheckPanel";
import { useTheme } from "@/hooks/useTheme";
import { useSpellCheck } from "@/hooks/useSpellCheck";

interface RightPanelProps {
  focusedSectionId: string | null;
  focusedSectionContent: string;
  onApplyText?: (sectionId: string, text: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  focusEmoji?: string;
  selectedText?: string;
}

export function RightPanel({ 
  focusedSectionId, 
  focusedSectionContent, 
  onApplyText,
  isCollapsed,
  onToggleCollapse,
  focusEmoji = '✏️',
  selectedText = ''
}: RightPanelProps) {
  const { theme } = useTheme();
  const [stats, setStats] = useState({ chars: 0, words: 0, examples: 0 });

  // 맞춤법 검사 훅
  const getPlainText = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const plainText = getPlainText(focusedSectionContent);
  
  // 드래그 선택된 텍스트가 있으면 그것만, 없으면 전체 텍스트
  const textToCheck = selectedText.trim() || plainText;
  
  const {
    errors,
    isChecking,
    hasErrors,
    checkNow,
    clearErrors,
    correctedText,
  } = useSpellCheck(textToCheck, {
    minLength: 5,
    maxLength: 300,
  });

  useEffect(() => {
    const div = document.createElement('div');
    div.innerHTML = focusedSectionContent;
    const plainText = div.textContent || '';
    
    const examplePatterns = [
      /예를\s*들어|예를\s*들면|예컨대|가령|예시로/gi,
      /다음과\s*같[이은]/gi,
      /구체적으로|실제로/gi,
    ];
    
    let exampleCount = 0;
    examplePatterns.forEach(pattern => {
      const matches = plainText.match(pattern);
      if (matches) exampleCount += matches.length;
    });
    
    setStats({
      chars: plainText.length,
      words: plainText.split(/\s+/).filter(Boolean).length,
      examples: exampleCount
    });
  }, [focusedSectionContent]);

  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const hasEnoughWords = wordCount >= 5;

  // 맞춤법 적용 (드래그 선택된 부분만 교체)
  const handleApplyCorrection = () => {
    if (!focusedSectionId || !correctedText || !onApplyText) return;
    
    // 선택된 텍스트가 있으면 부분 교체, 없으면 전체 교체
    if (selectedText.trim()) {
      // HTML에서 선택된 텍스트를 교정된 텍스트로 교체
      const newContent = focusedSectionContent.replace(selectedText, correctedText);
      onApplyText(focusedSectionId, newContent);
    } else {
      // 전체 교체
      onApplyText(focusedSectionId, correctedText);
    }
    
    clearErrors();
  };

  return (
    <div className="relative h-full">
      <aside 
        className="writing-partner-panel h-full flex flex-col backdrop-blur-xl border-l border-earth/10"
        style={{ boxShadow: 'var(--rightpanel-shadow)' }}
      >
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <div className="h-14 bg-transparent flex-shrink-0" />
              
              <div className="p-4 border-b border-earth/10 bg-white/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧑‍🤝‍🧑</span>
                  <h2 className="text-lg font-bold text-gray-800">글쓰기 파트너</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {/* 맞춤법 검사 버튼 영역 */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 leading-relaxed">
                        💬 한 섹션에 300자까지 작성할 수 있어요
                      </p>
                    </div>
                    
                    {/* 맞춤법 검사 버튼 */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={checkNow}
                      disabled={isChecking || !focusedSectionId || textToCheck.length < 5}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold
                        transition-all border whitespace-nowrap shadow-sm
                        ${isChecking
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait'
                          : errors.length > 0
                          ? 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-moss hover:bg-moss/5'
                        }
                        ${(!focusedSectionId || textToCheck.length < 5) ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <SpellCheck className="w-4 h-4" />
                      <span>맞춤법 검사</span>
                      {errors.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-red-600 text-white text-[10px] rounded-full font-bold">
                          {errors.length}
                        </span>
                      )}
                    </motion.button>
                  </div>

                  {/* 교정된 텍스트 미리보기 */}
                  <AnimatePresence>
                    {correctedText && errors.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white border-2 border-red-300 rounded-xl shadow-lg p-4"
                      >
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
                                {errors.length}개 오류 발견
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 교정된 텍스트 */}
                        <div className="mb-4">
                          <div className="text-[11px] font-semibold text-gray-600 mb-2">
                            {selectedText.trim() ? '📝 선택한 텍스트 교정안' : '📝 전체 텍스트 교정안'}
                          </div>
                          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                            <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
                              {correctedText}
                            </p>
                          </div>
                        </div>

                        {/* 적용 버튼 */}
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleApplyCorrection}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                                     bg-green-600 text-white rounded-lg text-sm font-bold
                                     hover:bg-green-700 transition-colors shadow-md"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>적용하기</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={clearErrors}
                            className="px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold
                                     text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            무시
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {focusedSectionId && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-white/60 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-3 h-3 text-moss" />
                          <span className="text-xs text-gray-500">글자 수</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-800">{stats.chars}</div>
                      </div>
                      <div className="p-3 bg-white/60 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-3 h-3 text-moss" />
                          <span className="text-xs text-gray-500">단어 수</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-800">{stats.words}</div>
                      </div>
                      <div className="p-3 bg-white/60 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Lightbulb className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-gray-500">예시 수</span>
                        </div>
                        <div className={`text-2xl font-bold ${stats.examples === 0 ? 'text-amber-600' : 'text-gray-800'}`}>
                          {stats.examples}
                        </div>
                      </div>
                    </div>
                  )}

                  {hasEnoughWords && focusedSectionId ? (
                    <>
                      <QualityPanel 
                        content={focusedSectionContent}
                        sectionId={focusedSectionId}
                        onApplyExamples={onApplyText}
                      />
                      
                      <FactCheckPanel selectedText={selectedText} />
                    </>
                  ) : (
                    <div className="p-8 bg-white/60 rounded-xl border border-gray-200 text-center">
                      {!focusedSectionId ? (
                        <>
                          <p className="text-sm text-gray-500 mb-1">
                            <span className="text-2xl mr-2">{focusEmoji}</span>
                            섹션을 선택하고
                          </p>
                          <p className="text-sm text-gray-500">텍스트를 입력해주세요</p>
                        </>
                      ) : wordCount === 0 ? (
                        <p className="text-sm text-gray-500">
                          <span className="text-2xl mr-2">{focusEmoji}</span>
                          텍스트를 입력해주세요
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-500 mb-1">
                            <span className="text-2xl mr-2">{focusEmoji}</span>
                            <span className="font-bold text-moss">{5 - wordCount}개 단어</span> 더 입력하면
                          </p>
                          <p className="text-sm text-gray-500">AI 제안을 받을 수 있어요</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col items-center py-6 space-y-4"
            >
              <div className="w-10 h-10 rounded-lg bg-moss/20 flex items-center justify-center">
                <span className="text-xl">🧑‍🤝‍🧑</span>
              </div>

              <div className="flex flex-col items-center gap-2 text-center px-2">
                <div className="text-xs font-medium text-gray-600 writing-mode-vertical">
                  AI 도우미
                </div>
              </div>

              {focusedSectionId && stats.chars > 0 && (
                <div className="space-y-3 w-full px-2">
                  <div className="w-full p-2 bg-white/60 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 text-center mb-1">글자</div>
                    <div className="text-lg font-bold text-gray-800 text-center">{stats.chars}</div>
                  </div>
                  <div className="w-full p-2 bg-white/60 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 text-center mb-1">단어</div>
                    <div className="text-lg font-bold text-gray-800 text-center">{stats.words}</div>
                  </div>
                  <div className="w-full p-2 bg-white/60 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 text-center mb-1">예시</div>
                    <div className={`text-lg font-bold text-center ${stats.examples === 0 ? 'text-amber-600' : 'text-gray-800'}`}>
                      {stats.examples}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      <button
        onClick={onToggleCollapse}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full glass border border-white/30 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center text-gray-600 hover:text-moss z-50"
        title={isCollapsed ? "글쓰기 파트너 펼치기" : "글쓰기 파트너 접기"}
      >
        {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
}