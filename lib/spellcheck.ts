/**
 * Spellcheck Utility
 * Next.js API Route를 통한 맞춤법 검사
 */

export interface SpellCheckError {
  id: string;
  original: string;
  corrected: string;
  type: 'spelling' | 'spacing' | 'grammar';
  explanation: string;
  start: number;
  end: number;
  suggestions: string[];  // ✅ 추가
}

export interface SpellCheckResult {
  hasErrors: boolean;
  correctedText: string;
  errors: SpellCheckError[];
}

/**
 * 맞춤법 검사 API 호출
 */
export async function checkSpelling(text: string): Promise<SpellCheckResult> {
  console.log('🔍 [SpellCheck] Checking:', text);

  try {
    // Next.js API Route 호출
    const response = await fetch('/api/spellcheck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Spellcheck failed');
    }

    console.log('✅ [SpellCheck] Result:', result.data);
    return result.data;
  } catch (error: any) {
    console.error('❌ [SpellCheck] Error:', error);
    throw new Error(error.message || '맞춤법 검사 중 오류가 발생했습니다');
  }
}