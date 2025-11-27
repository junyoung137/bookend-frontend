"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, Loader2, CheckCircle, X } from "lucide-react";

interface LengthAdjustmentProps {
  content: string;
  sectionId: string;
  onApply: (sectionId: string, newContent: string) => void;
}

export function LengthAdjustment({ content, sectionId, onApply }: LengthAdjustmentProps) {
  const [lengthRatio, setLengthRatio] = useState(100);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustedText, setAdjustedText] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const getPlainText = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const plainText = getPlainText(content);
  const currentCharCount = plainText.length;
  const targetCharCount = Math.round((currentCharCount * lengthRatio) / 100);

  const handleAdjust = async () => {
    if (lengthRatio === 100) {
      showToast('길이를 변경해주세요', 'error');
      return;
    }

    setIsAdjusting(true);
    try {
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `다음 텍스트의 의미를 유지하면서 ${lengthRatio}% 길이로 조절해주세요.

**원문** (${currentCharCount}자):
${plainText}

**목표 길이**: 약 ${targetCharCount}자 (${lengthRatio}%)

**조절 지침**:
${lengthRatio < 100 
  ? `- 핵심 의미는 유지하면서 불필요한 부분을 간결하게 압축
- 중복 표현 제거
- 간접적 표현을 직접적으로 변경` 
  : `- 구체적인 예시나 부연 설명 추가
- 세부 사항 확장
- 더 풍부한 표현 사용`}

**조절된 텍스트만 작성** (다른 설명 없이):`,
          temperature: 0.7,
          maxTokens: 4000,
        })
      });

      if (!response.ok) {
        throw new Error('길이 조절 실패');
      }

      const data = await response.json();
      let result = data.data?.generated_text || data.generated_text || '';

      // 텍스트 정제
      const cleanPatterns = [
        /^(원문|조절된 텍스트|변환된 텍스트)[:：]\s*/gim,
        /\*\*.*?\*\*/g,
        /이 (문장|텍스트)은.*?습니다\./g,
      ];

      cleanPatterns.forEach((pattern) => {
        result = result.replace(pattern, '');
      });

      result = result.replace(/\s+/g, ' ').trim();

      if (result.length === 0) {
        throw new Error('유효한 결과를 생성하지 못했습니다');
      }

      setAdjustedText(result);
      setShowPreview(true);
    } catch (error: any) {
      console.error('길이 조절 실패:', error);
      showToast('길이 조절에 실패했습니다', 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleApply = () => {
    if (!adjustedText) return;

    const htmlContent = convertPlainTextToHTML(adjustedText);
    
    if (adjustedText.length > 300) {
      const overflow = adjustedText.length - 300;
      showToast(`⚠️ 300자를 ${overflow}자 초과했습니다. (현재: ${adjustedText.length}자)`, 'error');
    }
    
    onApply(sectionId, htmlContent);
    showToast('길이 조절이 적용되었습니다', 'success');
    setShowPreview(false);
    setAdjustedText('');
    setLengthRatio(100);
  };

  const convertPlainTextToHTML = (text: string): string => {
    if (!text) return '<p></p>';
    const paragraphs = text
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
      .join('');
    return paragraphs || '<p></p>';
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${
      type === 'success' ? 'bg-moss' : 'bg-red-500'
    } text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2700);
  };

  const getRatioColor = () => {
    if (lengthRatio < 70) return 'from-blue-500 to-cyan-500';
    if (lengthRatio < 100) return 'from-indigo-500 to-blue-500';
    if (lengthRatio === 100) return 'from-gray-400 to-gray-500';
    if (lengthRatio < 150) return 'from-green-500 to-emerald-500';
    return 'from-amber-500 to-orange-500';
  };

  const getRatioText = () => {
    if (lengthRatio < 70) return '매우 짧게';
    if (lengthRatio < 90) return '짧게';
    if (lengthRatio === 100) return '현재 길이';
    if (lengthRatio < 130) return '조금 길게';
    if (lengthRatio < 170) return '길게';
    return '매우 길게';
  };

  return (
    <div className="space-y-3">
      <div className="p-4 bg-white/60 rounded-xl border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-indigo-600" />
            <div className="text-sm font-semibold text-gray-800">
              본문의 의미는 같게 하고 길이만 조정하기
            </div>
          </div>
        </div>

        {/* 현재 글자 수 */}
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">현재 글자 수</span>
            <span className="font-bold text-gray-800">{currentCharCount}자</span>
          </div>
        </div>

        {/* 슬라이더 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{getRatioText()}</span>
            <span className={`text-sm font-bold bg-gradient-to-r ${getRatioColor()} bg-clip-text text-transparent`}>
              {lengthRatio}%
            </span>
          </div>

          <input
            type="range"
            min="50"
            max="200"
            step="10"
            value={lengthRatio}
            onChange={(e) => setLengthRatio(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, 
                rgb(59, 130, 246) 0%, 
                rgb(59, 130, 246) ${(lengthRatio - 50) / 1.5}%, 
                rgb(229, 231, 235) ${(lengthRatio - 50) / 1.5}%, 
                rgb(229, 231, 235) 100%)`
            }}
          />

          <div className="flex justify-between text-[10px] text-gray-400">
            <span>50%</span>
            <span>100%</span>
            <span>200%</span>
          </div>
        </div>

        {/* 목표 글자 수 */}
        <div className="mt-3 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-indigo-700">목표 글자 수</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-800">약 {targetCharCount}자</span>
              {targetCharCount > 300 && (
                <span className="text-[10px] text-red-600 font-medium">⚠️ 제한 초과</span>
              )}
            </div>
          </div>
        </div>

        {/* 조절하기 버튼 */}
        <button
          onClick={handleAdjust}
          disabled={isAdjusting || lengthRatio === 100}
          className="w-full mt-3 px-3 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg hover:shadow-md transition-all text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdjusting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>조절 중...</span>
            </>
          ) : (
            <>
              <Ruler className="w-3 h-3" />
              <span>AI 길이 조절</span>
            </>
          )}
        </button>
      </div>

      {/* 미리보기 */}
      <AnimatePresence>
        {showPreview && adjustedText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-indigo-50/80 rounded-xl border-2 border-indigo-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-800">조절 결과 미리보기</span>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setAdjustedText('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="text-xs text-gray-800 leading-relaxed p-3 bg-white rounded-lg border border-indigo-200 max-h-48 overflow-y-auto mb-2">
              {adjustedText}
            </div>

            {/* 글자 수 비교 */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="p-2 bg-white rounded-lg border border-indigo-200">
                <div className="text-[10px] text-gray-500 mb-0.5">변경 전</div>
                <div className="text-sm font-bold text-gray-700">{currentCharCount}자</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-indigo-200">
                <div className="text-[10px] text-gray-500 mb-0.5">변경 후</div>
                <div className="text-sm font-bold text-indigo-700">{adjustedText.length}자</div>
              </div>
            </div>

            {adjustedText.length > 300 && (
              <div className="mb-2 p-2 bg-red-50 rounded-lg border border-red-200">
                <p className="text-[10px] text-red-700">
                  ⚠️ 300자를 {adjustedText.length - 300}자 초과했습니다
                </p>
              </div>
            )}

            <button
              onClick={handleApply}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-xs font-medium flex items-center justify-center gap-2"
            >
              <span>적용하기</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(99, 102, 241), rgb(59, 130, 246));
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
          transition: all 0.2s;
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.6);
        }

        .slider-thumb::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(99, 102, 241), rgb(59, 130, 246));
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
          transition: all 0.2s;
        }

        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.6);
        }
      `}</style>
    </div>
  );
}