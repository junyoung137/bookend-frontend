/**
 * Transformation Strategies
 * 변환 타입별 전략 정의
 */

import {
  TransformationType,
  TransformationStrategy,
  HyperParameters,
} from '@/types/llm.types';
import {
  ToneType,
  GenreType,
  ComplexityLevel,
  WritingStyle,
} from '@/types/analysis.types';
import { TRANSFORMATION_STRATEGIES, HYPER_PARAMS } from '../llm/config';

export interface StrategyContext {
  transformationType: TransformationType;
  sourceTone: ToneType;
  targetTone?: ToneType;
  genre: GenreType;
  complexity: ComplexityLevel;
  style?: WritingStyle;
  userSegment?: string;
}

export class StrategySelector {
  /**
   * 컨텍스트에 맞는 최적 전략 선택
   */
  static select(context: StrategyContext): TransformationStrategy {
    const baseStrategy = TRANSFORMATION_STRATEGIES[context.transformationType];

    // 컨텍스트 기반 하이퍼파라미터 조정
    const adjustedHyperParams = this.adjustHyperParameters(
      baseStrategy.hyperParams,
      context
    );

    return {
      ...baseStrategy,
      hyperParams: adjustedHyperParams,
    };
  }

  /**
   * 컨텍스트 기반 하이퍼파라미터 미세 조정
   */
  private static adjustHyperParameters(
    base: HyperParameters,
    context: StrategyContext
  ): HyperParameters {
    const adjusted = { ...base };

    // 1. 복잡도에 따른 조정
    if (context.complexity === 'complex') {
      adjusted.temperature = Math.max(0.3, adjusted.temperature - 0.1);
      adjusted.max_tokens = Math.min(adjusted.max_tokens + 100, 600);
    } else if (context.complexity === 'simple') {
      adjusted.temperature = Math.min(0.9, adjusted.temperature + 0.1);
      adjusted.max_tokens = Math.max(adjusted.max_tokens - 50, 150);
    }

    // 2. 장르에 따른 조정
    if (context.genre === 'narrative' || context.genre === 'descriptive') {
      adjusted.temperature = Math.min(0.9, adjusted.temperature + 0.1);
      adjusted.presence_penalty = (adjusted.presence_penalty || 0) + 0.1;
    } else if (context.genre === 'informative') {
      adjusted.temperature = Math.max(0.4, adjusted.temperature - 0.1);
    }

    // ✅ 3. 톤 조정 시 추가 설정 (안정성 개선: 런타임 문자열 비교 사용)
    // NOTE:
    // - ToneType이 'type'만 있는 경우(TS 유니온)나 enum(값이 문자열)인 경우 모두 동작하도록 문자열로 비교합니다.
    const tgt = context.targetTone as unknown as string | undefined;
    if (context.transformationType === 'tone_adjust' && tgt) {
      if (tgt === 'formal') {
        adjusted.temperature = 0.5; // 정확성 우선
      } else if (tgt === 'casual' || tgt === 'common') {
        // 프로젝트마다 'casual' 혹은 'common'중 하나를 쓸 수 있으니 둘 다 지원
        adjusted.temperature = 0.7; // 자연스러움 우선
      } else if (tgt === 'normal') {
        adjusted.temperature = 0.6;
      } else if (tgt === 'terminal_word') {
        adjusted.temperature = 0.4;
      }
    }

    return adjusted;
  }

  /**
   * 품질 목표 점수 조정
   */
  static adjustQualityTarget(
    baseTarget: number,
    context: StrategyContext
  ): number {
    let target = baseTarget;

    // 복잡한 텍스트는 목표 낮춤
    if (context.complexity === 'complex') {
      target -= 0.05;
    }

    // 파워 유저는 목표 높임
    if (context.userSegment === 'power') {
      target += 0.05;
    }

    return Math.max(0.6, Math.min(0.95, target));
  }
}

export class StrategyOptimizer {
  private performanceHistory: Map<string, number[]> = new Map();

  /**
   * 전략 성능 추적
   */
  recordPerformance(
    strategyKey: string,
    qualityScore: number
  ): void {
    const history = this.performanceHistory.get(strategyKey) || [];
    history.push(qualityScore);

    // 최근 10개만 유지
    if (history.length > 10) {
      history.shift();
    }

    this.performanceHistory.set(strategyKey, history);
  }

  /**
   * 전략 성능 평균
   */
  getAveragePerformance(strategyKey: string): number {
    const history = this.performanceHistory.get(strategyKey);
    if (!history || history.length === 0) return 0.75; // 기본값

    return history.reduce((sum, score) => sum + score, 0) / history.length;
  }

  /**
   * 최적 전략 추천
   */
  recommendStrategy(
    candidates: TransformationStrategy[],
    context: StrategyContext
  ): TransformationStrategy {
    if (candidates.length === 0) {
      return StrategySelector.select(context);
    }

    // 성능 기반 정렬
    const scored = candidates.map(strategy => {
      const key = `${strategy.type}-${context.genre}-${context.complexity}`;
      const avgScore = this.getAveragePerformance(key);
      return { strategy, score: avgScore };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].strategy;
  }

  /**
   * 통계 조회
   */
  getStats() {
    const stats: Record<string, any> = {};

    this.performanceHistory.forEach((history, key) => {
      const avg = history.reduce((sum, score) => sum + score, 0) / history.length;
      const min = Math.min(...history);
      const max = Math.max(...history);

      stats[key] = { avg, min, max, count: history.length };
    });

    return stats;
  }
}

export const strategyOptimizer = new StrategyOptimizer();