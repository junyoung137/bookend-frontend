"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = 'ko' | 'en';

export const translations = {
  ko: {
    editor: {
      placeholder: "여기서부터 당신의 이야기를 시작하세요...",
      words: "단어",
      characters: "자",
      autoSaveHint: "자동 저장됨",
      focusMode: "포커스 모드",
      hint: "💡 글을 쓰시면 자동으로 추천이 나타납니다",
      toolbar: {
        bold: "굵게 (Ctrl+B)",
        italic: "기울임 (Ctrl+I)",
        heading1: "제목 1",
        heading2: "제목 2",
        bulletList: "글머리 기호",
        orderedList: "번호 매기기",
      }
    },
    ghostPreview: {
      title: "추천 제안",
      subtitle: "AI 기반 추천",
      fallbackSubtitle: "기본 제안",
      hoverHint: "hover하면 미리보기가 나타납니다",
      apply: "적용",
      applied: "✓ 적용됨",
      close: "닫기",
      error: "추천 시스템에 일시적인 문제가 있습니다. 기본 제안을 표시합니다.",
      backendError: "백엔드 서버에 연결할 수 없습니다. 기본 추천을 표시합니다.",
      types: {
        paraphrase: "간결하게 다시쓰기",
        tone: "톤 변경하기",
        expand: "문장 확장하기",
      }
    },
    growth: {
      title: "성장 지표",
      subtitle: "오늘의 활동",
      todayWords: "오늘 작성한 단어",
      metrics: {
        totalWords: "작성한 단어",
        sessions: "오늘 세션",
        streak: "연속 기록",
        weeklyGrowth: "주간 성장",
      },
      dailyGoal: "일일 목표",
      remaining: "목표까지",
      encouragement: {
        start: "좋은 시작입니다! 💪",
        halfway: "절반 달성! 계속 파이팅! 🌟",
        almostThere: "거의 다 왔어요! 조금만 더! 🚀",
        complete: "목표 달성! 정말 대단해요! 🎉",
      }
    },
    nav: {
      home: "홈",
      editor: "에디터",
      dashboard: "대시보드",
      profile: "프로필",
      startWriting: "글쓰기 시작 ✨",
    }
  },
  en: {
    editor: {
      placeholder: "Start your story here...",
      words: "words",
      characters: "chars",
      autoSaveHint: "Auto-saved",
      focusMode: "Focus Mode",
      hint: "💡 Recommendations will appear as you write",
      toolbar: {
        bold: "Bold (Ctrl+B)",
        italic: "Italic (Ctrl+I)",
        heading1: "Heading 1",
        heading2: "Heading 2",
        bulletList: "Bullet List",
        orderedList: "Numbered List",
      }
    },
    ghostPreview: {
      title: "Suggestions",
      subtitle: "AI-powered",
      fallbackSubtitle: "Default suggestions",
      hoverHint: "Hover for preview",
      apply: "Apply",
      applied: "✓ Applied",
      close: "Close",
      error: "Temporary issue with recommendation system. Showing default suggestions.",
      backendError: "Cannot connect to backend. Showing default recommendations.",
      types: {
        paraphrase: "Rephrase concisely",
        tone: "Change tone",
        expand: "Expand sentence",
      }
    },
    growth: {
      title: "Growth Metrics",
      subtitle: "Today's Activity",
      todayWords: "Words written today",
      metrics: {
        totalWords: "Total Words",
        sessions: "Sessions Today",
        streak: "Day Streak",
        weeklyGrowth: "Weekly Growth",
      },
      dailyGoal: "Daily Goal",
      remaining: "remaining",
      encouragement: {
        start: "Great start! 💪",
        halfway: "Halfway there! Keep going! 🌟",
        almostThere: "Almost done! Just a bit more! 🚀",
        complete: "Goal achieved! Amazing! 🎉",
      }
    },
    nav: {
      home: "Home",
      editor: "Editor",
      dashboard: "Dashboard",
      profile: "Profile",
      startWriting: "Start Writing ✨",
    }
  }
};

interface I18nContextType {
  language: Language;
  t: typeof translations['ko'];
  switchLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ko');

  useEffect(() => {
    const saved = localStorage.getItem('bookend_language') as Language;
    if (saved && (saved === 'ko' || saved === 'en')) {
      setLanguage(saved);
    }
  }, []);

  const switchLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('bookend_language', lang);
  };

  return (
    <I18nContext.Provider value={{ language, t: translations[language], switchLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
