"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme"; // 🔴 next-themes 대신 커스텀 훅 사용
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme(); // 🔴 커스텀 훅 사용

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
    );
  }

  // 🔴 theme 타입이 'default' | 'carol' | 'dark' 인지 확인
  const isDark = theme === 'dark';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-lg glass border border-white/20 
                 hover:border-moss/50 transition-all duration-300 
                 flex items-center justify-center group overflow-hidden"
      aria-label="Toggle theme"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-moss/10 to-leaf/10 
                    opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Icons */}
      <Sun
        className={`absolute w-5 h-5 text-amber-500 transition-all duration-300 ${
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <Moon
        className={`absolute w-5 h-5 text-indigo-400 transition-all duration-300 ${
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
      />
    </motion.button>
  );
}