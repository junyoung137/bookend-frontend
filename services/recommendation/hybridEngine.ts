/**
 * Hybrid Recommendation Engine
 * Adaptive_hybrid.py 로직을 TypeScript로 구현
 * 
 * 전략:
 * - User Segment 기반 가중치 조정
 * - User-CF(35%) + Item-CF(35%) + Popularity(20%) + Diversity(10%)
 * - 메모리 캐싱 + LocalStorage 백업
 */

import {
  RecommendationRequest,
  RecommendationResponse,
  RecommendationItem,
  RecommendationWeights,
  DEFAULT_WEIGHTS,
  DiversityMetrics,
  PersonalizationScore,
} from '@/types/recommendation.types';
import { TransformationType } from '@/types/llm.types';
import { UserSegment, UserBehavior } from '@/types/analysis.types';

import { CollaborativeFilter } from './collaborativeFilter';
import { PopularityTracker } from './popularityTracker';
import { DiversityBooster } from './diversityBooster';
import { CacheManager } from '@/lib/cache';

// ==================== Types ====================

interface UserInteraction {
  userId: string;
  itemId: TransformationType;
  timestamp: Date;
  eventType: string;
  selected: boolean;
}

interface UserProfile {
  userId: string;
  segment: UserSegment;
  interactionCount: number;
  lastInteractionDays: number;
  diversityScore: number;
  tenureDays: number;
}

interface SegmentStrategy {
  weights: RecommendationWeights;
  k: number;
  explanation: string;
}

// ==================== Constants ====================

const SEGMENT_STRATEGIES: Record<UserSegment, SegmentStrategy> = {
  new: {
    weights: {
      popularity: 0.70,
      userCF: 0.10,
      itemCF: 0.10,
      diversity: 0.10,
    },
    k: 5,
    explanation: '신규 사용자 - 인기 기능 위주 추천',
  },
  casual: {
    weights: {
      popularity: 0.50,
      userCF: 0.20,
      itemCF: 0.20,
      diversity: 0.10,
    },
    k: 8,
    explanation: '초보 사용자 - 인기 + 개인화 혼합',
  },
  growth: {
    weights: {
      popularity: 0.20,
      userCF: 0.35,
      itemCF: 0.35,
      diversity: 0.10,
    },
    k: 10,
    explanation: '일반 사용자 - 개인화 중심 추천',
  },
  power: {
    weights: {
      popularity: 0.10,
      userCF: 0.40,
      itemCF: 0.35,
      diversity: 0.15,
    },
    k: 12,
    explanation: '헤비 사용자 - 고급/다양한 기능 추천',
  },
};

const STORAGE_KEY = {
  INTERACTIONS: 'bookend_interactions',
  USER_PROFILES: 'bookend_user_profiles',
  ITEM_METADATA: 'bookend_item_metadata',
};

const CACHE_TTL = {
  USER_PROFILE: 5 * 60 * 1000, // 5분
  SIMILARITY: 10 * 60 * 1000, // 10분
  POPULARITY: 30 * 60 * 1000, // 30분
};

// ==================== Main Class ====================

export class HybridRecommendationEngine {
  private cfEngine: CollaborativeFilter;
  private popularityTracker: PopularityTracker;
  private diversityBooster: DiversityBooster;
  private cache: CacheManager;

  // 메모리 캐시
  private userProfiles: Map<string, UserProfile> = new Map();
  private interactions: UserInteraction[] = [];

  constructor() {
    this.cfEngine = new CollaborativeFilter();
    this.popularityTracker = new PopularityTracker();
    this.diversityBooster = new DiversityBooster();
    this.cache = new CacheManager();

    this.loadFromStorage();
  }

  // ==================== Public API ====================

