"use client";

import { BookshelfView } from "@/components/bookshelf/BookshelfView";
import { useRouter } from "next/navigation";

export default function BookshelfPage() {
  const router = useRouter();

  return (
    <BookshelfView 
      onBookSelect={(id) => {
        console.log('📚 Selected book:', id);
        router.push('/editor');
      }} 
    />
  );
}