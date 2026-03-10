"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBook } from "@/app/lib/book-actions";

interface DeleteBookButtonProps {
  bookId: string;
  bookTitle: string;
  onDeleted?: () => void;
}

export function DeleteBookButton({ bookId, bookTitle, onDeleted }: DeleteBookButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteBook(bookId);
      setShowConfirm(false);
      onDeleted?.();
      router.refresh();
    } catch {
      setError("Impossibile eliminare il libro. Riprova.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
        <p className="text-xs text-red-400 mb-3 font-medium text-center">
          Sei sicuro di voler eliminare <strong>{bookTitle}</strong>?<br/>
          L&apos;azione è irreversibile.
        </p>
        {error && (
          <p className="text-xs text-red-400 mb-2 text-center font-medium">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-2 text-xs font-bold uppercase bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            {isDeleting ? "Elimino..." : "Elimina"}
          </button>
          <button
            onClick={() => { setShowConfirm(false); setError(null); }}
            disabled={isDeleting}
            className="flex-1 py-2 text-xs font-bold uppercase bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Annulla
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-[10px] font-bold uppercase opacity-40 hover:opacity-100 hover:text-red-400 transition-all py-2"
    >
      Elimina libro
    </button>
  );
}
