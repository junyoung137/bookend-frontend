import { useState, useCallback } from 'react';
import { Chapter } from '@/types/editor';

export interface VersionSnapshot {
  id: string;
  timestamp: Date;
  chapters: Chapter[];
  description: string;
}

const STORAGE_KEY = 'bookend_history';
const MAX_DAYS = 7;
const MAX_VERSIONS = 50;

/**
 * 버전 히스토리 관리 훅
 */
export const useVersionHistory = () => {
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);

  // 저장소에서 유효한 버전만 로드
  const loadVersions = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored) as VersionSnapshot[];
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - MAX_DAYS * 24 * 60 * 60 * 1000);

      // 최근 7일 + 최대 50개만 유지
      const filtered = parsed
        .filter(v => new Date(v.timestamp) > sevenDaysAgo)
        .slice(-MAX_VERSIONS);

      setVersions(filtered);
      return filtered;
    } catch (error) {
      console.error('버전 불러오기 실패:', error);
      return [];
    }
  }, []);

  // 새 버전 저장
  const saveVersion = useCallback((chapters: Chapter[], description: string = '') => {
    try {
      const currentVersions = versions.length > 0 ? versions : loadVersions();

      const newVersion: VersionSnapshot = {
        id: `v-${Date.now()}`,
        timestamp: new Date(),
        chapters: JSON.parse(JSON.stringify(chapters)), // Deep copy
        description: description || `자동 저장 - ${new Date().toLocaleTimeString('ko-KR')}`,
      };

      // 새 버전 추가 (최대 50개 유지)
      const updated = [...currentVersions, newVersion].slice(-MAX_VERSIONS);

      // 7일 이상 된 버전 제거
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - MAX_DAYS * 24 * 60 * 60 * 1000);
      const filtered = updated.filter(v => new Date(v.timestamp) > sevenDaysAgo);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      setVersions(filtered);

      console.log('✅ 버전 저장됨:', newVersion.id);
      return newVersion;
    } catch (error) {
      console.error('❌ 버전 저장 실패:', error);
      return null;
    }
  }, [versions, loadVersions]);

  // 특정 버전으로 복구
  const restoreVersion = useCallback((versionId: string): Chapter[] | null => {
    try {
      const version = versions.find(v => v.id === versionId);
      if (!version) {
        console.error('버전을 찾을 수 없습니다:', versionId);
        return null;
      }

      console.log('🔄 버전 복구:', version.id, version.description);
      return JSON.parse(JSON.stringify(version.chapters)); // Deep copy
    } catch (error) {
      console.error('❌ 버전 복구 실패:', error);
      return null;
    }
  }, [versions]);

  // 버전 삭제
  const deleteVersion = useCallback((versionId: string) => {
    try {
      const filtered = versions.filter(v => v.id !== versionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      setVersions(filtered);
      console.log('🗑️ 버전 삭제됨:', versionId);
    } catch (error) {
      console.error('❌ 버전 삭제 실패:', error);
    }
  }, [versions]);

  // 모든 버전 삭제
  const clearAllVersions = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setVersions([]);
      console.log('🗑️ 모든 버전 삭제됨');
    } catch (error) {
      console.error('❌ 모든 버전 삭제 실패:', error);
    }
  }, []);

  // 버전 포맷팅 (UI 표시용)
  const formatVersion = (version: VersionSnapshot) => {
    const now = new Date();
    const diff = now.getTime() - new Date(version.timestamp).getTime();
    const diffSeconds = Math.floor(diff / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeText = '';
    if (diffSeconds < 60) timeText = '방금 전';
    else if (diffMinutes < 60) timeText = `${diffMinutes}분 전`;
    else if (diffHours < 24) timeText = `${diffHours}시간 전`;
    else if (diffDays < 7) timeText = `${diffDays}일 전`;
    else timeText = new Date(version.timestamp).toLocaleDateString('ko-KR');

    // 총 단어 수 계산
    const totalWords = version.chapters.reduce((acc, chapter) => {
      const chapterWords = chapter.sections.reduce((sectionAcc, section) => {
        const div = document.createElement('div');
        div.innerHTML = section.content;
        const text = div.textContent || '';
        return sectionAcc + text.split(/\s+/).filter(Boolean).length;
      }, 0);
      return acc + chapterWords;
    }, 0);

    return {
      timeText,
      totalWords,
      totalChapters: version.chapters.length,
      totalSections: version.chapters.reduce((acc, c) => acc + c.sections.length, 0),
    };
  };

  return {
    versions,
    loadVersions,
    saveVersion,
    restoreVersion,
    deleteVersion,
    clearAllVersions,
    formatVersion,
  };
};