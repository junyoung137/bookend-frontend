// components/theme/ThemeToggle.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TreePine, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  const themeConfig = {
    default: {
      icon: TreePine,
      color: 'text-[#4a7c59]',
      hoverBg: 'hover:bg-black/5',
      dotColor: 'bg-[#4a7c59]',
      label: '캐롤 테마로 전환'
    },
    carol: {
      icon: Sparkles,
      color: 'text-[#e0b973]',
      hoverBg: 'hover:bg-black/5',
      dotColor: 'bg-[#e0b973]',
      label: '다크 테마로 전환'
    },
    dark: {
      icon: Moon,
      color: 'text-[#7c3aed]',
      hoverBg: 'hover:bg-black/5',
      dotColor: 'bg-[#7c3aed]',
      label: '기본 테마로 전환'
    }
  };

  const currentConfig = themeConfig[theme];
  const Icon = currentConfig.icon;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className={`
          relative p-2 rounded-lg transition-all duration-300
          ${currentConfig.hoverBg}
        `}
        aria-label={currentConfig.label}
        title={currentConfig.label}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 180, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Icon className={`w-4 h-4 ${currentConfig.color}`} strokeWidth={2.5} />
          </motion.div>
        </AnimatePresence>

        {/* 인디케이터 */}
        <motion.div
          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${currentConfig.dotColor}`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.button>

      {/* 툴팁 */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800/90 backdrop-blur-sm text-white text-xs rounded-md whitespace-nowrap pointer-events-none z-50 shadow-lg"
          >
            {currentConfig.label}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800/90 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}