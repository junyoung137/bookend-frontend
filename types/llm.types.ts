/**
 * LLM 관련 타입 정의
 * Single Source of Truth for LLM operations
 */

// ============================================================
// LLM Provider Configuration
// ============================================================

export type LLMProvider = 'huggingface' | 'openai' | 'anthropic';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  timeout: number; // ms
  maxRetries: number;
}

export interface HyperParameters {
  temperature: number;    // 0.0 ~ 1.0 (창의성)
  top_p: number;         // 0.0 ~ 1.0 (다양성)
  max_tokens: number;    // 최대 생성 토큰
  presence_penalty?: number;  // 반복 억제
  frequency_penalty?: number; // 빈도 억제
}

// ============================================================
// Transformation Types
// ============================================================

export type TransformationType = 'paraphrase' | 'tone_adjust' | 'expand' | 'compress';

export interface TransformationStrategy {
  type: TransformationType;
  hyperParams: HyperParameters;
  promptTemplate: string;
  targetQualityScore: number; // 0.0 ~ 1.0
}

// ============================================================
// LLM Request/Response
// ============================================================

export interface LLMRequest {
  prompt: string;
  hyperParams: HyperParameters;
  context?: {
    originalText: string;
    targetTone?: string;
    userSegment?: string;
    genre?: string;
  };
}

export interface LLMResponse {
  generatedText: string;
  confidence: number;      // 0.0 ~ 1.0
  tokensUsed: number;
  latency: number;         // ms
  modelVersion: string;
  error?: string;
}

// ============================================================
// Quality Metrics
// ============================================================

export interface QualityMetrics {
  grammarScore: number;        // 0.0 ~ 1.0
  coherenceScore: number;      // 문맥 일관성
  similarityScore: number;     // 원문 유사도
  readabilityScore: number;    // 가독성
  diversityScore: number;      // 다양성
  overallScore: number;        // 종합 점수
}

export interface QualityThresholds {
  grammar: number;
  coherence: number;
  similarity: number;
  readability: number;
  overall: number;
}

// ============================================================
// Error Handling
// ============================================================

export enum LLMErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT',
  CONTENT_POLICY_VIOLATION = 'CONTENT_POLICY_VIOLATION',
  QUALITY_THRESHOLD_NOT_MET = 'QUALITY_THRESHOLD_NOT_MET',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class LLMError extends Error {
  constructor(
    public code: LLMErrorCode,
    message: string,
    public retryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

// ============================================================
// Cache
// ============================================================

export interface CacheEntry {
  key: string;
  value: LLMResponse;
  timestamp: number;
  ttl: number; // Time to live in ms
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
}