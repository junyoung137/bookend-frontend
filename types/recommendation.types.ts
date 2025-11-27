/**
 * 추천 시스템 타입
 * Hybrid_v2 기반 (User-CF 35% + Item-CF 35% + Popularity 20% + Diversity 10%)
 */

import { TransformationType } from './llm.types';
import { ToneType, GenreType } from './analysis.types';

// ============================================================
// Recommendation Item
// ============================================================

export interface RecommendationItem {
  id: string;
  type: TransformationType;
  title: string;
  preview: string;
  score: number;              // 0.0 ~ 1.0
  confidence: number;         // 0.0 ~ 1.0
  reasoning: string[];        // 추천 이유
  metadata: {
    targetTone?: ToneType;
    genre?: GenreType;
    complexity?: string;
    estimatedQuality: number;
  };
}

// ============================================================
// Recommendation Request
// ============================================================

export interface RecommendationRequest {
  userId: string;
  textAnalysis: {
    tone: ToneType;
    genre: GenreType;
    complexity: string;
  };
  context: {
    currentContent: string;
    sessionHistory: string[];
    timeSlot: string;
  };
  constraints?: {
    maxItems: number;
    minScore: number;
    diversityWeight: number;
  };
}

// ============================================================
// Recommendation Response
// ============================================================

export interface RecommendationResponse {
  items: RecommendationItem[];
  metadata: {
    totalScore: number;
    diversityScore: number;
    personalizedScore: number;
    latency: number;
  };
  debug?: {
    weights: RecommendationWeights;
    scores: {
      userCF: number;
      itemCF: number;
      popularity: number;
      diversity: number;
    };
  };
}

// ============================================================
// Hybrid Model Weights (Hybrid_v2)
// ============================================================

export interface RecommendationWeights {
  popularity: number;   // 20% (낮춤)
  userCF: number;       // 35% (강화)
  itemCF: number;       // 35% (강화)
  diversity: number;    // 10% (유지)
}

export const DEFAULT_WEIGHTS: RecommendationWeights = {
  popularity: 0.20,
  userCF: 0.35,
  itemCF: 0.35,
  diversity: 0.10,
};

// ============================================================
// Diversity Metrics
// ============================================================

export interface DiversityMetrics {
  uniqueRecommendations: number;
  totalRecommendations: number;
  diversityRatio: number;        // 목표: 60%+
  coverageScore: number;         // 아이템 커버리지
}

// ============================================================
// Personalization Score
// ============================================================

export interface PersonalizationScore {
  userSimilarity: number;        // User-CF 기여도
  itemSimilarity: number;        // Item-CF 기여도
  contextRelevance: number;      // 맥락 적합도
  novelty: number;               // 새로움
  overall: number;               // 종합 점수
}

// ============================================================
// Soft Loop (기능 전환 유도)
// ============================================================

export interface SoftLoopSuggestion {
  fromType: TransformationType;
  toType: TransformationType;
  trigger: 'high_repeat' | 'low_engagement' | 'exploration';
  message: string;
}

// ============================================================
// Echo Feedback (반복 패턴 학습)
// ============================================================

export interface EchoFeedback {
  actionType: string;
  frequency: number;
  lastOccurrence: Date;
  pattern: 'routine' | 'exploratory' | 'rare';
  recommendation: string;
}

// ============================================================
// Quality Feedback Loop
// ============================================================

export interface QualityFeedback {
  itemId: string;
  accepted: boolean;
  qualityScore: number;
  userRating?: number;
  improvements: string[];
}

export interface FeedbackLoop {
  feedbackHistory: QualityFeedback[];
  learningRate: number;
  adaptationThreshold: number;
}