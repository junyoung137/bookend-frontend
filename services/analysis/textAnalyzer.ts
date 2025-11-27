/**
 * Text Analyzer
 * 실시간 텍스트 분석 (tone, genre, complexity)
 */

import type {
  TextAnalysis,
  ToneAnalysis,
  ToneType,
  ToneDistribution,
  ComplexityMetrics,
  ComplexityLevel,
  GenreFeatures,
  GenreType,
  TextQuality,
} from '@/types/analysis.types';

// ============================================================
// 🆕 Text Quality Validator
// ============================================================

export class TextQualityValidator {
  /**
   * 텍스트 품질 검증
   * - 의미 있는 한글/영문 비율
   * - 완전한 문장 여부
   * - 반복 패턴 감지
   */
  static validate(text: string): TextQuality {
    const issues: string[] = [];
    let qualityScore = 1.0;

    // 1. 의미 있는 문자 비율 체크
    const meaningfulRatio = this.getMeaningfulCharRatio(text);
    if (meaningfulRatio < 0.5) {
      issues.push('의미 없는 문자가 너무 많습니다');
      qualityScore -= 0.4;
    } else if (meaningfulRatio < 0.7) {
      qualityScore -= 0.2;
    }

    // 2. 완전한 문장 여부 체크
    const hasCompleteSentence = this.hasCompleteSentence(text);
    if (!hasCompleteSentence) {
      issues.push('완전한 문장이 없습니다');
      qualityScore -= 0.3;
    }

    // 3. 과도한 반복 체크
    const repetitionRatio = this.getRepetitionRatio(text);
    if (repetitionRatio > 0.5) {
      issues.push('반복되는 내용이 많습니다');
      qualityScore -= 0.2;
    }

    // 4. 최소 단어 수 체크
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    if (words.length < 3) {
      issues.push('텍스트가 너무 짧습니다');
      qualityScore -= 0.2;
    }

    qualityScore = Math.max(0, qualityScore);

    // ✅ 타입 오류 방지: as TextQuality 사용
    return {
      isValid: qualityScore >= 0.4,
      qualityScore,
      issues,
    } as TextQuality;
  }

  /**
   * 의미 있는 문자 비율 계산
   * - 한글 완성형, 영문, 숫자, 기본 문장부호만 의미 있는 문자로 인정
   */
  private static getMeaningfulCharRatio(text: string): number {
    const meaningful = text.match(/[가-힣a-zA-Z0-9\s.,!?]/g) || [];
    const total = text.length;
    return total > 0 ? meaningful.length / total : 0;
  }

  /**
   * 완전한 문장 여부 체크
   * - 최소 5자 이상
   * - 종결어미 또는 문장부호 포함
   */
  private static hasCompleteSentence(text: string): boolean {
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length >= 5);
    
    if (sentences.length > 0) return true;

    // 종결어미 체크
    const hasEnding = /다$|요$|까$|네$|죠$/m.test(text);
    return hasEnding && text.trim().length >= 10;
  }

  /**
   * 반복 비율 계산
   */
  private static getRepetitionRatio(text: string): number {
    const chars = text.split('');
    const charCounts = new Map<string, number>();
    
    chars.forEach(char => {
      if (char.trim()) {
        charCounts.set(char, (charCounts.get(char) || 0) + 1);
      }
    });

    if (charCounts.size === 0) return 0;

    const values = Array.from(charCounts.values());
    const maxCount = Math.max(...values);
    const totalChars = chars.filter(c => c.trim()).length;
    
    return totalChars > 0 ? maxCount / totalChars : 0;
  }
}

// ============================================================
// Tone Detection (데이터 기반)
// ============================================================

export class ToneDetector {
  private static readonly TONE_MARKERS = {
    formal: /입니다|습니다|됩니다|있습니다|하십시오|드립니다/g,
    casual: /이에요|어요|해요|돼요|있어요|~요$/g,
    terminal_word: /임\.|것\.|바\.|수\./g,
    common: /이다|한다|된다|있다/g,
  };

  static detect(text: string): ToneAnalysis {
    const distribution = this.calculateDistribution(text);
    const detectedTone = this.getDominantTone(distribution);
    const confidence = this.calculateConfidence(distribution);
    const markers = this.extractMarkers(text);

    return {
      detectedTone,
      confidence,
      distribution,
      markers,
    };
  }

  private static calculateDistribution(text: string): ToneDistribution {
    const counts = {
      formal: (text.match(this.TONE_MARKERS.formal) || []).length,
      casual: (text.match(this.TONE_MARKERS.casual) || []).length,
      terminal_word: (text.match(this.TONE_MARKERS.terminal_word) || []).length,
      common: (text.match(this.TONE_MARKERS.common) || []).length,
    };

    const totalCount = Object.values(counts).reduce((acc, count) => acc + count, 0);

    if (totalCount === 0) {
      return { normal: 0.693, formal: 0.196, terminal_word: 0.065, common: 0.047 };
    }

    return {
      normal: counts.casual / totalCount,
      formal: counts.formal / totalCount,
      terminal_word: counts.terminal_word / totalCount,
      common: counts.common / totalCount,
    };
  }

