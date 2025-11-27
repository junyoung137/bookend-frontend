"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type FeedbackChoice = "positive" | "negative";

interface FeedbackButtonsProps {
  userId: string;
  originalText: string;
  correctedText: string;
  feature: "Paraphrase" | "ToneAdjust" | "Expand";
  tone?: string;
  genre?: string;
  complexity?: string;
  recommendationScore?: number;
}

export function FeedbackButtons(props: FeedbackButtonsProps) {
  const {
    userId,
    originalText,
    correctedText,
    feature,
    tone,
    genre,
    complexity,
    recommendationScore,
  } = props;

  const [sending, setSending] = useState(false);
  const [choice, setChoice] = useState<FeedbackChoice | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  // 피드백 전송 함수
  async function sendFeedback(feedback: FeedbackChoice) {
    if (sending) return;
    setSending(true);
    setChoice(feedback);
    setMessage(null);

    try {
      const resp = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          originalText,
          correctedText,
          feature,
          feedback: feedback === "positive" ? "만족" : "불만족",
          tone,
          genre,
          complexity,
          recommendationScore,
        }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data.success) {
        console.error("❌ Feedback error:", resp.status, data);
        setMessage("저장에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      setMessage("소중한 의견 감사합니다. ☺️");
      
      // 3초 후 페이드아웃
      setTimeout(() => {
        setVisible(false);
      }, 3000);

    } catch (err) {
      console.error("❌ Feedback request failed:", err);
      setMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="mt-2 pt-2 border-t border-gray-200 overflow-hidden"
        >
          {message ? (
            // ✅ 감사 메시지만 표시
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-1 text-[11px] text-gray-600"
            >
              {message}
            </motion.div>
          ) : (
            // ✅ 피드백 버튼 표시
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-1 text-xs text-gray-700">
                도움이 되었나요? ☺️
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => sendFeedback("positive")}
                  disabled={sending}
                  className={`px-2 py-1 rounded-md border text-xs flex items-center gap-1 ${
                    choice === "positive"
                      ? "bg-emerald-100 border-emerald-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  } disabled:opacity-60`}
                >
                  👍 <span>좋았어요</span>
                </button>
                <button
                  onClick={() => sendFeedback("negative")}
                  disabled={sending}
                  className={`px-2 py-1 rounded-md border text-xs flex items-center gap-1 ${
                    choice === "negative"
                      ? "bg-rose-100 border-rose-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  } disabled:opacity-60`}
                >
                  👎 <span>별로였어요</span>
                </button>
                {sending && (
                  <span className="text-[10px] text-gray-500">전송 중...</span>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}