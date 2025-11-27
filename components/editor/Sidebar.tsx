"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Book, ChevronRight, ChevronLeft, Clock, Trash2 } from "lucide-react";
import { Chapter } from "@/types/editor";
import { useTheme } from "@/hooks/useTheme";
import { GrowthMetrics } from "@/components/features/GrowthMetrics";

interface SidebarProps {
  chapters: Chapter[];
  activeChapterId: string;
  onChapterSelect: (id: string) => void;
  onAddChapter: () => void;
  onDeleteChapter: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  sidebarTitle?: string;
}

const getWordCount = (chapter: Chapter): number => {
  return chapter.sections.reduce((acc, s) => {
    const div = document.createElement("div");
    div.innerHTML = s.content;
    const text = div.textContent || "";
    return acc + text.split(/\s+/).filter(Boolean).length;
  }, 0);
};

const getLastModifiedText = (lastModified?: Date | string | number): string => {
  if (!lastModified) return "아직 수정 안 됨";
  try {
    const modifiedDate = new Date(lastModified);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - modifiedDate.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInSeconds < 60) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  } catch {
    return "시간 정보 없음";
  }
  return "시간 정보 없음";
};

export function Sidebar({
  chapters,
  activeChapterId,
  onChapterSelect,
  onAddChapter,
  onDeleteChapter,
  onUpdateTitle,
  isCollapsed,
  onToggleCollapse,
  sidebarTitle = "NOTEBOOK",
}: SidebarProps) {
  const { theme } = useTheme();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [shake, setShake] = useState(false);
  const [showGrowth, setShowGrowth] = useState(false);
  const [mounted, setMounted] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editingTitle]);

  const autoResize = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  };

  const handleStartEdit = (chapter: Chapter) => {
    if (isCollapsed) return;
    setEditingId(chapter.id);
    setEditingTitle(chapter.title);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      if (!editingTitle.trim()) {
        setShake(true);
        setTimeout(() => setShake(false), 400);
        return;
      }
      onUpdateTitle(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const requestDeleteChapter = (chapter: Chapter, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🗑️ [Sidebar] Delete requested for:', chapter.title, 'ID:', chapter.id);
    
    if (chapters.length <= 1) {
      console.log('⚠️ [Sidebar] Cannot delete last chapter');
      alert('마지막 챕터는 삭제할 수 없습니다.');
      return;
    }
    
    const confirmed = window.confirm(`"${chapter.title}" 챕터를 정말 삭제하시겠어요?\n\n이 챕터의 모든 섹션과 내용이 삭제됩니다.`);
    
    if (confirmed) {
      console.log('✅ [Sidebar] User confirmed deletion');
      onDeleteChapter(chapter.id);
    }
  };

  const handleGrowthClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 [Sidebar] Growth button clicked');
    setShowGrowth(true);
    console.log('📊 [Sidebar] showGrowth set to:', true);
  };

  const handleCloseGrowth = () => {
    console.log('❌ [Sidebar] Closing growth modal');
    setShowGrowth(false);
  };

  const getModalStyles = () => {
    return {
      bg: 'linear-gradient(135deg, #E8EDF5 0%, #D8E3F0 100%)',
      text: '#2D3748',
      textLight: '#4A5568',
      hover: 'rgba(74, 111, 165, 0.1)',
      accent: '#4A6FA5',
      border: 'rgba(74, 111, 165, 0.2)',
      cardBg: '#FFFFFF',
      cardBorder: 'rgba(74, 111, 165, 0.15)'
    };
  };

  const modalStyles = getModalStyles();

  return (
    <>
      <div className="relative h-full">
        <aside 
          className="h-full flex flex-col bg-gradient-to-b from-white/80 to-white/70 backdrop-blur-xl border-r border-earth/10"
          style={{ boxShadow: 'var(--sidebar-shadow)' }}
        >
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div key="expanded" className="flex flex-col h-full">
                <div className="py-4 px-4 border-b border-earth/10 bg-white/50 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <Book className="w-5 h-5 text-moss" />
                    <h2 className="text-lg font-bold text-gray-800">{sidebarTitle}</h2>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  <div className="space-y-2">
                    {chapters.map((chapter) => {
                      const wordCount = getWordCount(chapter);
                      const lastModified = getLastModifiedText(chapter.lastModified);
                      const isEditing = editingId === chapter.id;

                      return (
                        <motion.div
                          key={chapter.id}
                          layout
                          className={`group relative rounded-lg transition-all overflow-hidden bg-white border
                            ${
                              activeChapterId === chapter.id
                                ? "shadow-md border-moss/40 ring-1 ring-moss/20"
                                : "shadow-sm border-gray-200 hover:shadow-md hover:border-moss/30"
                            }`}
                          animate={shake && isEditing ? { x: [-6, 6, -6, 6, 0] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {isEditing ? (
                            <motion.div layout className="px-3 py-2 bg-moss/5">
                              <textarea
                                ref={textareaRef}
                                placeholder="제목을 입력하세요"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onInput={autoResize}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveEdit();
                                  }
                                  if (e.key === "Escape") handleCancelEdit();
                                }}
                                autoFocus
                                className="w-full bg-transparent font-semibold text-[11px] text-gray-800 border-none resize-none focus:outline-none placeholder:text-gray-400"
                              />
                            </motion.div>
                          ) : (
                            <>
                              <div className={`h-0.5 w-full ${
                                activeChapterId === chapter.id 
                                  ? 'bg-gradient-to-r from-moss to-leaf' 
                                  : 'bg-gray-200'
                              }`} />
                              
                              <div 
                                className="w-full px-3 py-2 cursor-pointer"
                                onClick={(e) => {
                                  if (!(e.target as HTMLElement).closest('button[data-delete-button]')) {
                                    onChapterSelect(chapter.id);
                                  }
                                }}
                                onDoubleClick={(e) => {
                                  if (!(e.target as HTMLElement).closest('button[data-delete-button]')) {
                                    handleStartEdit(chapter);
                                  }
                                }}
                              >
                                <div className="flex items-start justify-between mb-1.5">
                                  <div className="flex-1 pr-2">
                                    <h3 className="font-semibold text-[14px] text-gray-800 line-clamp-1 hover:text-moss transition-colors">
                                      {chapter.title}
                                    </h3>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {chapters.length > 1 && (
                                      <button
                                        data-delete-button
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          requestDeleteChapter(chapter, e);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-50 rounded relative z-50"
                                        title="챕터 삭제"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-500 pointer-events-none" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px]">
                                  <div className="flex items-center gap-1.5 text-gray-500 pointer-events-none">
                                    <span>{chapter.sections.length} sections</span>
                                    <span className="text-gray-400">·</span>
                                    <span>{wordCount} words</span>
                                  </div>

                                  <div className="flex items-center gap-1 text-gray-400 pointer-events-none">
                                    <span>{lastModified}</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 border-t border-earth/10 bg-white/50 flex gap-2">
                  <button
                    type="button"
                    onClick={handleGrowthClick}
                    className="flex-1 py-2.5 bg-gradient-to-r from-moss/10 to-leaf/10 
                               text-moss hover:from-moss/20 hover:to-leaf/20 
                               rounded-lg shadow-sm text-sm font-medium transition-all 
                               flex items-center justify-center space-x-1.5"
                  >
                    <span>🌱나의 성장</span>
                  </button>

                  <button
                    type="button"
                    onClick={onAddChapter}
                    className="w-12 h-12 bg-moss text-white rounded-lg shadow-sm 
                               hover:bg-moss/90 transition-all 
                               flex items-center justify-center"
                  >
                    <Plus className="w-9 h-9" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="collapsed" className="flex-1 flex flex-col items-center py-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-moss/20 flex items-center justify-center">
                  <Book className="w-5 h-5 text-moss" />
                </div>

                <div className="flex-1 w-full px-2 overflow-y-auto space-y-2">
                  {chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => onChapterSelect(chapter.id)}
                      className={`w-full p-2 rounded-lg transition-all
                        ${
                          activeChapterId === chapter.id
                            ? "bg-moss/20 border border-moss"
                            : "bg-white/40 hover:bg-white/60"
                        }`}
                      title={chapter.title}
                    >
                      <div className="text-xs font-bold text-gray-800 text-center">{chapter.order}</div>
                    </button>
                  ))}
                </div>

                <button
                  className="w-10 h-10 rounded-lg bg-moss text-white shadow-sm hover:bg-moss/90 transition-all"
                  onClick={onAddChapter}
                >
                  <Plus className="w-4 h-4 mx-auto" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        <button
          onClick={onToggleCollapse}
          className="absolute right-0 top-0 -translate-x-1/2
                      w-8 h-8 rounded-full glass border border-white/50
                      hover:scale-110 transition-all z-[9999]"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 성장 모달 */}
      <AnimatePresence>
        {showGrowth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center"
            style={{ 
              zIndex: 999999,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            onClick={handleCloseGrowth}
          >
            {/* 배경 */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* 모달 컨텐츠 */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative rounded-2xl shadow-2xl w-[75%] max-w-2xl overflow-hidden"
              style={{
                background: modalStyles.bg,
                color: modalStyles.text,
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${modalStyles.border}`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 스크롤 영역 */}
              <div 
                className="flex-1 overflow-y-auto p-8 relative"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <GrowthMetrics />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}