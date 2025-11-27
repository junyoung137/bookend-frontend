// components/backgrounds/BaseBackground.tsx
"use client";

import { ReactNode } from 'react';

interface BaseBackgroundProps {
  children: ReactNode;
  className?: string;
}

export const BaseBackground = ({ children, className = '' }: BaseBackgroundProps) => {
  return (
    <div className={`fixed inset-0 pointer-events-none ${className}`} style={{ zIndex: -1 }}>
      {children}
      {/* 비네팅 효과 (가장자리 어둡게) */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/5" />
    </div>
  );
};