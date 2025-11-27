/**
 * API Types
 * 
 * ✅ One Source of Truth: 모든 API 타입이 여기 정의됨
 * ✅ Type Safety: 컴파일 타임 타입 체크
 * ✅ Documentation: JSDoc으로 명확한 설명
 */

// =========================================================
// Recommendation Types
// =========================================================

/**
 * 개별 추천 아이템
 */
export interface RecommendationItem {
  /** 아이템 ID */
  item_id: number;
  
  /** 추천 점수 (0.0 ~ 1.0) */
  score: number;
  
  /** 순위 (1부터 시작) */
  rank: number;
  
  /** ✅ 추천 문장 텍스트 (백엔드에서 생성) */
  content?: string;
  
  /** ✅ 추천 유형 (paraphrase/tone/expand) */
  type?: 'paraphrase' | 'tone' | 'expand';
  
  /** 추천 이유 목록 */
  reasons?: string[];
  
  /** 아이템 이름 (선택) */
  item_name?: string;
  
  /** 카테고리 (선택) */
  category?: string;
}

/**
 * 추천 요청
 */
export interface RecommendationRequest {
  /** 사용자 ID */
  user_id: string;
  
  /** 추천 개수 (기본: 5) */
  k?: number;
  
  /** 컨텍스트 정보 */
  context?: {
    /** 시간대 (morning/afternoon/evening/night) */
    time_of_day?: string;
    
    /** 디바이스 타입 */
    device?: string;
    
    /** 세션 길이 */
    session_length?: number;
  };
}

/**
 * 추천 응답
 */
export interface RecommendationResponse {
  /** 사용자 ID */
  user_id: string | number;
  
  /** 추천 아이템 리스트 */
  recommendations: RecommendationItem[];
  
  /** 추천 전략 정보 */
  strategy?: {
    /** 모델 이름 */
    model: string;
    
    /** 설명 */
    explanation: string;
    
    /** 가중치 (선택) */
    weights?: Record<string, number>;
  };
  
  /** 사용자 프로필 정보 */
  user_profile?: {
    /** 사용자 세그먼트 */
    segment: string;
    
    /** 상호작용 횟수 */
    interaction_count: number;
    
    /** 다양성 점수 */
    diversity_score: number;
    
    /** 마지막 상호작용 시간 */
    last_interaction_date: string;
  };
  
  /** 응답 시각 */
  timestamp: string;
  
  /** ✅ Fallback 여부 */
  fallback?: boolean;
}

// =========================================================
// Interaction Types
// =========================================================

/**
 * 사용자 행동 이벤트
 */
export interface InteractionEvent {
  /** 사용자 ID */
  user_id: string;
  
  /** 이벤트 이름 */
  event_name: string;
  
  /** 이벤트 속성 */
  event_properties?: Record<string, any>;
  
  /** 이벤트 시각 */
  timestamp: string;
}

// =========================================================
// Health Check Types
// =========================================================

/**
 * 헬스 체크 응답
 */
export interface HealthCheckResponse {
  /** 전체 상태 */
  status: string;
  
  /** 데이터베이스 상태 */
  database?: string;
  
  /** 모델 로드 여부 */
  models_loaded?: boolean;
  
  /** 응답 시각 */
  timestamp: string;
}