// components/layout/LanguageToggle.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/I18nProvider";

export function LanguageToggle() {
  const [mounted, setMounted] = useState(false);
  const { language, switchLanguage } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-20 h-9 rounded-lg bg-gray-200 animate-pulse" />;
  }

  return (
    <div
      className="
        relative w-20 h-9 rounded-lg bg-white/60 border border-gray-200
        flex items-center justify-between p-0.5 duration-300
      "
      style={{ zIndex: 99999 }}
    >
      <button
        onClick={() => switchLanguage("ko")}
        className={`
          flex-1 rounded-md text-xs font-semibold h-full transition-all
          ${language === "ko"
            ? "bg-moss text-white shadow-sm"
            : "text-gray-600 hover:text-moss hover:bg-gray-50"}
        `}
      >
        KO
      </button>

      <button
        onClick={() => switchLanguage("en")}
        className={`
          flex-1 rounded-md text-xs font-semibold h-full transition-all
          ${language === "en"
            ? "bg-moss text-white shadow-sm"
            : "text-gray-600 hover:text-moss hover:bg-gray-50"}
        `}
      >
        EN
      </button>
    </div>
  );
}
