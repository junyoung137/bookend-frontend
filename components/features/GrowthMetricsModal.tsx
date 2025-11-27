"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Award, Calendar, Clock, Flame, Zap, Target, Settings, RefreshCw, BookOpen, Trophy, Star } from "lucide-react";

interface GrowthData {
  totalWords: number;
  sessionsToday: number;
  streak: number;
  weeklyGrowth: number;
  totalDays: number;
  avgSessionLength: number;
  bestTime: string;
  badges: Array<{
    id: number;
    name: string;
    emoji: string;
    description: string;
    unlocked: boolean;
  }>;
}

export function GrowthMetrics() {
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [tempGoal, setTempGoal] = useState("2000");
  const [data, setData] = useState<GrowthData>({
    totalWords: 0,
    sessionsToday: 0,
    streak: 0,
    weeklyGrowth: 0,
    totalDays: 0,
    avgSessionLength: 0,
    bestTime: "오전 9-11시",
    badges: [
      { id: 1, name: "첫 걸음", emoji: "🌱", description: "첫 글 작성", unlocked: false },
      { id: 2, name: "꾸준함", emoji: "🔥", description: "7일 연속", unlocked: false },
      { id: 3, name: "작가", emoji: "✍️", description: "1만 단어", unlocked: false },
      { id: 4, name: "새벽형", emoji: "🌅", description: "새벽 작성", unlocked: false },
      { id: 5, name: "마라토너", emoji: "🏃", description: "2시간 연속", unlocked: false },
      { id: 6, name: "열정", emoji: "💪", description: "5천 단어/일", unlocked: false },
    ],
  });

  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      const savedChapters = localStorage.getItem("bookend_chapters");
      const savedMetrics = localStorage.getItem("bookend_metrics");
      const savedGoal = localStorage.getItem("bookend_daily_goal");

      if (savedGoal) {
        setDailyGoal(parseInt(savedGoal));
        setTempGoal(savedGoal);
      }

      let calculatedData = { ...data };

      if (savedChapters) {
        try {
          const chapters = JSON.parse(savedChapters);
          let totalWords = 0;

          chapters.forEach((chapter: any) => {
            chapter.sections?.forEach((section: any) => {
              const div = document.createElement("div");
              div.innerHTML = section.content || "";
              const text = div.textContent || "";
              totalWords += text.split(/\s+/).filter(Boolean).length;
            });
          });

          calculatedData.totalWords = totalWords;
        } catch (e) {
          console.error("Failed to parse chapters:", e);
        }
      }

      if (savedMetrics) {
        try {
          const metrics = JSON.parse(savedMetrics);
          calculatedData = { ...calculatedData, ...metrics };
        } catch (e) {
          console.error("Failed to parse metrics:", e);
        }
      }

      calculatedData.badges = calculatedData.badges.map((badge) => {
        if (badge.id === 1 && calculatedData.totalWords > 0) {
          return { ...badge, unlocked: true };
        }
        if (badge.id === 2 && calculatedData.streak >= 7) {
          return { ...badge, unlocked: true };
        }
        if (badge.id === 3 && calculatedData.totalWords >= 10000) {
          return { ...badge, unlocked: true };
        }
        return badge;
      });

      setData(calculatedData);
    }
  }, []);

  const handleSaveGoal = () => {
    const newGoal = parseInt(tempGoal);
    if (newGoal > 0 && newGoal <= 100000) {
      setDailyGoal(newGoal);
      localStorage.setItem("bookend_daily_goal", newGoal.toString());
      setShowSettings(false);
    } else {
      alert("목표는 1 ~ 100,000 단어 사이로 설정해주세요.");
    }
  };

  const handleReset = () => {
    if (window.confirm("모든 성장 데이터를 초기화하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.")) {
      localStorage.removeItem("bookend_metrics");
      localStorage.removeItem("bookend_daily_goal");
      setDailyGoal(2000);
      setTempGoal("2000");
      setData({
        ...data,
        sessionsToday: 0,
        streak: 0,
        weeklyGrowth: 0,
        totalDays: 0,
        avgSessionLength: 0,
      });
      window.location.reload();
    }
  };

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const todayWords = Math.floor(data.totalWords * 0.1);
  const progressPercentage = Math.min((todayWords / dailyGoal) * 100, 100);
  const totalPages = Math.floor(data.totalWords / 300);
  const unlockedBadgesCount = data.badges.filter(b => b.unlocked).length;

  return (
    <div className="space-y-2.5 w-full max-w-3xl mx-auto p-3 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 p-4 rounded-xl bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border border-green-200/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">🌱 나의 성장</h2>
            <p className="text-xs text-gray-600">당신의 글쓰기 여정</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-medium text-green-700">목표</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-red-600" />
            <span className="text-xs font-medium text-red-600">초기화</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs font-bold text-gray-700 mb-1.5">일일 목표 설정</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min="1"
                  max="100000"
                />
                <span className="text-xs text-gray-600">단어</span>
                <button
                  onClick={handleSaveGoal}
                  className="px-2.5 py-1 text-xs font-bold bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  저장
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="col-span-2 space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-800">오늘의 목표</span>
                <span className="text-[10px] text-gray-600">({dailyGoal.toLocaleString()} 단어)</span>
              </div>
              <span className="text-base font-bold text-blue-600">{progressPercentage.toFixed(0)}%</span>
            </div>

            <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden mb-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full flex items-center justify-end pr-2"
                style={{
                  background: progressPercentage >= 100 
                    ? 'linear-gradient(to right, #10B981, #34D399, #6EE7B7)'
                    : progressPercentage >= 75
                    ? 'linear-gradient(to right, #3B82F6, #60A5FA, #93C5FD)'
                    : progressPercentage >= 50
                    ? 'linear-gradient(to right, #8B5CF6, #A78BFA, #C4B5FD)'
                    : progressPercentage >= 25
                    ? 'linear-gradient(to right, #F59E0B, #FBBF24, #FCD34D)'
                    : 'linear-gradient(to right, #9CA3AF, #D1D5DB)',
                  boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.3)',
                }}
              >
                {progressPercentage > 10 && (
                  <span className="text-[10px] font-bold text-white drop-shadow">
                    {todayWords.toLocaleString()}
                  </span>
                )}
              </motion.div>
            </div>

            <div className="text-center">
              {todayWords >= dailyGoal ? (
                <p className="text-green-600 font-bold text-xs">🎉 목표 달성!</p>
              ) : (
                <p className="text-gray-700 text-[10px]">
                  목표까지 <span className="text-blue-600 font-bold">{(dailyGoal - todayWords).toLocaleString()}</span> 단어
                </p>
              )}
            </div>
          </motion.div>

          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <StatCard
                icon={<Zap className="w-4 h-4" />}
                label="총 단어"
                value={data.totalWords.toLocaleString()}
                gradient="from-amber-400 to-orange-500"
                trend={data.weeklyGrowth > 0 ? `+${data.weeklyGrowth}%` : undefined}
              />

              <StatCard
                icon={<Flame className="w-4 h-4" />}
                label="연속"
                value={`${data.streak}일`}
                gradient="from-red-400 to-pink-500"
                highlight={data.streak >= 7}
              />

              <StatCard
                icon={<Calendar className="w-4 h-4" />}
                label="활동"
                value={`${data.totalDays}일`}
                gradient="from-blue-400 to-cyan-500"
              />

              <StatCard
                icon={<Clock className="w-4 h-4" />}
                label="오늘"
                value={`${data.sessionsToday}회`}
                gradient="from-purple-400 to-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MiniInfoCard 
              label="평균 세션" 
              value={`${data.avgSessionLength}분`}
              icon="⏱️"
            />
            <MiniInfoCard 
              label="선호 시간" 
              value={data.bestTime}
              icon="🕐"
            />
            <MiniInfoCard 
              label="예상 페이지" 
              value={`${totalPages}쪽`}
              icon="📄"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-gray-800">작가 레벨</span>
              </div>
              <span className="text-sm font-bold text-amber-600">Lv.{Math.floor(data.totalWords / 1000)}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px] text-gray-600">
                <span>다음 레벨까지</span>
                <span className="font-bold">{1000 - (data.totalWords % 1000)} 단어</span>
              </div>
              <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                  style={{ width: `${(data.totalWords % 1000) / 10}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border border-yellow-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-gray-800">배지</span>
              </div>
              <span className="text-[9px] font-bold text-amber-600">{unlockedBadgesCount}/{data.badges.length}</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {data.badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className={`
                    relative p-1.5 rounded-lg text-center transition-all
                    ${
                      badge.unlocked
                        ? "bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-400"
                        : "bg-gray-50 border border-gray-200 opacity-40"
                    }
                  `}
                  title={badge.description}
                >
                  {badge.unlocked && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-[8px]">✓</span>
                    </div>
                  )}
                  <div className="text-lg mb-0.5">{badge.emoji}</div>
                  <p className="text-[8px] font-bold text-gray-800 leading-tight">{badge.name}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-center"
          >
            <p className="text-[9px] font-bold text-gray-800 leading-tight">{getEncouragement(data.totalWords, data.streak)}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  gradient,
  trend,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  trend?: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -1 }}
      className="relative p-2 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
    >
      {highlight && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-0.5 -right-0.5 text-sm"
        >
          ✨
        </motion.div>
      )}

      <div className={`inline-flex w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} items-center justify-center text-white mb-1.5 shadow`}>
        {icon}
      </div>

      <div className="space-y-0.5">
        <div className="text-base font-bold text-gray-800">{value}</div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-600 font-medium">{label}</span>
          {trend && (
            <span className="text-[8px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded-full">
              {trend}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MiniInfoCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="p-2 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-base">{icon}</span>
        <p className="text-[9px] text-gray-600 font-medium">{label}</p>
      </div>
      <p className="text-sm font-bold text-gray-800">{value}</p>
    </div>
  );
}

function getEncouragement(totalWords: number, streak: number): string {
  if (streak >= 30) {
    return "🏆 30일 연속! 진정한 작가의 길을 걷고 계시네요!";
  } else if (streak >= 14) {
    return "🔥 2주 연속! 습관이 자리잡고 있어요!";
  } else if (streak >= 7) {
    return "💪 일주일 달성! 멋진 루틴이에요!";
  } else if (totalWords >= 2000) {
    return "🎉 오늘 목표 달성! 최고예요!";
  } else if (totalWords >= 1000) {
    return "🌟 절반 넘었어요! 좋은 페이스네요!";
  } else if (totalWords >= 500) {
    return "🌱 좋은 시작이에요! 계속 나아가세요!";
  } else {
    return "✨ 첫 걸음을 내딛으셨네요! 함께 시작해봐요!";
  }
}

export default GrowthMetrics;