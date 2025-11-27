/**
 * 예시 생성 Hook
 */

import { useState } from 'react';

export interface UseExampleGenerationReturn {
  isGenerating: boolean;
  generatedExamples: string[];
  generateExamples: (text: string) => Promise<string[]>;
  clearExamples: () => void;
}

export function useExampleGeneration(): UseExampleGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExamples, setGeneratedExamples] = useState<string[]>([]);

  const generateExamples = async (originalText: string): Promise<string[]> => {
    setIsGenerating(true);
    
    try {
      console.log('🚀 예시 생성 시작:', { textLength: originalText.length });

      const response = await fetch('/api/generate-examples', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ originalText })
      });

      console.log('📡 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        console.warn('⚠️ API 응답 실패, 기본 예시 사용');
        const fallback = ['예를 들어 구체적인 사례를 들면 독자의 이해를 도울 수 있습니다.'];
        setGeneratedExamples(fallback);
        return fallback;
      }

      const data = await response.json();
      console.log('📥 전체 응답 데이터:', data);
      
      if (data.debug) {
        console.log('🔍 [DEBUG] API 디버그 정보:', data.debug);
      }

      if (data.success && data.examples && data.examples.length > 0) {
        console.log('✅ 예시 생성 성공:', data.examples);
        const examples = [data.examples[0]];
        setGeneratedExamples(examples);
        return examples;
      }

      console.warn('⚠️ 예시가 비어있음, 기본값 반환');
      const fallback = ['예를 들어 구체적인 사례를 들면 독자의 이해를 도울 수 있습니다.'];
      setGeneratedExamples(fallback);
      return fallback;

    } catch (error: any) {
      console.error('❌ 예시 생성 실패:', error);
      const fallback = ['예를 들어 구체적인 사례를 들면 독자의 이해를 도울 수 있습니다.'];
      setGeneratedExamples(fallback);
      return fallback;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearExamples = () => {
    setGeneratedExamples([]);
  };

  return {
    isGenerating,
    generatedExamples,
    generateExamples,
    clearExamples,
  };
}