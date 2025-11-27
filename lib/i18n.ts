// lib/i18n.ts
// 단일 번역 데이터 파일 (ko / en)
// I18nProvider가 dot-notation ("editor.placeholder")으로 접근하도록 중첩 구조로 정의.

export type Language = 'ko' | 'en';

/**
 * 번역 객체 (중첩 구조)
 * 필요한 키는 여기에 추가하고, UI 컴포넌트에서는 dot-notation으로 접근합니다.
 */
export const translations = {
  ko: {
    // 공통
    common: {
      save: '저장',
      cancel: '취소',
      close: '닫기',
      delete: '삭제',
      edit: '편집',
      search: '검색',
      loading: '로딩 중...',
      error: '오류',
      success: '성공',
    },

    // 설정
    settings: {
      title: '설정',
      appSettings: '앱 환경을 설정하세요',
      generalSettings: '일반 설정',
      versionHistory: '버전 히스토리',
      language: '언어',
      languageSettings: '언어 설정',
      selectLanguage: '표시 언어를 선택하세요',
      saved: '설정이 저장되었습니다',
      saving: '저장 중...',
    },

    // 에디터
    editor: {
      placeholder: '여기서부터 당신의 이야기를 시작하세요...',
      words: '단어',
      characters: '자',
      autoSaveHint: '자동 저장됨',
      focusMode: '포커스 모드',
      hint: '💡 글을 쓰시면 자동으로 추천이 나타납니다',
      toolbar: {
        bold: '굵게 (Ctrl+B)',
        italic: '기울임 (Ctrl+I)',
        heading1: '제목 1',
        heading2: '제목 2',
        bulletList: '글머리 기호',
        orderedList: '번호 매기기',
      }
    },

    // 추천(ghostPreview)
    ghostPreview: {
      title: '추천 제안',
      subtitle: 'AI 기반 추천',
      fallbackSubtitle: '기본 제안',
      hoverHint: 'hover하면 미리보기가 나타납니다',
      apply: '적용',
      applied: '✓ 적용됨',
      close: '닫기',
      error: '추천 시스템에 일시적인 문제가 있습니다. 기본 제안을 표시합니다.',
      backendError: '백엔드 서버에 연결할 수 없습니다. 기본 추천을 표시합니다.',
      types: {
        paraphrase: '간결하게 다시쓰기',
        tone: '톤 변경하기',
        expand: '문장 확장하기',
      }
    },

    // 성장 지표
    growth: {
      title: '성장 지표',
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

    // 내비게이션
    nav: {
      home: "홈",
      editor: "에디터",
      dashboard: "대시보드",
      profile: "프로필",
      startWriting: "글쓰기 시작 ✨",
    },

    // 자동 저장 관련
    autosave: {
      enabled: '자동 저장 사용',
      saveIntervalLabel: '저장 간격',
      seconds: '초'
    },

    // 테마
    theme: {
      title: '테마',
      defaultTheme: '기본 테마',
      carolTheme: '캐롤 테마',
      darkTheme: '다크 테마',
    }
  },

  en: {
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },

    // Settings
    settings: {
      title: 'Settings',
      appSettings: 'Configure your app environment',
      generalSettings: 'General Settings',
      versionHistory: 'Version History',
      language: 'Language',
      languageSettings: 'Language Settings',
      selectLanguage: 'Select display language',
      saved: 'Settings saved',
      saving: 'Saving...',
    },

    // Editor
    editor: {
      placeholder: 'Start your story here...',
      words: 'words',
      characters: 'chars',
      autoSaveHint: 'Auto-saved',
      focusMode: 'Focus Mode',
      hint: '💡 Recommendations will appear as you write',
      toolbar: {
        bold: 'Bold (Ctrl+B)',
        italic: 'Italic (Ctrl+I)',
        heading1: 'Heading 1',
        heading2: 'Heading 2',
        bulletList: 'Bullet List',
        orderedList: 'Numbered List',
      }
    },

    // ghostPreview
    ghostPreview: {
      title: 'Suggestions',
      subtitle: 'AI-powered',
      fallbackSubtitle: 'Default suggestions',
      hoverHint: 'Hover for preview',
      apply: 'Apply',
      applied: '✓ Applied',
      close: 'Close',
      error: 'Temporary issue with recommendation system. Showing default suggestions.',
      backendError: 'Cannot connect to backend. Showing default recommendations.',
      types: {
        paraphrase: 'Rephrase concisely',
        tone: 'Change tone',
        expand: 'Expand sentence',
      }
    },

    // Growth
    growth: {
      title: 'Growth Metrics',
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

    // Nav
    nav: {
      home: "Home",
      editor: "Editor",
      dashboard: "Dashboard",
      profile: "Profile",
      startWriting: "Start Writing ✨",
    },

    // Autosave
    autosave: {
      enabled: 'Enable auto save',
      saveIntervalLabel: 'Save interval',
      seconds: 'sec'
    },

    // Theme
    theme: {
      title: 'Theme',
      defaultTheme: 'Default Theme',
      carolTheme: 'Carol Theme',
      darkTheme: 'Dark Theme',
    }
  }
} as const;

/**
 * 타입 헬퍼
 *
 * - TranslationObject: 중첩된 번역 객체(ko 기준)
 * - TranslationKey: (간단한 임시 정의) t()에서 사용하는 key 타입 — 현재는 string으로 둡니다.
 *    나중에 원하면 dot-path union 타입을 자동 생성하도록 개선 가능.
 */
export type TranslationObject = typeof translations['ko'];
export type TranslationKey = string;
