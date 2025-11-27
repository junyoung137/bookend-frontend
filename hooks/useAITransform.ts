/**
 * 개선된 AI 변환 훅
 * - 자동 재시도 로직
 * - 상세한 에러 메시지
 * - 진행상황 추적
 * - 폴백 전략
 */
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
  error: string | null;
  progress: string;
  transformDirect: (text: string, detectedTone: ToneType, userId?: string) => Promise<string>;
  clearResult: () => void;
  setExternalResult: (text: string) => void;
}

/**
 * HuggingFace API로 텍스트 확장 (자동 재시도 포함)
 */
async function expandWithHuggingFace(
  originalText: string,
  detectedTone: ToneType,
  onProgress?: (msg: string) => void
): Promise<string> {
  const toneInstruction = toneInstructions[detectedTone] || toneInstructions['normal'];
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      onProgress?.(`🚀 HuggingFace 호출 (시도 ${attempt + 1}/${maxRetries})`);
      console.log(`🚀 HuggingFace 시도 ${attempt + 1}/${maxRetries}`);

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
            max_tokens: 2000,
          }
        }),
        signal: AbortSignal.timeout(35000), // 35초 (API 타임아웃 30초 + 버퍼)
      });

      // ⏳ 모델 로딩 중 - 재시도
      if (response.status === 503) {
        const errorData = await response.json().catch(() => ({}));
        const retryAfter = errorData.retryAfter || 15;
        
        if (attempt < maxRetries - 1) {
          onProgress?.(`⏳ 모델 로딩 중... ${retryAfter}초 후 재시도`);
          console.warn(`⏳ 503 오류, ${retryAfter}초 대기 후 재시도`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
      }

      // ❌ 인증 실패
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`인증 실패: ${errorData.error || 'API 키 문제'}`);
      }

      // ❌ 모델 찾기 실패
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`모델 오류: ${errorData.error || '모델에 접근할 수 없습니다'}`);
      }

      // ❌ 기타 HTTP 에러
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API 오류 ${response.status}: ${errorData.error || response.statusText}`);
      }

      // ✅ 성공
      const data = await response.json();
      let expandedText = data.data?.generated_text || data.generated_text || '';

      if (!expandedText || expandedText.trim().length === 0) {
        throw new Error('API에서 빈 응답을 반환했습니다');
      }

      // 🧹 텍스트 정제
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

      // ✅ 결과 검증
      if (expandedText.length < originalText.length * 1.1) {
        throw new Error('확장 결과가 충분하지 않습니다 (다시 시도)');
      }

      onProgress?.('✅ HuggingFace 호출 성공');
      console.log('✅ HuggingFace 성공');
      return expandedText;

    } catch (error) {
      console.error(`❌ 시도 ${attempt + 1} 실패:`, error);
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1초, 2초, 4초
        onProgress?.(`⏳ ${waitTime / 1000}초 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // 모든 시도 실패
  const errorMsg = lastError?.message || '변환 실패';
  console.error(`❌ 최종 실패: ${errorMsg}`);
  throw new Error(errorMsg);
}

/**
 * 폴백 전략: 원문 약간 수정해서 반환 (사용자 경험 개선)
 */
function getFallbackText(text: string, tone: ToneType): string {
  let result = text;

  // 간단한 개선
  if (tone === 'formal') {
    result = result.replace(/이다\./g, '입니다.');
    result = result.replace(/한다\./g, '합니다.');
  }

  return result;
}

export function useAITransform(): UseAITransformReturn {
  const [isTransforming, setIsTransforming] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const transformDirect = async (
    text: string,
    detectedTone: ToneType,
    userId?: string
  ): Promise<string> => {
    setIsTransforming(true);
    setAiResult('');
    setError(null);
    setProgress('시작 중...');

    try {
      console.log('📝 HuggingFace 기본 교정 시작');
      setProgress('HuggingFace에 요청 중...');

      const result = await expandWithHuggingFace(text, detectedTone, (msg) => {
        setProgress(msg);
      });

      setAiResult(result);
      setProgress('완료!');
      return result;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
      console.error('❌ 변환 실패:', errorMsg);
      
      setError(errorMsg);
      setProgress(`오류: ${errorMsg}`);

      // 폴백: 원문에 약간의 개선을 가한 텍스트 반환
      console.log('🔄 폴백 전략 실행');
      const fallback = getFallbackText(text, detectedTone);
      setAiResult(fallback);
      setProgress('(기본 수정만 적용됨)');

      throw err;

    } finally {
      setIsTransforming(false);
    }
  };

  const clearResult = () => {
    setAiResult('');
    setError(null);
    setProgress('');
  };

  const setExternalResult = (text: string) => {
    setAiResult(text);
  };

  return {
    isTransforming,
    aiResult,
    error,
    progress,
    transformDirect,
    clearResult,
    setExternalResult,
  };
}
