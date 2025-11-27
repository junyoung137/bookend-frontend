/**
 * Collaborative Filtering Engine
 * User-based CF + Item-based CF 구현
 * 
 * 알고리즘:
 * - Cosine Similarity (Python 모델과 동일)
 * - Temporal Weighting (최근 30일 가중치)
 * - Min Support: 최소 3회 상호작용
 */

import { TransformationType } from '@/types/llm.types';
import { ToneType, GenreType, ComplexityLevel } from '@/types/analysis.types';
import { CacheManager } from '@/lib/cache';

// ==================== Types ====================

interface UserInteraction {
  userId: string;
  itemId: TransformationType;
  timestamp: Date;
  eventType: string;
  selected: boolean;
}

interface SimilarityMatrix {
  [key: string]: Map<string, number>;
}

interface UserItemMatrix {
  users: string[];
  items: TransformationType[];
  matrix: number[][]; // [user_idx][item_idx]
}

// ==================== Constants ====================

const MIN_SUPPORT = 3; // 최소 상호작용 횟수
const TEMPORAL_DECAY_DAYS = 30; // 시간 가중치 감쇠 기간
const SIMILARITY_THRESHOLD = 0.1; // 최소 유사도
const MAX_NEIGHBORS = 50; // 최대 이웃 수

const CACHE_TTL = 10 * 60 * 1000; // 10분

// ==================== Main Class ====================

export class CollaborativeFilter {
  private cache: CacheManager;
  
  // 캐시된 행렬들
  private userItemMatrix: UserItemMatrix | null = null;
  private userSimilarity: SimilarityMatrix = {};
  private itemSimilarity: SimilarityMatrix = {};
  
  private lastMatrixUpdate: number = 0;
  private readonly MATRIX_UPDATE_INTERVAL = 5 * 60 * 1000; // 5분마다 갱신

  constructor() {
    this.cache = new CacheManager();
  }

  // ==================== Public API ====================

  /**
   * User-based Collaborative Filtering
   * 유사한 사용자들이 선호한 아이템 추천
   */
  async calculateUserBasedCF(
    userId: string,
    interactions: UserInteraction[]
  ): Promise<Map<TransformationType, number>> {
    const cacheKey = `user_cf_${userId}`;
    const cached = this.cache.get<Map<TransformationType, number>>(cacheKey);
    if (cached) return cached;

    try {
      // 1. User-Item 행렬 구축
      const matrix = this.buildUserItemMatrix(interactions);
      
      if (!matrix.users.includes(userId)) {
        // 신규 사용자: 빈 결과 반환
        return new Map();
      }

      // 2. User 유사도 계산
      const userIdx = matrix.users.indexOf(userId);
      const similarities = this.calculateUserSimilarities(matrix, userIdx);

      // 3. 이웃 사용자 선택 (상위 K명)
      const neighbors = this.selectTopNeighbors(similarities, MAX_NEIGHBORS);

      // 4. 예측 점수 계산
      const predictions = this.predictFromNeighbors(
        matrix,
        userIdx,
        neighbors
      );

      // 5. 정규화
      const normalized = this.normalizeScores(predictions);

      // 캐시 저장
      this.cache.set(cacheKey, normalized, CACHE_TTL);

      return normalized;
    } catch (error) {
      console.error('❌ User-CF error:', error);
      return new Map();
    }
  }

  /**
   * Item-based Collaborative Filtering
   * 현재 컨텍스트와 유사한 아이템 추천
   */
  async calculateItemBasedCF(
    currentContent: string,
    textAnalysis: {
      tone: ToneType;
      genre: GenreType;
      complexity: ComplexityLevel;
    }
  ): Promise<Map<TransformationType, number>> {
    const cacheKey = `item_cf_${textAnalysis.tone}_${textAnalysis.genre}`;
    const cached = this.cache.get<Map<TransformationType, number>>(cacheKey);
    if (cached) return cached;

    try {
      // 1. 현재 컨텍스트에 맞는 아이템 점수 계산
      const scores = new Map<TransformationType, number>();

      // 2. 장르별 적합도
      const genreScores = this.calculateGenreScores(textAnalysis.genre);
      
      // 3. 톤별 적합도
      const toneScores = this.calculateToneScores(textAnalysis.tone);
      
      // 4. 복잡도별 적합도
      const complexityScores = this.calculateComplexityScores(textAnalysis.complexity);

      // 5. 결합 (가중 평균)
      const allItems: TransformationType[] = ['paraphrase', 'tone_adjust', 'expand', 'compress'];
      
      allItems.forEach(item => {
        const score = 
          (genreScores.get(item) || 0) * 0.4 +
          (toneScores.get(item) || 0) * 0.3 +
          (complexityScores.get(item) || 0) * 0.3;
        
        scores.set(item, score);
      });

      // 6. 정규화
      const normalized = this.normalizeScores(scores);

      // 캐시 저장
      this.cache.set(cacheKey, normalized, CACHE_TTL);

      return normalized;
    } catch (error) {
      console.error('❌ Item-CF error:', error);
      return new Map();
    }
  }

