"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GrowthMetrics {
  totalWords: number;
  sessionsToday: number;
  streak: number;
  weeklyGrowth: number;
}

export function GrowthWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState<GrowthMetrics>({
    totalWords: 1247,
    sessionsToday: 3,
    streak: 7,
    weeklyGrowth: 23,
  });

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const savedMetrics = window.localStorage.getItem('bookend_metrics');
      if (savedMetrics) {
        try {
          setMetrics(JSON.parse(savedMetrics));
        } catch (e) {
          console.error('Failed to parse metrics:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const interval = setInterval(() => {
      setMetrics((prev) => {
        const updated = {
          ...prev,
          totalWords: prev.totalWords + Math.floor(Math.random() * 10),
        };
        try {
          window.localStorage.setItem('bookend_metrics', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save metrics:', e);
        }
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-8 left-8 z-30"
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="collapsed"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={() => setIsExpanded(true)}
            className="glass rounded-2xl p-4 border border-white/50 shadow-xl hover:shadow-2xl
                     transition-all duration-300 hover:-translate-y-1 group"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-moss to-leaf flex items-center justify-center
                            group-hover:scale-110 transition-transform">
                <span className="text-2xl">🌱</span>
              </div>

              <div className="text-left">
                <div className="text-2xl font-bold text-gray-800">
                  {metrics.totalWords.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">오늘 작성한 단어</div>
              </div>

              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-gray-400"
              >
                →
              </motion.div>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-3xl p-6 border border-white/50 shadow-2xl w-80"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-moss to-leaf flex items-center justify-center">
                  <span className="text-xl">🌱</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">성장 지표</h3>
                  <p className="text-xs text-gray-600">오늘의 활동</p>
                </div>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-200/50 rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <MetricCard
                icon="📝"
                label="작성한 단어"
                value={metrics.totalWords.toLocaleString()}
                color="from-moss to-leaf"
              />

              <MetricCard
                icon="⚡"
                label="오늘 세션"
                value={`${metrics.sessionsToday}회`}
                color="from-sky to-water"
              />

              <MetricCard
                icon="🔥"
                label="연속 기록"
                value={`${metrics.streak}일`}
                color="from-seed to-bloom"
                highlight={metrics.streak >= 7}
              />

              <MetricCard
                icon="📈"
                label="주간 성장"
                value={`+${metrics.weeklyGrowth}%`}
                color="from-bloom to-sky"
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>일일 목표</span>
                <span>{((metrics.totalWords / 2000) * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((metrics.totalWords / 2000) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-moss to-leaf rounded-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                목표까지 {Math.max(2000 - metrics.totalWords, 0).toLocaleString()} 단어
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-3 rounded-xl bg-gradient-to-r from-moss/10 to-leaf/10 border border-moss/20"
            >
              <p className="text-sm text-gray-700 text-center">
                {getEncouragement(metrics.totalWords)}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`
        p-3 rounded-xl border transition-all duration-200
        ${
          highlight
            ? "bg-gradient-to-r from-seed/20 to-bloom/20 border-seed/50"
            : "bg-white/60 border-gray-200/50 hover:border-moss/30"
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
            <span className="text-lg">{icon}</span>
          </div>
          <div>
            <div className="text-xs text-gray-600">{label}</div>
            <div className="text-lg font-bold text-gray-800">{value}</div>
          </div>
        </div>

        {highlight && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-2xl">✨</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function getEncouragement(totalWords: number): string {
  if (totalWords < 100) {
    return "첫 걸음을 내딛으셨네요! 💪";
  } else if (totalWords < 500) {
    return "좋은 흐름이에요! 🌱";
  } else if (totalWords < 1000) {
    return "절반 달성! 멋진 페이스네요! 🌟";
  } else if (totalWords < 1500) {
    return "대단해요! 거의 다 왔습니다! 🔥";
  } else if (totalWords < 2000) {
    return "마지막 스퍼트! 조금만 더! 🚀";
  } else {
    return "목표 달성! 오늘도 최고예요! 🎉";
  }
}