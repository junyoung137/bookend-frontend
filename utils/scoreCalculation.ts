/**
 * 품질 점수 계산 로직
 */

import { QualityMetrics } from './textAnalysis';

export interface QualityScore {
  label: string;
  score: number;
  icon: string;
  color: string;
  description: string;
  type: 'refine' | 'tone' | 'expand';
}

/**
 * 다듬기 점수 계산
 */
export function calculateRefinementScore(metrics: QualityMetrics): number {
  let score = 0;

  if (metrics.charCount < 30) return Math.min(20, metrics.charCount);
  if (metrics.charCount < 50) return Math.min(35, score + 15);

  if (metrics.sentenceCount >= 5) score += 20;
  else if (metrics.sentenceCount >= 3) score += 15;
  else if (metrics.sentenceCount === 2) score += 10;
  else score += 5;

  if (metrics.avgSentenceLength >= 50 && metrics.avgSentenceLength <= 120) score += 20;
  else if (metrics.avgSentenceLength >= 30 && metrics.avgSentenceLength < 50) score += 15;
  else if (metrics.avgSentenceLength >= 20 && metrics.avgSentenceLength < 30) score += 10;
  else if (metrics.avgSentenceLength < 20) score += 5;
  else score += 10;

  if (metrics.uniqueWordRatio >= 0.8) score += 20;
  else if (metrics.uniqueWordRatio >= 0.7) score += 15;
  else if (metrics.uniqueWordRatio >= 0.6) score += 10;
  else if (metrics.uniqueWordRatio >= 0.5) score += 8;
  else score += 5;

  if (metrics.hasVariedPunctuation) score += 20;
  else if (metrics.hasPunctuation) score += 12;
  else score += 5;

  if (metrics.charCount >= 300) score += 20;
  else if (metrics.charCount >= 200) score += 16;
  else if (metrics.charCount >= 150) score += 12;
  else if (metrics.charCount >= 100) score += 10;
  else if (metrics.charCount >= 50) score += 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 톤 점수 계산
 */
export function calculateToneScore(metrics: QualityMetrics, text: string): number {
  if (metrics.charCount < 20 || metrics.sentenceCount === 0) return 10;
  if (metrics.wordCount < 3) return 12;

  const hasCompleteWords = /[가-힣]{2,}/.test(text);
  const hasOnlyJamo = /^[ㄱ-ㅎㅏ-ㅣ\s]+$/.test(text);
  
  if (!hasCompleteWords || hasOnlyJamo) return 5;

  let score = 0;

  const formalMarkers = ['입니다', '습니다', '합니다', '왔습니다', '있습니다', '됩니다', '끝습니다', '드립니다'];
  const casualMarkers = ['해요', '이에요', '예요', '네요', '거든요', '~요', '어요', '죠', '아요'];
  
  const formalCount = formalMarkers.filter(m => text.includes(m)).length;
  const casualCount = casualMarkers.filter(m => text.includes(m)).length;
  const totalMarkers = formalCount + casualCount;
  
  if (totalMarkers === 0) {
    const informalPatterns = /[가-힣](어|아|지|네|다)[\s.!?]/g;
    const informalCount = (text.match(informalPatterns) || []).length;
    
    if (informalCount === 0) return 15;
    if (informalCount >= 3) return 30;
    return 20;
  }

  const mixRatio = totalMarkers > 0 ? Math.min(formalCount, casualCount) / totalMarkers : 0;

  if (formalCount > 0 && casualCount > 0) {
    if (mixRatio > 0.4) score = 20;
    else if (mixRatio > 0.3) score = 30;
    else if (mixRatio > 0.2) score = 40;
    else score = 50;
  } else {
    const dominantCount = Math.max(formalCount, casualCount);
    const toneDensity = dominantCount / Math.max(metrics.sentenceCount, 1);
    
    if (toneDensity >= 1.5) score = 80;
    else if (toneDensity >= 1.0) score = 70;
    else if (toneDensity >= 0.5) score = 55;
    else score = 40;

    if (dominantCount >= 5) score += 10;
  }

  if (metrics.sentenceCount >= 5) score += 8;
  else if (metrics.sentenceCount >= 3) score += 5;
  else if (metrics.sentenceCount >= 2) score += 3;

  if (metrics.uniqueWordRatio >= 0.8) score += 5;
  else if (metrics.uniqueWordRatio >= 0.7) score += 3;

  score += 30;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 확장 점수 계산
 */
export function calculateExpansionScore(metrics: QualityMetrics): number {
  let score = 0;

  if (metrics.charCount >= 300) score += 40;
  else if (metrics.charCount >= 200) score += 32;
  else if (metrics.charCount >= 150) score += 25;
  else if (metrics.charCount >= 100) score += 18;
  else if (metrics.charCount >= 50) score += 12;
  else if (metrics.charCount >= 30) score += 8;
  else score += 5;

  if (metrics.sentenceCount >= 8) score += 30;
  else if (metrics.sentenceCount >= 6) score += 25;
  else if (metrics.sentenceCount >= 4) score += 20;
  else if (metrics.sentenceCount === 3) score += 15;
  else if (metrics.sentenceCount === 2) score += 10;
  else score += 5;

  if (metrics.wordCount >= 80) score += 20;
  else if (metrics.wordCount >= 50) score += 15;
  else if (metrics.wordCount >= 30) score += 10;
  else if (metrics.wordCount >= 15) score += 7;
  else score += 3;

  if (metrics.uniqueWordRatio >= 0.7) score += 10;
  else if (metrics.uniqueWordRatio >= 0.6) score += 7;
  else score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 점수별 피드백 생성
 */
export function getScoreFeedback(score: number, label: string): string {
  if (label === "다듬기") {
    if (score >= 85) return "문장이 이미 매우 깔끔합니다.";
    else if (score >= 70) return "전반적으로 잘 다듬어진 텍스트입니다.";
    else if (score >= 55) return "조금 다듬으면 더 좋아질 수 있어요.";
    else if (score >= 40) return "문장을 좀 더 명확하게 다듬어보세요.";
    else if (score >= 25) return "문장 구조와 길이를 개선하면 좋습니다.";
    else return "더 많은 내용을 추가하고 문장을 정리해야 합니다.";
  } else if (label === "톤 조절") {
    if (score >= 75) return "톤이 적절하게 유지되고 있어요.";
    else if (score >= 60) return "톤 조절을 고려해보세요.";
    else if (score >= 45) return "톤 변경이 필요할 수 있습니다.";
    else return "톤이 일관되게 개선될 필요가 있습니다.";
  } else if (label === "확장") {
    if (score >= 85) return "텍스트가 충분히 풍부합니다.";
    else if (score >= 70) return "충분한 내용이 담겨 있어요.";
    else if (score >= 55) return "조금 더 디테일을 추가하면 좋습니다.";
    else if (score >= 40) return "내용을 더 풍부하게 만들어보세요.";
    else if (score >= 25) return "더 많은 설명과 예시가 필요합니다.";
    else return "내용을 대폭 확장해야 합니다.";
  }
  return "";
}

/**
 * 품질 점수 배열 생성
 */
export function generateQualityScores(
  metrics: QualityMetrics,
  plainText: string
): QualityScore[] {
  const refinementScore = calculateRefinementScore(metrics);
  const toneScore = calculateToneScore(metrics, plainText);
  const expansionScore = calculateExpansionScore(metrics);

  return [
    {
      label: "다듬기",
      score: refinementScore,
      icon: "✂️",
      color: "from-moss to-leaf",
      description: getScoreFeedback(refinementScore, "다듬기"),
      type: 'refine',
    },
    {
      label: "톤 조절",
      score: toneScore,
      icon: "🎨",
      color: "from-sky to-water",
      description: getScoreFeedback(toneScore, "톤 조절"),
      type: 'tone',
    },
    {
      label: "확장",
      score: expansionScore,
      icon: "🌳",
      color: "from-seed to-bloom",
      description: getScoreFeedback(expansionScore, "확장"),
      type: 'expand',
    },
  ];
}