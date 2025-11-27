// # bookend-recommendation/bookend-frontend/lib/api.ts
import axios, { AxiosError } from 'axios';

// =========================================================
// Configuration
// =========================================================

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =========================================================
// Types (One Source of Truth)
// =========================================================

export interface RecommendationItem {
  item_id: number;
  score: number;
  rank: number;
  content?: string;        // ✅ 백엔드에서 제공하는 추천 문장
  type?: string;           // ✅ 추천 유형 (paraphrase/tone/expand)
  reasons?: string[];
}

export interface RecommendationResponse {
  user_id: string | number;
  recommendations: RecommendationItem[];
  strategy?: {
    model: string;
    explanation: string;
    weights?: Record<string, number>;
  };
  user_profile?: {
    segment: string;
    interaction_count: number;
    diversity_score: number;
    last_interaction_date: string;
  };
  timestamp: string;
  fallback?: boolean;      // ✅ Fallback 여부
}

export interface InteractionEvent {
  user_id: string;
  event_name: string;
  event_properties?: Record<string, any>;
  timestamp: string;
}

// =========================================================
// Request Interceptor
// =========================================================

apiClient.interceptors.request.use(
  (config) => {
    // 사용자 ID 추가
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('bookend_user_id');
      if (userId) {
        config.headers['X-User-ID'] = userId;
      }
    }
    
    if (process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
      console.log('📤 API Request:', {
        method: config.method,
        url: config.url,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// =========================================================
// Response Interceptor
// =========================================================

apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
      console.log('📥 API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

// =========================================================
// Helper: Validate Recommendation Response
// =========================================================

function validateRecommendationResponse(
  data: any
): RecommendationResponse | null {
  if (!data) {
    console.warn('⚠️ Empty response data');
    return null;
  }

  if (!Array.isArray(data.recommendations)) {
    console.warn('⚠️ Invalid recommendations array');
    return null;
  }

  // 각 추천 아이템 검증
  const validRecommendations = data.recommendations.filter((item: any) => {
    if (typeof item.item_id !== 'number') {
      console.warn('⚠️ Invalid item_id:', item);
      return false;
    }
    if (typeof item.score !== 'number') {
      console.warn('⚠️ Invalid score:', item);
      return false;
    }
    return true;
  });

  if (validRecommendations.length === 0) {
    console.warn('⚠️ No valid recommendations found');
    return null;
  }

  return {
    ...data,
    recommendations: validRecommendations,
  };
}

// =========================================================
// Helper: Create Fallback Response
// =========================================================

function createFallbackResponse(userId: string): RecommendationResponse {
  console.warn('🔄 Using fallback recommendations');
  
  return {
    user_id: userId,
    recommendations: [
      { 
        item_id: 1, 
        score: 0.92, 
        rank: 1,
        content: "이 문장을 더 간결하고 명확하게 표현해보세요.",
        type: "paraphrase",
        reasons: ["인기 기능", "효과적"]
      },
      { 
        item_id: 2, 
        score: 0.85, 
        rank: 2,
        content: "좀 더 부드럽고 친근한 톤으로 바꿔보세요.",
        type: "tone",
        reasons: ["추천 기능"]
      },
      { 
        item_id: 3, 
        score: 0.78, 
        rank: 3,
        content: "이 부분을 구체적인 예시와 함께 확장해보세요.",
        type: "expand",
        reasons: ["인기 기능"]
      },
    ],
    strategy: {
      model: 'fallback',
      explanation: '백엔드 서버에 연결할 수 없어 기본 추천을 제공합니다.',
    },
    user_profile: {
      segment: '신규사용자',
      interaction_count: 0,
      diversity_score: 0,
      last_interaction_date: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    fallback: true,
  };
}

// =========================================================
// API Functions
// =========================================================

/**
 * Health check
 * 
 * @returns Health status
 * @throws Error if health check fails
 */
export async function checkHealth(): Promise<any> {
  try {
    const response = await apiClient.get('/health');
    console.log('✅ Health check successful');
    return response.data;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
}

/**
 * Get recommendations (content/type 포함)
 * 
 * Single Responsibility: 추천 데이터 조회만 담당
 * Graceful Degradation: 실패 시 fallback 데이터 반환
 * 
 * @param userId - User identifier
 * @param k - Number of recommendations (default: 5)
 * @param context - Optional context data
 * @returns Recommendation response with content/type fields
 */
export async function getRecommendations(
  userId: string,
  k: number = 5,
  context?: {
    time_of_day?: string;
    device?: string;
    session_length?: number;
  }
): Promise<RecommendationResponse> {
  try {
    console.log('🔍 Fetching recommendations:', { userId, k, context });

    const response = await apiClient.post('/recommendations', {
      user_id: userId,
      k,
      context,
    });

    // ✅ 응답 검증
    const validated = validateRecommendationResponse(response.data);
    
    if (!validated) {
      console.warn('⚠️ Invalid response, using fallback');
      return createFallbackResponse(userId);
    }

    console.log('✅ Recommendations received:', {
      count: validated.recommendations.length,
      hasContent: validated.recommendations.some(r => r.content),
      hasType: validated.recommendations.some(r => r.type),
    });
    
    return validated;
    
  } catch (error: any) {
    console.error('❌ Failed to fetch recommendations:', {
      error: error.message,
      code: error.code,
      status: error.response?.status,
    });

    // ✅ 네트워크/서버 에러 시 fallback
    if (
      error.code === 'ECONNABORTED' || 
      error.code === 'ERR_NETWORK' ||
      error.response?.status === 503 ||
      error.response?.status === 500
    ) {
      return createFallbackResponse(userId);
    }

    // 다른 에러는 재throw (예: 400 Bad Request)
    throw error;
  }
}

/**
 * Submit user interaction (for tracking)
 * 
 * Single Responsibility: 사용자 행동 추적만 담당
 * Silent Failure: 트래킹 실패는 UX에 영향 없음
 * 
 * @param userId - User identifier
 * @param eventName - Event name (e.g., 'recommendation_shown')
 * @param eventProperties - Additional event data
 * @returns Interaction response or null if failed
 */
export async function submitInteraction(
  userId: string,
  eventName: string,
  eventProperties?: Record<string, any>
): Promise<any> {
  try {
    console.log('📊 Tracking interaction:', {
      userId,
      eventName,
      properties: eventProperties,
    });

    const event: InteractionEvent = {
      user_id: userId,
      event_name: eventName,
      event_properties: eventProperties,
      timestamp: new Date().toISOString(),
    };

    const response = await apiClient.post('/interactions', event);

    console.log('✅ Interaction tracked');
    return response.data;
    
  } catch (error) {
    console.error('⚠️ Failed to submit interaction (ignored):', error);
    // ✅ 트래킹 에러는 무시 (UX에 영향 없음)
    return null;
  }
}

// =========================================================
// Export
// =========================================================

export { apiClient };