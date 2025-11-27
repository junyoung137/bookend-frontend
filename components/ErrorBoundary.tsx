"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { Chapter } from '@/types/editor';
import { handleExport } from '@/utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

type ExportFormat = 'pdf' | 'word' | 'markdown';
type ExportScope = 'single' | 'all';

export function ExportModal({ isOpen, onClose, chapters, buttonRef }: ExportModalProps) {
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
  const [exportScope, setExportScope] = useState<ExportScope>('all');
  const [selectedChapters, setSelectedChapters] = useState<string[]>(chapters.map(ch => ch.id));
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // 디버깅 로그
  useEffect(() => {
    console.log('🔴 ExportModal rendered');
    console.log('🔴 isOpen:', isOpen);
    console.log('🔴 chapters:', chapters);
    console.log('🔴 buttonRef:', buttonRef);
    console.log('🔴 buttonRef.current:', buttonRef?.current);
  }, [isOpen, chapters, buttonRef]);

  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const newPosition = {
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      };
      console.log('🟢 Position calculated:', newPosition);
      console.log('🟢 Button rect:', rect);
      setPosition(newPosition);
    } else {
      console.log('🔴 Position not calculated - isOpen:', isOpen, 'buttonRef?.current:', buttonRef?.current);
    }
  }, [isOpen, buttonRef]);

  useEffect(() => {
    if (isOpen) {
      setSelectedChapters(chapters.map(ch => ch.id));
    }
  }, [isOpen, chapters]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (!isExporting) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, isExporting]);

  const handleToggleChapter = (chapterId: string) => {
    setSelectedChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleSelectAll = () => {
    setSelectedChapters(chapters.map(ch => ch.id));
  };

  const handleDeselectAll = () => {
    setSelectedChapters([]);
  };

  const handleExportClick = async () => {
    if (!projectTitle.trim()) {
      setError('프로젝트 제목을 입력해주세요.');
      return;
    }

    if (selectedChapters.length === 0) {
      setError('최소 1개 이상의 챕터를 선택해주세요.');
      return;
    }

    setError(null);
    setIsExporting(true);
    setSuccess(false);

    try {
      await handleExport({
        title: projectTitle.trim(),
        chapters,
        selectedChapters,
        format: selectedFormat,
        includeMetadata,
      });

      setSuccess(true);
      
      setTimeout(() => {
        setIsExporting(false);
        setSuccess(false);
        onClose();
        setProjectTitle('');
        setSelectedFormat('markdown');
        setExportScope('all');
        setSelectedChapters(chapters.map(ch => ch.id));
        setIncludeMetadata(true);
      }, 1500);
    } catch (err: any) {
      setError(err.message || '내보내기 중 오류가 발생했습니다.');
      setIsExporting(false);
      setSuccess(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
      setError(null);
      setSuccess(false);
    }
  };

  console.log('🟡 About to check if isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('🔴 Not rendering - isOpen is false');
    return null;
  }

  console.log('🟢 Rendering modal with position:', position);

  return (
    <div 
      className="fixed inset-0"
      style={{ 
        zIndex: 99999,
        pointerEvents: 'none',
        border: '3px solid red' // 디버깅용
      }}
    >
      <div
        ref={menuRef}
        className="absolute bg-[#f8f9fa] rounded-lg shadow-2xl border-4 border-green-500"
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
          width: '380px',
          maxHeight: 'calc(100vh - 100px)',
          pointerEvents: 'auto',
          zIndex: 100000
        }}
      >
        {/* 헤더 */}
        <div className="bg-[#e9ecef] px-5 py-3.5 flex items-center justify-between border-b border-gray-300">
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-gray-700" />
            <h3 className="font-semibold text-gray-800 text-base">내보내기 TEST</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="p-1.5 hover:bg-gray-300 rounded transition-colors disabled:opacity-50"
            title="닫기"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-5 space-y-4">
          <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
            <p className="text-sm font-bold">디버깅 정보:</p>
            <p className="text-xs">Position: top={position.top}px, right={position.right}px</p>
            <p className="text-xs">Chapters: {chapters.length}개</p>
            <p className="text-xs">isOpen: {String(isOpen)}</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-red-800 font-medium">{error}</span>
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-800 font-semibold">내보내기 완료!</span>
            </div>
          )}

          {/* 프로젝트 제목 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              제목 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="예: 나의 소설"
              disabled={isExporting}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
          </div>

          {/* 파일 형식 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              파일 형식
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['pdf', 'word', 'markdown'] as ExportFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  disabled={isExporting}
                  className={`py-3 px-2 rounded text-xs font-semibold transition-all border flex flex-col items-center gap-1.5 disabled:cursor-not-allowed ${
                    selectedFormat === format
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <span className="text-xl">
                    {format === 'pdf' && '📄'}
                    {format === 'word' && '📝'}
                    {format === 'markdown' && '📋'}
                  </span>
                  <span className="text-[11px] font-bold">
                    {format === 'pdf' && 'PDF'}
                    {format === 'word' && 'Word'}
                    {format === 'markdown' && 'Markdown'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 범위 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              내보내기 범위
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setExportScope('all');
                  handleSelectAll();
                }}
                disabled={isExporting}
                className={`flex-1 py-2.5 px-3 rounded text-sm font-semibold transition-all border disabled:cursor-not-allowed ${
                  exportScope === 'all'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                전체 챕터
              </button>
              <button
                onClick={() => setExportScope('single')}
                disabled={isExporting}
                className={`flex-1 py-2.5 px-3 rounded text-sm font-semibold transition-all border disabled:cursor-not-allowed ${
                  exportScope === 'single'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                선택
              </button>
            </div>
          </div>

          {/* 메타데이터 */}
          <div className="p-3 bg-white rounded border border-gray-300 flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              disabled={isExporting}
              className="w-4 h-4 rounded accent-blue-600 disabled:cursor-not-allowed"
            />
            <span className="text-xs font-medium text-gray-700">작성일, 글자 수 등 메타데이터 포함</span>
          </div>
        </div>

        {/* 푸터 */}
        <div className="bg-[#e9ecef] border-t border-gray-300 px-5 py-3.5 flex gap-2.5">
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="flex-1 py-2.5 px-4 rounded border border-gray-400 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-100 hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleExportClick}
            disabled={isExporting || success}
            className="flex-1 py-2.5 px-4 rounded bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {success ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>완료!</span>
              </>
            ) : isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>내보내는 중...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>내보내기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}