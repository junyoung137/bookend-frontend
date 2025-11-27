import { envConfig } from '@/lib/env-config';
import {
  LLMConfig,
  LLMRequest,
  LLMResponse,
  LLMError,
  LLMErrorCode,
  CacheEntry,
} from '@/types/llm.types';
import { 
  CACHE_CONFIG, 
  RETRY_CONFIG 
} from './config';

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_CONFIG: LLMConfig = {
  provider: envConfig.llmProvider as any,
  model: envConfig.llmModel,
  baseUrl: '/api/llm', // ✅ 변경: Next.js API Route로
  timeout: envConfig.llmTimeout,
  maxRetries: envConfig.llmMaxRetries,
};

// ============================================================
// Cache Manager
// ============================================================

class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();

  get(key: string): LLMResponse | null {
    if (!CACHE_CONFIG.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: LLMResponse): void {
    if (!CACHE_CONFIG.enabled) return;

    if (this.cache.size >= CACHE_CONFIG.maxSize) {
      const firstKey = Array.from(this.cache.keys())[0];
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const cacheManager = new CacheManager();

// ============================================================
// LLM Provider Class
// ============================================================

export class LLMProvider {
  private config: LLMConfig;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;

  constructor(config: LLMConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    this.validateRequest(request);

    const cacheKey = this.generateCacheKey(request);
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit:', cacheKey);
      return cached;
    }

    await this.checkRateLimit();

    const response = await this.generateWithRetry(request);

    cacheManager.set(cacheKey, response);

    return response;
  }

  private async generateWithRetry(
    request: LLMRequest,
    attempt: number = 1
  ): Promise<LLMResponse> {
    try {
      const startTime = Date.now();
      const result = await this.callAPIRoute(request); // ✅ 변경
      const latency = Date.now() - startTime;

      return {
        generatedText: result.generated_text,
        confidence: this.calculateConfidence(result),
        tokensUsed: this.estimateTokens(result.generated_text),
        latency,
        modelVersion: this.config.model,
      };
    } catch (error: any) {
      const llmError = this.classifyError(error);

      if (llmError.retryable && attempt < this.config.maxRetries) {
        const delay = this.calculateRetryDelay(attempt);
        console.warn(
          `⚠️ Retry attempt ${attempt}/${this.config.maxRetries} after ${delay}ms`
        );
        await this.sleep(delay);
        return this.generateWithRetry(request, attempt + 1);
      }

      throw llmError;
    }
  }

  // ============================================================
  // ✅ 새로운 메서드: API Route 호출
  // ============================================================
  
  private async callAPIRoute(request: LLMRequest): Promise<any> {
    const url = `${this.config.baseUrl}/generate`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          parameters: {
            temperature: request.hyperParams.temperature,
            top_p: request.hyperParams.top_p,
            max_tokens: request.hyperParams.max_tokens,
            frequency_penalty: request.hyperParams.frequency_penalty || 0,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API Error (${response.status}): ${errorData.error || response.statusText}`
        );
      }

      const json = await response.json();
      
      if (!json.success) {
        throw new Error(json.error || 'API call failed');
      }

      return json.data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private classifyError(error: any): LLMError {
    const message = error.message || String(error);

    if (error.name === 'AbortError' || message.includes('timeout')) {
      return new LLMError(
        LLMErrorCode.TIMEOUT,
        'API 요청 시간이 초과되었습니다',
        true,
        { originalError: message }
      );
    }

    if (message.includes('fetch') || message.includes('network')) {
      return new LLMError(
        LLMErrorCode.NETWORK_ERROR,
        '네트워크 연결에 실패했습니다',
        true,
        { originalError: message }
      );
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return new LLMError(
        LLMErrorCode.RATE_LIMIT_EXCEEDED,
        'API 요청 한도를 초과했습니다',
        true,
        { originalError: message }
      );
    }

    if (message.includes('token') || message.includes('length')) {
      return new LLMError(
        LLMErrorCode.TOKEN_LIMIT_EXCEEDED,
        '토큰 제한을 초과했습니다',
        false,
        { originalError: message }
      );
    }

    if (message.includes('content') || message.includes('policy')) {
      return new LLMError(
        LLMErrorCode.CONTENT_POLICY_VIOLATION,
        '콘텐츠 정책 위반입니다',
        false,
        { originalError: message }
      );
    }

    return new LLMError(
      LLMErrorCode.UNKNOWN_ERROR,
      `알 수 없는 오류: ${message}`,
      false,
      { originalError: message }
    );
  }

  private validateRequest(request: LLMRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new LLMError(
        LLMErrorCode.INVALID_INPUT,
        '프롬프트가 비어있습니다',
        false
      );
    }

    if (request.prompt.length > 4000) {
      throw new LLMError(
        LLMErrorCode.TOKEN_LIMIT_EXCEEDED,
        '프롬프트가 너무 깁니다 (최대 4000자)',
        false
      );
    }
  }

  private generateCacheKey(request: LLMRequest): string {
    const key = {
      prompt: request.prompt,
      temperature: request.hyperParams.temperature,
      top_p: request.hyperParams.top_p,
      model: this.config.model,
    };
    return JSON.stringify(key);
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < 200) {
      await this.sleep(200 - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );
    return delay + Math.random() * 1000;
  }

  private calculateConfidence(result: any): number {
    const text = result.generated_text || '';
    
    if (text.length === 0) return 0.0;
    if (text.length < 10) return 0.3;
    
    return 0.8;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 2);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCacheStats() {
    return {
      size: cacheManager.size(),
      maxSize: CACHE_CONFIG.maxSize,
      enabled: CACHE_CONFIG.enabled,
    };
  }

  clearCache(): void {
    cacheManager.clear();
  }

  getRequestCount(): number {
    return this.requestCount;
  }
}

export const llmProvider = new LLMProvider();