"use client";

import { motion } from "framer-motion";
import { CheckCircle, X } from "lucide-react";

interface AIResultPreviewProps {
  aiResult: string;
  onApply: () => void;
  onClose: () => void;
}

export function AIResultPreview({ aiResult, onApply, onClose }: AIResultPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-4 bg-moss/5 rounded-xl border-2 border-moss/30"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-moss" />
          <span className="text-xs font-medium text-moss">변경 후 미리보기</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="text-xs text-gray-800 leading-relaxed p-3 bg-white rounded-lg border border-moss/20 max-h-48 overflow-y-auto mb-2">
        {aiResult}
      </div>

      <button
        onClick={onApply}
        className="w-full py-2 bg-moss text-white rounded-lg hover:bg-moss/90 transition-all text-xs font-medium flex items-center justify-center gap-2"
      >
        <span>적용하기</span>
      </button>
    </motion.div>
  );
}