// components/backgrounds/DarkBackground.tsx
"use client";

import { useEffect, useState } from 'react';
import { BaseBackground } from './BaseBackground';

export function DarkBackground() {
  const [stars, setStars] = useState<Array<{
    id: number;
    left: number;
    top: number;
    size: number;
    animationDelay: number;
    animationDuration: number;
  }>>([]);

  useEffect(() => {
    const starArray = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 0.5 + Math.random() * 1.5,
      animationDelay: Math.random() * 3,
      animationDuration: 2 + Math.random() * 3,
    }));
    setStars(starArray);
  }, []);

  return (
    <BaseBackground className="bg-transparent">
      {/* 메인 보라빛 글로우 (중앙) */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full blur-[150px] animate-glow-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)'
        }}
      />
      
      {/* 청록빛 액센트 (좌측 상단) */}
      <div 
        className="absolute top-0 left-0 w-[700px] h-[700px] rounded-full blur-[130px] opacity-60 animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, transparent 70%)',
          animationDelay: '1s'
        }}
      />
      
      {/* 보라빛 액센트 (우측 하단) */}
      <div 
        className="absolute bottom-0 right-0 w-[800px] h-[800px] rounded-full blur-[140px] opacity-50 animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.4) 0%, transparent 70%)',
          animationDelay: '2s'
        }}
      />
      
      {/* 중앙 하단 글로우 */}
      <div 
        className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] rounded-full blur-[120px] opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%)'
        }}
      />
      
      {/* 반짝이는 별들 */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animation: `twinkle ${star.animationDuration}s ease-in-out infinite`,
              animationDelay: `${star.animationDelay}s`,
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`
            }}
          />
        ))}
      </div>
      
      {/* 미세한 그리드 패턴 */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        opacity: 0.3
      }} />
      
      {/* 노이즈 텍스처 */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
        }}
      />
      
      {/* 비네팅 */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(15, 20, 25, 0.3) 100%)'
        }}
      />
      
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </BaseBackground>
  );
}