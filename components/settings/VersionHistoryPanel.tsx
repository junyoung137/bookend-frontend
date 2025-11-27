"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { useVersionHistory, VersionSnapshot } from '@/hooks/useVersionHistory';
import { Chapter } from '@/types/editor';

interface VersionHistoryPanelProps {
  chapters: Chapter[];
  onRestore: (chapters: Chapter[]) => void;
}

export function VersionHistoryPanel({ chapters, onRestore }: VersionHistoryPanelProps) {
  const { versions, loadVersions, restoreVersion, deleteVersion, clearAllVersions, formatVersion } = useVersionHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadVersions();
  }, [loadVersions]);

  const handleRestore = (versionId: string) => {
    const restored = restoreVersion(versionId);
    if (restored) {
      setShowRestoreConfirm(null);
      onRestore(restored);
      
      // 성공 토스트
      showToast('✅ 버전이 복구되었습니다');
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    deleteVersion(versionId);
    showToast('🗑️ 버전이 삭제되었습니다');
  };

  const handleClearAll = () => {
    clearAllVersions();
    setShowDeleteAll(false);
    showToast('🗑️ 모든 버전이 삭제되었습니다');
  };

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-moss text-white px-4 py-2 rounded-lg shadow-lg z-[99999]';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  if (!mounted) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-moss" />
          <h4 className="text-sm font-semibold text-gray-800">
            버전 히스토리 ({versions.length}/50)
          </h4>
        </div>
        {versions.length > 0 && (
          <button
            onClick={() => setShowDeleteAll(true)}
            className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            모두 삭제
          </button>
        )}
      </div>

      {versions.length === 0 ? (
        <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm text-gray-600">
            저장된 버전이 없습니다.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            자동 저장이 활성화되면 버전이 기록됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* 역순으로 표시 (최신순) */}
          {[...versions].reverse().map((version) => {
            const info = formatVersion(version);
            const isExpanded = expandedId === version.id;

            return (
              <motion.div
                key={version.id}
                layout
                className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
              >
                {/* 헤더 */}
                <motion.button
                  onClick={() => setExpandedId(isExpanded ? null : version.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-left flex-1">
                    <div className="w-2 h-2 rounded-full bg-moss flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {version.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {info.timeText} · {info.totalWords}단어
                      </p>
                    </div>
                  </div>

                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 ml-2"
                  >
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </motion.div>
                </motion.button>

                {/* 상세 정보 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-200 bg-gray-50 px-4 py-3 space-y-3"
                    >
                      {/* 통계 */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-gray-500">챕터</p>
                          <p className="text-sm font-bold text-gray-800">
                            {info.totalChapters}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">섹션</p>
                          <p className="text-sm font-bold text-gray-800">
                            {info.totalSections}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">단어</p>
                          <p className="text-sm font-bold text-gray-800">
                            {info.totalWords}
                          </p>
                        </div>
                      </div>

                      {/* 시간 표시 */}
                      <div className="bg-white rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-600">
                          {new Date(version.timestamp).toLocaleString('ko-KR')}
                        </p>
                      </div>

                      {/* 버튼 */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setShowRestoreConfirm(version.id)}
                          className="flex-1 py-2 bg-moss hover:bg-moss/90 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          복구하기
                        </button>
                        <button
                          onClick={() => handleDeleteVersion(version.id)}
                          className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          삭제
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 복구 확인 모달 */}
      <AnimatePresence>
        {showRestoreConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ zIndex: 100000 }}
            onClick={() => setShowRestoreConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">버전 복구</h3>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                이 버전으로 복구하면 현재 작업 내용이 <span className="font-semibold">덮어씌워집니다</span>. 정말 진행하시겠어요?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRestoreConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                >
                  취소
                </button>
                <button
                  onClick={() => handleRestore(showRestoreConfirm)}
                  className="flex-1 px-4 py-2.5 bg-moss hover:bg-moss/90 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  복구하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 모두 삭제 확인 모달 */}
      <AnimatePresence>
        {showDeleteAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ zIndex: 100000 }}
            onClick={() => setShowDeleteAll(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">모든 버전 삭제</h3>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                모든 버전 히스토리가 <span className="font-semibold">영구적으로 삭제</span>됩니다. 복구할 수 없습니다.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteAll(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                >
                  취소
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}