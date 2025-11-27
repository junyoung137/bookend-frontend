/**
 * useTransformation Hook (수정됨)
 * LLM 기반 텍스트 변환을 위한 React Hook
 * 
 * ✅ 핵심 기능만 유지:
 * - 실시간 텍스트 분석 (TextAnalyzer)
 * - LLM 변환 요청 (llmTransformer)
 * - 로딩/에러 상태 관리
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TextAnalyzer } from '@/services/analysis/textAnalyzer';
import { llmTransformer } from '@/services/generation/transformer';
import {
  TextAnalysis,
  ToneType,
} from '@/types/analysis.types';
import {
  TransformationType,
  LLMError,
  LLMErrorCode,
} from '@/types/llm.types';

// ==================== Types ====================

interface TransformationResult {
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

interface UseTransformationOptions {
  userId?: string;
  autoAnalyze?: boolean;
  debounceMs?: number;
  minTextLength?: number;
  enableCache?: boolean;
  onSuccess?: (result: TransformationResult) => void;
  onError?: (error: Error) => void;
}

interface UseTransformationReturn {
  // 상태
  analysis: TextAnalysis | null;
  transforming: boolean;
  analyzing: boolean;
  error: Error | null;
  
  // 메서드
  analyze: (text: string) => Promise<TextAnalysis | null>;
  transform: (
    text: string,
    type: TransformationType,
    targetTone?: ToneType
  ) => Promise<TransformationResult | null>;
  clearError: () => void;
  reset: () => void;
}

// ==================== Constants ====================

const DEFAULT_OPTIONS: UseTransformationOptions = {
  autoAnalyze: true,
  debounceMs: 500,
  minTextLength: 10,
  enableCache: true,
};

const SESSION_STORAGE_KEY = 'transformation_history';
const MAX_HISTORY_SIZE = 50;

// ==================== Hook ====================

export function useTransformation(
  options: UseTransformationOptions = {}
): UseTransformationReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // ==================== State ====================

  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null);
  const [transforming, setTransforming] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ==================== Refs ====================

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionHistoryRef = useRef<string[]>([]);

  // ==================== Effects ====================

  useEffect(() => {
    // 세션 히스토리 로드
    loadSessionHistory();

    return () => {
      // 클린업
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ==================== Methods ====================

  /**
   * 텍스트 분석
   */
  const analyze = useCallback(
    async (text: string): Promise<TextAnalysis | null> => {
      // 입력 검증
      if (!text || text.trim().length < config.minTextLength!) {
        setError(new Error(`텍스트는 최소 ${config.minTextLength}자 이상이어야 합니다`));
        return null;
      }

      setAnalyzing(true);
      setError(null);

      try {
        // 텍스트 분석
        const result = TextAnalyzer.analyze(text);
        setAnalysis(result);

        console.log('✅ Text analysis complete:', {
          tone: result.tone.detectedTone,
          genre: result.genre.genre,
          complexity: result.complexity.level,
        });

        return result;
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('❌ Analysis error:', error);
        
        if (config.onError) {
          config.onError(error);
        }

        return null;
      } finally {
        setAnalyzing(false);
      }
    },
    [config.minTextLength, config.onError]
  );

  /**
   * 텍스트 변환
   */
  const transform = useCallback(
    async (
      text: string,
      type: TransformationType,
      targetTone?: ToneType
    ): Promise<TransformationResult | null> => {
      setTransforming(true);
      setError(null);

      try {
        // 1. 텍스트 분석 (캐시 확인)
        let textAnalysis = analysis;
        if (!textAnalysis) {
          textAnalysis = await analyze(text);
          if (!textAnalysis) {
            throw new Error('텍스트 분석 실패');
          }
        }

        // 2. LLM 변환 요청
        const result = await llmTransformer.transform({
          text,
          type,
          analysis: textAnalysis,
          targetTone,
          options: {
            maxRetries: 3,
            minQualityScore: 0.7,
            fallbackToRule: true,
          },
        });

        // 3. 세션 히스토리 저장
        addToSessionHistory(type);

        console.log('✅ Transformation complete:', {
          type,
          quality: result.quality.score,
          latency: result.metadata.latency,
        });

        if (config.onSuccess) {
          config.onSuccess(result);
        }

        return result;
      } catch (err: any) {
        const error = handleTransformError(err);
        setError(error);
        console.error('❌ Transformation error:', error);

        if (config.onError) {
          config.onError(error);
        }

        return null;
      } finally {
        setTransforming(false);
      }
    },
    [analysis, config.onSuccess, config.onError, analyze]
  );

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 전체 상태 초기화
   */
  const reset = useCallback(() => {
    setAnalysis(null);
    setTransforming(false);
    setAnalyzing(false);
    setError(null);
    sessionHistoryRef.current = [];
    saveSessionHistory([]);
  }, []);

  /**
   * 세션 히스토리 로드
   */
  function loadSessionHistory(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        sessionHistoryRef.current = JSON.parse(stored);
      }
    } catch (err) {
      console.warn('⚠️ Failed to load session history:', err);
    }
  }

  /**
   * 세션 히스토리 저장
   */
  function saveSessionHistory(history: string[]): void {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.warn('⚠️ Failed to save session history:', err);
    }
  }

  /**
   * 세션 히스토리 추가
   */
  function addToSessionHistory(type: TransformationType): void {
    const history = [...sessionHistoryRef.current, type];
    
    // 최대 크기 제한
    if (history.length > MAX_HISTORY_SIZE) {
      history.shift();
    }

    sessionHistoryRef.current = history;
    saveSessionHistory(history);
  }

  /**
   * 변환 에러 처리
   */
  function handleTransformError(err: any): Error {
    if (err instanceof LLMError) {
      switch (err.code) {
        case LLMErrorCode.NETWORK_ERROR:
          return new Error('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
        
        case LLMErrorCode.TIMEOUT:
          return new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
        
        case LLMErrorCode.TOKEN_LIMIT_EXCEEDED:
          return new Error('텍스트가 너무 깁니다. 짧게 나눠서 시도해주세요.');
        
        case LLMErrorCode.RATE_LIMIT_EXCEEDED:
          return new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        
        case LLMErrorCode.QUALITY_THRESHOLD_NOT_MET:
          return new Error('품질 기준을 충족하지 못했습니다. 다시 시도해주세요.');
        
        case LLMErrorCode.INVALID_INPUT:
          return new Error('입력이 올바르지 않습니다. 텍스트를 확인해주세요.');
        
        default:
          return new Error(err.message || '알 수 없는 오류가 발생했습니다.');
      }
    }

    return err instanceof Error ? err : new Error(String(err));
  }

  return {
    // 상태
    analysis,
    transforming,
    analyzing,
    error,

    // 메서드
    analyze,
    transform,
    clearError,
    reset,
  };
}