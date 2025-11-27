"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TextStyle from "@tiptap/extension-text-style";
import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Trash2, Bold, Italic, List, ListOrdered, Heading1, Heading2 } from "lucide-react";
import { MAX_CHARS_PER_SECTION } from "@/types/editor";
import { FeedbackButtons } from "@/components/editor/FeedbackButtons";

interface SectionEditorProps {
  sectionId: string;
  content: string;
  order: number;
  onContentChange: (content: string) => void;
  onDelete?: () => void;
  onFocus?: () => void;
  isFocused?: boolean;
  canDelete: boolean;
  focusEmoji?: string;
  aiApplied?: boolean;
  isNewUser?: boolean;   // 신규 유저 여부 파악
}

// ✅ HTML 정규화 유틸
const normalizeHTML = (html: string): string => {
  return html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
};

export const SectionEditor = ({
  sectionId,
  content,
  order,
  onContentChange,
  onDelete,
  onFocus,
  isFocused,
  canDelete,
  focusEmoji,
  aiApplied = false,
  isNewUser = false,
}: SectionEditorProps) => {
  const isExternalUpdate = useRef(false);
  const lastAppliedContent = useRef(content);
  const editorInitialized = useRef(false);
  const allowOverLimit = useRef(false);
  const isApplyingContent = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: { depth: 100, newGroupDelay: 500 },
      }),
      TextStyle,
      Placeholder.configure({
        placeholder: '여기에 글을 작성해보세요...',
      }),
      CharacterCount,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[109px]',
      },
    },
    // ✅ onUpdate에서 무한 루프 방지
    onUpdate: ({ editor }) => {
      // 외부 업데이트 중이면 무시
      if (isExternalUpdate.current || isApplyingContent.current) {
        return;
      }

      const text = editor.getText();
      const currentLength = text.length;
      
      // 사용자 입력이 제한 초과 시 undo
      if (!allowOverLimit.current && currentLength > MAX_CHARS_PER_SECTION) {
        editor.commands.undo();
        return;
      }
      
      const html = editor.getHTML();
      lastAppliedContent.current = html;
      onContentChange(html);
      allowOverLimit.current = false;
    },
    onCreate: ({ editor }) => {
      editorInitialized.current = true;
    },
    onFocus: () => {
      onFocus?.();
    },
  });

  // ✅ 외부 콘텐츠 업데이트 처리 (AI 적용)
  useEffect(() => {
    if (!editor || !editorInitialized.current) return;

    const normalizedNewContent = normalizeHTML(content);
    const normalizedLastApplied = normalizeHTML(lastAppliedContent.current);

    // 콘텐츠가 실제로 변경되었는지만 확인
    if (normalizedNewContent === normalizedLastApplied) {
      return;
    }

    console.log('🔄 [SectionEditor] Applying external update:', {
      sectionId,
      contentLength: content.length,
    });

    isExternalUpdate.current = true;
    isApplyingContent.current = true;
    allowOverLimit.current = true;

    try {
      editor.commands.clearContent(false);
      editor.commands.setContent(content, false);
      lastAppliedContent.current = content;
    } catch (err) {
      console.error('❌ Error applying content:', err);
    } finally {
      isExternalUpdate.current = false;
      isApplyingContent.current = false;
      allowOverLimit.current = false;
    }
  }, [content, editor, sectionId]);

  // ✅ 콘텐츠 적용 콜백 (메모이제이션으로 안정화)
  const applyContent = useCallback((newContent: string) => {
    if (!editor || isExternalUpdate.current) return;

    isApplyingContent.current = true;
    allowOverLimit.current = true;

    try {
      editor.commands.clearContent(false);
      editor.commands.setContent(newContent, false);
      lastAppliedContent.current = newContent;
    } finally {
      isApplyingContent.current = false;
      allowOverLimit.current = false;
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="w-full h-40 bg-white/40 rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-gray-400 text-sm">에디터 로딩 중...</span>
      </div>
    );
  }

  const charCount = editor.storage.characterCount.characters();
  const isNearLimit = charCount > MAX_CHARS_PER_SECTION * 0.9 && charCount <= MAX_CHARS_PER_SECTION;
  const isAtLimit = charCount >= MAX_CHARS_PER_SECTION;
  const progress = (charCount / MAX_CHARS_PER_SECTION) * 100;
  const isOverLimit = charCount > MAX_CHARS_PER_SECTION;

  const ToolbarButton = ({ onClick, active, children, title }: {
    onClick: () => void;
    active: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-all ${active ? 'bg-moss text-white' : 'hover:bg-gray-100 text-gray-600'}`}
    >
      {children}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative group transition-all ${isFocused ? 'ring-2 ring-moss/50 rounded-xl' : ''}`}
    >
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          {isFocused && focusEmoji && (
            <span className="text-sm">{focusEmoji}</span>
          )}
          <span className="text-xs font-medium text-gray-500">#{order}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {canDelete && (
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-lg"
              title="섹션 삭제"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* 진행률 바 */}
      {charCount > 0 && (
        <div className="mb-3 px-2">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.3 }}
              className={`h-full transition-colors ${
                isOverLimit 
                  ? 'bg-purple-500' 
                  : isAtLimit 
                  ? 'bg-red-500' 
                  : isNearLimit 
                  ? 'bg-orange-500' 
                  : 'bg-moss'
              }`}
            />
          </div>
        </div>
      )}

      {/* 에디터 영역 */}
      <div className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-sm transition-all border ${
        isFocused ? 'border-moss/30 shadow-md' : 'border-gray-200'
      } ${isOverLimit ? 'border-purple-300' : isAtLimit ? 'border-red-300' : ''}`}>
        
        {/* 포맷팅 툴바 */}
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-200 px-3 py-1.5 flex items-center gap-0.5 bg-gray-50/50"
          >
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게 (Ctrl+B)">
              <Bold className="w-2 h-2" />
            </ToolbarButton>

            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임 (Ctrl+I)">
              <Italic className="w-2 h-2" />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-300 mx-1" />

            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="제목 1">
              <Heading1 className="w-2 h-2" />
            </ToolbarButton>

            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="제목 2">
              <Heading2 className="w-2 h-2" />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-300 mx-1" />

            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="글머리 기호">
              <List className="w-2 h-2" />
            </ToolbarButton>

            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 매기기">
              <ListOrdered className="w-2 h-2" />
            </ToolbarButton>
          </motion.div>
        )}

        {/* 에디터 콘텐츠 */}
        <div className="p-6">
          <EditorContent
            editor={editor}
            className="prose prose-sm prose-neutral max-w-none focus:outline-none
              prose-p:mb-3 prose-p:leading-relaxed prose-p:text-gray-800
              prose-strong:text-gray-900 prose-strong:font-bold
              prose-em:text-gray-700 prose-em:italic
              prose-headings:text-gray-900 prose-headings:font-bold
              prose-h1:text-2xl prose-h1:mb-4
              prose-h2:text-xl prose-h2:mb-3
              prose-ul:list-disc prose-ul:ml-5 prose-ul:my-3
              prose-ol:list-decimal prose-ol:ml-5 prose-ol:my-3
              prose-li:my-1
              prose-blockquote:border-l-4 prose-blockquote:border-moss prose-blockquote:pl-4 prose-blockquote:italic"
          />
        </div>
      </div>

      {/* ☑️ AI 적용 시 피드백 버튼 표시 */}
      {aiApplied && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700"
        >
          <div className="font-semibold mb-1">✨ AI가 적용한 콘텐츠입니다</div>
      
      {/* ☑️ 300자 초과 시 추가 안내 */}
      {isOverLimit && (
        <div className="text-purple-600 mb-2">
            현재 {charCount}자로 권장 길이({MAX_CHARS_PER_SECTION}자)를 {charCount - MAX_CHARS_PER_SECTION}자 초과했습니다. 
            직접 수정은 {MAX_CHARS_PER_SECTION}자까지만 가능합니다.
          </div>
        )}

          {/* ☑️ 피드백 버튼 */}
          <FeedbackButtons
          userId="anonymous"                      
          originalText={editor.getText() || ""}    
          correctedText={editor.getText() || ""}  
          feature="Paraphrase"                      
          tone="normal"                             
          genre="informative"
          complexity="simple"
          recommendationScore={0.85}          // 없으면 일단 0 또는 고정값
        />
        </motion.div>
      )}

      {isAtLimit && !isOverLimit && !aiApplied && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"
        >
          <div className="font-semibold mb-1">💡 각 섹션은 최대 300자까지 작성 가능합니다</div>
          <div className="text-red-600">더 작성하려면 아래 "새 섹션 추가" 버튼을 눌러주세요</div>
        </motion.div>
      )}

      {isNearLimit && !isAtLimit && !isOverLimit && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700"
        >
          <span>💡 곧 글자 수 제한에 도달합니다 ({MAX_CHARS_PER_SECTION - charCount}자 남음)</span>
        </motion.div>
      )}
    </motion.div>
  );
};