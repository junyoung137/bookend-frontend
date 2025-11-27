"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Zap, Check, Loader2, AlertCircle } from "lucide-react";
import { Suggestion } from "@/types/editor";
import { useTransformation } from "@/hooks/useTransformation";
import { TransformationType } from "@/types/llm.types";
import { ToneType } from "@/types/analysis.types";

interface GhostPreviewProps {
  content: string;
  sectionId: string;
  onClose: () => void;
  onApply?: (suggestion: Suggestion) => void;
}

// Plain text를 HTML paragraph로 변환
function convertPlainTextToHTML(text: string): string {
  if (!text) return '<p></p>';

  const paragraphs = text
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('');

  return paragraphs || '<p></p>';
}

// ============================================================
// 🆕 개선된 품질 평가 시스템
// ============================================================

interface QualityMetrics {
  sentenceCount: number;
  avgSentenceLength: number;
  wordCount: number;
  avgWordLength: number;
  uniqueWordRatio: number;
  hasPunctuation: boolean;
  hasVariedPunctuation: boolean;
  charCount: number;
}

function analyzeTextMetrics(text: string): QualityMetrics {
  const trimmed = text.trim();
  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));

  const charCount = trimmed.length;
  const sentenceCount = sentences.length;
  const wordCount = words.length;
  
  const avgSentenceLength = sentenceCount > 0 ? charCount / sentenceCount : 0;
  const avgWordLength = wordCount > 0 ? trimmed.replace(/\s/g, '').length / wordCount : 0;
  const uniqueWordRatio = wordCount > 0 ? uniqueWords.size / wordCount : 0;

  const hasPunctuation = /[.!?,;:]/.test(trimmed);
  const hasVariedPunctuation = /[,;:]/.test(trimmed) && /[.!?]/.test(trimmed);

  return {
    sentenceCount,
    avgSentenceLength,
    wordCount,
    avgWordLength,
    uniqueWordRatio,
    hasPunctuation,
    hasVariedPunctuation,
    charCount,
  };
}

// ============================================================
// 점수 계산 로직
// ============================================================

