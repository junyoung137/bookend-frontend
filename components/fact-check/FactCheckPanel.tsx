"use client";
import { useState } from "react";
import { Search, CheckCircle, AlertCircle, Loader2, ExternalLink, Lightbulb } from "lucide-react";

interface FactCheckPanelProps {
  selectedText: string;
}

interface FactCheckResult {
  isReliable: boolean;
  explanation: string;
  sources?: string[];
}

export function FactCheckPanel({ selectedText }: FactCheckPanelProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);

  const checkFact = async () => {
    if (!selectedText || selectedText.length < 10) {
      alert("최소 10자 이상의 텍스트를 선택해주세요");
      return;
    }
    setIsChecking(true);
    setResult(null);

    try {
      const response = await fetch('/api/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText })
      });
      if (!response.ok) throw new Error('API 요청 실패');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('사실 확인 실패:', error);
      alert('사실 확인 중 오류가 발생했습니다');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
      {/* 헤더: 돋보기 작게 + 제목 작게 */}
      <div className="flex items-center gap-1.5 mb-2">
        <Search className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold text-gray-800">사실 관계 확인</h3>
      </div>

      {/* 선택 전 안내 */}
      {(!selectedText || selectedText.length < 10) ? (
        <div className="text-center py-8">
          <p className="text-xs text-gray-500">
            텍스트를 드래그해 주세요 (최소 10자 이상)
          </p>
        </div>
      ) : (
        <>
          {/* 선택된 텍스트 미리보기 */}
          <div className="p-3 bg-blue-50 rounded-lg mb-3 text-sm text-gray-700 max-h-20 overflow-y-auto border border-blue-100">
            "{selectedText.slice(0, 200)}{selectedText.length > 200 ? '...' : ''}"
          </div>

          {/* 사실 확인 버튼 */}
          <button
            onClick={checkFact}
            disabled={isChecking}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium text-sm"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI가 확인 중...
              </>
            ) : (
              '사실 확인하기'
            )}
          </button>

          {/* 결과 표시 */}
          {result && (
            <div className={`mt-4 p-4 rounded-lg border-2 ${
              result.isReliable
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.isReliable ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-bold text-sm mb-1.5 ${
                    result.isReliable ? 'text-green-800' : 'text-amber-800'
                  }`}>
                    {result.isReliable ? '신뢰할 수 있는 내용입니다' : '확인이 필요합니다'}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {result.explanation}
                  </p>
                </div>
              </div>

              {/* 참고 자료 */}
              {result.sources && result.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" />
                    참고 자료
                  </p>
                  <div className="space-y-1">
                    {result.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline truncate"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {source.length > 50 ? source.slice(0, 50) + '...' : source}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 하단 설명: 11px 유지 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-[11px] text-gray-600 flex items-start gap-1.5 leading-relaxed">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Google Gemini AI</strong>가 선택한 텍스트의 사실 관계를 확인합니다. 
            통계, 역사적 사실, 과학 정보 등을 검증할 수 있습니다.
          </span>
        </p>
      </div>
    </div>
  );
}