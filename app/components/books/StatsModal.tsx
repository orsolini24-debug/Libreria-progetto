"use client";

import { useEffect } from "react";
import Image from "next/image";
import { RatingDisplay } from "./StarRating";
import { STATUS_LABELS } from "@/app/lib/constants";
import type { Book } from "@/app/generated/prisma/client";

const YEAR = new Date().getFullYear();

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  TO_READ:  { bg: "color-mix(in srgb,#78716c 12%,var(--bg-elevated))", text: "#a8a29e", border: "color-mix(in srgb,#78716c 30%,transparent)" },
  READING:  { bg: "color-mix(in srgb,#3b82f6 12%,var(--bg-elevated))", text: "#93c5fd", border: "color-mix(in srgb,#3b82f6 30%,transparent)" },
  READ:     { bg: "color-mix(in srgb,#10b981 12%,var(--bg-elevated))", text: "#6ee7b7", border: "color-mix(in srgb,#10b981 30%,transparent)" },
  WISHLIST: { bg: "color-mix(in srgb,#8b5cf6 12%,var(--bg-elevated))", text: "#c4b5fd", border: "color-mix(in srgb,#8b5cf6 30%,transparent)" },
};

interface Props {
  books: Book[];
  filter: string;         // status key o "year" per libri letti nell'anno
  onClose: () => void;
  onBookClick: (b: Book) => void;
}

export function StatsModal({ books, filter, onClose, onBookClick }: Props) {
  // Chiude con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Filtra i libri
  let filtered: Book[];
  let title: string;
  let subtitle: string;

  if (filter === "year") {
    filtered = books.filter((b) => {
      if (b.status !== "READ") return false;
      const d = b.finishedAt ?? b.updatedAt;
      return new Date(d).getFullYear() === YEAR;
    });
    title    = `Libri letti nel ${YEAR}`;
    subtitle = `${filtered.length} libr${filtered.length === 1 ? "o" : "i"}`;
  } else {
    filtered = books.filter((b) => b.status === filter);
    title    = STATUS_LABELS[filter] ?? filter;
    subtitle = `${filtered.length} libr${filtered.length === 1 ? "o" : "i"}`;
  }

  // Statistiche aggregate per la vista "READ"
  const ratedBooks = filtered.filter((b) => b.rating != null && b.rating > 0);
  const avgRating  = ratedBooks.length > 0
    ? (ratedBooks.reduce((s, b) => s + (b.rating ?? 0), 0) / ratedBooks.length).toFixed(1)
    : null;
  const totalPages = filtered
    .filter((b) => b.pageCount != null)
    .reduce((s, b) => s + (b.pageCount ?? 0), 0);

  const colors = STATUS_COLORS[filter] ?? STATUS_COLORS.READ;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--bg-card)", border: `1px solid ${colors.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b shrink-0"
          style={{ borderColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
          <div>
            <h2 className="font-display text-lg font-bold" style={{ color: "var(--fg-primary)" }}>{title}</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-subtle)" }}>{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-lg leading-none transition-colors"
            style={{ color: "var(--fg-subtle)" }}>✕</button>
        </div>

        {/* Aggregate stats (solo per READ) */}
        {(filter === "READ" || filter === "year") && (avgRating || totalPages > 0) && (
          <div className="flex gap-4 px-5 py-3 border-b shrink-0"
            style={{ borderColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
            {avgRating && (
              <div>
                <p className="font-display text-xl font-bold" style={{ color: "var(--accent)" }}>{avgRating}/10</p>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--fg-subtle)" }}>media voti</p>
              </div>
            )}
            {totalPages > 0 && (
              <div>
                <p className="font-display text-xl font-bold" style={{ color: "var(--accent)" }}>
                  ~{totalPages.toLocaleString("it")}
                </p>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--fg-subtle)" }}>pagine totali</p>
              </div>
            )}
            {ratedBooks.length > 0 && (
              <div>
                <p className="font-display text-xl font-bold" style={{ color: "var(--accent)" }}>{ratedBooks.length}</p>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--fg-subtle)" }}>con voto</p>
              </div>
            )}
          </div>
        )}

        {/* Lista libri */}
        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-2">
          {filtered.length === 0 ? (
            <p className="text-center py-8 italic text-sm" style={{ color: "var(--fg-subtle)" }}>
              Nessun libro in questa categoria.
            </p>
          ) : (
            // Ordina per rating desc se READ, altrimenti per updatedAt desc
            [...filtered]
              .sort((a, b) =>
                filter === "READ" || filter === "year"
                  ? (b.rating ?? 0) - (a.rating ?? 0)
                  : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              )
              .map((book, i) => (
                <button
                  key={book.id}
                  onClick={() => { onClose(); onBookClick(book); }}
                  className="flex items-start gap-3 p-3 rounded-xl border text-left
                    transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background:  "var(--bg-elevated)",
                    borderColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  }}
                >
                  {/* Posizione (solo READ) */}
                  {(filter === "READ" || filter === "year") && book.rating != null && (
                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow
                      ${i === 0 ? "bg-amber-500 text-amber-950"
                      : i === 1 ? "bg-stone-400 text-stone-900"
                      : i === 2 ? "bg-orange-700 text-orange-100"
                      : "bg-stone-700 text-stone-300"}`}>
                      {i + 1}
                    </span>
                  )}

                  {/* Cover */}
                  {book.coverUrl ? (
                    <Image src={book.coverUrl} alt={book.title} width={40} height={56}
                      className="rounded object-cover shrink-0 shadow" />
                  ) : (
                    <div className="w-10 h-14 rounded shrink-0 border flex items-center justify-center"
                      style={{ background: "var(--bg-page)", borderColor: "color-mix(in srgb,var(--fg-subtle) 20%,transparent)" }}>
                      <span className="text-[8px]" style={{ color: "var(--fg-subtle)" }}>📖</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight line-clamp-2"
                      style={{ color: "var(--fg-primary)" }}>{book.title}</p>
                    {book.author && (
                      <p className="text-xs mt-0.5 italic truncate" style={{ color: "var(--fg-muted)" }}>{book.author}</p>
                    )}
                    {book.rating != null && <div className="mt-1.5"><RatingDisplay value={book.rating} size="sm" /></div>}
                    {book.comment && (
                      <p className="text-xs mt-1 italic line-clamp-2" style={{ color: "var(--fg-subtle)" }}>
                        &ldquo;{book.comment}&rdquo;
                      </p>
                    )}
                    {book.finishedAt && (filter === "READ" || filter === "year") && (
                      <p className="text-[10px] mt-1" style={{ color: "var(--fg-subtle)" }}>
                        Finito il {new Date(book.finishedAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                    {book.series && (
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-subtle)" }}>
                        {book.series}{book.seriesOrder ? ` #${book.seriesOrder}` : ""}
                      </p>
                    )}
                  </div>
                </button>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