  /**
   * 행렬 갱신 (주기적 호출)
   */
  updateMatrices(interactions: UserInteraction[]): void {
    const now = Date.now();
    
    if (now - this.lastMatrixUpdate < this.MATRIX_UPDATE_INTERVAL) {
      return; // 아직 갱신 시간 아님
    }

    try {
      this.userItemMatrix = this.buildUserItemMatrix(interactions);
      this.lastMatrixUpdate = now;
      
      console.log('✅ Matrices updated:', {
        users: this.userItemMatrix.users.length,
        items: this.userItemMatrix.items.length,
      });
    } catch (error) {
      console.error('❌ Matrix update error:', error);
    }
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear();
    this.userItemMatrix = null;
    this.userSimilarity = {};
    this.itemSimilarity = {};
    this.lastMatrixUpdate = 0;
  }

  // ==================== Private Methods ====================

  /**
   * User-Item 행렬 구축
   */
  private buildUserItemMatrix(interactions: UserInteraction[]): UserItemMatrix {
    // 1. 필터링: 최소 support 충족하는 사용자/아이템만
    const userCounts = new Map<string, number>();
    const itemCounts = new Map<TransformationType, number>();

    interactions.forEach(interaction => {
      userCounts.set(interaction.userId, (userCounts.get(interaction.userId) || 0) + 1);
      itemCounts.set(interaction.itemId, (itemCounts.get(interaction.itemId) || 0) + 1);
    });

    const validUsers = Array.from(userCounts.entries())
      .filter(([_, count]) => count >= MIN_SUPPORT)
      .map(([userId]) => userId);

    const validItems = Array.from(itemCounts.entries())
      .filter(([_, count]) => count >= MIN_SUPPORT)
      .map(([itemId]) => itemId);

    if (validUsers.length === 0 || validItems.length === 0) {
      throw new Error('Not enough data for CF');
    }

    // 2. 행렬 초기화
    const matrix: number[][] = Array(validUsers.length)
      .fill(0)
      .map(() => Array(validItems.length).fill(0));

    // 3. 행렬 채우기 (시간 가중치 적용)
    const now = Date.now();

    interactions.forEach(interaction => {
      const userIdx = validUsers.indexOf(interaction.userId);
      const itemIdx = validItems.indexOf(interaction.itemId);

      if (userIdx === -1 || itemIdx === -1) return;

      // 시간 가중치 계산
      const daysSince = (now - interaction.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      const timeWeight = Math.exp(-daysSince / TEMPORAL_DECAY_DAYS);

      // 선택 여부 가중치
      const selectionWeight = interaction.selected ? 2.0 : 1.0;

      // 최종 가중치
      const weight = timeWeight * selectionWeight;

      matrix[userIdx][itemIdx] += weight;
    });

    return {
      users: validUsers,
      items: validItems,
      matrix,
    };
  }

  /**
   * User 간 코사인 유사도 계산
   */
  private calculateUserSimilarities(
    matrix: UserItemMatrix,
    targetUserIdx: number
  ): Map<number, number> {
    const similarities = new Map<number, number>();
    const targetVector = matrix.matrix[targetUserIdx];

    for (let i = 0; i < matrix.users.length; i++) {
      if (i === targetUserIdx) continue;

      const similarity = this.cosineSimilarity(targetVector, matrix.matrix[i]);

      if (similarity > SIMILARITY_THRESHOLD) {
        similarities.set(i, similarity);
      }
    }

    return similarities;
  }

  /**
   * 코사인 유사도
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 상위 K 이웃 선택
   */
  private selectTopNeighbors(
    similarities: Map<number, number>,
    k: number
  ): Array<{ userIdx: number; similarity: number }> {
    return Array.from(similarities.entries())
      .map(([userIdx, similarity]) => ({ userIdx, similarity }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }

  /**
   * 이웃 기반 예측
   */
  private predictFromNeighbors(
    matrix: UserItemMatrix,
    targetUserIdx: number,
    neighbors: Array<{ userIdx: number; similarity: number }>
  ): Map<TransformationType, number> {
    const predictions = new Map<TransformationType, number>();
    const targetVector = matrix.matrix[targetUserIdx];

    // 각 아이템에 대해 예측
    matrix.items.forEach((item, itemIdx) => {
      // 이미 상호작용한 아이템은 제외
      if (targetVector[itemIdx] > 0) return;

      let weightedSum = 0;
      let similaritySum = 0;

      neighbors.forEach(({ userIdx, similarity }) => {
        const rating = matrix.matrix[userIdx][itemIdx];
        if (rating > 0) {
          weightedSum += similarity * rating;
          similaritySum += similarity;
        }
      });

      if (similaritySum > 0) {
        predictions.set(item, weightedSum / similaritySum);
      }
    });

    return predictions;
  }

  /**
   * 장르별 적합도 점수
   */
  private calculateGenreScores(genre: GenreType): Map<TransformationType, number> {
    const scores = new Map<TransformationType, number>();

    // 장르별 변환 적합도 (경험적 룰)
    const genreRules: Record<GenreType, Record<TransformationType, number>> = {
      narrative: {
        paraphrase: 0.9,
        tone_adjust: 0.8,
        expand: 1.0,
        compress: 0.5,
      },
      descriptive: {
        paraphrase: 0.8,
        tone_adjust: 0.7,
        expand: 1.0,
        compress: 0.4,
      },
      informative: {
        paraphrase: 1.0,
        tone_adjust: 0.9,
        expand: 0.7,
        compress: 0.8,
      },
      dialogue: {
        paraphrase: 0.7,
        tone_adjust: 1.0,
        expand: 0.6,
        compress: 0.5,
      },
    };

    const rules = genreRules[genre];
    Object.entries(rules).forEach(([type, score]) => {
      scores.set(type as TransformationType, score);
    });

    return scores;
  }

  /**
   * 톤별 적합도 점수
   */
  private calculateToneScores(tone: ToneType): Map<TransformationType, number> {
    const scores = new Map<TransformationType, number>();

    // 톤별 변환 적합도
    const toneRules: Record<ToneType, Record<TransformationType, number>> = {
      normal: {
        paraphrase: 1.0,
        tone_adjust: 0.8,
        expand: 0.7,
        compress: 0.7,
      },
      formal: {
        paraphrase: 0.9,
        tone_adjust: 1.0,
        expand: 0.8,
        compress: 0.8,
      },
      terminal_word: {
        paraphrase: 0.8,
        tone_adjust: 0.9,
        expand: 0.6,
        compress: 1.0,
      },
      common: {
        paraphrase: 0.9,
        tone_adjust: 0.7,
        expand: 0.8,
        compress: 0.6,
      },
    };

    const rules = toneRules[tone];
    Object.entries(rules).forEach(([type, score]) => {
      scores.set(type as TransformationType, score);
    });

    return scores;
  }

  /**
   * 복잡도별 적합도 점수
   */
  private calculateComplexityScores(
    complexity: ComplexityLevel
  ): Map<TransformationType, number> {
    const scores = new Map<TransformationType, number>();

    const complexityRules: Record<ComplexityLevel, Record<TransformationType, number>> = {
      simple: {
        paraphrase: 0.8,
        tone_adjust: 0.9,
        expand: 1.0,
        compress: 0.5,
      },
      medium: {
        paraphrase: 1.0,
        tone_adjust: 1.0,
        expand: 0.8,
        compress: 0.8,
      },
      complex: {
        paraphrase: 1.0,
        tone_adjust: 0.8,
        expand: 0.6,
        compress: 1.0,
      },
    };

    const rules = complexityRules[complexity];
    Object.entries(rules).forEach(([type, score]) => {
      scores.set(type as TransformationType, score);
    });

    return scores;
  }

  /**
   * 점수 정규화 (0.0 ~ 1.0)
   */
  private normalizeScores(
    scores: Map<TransformationType, number>
  ): Map<TransformationType, number> {
    const values = Array.from(scores.values());
    
    if (values.length === 0) return scores;

    const max = Math.max(...values);
    const min = Math.min(...values);

    if (max === min) {
      // 모든 값이 같으면 균등 분포
      const normalized = new Map<TransformationType, number>();
      scores.forEach((_, key) => normalized.set(key, 0.5));
      return normalized;
    }

    const normalized = new Map<TransformationType, number>();
    scores.forEach((value, key) => {
      const normalizedValue = (value - min) / (max - min);
      normalized.set(key, normalizedValue);
    });

    return normalized;
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      matrixUsers: this.userItemMatrix?.users.length || 0,
      matrixItems: this.userItemMatrix?.items.length || 0,
      lastUpdate: this.lastMatrixUpdate,
      cacheSize: this.cache.size(),
    };
  }
}