"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Settings as SettingsIcon, Save, Clock } from "lucide-react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { Chapter } from "@/types/editor";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters?: Chapter[];
  onRestoreVersion?: (chapters: Chapter[]) => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

interface AppSettings {
  autoSave: boolean;
  autoSaveInterval: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoSave: true,
  autoSaveInterval: 30,
};

type TabType = 'settings' | 'history';

export function SettingsModal({ 
  isOpen, 
  onClose, 
  chapters = [],
  onRestoreVersion,
  buttonRef
}: SettingsModalProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [position, setPosition] = useState({ top: 100, right: 20 });
  const menuRef = useRef<HTMLDivElement>(null);
  const isOpeningRef = useRef(false);

  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const newPosition = {
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      };
      setPosition(newPosition);
    }
  }, [isOpen, buttonRef]);

  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem('bookend_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({
            autoSave: parsed.autoSave ?? true,
            autoSaveInterval: parsed.autoSaveInterval ?? 30,
          });
        } catch (error) {
          console.error('설정 불러오기 실패:', error);
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      isOpeningRef.current = true;
      const timer = setTimeout(() => {
        isOpeningRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpeningRef.current) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (!isSaving) onClose();
      }
    };

    if (isOpen) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 150);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose, isSaving]);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('bookend_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('storage'));
    
    setTimeout(() => {
      setIsSaving(false);
      showToast('✅ 설정이 저장되었습니다');
      onClose();
    }, 500);
  };

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-moss text-white px-4 py-2 rounded-lg shadow-lg z-[99999]';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const handleAutoSaveToggle = () => {
    setSettings({ ...settings, autoSave: !settings.autoSave });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed"
      style={{ 
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        pointerEvents: 'none' // 기존 구조 유지
      }}
    >
      <div
        ref={menuRef}
        className="absolute bg-[#f8f9fa] rounded-lg shadow-2xl border border-gray-300 overflow-hidden flex flex-col"
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
          width: '480px',
          maxHeight: 'calc(100vh - 120px)',
          pointerEvents: 'auto', // ← 추가된 핵심 코드
          zIndex: 100000
        }}
      >
        {/* 헤더 */}
        <div className="bg-[#e9ecef] border-b border-gray-300 px-5 py-3.5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-moss to-leaf rounded-lg">
                <SettingsIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">설정</h3>
                <p className="text-xs text-gray-600">앱 환경을 설정하세요</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="p-1.5 hover:bg-gray-300 rounded transition-colors disabled:opacity-50"
              title="닫기"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-300 bg-[#e9ecef] px-5 flex-shrink-0">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'text-moss border-moss'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              <span>일반 설정</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'text-moss border-moss'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>버전 히스토리</span>
            </div>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto bg-[#f8f9fa]">
          <AnimatePresence mode="wait">
            {activeTab === 'settings' ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-5 space-y-5"
              >
                {/* 언어 설정 */}
                <div className="p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-moss" />
                    <h4 className="text-sm font-semibold text-gray-800">언어 설정</h4>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">표시 언어를 선택하세요</p>
                    <div style={{ position: 'relative', zIndex: 100001 }}>
                      <LanguageToggle />
                    </div>
                  </div>
                </div>

                {/* 자동 저장 */}
                <div className="p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Save className="w-4 h-4 text-moss" />
                    <h4 className="text-sm font-semibold text-gray-800">자동 저장</h4>
                  </div>
                  
                  <button
                    onClick={handleAutoSaveToggle}
                    className="w-full flex items-center justify-between mb-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <p className="text-sm text-gray-600 font-medium">자동 저장 사용</p>
                    <div
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        settings.autoSave ? 'bg-moss' : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.autoSave ? 28 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                      />
                    </div>
                  </button>

                  {settings.autoSave && (
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      <label className="text-sm font-medium text-gray-700">
                        저장 간격: <span className="text-moss font-bold">{settings.autoSaveInterval}초</span>
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="120"
                        step="10"
                        value={settings.autoSaveInterval}
                        onChange={(e) => setSettings({ ...settings, autoSaveInterval: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-moss"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>10초</span>
                        <span>120초</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <VersionHistoryPanel 
                  chapters={chapters}
                  onRestore={(restoredChapters) => {
                    onRestoreVersion?.(restoredChapters);
                    onClose();
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 하단 버튼 */}
        {activeTab === 'settings' && (
          <div className="bg-[#e9ecef] border-t border-gray-300 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-gray-500 font-medium">Editor v1.0</p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                isSaving 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-moss hover:bg-moss/90 text-white shadow-sm'
              }`}
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
