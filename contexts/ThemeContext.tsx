// src/contexts/ThemeContext.tsx
"use client";

import { createContext, useState, useEffect, ReactNode } from 'react';
import { ThemeType } from '@/types/theme.types';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  setTheme: () => {},
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeType>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('bookend_theme') as ThemeType;
      if (savedTheme && ['default', 'carol', 'dark'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem('bookend_theme', theme);
    
    document.body.classList.remove('theme-default', 'theme-carol', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    
    console.log('✅ Theme changed:', theme);
  }, [theme, mounted]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === 'default') return 'carol';
      if (prev === 'carol') return 'dark';
      return 'default';
    });
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}