function calculateRefinementScore(metrics: QualityMetrics): number {
  let score = 0;

  if (metrics.charCount < 30) return Math.min(20, metrics.charCount);
  if (metrics.charCount < 50) return Math.min(35, score + 15);

  if (metrics.sentenceCount >= 5) score += 20;
  else if (metrics.sentenceCount >= 3) score += 15;
  else if (metrics.sentenceCount === 2) score += 10;
  else score += 5;

  if (metrics.avgSentenceLength >= 50 && metrics.avgSentenceLength <= 120) score += 20;
  else if (metrics.avgSentenceLength >= 30 && metrics.avgSentenceLength < 50) score += 15;
  else if (metrics.avgSentenceLength >= 20 && metrics.avgSentenceLength < 30) score += 10;
  else if (metrics.avgSentenceLength < 20) score += 5;
  else score += 10;

  if (metrics.uniqueWordRatio >= 0.8) score += 20;
  else if (metrics.uniqueWordRatio >= 0.7) score += 15;
  else if (metrics.uniqueWordRatio >= 0.6) score += 10;
  else if (metrics.uniqueWordRatio >= 0.5) score += 8;
  else score += 5;

  if (metrics.hasVariedPunctuation) score += 20;
  else if (metrics.hasPunctuation) score += 12;
  else score += 5;

  if (metrics.charCount >= 300) score += 20;
  else if (metrics.charCount >= 200) score += 16;
  else if (metrics.charCount >= 150) score += 12;
  else if (metrics.charCount >= 100) score += 10;
  else if (metrics.charCount >= 50) score += 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================
// 🆕 개선된 톤 점수 계산
// ============================================================

function calculateToneAdjustmentScore(metrics: QualityMetrics, text: string): number {
  // 비정상적으로 짧은 텍스트 처리
  if (metrics.charCount < 20 || metrics.sentenceCount === 0) return 10;
  if (metrics.wordCount < 3) return 12; // 단어가 3개 미만

  // 자모만 있는 텍스트 감지
  const hasCompleteWords = /[가-힣]{2,}/.test(text); // 최소 2글자 이상 완성된 한글 단어
  const hasOnlyJamo = /^[ㄱ-ㅎㅏ-ㅣ\s]+$/.test(text); // 자모만 있는지
  
  if (!hasCompleteWords || hasOnlyJamo) return 5; // 의미 없는 텍스트

  let score = 0;

  const formalMarkers = ['입니다', '습니다', '합니다', '였습니다', '있습니다', '됩니다', '됐습니다', '드립니다'];
  const casualMarkers = ['해요', '이에요', '예요', '네요', '거든요', '~요', '어요', '죠', '아요'];

  const formalCount = formalMarkers.filter(m => text.includes(m)).length;
  const casualCount = casualMarkers.filter(m => text.includes(m)).length;
  const totalMarkers = formalCount + casualCount;

  // 톤 마커가 전혀 없는 경우
  if (totalMarkers === 0) {
    const informalPatterns = /[가-힣](어|아|지|네|다)[\s.!?]/g;
    const informalCount = (text.match(informalPatterns) || []).length;
    
    if (informalCount === 0) return 15; // 톤 표현이 전혀 없음
    if (informalCount >= 3) return 30;
    return 20;
  }

  const mixRatio = totalMarkers > 0 ? Math.min(formalCount, casualCount) / totalMarkers : 0;

  // 톤이 혼재된 경우
  if (formalCount > 0 && casualCount > 0) {
    if (mixRatio > 0.4) score = 20;
    else if (mixRatio > 0.3) score = 30;
    else if (mixRatio > 0.2) score = 40;
    else score = 50;
  } else {
    // 하나의 톤으로 일관된 경우
    const dominantCount = Math.max(formalCount, casualCount);
    const toneDensity = dominantCount / Math.max(metrics.sentenceCount, 1);
    
    if (toneDensity >= 1.5) score = 80;
    else if (toneDensity >= 1.0) score = 70;
    else if (toneDensity >= 0.5) score = 55;
    else score = 40;

    if (dominantCount >= 5) score += 10;
  }

  // 보너스 점수
  if (metrics.sentenceCount >= 5) score += 8;
  else if (metrics.sentenceCount >= 3) score += 5;
  else if (metrics.sentenceCount >= 2) score += 3;

  if (metrics.uniqueWordRatio >= 0.8) score += 5;
  else if (metrics.uniqueWordRatio >= 0.7) score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================
// 확장 점수
// ============================================================

function calculateExpansionScore(metrics: QualityMetrics): number {
  let score = 0;

  if (metrics.charCount >= 300) score += 40;
  else if (metrics.charCount >= 200) score += 32;
  else if (metrics.charCount >= 150) score += 25;
  else if (metrics.charCount >= 100) score += 18;
  else if (metrics.charCount >= 50) score += 12;
  else if (metrics.charCount >= 30) score += 8;
  else score += 5;

  if (metrics.sentenceCount >= 8) score += 30;
  else if (metrics.sentenceCount >= 6) score += 25;
  else if (metrics.sentenceCount >= 4) score += 20;
  else if (metrics.sentenceCount === 3) score += 15;
  else if (metrics.sentenceCount === 2) score += 10;
  else score += 5;

  if (metrics.wordCount >= 80) score += 20;
  else if (metrics.wordCount >= 50) score += 15;
  else if (metrics.wordCount >= 30) score += 10;
  else if (metrics.wordCount >= 15) score += 7;
  else score += 3;

  if (metrics.uniqueWordRatio >= 0.7) score += 10;
  else if (metrics.uniqueWordRatio >= 0.6) score += 7;
  else score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function GhostPreview({ content, sectionId, onClose, onApply }: GhostPreviewProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [transformingId, setTransformingId] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const prevContentRef = useRef('');

  const {
    analysis,
    transform,
    transforming,
    analyzing,
    error,
    clearError,
  } = useTransformation({
    userId: 'anonymous',
    autoAnalyze: true,
    minTextLength: 10,
  });

  useEffect(() => {
    if (content !== prevContentRef.current) {
      fetchedRef.current = false;
      prevContentRef.current = content;
    }

    if (fetchedRef.current) return;

    const timer = setTimeout(() => {
      fetchSuggestions();
      fetchedRef.current = true;
    }, 500);

    return () => clearTimeout(timer);
  }, [content, sectionId]);

  const fetchSuggestions = async () => {
    try {
      const div = document.createElement("div");
      div.innerHTML = content;
      const plainText = div.textContent || div.innerText || "";

      if (!plainText.trim()) throw new Error("변환할 텍스트가 없습니다.");

      const metrics = analyzeTextMetrics(plainText);

      const refinementScore = calculateRefinementScore(metrics);
      const toneScore = calculateToneAdjustmentScore(metrics, plainText);
      const expansionScore = calculateExpansionScore(metrics);

      const baseSuggestions: Suggestion[] = [
        {
          id: `${sectionId}-paraphrase`,
          type: "paraphrase",
          title: "다듬기",
          preview: "문장을 간결하고 명확하게 개선",
          originalText: plainText,
          transformedText: "",
          score: Math.max(0, 100 - refinementScore),
          icon: Sparkles,
          emoji: "",
          isTransforming: false,
        },
        {
          id: `${sectionId}-tone`,
          type: "tone",
          title: "톤 조절",
          preview: "글의 분위기와 표현 방식을 조화롭게 변환",
          originalText: plainText,
          transformedText: "",
          score: toneScore,
          icon: TrendingUp,
          emoji: "",
          isTransforming: false,
        },
        {
          id: `${sectionId}-expand`,
          type: "expand",
          title: "확장",
          preview: "내용을 구체적이고 풍부하게 보강",
          originalText: plainText,
          transformedText: "",
          score: expansionScore,
          icon: Zap,
          emoji: "",
          isTransforming: false,
        },
      ];

      setSuggestions(baseSuggestions);
    } catch (err: any) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const handleTransform = async (suggestion: Suggestion) => {
    if (transforming) return;
    setTransformingId(suggestion.id);
    clearError();

    try {
      const typeMap: Record<Suggestion["type"], TransformationType> = {
        paraphrase: "paraphrase",
        tone: "tone_adjust",
        expand: "expand",
      };

      const transformType = typeMap[suggestion.type];

      let targetTone: ToneType | undefined;
      if (suggestion.type === "tone" && analysis?.tone?.detectedTone) {
        targetTone = analysis.tone.detectedTone === "formal" ? "normal" : "formal";
      }

      const result = await transform(suggestion.originalText, transformType, targetTone);

      if (result) {
        let cleanedText = result.transformedText;

        const systemPatterns = [
          /이 문장은.*?유지했습니다\\./g,
          /원문의 핵심 의미를.*?보존하면서/g,
          /자연스러운 한국어 표현을 유지했습니다\\./g,
          /formal 톤을 유지하면서.*?흐름을 유지했습니다\\./g,
          /\\d+%\\s*이상\\s*간결화하여/g,
        ];

        systemPatterns.forEach((pattern) => {
          cleanedText = cleanedText.replace(pattern, "");
        });

        cleanedText = cleanedText.trim();

        const updated = suggestions.map((s) =>
          s.id === suggestion.id
            ? { ...s, transformedText: cleanedText, isTransforming: false }
            : s
        );
        setSuggestions(updated);
      }
    } catch (err: any) {
      console.error("Transform error:", err);
      showToast("변환에 실패했습니다. 다시 시도해주세요.", "error");
    } finally {
      setTransformingId(null);
    }
  };

  const handleApply = (suggestion: Suggestion) => {
    if (!suggestion.transformedText) {
      showToast('먼저 "미리보기" 버튼을 클릭해주세요.', "error");
      return;
    }

    const htmlContent = convertPlainTextToHTML(suggestion.transformedText);

    const updatedSuggestion = { ...suggestion, transformedText: htmlContent };

    onApply?.(updatedSuggestion);
    showToast("변경사항이 적용되었습니다.", "success");
  };

  const showToast = (message: string, type: "success" | "error") => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 ${
      type === "success" ? "bg-moss" : "bg-red-500"
    } text-white px-4 py-2 rounded-lg shadow-lg z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (analyzing) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-white/60 rounded-lg animate-pulse border border-gray-200 flex items-center justify-center"
          >
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin text-moss mx-auto mb-2" />
              <p className="text-xs text-gray-500">텍스트 분석 중...</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="px-3 py-2 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            <span>{error.message}</span>
          </p>
        </div>
      )}

      {suggestions.map((s, index) => {
        const isTransformingThis = transformingId === s.id;
        const hasResult = !!s.transformedText;

        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                  {s.title}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{s.preview}</p>
            </div>

            <div className="p-3 space-y-2 bg-gray-50/30">
              {hasResult ? (
                <>
                  <div className="text-xs font-medium text-moss mb-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>변경 후 미리보기</span>
                  </div>

                  <div className="text-xs text-gray-800 leading-relaxed p-2.5 bg-moss/5 rounded border border-moss/30 min-h-[3.5rem] max-h-24 overflow-y-auto">
                    {s.transformedText}
                  </div>

                  <button
                    onClick={() => handleApply(s)}
                    className="w-full py-2 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 bg-moss text-white hover:bg-moss/90"
                  >
                    <Check className="w-3 h-3" />
                    <span>적용하기</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleTransform(s)}
                  disabled={isTransformingThis || transforming}
                  className="w-full py-2 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isTransformingThis ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>변환 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>미리보기</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}