"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Search, Filter, X } from "lucide-react";
import { IdeaCard } from "./IdeaCard";
import { IdeaInput } from "./IdeaInput";
import { Idea } from "@/types/bookshelf";
import { getIdeas, addIdea, deleteIdea } from "@/lib/storage";

interface IdeaVaultProps {
  isOpen: boolean;
  onClose: () => void;
  onIdeaDrop?: (idea: Idea) => void;
}

export const IdeaVault = ({ isOpen, onClose, onIdeaDrop }: IdeaVaultProps) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setIdeas(getIdeas());
    }
  }, [isOpen]);

  const handleAddIdea = (text: string, tags: string[]) => {
    addIdea({ text, tags });
    setIdeas(getIdeas());
  };

  const handleDeleteIdea = (id: string) => {
    deleteIdea(id);
    setIdeas(getIdeas());
  };

  const handleDragStart = (idea: Idea) => {
    // 드래그 시작 시 데이터 저장
    if (onIdeaDrop) {
      localStorage.setItem('dragging_idea', JSON.stringify(idea));
    }
  };

  // 모든 태그 수집
  const allTags = Array.from(
    new Set(ideas.flatMap(idea => idea.tags))
  );

  // 필터링된 아이디어
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                        selectedTags.some(tag => idea.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-moss to-leaf rounded-lg">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">글감 저장소</h2>
                <p className="text-sm text-gray-600">
                  {ideas.length}개의 아이디어 · 드래그해서 에디터로 이동
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* 새 아이디어 입력 */}
          <IdeaInput onAdd={handleAddIdea} />
        </div>

        {/* 검색 & 필터 */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="아이디어 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
              />
            </div>
          </div>

          {/* 태그 필터 */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-500" />
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-moss text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 아이디어 리스트 */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredIdeas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">
                {ideas.length === 0
                  ? "아직 저장된 아이디어가 없습니다"
                  : "검색 결과가 없습니다"}
              </p>
              <p className="text-sm mt-2">
                {ideas.length === 0
                  ? "떠오르는 아이디어를 적어보세요"
                  : "다른 키워드로 검색해보세요"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredIdeas.map(idea => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onDelete={handleDeleteIdea}
                    onDragStart={handleDragStart}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};