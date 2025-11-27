"use client";

import { useState, useEffect, useRef } from "react";
import { EditorCanvas } from "./EditorCanvas";
import { QuietAI } from "../ai/QuietAI";
import { AIShortcut } from "../ai/AIShortcut";
import { IdeaVault } from "../ideas/IdeaVault";
import { Lightbulb } from "lucide-react";
import { Idea } from "@/types/bookshelf";
import { Section } from "@/types/editor";

interface EditorWithAIProps {
  sections: Section[]; // ✅ content 대신 sections 배열
  onSectionsChange: (sections: Section[]) => void; // ✅ onContentChange 대신
  chapterTitle: string;
}

export const EditorWithAI = ({ 
  sections, 
  onSectionsChange, 
  chapterTitle 
}: EditorWithAIProps) => {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isIdeaVaultOpen, setIsIdeaVaultOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
  const [focusedSectionContent, setFocusedSectionContent] = useState("");
  const [externalSectionUpdate, setExternalSectionUpdate] = useState<{
    sectionId: string;
    content: string;
  } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // 텍스트 선택 감지
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || "";
      
      // 에디터 내부에서만 선택되었는지 확인
      if (editorRef.current?.contains(selection?.anchorNode || null)) {
        setSelectedText(text);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, []);

  // AI 결과 적용
  const handleAIApply = (result: string) => {
    if (!focusedSectionId) return;

    // 선택된 텍스트를 AI 결과로 교체
    const newContent = focusedSectionContent.replace(selectedText, result);
    
    // 외부 업데이트 트리거
    setExternalSectionUpdate({
      sectionId: focusedSectionId,
      content: newContent
    });

    // 다음 렌더링 사이클 후 초기화
    setTimeout(() => setExternalSectionUpdate(null), 100);
  };

  // 아이디어 드롭 처리
  const handleIdeaDrop = (idea: Idea) => {
    if (!focusedSectionId) return;

    const newContent = focusedSectionContent + '\n\n' + idea.text;
    
    setExternalSectionUpdate({
      sectionId: focusedSectionId,
      content: newContent
    });

    setTimeout(() => setExternalSectionUpdate(null), 100);
  };

  // Cmd+/ 단축키로 AI 열기
  const handleAITrigger = () => {
    if (selectedText) {
      setIsAIOpen(true);
    }
  };

  return (
    <>
      {/* AI 단축키 리스너 */}
      <AIShortcut onTrigger={handleAITrigger} />

      {/* 에디터 */}
      <div ref={editorRef} className="relative">
        <EditorCanvas
          sections={sections}
          onSectionsChange={onSectionsChange}
          chapterTitle={chapterTitle}
          onFocusedSectionChange={(sectionId, sectionContent) => {
            setFocusedSectionId(sectionId);
            setFocusedSectionContent(sectionContent);
          }}
          externalSectionUpdate={externalSectionUpdate}
        />
      </div>

      {/* 글감 저장소 버튼 (플로팅) */}
      <button
        onClick={() => setIsIdeaVaultOpen(true)}
        className="fixed bottom-8 right-8 p-4 bg-gradient-to-br from-moss to-leaf text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all z-40"
        title="글감 저장소 (아이디어 보관함)"
      >
        <Lightbulb className="w-6 h-6" />
      </button>

      {/* 조용한 AI 패널 */}
      <QuietAI
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        selectedText={selectedText}
        onApply={handleAIApply}
      />

      {/* 글감 저장소 */}
      <IdeaVault
        isOpen={isIdeaVaultOpen}
        onClose={() => setIsIdeaVaultOpen(false)}
        onIdeaDrop={handleIdeaDrop}
      />
    </>
  );
};