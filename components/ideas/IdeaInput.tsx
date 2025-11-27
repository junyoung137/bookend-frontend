"use client";

import { useState, KeyboardEvent } from "react";
import { Plus, Tag as TagIcon } from "lucide-react";
import { motion } from "framer-motion";

interface IdeaInputProps {
  onAdd: (text: string, tags: string[]) => void;
}

export const IdeaInput = ({ onAdd }: IdeaInputProps) => {
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onAdd(text, tags);
      setText("");
      setTags([]);
      setIsExpanded(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-moss/5 to-leaf/5 rounded-lg p-4 border border-moss/20"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {/* 텍스트 입력 */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyPress={handleKeyPress}
            placeholder="💡 떠오른 아이디어를 적어보세요... (⌘+Enter로 저장)"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss resize-none transition-all"
            rows={isExpanded ? 3 : 1}
          />

          {/* 확장된 입력 (태그 추가) */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-3"
            >
              {/* 태그 입력 */}
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="태그 추가 (Enter)"
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-moss"
                />
              </div>

              {/* 추가된 태그들 */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-moss text-white text-xs rounded-full cursor-pointer hover:bg-moss/80"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                      <span className="text-xs">×</span>
                    </span>
                  ))}
                </div>
              )}

              {/* 버튼들 */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    setText("");
                    setTags([]);
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim()}
                  className="px-4 py-1 text-sm bg-moss text-white rounded hover:bg-moss/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  저장
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* 빠른 추가 버튼 */}
        {!isExpanded && (
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="p-2 bg-moss text-white rounded-lg hover:bg-moss/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};