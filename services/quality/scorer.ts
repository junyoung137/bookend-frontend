/**
 * Quality Scorer
 * 생성된 텍스트 품질 평가
 */

import {
  TransformationType,
} from '@/types/llm.types';
import { TextAnalysis, ComplexityLevel } from '@/types/analysis.types';

/**
 * Quality 평가 결과 타입 정의
 */
export interface QualityMetrics {
  grammarScore: number;
  coherenceScore: number;
  similarityScore: number;
  readabilityScore: number;
  diversityScore: number;
  overallScore: number;
}

export class QualityScorer {
  /**
   * 전체 품질 평가
   */
  evaluate(
    originalText: string,
    generatedText: string,
    transformType: TransformationType,
    originalAnalysis: TextAnalysis
  ): QualityMetrics {
    const grammar = this.evaluateGrammar(generatedText);
    const coherence = this.evaluateCoherence(generatedText);
    const similarity = this.evaluateSimilarity(originalText, generatedText);
    const readability = this.evaluateReadability(generatedText);
    const diversity = this.evaluateDiversity(generatedText);

    const weights = this.getWeightsByType(transformType);

    const overall =
      grammar * weights.grammar +
      coherence * weights.coherence +
      similarity * weights.similarity +
      readability * weights.readability +
      diversity * weights.diversity;

    return {
      grammarScore: grammar,
      coherenceScore: coherence,
      similarityScore: similarity,
      readabilityScore: readability,
      diversityScore: diversity,
      overallScore: Math.min(1.0, Math.max(0.0, overall)),
    };
  }

  private evaluateGrammar(text: string): number {
    let score = 1.0;
    if (!text.match(/[.!?]$/)) score -= 0.2;
    if (text.match(/\s{2,}/)) score -= 0.1;
    const openBrackets = (text.match(/\(/g) || []).length;
    const closeBrackets = (text.match(/\)/g) || []).length;
    if (openBrackets !== closeBrackets) score -= 0.15;
    const quotes = (text.match(/"/g) || []).length;
    if (quotes % 2 !== 0) score -= 0.15;
    if (text.match(/[.!?]{2,}/)) score -= 0.1;
    return Math.max(0.0, score);
  }

  private evaluateCoherence(text: string): number {
    let score = 0.8;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0.0;

    const lengths = sentences.map(s => s.length);
    const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    const lengthConsistency = 1.0 - Math.min(stdDev / avgLength, 1.0);
    score += lengthConsistency * 0.1;

    const connectors = /그러나|하지만|따라서|그래서|또한|그리고|그러므로|즉|예를 들어/g;
    const connectorCount = (text.match(connectors) || []).length;
    const connectorRatio = connectorCount / sentences.length;
    if (connectorRatio > 0.1 && connectorRatio < 0.5) score += 0.1;

    const words = text.split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = 1.0 - (uniqueWords.size / words.length);
    if (repetitionRatio < 0.3) score += 0.1;
    else if (repetitionRatio > 0.6) score -= 0.2;

    return Math.min(1.0, Math.max(0.0, score));
  }

  private evaluateSimilarity(original: string, generated: string): number {
    const extractKeywords = (text: string) =>
      text
        .split(/\s+/)
        .map(w => w.replace(/[^가-힣a-zA-Z0-9]/g, ''))
        .filter(Boolean);

    const originalWords = extractKeywords(original);
    const generatedWords = extractKeywords(generated);
    const preservedKeywords = originalWords.filter(word => generatedWords.includes(word));
    const keywordPreservation = originalWords.length > 0 ? preservedKeywords.length / originalWords.length : 0.5;

    const originalSentences = original.split(/[.!?]+/).filter(Boolean).length || 1;
    const generatedSentences = generated.split(/[.!?]+/).filter(Boolean).length || 1;
    const sentenceRatio = Math.min(generatedSentences / originalSentences, originalSentences / generatedSentences);

    const lengthRatio = Math.min(generated.length / original.length, original.length / generated.length);

    return keywordPreservation * 0.5 + sentenceRatio * 0.3 + lengthRatio * 0.2;
  }

  private evaluateReadability(text: string): number {
    let score = 0.7;
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const words = text.split(/\s+/).filter(Boolean);
    if (!sentences.length || !words.length) return 0.0;

    const avgSentenceLength = words.length / sentences.length;
    if (avgSentenceLength >= 15 && avgSentenceLength <= 30) score += 0.15;
    else if (avgSentenceLength < 10 || avgSentenceLength > 40) score -= 0.1;

    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    if (avgWordLength >= 2 && avgWordLength <= 5) score += 0.1;
    else if (avgWordLength > 7) score -= 0.1;

    const shortSentences = sentences.filter(s => s.length < 30).length;
    const mediumSentences = sentences.filter(s => s.length >= 30 && s.length <= 60).length;
    const longSentences = sentences.filter(s => s.length > 60).length;
    if (shortSentences > 0 && mediumSentences > 0 && longSentences >= 0) score += 0.05;

    return Math.min(1.0, Math.max(0.0, score));
  }

  private evaluateDiversity(text: string): number {
    const words = text.split(/\s+/).filter(Boolean);
    if (!words.length) return 0.0;

    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const ttr = uniqueWords.size / words.length;

    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const startWords = sentences.map(s => s.trim().split(/\s+/)[0]);
    const uniqueStarts = new Set(startWords);
    const startDiversity = sentences.length > 0 ? uniqueStarts.size / sentences.length : 0;

    const punctuations = text.match(/[.!?,;:]/g) || [];
    const uniquePunct = new Set(punctuations);
    const punctDiversity = uniquePunct.size / 6;

    return ttr * 0.5 + startDiversity * 0.3 + punctDiversity * 0.2;
  }

  /**
   * 변환 타입별 평가 가중치
   */
  private getWeightsByType(type: TransformationType) {
    const weights: Record<TransformationType, {grammar:number, coherence:number, similarity:number, readability:number, diversity:number}> = {
      paraphrase: { grammar: 0.25, coherence: 0.25, similarity: 0.3, readability: 0.15, diversity: 0.05 },
      tone_adjust: { grammar: 0.3, coherence: 0.2, similarity: 0.25, readability: 0.2, diversity: 0.05 },
      expand: { grammar: 0.2, coherence: 0.3, similarity: 0.15, readability: 0.2, diversity: 0.15 },
      compress: { grammar: 0.25, coherence: 0.25, similarity: 0.35, readability: 0.15, diversity: 0.0 },
    };
    return weights[type];
  }

  /**
   * 복잡도별 기대 품질 조정
   */
  adjustForComplexity(baseScore: number, complexity: ComplexityLevel): number {
    const adjustments: Record<ComplexityLevel, number> = { simple: 0.05, medium: 0.0, complex: -0.05 };
    return Math.min(1.0, Math.max(0.0, baseScore + adjustments[complexity]));
  }
}