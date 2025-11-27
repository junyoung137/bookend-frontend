"use client";

import { motion } from "framer-motion";
import { Trash2, Tag, Calendar, ArrowRight } from "lucide-react";
import { Idea } from "@/types/bookshelf";
import { format } from "date-fns";

interface IdeaCardProps {
  idea: Idea;
  onDelete: (id: string) => void;
  onDragStart: (idea: Idea) => void;
}

export const IdeaCard = ({ idea, onDelete, onDragStart }: IdeaCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      draggable
      onDragStart={() => onDragStart(idea)}
      className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-move"
    >
      {/* 드래그 인디케이터 */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-moss opacity-0 group-hover:opacity-100 transition-opacity rounded-l-lg" />
      
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* 아이디어 텍스트 */}
          <p className="text-gray-800 leading-relaxed mb-3 break-words">
            {idea.text}
          </p>
          
          {/* 태그들 */}
          {idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {idea.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-moss/10 text-moss text-xs rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* 날짜 */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(idea.createdAt), "yyyy-MM-dd")}</span>
          </div>
        </div>

        {/* 삭제 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(idea.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>

      {/* 드래그 힌트 */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-50 transition-opacity">
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>
    </motion.div>
  );
};