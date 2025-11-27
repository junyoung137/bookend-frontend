// lib/I18nProvider.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language } from "./i18n";

interface I18nContextType {
  language: Language;
  switchLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ko");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const saved = localStorage.getItem("bookend_language") as Language;
    if (saved && ["ko", "en"].includes(saved)) {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("bookend_language", language);
  }, [language, hydrated]);

  const switchLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const t = (key: string) => {
    const parts = key.split(".");
    let current: any = translations[language];
    for (const p of parts) {
      current = current?.[p];
      if (!current) return key;
    }
    return typeof current === "string" ? current : key;
  };

  if (!hydrated) return <>{children}</>;

  return (
    <I18nContext.Provider value={{ language, switchLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useTranslation = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
};
