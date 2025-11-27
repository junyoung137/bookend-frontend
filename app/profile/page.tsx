// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Settings, Award, TrendingUp, Calendar, Mail } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState({
    name: "사용자",
    email: "user@bookend.com",
    joinDate: "2024년 1월",
    totalWords: 125000,
    totalDays: 45,
    streak: 7,
    badges: [
      { id: 1, name: "첫 걸음", emoji: "🌱", description: "첫 글 작성" },
      { id: 2, name: "꾸준함", emoji: "🔥", description: "7일 연속 기록" },
      { id: 3, name: "작가", emoji: "✍️", description: "10만 단어 돌파" },
    ],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-morning via-noon to-afternoon 
                 dark:from-night dark:via-night/95 dark:to-night/90 transition-colors duration-500"
    >
      {/* ───── Header ───── */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20 dark:border-white/10">
        <nav className="container mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-moss to-leaf 
                         flex items-center justify-center group-hover:scale-110 transition-transform"
            >
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Bookend
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg text-sm font-medium 
                         text-gray-700 dark:text-gray-300 
                         hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
            >
              대시보드
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* ───── Main Content ───── */}
      <main className="pt-20 pb-16 px-6">
        <div className="container mx-auto max-w-5xl">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 border border-white/50 dark:border-white/10 mb-8"
          >
            <div className="flex items-start justify-between">
              {/* ─ Avatar & Info ─ */}
              <div className="flex items-start space-x-6">
                <div
                  className="w-24 h-24 rounded-2xl bg-gradient-to-br from-bloom to-sky 
                             flex items-center justify-center shadow-lg"
                >
                  <User className="w-12 h-12 text-white" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {profile.name}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{profile.email}</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{profile.joinDate} 가입</span>
                    </span>
                  </div>

                  {/* ─ Quick Stats ─ */}
                  <div className="flex items-center space-x-6">
                    <StatBlock label="총 단어" value={profile.totalWords.toLocaleString()} />
                    <StatBlock label="활동 일수" value={profile.totalDays} />
                    <StatBlock label="연속 기록" value={`${profile.streak} 🔥`} />
                  </div>
                </div>
              </div>

              {/* Settings Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-lg glass border border-white/20 
                           hover:border-moss/50 transition-all 
                           flex items-center justify-center"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
            </div>
          </motion.div>

          {/* ───── Badges Section ───── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 border border-white/50 dark:border-white/10 mb-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Award className="w-6 h-6 text-moss" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">획득한 배지</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile.badges.map((badge, index) => (
                <BadgeCard key={badge.id} badge={badge} index={index} />
              ))}
            </div>
          </motion.div>

          {/* ───── Stats Section ───── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 border border-white/50 dark:border-white/10"
          >
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="w-6 h-6 text-moss" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">성장 통계</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatItem label="평균 세션 길이" value="45분" trend="+12%" />
              <StatItem label="일일 평균 단어" value="2,778" trend="+8%" />
              <StatItem label="가장 생산적인 시간" value="오전 9-11시" />
              <StatItem label="선호하는 글 스타일" value="설명적, 간결함" />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────
   Components
───────────────────────────── */

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-500">{label}</p>
    </div>
  );
}

function BadgeCard({ badge, index }: { badge: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      className="p-4 rounded-xl bg-white/60 dark:bg-white/5 
                 border border-gray-200/50 dark:border-gray-700/50 
                 hover:border-moss/50 transition-all text-center"
    >
      <div className="text-4xl mb-2">{badge.emoji}</div>
      <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{badge.name}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">{badge.description}</p>
    </motion.div>
  );
}

function StatItem({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</p>
      <div className="flex items-baseline space-x-2">
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        {trend && <span className="text-sm text-green-600 dark:text-green-400">{trend}</span>}
      </div>
    </div>
  );
}
