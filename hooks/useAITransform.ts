// hooks/useAITransform.ts
import { useState } from 'react';
import { ToneType } from '@/types/analysis.types';

const toneInstructions: Record<ToneType, string> = {
  'normal': '자연스럽고 중립적인 표현을 사용하세요.',
  'formal': '격식있고 전문적인 표현을 사용하세요. "~입니다", "~습니다" 등의 격식체를 사용합니다.',
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
5. 불필요한 반복 지양

**확장된 완전한 텍스트만 작성** (다른 설명 없이):`,
          parameters: {
            temperature: 0.7,
            max_tokens: 4000,
          }
        }),
        signal: AbortSignal.timeout(60000),
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
        data.text || 
        data.content || 
        data.result || '';

      if (!expandedText || expandedText.trim().length === 0) {
        throw new Error('API 응답이 비어있습니다');
      }

      // 텍스트 정제
      const cleanPatterns = [
        /^(원문|확장된 텍스트|변환된 텍스트)[:：]\s*/gim,
        /\*\*.*?\*\*/g,
        /이 (문장|텍스트)은.*?습니다\./g,
        /원문의 핵심 의미를.*?보존하면서/g,
        /자연스러운 한국어 표현을 유지했습니다\./g,
      ];

      cleanPatterns.forEach((pattern) => {
        expandedText = expandedText.replace(pattern, '');
      });

      expandedText = expandedText.replace(/\s+/g, ' ').trim();

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
      // ✅ 무조건 HuggingFace 사용 (백엔드는 피드백 저장만)
      console.log("📝 HuggingFace 기본 교정 실행");
      const result = await expandWithHuggingFace(text, detectedTone);
      setAiResult(result);
      return result;

    } catch (error) {
      console.error('❌ 변환 실패:', error);
      throw error;
    } finally {
      setIsTransforming(false);
    }
  };

  const clearResult = () => {
    setAiResult('');
  };

  const setExternalResult = (text: string) => {
    setAiResult(text);
  };

  return {
    isTransforming,
    aiResult,
    transformDirect,
    clearResult,
    setExternalResult,
  };
}
