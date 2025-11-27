"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Image as ImageIcon, Star, ChevronDown, ChevronUp, Layers } from "lucide-react";

type TabType = 'sections' | 'images' | 'extra';

interface BottomTabsProps {
  focusedSectionId: string | null;
  focusedSectionContent: string;
  totalSections: number;
}

export function BottomTabs({ 
  focusedSectionId, 
  focusedSectionContent,
  totalSections 
}: BottomTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('sections');
  const [isExpanded, setIsExpanded] = useState(true);

  const tabs = [
    { id: 'sections' as TabType, label: 'Sections', icon: Layers },
    { id: 'images' as TabType, label: 'Images', icon: ImageIcon },
    { id: 'extra' as TabType, label: 'Extra', icon: Star },
  ];

  // HTML 태그 제거
  const getPlainText = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const plainText = getPlainText(focusedSectionContent);

  return (
    <div className="border-t border-white/20 glass flex-shrink-0">
      {/* 탭 헤더 */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-white/10">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg transition-all text-sm
                  ${activeTab === tab.id
                    ? 'bg-white/80 text-moss font-semibold shadow-sm'
                    : 'text-gray-600 hover:bg-white/40'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm"
        >
          <span>{isExpanded ? '접기' : '펼치기'}</span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-6 max-h-80 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* 섹션 정보 탭 */}
                {activeTab === 'sections' && (
                  <motion.div
                    key="sections"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="space-y-4">
                      {/* 현재 섹션 정보 */}
                      <div className="p-4 bg-moss/10 rounded-xl border border-moss/20">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-moss" />
                            현재 작업 중인 섹션
                          </h3>
                          {focusedSectionId && (
                            <span className="text-xs px-2 py-1 bg-moss text-white rounded-full font-mono">
                              #{focusedSectionId.slice(-4)}
                            </span>
                          )}
                        </div>
                        
                        {plainText ? (
                          <>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">
                              {plainText.slice(0, 150)}
                              {plainText.length > 150 && '...'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>📝 {plainText.length} 글자</span>
                              <span>·</span>
                              <span>🔤 {plainText.split(/\s+/).filter(Boolean).length} 단어</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            섹션에 텍스트를 입력해주세요
                          </p>
                        )}
                      </div>

                      {/* 전체 통계 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/60 rounded-lg border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">총 섹션 수</div>
                          <div className="text-2xl font-bold text-moss">{totalSections}</div>
                        </div>
                        <div className="p-3 bg-white/60 rounded-lg border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">현재 섹션</div>
                          <div className="text-2xl font-bold text-gray-800">
                            {focusedSectionId ? `#${focusedSectionId.slice(-4)}` : '-'}
                          </div>
                        </div>
                      </div>

                      {/* 도움말 */}
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700 leading-relaxed">
                          💡 <strong>팁:</strong> 각 섹션은 최대 300자까지 작성 가능합니다. 
                          우측 패널의 AI 기능은 현재 포커스된 섹션에만 적용됩니다.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 이미지 탭 */}
                {activeTab === 'images' && (
                  <motion.div
                    key="images"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-center py-12"
                  >
                    <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">이미지 갤러리 기능 준비 중</p>
                    <button className="px-6 py-2 bg-moss/10 text-moss rounded-lg hover:bg-moss/20 transition-colors font-medium">
                      이미지 업로드
                    </button>
                  </motion.div>
                )}

                {/* Extra 탭 */}
                {activeTab === 'extra' && (
                  <motion.div
                    key="extra"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { title: '캐릭터', icon: '👤', desc: '등장인물' },
                        { title: '타임라인', icon: '📅', desc: '사건 순서' },
                        { title: '세계관', icon: '🌍', desc: '배경 설정' },
                        { title: '참고자료', icon: '📚', desc: '리서치' },
                        { title: '아이디어', icon: '💡', desc: '메모' },
                        { title: '목표', icon: '🎯', desc: '집필 목표' },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.03, y: -2 }}
                          className="p-4 bg-white/60 rounded-xl border border-gray-200 cursor-pointer hover:shadow-md transition-all"
                        >
                          <div className="text-3xl mb-2">{item.icon}</div>
                          <div className="font-semibold text-sm text-gray-800">{item.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}