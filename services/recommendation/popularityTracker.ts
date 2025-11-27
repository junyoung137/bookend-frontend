/**
 * Popularity Tracker
 * 인기도 기반 추천 점수 계산
 * 
 * 전략:
 * - 글로벌 인기도 (전체 사용자)
 * - 세그먼트별 인기도
 * - 시간 가중치 (최근 7일 2배 가중)
 */

import { TransformationType } from '@/types/llm.types';
import { ToneType, GenreType, UserSegment } from '@/types/analysis.types';
import { CacheManager } from '@/lib/cache';

// ==================== Types ====================

interface UserInteraction {
  userId: string;
  itemId: TransformationType;
  timestamp: Date;
  eventType: string;
  selected: boolean;
}

interface PopularityStats {
  globalScores: Map<TransformationType, number>;
  segmentScores: Map<UserSegment, Map<TransformationType, number>>;
  toneScores: Map<ToneType, Map<TransformationType, number>>;
  genreScores: Map<GenreType, Map<TransformationType, number>>;
  lastUpdate: number;
}

// ==================== Constants ====================

const RECENT_DAYS = 7; // 최근 N일 데이터 가중
const RECENT_WEIGHT = 2.0; // 최근 데이터 가중치
const MIN_INTERACTIONS = 5; // 최소 상호작용 수

const CACHE_TTL = 30 * 60 * 1000; // 30분
const CACHE_KEY = 'popularity_stats';

// ==================== Main Class ====================

export class PopularityTracker {
  private cache: CacheManager;
  private stats: PopularityStats | null = null;

  constructor() {
    this.cache = new CacheManager();
  }

  // ==================== Public API ====================

  /**
   * 인기도 점수 계산
   */
  getPopularityScores(
    interactions: UserInteraction[],
    textAnalysis?: {
      tone: ToneType;
      genre: GenreType;
    }
  ): Map<TransformationType, number> {
    // 캐시 확인
    if (!this.stats || this.isCacheExpired()) {
      this.updateStats(interactions);
    }

    if (!this.stats) {
      return this.getDefaultScores();
    }

    // 글로벌 인기도
    const globalScores = this.stats.globalScores;

    // 컨텍스트 기반 조정
    if (textAnalysis) {
      const toneScores = this.stats.toneScores.get(textAnalysis.tone);
      const genreScores = this.stats.genreScores.get(textAnalysis.genre);

      if (toneScores && genreScores) {
        return this.combineScores(globalScores, toneScores, genreScores);
      }
    }

    return globalScores;
  }

  /**
   * 세그먼트별 인기도
   */
  getSegmentPopularity(
    segment: UserSegment,
    interactions: UserInteraction[]
  ): Map<TransformationType, number> {
    if (!this.stats || this.isCacheExpired()) {
      this.updateStats(interactions);
    }

    return this.stats?.segmentScores.get(segment) || this.getDefaultScores();
  }

  /**
   * 통계 갱신
   */
  updateStats(interactions: UserInteraction[]): void {
    try {
      const now = Date.now();
      const recentCutoff = now - RECENT_DAYS * 24 * 60 * 60 * 1000;

      // 1. 글로벌 인기도
      const globalScores = this.calculateGlobalPopularity(
        interactions,
        recentCutoff
      );

      // 2. 세그먼트별 인기도 (추후 구현)
      const segmentScores = new Map<UserSegment, Map<TransformationType, number>>();

      // 3. 톤별 인기도 (추후 구현)
      const toneScores = new Map<ToneType, Map<TransformationType, number>>();

      // 4. 장르별 인기도 (추후 구현)
      const genreScores = new Map<GenreType, Map<TransformationType, number>>();

      this.stats = {
        globalScores,
        segmentScores,
        toneScores,
        genreScores,
        lastUpdate: now,
      };

      // 캐시 저장
      this.cache.set(CACHE_KEY, this.stats, CACHE_TTL);

      console.log('✅ Popularity stats updated:', {
        items: globalScores.size,
        topItem: this.getTopItem(globalScores),
      });
    } catch (error) {
      console.error('❌ Popularity update error:', error);
    }
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear();
    this.stats = null;
  }

  /**
   * 통계 조회
   */
  getStats() {
    if (!this.stats) return null;

    const topItems = Array.from(this.stats.globalScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([item, score]) => ({ item, score }));

    return {
      lastUpdate: this.stats.lastUpdate,
      topItems,
      totalItems: this.stats.globalScores.size,
    };
  }

  // ==================== Private Methods ====================

  /**
   * 글로벌 인기도 계산
   */
  private calculateGlobalPopularity(
    interactions: UserInteraction[],
    recentCutoff: number
  ): Map<TransformationType, number> {
    const counts = new Map<TransformationType, number>();
    const weights = new Map<TransformationType, number>();

    // 1. 카운트 및 가중치 계산
    interactions.forEach(interaction => {
      const item = interaction.itemId;
      const isRecent = interaction.timestamp.getTime() > recentCutoff;
      const isSelected = interaction.selected;

      // 기본 카운트
      counts.set(item, (counts.get(item) || 0) + 1);

      // 가중치 계산
      let weight = 1.0;
      if (isRecent) weight *= RECENT_WEIGHT;
      if (isSelected) weight *= 1.5;

      weights.set(item, (weights.get(item) || 0) + weight);
    });

    // 2. 최소 상호작용 필터링
    const validItems = Array.from(counts.entries())
      .filter(([_, count]) => count >= MIN_INTERACTIONS)
      .map(([item]) => item);

    if (validItems.length === 0) {
      return this.getDefaultScores();
    }

    // 3. 정규화
    const maxWeight = Math.max(...Array.from(weights.values()));
    const normalized = new Map<TransformationType, number>();

    validItems.forEach(item => {
      const weight = weights.get(item) || 0;
      normalized.set(item, weight / maxWeight);
    });

    return normalized;
  }

  /**
   * 점수 결합 (글로벌 + 톤 + 장르)
   */
  private combineScores(
    global: Map<TransformationType, number>,
    tone: Map<TransformationType, number>,
    genre: Map<TransformationType, number>
  ): Map<TransformationType, number> {
    const combined = new Map<TransformationType, number>();

    const allItems = new Set([...global.keys(), ...tone.keys(), ...genre.keys()]);

    allItems.forEach(item => {
      const score =
        (global.get(item) || 0) * 0.5 +
        (tone.get(item) || 0) * 0.25 +
        (genre.get(item) || 0) * 0.25;

      combined.set(item, score);
    });

    return combined;
  }

  /**
   * 기본 점수 (fallback)
   */
  private getDefaultScores(): Map<TransformationType, number> {
    // 실제 데이터 기반 기본값
    return new Map([
      ['paraphrase', 0.56], // run_paraphrasing: 55%
      ['tone_adjust', 0.17],
      ['expand', 0.14],
      ['compress', 0.13],
    ]);
  }

  /**
   * 캐시 만료 확인
   */
  private isCacheExpired(): boolean {
    if (!this.stats) return true;
    return Date.now() - this.stats.lastUpdate > CACHE_TTL;
  }

  /**
   * 최상위 아이템
   */
  private getTopItem(
    scores: Map<TransformationType, number>
  ): { item: TransformationType; score: number } | null {
    if (scores.size === 0) return null;

    const entries = Array.from(scores.entries());
    entries.sort((a, b) => b[1] - a[1]);

    return {
      item: entries[0][0],
      score: entries[0][1],
    };
  }
}