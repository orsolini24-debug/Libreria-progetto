"use client";

import { useState } from "react";
import { Quote as LucideQuote } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string | null;
}

interface QuoteWithBook {
  id: string;
  text: string;
  page: number | null;
  chapter: string | null;
  type: string;
  createdAt: Date;
  book: Book;
}

interface Props {
  quotes: QuoteWithBook[];
  booksWithQuotes: Book[];
}

export function QuotesClient({ quotes, booksWithQuotes }: Props) {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const filtered = selectedBookId
    ? quotes.filter((q) => q.book.id === selectedBookId)
    : quotes;

  return (
    <div className="flex flex-col gap-6">
      {/* Filtri per libro */}
      {booksWithQuotes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedBookId(null)}
            className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
            style={{
              background: selectedBookId === null ? "var(--accent)" : "transparent",
              color: selectedBookId === null ? "var(--accent-on)" : "var(--fg-muted)",
              borderColor: selectedBookId === null ? "var(--accent)" : "color-mix(in srgb, var(--fg-subtle) 30%, transparent)",
            }}
          >
            Tutti
          </button>
          {booksWithQuotes.map((book) => (
            <button
              key={book.id}
              onClick={() => setSelectedBookId(book.id)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
              style={{
                background: selectedBookId === book.id ? "var(--accent)" : "transparent",
                color: selectedBookId === book.id ? "var(--accent-on)" : "var(--fg-muted)",
                borderColor: selectedBookId === book.id ? "var(--accent)" : "color-mix(in srgb, var(--fg-subtle) 30%, transparent)",
              }}
            >
              {book.title.length > 30 ? book.title.slice(0, 30) + "…" : book.title}
            </button>
          ))}
        </div>
      )}

      {/* Griglia citazioni */}
      {filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--fg-subtle)" }}>
          <LucideQuote className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nessuna citazione trovata.</p>
          <p className="text-xs mt-1 opacity-60">Salva citazioni dai tuoi libri per vederle qui.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 gap-4 space-y-4">
          {filtered.map((quote) => (
            <div
              key={quote.id}
              className="break-inside-avoid rounded-2xl p-5 border"
              style={{
                background: "var(--bg-card)",
                borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
              }}
            >
              {/* Badge tipo */}
              <span
                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-3 inline-block"
                style={{
                  background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                  color: "var(--accent)",
                }}
              >
                {quote.type === "QUOTE" ? "Citazione" : "Nota"}
              </span>

              {/* Testo */}
              <blockquote
                className="font-reading text-base italic leading-relaxed mb-4"
                style={{ color: "var(--fg-primary)" }}
              >
                &ldquo;{quote.text}&rdquo;
              </blockquote>

              {/* Footer */}
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                  {quote.book.title}
                </p>
                {quote.book.author && (
                  <p className="text-[11px] italic" style={{ color: "var(--fg-muted)" }}>
                    {quote.book.author}
                  </p>
                )}
                <div className="flex gap-3 mt-1">
                  {quote.page && (
                    <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>
                      p. {quote.page}
                    </span>
                  )}
                  {quote.chapter && (
                    <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>
                      {quote.chapter}
                    </span>
                  )}
                  <span className="text-[10px] ml-auto" style={{ color: "var(--fg-subtle)" }}>
                    {new Date(quote.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
