/**
 * Diversity Booster
 * 추천 결과 다양성 향상
 * 
 * 전략:
 * - Session History 기반 중복 제거
 * - 카테고리 균형 (타입별 최소 1개)
 * - MMR (Maximal Marginal Relevance) 알고리즘
 * - 컨텍스트 기반 필터링
 */

import { TransformationType } from '@/types/llm.types';

// ==================== Types ====================

interface DiversityItem {
  type: TransformationType;
  score: number;
  category?: string;
  metadata?: Record<string, any>;
}

interface DiversityConfig {
  lambda: number; // 0.0 ~ 1.0 (다양성 vs 정확성)
  minCategoryItems: number;
  maxSimilarItems: number;
}

const DEFAULT_CONFIG: DiversityConfig = {
  lambda: 0.7, // 70% 정확성, 30% 다양성
  minCategoryItems: 1,
  maxSimilarItems: 2,
};

// ==================== Main Class ====================

export class DiversityBooster {
  private config: DiversityConfig;

  constructor(config: Partial<DiversityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==================== Public API ====================

  /**
   * 다양성 적용 (메인 함수)
   */
  applyDiversity(
    scores: Map<TransformationType, number>,
    sessionHistory: string[],
    diversityWeight: number = 0.1
  ): DiversityItem[] {
    try {
      // 1. Map → Array 변환
      const items: DiversityItem[] = Array.from(scores.entries()).map(
        ([type, score]) => ({
          type,
          score,
          category: this.getCategory(type),
        })
      );

      // 2. 세션 히스토리 기반 필터링
      const filtered = this.filterByHistory(items, sessionHistory);

      // 3. MMR 알고리즘 적용
      const diversified = this.applyMMR(filtered, diversityWeight);

      // 4. 카테고리 균형 보정
      const balanced = this.balanceCategories(diversified);

      // 5. 정렬 (점수 기준)
      return balanced.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('❌ Diversity boost error:', error);
      
      // Fallback: 원본 점수 그대로 반환
      return Array.from(scores.entries()).map(([type, score]) => ({
        type,
        score,
      }));
    }
  }

  /**
   * 다양성 점수 계산
   */
  calculateDiversityScore(items: DiversityItem[]): number {
    if (items.length === 0) return 0;

    const uniqueTypes = new Set(items.map(item => item.type));
    const uniqueCategories = new Set(
      items.map(item => item.category).filter(Boolean)
    );

    const typeRatio = uniqueTypes.size / items.length;
    const categoryRatio = uniqueCategories.size / Math.max(items.length, 1);

    return (typeRatio + categoryRatio) / 2;
  }

  // ==================== Private Methods ====================

  /**
   * 카테고리 분류
   */
  private getCategory(type: TransformationType): string {
    const categoryMap: Record<TransformationType, string> = {
      paraphrase: 'refinement',
      tone_adjust: 'style',
      expand: 'extension',
      compress: 'compression',
    };

    return categoryMap[type] || 'unknown';
  }

  /**
   * 세션 히스토리 기반 필터링
   */
  private filterByHistory(
    items: DiversityItem[],
    sessionHistory: string[]
  ): DiversityItem[] {
    if (sessionHistory.length === 0) return items;

    // 최근 N개 히스토리에서 타입 추출
    const recentTypes = sessionHistory
      .slice(-5) // 최근 5개
      .map(this.extractTypeFromHistory)
      .filter(Boolean) as TransformationType[];

    const typeCounts = new Map<TransformationType, number>();
    recentTypes.forEach(type => {
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    // 중복 빈도에 따라 페널티 적용
    return items.map(item => {
      const count = typeCounts.get(item.type) || 0;
      const penalty = Math.max(0.5, 1.0 - count * 0.2); // 최대 50% 페널티

      return {
        ...item,
        score: item.score * penalty,
      };
    });
  }

  /**
   * 히스토리 문자열에서 타입 추출
   */
  private extractTypeFromHistory(history: string): TransformationType | null {
    const types: TransformationType[] = [
      'paraphrase',
      'tone_adjust',
      'expand',
      'compress',
    ];

    for (const type of types) {
      if (history.includes(type)) return type;
    }

    return null;
  }

  /**
   * MMR (Maximal Marginal Relevance) 알고리즘
   * 정확성과 다양성의 균형
   */
  private applyMMR(
    items: DiversityItem[],
    diversityWeight: number
  ): DiversityItem[] {
    if (items.length <= 1) return items;

    const lambda = 1.0 - diversityWeight; // relevance vs diversity
    const selected: DiversityItem[] = [];
    const remaining = [...items];

    // 1. 가장 높은 점수의 아이템 선택
    remaining.sort((a, b) => b.score - a.score);
    selected.push(remaining.shift()!);

    // 2. 반복적으로 MMR 점수 계산 및 선택
    while (remaining.length > 0) {
      let bestItem: DiversityItem | null = null;
      let bestMMR = -Infinity;

      for (const item of remaining) {
        // Relevance: 원래 점수
        const relevance = item.score;

        // Diversity: 선택된 아이템들과의 비유사도
        const maxSimilarity = Math.max(
          ...selected.map(s => this.calculateSimilarity(item, s))
        );
        const diversity = 1.0 - maxSimilarity;

        // MMR 점수 계산
        const mmr = lambda * relevance + (1 - lambda) * diversity;

        if (mmr > bestMMR) {
          bestMMR = mmr;
          bestItem = item;
        }
      }

      if (bestItem) {
        selected.push(bestItem);
        const idx = remaining.indexOf(bestItem);
        remaining.splice(idx, 1);
      } else {
        break;
      }
    }

    return selected;
  }

  /**
   * 두 아이템 간 유사도 계산
   */
  private calculateSimilarity(
    item1: DiversityItem,
    item2: DiversityItem
  ): number {
    // 같은 타입이면 유사도 높음
    if (item1.type === item2.type) return 1.0;

    // 같은 카테고리면 중간 유사도
    if (item1.category === item2.category) return 0.5;

    // 다른 카테고리면 유사도 낮음
    return 0.0;
  }

  /**
   * 카테고리 균형 보정
   */
  private balanceCategories(items: DiversityItem[]): DiversityItem[] {
    const categoryCounts = new Map<string, number>();

    items.forEach(item => {
      if (item.category) {
        categoryCounts.set(
          item.category,
          (categoryCounts.get(item.category) || 0) + 1
        );
      }
    });

    // 각 카테고리에서 최소 1개 보장
    const allCategories = Array.from(
      new Set(items.map(item => item.category).filter(Boolean))
    );

    const balanced: DiversityItem[] = [];
    const used = new Set<string>();

    // 1단계: 각 카테고리에서 최고 점수 1개씩 선택
    allCategories.forEach(category => {
      const categoryItems = items.filter(
        item => item.category === category && !used.has(item.type)
      );

      if (categoryItems.length > 0) {
        categoryItems.sort((a, b) => b.score - a.score);
        balanced.push(categoryItems[0]);
        used.add(categoryItems[0].type);
      }
    });

    // 2단계: 나머지 아이템 추가 (점수 순)
    items
      .filter(item => !used.has(item.type))
      .sort((a, b) => b.score - a.score)
      .forEach(item => balanced.push(item));

    return balanced;
  }

  /**
   * 통계 조회
   */
  getStats(items: DiversityItem[]) {
    const typeCounts = new Map<TransformationType, number>();
    const categoryCounts = new Map<string, number>();

    items.forEach(item => {
      typeCounts.set(item.type, (typeCounts.get(item.type) || 0) + 1);
      if (item.category) {
        categoryCounts.set(
          item.category,
          (categoryCounts.get(item.category) || 0) + 1
        );
      }
    });

    return {
      totalItems: items.length,
      uniqueTypes: typeCounts.size,
      uniqueCategories: categoryCounts.size,
      diversityScore: this.calculateDiversityScore(items),
      typeCounts: Object.fromEntries(typeCounts),
      categoryCounts: Object.fromEntries(categoryCounts),
    };
  }
}

// 싱글톤 인스턴스
export const diversityBooster = new DiversityBooster();