  /**
   * 메인 추천 함수
   */
  async recommend(request: RecommendationRequest): Promise<RecommendationResponse> {
    const startTime = Date.now();

    try {
      // 1. 사용자 프로필 분석
      const userProfile = await this.analyzeUserBehavior(
        request.userId,
        request.context.sessionHistory
      );

      // 2. 세그먼트별 전략 선택
      const strategy = this.getRecommendationStrategy(userProfile);

      // 3. 각 요소별 점수 계산
      const [userCFScores, itemCFScores, popularityScores] = await Promise.all([
        this.calculateUserCF(request.userId, request.textAnalysis),
        this.calculateItemCF(request.context.currentContent, request.textAnalysis),
        this.calculatePopularity(request.textAnalysis),
      ]);

      // 4. 하이브리드 점수 계산
      const hybridScores = this.combineScores(
        userCFScores,
        itemCFScores,
        popularityScores,
        strategy.weights
      );

      // 5. 다양성 적용
      const diverseItems = this.diversityBooster.applyDiversity(
        hybridScores,
        request.context.sessionHistory,
        strategy.weights.diversity
      );

      // 6. 최종 추천 아이템 생성
      const maxItems = request.constraints?.maxItems || strategy.k;
      const minScore = request.constraints?.minScore || 0.3;

      const recommendations = diverseItems
        .filter((item) => item.score >= minScore)
        .slice(0, maxItems)
        .map((item) => this.createRecommendationItem(item, request));

      // 7. 메타데이터 생성
      const metadata = {
        totalScore: this.calculateTotalScore(recommendations),
        diversityScore: this.calculateDiversityScore(recommendations),
        personalizedScore: this.calculatePersonalizationScore(userProfile, strategy),
        latency: Date.now() - startTime,
      };

      // 8. 디버그 정보 (개발 모드)
      const debug =
        process.env.NODE_ENV === 'development'
          ? {
              weights: strategy.weights,
              scores: {
                userCF: this.averageScore(userCFScores),
                itemCF: this.averageScore(itemCFScores),
                popularity: this.averageScore(popularityScores),
                diversity: metadata.diversityScore,
              },
            }
          : undefined;

      return {
        items: recommendations,
        metadata,
        debug,
      };
    } catch (error) {
      console.error('❌ Recommendation error:', error);
      
      // Fallback: 인기도 기반 추천
      return this.fallbackRecommendation(request);
    }
  }

