"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { Sidebar } from "@/components/editor/Sidebar";
import { RightPanel } from "@/components/editor/RightPanel";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { QuietAI } from "@/components/ai/QuietAI";
import { AIShortcut } from "@/components/ai/AIShortcut";
import { IdeaVault } from "@/components/ideas/IdeaVault";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { DefaultBackground } from "@/components/backgrounds/DefaultBackground";
import { CarolBackground } from "@/components/backgrounds/CarolBackground";
import { DarkBackground } from "@/components/backgrounds/DarkBackground";
import { useTheme } from "@/hooks/useTheme";
import { Book, Lightbulb, Settings } from "lucide-react";
import { Chapter, Section } from "@/types/editor";
import { Idea } from "@/types/bookshelf";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const ENABLE_LLM = process.env.NEXT_PUBLIC_ENABLE_LLM === 'true';

// 개발 로그 (프로덕션에서는 자동으로 비활성화됨)
const isDev = process.env.NODE_ENV === 'development';

// 콘솔 로그 헬퍼 (배포 후 프로덕션에서는 안 보임)
const devLog = (...args: any[]) => {
  if (isDev) console.log(...args);
};

export default function EditorPage() {
  const { theme } = useTheme();
  
  const [chapters, setChapters] = useState<Chapter[]>([
    { 
      id: '1', 
      title: 'First part', 
      sections: [{ id: '1', content: '', order: 1 }],
      order: 1,
      status: 'draft',
      lastModified: new Date()
    },
    { 
      id: '2', 
      title: 'Second part', 
      sections: [{ id: '2', content: '', order: 1 }],
      order: 2,
      status: 'draft',
      lastModified: new Date()
    }
  ]);
  const [activeChapterId, setActiveChapterId] = useState('1');
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
  const [focusedSectionContent, setFocusedSectionContent] = useState('');
  const [externalSectionUpdate, setExternalSectionUpdate] = useState<{ sectionId: string; content: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isIdeaVaultOpen, setIsIdeaVaultOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('bookend_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setAutoSaveEnabled(settings.autoSave ?? true);
          setAutoSaveInterval(settings.autoSaveInterval ?? 30);
        } catch (e) {
          console.error('설정 불러오기 실패:', e);
        }
      }

      const savedChapters = localStorage.getItem('bookend_chapters');
      if (savedChapters) {
        try {
          const parsed = JSON.parse(savedChapters);
          console.log('📖 [EditorPage] Loaded chapters from localStorage:', parsed);
          const chaptersWithDates = parsed.map((chapter: any) => ({
            ...chapter,
            lastModified: chapter.lastModified ? new Date(chapter.lastModified) : new Date()
          }));
          setChapters(chaptersWithDates);
          setLastSaved(new Date(localStorage.getItem('bookend_last_saved') || Date.now()));
        } catch (e) {
          console.error('챕터 불러오기 실패:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('bookend_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setAutoSaveEnabled(settings.autoSave ?? true);
          setAutoSaveInterval(settings.autoSaveInterval ?? 30);
        } catch (e) {
          console.error('설정 불러오기 실패:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mounted]);

  const saveChapters = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    setIsSaving(true);
    try {
      console.log('💾 [EditorPage] Saving chapters to localStorage:', chapters);
      localStorage.setItem('bookend_chapters', JSON.stringify(chapters));
      localStorage.setItem('bookend_last_saved', new Date().toISOString());
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      console.log('✅ 자동 저장 완료:', new Date().toLocaleTimeString());
    } catch (e) {
      console.error('❌ 저장 실패:', e);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [chapters]);

  useEffect(() => {
    if (mounted) {
      setHasUnsavedChanges(true);
    }
  }, [chapters, mounted]);

  useEffect(() => {
    if (!mounted || !autoSaveEnabled || !hasUnsavedChanges) return;

    const intervalId = setInterval(() => {
      saveChapters();
    }, autoSaveInterval * 1000);

    return () => clearInterval(intervalId);
  }, [mounted, autoSaveEnabled, autoSaveInterval, hasUnsavedChanges, saveChapters]);

  useEffect(() => {
    if (!mounted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        saveChapters();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mounted, hasUnsavedChanges, saveChapters]);

  const getFocusEmoji = () => {
    switch (theme) {
      case 'carol':
        return '🎄';
      case 'dark':
        return '🌙';
      default:
        return '✏️';
    }
  };

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || "";
      setSelectedText(text);
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, []);

  const activeChapter = chapters.find(c => c.id === activeChapterId);

  const addNewChapter = () => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: `Part ${chapters.length + 1}`,
      sections: [{ id: `${Date.now()}-1`, content: '', order: 1 }],
      order: chapters.length + 1,
      status: 'draft',
      lastModified: new Date()
    };
    setChapters([...chapters, newChapter]);
    setActiveChapterId(newChapter.id);
  };

  const deleteChapter = (id: string) => {
    console.log('🔥 [EditorPage] deleteChapter called with id:', id);
    
    setChapters(currentChapters => {
      console.log('📊 [EditorPage] Current chapters in setter:', currentChapters);
      console.log('📊 [EditorPage] Chapters length:', currentChapters.length);
      
      if (currentChapters.length <= 1) {
        console.log('⚠️ [EditorPage] Cannot delete last chapter');
        setTimeout(() => alert('마지막 챕터는 삭제할 수 없습니다.'), 0);
        return currentChapters;
      }

      const chapterToDelete = currentChapters.find(c => c.id === id);
      if (!chapterToDelete) {
        console.error('❌ [EditorPage] Chapter not found:', id);
        return currentChapters;
      }

      console.log('📋 [EditorPage] Deleting chapter:', chapterToDelete.title);

      const filtered = currentChapters.filter(c => c.id !== id);
      const reordered = filtered.map((c, index) => ({ 
        ...c, 
        order: index + 1 
      }));
      
      console.log('✅ [EditorPage] New chapters array:', reordered);
      console.log('✅ [EditorPage] New chapters count:', reordered.length);

      if (activeChapterId === id && reordered.length > 0) {
        const newActiveId = reordered[0].id;
        console.log('🔄 [EditorPage] Switching to new active chapter:', newActiveId);
        setTimeout(() => setActiveChapterId(newActiveId), 0);
      }

      return reordered;
    });

    console.log('✅ [EditorPage] Chapter deletion completed');
  };

  const updateChapterSections = (chapterId: string, sections: Section[]) => {
    console.log('💾 [EditorPage] Updating chapter sections:', { chapterId, sectionsCount: sections.length });
    
    setChapters(prev => prev.map(c => 
      c.id === chapterId 
        ? { 
            ...c, 
            sections,
            lastModified: new Date()
          } 
        : c
    ));
  };

  const updateChapterTitle = (id: string, title: string) => {
    console.log('📝 [EditorPage] Updating chapter title:', { id, title });
    setChapters(prev => prev.map(c => 
      c.id === id 
        ? { 
            ...c, 
            title,
            lastModified: new Date()
          } 
        : c
    ));
  };

  const handleFocusedSectionChange = (sectionId: string | null, sectionContent: string) => {
    setFocusedSectionId(sectionId);
    setFocusedSectionContent(sectionContent);
  };

  const handleApplyAIText = (sectionId: string, text: string) => {
    console.log('✅ [EditorPage] Applying AI text to section:', sectionId);
    
    setExternalSectionUpdate({ sectionId, content: text });
    
    setChapters(prev => {
      const newChapters = prev.map(chapter => {
        if (chapter.id === activeChapterId && chapter.sections) {
          return {
            ...chapter,
            sections: chapter.sections.map(section => 
              section.id === sectionId 
                ? { ...section, content: text }
                : section
            ),
            lastModified: new Date()
          };
        }
        return chapter;
      });
      
      return [...newChapters];
    });
    
    if (focusedSectionId === sectionId) {
      setFocusedSectionContent(text);
    }
    
    setTimeout(() => setExternalSectionUpdate(null), 150);
  };

  const handleQuietAIApply = (result: string) => {
    if (!focusedSectionId) return;
    const newContent = focusedSectionContent.replace(selectedText, result);
    handleApplyAIText(focusedSectionId, newContent);
  };

  const handleIdeaDrop = (idea: Idea) => {
    if (!focusedSectionId) return;
    const newContent = focusedSectionContent + '\n\n' + idea.text;
    handleApplyAIText(focusedSectionId, newContent);
  };

  const handleAITrigger = () => {
    if (selectedText) {
      setIsAIOpen(true);
    }
  };

  const getLastSavedText = () => {
    if (!lastSaved) return '저장 기록 없음';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    
    if (diff < 60) return `${diff}초 전 저장됨`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전 저장됨`;
    return lastSaved.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const getThemeGradient = () => {
    switch(theme) {
      case 'carol':
        return 'from-[#c94c4c] to-[#e0b973]';
      case 'dark':
        return 'from-[#7c3aed] to-[#06b6d4]';
      default:
        return 'from-[#4a7c59] to-[#6b9d77]';
    }
  };

  const getThemeHoverColor = () => {
    switch(theme) {
      case 'carol':
        return 'group-hover:text-[#c94c4c]';
      case 'dark':
        return 'group-hover:text-[#7c3aed]';
      default:
        return 'group-hover:text-[#4a7c59]';
    }
  };

  const getSaveStatusStyle = () => {
    const isDark = theme === 'dark';
    
    if (!autoSaveEnabled) {
      return isDark 
        ? 'bg-gray-100 text-gray-600 border-gray-300'
        : 'bg-gray-50/80 text-gray-500 border-gray-200';
    }
    
    if (isSaving) {
      return isDark
        ? 'bg-blue-100 text-blue-700 border-blue-300'
        : 'bg-blue-50/80 text-blue-700 border-blue-200';
    }
    
    if (hasUnsavedChanges) {
      return isDark
        ? 'bg-amber-100 text-amber-700 border-amber-300'
        : 'bg-amber-50/80 text-amber-700 border-amber-200';
    }
    
    return isDark
      ? 'bg-green-100 text-green-700 border-green-300'
      : 'bg-green-50/80 text-green-700 border-green-200';
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  console.log('🎨 [EditorPage] Rendering, chapters count:', chapters.length);

  return (
    <>
      <AIShortcut onTrigger={handleAITrigger} />

      {theme === 'default' && <DefaultBackground />}
      {theme === 'carol' && <CarolBackground />}
      {theme === 'dark' && <DarkBackground />}

      <div className="h-screen flex flex-col relative overflow-hidden">
        <header className="h-20 header-glass flex-shrink-0 z-50 relative">
          <nav className="h-full max-w-screen-2xl mx-auto px-6 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-sm bg-gradient-to-br ${getThemeGradient()}`}>
                <Book className="w-4 h-4 text-white" />
              </div>
              <span className={`text-lg font-bold transition-colors text-gray-800 ${getThemeHoverColor()}`}>
                Bookend
              </span>
            </Link>

            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs border transition-all ${getSaveStatusStyle()}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  !autoSaveEnabled
                    ? 'bg-gray-400'
                    : isSaving
                    ? 'bg-blue-500 animate-pulse'
                    : hasUnsavedChanges
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-green-500'
                }`} />
                <span className="font-medium">
                  {!autoSaveEnabled 
                    ? '자동 저장 꺼짐' 
                    : isSaving 
                    ? '저장 중' 
                    : hasUnsavedChanges
                    ? '저장 대기'
                    : '저장 완료'
                  }
                </span>
                {autoSaveEnabled && lastSaved && !isSaving && (
                  <span className="text-[10px] opacity-70">
                    · {getLastSavedText()}
                  </span>
                )}
              </div>

              <ThemeToggle />

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg hover:bg-black/5 transition-all hover:scale-105"
                title="설정"
              >
                <Settings className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
              </button>

              <button className={`w-8 h-8 rounded-lg flex items-center justify-center hover:scale-105 transition-all duration-300 shadow-sm bg-gradient-to-br ${getThemeGradient()}`}>
                <Book className="w-4 h-4 text-white" />
              </button>
            </div>
          </nav>
        </header>

        <div 
          className="flex-1 grid overflow-hidden transition-all duration-300 max-w-screen-2xl mx-auto w-full gap-4 p-4"
          style={{
            gridTemplateColumns: `${isLeftPanelCollapsed ? '60px' : '280px'} 1fr ${isRightPanelCollapsed ? '60px' : '380px'}`
          }}
        >
          <div className="overflow-hidden">
            <Sidebar
              chapters={chapters}
              activeChapterId={activeChapterId}
              onChapterSelect={setActiveChapterId}
              onAddChapter={addNewChapter}
              onDeleteChapter={deleteChapter}
              onUpdateTitle={updateChapterTitle}
              isCollapsed={isLeftPanelCollapsed}
              onToggleCollapse={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            />
          </div>

          <div className="relative editor-paper rounded-2xl overflow-hidden">
            <div className="max-w-3xl mx-auto px-8 pt-56 pb-24 relative z-10">
              {activeChapter && (
                <EditorCanvas
                  key={activeChapter.id}
                  sections={activeChapter.sections}
                  onSectionsChange={(sections) => updateChapterSections(activeChapter.id, sections)}
                  chapterTitle={activeChapter.title}
                  onFocusedSectionChange={handleFocusedSectionChange}
                  externalSectionUpdate={externalSectionUpdate}
                  focusEmoji={getFocusEmoji()} 
                />
              )}
            </div>
          </div>

          <div className="overflow-hidden">
            <RightPanel 
              focusedSectionId={focusedSectionId}
              focusedSectionContent={focusedSectionContent}
              onApplyText={handleApplyAIText}
              isCollapsed={isRightPanelCollapsed}
              onToggleCollapse={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
              focusEmoji={getFocusEmoji()}
              selectedText={selectedText}
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsIdeaVaultOpen(true)}
        className={`fixed bottom-8 right-8 p-4 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all z-40 flex items-center justify-center bg-gradient-to-br ${getThemeGradient()}`}
        title="글감 저장소"
      >
        <Lightbulb className="w-6 h-6" />
      </button>

      <QuietAI
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        selectedText={selectedText}
        onApply={handleQuietAIApply}
      />

      <IdeaVault
        isOpen={isIdeaVaultOpen}
        onClose={() => setIsIdeaVaultOpen(false)}
        onIdeaDrop={handleIdeaDrop}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
