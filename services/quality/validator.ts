/**
 * Result Validator
 * 입출력 유효성 검증
 */
import { LLMError, LLMErrorCode } from '@/types/llm.types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ResultValidator {
  /**
   * 입력 텍스트 검증
   */
  validateInput(text: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 빈 텍스트
    if (!text || text.trim().length === 0) {
      errors.push('텍스트가 비어있습니다');
      return { valid: false, errors, warnings };
    }

    // 2. 길이 체크
    if (text.length < 10) errors.push('텍스트가 너무 짧습니다 (최소 10자)');
    if (text.length > 1000) warnings.push('텍스트가 깁니다 (권장: 1000자 이하)');

    // 3. 문장 구조 체크
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
    if (sentences.length === 0) errors.push('유효한 문장이 없습니다');

    // 4. 특수문자 비율 체크
    if (this.calculateSpecialCharRatio(text) > 0.3) warnings.push('특수문자가 많습니다');

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 출력 텍스트 검증
   */
  validateOutput(generatedText: string, originalText: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const basicValidation = this.validateInput(generatedText);
    errors.push(...basicValidation.errors);
    warnings.push(...basicValidation.warnings);
    if (errors.length > 0) return { valid: false, errors, warnings };

    // 길이 비율 체크
    const lengthRatio = generatedText.length / originalText.length;
    if (lengthRatio < 0.3) errors.push('생성된 텍스트가 너무 짧습니다 (원문의 30% 미만)');
    if (lengthRatio > 3.0) errors.push('생성된 텍스트가 너무 깁니다 (원문의 300% 초과)');

    // 반복 패턴 체크
    if (this.hasExcessiveRepetition(generatedText)) errors.push('과도한 반복이 감지되었습니다');

    // 문장 완결성 체크
    if (!generatedText.match(/[.!?]$/)) warnings.push('문장이 완결되지 않았습니다');

    // 의미 보존 체크
    if (this.checkKeywordPreservation(originalText, generatedText) < 0.3)
      warnings.push('핵심 키워드가 많이 누락되었습니다');

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 변환 타입별 특화 검증
   */
  validateByType(generatedText: string, originalText: string, type: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const lengthRatio = generatedText.length / originalText.length;

    switch (type) {
      case 'paraphrase':
        if (lengthRatio > 0.85) warnings.push('다듬기 효과가 미미합니다');
        break;
      case 'tone_adjust':
        if (lengthRatio < 0.8 || lengthRatio > 1.2) warnings.push('톤 조절 시 길이 변화가 큽니다');
        break;
      case 'expand':
        if (lengthRatio < 1.2) warnings.push('확장 효과가 미미합니다');
        if (lengthRatio > 1.7) warnings.push('과도하게 확장되었습니다');
        break;
      case 'compress':
        if (lengthRatio > 0.6) warnings.push('압축 효과가 미미합니다');
        break;
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 특수문자 비율 계산
   */
  private calculateSpecialCharRatio(text: string): number {
    const specialChars = text.match(/[^가-힣a-zA-Z0-9\s.!?,]/g) || [];
    return specialChars.length / text.length;
  }

  /**
   * 한글 비율 계산
   */
  private calculateKoreanRatio(text: string): number {
    const koreanChars = text.match(/[가-힣]/g) || [];
    return koreanChars.length / text.length;
  }

  /**
   * 과도한 반복 체크
   */
  private hasExcessiveRepetition(text: string): boolean {
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length - 2; i++) {
      if (words[i] === words[i + 1] && words[i] === words[i + 2]) return true;
    }

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const uniqueSentences = new Set(sentences.map(s => s.trim()));
    return uniqueSentences.size < sentences.length * 0.7;
  }

  /**
   * 키워드 보존율 체크
   */
  private checkKeywordPreservation(original: string, generated: string): number {
    const extractKeywords = (text: string) =>
      text
        .split(/\s+/)
        .map(w => w.replace(/[^가-힣a-zA-Z0-9]/g, ''))
        .filter(w => w.length > 1)
        .slice(0, 20);

    const originalKeywords = extractKeywords(original);
    const generatedKeywords = extractKeywords(generated);
    if (originalKeywords.length === 0) return 1.0;

    const preserved = originalKeywords.filter(keyword => generatedKeywords.includes(keyword));
    return preserved.length / originalKeywords.length;
  }

  /**
   * 안전성 검사 (유해 콘텐츠)
   */
  validateSafety(text: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const harmfulPatterns = [
      /개인정보|주민등록번호|계좌번호/,
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(text)) {
        warnings.push('부적절한 콘텐츠가 감지되었습니다');
        break;
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
