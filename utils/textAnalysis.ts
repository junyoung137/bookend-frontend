/**
 * 텍스트 분석 유틸리티
 */

export interface QualityMetrics {
  sentenceCount: number;
  avgSentenceLength: number;
  wordCount: number;
  avgWordLength: number;
  uniqueWordRatio: number;
  hasPunctuation: boolean;
  hasVariedPunctuation: boolean;
  charCount: number;
  exampleCount: number;
  hasAbstractClaims: boolean;
  sentences: string[];
}

/**
 * HTML을 Plain Text로 변환
 */
export function getPlainText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Plain Text를 HTML로 변환
 */
export function convertPlainTextToHTML(text: string): string {
  if (!text) return '<p></p>';

  const paragraphs = text
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('');

  return paragraphs || '<p></p>';
}

/**
 * 예시 패턴 감지
 */
export function detectExamples(text: string): number {
  const examplePatterns = [
    /예를 들어|예를들면|예컨대|가령|예시로/g,
    /다음과 같[이은]/g,
    /구체적으로|실제로/g,
    /\d+\.\s|[가-힣]\)\s/g,
  ];
  
  let count = 0;
  examplePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });
  
  return count;
}

/**
 * 추상적 주장 감지
 */
export function hasAbstractClaims(text: string): boolean {
  const abstractPatterns = [
    /중요하다|필요하다|도움이 된다/,
    /효과적이다|유용하다|좋다/,
    /문제가 있다|어렵다/,
  ];
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  let abstractCount = 0;
  sentences.forEach(sentence => {
    if (abstractPatterns.some(p => p.test(sentence))) {
      abstractCount++;
    }
  });
  
  return abstractCount >= 2 && detectExamples(text) === 0;
}

/**
 * 텍스트 메트릭 분석
 */
export function analyzeTextMetrics(text: string): QualityMetrics {
  const trimmed = text.trim();
  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));

  const charCount = trimmed.length;
  const sentenceCount = sentences.length;
  const wordCount = words.length;
  
  const avgSentenceLength = sentenceCount > 0 ? charCount / sentenceCount : 0;
  const avgWordLength = wordCount > 0 ? trimmed.replace(/\s/g, '').length / wordCount : 0;
  const uniqueWordRatio = wordCount > 0 ? uniqueWords.size / wordCount : 0;

  const hasPunctuation = /[.!?,;:]/.test(trimmed);
  const hasVariedPunctuation = /[,;:]/.test(trimmed) && /[.!?]/.test(trimmed);
  
  const exampleCount = detectExamples(trimmed);
  const hasAbstractClaimsFlag = hasAbstractClaims(trimmed);

  return {
    sentenceCount,
    avgSentenceLength,
    wordCount,
    avgWordLength,
    uniqueWordRatio,
    hasPunctuation,
    hasVariedPunctuation,
    charCount,
    exampleCount,
    hasAbstractClaims: hasAbstractClaimsFlag,
    sentences,
  };
}

/**
 * 예시 필요 여부 판단
 */
export function needsExamples(metrics: QualityMetrics): boolean {
  if (metrics.charCount < 50) return false;
  if (metrics.sentenceCount < 3) return false;
  
  return metrics.exampleCount <= 3 || metrics.hasAbstractClaims;
}