  private static getDominantTone(distribution: ToneDistribution): ToneType {
    const entries = Object.entries(distribution) as [ToneType, number][];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  private static calculateConfidence(distribution: ToneDistribution): number {
    const values = Object.values(distribution);
    const max = Math.max(...values);
    const totalSum = values.reduce((acc, val) => acc + val, 0);
    return totalSum > 0 ? max / totalSum : 0.5;
  }

  private static extractMarkers(text: string): {
    formal: string[];
    casual: string[];
  } {
    return {
      formal: Array.from(new Set(text.match(this.TONE_MARKERS.formal) || [])),
      casual: Array.from(new Set(text.match(this.TONE_MARKERS.casual) || [])),
    };
  }
}

// ============================================================
// Complexity Analysis
// ============================================================

export class ComplexityAnalyzer {
  static analyze(text: string): ComplexityMetrics {
    const sentences = this.extractSentences(text);
    const words = this.extractWords(text);
    const uniqueWords = new Set(words);

    const avgSentenceLength = sentences.length > 0 
      ? text.length / sentences.length 
      : 0;

    const avgWordLength = words.length > 0
      ? words.reduce((acc, word) => acc + word.length, 0) / words.length
      : 0;

    const uniqueWordRatio = words.length > 0
      ? uniqueWords.size / words.length
      : 0;

    const level = this.determineLevel(avgSentenceLength, avgWordLength, uniqueWordRatio);

    return {
      level,
      avgSentenceLength,
      sentenceCount: sentences.length,
      avgWordLength,
      uniqueWordRatio,
    };
  }

  private static extractSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 5);
  }

  private static extractWords(text: string): string[] {
    return text
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);
  }

  private static determineLevel(
    avgSentenceLength: number,
    avgWordLength: number,
    uniqueWordRatio: number
  ): ComplexityLevel {
    const score = 
      (avgSentenceLength / 100) * 0.5 +
      (avgWordLength / 10) * 0.3 +
      uniqueWordRatio * 0.2;

    if (score < 0.3) return 'simple';
    if (score < 0.6) return 'medium';
    return 'complex';
  }
}

// ============================================================
// Genre Classification
// ============================================================

export class GenreClassifier {
  private static readonly PATTERNS = {
    dialogue: /"[^"]+"|말했다|물었다|대답했다|외쳤다/,
    emotional: /폭풍|절벽|배신|구원|절망|희망|사랑|증오|공포|기쁨|슬픔|분노/,
    sensory: /색|소리|향기|느낌|분위기|맛|촉감|냄새/,
    factual: /이다|있다|하다|되다|따라서|그러므로|왜냐하면/,
  };

  static classify(text: string): GenreFeatures {
    const features = {
      hasDialogue: this.PATTERNS.dialogue.test(text),
      hasEmotionalWords: this.PATTERNS.emotional.test(text),
      hasSensoryWords: this.PATTERNS.sensory.test(text),
      hasFactualContent: this.PATTERNS.factual.test(text),
    };

    const genre = this.determineGenre(features);
    const confidence = this.calculateConfidence(features, genre);

    return { genre, confidence, features };
  }

  private static determineGenre(features: GenreFeatures['features']): GenreType {
    if (features.hasDialogue) return 'dialogue';
    if (features.hasEmotionalWords && features.hasSensoryWords) return 'narrative';
    if (features.hasSensoryWords) return 'descriptive';
    return 'informative';
  }

  private static calculateConfidence(
    features: GenreFeatures['features'],
    genre: GenreType
  ): number {
    const matchCount = Object.values(features).filter(Boolean).length;
    const baseConfidence = matchCount / 4;

    const weights: Record<GenreType, number> = {
      dialogue: features.hasDialogue ? 1.2 : 0.8,
      narrative: features.hasEmotionalWords ? 1.1 : 0.9,
      descriptive: features.hasSensoryWords ? 1.1 : 0.9,
      informative: 1.0,
    };

    return Math.min(baseConfidence * weights[genre], 1.0);
  }
}

// ============================================================
// Main Text Analyzer
// ============================================================

export class TextAnalyzer {
  static analyze(text: string): TextAnalysis {
    if (!text || text.trim().length === 0) {
      throw new Error('분석할 텍스트가 비어있습니다');
    }

    const tone = ToneDetector.detect(text);
    const complexity = ComplexityAnalyzer.analyze(text);
    const genre = GenreClassifier.classify(text);
    const stats = this.calculateStats(text);
    const quality = TextQualityValidator.validate(text);

    return { tone, complexity, genre, stats, quality };
  }

  private static calculateStats(text: string) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

    return {
      charCount: text.length,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
    };
  }

  static validate(text: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!text || text.trim().length === 0) {
      errors.push('텍스트가 비어있습니다');
    }

    if (text.length < 10) {
      errors.push('텍스트가 너무 짧습니다 (최소 10자)');
    }

    if (text.length > 1000) {
      errors.push('텍스트가 너무 깁니다 (최대 1000자)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
