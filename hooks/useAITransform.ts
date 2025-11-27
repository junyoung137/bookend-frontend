// hooks/useAITransform.ts
import { useState } from 'react';
import { ToneType } from '@/types/analysis.types';

const toneInstructions: Record<ToneType, string> = {
  'normal': '자연스럽고 중립적인 표현을 사용하세요.',
  'formal': '격식있고 전문적인 표현을 사용하세요.',
  'terminal_word': '어미를 자연스럽게 사용하되, 일관된 톤을 유지하세요.',
  'common': '일반적이고 평범한 어투를 사용하세요.'
};

export interface UseAITransformReturn {
  isTransforming: boolean;
  aiResult: string;
  transformDirect: (text: string, detectedTone: ToneType, userId?: string) => Promise<string>;
  clearResult: () => void;
  setExternalResult: (text: string) => void;
}

/**
 * 개인화 교정 시도 (ACE 백엔드)
 */
async function tryPersonalizedCorrection(
  originalText: string,
  detectedTone: ToneType,
  userId: string
): Promise<string | null> {
  try {
    console.log("🎯 ACE 개인화 교정 시도...");
    
    const response = await fetch('/api/ace/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        text: originalText,
        feature: 'Expand',
        tone: detectedTone,
        genre: 'informative',
      }),
      signal: AbortSignal.timeout(90000), // 90초
    });

    const data = await response.json();

    // ✅ 백엔드 스킵 → HuggingFace로 폴백
    if (data.shouldUseFrontend || data.data?.method === 'backend_skip') {
      console.log("📝 백엔드 스킵 → HuggingFace 폴백");
      return null;
    }

    // ✅ Groq 실패 → HuggingFace로 폴백
    if (data.data?.method === 'groq_failed') {
      console.warn("⚠️ Groq 실패 → HuggingFace 폴백");
      return null;
    }

    // ✅ 개인화 교정 성공
    if (data.success && data.data?.corrected) {
      console.log("✅ ACE 개인화 교정 성공");
      return data.data.corrected;
    }

    return null;

  } catch (error) {
    console.warn("⚠️ ACE 호출 실패, HuggingFace 폴백:", error);
    return null;
  }
}

/**
 * HuggingFace API로 텍스트 확장
 */
async function expandWithHuggingFace(
  originalText: string,
  detectedTone: ToneType
): Promise<string> {
  const toneInstruction = toneInstructions[detectedTone] || toneInstructions['normal'];

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🚀 HuggingFace 호출 (시도 ${attempt + 1}/${maxRetries})`);

      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `다음 텍스트를 풍부하게 확장해주세요.

**원문**:
${originalText}

**확장 지침**:
1. 원문의 모든 내용을 포함하되, 각 문장에 구체적인 예시나 부연 설명을 추가
2. 원문 길이의 1.5배~2배 정도로 확장
3. ${toneInstruction}
4. 문장이 중간에 끊기지 않도록 완전한 문장으로 작성

**확장된 완전한 텍스트만 작성**:`,
          parameters: {
            temperature: 0.7,
            max_tokens: 4000,
          }
        }),
        signal: AbortSignal.timeout(60000), // 60초
      });

      if (!response.ok) {
        if (response.status === 503 && attempt < maxRetries - 1) {
          console.warn(`⏳ 모델 로딩 중... ${attempt + 1}/${maxRetries} 재시도`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      let expandedText = 
        data.data?.generated_text || 
        data.generated_text || 
        data.text || '';

      if (!expandedText || expandedText.trim().length === 0) {
        throw new Error('API 응답이 비어있습니다');
      }

      // 텍스트 정제
      expandedText = expandedText
        .replace(/^(원문|확장된 텍스트)[:：]\s*/gim, '')
        .replace(/\*\*.*?\*\*/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (expandedText.length < originalText.length * 1.1) {
        throw new Error('확장 결과가 충분하지 않습니다');
      }

      console.log("✅ HuggingFace 호출 성공");
      return expandedText;

    } catch (error) {
      console.error(`❌ HuggingFace 시도 ${attempt + 1} 실패:`, error);
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ ${waitTime / 1000}초 대기 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('변환 실패');
}

export function useAITransform(): UseAITransformReturn {
  const [isTransforming, setIsTransforming] = useState(false);
  const [aiResult, setAiResult] = useState('');

  const transformDirect = async (
    text: string,
    detectedTone: ToneType,
    userId?: string
  ): Promise<string> => {
    setIsTransforming(true);
    setAiResult('');

    try {
      // ✅ 1. 피드백 있으면 ACE 개인화 교정 시도
      if (userId && userId !== 'anonymous') {
        const personalizedResult = await tryPersonalizedCorrection(
