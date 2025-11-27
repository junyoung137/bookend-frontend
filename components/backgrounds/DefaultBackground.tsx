// components/backgrounds/DefaultBackground.tsx
"use client";

import { BaseBackground } from './BaseBackground';

export function DefaultBackground() {
  return (
    <BaseBackground className="bg-gradient-to-br from-[#e8f5e3] via-[#f0f9ec] to-[#d8ead3]">
      {/* 메인 글로우 (중앙) */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-[140px] animate-glow-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(107, 157, 119, 0.6) 0%, transparent 70%)'
        }}
      />
      
      {/* 좌측 상단 액센트 */}
      <div 
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px] opacity-50 animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(74, 124, 89, 0.5) 0%, transparent 70%)',
          animationDelay: '1s'
        }}
      />
      
      {/* 우측 하단 액센트 */}
      <div 
        className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full blur-[120px] opacity-40 animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(138, 184, 146, 0.6) 0%, transparent 70%)',
          animationDelay: '2s'
        }}
      />
      
      {/* 중앙 하단 글로우 */}
      <div 
        className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[90px] opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(107, 157, 119, 0.5) 0%, transparent 70%)'
        }}
      />
      
      {/* 미세한 파티클 효과 */}
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle, rgba(74, 124, 89, 0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        opacity: 0.3
      }} />
      
      {/* 종이 질감 */}
      <div 
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
        }}
      />
      
      {/* 비네팅 */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(74, 124, 89, 0.1) 100%)'
        }}
      />
    </BaseBackground>
  );
}