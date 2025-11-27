/**
 * 개선된 AI 변환 훅 v3
 * - transformDirect 결과 반환
 * - 자동 재시도 (지수 백오프)
 * - 강화된 폴백 로직
 * - 상세한 에러 메시지
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
  success: boolean;
  transformDirect: (text: string, detectedTone: ToneType, userId?: string) => Promise<string>;
  clearResult: () => void;
  setExternalResult: (text: string) => void;
}

/**
 * 프론트엔드 HuggingFace API 호출 (재시도 포함)
 */
async function expandWithHuggingFace(
  originalText: string,
  detectedTone: ToneType,
  onProgress?: (msg: string) => void
): Promise<string> {
  const toneInstruction = toneInstructions[detectedTone] || toneInstructions['normal'];
  const maxRetries = 3;
  let lastError: Error | null = null;
  let lastRetryable = true;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      onProgress?.(`🚀 HuggingFace 호출 중... (시도 ${attempt + 1}/${maxRetries})`);
      console.log(`\n[시도 ${attempt + 1}/${maxRetries}] HuggingFace 호출 시작`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35초

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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      console.log(`[시도 ${attempt + 1}] 응답 상태: ${response.status}`, data);

      // ⏳ 503: 모델 로딩 중 (재시도 가능)
      if (response.status === 503) {
        lastError = new Error(data.error || '모델이 로딩 중입니다');
        lastRetryable = true;

        if (attempt < maxRetries - 1) {
          const waitTime = (data.retryAfter || 15) * 1000;
          onProgress?.(`⏳ 모델 로딩 중... ${waitTime / 1000}초 후 재시도`);
          console.warn(`[시도 ${attempt + 1}] 503 오류, ${waitTime / 1000}초 대기`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      // ❌ 401: 인증 실패 (재시도 불가)
      if (response.status === 401) {
        lastError = new Error('🔒 API 인증 실패: HuggingFace 토큰을 확인하세요');
        lastRetryable = false;
        break;
      }

      // ❌ 404: 모델 없음 (재시도 불가)
      if (response.status === 404) {
        lastError = new Error('🚫 모델을 찾을 수 없습니다');
        lastRetryable = false;
        break;
      }

      // ❌ 기타 HTTP 에러
      if (!response.ok) {
        lastError = new Error(data.error || `API 오류 ${response.status}`);
        lastRetryable = data.retryable !== false;

        if (attempt < maxRetries - 1 && lastRetryable) {
          const waitTime = Math.pow(2, attempt) * 1000; // 1초, 2초, 4초
          onProgress?.(`⏳ ${waitTime / 1000}초 후 재시도...`);
          console.warn(`[시도 ${attempt + 1}] 재시도 가능 오류:`, data.error);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        throw lastError;
      }

      // ✅ 성공
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

      console.log(`[시도 ${attempt + 1}] ✅ 확장 완료 (${originalText.length}자 → ${expandedText.length}자)`);
      onProgress?.('✅ 확장 완료!');
      return expandedText;

    } catch (error) {
      console.error(`[시도 ${attempt + 1}] ❌ 에러:`, error);
      lastError = error as Error;

      if (attempt < maxRetries - 1 && lastRetryable) {
        const waitTime = Math.pow(2, attempt) * 1000;
        onProgress?.(`⏳ 오류 발생. ${waitTime / 1000}초 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // 모든 시도 실패
  const errorMsg = lastError?.message || '변환 실패';
  console.error(`❌ 최종 실패: ${errorMsg}`);
  throw lastError || new Error(errorMsg);
}

/**
 * 폴백 전략: 기본 개선만 적용
 */
function getFallbackText(text: string, tone: ToneType): string {
  let result = text;

  if (tone === 'formal') {
    result = result.replace(/이다\./g, '입니다.');
    result = result.replace(/한다\./g, '합니다.');
    result = result.replace(/는다\./g, '습니다.');
    result = result.replace(/된다\./g, '됩니다.');
  } else if (tone === 'common') {
    result = result.replace(/입니다\./g, '이다.');
    result = result.replace(/습니다\./g, '한다.');
  }

  return result;
}

export function useAITransform(): UseAITransformReturn {
  const [isTransforming, setIsTransforming] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [success, setSuccess] = useState(false);

  const transformDirect = async (
    text: string,
    detectedTone: ToneType,
    userId?: string
  ): Promise<string> => {
    setIsTransforming(true);
    setAiResult('');
    setError(null);
    setProgress('시작 중...');
    setSuccess(false);

    try {
      console.log('📝 AI 변환 시작');
      setProgress('HuggingFace에 요청 중...');

      const result = await expandWithHuggingFace(text, detectedTone, (msg) => {
        setProgress(msg);
        console.log(msg);
      });

      setAiResult(result);
      setProgress('✅ 완료!');
      setSuccess(true);
      console.log('✅ 변환 완료, 결과 반환:', result.substring(0, 50));
      
      // ✅ 결과 반환 (QualityPanel에서 사용)
      return result;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
      console.error('❌ HuggingFace 실패:', errorMsg);

      setError(errorMsg);
      setProgress(`⚠️ ${errorMsg}`);

      // 🔄 폴백: 기본 개선만 적용
      console.log('🔄 폴백 전략 실행 - 기본 개선 적용');
      const fallback = getFallbackText(text, detectedTone);
      setAiResult(fallback);
      setProgress('(기본 개선만 적용되었습니다)');

      // ✅ 폴백 결과도 반환
      return fallback;

    } finally {
      setIsTransforming(false);
    }
  };

  const clearResult = () => {
    setAiResult('');
    setError(null);
    setProgress('');
    setSuccess(false);
  };

  const setExternalResult = (text: string) => {
    setAiResult(text);
  };

  return {
    isTransforming,
    aiResult,
    error,
    progress,
    success,
    transformDirect,
    clearResult,
    setExternalResult,
  };
}
