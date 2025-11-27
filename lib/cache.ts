/**
 * Cache Manager
 * 메모리 기반 캐싱 시스템 with TTL
 * 
 * 특징:
 * - TTL(Time To Live) 지원
 * - 자동 만료 처리
 * - 최대 크기 제한
 * - 타입 안전성
 */

interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5분
const DEFAULT_MAX_SIZE = 1000;

export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private hitCount: number;
  private missCount: number;

  constructor(maxSize: number = DEFAULT_MAX_SIZE) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * 캐시에서 값 가져오기
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // TTL 확인
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return entry.value as T;
  }

  /**
   * 캐시에 값 저장
   */
  set<T>(key: string, value: T, ttl: number = DEFAULT_TTL): void {
    try {
      // 최대 크기 확인
      if (this.cache.size >= this.maxSize) {
        this.evictOldest();
      }

      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl,
      };

      this.cache.set(key, entry);
    } catch (error) {
      console.error('❌ Cache set error:', error);
      // 캐시 실패는 치명적이지 않으므로 에러를 삼킨다
    }
  }

  /**
   * 캐시에서 값 삭제
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 캐시 존재 여부 확인
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) return false;

    // TTL 확인
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 캐시 전체 초기화
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * 캐시 크기 반환
   */
  size(): number {
    this.cleanupExpired();
    return this.cache.size;
  }

  /**
   * 통계 조회
   */
  getStats(): CacheStats {
    this.cleanupExpired();

    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
    };
  }

  /**
   * 만료된 항목 정리
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  /**
   * 가장 오래된 항목 제거 (LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️  Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  /**
   * 캐시 키 패턴 매칭으로 삭제
   */
  deletePattern(pattern: RegExp): number {
    let deletedCount = 0;

    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`🗑️  Deleted ${deletedCount} cache entries matching pattern`);
    }

    return deletedCount;
  }

  /**
   * 캐시 키 목록 반환
   */
  keys(): string[] {
    this.cleanupExpired();
    return Array.from(this.cache.keys());
  }

  /**
   * 캐시 값 목록 반환
   */
  values<T>(): T[] {
    this.cleanupExpired();
    return Array.from(this.cache.values()).map(entry => entry.value as T);
  }
}

// 싱글톤 인스턴스
export const cacheManager = new CacheManager();