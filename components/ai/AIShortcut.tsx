"use client";

import { useEffect } from "react";

interface AIShortcutProps {
  onTrigger: () => void;
  isEnabled?: boolean;
}

export const AIShortcut = ({ onTrigger, isEnabled = true }: AIShortcutProps) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ✅ Cmd+K (Mac) 또는 Ctrl+K (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onTrigger();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTrigger, isEnabled]);

  return null;
};