/**
 * LLM Transformer
 * LLM 기반 텍스트 변환 엔진 (핵심)
 */

import { llmProvider, LLMProvider } from '../llm/provider';
import {
  getParaphrasePrompt,
  getToneAdjustPrompt,
  getExpandPrompt,
  getCompressPrompt,
  buildPrompt,
  validatePrompt,
} from '../llm/prompts';
import {
  LLMRequest,
  LLMResponse,
  LLMError,
  LLMErrorCode,
  TransformationType,
} from '@/types/llm.types';
import { TextAnalysis, ToneType, GenreType } from '@/types/analysis.types';
import { StrategySelector, StrategyContext } from './strategies';
import { QualityScorer } from '../quality/scorer';
import { ResultValidator } from '../quality/validator';

export interface TransformRequest {
  text: string;
  type: TransformationType;
  analysis: TextAnalysis;
  targetTone?: ToneType;
  userSegment?: string;
  options?: {
    maxRetries?: number;
    minQualityScore?: number;
    fallbackToRule?: boolean;
  };
}

export interface TransformResult {
  originalText: string;
  transformedText: string;
  type: TransformationType;
  quality: {
    score: number;
    metrics: any;
  };
  metadata: {
    latency: number;
    tokensUsed: number;
    confidence: number;
    modelVersion: string;
    retryCount: number;
  };
  error?: string;
}

export class LLMTransformer {
  private provider: LLMProvider;
  private qualityScorer: QualityScorer;
  private validator: ResultValidator;

  constructor(provider: LLMProvider = llmProvider) {
    this.provider = provider;
    this.qualityScorer = new QualityScorer();
    this.validator = new ResultValidator();
  }

  /**
   * 메인 변환 함수
   */
  async transform(request: TransformRequest): Promise<TransformResult> {
    const startTime = Date.now();
    let retryCount = 0;
    const maxRetries = request.options?.maxRetries || 3;
    const minQuality = request.options?.minQualityScore || 0.7;

    // 입력 검증
    const validation = this.validator.validateInput(request.text);
    if (!validation.valid) {
      throw new LLMError(
        LLMErrorCode.INVALID_INPUT,
        `입력 검증 실패: ${validation.errors.join(', ')}`,
        false
      );
    }

    // 전략 선택
    const context = this.buildStrategyContext(request);
    const strategy = StrategySelector.select(context);

    // 프롬프트 생성
    const promptTemplate = this.getPromptTemplate(request);
    const prompt = buildPrompt(promptTemplate);

    // 프롬프트 검증
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.valid) {
      throw new LLMError(
        LLMErrorCode.INVALID_INPUT,
        `프롬프트 검증 실패: ${promptValidation.errors.join(', ')}`,
        false
      );
    }

    // LLM 호출 (품질 기준 충족까지 재시도)
    let llmResponse: LLMResponse | null = null;
    let bestResult: TransformResult | null = null;

    while (retryCount < maxRetries) {
      try {
        // LLM API 호출
        const llmRequest: LLMRequest = {
          prompt,
          hyperParams: strategy.hyperParams,
          context: {
            originalText: request.text,
            targetTone: request.targetTone,
            userSegment: request.userSegment,
            genre: request.analysis.genre.genre,
          },
        };

        llmResponse = await this.provider.generate(llmRequest);

        // 결과 검증
        const outputValidation = this.validator.validateOutput(
          llmResponse.generatedText,
          request.text
        );

        if (!outputValidation.valid) {
          console.warn(
            `⚠️ Output validation failed (attempt ${retryCount + 1}):`,
            outputValidation.errors
          );
          retryCount++;
          continue;
        }

        // 품질 평가
        const quality = this.qualityScorer.evaluate(
          request.text,
          llmResponse.generatedText,
          request.type,
          request.analysis
        );

        // 결과 생성
        const result: TransformResult = {
          originalText: request.text,
          transformedText: llmResponse.generatedText,
          type: request.type,
          quality: {
            score: quality.overallScore,
            metrics: quality,
          },
          metadata: {
            latency: Date.now() - startTime,
            tokensUsed: llmResponse.tokensUsed,
            confidence: llmResponse.confidence,
            modelVersion: llmResponse.modelVersion,
            retryCount,
          },
        };

        // 품질 기준 충족 확인
        if (quality.overallScore >= minQuality) {
          console.log(`✅ Quality threshold met: ${quality.overallScore.toFixed(2)}`);
          return result;
        }

        // 최고 품질 결과 보관
        if (!bestResult || quality.overallScore > bestResult.quality.score) {
          bestResult = result;
        }

        console.log(
          `⚠️ Quality below threshold (${quality.overallScore.toFixed(2)} < ${minQuality}), retrying...`
        );
        retryCount++;
      } catch (error: any) {
        if (error instanceof LLMError && !error.retryable) {
          throw error;
        }

        console.warn(`⚠️ Retry ${retryCount + 1}/${maxRetries} failed:`, error.message);
        retryCount++;

        if (retryCount >= maxRetries) {
          // Fallback 처리
          if (request.options?.fallbackToRule) {
            return this.fallbackToRuleBase(request, startTime, retryCount);
          }
          throw error;
        }
      }
    }

