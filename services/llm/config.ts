/**
 * LLM Configuration
 * 하이퍼파라미터 및 모델 설정
 */

import { 
  LLMConfig, 
  HyperParameters, 
  TransformationStrategy,
  QualityThresholds,
  CacheConfig 
} from '@/types/llm.types';

// ============================================================
// Model Configuration
// ============================================================

export const LLM_CONFIG: LLMConfig = {
  provider: 'huggingface',
  model: 'MLP-KTLim/llama-3-Korean-Bllossom-8B', // 또는 'maywell/EXAONE-3.5-2.4B-Instruct'
  baseUrl: 'https://api-inference.huggingface.co/models',
  timeout: 30000,      // 30초
  maxRetries: 3,
};

// ============================================================
// Hyper Parameters by Transformation Type
// ============================================================

export const HYPER_PARAMS: Record<string, HyperParameters> = {
  // 다듬기 (간결하고 정확하게)
  paraphrase: {
    temperature: 0.5,        // 낮은 창의성 (정확성 우선)
    top_p: 0.85,
    max_tokens: 300,
    presence_penalty: 0.1,
    frequency_penalty: 0.2,  // 반복 억제
  },
  
  // 톤 조절 (자연스럽게)
  tone_adjust: {
    temperature: 0.6,
    top_p: 0.9,
    max_tokens: 350,
    presence_penalty: 0.0,
    frequency_penalty: 0.1,
  },
  
  // 확장 (창의적으로)
  expand: {
    temperature: 0.8,        // 높은 창의성
    top_p: 0.95,
    max_tokens: 500,
    presence_penalty: 0.3,   // 다양한 표현 유도
    frequency_penalty: 0.2,
  },
  
  // 압축 (핵심만)
  compress: {
    temperature: 0.4,        // 매우 낮은 창의성
    top_p: 0.8,
    max_tokens: 200,
    presence_penalty: 0.0,
    frequency_penalty: 0.3,
  },
};

// ============================================================
// Transformation Strategies
// ============================================================

export const TRANSFORMATION_STRATEGIES: Record<string, TransformationStrategy> = {
  paraphrase: {
    type: 'paraphrase',
    hyperParams: HYPER_PARAMS.paraphrase,
    promptTemplate: 'paraphrase_v1',
    targetQualityScore: 0.85,
  },
  
  tone_adjust: {
    type: 'tone_adjust',
    hyperParams: HYPER_PARAMS.tone_adjust,
    promptTemplate: 'tone_adjust_v1',
    targetQualityScore: 0.80,
  },
  
  expand: {
    type: 'expand',
    hyperParams: HYPER_PARAMS.expand,
    promptTemplate: 'expand_v1',
    targetQualityScore: 0.75,
  },
  
  compress: {
    type: 'compress',
    hyperParams: HYPER_PARAMS.compress,
    promptTemplate: 'compress_v1',
    targetQualityScore: 0.80,
  },
};

// ============================================================
// Quality Thresholds
// ============================================================

export const QUALITY_THRESHOLDS: QualityThresholds = {
  grammar: 0.80,      // 문법 정확도
  coherence: 0.75,    // 문맥 일관성
  similarity: 0.70,   // 원문 유사도
  readability: 0.75,  // 가독성
  overall: 0.75,      // 종합 점수
};

// ============================================================
// Cache Configuration
// ============================================================

export const CACHE_CONFIG: CacheConfig = {
  enabled: true,
  ttl: 3600000,       // 1시간
  maxSize: 1000,      // 최대 1000개 항목
};

// ============================================================
// Retry Configuration
// ============================================================

export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,    // 1초
  maxDelay: 10000,       // 10초
  backoffFactor: 2,      // 지수 백오프
};

// ============================================================
// Rate Limiting
// ============================================================

export const RATE_LIMIT = {
  requestsPerMinute: 30,
  requestsPerHour: 1000,
  burstSize: 5,
};

// ============================================================
// Token Limits
// ============================================================

export const TOKEN_LIMITS = {
  maxInputTokens: 1000,
  maxOutputTokens: 500,
  warningThreshold: 800,
};

// ============================================================
// Environment Variables
// ============================================================

export function getEnvConfig() {
  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    apiVersion: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  };
}

// ============================================================
// Model Fallbacks
// ============================================================

export const MODEL_FALLBACKS = [
  'MLP-KTLim/llama-3-Korean-Bllossom-8B',
  'maywell/EXAONE-3.5-2.4B-Instruct',
  'beomi/Llama-3-Open-Ko-8B',
];

// ============================================================
// Performance Monitoring
// ============================================================

export const PERFORMANCE_THRESHOLDS = {
  maxLatency: 5000,        // 5초
  warningLatency: 3000,    // 3초
  minConfidence: 0.60,     // 최소 신뢰도
};