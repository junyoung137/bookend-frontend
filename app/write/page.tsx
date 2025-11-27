"use client";
import { useState } from "react";
import { BookshelfView } from "@/components/bookshelf/BookshelfView";
import { EditorWithAI } from "@/components/editor/EditorWithAI";
import { Section } from "@/types/editor";

export default function WritePage() {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([
    { id: "1", content: "", order: 0 }
  ]);

  return (
    <div>
      {!selectedBookId ? (
        <BookshelfView onBookSelect={setSelectedBookId} />
      ) : (
        <EditorWithAI
          sections={sections}
          onSectionsChange={setSections}
          chapterTitle="Chapter 1"
        />
      )}
    </div>
  );
}