    // 최대 재시도 초과 시 최고 품질 결과 반환
    if (bestResult) {
      console.warn(
        `⚠️ Returning best result with quality: ${bestResult.quality.score.toFixed(2)}`
      );
      return bestResult;
    }

    // 모든 시도 실패 시 에러
    throw new LLMError(
      LLMErrorCode.QUALITY_THRESHOLD_NOT_MET,
      '품질 기준을 충족하는 결과를 생성하지 못했습니다',
      false
    );
  }

  /**
   * 전략 컨텍스트 구성
   */
  private buildStrategyContext(request: TransformRequest): StrategyContext {
    return {
      transformationType: request.type,
      sourceTone: request.analysis.tone.detectedTone,
      targetTone: request.targetTone,
      genre: request.analysis.genre.genre,
      complexity: request.analysis.complexity.level,
      userSegment: request.userSegment,
    };
  }

  /**
   * 프롬프트 템플릿 선택
   */
  private getPromptTemplate(request: TransformRequest) {
    const { text, type, analysis, targetTone } = request;
    const tone = analysis.tone.detectedTone;
    const genre = analysis.genre.genre;

    switch (type) {
      case 'paraphrase':
        return getParaphrasePrompt(text, tone, genre);

      case 'tone_adjust':
        return getToneAdjustPrompt(
          text,
          tone,
          targetTone || 'normal',
          genre
        );

      case 'expand':
        return getExpandPrompt(text, tone, genre);

      case 'compress':
        return getCompressPrompt(text, 0.5);

      default:
        throw new Error(`Unknown transformation type: ${type}`);
    }
  }

  /**
   * 규칙 기반 폴백
   */
  private fallbackToRuleBase(
    request: TransformRequest,
    startTime: number,
    retryCount: number
  ): TransformResult {
    console.warn('⚠️ Falling back to rule-based transformation');

    // 간단한 규칙 기반 변환 (기존 GhostPreview 로직)
    let transformedText = request.text;

    if (request.type === 'paraphrase') {
      // 간단한 압축: 30% 정도 줄이기
      const sentences = request.text.split(/[.!?]+/).filter(Boolean);
      transformedText = sentences
        .slice(0, Math.ceil(sentences.length * 0.7))
        .join('. ') + '.';
    } else if (request.type === 'tone_adjust' && request.targetTone) {
      // 톤 마커 교체
      if (request.targetTone === 'formal') {
        transformedText = request.text
          .replace(/이에요/g, '입니다')
          .replace(/어요/g, '습니다');
      } else {
        transformedText = request.text
          .replace(/입니다/g, '이에요')
          .replace(/습니다/g, '어요');
      }
    }

    return {
      originalText: request.text,
      transformedText,
      type: request.type,
      quality: {
        score: 0.65, // 낮은 품질
        metrics: {},
      },
      metadata: {
        latency: Date.now() - startTime,
        tokensUsed: 0,
        confidence: 0.5,
        modelVersion: 'rule-based-fallback',
        retryCount,
      },
      error: 'LLM failed, used rule-based fallback',
    };
  }
}

export const llmTransformer = new LLMTransformer();