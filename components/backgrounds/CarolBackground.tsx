// components/backgrounds/CarolBackground.tsx
"use client";

import { useEffect, useState } from 'react';
import { BaseBackground } from './BaseBackground';

export function CarolBackground() {
  const [snowflakes, setSnowflakes] = useState<Array<{
    id: number;
    left: number;
    animationDuration: number;
    animationDelay: number;
    fontSize: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 12 + Math.random() * 18,
      animationDelay: Math.random() * 8,
      fontSize: 0.6 + Math.random() * 1.2,
      opacity: 0.3 + Math.random() * 0.5,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <BaseBackground className="bg-gradient-to-br from-[#fff4e6] via-[#fff8f0] to-[#ffefd9]">
      {/* 메인 골드 글로우 (중앙 상단) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] rounded-full blur-[140px] animate-glow-pulse"
        style={{
          background: 'radial-gradient(ellipse, rgba(224, 185, 115, 0.7) 0%, transparent 60%)'
        }}
      />
      
      {/* 와인 레드 액센트 (좌측) */}
      <div 
        className="absolute top-1/4 left-0 w-[700px] h-[700px] rounded-full blur-[120px] opacity-40 animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(201, 76, 76, 0.6) 0%, transparent 70%)',
          animationDelay: '1.5s'
        }}
      />
      
      {/* 에메랄드 그린 액센트 (우측) */}
      <div 
        className="absolute bottom-1/4 right-0 w-[650px] h-[650px] rounded-full blur-[110px] opacity-35 animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(45, 95, 76, 0.5) 0%, transparent 70%)',
          animationDelay: '3s'
        }}
      />
      
      {/* 촛불 효과 (하단 중앙) */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[90px]"
        style={{
          background: 'radial-gradient(ellipse, rgba(224, 185, 115, 0.5) 0%, transparent 60%)',
          animation: 'flicker 3.5s ease-in-out infinite'
        }}
      />
      
      {/* 중앙 따뜻한 글로우 */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[130px] opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(224, 185, 115, 0.6) 0%, rgba(201, 76, 76, 0.3) 50%, transparent 70%)'
        }}
      />
      
      {/* 눈송이 애니메이션 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute text-white"
            style={{
              left: `${flake.left}%`,
              fontSize: `${flake.fontSize}em`,
              opacity: flake.opacity,
              animation: `fall ${flake.animationDuration}s linear infinite`,
              animationDelay: `${flake.animationDelay}s`,
              filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))'
            }}
          >
            ❄
          </div>
        ))}
      </div>
      
      {/* 반짝이는 파티클 */}
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle, rgba(224, 185, 115, 0.15) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        opacity: 0.4
      }} />
      
      {/* 종이 질감 */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
        }}
      />
      
      {/* 비네팅 */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(201, 76, 76, 0.08) 100%)'
        }}
      />
      
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes flicker {
          0%, 100% {
            opacity: 0.4;
            transform: translateX(-50%) scale(1);
          }
          20% {
            opacity: 0.6;
            transform: translateX(-50%) scale(1.08);
          }
          40% {
            opacity: 0.45;
            transform: translateX(-50%) scale(0.98);
          }
          60% {
            opacity: 0.55;
            transform: translateX(-50%) scale(1.05);
          }
          80% {
            opacity: 0.5;
            transform: translateX(-50%) scale(1.02);
          }
        }
      `}</style>
    </BaseBackground>
  );
}