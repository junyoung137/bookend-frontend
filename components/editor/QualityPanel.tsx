"use client";

import { useEffect, useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useTransformation } from "@/hooks/useTransformation";
import { useExampleGeneration } from "@/hooks/useExampleGeneration";
import { useAITransform } from "@/hooks/useAITransform";
import { TransformationType } from "@/types/llm.types";
import { ToneType } from "@/types/analysis.types";
import { LengthAdjustment } from "./LengthAdjustment";
import { QualityScore } from "./QualityScore";
import { ExampleWarning } from "./ExampleWarning";
import { AIResultPreview } from "./AIResultPreview";
import {
  analyzeTextMetrics,
  getPlainText,
  convertPlainTextToHTML,
  needsExamples,
  QualityMetrics,
} from "@/utils/textAnalysis";
import {
  generateQualityScores,
  QualityScore as QualityScoreType,
} from "@/utils/scoreCalculation";
import { aceCorrectOrNull } from "@/services/aceFeedback.client";  // ← ACE 추가!

interface QualityPanelProps {
  content: string;
  sectionId?: string;
  onApplyExamples?: (sectionId: string, newContent: string) => void;
}

export function QualityPanel({ content, sectionId, onApplyExamples }: QualityPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [showInsertOptions, setShowInsertOptions] = useState(false);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);
  const [expandedType, setExpandedType] = useState<'refine' | 'tone' | 'expand' | null>(null);

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

  const {
    isGenerating,
    generatedExamples,
    generateExamples,
    clearExamples,
  } = useExampleGeneration();

  const {
    isTransforming,
    aiResult,
    transformDirect,
    clearResult,
    setExternalResult,  // ← 추가!
  } = useAITransform();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    clearExamples();
    setShowInsertOptions(false);
    setSelectedSentenceIndex(null);
    setExpandedType(null);
    clearResult();
  }, [content]);

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

  const { metrics, qualityScores, showExampleWarning } = useMemo(() => {
    if (!content || content.trim().length === 0) {
      return { metrics: null, qualityScores: [], showExampleWarning: false };
    }

    try {
      const plainText = getPlainText(content);

      if (plainText.trim().length < 10) {
        return { metrics: null, qualityScores: [], showExampleWarning: false };
      }

      const m = analyzeTextMetrics(plainText);

      if (m.charCount < 20 || m.sentenceCount === 0) {
        return {
          metrics: m,
          qualityScores: [{
            label: "품질 경고",
            score: Math.round((m.charCount / 20) * 100),
            icon: "⚠️",
            color: "from-red-500 to-orange-500",
            description: "더 많은 내용을 작성해주세요",
            type: 'refine' as const,
          }],
          showExampleWarning: false
        };
      }

      const scores = generateQualityScores(m, plainText);
      const needs = needsExamples(m);
      
      return { metrics: m, qualityScores: scores, showExampleWarning: needs };
    } catch (error) {
      console.error('분석 실패:', error);
      return { metrics: null, qualityScores: [], showExampleWarning: false };
    }
  }, [content]);

  const handleGenerateExamples = async () => {
    if (!metrics || !sectionId) return;
    
    try {
      const plainText = getPlainText(content);
      const examples = await generateExamples(plainText);
      
      if (examples.length > 0) {
        setShowInsertOptions(true);
        showToast('예시가 생성되었습니다!', 'success');
      } else {
        showToast('예시 생성에 실패했습니다. 다시 시도해주세요.', 'error');
      }
    } catch (error: any) {
      console.error('예시 생성 중 오류:', error);
      showToast(error.message || '예시 생성 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleApplyExamples = (insertPosition: 'end' | 'after-sentence') => {
    if (!onApplyExamples || !sectionId || generatedExamples.length === 0) return;

    const plainText = getPlainText(content);
    let newContent = '';
    
    if (insertPosition === 'end') {
      const examplesText = ' ' + generatedExamples.join(' ');
      newContent = plainText + examplesText;
    } else if (insertPosition === 'after-sentence' && selectedSentenceIndex !== null && metrics) {
      const sentences = metrics.sentences;
      const beforeSentences = sentences.slice(0, selectedSentenceIndex + 1).join('. ');
      const afterSentences = sentences.slice(selectedSentenceIndex + 1).join('. ');
      
      const examplesText = ' ' + generatedExamples.join(' ');
      newContent = beforeSentences + examplesText + (afterSentences ? '. ' + afterSentences : '');
    }
    
    if (newContent) {
      const htmlContent = convertPlainTextToHTML(newContent);
      onApplyExamples(sectionId, htmlContent);
      clearExamples();
      setShowInsertOptions(false);
      setSelectedSentenceIndex(null);
      showToast('예시가 추가되었습니다.', 'success');
    }
  };

  // ========== ACE 통합 버전 handleAITransform ==========
  const handleAITransform = async (type: 'refine' | 'tone' | 'expand') => {
    if (!metrics || !sectionId || isTransforming) return;

    setExpandedType(type);
    clearResult();
    clearError();

    try {
      const plainText = getPlainText(content);
      console.log(`📝 원문: ${plainText.substring(0, 50)}...`);

      // Feature 매핑
      const featureMap: Record<'refine' | 'tone' | 'expand', string> = {
        refine: 'Paraphrase',
        tone: 'ToneAdjust',
        expand: 'Expand',
      };

      // Tone 설정
      let targetTone: ToneType | undefined;
      if (type === 'tone' && analysis?.tone?.detectedTone) {
        targetTone = analysis.tone.detectedTone === 'formal' ? 'normal' : 'formal';
      } else {
        targetTone = analysis?.tone?.detectedTone || 'normal';
      }

      console.log(`🎯 Feature: ${featureMap[type]}, Tone: ${targetTone}`);

      // 1️⃣ ACE 개인화 시도
      try {
        console.log(`🔄 ACE 시도 중...`);
        
        const aceResult = await aceCorrectOrNull({
          userId: 'anonymous',
          text: plainText,
          feature: featureMap[type],
          tone: targetTone || 'normal',
          genre: analysis?.genre?.genre || 'informative',
        });

        console.log(`📦 ACE 결과:`, aceResult);

        if (aceResult) {
          let correctedText = aceResult.corrected || plainText;

          // 🔹 ACE 결과 문장 정제
          const explainMarkers = ["**변환 설명**", "변환 설명:", "설명:"];
          for (const marker of explainMarkers) {
            const idx = correctedText.indexOf(marker);
            if (idx !== -1) {
              correctedText = correctedText.slice(0, idx).trim();
              break;
            }
          }

          console.log(`✅ ACE 성공! Method: ${aceResult.method}`);

          // 미리보기에 표시
          setExternalResult(correctedText);

          showToast(
            aceResult.method === 'personalized'
              ? '✨ 이전 피드백을 반영해서 문장을 생성했어요!'
              : '🤖 AI가 문장을 생성했어요.',
            'success'
          );

          // ACE 성공 시 여기서 종료
          return;
        }
        
        console.log(`⚪ ACE 결과 없음 → HF LLM 사용`);
        
      } catch (aceError) {
        console.warn('❗ ACE 실패, 기본 LLM으로 fallback:', aceError);
      }

      // 2️⃣ 기존 HF LLM 사용 (피드백 없거나 ACE 실패 시)
      console.log(`🔧 기존 LLM 사용 (type: ${type})`);

      if (type === 'expand') {
        // 확장: transformDirect 사용
        try {
          const detectedTone: ToneType = analysis?.tone?.detectedTone || 'normal';
          await transformDirect(plainText, detectedTone);
          // transformDirect가 내부에서 setExternalResult 호출함
          console.log('✅ 확장 완료');
          return;
        } catch (expandError) {
          console.error('❌ 확장 API 실패:', expandError);
          showToast('텍스트 확장에 실패했습니다. 다시 시도해주세요.', 'error');
          return;
        }
      }

      // 다듬기 / 톤 조정: transform 사용
      const typeMap: Record<'refine' | 'tone' | 'expand', TransformationType> = {
        refine: 'paraphrase',
        tone: 'tone_adjust',
        expand: 'expand',
      };

      const result = await transform(plainText, typeMap[type], targetTone);

      if (result && result.transformedText) {
        let cleanedText = result.transformedText;

        // 시스템 메시지 제거
        const systemPatterns = [
          /이 문장은.*?유지했습니다\./g,
          /원문의 핵심 의미를.*?보존하면서/g,
          /자연스러운 한국어 표현을 유지했습니다\./g,
        ];

        systemPatterns.forEach((pattern) => {
          cleanedText = cleanedText.replace(pattern, '');
        });

        cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

        // ✅ 미리보기에 표시!
        setExternalResult(cleanedText);
        console.log('✅ 변환 완료');

      } else {
        showToast('변환에 실패했습니다. 다시 시도해주세요.', 'error');
      }
    } catch (err: any) {
      console.error('❌ Transform error:', err);
      showToast('변환에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  };

  const handleApplyAIResult = () => {
    if (!onApplyExamples || !sectionId || !aiResult) return;

    const htmlContent = convertPlainTextToHTML(aiResult);
    
    if (aiResult.length > 300) {
      const overflow = aiResult.length - 300;
      showToast(`⚠️ 300자를 ${overflow}자 초과했습니다. (현재: ${aiResult.length}자)`, 'error');
    }
    
    onApplyExamples(sectionId, htmlContent);
    
    requestAnimationFrame(() => {
      showToast('변경사항이 적용되었습니다.', 'success');
      setExpandedType(null);
      clearResult();
    });
  };

  if (!mounted || !metrics) {
    return null;
  }

  const hasQualityWarning = qualityScores.length === 1 && qualityScores[0].label === "품질 경고";

  return (
    <div className="space-y-3">
      {showExampleWarning && !hasQualityWarning && (
        <ExampleWarning
          metrics={metrics}
          isGenerating={isGenerating}
          generatedExamples={generatedExamples}
          showInsertOptions={showInsertOptions}
          selectedSentenceIndex={selectedSentenceIndex}
          onGenerate={handleGenerateExamples}
          onApply={handleApplyExamples}
          onClose={() => {
            clearExamples();
            setShowInsertOptions(false);
          }}
          onSelectSentence={setSelectedSentenceIndex}
        />
      )}

      {hasQualityWarning ? (
        <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-800 mb-1">텍스트 품질 문제 감지</h4>
              <p className="text-xs text-red-700 leading-relaxed">
                {qualityScores[0].description}
              </p>
              <div className="mt-2 text-xs text-red-600">
                현재 품질 점수: <span className="font-bold">{qualityScores[0].score}%</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {qualityScores.map((item, index) => (
            <div key={item.label}>
              <QualityScore
                score={item}
                index={index}
                isTransforming={isTransforming}
                expandedType={expandedType}
                onTransform={handleAITransform}
              />

              <AnimatePresence>
                {expandedType === item.type && aiResult && (
                  <AIResultPreview
                    aiResult={aiResult}
                    onApply={handleApplyAIResult}
                    onClose={() => {
                      setExpandedType(null);
                      clearResult();
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          ))}

          {sectionId && metrics && metrics.charCount >= 20 && (
            <LengthAdjustment
              content={content}
              sectionId={sectionId}
              onApply={onApplyExamples!}
            />
          )}
        </>
      )}
    </div>
  );
}