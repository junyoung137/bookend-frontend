// hooks/useTheme.ts
"use client";

import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';
import type { ThemeContextType } from '@/types/theme.types';

/**
 * 테마 컨텍스트를 사용하는 커스텀 훅
 * @throws {Error} ThemeProvider 외부에서 사용 시 에러 발생
 * @returns {ThemeContextType} 현재 테마 상태와 테마 변경 함수들
 * 
 * @example
 * ```tsx
 * const { theme, setTheme, toggleTheme } = useTheme();
 * 
 * // 테마 확인
 * console.log(theme); // 'default' | 'carol'
 * 
 * // 테마 변경
 * setTheme('carol');
 * 
 * // 테마 토글
 * toggleTheme();
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error(
      'useTheme must be used within ThemeProvider. ' +
      'Make sure your component is wrapped with <ThemeProvider>.'
    );
  }
  
  return context;
}