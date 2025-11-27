// services/spellcheck.service.ts

import { SpellError, SpellCheckResult } from '@/types/spellcheck';

class SpellCheckService {
  private requestCache = new Map<string, SpellCheckResult>();
  private pendingRequests = new Map<string, Promise<SpellCheckResult>>();

  /**
   * HTML 태그를 제거하고 순수 텍스트만 추출
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 텍스트를 문장 단위로 분리
   */
  private splitSentences(text: string): string[] {
    return text
      .split(/([.!?]+\s+|\n+)/)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());
  }

  /**
   * Next.js API 라우트를 통해 맞춤법 검사 (CORS 문제 해결)
   */
  private async callSpellCheckAPI(text: string): Promise<string> {
    console.log('📡 [Service] Calling API route for text:', text.substring(0, 50) + '...');
    
    const response = await fetch('/api/spellcheck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [Service] API error:', errorData);
      
      if (response.status === 503 && errorData.error === 'MODEL_LOADING') {
        throw new Error('MODEL_LOADING');
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [Service] API response:', result);
    
    return result.correctedText || text;
  }

  /**
   * 원본 텍스트와 교정된 텍스트를 비교하여 오류 위치 찾기
   */
  private findErrors(original: string, corrected: string): SpellError[] {
    const errors: SpellError[] = [];
    
    if (original === corrected) {
      return errors;
    }

    // 간단한 diff 알고리즘
    const originalWords = original.split(/(\s+)/);
    const correctedWords = corrected.split(/(\s+)/);
    
    let originalPos = 0;
    let errorId = 0;

    for (let i = 0; i < Math.max(originalWords.length, correctedWords.length); i++) {
      const origWord = originalWords[i] || '';
      const corrWord = correctedWords[i] || '';

      if (origWord !== corrWord && origWord.trim() && corrWord.trim()) {
        errors.push({
          id: `error-${errorId++}`,
          start: originalPos,
          end: originalPos + origWord.length,
          length: origWord.length,
          original: origWord,
          corrected: corrWord,
          type: 'spelling',
          message: `"${origWord}" → "${corrWord}"로 수정 권장`,
        });
      }

      originalPos += origWord.length;
    }

    return errors;
  }

  /**
   * 맞춤법 검사 실행 (캐싱 + 중복 요청 방지)
   */
  async checkSpelling(htmlContent: string): Promise<SpellCheckResult> {
    const text = this.stripHtml(htmlContent);
    
    // 너무 짧으면 검사 안 함
    if (text.length < 5) {
      return {
        errors: [],
        correctedText: text,
        hasErrors: false,
      };
    }

    // 캐시 확인
    const cacheKey = text;
    if (this.requestCache.has(cacheKey)) {
      console.log('💾 [Service] Using cached result');
      return this.requestCache.get(cacheKey)!;
    }

    // 중복 요청 방지
    if (this.pendingRequests.has(cacheKey)) {
      console.log('⏳ [Service] Waiting for pending request');
      return this.pendingRequests.get(cacheKey)!;
    }

    // 새 요청 시작
    const requestPromise = (async () => {
      try {
        console.log('🚀 [Service] Starting spell check for text length:', text.length);
        
        // 문장 단위로 분리
        const sentences = this.splitSentences(text);
        const correctedSentences: string[] = [];
        const allErrors: SpellError[] = [];
        let offset = 0;

        for (const sentence of sentences) {
          if (sentence.length < 3) {
            correctedSentences.push(sentence);
            offset += sentence.length;
            continue;
          }

          try {
            const corrected = await this.callSpellCheckAPI(sentence);
            correctedSentences.push(corrected);

            // 오류 찾기
            const sentenceErrors = this.findErrors(sentence, corrected);
            sentenceErrors.forEach(error => {
              allErrors.push({
                ...error,
                start: error.start + offset,
                end: error.end + offset,
              });
            });

            offset += sentence.length;
          } catch (error) {
            console.warn('⚠️ [Service] Failed to check sentence:', sentence, error);
            correctedSentences.push(sentence);
            offset += sentence.length;
          }
        }

        const result: SpellCheckResult = {
          errors: allErrors,
          correctedText: correctedSentences.join(' '),
          hasErrors: allErrors.length > 0,
        };

        console.log('✅ [Service] Spell check complete. Errors found:', allErrors.length);

        // 캐시 저장 (최대 100개)
        if (this.requestCache.size > 100) {
          const firstKey = this.requestCache.keys().next().value as string;
          if (firstKey) {
            this.requestCache.delete(firstKey);
          }
        }
        this.requestCache.set(cacheKey, result);

        return result;
      } catch (error) {
        console.error('❌ [Service] Spell check error:', error);
        return {
          errors: [],
          correctedText: text,
          hasErrors: false,
        };
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    })();

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.requestCache.clear();
    this.pendingRequests.clear();
    console.log('🗑️ [Service] Cache cleared');
  }
}

export const spellCheckService = new SpellCheckService();