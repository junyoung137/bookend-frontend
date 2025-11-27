// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Activity,
  BarChart3,
  Zap,
  FileText,
  Edit,
  CheckCircle,
  Target,
  Award
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// ===== ActivityChart 컴포넌트 =====
const mockChartData = [
  { date: "11/05", words: 420 },
  { date: "11/06", words: 380 },
  { date: "11/07", words: 890 },
  { date: "11/08", words: 650 },
  { date: "11/09", words: 720 },
  { date: "11/10", words: 1100 },
  { date: "11/11", words: 950 },
];

function ActivityChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/50 dark:border-white/10"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
          주간 활동
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          최근 7일간 작성한 단어 수
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={mockChartData}>
          <defs>
            <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7A9B76" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7A9B76" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "1px solid rgba(122, 155, 118, 0.3)",
              borderRadius: "12px",
              padding: "8px 12px",
            }}
            labelStyle={{ fontWeight: "bold", color: "#374151" }}
          />
          <Area
            type="monotone"
            dataKey="words"
            stroke="#7A9B76"
            strokeWidth={3}
            fill="url(#colorWords)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">평균</p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {Math.round(mockChartData.reduce((sum, d) => sum + d.words, 0) / mockChartData.length)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">최고</p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {Math.max(...mockChartData.map((d) => d.words))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">합계</p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {mockChartData.reduce((sum, d) => sum + d.words, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ===== GrowthMetrics 컴포넌트 =====
function GrowthMetrics() {
  const metrics = [
    {
      icon: <Target className="w-5 h-5" />,
      label: "일일 목표",
      current: 1247,
      target: 2000,
      unit: "단어",
      color: "from-moss to-leaf",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "월간 성장",
      current: 87,
      target: 100,
      unit: "%",
      color: "from-sky to-water",
    },
    {
      icon: <Award className="w-5 h-5" />,
      label: "주간 목표",
      current: 5,
      target: 7,
      unit: "일",
      color: "from-seed to-bloom",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/50 dark:border-white/10 h-full"
    >
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6">
        성장 지표
      </h3>

      <div className="space-y-6">
        {metrics.map((metric, index) => (
          <MetricProgress key={index} metric={metric} delay={index * 0.1} />
        ))}
      </div>
    </motion.div>
  );
}

function MetricProgress({ metric, delay }: { metric: any; delay: number }) {
  const percentage = (metric.current / metric.target) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`
            w-8 h-8 rounded-lg bg-gradient-to-br ${metric.color} 
            flex items-center justify-center text-white
          `}>
            {metric.icon}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {metric.label}
          </span>
        </div>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
          {percentage.toFixed(0)}%
        </span>
      </div>

      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 1, delay: delay + 0.2 }}
          className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
        />
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {metric.current} / {metric.target} {metric.unit}
        </span>
      </div>
    </motion.div>
  );
}

// ===== RecentActivity 컴포넌트 =====
const mockActivities = [
  {
    id: 1,
    type: "write",
    title: "새로운 글 작성",
    description: "1,200단어 작성 완료",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    icon: <Edit className="w-4 h-4" />,
    color: "from-moss to-leaf",
  },
  {
    id: 2,
    type: "complete",
    title: "목표 달성",
    description: "일일 목표 2,000단어 달성",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    icon: <CheckCircle className="w-4 h-4" />,
    color: "from-seed to-bloom",
  },
  {
    id: 3,
    type: "document",
    title: "문서 저장",
    description: "자연스러운 글쓰기 여정.md",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    icon: <FileText className="w-4 h-4" />,
    color: "from-sky to-water",
  },
  {
    id: 4,
    type: "session",
    title: "세션 시작",
    description: "오전 글쓰기 세션",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    icon: <Clock className="w-4 h-4" />,
    color: "from-bloom to-sky",
  },
];

function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/50 dark:border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          최근 활동
        </h3>
        <button className="text-sm text-moss hover:text-leaf transition-colors">
          모두 보기 →
        </button>
      </div>

      <div className="space-y-4">
        {mockActivities.map((activity, index) => (
          <ActivityItem key={activity.id} activity={activity} index={index} />
        ))}
      </div>
    </motion.div>
  );
}

function ActivityItem({ activity, index }: { activity: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ x: 4 }}
      className="flex items-start space-x-4 p-4 rounded-xl 
               hover:bg-white/60 dark:hover:bg-white/5 
               transition-all duration-200 cursor-pointer group"
    >
      <div className={`
        w-10 h-10 rounded-lg bg-gradient-to-br ${activity.color} 
        flex items-center justify-center text-white flex-shrink-0
        group-hover:scale-110 transition-transform
      `}>
        {activity.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 dark:text-gray-100 mb-1">
          {activity.title}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {activity.description}
        </p>
      </div>

      <span className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">
        {formatDistanceToNow(activity.timestamp, {
          addSuffix: true,
          locale: ko,
        })}
      </span>
    </motion.div>
  );
}

// ===== Main Dashboard Page =====
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalWords: 12470,
    weeklyGrowth: 23,
    activeStreak: 7,
    sessionsThisWeek: 14,
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
    <div className="min-h-screen bg-gradient-to-br from-morning via-noon to-afternoon 
                    dark:from-night dark:via-night/95 dark:to-night/90 transition-colors duration-500">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20 dark:border-white/10">
        <nav className="container mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-moss to-leaf 
                          flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <span className="text-lg font-bold text-gray-800 dark:text-gray-100 
                           group-hover:text-moss transition-colors">
              Bookend
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              href="/editor"
              className="px-4 py-2 rounded-lg text-sm font-medium 
                       text-gray-700 dark:text-gray-300 
                       hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
            >
              에디터
            </Link>
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bloom to-sky 
                          flex items-center justify-center cursor-pointer
                          hover:scale-110 transition-transform">
              <span className="text-white text-sm font-bold">U</span>
            </div>
          </div>
        </nav>
      </header>

      <main className="pt-20 pb-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              대시보드 📊
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              당신의 글쓰기 여정을 한눈에
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="총 작성 단어"
              value={stats.totalWords.toLocaleString()}
              change="+12%"
              color="from-moss to-leaf"
            />
            <StatCard
              icon={<Calendar className="w-6 h-6" />}
              label="연속 기록"
              value={`${stats.activeStreak}일`}
              highlight
              color="from-seed to-bloom"
            />
            <StatCard
              icon={<Zap className="w-6 h-6" />}
              label="주간 성장"
              value={`+${stats.weeklyGrowth}%`}
              change="지난주 대비"
              color="from-sky to-water"
            />
            <StatCard
              icon={<Activity className="w-6 h-6" />}
              label="이번 주 세션"
              value={`${stats.sessionsThisWeek}회`}
              color="from-bloom to-sky"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <ActivityChart />
            </div>
            <div>
              <GrowthMetrics />
            </div>
          </div>

          <RecentActivity />
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  change,
  highlight = false,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  highlight?: boolean;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`
        glass rounded-2xl p-6 border transition-all duration-300
        ${
          highlight
            ? "border-seed/50 bg-gradient-to-br from-seed/10 to-bloom/10"
            : "border-white/50 dark:border-white/10 hover:border-moss/50"
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`
          w-12 h-12 rounded-xl bg-gradient-to-br ${color} 
          flex items-center justify-center text-white
        `}>
          {icon}
        </div>
        {highlight && (
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-2xl"
          >
            ✨
          </motion.span>
        )}
      </div>
      
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        {change && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{change}</p>
        )}
      </div>
    </motion.div>
  );
}