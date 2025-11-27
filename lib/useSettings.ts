"use client";

import { useState, useEffect } from 'react';

export interface AppSettings {
  autoSave: boolean;
  autoSaveInterval: number;
  theme: 'light' | 'dark';
  language: 'ko' | 'en';
}

const DEFAULT_SETTINGS: AppSettings = {
  autoSave: true,
  autoSaveInterval: 30,
  theme: 'light',
  language: 'ko',
};

const STORAGE_KEY = 'bookend_settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 설정 불러오기
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('설정 불러오기 실패:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // 설정 저장
  const saveSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return {
    settings,
    saveSettings,
    isLoaded,
  };
}