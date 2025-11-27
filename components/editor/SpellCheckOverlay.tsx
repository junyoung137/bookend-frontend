// components/editor/SpellCheckOverlay.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpellCheckError } from '@/lib/spellcheck';
import { X, CheckCircle2 } from 'lucide-react';

interface SpellCheckOverlayProps {
  errors: SpellCheckError[];
  content: string;
  containerRef: React.RefObject<HTMLDivElement>;
}

interface PopoverPosition {
  top: number;
  left: number;
}

export function SpellCheckOverlay({ errors, content, containerRef }: SpellCheckOverlayProps) {
  const [selectedError, setSelectedError] = useState<SpellCheckError | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 오류 위치에 밑줄 표시를 위한 스타일 주입
  useEffect(() => {
    if (!containerRef.current) return;

    const editorContent = containerRef.current.querySelector('.ProseMirror');
    if (!editorContent) return;

    // 기존 하이라이트 제거
    editorContent.querySelectorAll('.spell-error').forEach(el => {
      el.classList.remove('spell-error');
    });

    // 새로운 오류에 하이라이트 추가
    const textNodes = getTextNodes(editorContent);
    let currentPosition = 0;

    textNodes.forEach(node => {
      const nodeText = node.textContent || '';
      const nodeStart = currentPosition;
      const nodeEnd = currentPosition + nodeText.length;

      errors.forEach(error => {
        // 이 텍스트 노드가 오류 범위와 겹치는지 확인
        if (error.start < nodeEnd && error.end > nodeStart) {
          const parent = node.parentElement;
          if (parent && !parent.classList.contains('spell-error')) {
            // span으로 감싸기
            const wrapper = document.createElement('span');
            wrapper.className = 'spell-error';
            wrapper.style.borderBottom = '2px solid #ef4444';
            wrapper.style.cursor = 'pointer';
            wrapper.dataset.errorId = error.id;
            
            // 클릭 이벤트 추가
            wrapper.addEventListener('click', () => handleErrorClick(error, wrapper));
            
            parent.insertBefore(wrapper, node);
            wrapper.appendChild(node);
          }
        }
      });

      currentPosition = nodeEnd + 1;
    });
  }, [errors, content, containerRef]);

  // 텍스트 노드 찾기
  function getTextNodes(element: Element): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent?.trim()) {
        textNodes.push(node as Text);
      }
    }

    return textNodes;
  }

  // 오류 클릭 핸들러
  function handleErrorClick(error: SpellCheckError, element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setPopoverPosition({
        top: rect.bottom - containerRect.top + 5,
        left: rect.left - containerRect.left,
      });
      setSelectedError(error);
    }
  }

  // 수정 제안 적용
  function applySuggestion(suggestion: string) {
    // TODO: TipTap 에디터에 수정 반영
    console.log('Applying suggestion:', suggestion);
    setSelectedError(null);
  }

  return (
    <>
      {/* 팝오버 */}
      <AnimatePresence>
        {selectedError && popoverPosition && (
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
              zIndex: 50,
            }}
            className="bg-white border border-red-300 rounded-lg shadow-xl p-3 min-w-[200px]"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-600">
                맞춤법 오류
              </span>
              <button
                onClick={() => setSelectedError(null)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            </div>

            {/* 원본 텍스트 */}
            <div className="mb-2 pb-2 border-b border-gray-200">
              <div className="text-[10px] text-gray-500 mb-1">원본</div>
              <div className="text-sm text-gray-700 line-through">
                {selectedError.original}
              </div>
            </div>

            {/* 수정 제안 */}
            <div>
              <div className="text-[10px] text-gray-500 mb-1">수정 제안</div>
              <div className="space-y-1">
                {/* ✅ 안전 처리 추가 */}
                {(selectedError.suggestions && selectedError.suggestions.length > 0) ? (
                  selectedError.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full text-left px-2 py-1.5 text-sm text-gray-800 hover:bg-green-50 rounded transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </button>
                  ))
                ) : (
                  // 폴백: suggestions가 없으면 corrected 사용
                  <button
                    onClick={() => applySuggestion(selectedError.corrected)}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-800 hover:bg-green-50 rounded transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                    <span>{selectedError.corrected}</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 클릭 외부 감지 */}
      {selectedError && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setSelectedError(null)}
        />
      )}
    </>
  );
}