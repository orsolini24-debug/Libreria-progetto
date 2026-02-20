/**
 * DeleteButton — Client Component
 *
 * Usa useTransition invece di useFormState perché deleteBook non ha uno
 * stato di errore da mostrare inline: in caso di errore il revalidate
 * non avviene e la lista rimane invariata (comportamento accettabile).
 *
 * useTransition marca il Server Action call come "non urgente": React può
 * interrompere il rendering in corso e mostrare isPending = true senza
 * bloccare l'UI (concurrent features).
 */
"use client";

import { useTransition } from "react";
import { deleteBook } from "@/app/lib/book-actions";

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => deleteBook(id))}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
      aria-label="Elimina libro"
    >
      {isPending ? "..." : "Elimina"}
    </button>
  );
}
