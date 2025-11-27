/**
 * useSpellCheck Hook
 * 맞춤법 검사 상태 관리
 */

import { useState, useCallback } from 'react';
import { checkSpelling, SpellCheckError, SpellCheckResult } from '@/lib/spellcheck';

interface UseSpellCheckOptions {
  minLength?: number;
  maxLength?: number;
}

export function useSpellCheck(
  text: string,
  options: UseSpellCheckOptions = {}
) {
  const [isChecking, setIsChecking] = useState(false);
  const [errors, setErrors] = useState<SpellCheckError[]>([]);
  const [correctedText, setCorrectedText] = useState<string | null>(null);

  const { minLength = 5, maxLength = 300 } = options;

  /**
   * 즉시 맞춤법 검사
   */
  const checkNow = useCallback(async () => {
    // 입력 검증
    if (!text || text.trim().length < minLength) {
      alert(`최소 ${minLength}자 이상 입력해주세요`);
      return;
    }

    if (text.length > maxLength) {
      alert(`${maxLength}자 이하로 입력해주세요`);
      return;
    }

    setIsChecking(true);
    setErrors([]);
    setCorrectedText(null);

    try {
      console.log('🔍 [Hook] Starting spellcheck...');
      
      const result: SpellCheckResult = await checkSpelling(text);

      if (result.hasErrors) {
        setErrors(result.errors);
        setCorrectedText(result.correctedText);
        console.log(`✅ [Hook] ${result.errors.length}개 오류 발견`);
      } else {
        setErrors([]);
        setCorrectedText(null);
        console.log('✅ [Hook] 맞춤법 오류 없음');
        alert('맞춤법 오류가 없습니다! 👍');
      }
    } catch (error: any) {
      console.error('❌ [Hook] 맞춤법 검사 실패:', error);
      alert(error.message || '맞춤법 검사 중 오류가 발생했습니다');
      setErrors([]);
      setCorrectedText(null);
    } finally {
      setIsChecking(false);
    }
  }, [text, minLength, maxLength]);

  /**
   * 오류 초기화
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
    setCorrectedText(null);
  }, []);

  return {
    errors,
    correctedText,
    isChecking,
    hasErrors: errors.length > 0,
    checkNow,
    clearErrors,
  };
}