"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { QualityScore as QualityScoreType } from "@/utils/scoreCalculation";

interface QualityScoreProps {
  score: QualityScoreType;
  index: number;
  isTransforming: boolean;
  expandedType: 'refine' | 'tone' | 'expand' | null;
  onTransform: (type: 'refine' | 'tone' | 'expand') => void;
}

export function QualityScore({ 
  score, 
  index, 
  isTransforming, 
  expandedType,
  onTransform 
}: QualityScoreProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 bg-white/60 rounded-xl border border-gray-200 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{score.icon}</span>
          <div>
            <div className="text-sm font-semibold text-gray-800">{score.label}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">{score.score}%</div>
        </div>
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score.score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${score.color} rounded-full`}
        />
      </div>

      <p className="text-xs text-gray-600 mt-2 mb-3">
        {score.description}
      </p>

      <button
        onClick={() => onTransform(score.type)}
        disabled={isTransforming}
        className="w-full px-3 py-2 bg-gradient-to-r from-moss to-leaf text-white rounded-lg hover:shadow-md transition-all text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isTransforming && expandedType === score.type ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>AI 분석 중...</span>
          </>
        ) : (
          <span>AI 내용 살펴보기</span>
        )}
      </button>
    </motion.div>
  );
}