  /**
   * 사용자 행동 기록
   */
  recordInteraction(
    userId: string,
    itemId: TransformationType,
    eventType: string,
    selected: boolean = false
  ): void {
    const interaction: UserInteraction = {
      userId,
      itemId,
      timestamp: new Date(),
      eventType,
      selected,
    };

    this.interactions.push(interaction);

    // 메모리 제한 (최근 10000개만 유지)
    if (this.interactions.length > 10000) {
      this.interactions = this.interactions.slice(-10000);
    }

    // 사용자 프로필 캐시 무효화
    this.userProfiles.delete(userId);
    this.cache.delete(`user_profile_${userId}`);

    // LocalStorage 저장 (비동기)
    this.saveToStorageAsync();
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.userProfiles.clear();
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      totalInteractions: this.interactions.length,
      uniqueUsers: new Set(this.interactions.map((i) => i.userId)).size,
      userProfiles: this.userProfiles.size,
      cacheSize: this.cache.size(),
    };
  }

  // ==================== Private Methods ====================

  /**
   * 사용자 행동 분석
   */
  private async analyzeUserBehavior(
    userId: string,
    sessionHistory: string[]
  ): Promise<UserProfile> {
    // 캐시 확인
    const cacheKey = `user_profile_${userId}`;
    const cached = this.cache.get<UserProfile>(cacheKey);
    if (cached) return cached;

    // 메모리 캐시 확인
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    // 새로 계산
    const userInteractions = this.interactions.filter((i) => i.userId === userId);

    const profile: UserProfile = {
      userId,
      segment: this.classifySegment(userInteractions),
      interactionCount: userInteractions.length,
      lastInteractionDays: this.calculateLastInteractionDays(userInteractions),
      diversityScore: this.calculateUserDiversity(userInteractions),
      tenureDays: this.calculateTenureDays(userInteractions),
    };

    // 캐시 저장
    this.userProfiles.set(userId, profile);
    this.cache.set(cacheKey, profile, CACHE_TTL.USER_PROFILE);

    return profile;
  }

  /**
   * 세그먼트 분류
   */
  private classifySegment(interactions: UserInteraction[]): UserSegment {
    const count = interactions.length;
    const lastDays = this.calculateLastInteractionDays(interactions);

    // 휴면 사용자 (30일 이상 미사용)
    if (lastDays > 30) return 'casual';

    // 상호작용 횟수 기반
    if (count <= 2) return 'new';
    if (count <= 9) return 'casual';
    if (count <= 29) return 'growth';
    return 'power';
  }

  /**
   * 마지막 상호작용 이후 일수
   */
  private calculateLastInteractionDays(interactions: UserInteraction[]): number {
    if (interactions.length === 0) return 999;

    const lastInteraction = Math.max(
      ...interactions.map((i) => i.timestamp.getTime())
    );
    const now = Date.now();
    return Math.floor((now - lastInteraction) / (1000 * 60 * 60 * 24));
  }

  /**
   * 사용자 다양성 점수
   */
  private calculateUserDiversity(interactions: UserInteraction[]): number {
    if (interactions.length === 0) return 0;

    const uniqueItems = new Set(interactions.map((i) => i.itemId));
    return uniqueItems.size / interactions.length;
  }

  /**
   * 활동 기간 (일)
   */
  private calculateTenureDays(interactions: UserInteraction[]): number {
    if (interactions.length === 0) return 0;

    const first = Math.min(...interactions.map((i) => i.timestamp.getTime()));
    const now = Date.now();
    return Math.floor((now - first) / (1000 * 60 * 60 * 24));
  }

  /**
   * 추천 전략 선택
   */
  private getRecommendationStrategy(profile: UserProfile): SegmentStrategy {
    return SEGMENT_STRATEGIES[profile.segment] || SEGMENT_STRATEGIES.new;
  }

  /**
   * User-CF 점수 계산
   */
  private async calculateUserCF(
    userId: string,
    textAnalysis: any
  ): Promise<Map<TransformationType, number>> {
    return this.cfEngine.calculateUserBasedCF(userId, this.interactions);
  }

  /**
   * Item-CF 점수 계산
   */
  private async calculateItemCF(
    currentContent: string,
    textAnalysis: any
  ): Promise<Map<TransformationType, number>> {
    return this.cfEngine.calculateItemBasedCF(currentContent, textAnalysis);
  }

  /**
   * 인기도 점수 계산
   */
  private async calculatePopularity(
    textAnalysis: any
  ): Promise<Map<TransformationType, number>> {
    return this.popularityTracker.getPopularityScores(
      this.interactions,
      textAnalysis
    );
  }

  /**
   * 하이브리드 점수 결합
   */
  private combineScores(
    userCF: Map<TransformationType, number>,
    itemCF: Map<TransformationType, number>,
    popularity: Map<TransformationType, number>,
    weights: RecommendationWeights
  ): Map<TransformationType, number> {
    const combined = new Map<TransformationType, number>();

    const allItems = new Set([...userCF.keys(), ...itemCF.keys(), ...popularity.keys()]);

    allItems.forEach((item) => {
      const score =
        (userCF.get(item) || 0) * weights.userCF +
        (itemCF.get(item) || 0) * weights.itemCF +
        (popularity.get(item) || 0) * weights.popularity;

      combined.set(item, score);
    });

    return combined;
  }

  /**
   * 추천 아이템 생성
   */
  private createRecommendationItem(
    item: { type: TransformationType; score: number },
    request: RecommendationRequest
  ): RecommendationItem {
    return {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: item.type,
      title: this.getItemTitle(item.type),
      preview: this.generatePreview(item.type, request.context.currentContent),
      score: item.score,
      confidence: this.calculateConfidence(item.score),
      reasoning: this.generateReasoning(item.type, request),
      metadata: {
        targetTone: request.textAnalysis.tone,
        genre: request.textAnalysis.genre,
        complexity: request.textAnalysis.complexity,
        estimatedQuality: this.estimateQuality(item.type, request.textAnalysis),
      },
    };
  }

  // ==================== Helper Methods ====================

  private getItemTitle(type: TransformationType): string {
    const titles: Record<TransformationType, string> = {
      paraphrase: '다시 쓰기',
      tone_adjust: '톤 조절',
      expand: '확장하기',
      compress: '요약하기',
    };
    return titles[type] || type;
  }

  private generatePreview(type: TransformationType, content: string): string {
    // 간단한 미리보기 생성 (실제로는 LLM 호출)
    return `${content.slice(0, 50)}...`;
  }

  private calculateConfidence(score: number): number {
    // 점수를 신뢰도로 변환 (0.0 ~ 1.0)
    return Math.min(Math.max(score, 0), 1);
  }

  private generateReasoning(
    type: TransformationType,
    request: RecommendationRequest
  ): string[] {
    const reasons: string[] = [];

    // 간단한 이유 생성 (실제로는 더 정교한 로직)
    reasons.push(`현재 톤(${request.textAnalysis.tone})에 적합`);
    reasons.push(`많은 사용자가 선호하는 기능`);

    return reasons;
  }

  private estimateQuality(type: TransformationType, textAnalysis: any): number {
    // 간단한 품질 추정
    return 0.8;
  }

  private calculateTotalScore(items: RecommendationItem[]): number {
    if (items.length === 0) return 0;
    return items.reduce((sum, item) => sum + item.score, 0) / items.length;
  }

  private calculateDiversityScore(items: RecommendationItem[]): number {
    const uniqueTypes = new Set(items.map((i) => i.type));
    return uniqueTypes.size / Math.max(items.length, 1);
  }

  private calculatePersonalizationScore(
    profile: UserProfile,
    strategy: SegmentStrategy
  ): number {
    // 개인화 점수: CF 가중치 기반
    return strategy.weights.userCF + strategy.weights.itemCF;
  }

  private averageScore(scores: Map<TransformationType, number>): number {
    if (scores.size === 0) return 0;
    const sum = Array.from(scores.values()).reduce((a, b) => a + b, 0);
    return sum / scores.size;
  }

  /**
   * Fallback 추천 (에러 시)
   */
  private fallbackRecommendation(
    request: RecommendationRequest
  ): RecommendationResponse {
    console.warn('⚠️  Fallback to popularity-based recommendation');

    const popularItems: TransformationType[] = ['paraphrase', 'tone_adjust', 'expand'];

    const items: RecommendationItem[] = popularItems.map((type, index) => ({
      id: `fallback_${index}`,
      type,
      title: this.getItemTitle(type),
      preview: '...',
      score: 1.0 - index * 0.2,
      confidence: 0.5,
      reasoning: ['인기 기능'],
      metadata: {
        targetTone: request.textAnalysis.tone,
        genre: request.textAnalysis.genre,
        complexity: request.textAnalysis.complexity,
        estimatedQuality: 0.7,
      },
    }));

    return {
      items,
      metadata: {
        totalScore: 0.7,
        diversityScore: 1.0,
        personalizedScore: 0.0,
        latency: 0,
      },
    };
  }

  // ==================== Storage ====================

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY.INTERACTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.interactions = parsed.map((i: any) => ({
          ...i,
          timestamp: new Date(i.timestamp),
        }));
        console.log(`✅ Loaded ${this.interactions.length} interactions from storage`);
      }
    } catch (error) {
      console.warn('⚠️  Failed to load from storage:', error);
    }
  }

  private saveToStorageAsync(): void {
    setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY.INTERACTIONS,
          JSON.stringify(this.interactions)
        );
      } catch (error) {
        console.warn('⚠️  Failed to save to storage:', error);
      }
    }, 0);
  }
}

// ==================== Singleton ====================

export const hybridEngine = new HybridRecommendationEngine();