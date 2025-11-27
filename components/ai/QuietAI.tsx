"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2, Wand2, Type, Expand, CheckCircle } from "lucide-react";

interface QuietAIProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onApply: (result: string) => void;
}

type AIAction = 'paraphrase' | 'tone' | 'expand' | 'grammar';

const actions = [
  { 
    id: 'paraphrase' as AIAction, 
    label: '다시 표현하기', 
    icon: Wand2,
    prompt: '다음 문장을 더 간결하고 명확하게 표현해주세요:'
  },
  { 
    id: 'tone' as AIAction, 
    label: '톤 변경', 
    icon: Type,
    prompt: '다음 문장을 더 부드럽고 친근한 톤으로 바꿔주세요:'
  },
  { 
    id: 'expand' as AIAction, 
    label: '확장하기', 
    icon: Expand,
    prompt: '다음 문장을 구체적인 예시와 함께 확장해주세요:'
  },
  { 
    id: 'grammar' as AIAction, 
    label: '문법 교정', 
    icon: CheckCircle,
    prompt: '다음 문장의 문법을 교정해주세요:'
  }
];

export const QuietAI = ({ isOpen, onClose, selectedText, onApply }: QuietAIProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ESC 키로 닫기
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleAction = async (action: AIAction) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const actionConfig = actions.find(a => a.id === action);
      if (!actionConfig) throw new Error('Invalid action');

      const prompt = `${actionConfig.prompt}\n\n"${selectedText}"\n\n응답은 변환된 텍스트만 제공해주세요.`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          parameters: {
            temperature: 0.7,
            max_tokens: 512
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API 요청 실패');
      }

      const data = await response.json();
      const generatedText = data.data?.generated_text || '';
      
      // 응답 정제 (마크다운, 따옴표 제거)
      const cleanedText = generatedText
        .replace(/^["']|["']$/g, '')
        .replace(/^\s*응답:\s*/i, '')
        .trim();

      setResult(cleanedText);
    } catch (err: any) {
      console.error('AI Error:', err);
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-moss/10 to-leaf/10 border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-moss to-leaf rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">AI 글쓰기 도우미</h3>
                  <p className="text-sm text-gray-600">
                    <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono mx-1">Cmd+K</kbd>
                    또는
                    <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono mx-1">Ctrl+K</kbd>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div className="p-6">
            {/* 선택된 텍스트 */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">선택된 텍스트:</p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedText || '텍스트를 선택하고 Cmd+K 또는 Ctrl+K를 눌러주세요'}
                </p>
              </div>
            </div>

            {/* AI 액션 버튼들 */}
            {!result && !isLoading && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    disabled={!selectedText}
                    className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-moss hover:bg-moss/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <action.icon className="w-5 h-5 text-gray-600 group-hover:text-moss transition-colors" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-moss transition-colors">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* 로딩 상태 */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-moss animate-spin mb-4" />
                <p className="text-sm text-gray-600">AI가 생각하는 중...</p>
              </div>
            )}

            {/* 에러 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* 결과 */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <p className="text-xs text-gray-500 mb-2">AI 제안:</p>
                  <div className="bg-gradient-to-br from-moss/5 to-leaf/5 rounded-lg p-4 border-2 border-moss/20">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {result}
                    </p>
                  </div>
                </div>

                {/* 적용 버튼 */}
                <div className="flex gap-3">
                  <button
                    onClick={handleApply}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-moss text-white rounded-lg hover:bg-moss/90 transition-colors font-medium"
                  >
                    <CheckCircle className="w-5 h-5" />
                    적용하기
                  </button>
                  <button
                    onClick={() => setResult(null)}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    다시 시도
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* 하단 힌트 */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
            <p className="text-xs text-gray-500 text-center">
              💡 팁: 텍스트를 선택하고 
              <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono mx-1">Cmd+K</kbd> 
              또는 
              <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono mx-1">Ctrl+K</kbd>
              를 누르면 빠르게 AI를 호출할 수 있어요
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};