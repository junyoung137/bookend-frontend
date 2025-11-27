/**
 * 텍스트 분석 및 사용자 세그먼트 타입
 * Data-driven insights from user behavior
 */

// ============================================================
// Tone Analysis (데이터 기반)
// ============================================================

export type ToneType = 'normal' | 'formal' | 'terminal_word' | 'common';

export interface ToneDistribution {
  normal: number;        // 69.3%
  formal: number;        // 19.6%
  terminal_word: number; // 6.5%
  common: number;        // 4.7%
}

export interface ToneAnalysis {
  detectedTone: ToneType;
  confidence: number;           // 0.0 ~ 1.0
  distribution: ToneDistribution;
  markers: {
    formal: string[];    // e.g., ["입니다", "습니다"]
    casual: string[];    // e.g., ["이에요", "어요"]
  };
}

// ============================================================
// Text Complexity
// ============================================================

export type ComplexityLevel = 'simple' | 'medium' | 'complex';

export interface ComplexityMetrics {
  level: ComplexityLevel;
  avgSentenceLength: number;
  sentenceCount: number;
  avgWordLength: number;
  uniqueWordRatio: number;
}

// ============================================================
// Genre Classification
// ============================================================

export type GenreType = 'narrative' | 'descriptive' | 'informative' | 'dialogue';

export interface GenreFeatures {
  genre: GenreType;
  confidence: number;
  features: {
    hasDialogue: boolean;
    hasEmotionalWords: boolean;
    hasSensoryWords: boolean;
    hasFactualContent: boolean;
  };
}

// ============================================================
// Text Quality (🆕 추가)
// ============================================================

export interface TextQuality {
  isValid: boolean;
  isValidText: boolean; // 🆕 완성된 한글 단어 존재 여부
  qualityScore: number;  // 0.0 ~ 1.0
  issues: string[];
}

// ============================================================
// Text Analysis (종합)
// ============================================================

export interface TextAnalysis {
  tone: ToneAnalysis;
  complexity: ComplexityMetrics;
  genre: GenreFeatures;
  stats: {
    charCount: number;
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
  };
  quality: TextQuality;  // 🆕 추가
}

// ============================================================
// User Segmentation (행동 기반)
// ============================================================

export type UserSegment = 'power' | 'growth' | 'new' | 'casual';

export interface UserBehavior {
  segment: UserSegment;
  eventCount: number;
  avgEventsPerSession: number;
  toneDiversity: number;        // 1.8 평균
  preferredTone: ToneType;
  repeatPatternScore: number;   // Echo Feedback
  selectionRate: number;        // 45.1% 평균
}

export interface UserProfile {
  userId: string;
  segment: UserSegment;
  behavior: UserBehavior;
  preferences: {
    tonePreference: ToneType[];
    genrePreference: GenreType[];
    complexityPreference: ComplexityLevel;
  };
  history: {
    totalEvents: number;
    lastActive: Date;
    createdAt: Date;
  };
}

// ============================================================
// Writing Style (문체 세그먼트)
// ============================================================

export type WritingStyle = 
  | 'literary'        // 문학적
  | 'journalistic'    // 저널리즘
  | 'academic'        // 학술적
  | 'conversational'  // 대화체
  | 'business'        // 비즈니스
  | 'creative';       // 창작

export interface StyleFeatures {
  style: WritingStyle;
  characteristics: {
    formalityLevel: number;      // 0.0 ~ 1.0
    emotionalIntensity: number;  // 0.0 ~ 1.0
    technicalDepth: number;      // 0.0 ~ 1.0
    creativity: number;          // 0.0 ~ 1.0
  };
}

// ============================================================
// Context Echo (맥락 기반 추천)
// ============================================================

export interface ContextEcho {
  currentTone: ToneType;
  suggestedTones: ToneType[];   // 다양성 유도
  rationale: string;
}

// ============================================================
// Temporal Flow (시간대별 패턴)
// ============================================================

export type TimeSlot = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface TemporalPattern {
  timeSlot: TimeSlot;
  peakHours: number[];          // e.g., [5, 7, 8]
  recommendedMode: 'focus' | 'creative' | 'casual';
  userActivityLevel: 'high' | 'medium' | 'low';
}