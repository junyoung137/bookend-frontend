// types/theme.types.ts

export type ThemeType = 'default' | 'carol' | 'dark';

export interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

export interface Theme {
  id: ThemeType;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export const THEMES: Record<ThemeType, Theme> = {
  default: {
    id: 'default',
    name: '기본 테마',
    description: '집중력을 높이는 자연 몰입형 테마',
    colors: {
      primary: '#4a7c59',
      secondary: '#6b9d77',
      accent: '#8ab892',
      background: '#e8f5e3',
      text: '#1a2e1a',
    },
  },
  carol: {
    id: 'carol',
    name: '캐롤 테마',
    description: '따뜻하고 아늑한 크리스마스 감성',
    colors: {
      primary: '#c94c4c',
      secondary: '#e0b973',
      accent: '#b85a5a',
      background: '#fff4e6',
      text: '#3b2f2f',
    },
  },
  dark: {
    id: 'dark',
    name: '다크 테마',
    description: '깊은 밤 조용한 집필 공간',
    colors: {
      primary: '#7c3aed',
      secondary: '#06b6d4',
      accent: '#a78bfa',
      background: '#0f1419',
      text: '#e5e7eb',
    },
  },
};