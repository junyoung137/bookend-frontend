"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { SectionEditor } from "./SectionEditor";
import { Section } from "@/types/editor";

interface EditorCanvasProps {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  chapterTitle: string;
  onFocusedSectionChange?: (sectionId: string | null, sectionContent: string) => void;
  externalSectionUpdate?: { sectionId: string; content: string } | null;
  focusEmoji?: string;
}

const SECTIONS_PER_PAGE = 4;

export const EditorCanvas = ({ 
  sections: initialSections,
  onSectionsChange,
  chapterTitle,
  onFocusedSectionChange,
  externalSectionUpdate,
  focusEmoji
}: EditorCanvasProps) => {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [currentPage, setCurrentPage] = useState(1);
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(
    initialSections[0]?.id || null
  );
  
  const [editorRefreshKey, setEditorRefreshKey] = useState(0);

  // 🔹 신규 유저 여부 (지금은 테스트용으로 true로 고정)
  const [isNewUser] = useState(true);
  
  const prevChapterRef = useRef<string>('');
  const isInitialMount = useRef(true);
  const lastNotifiedSections = useRef<string>('');

  // 총 페이지 수 계산
  const totalPages = Math.ceil(sections.length / SECTIONS_PER_PAGE);

  // 현재 페이지의 섹션들
  const startIndex = (currentPage - 1) * SECTIONS_PER_PAGE;
  const endIndex = startIndex + SECTIONS_PER_PAGE;
  const currentSections = sections.slice(startIndex, endIndex);

  // 챕터 전환 시 sections 동기화
  useEffect(() => {
    if (chapterTitle !== prevChapterRef.current) {
      setSections(initialSections);
      setFocusedSectionId(initialSections[0]?.id || null);
      setCurrentPage(1);
      prevChapterRef.current = chapterTitle;
      isInitialMount.current = true;
      setEditorRefreshKey(prev => prev + 1);
    }
  }, [chapterTitle, initialSections]);

  // 외부에서 섹션 업데이트 받기 (AI 적용)
  useEffect(() => {
    if (externalSectionUpdate) {
      console.log('🔄 [EditorCanvas] Receiving external update:', externalSectionUpdate);
      
      setSections(prev => {
        const updated = prev.map(s => 
          s.id === externalSectionUpdate.sectionId 
            ? { ...s, content: externalSectionUpdate.content, aiApplied: true }
            : s
        );
        return updated;
      });

      setEditorRefreshKey(prev => prev + 1);

      if (externalSectionUpdate.sectionId === focusedSectionId && onFocusedSectionChange) {
        onFocusedSectionChange(externalSectionUpdate.sectionId, externalSectionUpdate.content);
      }
    }
  }, [externalSectionUpdate, focusedSectionId, onFocusedSectionChange]);

  // sections 변경 시 부모에게 알림 (초기 마운트 제외 + 중복 방지)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastNotifiedSections.current = JSON.stringify(sections);
      return;
    }

    const currentSectionsStr = JSON.stringify(sections);
    if (currentSectionsStr !== lastNotifiedSections.current) {
      lastNotifiedSections.current = currentSectionsStr;
      onSectionsChange(sections);
    }
  }, [sections, onSectionsChange]);

  // 포커스된 섹션 변경 시 부모에게 알림
  useEffect(() => {
    if (focusedSectionId && onFocusedSectionChange) {
      const focusedSection = sections.find(s => s.id === focusedSectionId);
      if (focusedSection) {
        onFocusedSectionChange(focusedSectionId, focusedSection.content);
      }
    }
  }, [focusedSectionId, sections, onFocusedSectionChange]);

  const deleteSection = (id: string) => {
    if (sections.length <= 1) return;
    
    const filtered = sections.filter(s => s.id !== id);
    const reordered = filtered.map((s, index) => ({ ...s, order: index + 1 }));
    setSections(reordered);
    
    // 현재 페이지의 섹션을 모두 삭제한 경우 이전 페이지로
    const newTotalPages = Math.ceil(reordered.length / SECTIONS_PER_PAGE);
    if (currentPage > newTotalPages) {
      setCurrentPage(Math.max(1, newTotalPages));
    }
    
    if (focusedSectionId === id) {
      setFocusedSectionId(reordered[0]?.id || null);
    }
  };

  const updateSectionContent = (id: string, newContent: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, content: newContent, aiApplied: false } : s
    ));

    if (id === focusedSectionId && onFocusedSectionChange) {
      onFocusedSectionChange(id, newContent);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else {
      // 마지막 페이지에서 다음 버튼 클릭 시 새 페이지(빈 섹션 4개) 생성
      const newSections: Section[] = [];
      for (let i = 0; i < SECTIONS_PER_PAGE; i++) {
        newSections.push({
          id: `${Date.now()}-${i}`,
          content: '',
          order: sections.length + i + 1,
          aiApplied: false 
        });
      }
      setSections([...sections, ...newSections]);
      setCurrentPage(currentPage + 1);
      setFocusedSectionId(newSections[0].id);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const addNewSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      content: '',
      order: sections.length + 1,
      aiApplied: false
    };
    setSections([...sections, newSection]);
    setFocusedSectionId(newSection.id);
    
    // 새 섹션이 추가된 페이지로 이동
    const newTotalPages = Math.ceil((sections.length + 1) / SECTIONS_PER_PAGE);
    setCurrentPage(newTotalPages);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 섹션들 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {currentSections.map((section) => (
            <SectionEditor
              key={`${section.id}-${editorRefreshKey}`}
              sectionId={section.id}
              content={section.content}
              order={section.order}
              onContentChange={(newContent) => updateSectionContent(section.id, newContent)}
              onDelete={() => deleteSection(section.id)}
              onFocus={() => setFocusedSectionId(section.id)}
              isFocused={focusedSectionId === section.id}
              canDelete={sections.length > 1}
              focusEmoji={focusedSectionId === section.id ? focusEmoji : undefined}
              aiApplied={section.aiApplied}
              isNewUser={isNewUser}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* 페이징 네비게이션 - 여백 추가 */}
      <div className="mt-16 mb-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-moss hover:text-moss hover:bg-moss/5 shadow-sm'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>이전</span>
            </motion.button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="text-xs font-semibold text-gray-700">
                Page {currentPage}
              </span>
              <span className="text-xs text-gray-400">/</span>
              <span className="text-xs font-medium text-gray-500">
                {totalPages}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToNextPage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-white border border-gray-200 text-gray-700 hover:border-moss hover:text-moss hover:bg-moss/5 shadow-sm"
            >
              <span>{currentPage === totalPages ? '새 페이지' : '다음'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
          
          {currentPage === totalPages && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-[10px] text-gray-400"
            >
            </motion.p>
          )}

          {/* 새 섹션 추가 버튼 */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={addNewSection}
            className="w-full max-w-md py-2.5 border border-gray-200 rounded-lg 
                       hover:border-moss/50 hover:bg-moss/5 transition-all
                       flex items-center justify-center gap-2 text-gray-500 hover:text-moss
                       bg-white/50 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">새 섹션 추가</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};