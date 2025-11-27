// # bookend-frontend/app/api/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const BACKEND_TIMEOUT = 10000; // 10 seconds

// =========================================================
// Types
// =========================================================

interface BackendRecommendationItem {
  item_id: number;
  score: number;
  rank: number;
  content?: string;
  type?: string;
  reasons?: string[];
  item_name?: string;
  category?: string;
  metadata?: Record<string, any>;
}

interface BackendResponse {
  user_id: number;
  recommendations: BackendRecommendationItem[];
  total_count: number;
  model_name: string;
  is_cold_start: boolean;
  latency_ms?: number;
  request_metadata?: Record<string, any>;
  timestamp: string;
}

interface FrontendRecommendationItem {
  item_id: number;
  score: number;
  rank: number;
  content?: string;       
  type?: string;          
  reasons?: string[];
}

interface FrontendResponse {
  user_id: string | number;
  recommendations: FrontendRecommendationItem[];
  strategy: {
    model: string;
    explanation: string;
    weights?: Record<string, number>;
  };
  user_profile: {
    segment: string;
    interaction_count: number;
    diversity_score: number;
    last_interaction_date: string;
  };
  timestamp: string;
  fallback?: boolean;
}

// =========================================================
// Helper: Convert User ID
// =========================================================

function convertUserId(userId: any): number {
  // user_123 -> 숫자로 변환
  if (typeof userId === 'string') {
    const match = userId.match(/\d+/);
    if (match) {
      return parseInt(match[0]);
    }
  }
  
  if (typeof userId === 'number') {
    return userId;
  }
  
  // 기본값
  return Math.floor(Math.random() * 1000000);
}

// =========================================================
// Helper: Create Fallback Response
// =========================================================

function createFallbackResponse(
  userId: string | number,
  error?: string
): FrontendResponse {
  console.warn('🔄 Creating fallback response:', error);
  
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
      }
    ],
    strategy: {
      model: "Fallback",
      explanation: error || "백엔드 서버에 연결할 수 없어 기본 추천을 제공합니다."
    },
    user_profile: {
      segment: "신규사용자",
      interaction_count: 0,
      diversity_score: 0,
      last_interaction_date: new Date().toISOString()
    },
    timestamp: new Date().toISOString(),
    fallback: true
  };
}

// =========================================================
// Helper: Transform Backend to Frontend
// =========================================================

function transformBackendResponse(
  data: BackendResponse,
  originalUserId: string | number
): FrontendResponse {
  return {
    user_id: originalUserId,
    recommendations: data.recommendations.map((item) => ({
      item_id: item.item_id,
      score: item.score,
      rank: item.rank,
      content: item.content,      
      type: item.type,            // ✅ 보존!
      reasons: item.reasons || []
    })),
    strategy: {
      model: data.model_name,
      explanation: data.is_cold_start 
        ? "신규 사용자를 위한 인기 기반 추천"
        : "개인화된 하이브리드 추천",
      weights: {}
    },
    user_profile: {
      segment: data.is_cold_start ? "신규사용자" : "일반사용자",
      interaction_count: 0,
      diversity_score: 0,
      last_interaction_date: new Date().toISOString()
    },
    timestamp: data.timestamp || new Date().toISOString()
  };
}

// =========================================================
// Main Handler
// =========================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Request Body 파싱
    const body = await request.json();
    const { user_id, k = 5, context } = body;
    
    console.log('📥 Received request:', { user_id, k, context });
    
    // 2. User ID 변환
    const backendUserId = convertUserId(user_id);
    
    // 3. 백엔드 요청 생성
    const backendRequest = {
      user_id: backendUserId,
      limit: k,
      exclude_interacted: true,
      min_score: 0.0,
      enable_diversity: true,
      include_reasons: true,
      context: context || null,
    };
    
    console.log('📤 Forwarding to backend:', {
      url: `${BACKEND_URL}/api/v1/recommend/hybrid`,
      body: backendRequest
    });

    // 4. 백엔드 호출
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);
    
    const response = await fetch(
      `${BACKEND_URL}/api/v1/recommend/hybrid`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendRequest),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    // 5. 응답 처리
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', {
        status: response.status,
        body: errorText
      });
      
      return NextResponse.json(
        createFallbackResponse(
          user_id,
          `Backend returned ${response.status}`
        ),
        { status: 200 }
      );
    }

    // 6. 성공 응답 변환
    const data: BackendResponse = await response.json();
    
    console.log('✅ Backend response:', {
      recommendations: data.recommendations.length,
      hasContent: data.recommendations.some(r => r.content),
      hasType: data.recommendations.some(r => r.type),
      latency: Date.now() - startTime
    });
    
    // ✅ content/type 필드 보존하면서 변환
    const frontendResponse = transformBackendResponse(data, user_id);
    
    return NextResponse.json(frontendResponse, { status: 200 });
    
  } catch (error: any) {
    const latency = Date.now() - startTime;
    
    console.error('❌ Recommendation API Error:', {
      message: error.message,
      name: error.name,
      latency
    });
    
    // 7. 에러 시 Fallback
    let errorMessage = 'Unknown error';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Backend timeout';
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network error';
    } else {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      createFallbackResponse('unknown', errorMessage),
      { status: 200 }
    );
  }
}