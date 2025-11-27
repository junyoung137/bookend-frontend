// components/dashboard/ActivityChart.tsx
"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const mockData = [
  { date: "11/05", words: 420 },
  { date: "11/06", words: 380 },
  { date: "11/07", words: 890 },
  { date: "11/08", words: 650 },
  { date: "11/09", words: 720 },
  { date: "11/10", words: 1100 },
  { date: "11/11", words: 950 },
];

export function ActivityChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/50 dark:border-white/10"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
          ì£¼ê°„ í™œë™
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ìµœê·¼ 7ì¼ê°„ ìž‘ì„±í•œ ë‹¨ì–´ ìˆ˜
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={mockData}>
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

      {/* Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">í‰ê· </p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {Math.round(mockData.reduce((sum, d) => sum + d.words, 0) / mockData.length)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">ìµœê³ </p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {Math.max(...mockData.map((d) => d.words))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">í•©ê³„</p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {mockData.reduce((sum, d) => sum + d.words, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}