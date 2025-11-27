/**
 * Environment Configuration
 * 환경 변수 중앙 관리 및 타입 안전성
 */

export const envConfig = {
  // API
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION || 'v1',

  // LLM
  llmProvider: process.env.NEXT_PUBLIC_LLM_PROVIDER || 'huggingface',
  llmModel:
    process.env.NEXT_PUBLIC_LLM_MODEL ||
    'MLP-KTLim/llama-3-Korean-Bllossom-8B',
  llmTimeout: Number(process.env.NEXT_PUBLIC_LLM_TIMEOUT) || 30000,
  llmMaxRetries: Number(process.env.NEXT_PUBLIC_LLM_MAX_RETRIES) || 3,

  // Feature Flags
  enableLLM: process.env.NEXT_PUBLIC_ENABLE_LLM === 'true',
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',

  // Cache
  cacheEnabled: process.env.NEXT_PUBLIC_CACHE_ENABLED === 'true',
  cacheTTL: Number(process.env.NEXT_PUBLIC_CACHE_TTL) || 3600000,

  // Validation
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

// 환경 변수 검증
export function validateEnvConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!envConfig.apiUrl) {
    errors.push('NEXT_PUBLIC_API_URL is required');
  }

  if (envConfig.enableLLM && !process.env.HUGGINGFACE_API_KEY) {
    errors.push('HUGGINGFACE_API_KEY is required when LLM is enabled');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// 디버그 로그
if (envConfig.enableDebug && typeof window !== 'undefined') {
  console.log('🔧 Environment Config:', {
    ...envConfig,
    // API 키는 로그에 출력하지 않음
  });
}