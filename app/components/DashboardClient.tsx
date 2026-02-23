"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { BookCard } from "./books/BookCard";
import { SlidePanel } from "./SlidePanel";
import { EditBookForm } from "./books/EditBookForm";
import AddBookForm from "./books/AddBookForm";
import { STATUS_LABELS } from "@/app/lib/constants";
import type { Book } from "@/app/generated/prisma/client";

const STATUS_COLORS_ACTIVE: Record<string, string> = {
  TO_READ:  "bg-stone-700 text-stone-200 border-stone-600",
  READING:  "bg-blue-900/60 text-blue-300 border-blue-700",
  READ:     "bg-emerald-900/60 text-emerald-300 border-emerald-700",
  WISHLIST: "bg-violet-900/60 text-violet-300 border-violet-700",
};

const STATUS_NUMBER_ACTIVE: Record<string, string> = {
  TO_READ:  "text-stone-200",
  READING:  "text-blue-300",
  READ:     "text-emerald-300",
  WISHLIST: "text-violet-300",
};

type PanelState =
  | { type: "add" }
  | { type: "edit"; book: Book }
  | null;

const MEDALS = ["🥇", "🥈", "🥉"];

function TopTenSection({
  books,
  onBookClick,
}: {
  books: Book[];
  onBookClick: (b: Book) => void;
}) {
  const top = useMemo(
    () =>
      [...books]
        .filter((b) => b.rating != null && b.rating > 0)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 10),
    [books]
  );

  if (top.length < 3) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">🏆</span>
        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
          Top {top.length < 10 ? top.length : "10"}
        </h2>
        <span className="text-xs text-stone-600">— i tuoi libri più amati</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {top.map((book, i) => (
          <button
            key={book.id}
            onClick={() => onBookClick(book)}
            className="group relative shrink-0 w-[88px] flex flex-col items-center gap-2 focus:outline-none"
          >
            <div className="relative w-[72px] h-[100px]">
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover rounded-lg shadow-lg shadow-black/40 group-hover:shadow-black/60 group-hover:scale-105 transition-all duration-300"
                  sizes="72px"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-gradient-to-b from-stone-700 to-stone-900 flex items-center justify-center border border-stone-700">
                  <span className="text-stone-500 text-[10px] text-center px-1 leading-tight">
                    {book.title.slice(0, 20)}
                  </span>
                </div>
              )}

              {/* Badge posizione */}
              <span
                className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shadow-md
                  ${i === 0 ? "bg-amber-500 text-amber-950"
                  : i === 1 ? "bg-stone-400 text-stone-900"
                  : i === 2 ? "bg-orange-700 text-orange-100"
                  : "bg-stone-700 text-stone-300"}`}
              >
                {i < 3 ? MEDALS[i] : i + 1}
              </span>

              {/* Badge voto */}
              <span className="absolute -bottom-1 -right-1 bg-amber-600 text-stone-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                {book.rating}/10
              </span>
            </div>

            <p className="text-[10px] text-stone-400 text-center leading-tight line-clamp-2 w-full px-0.5 group-hover:text-stone-200 transition-colors">
              {book.title}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function DashboardClient({ initialBooks }: { initialBooks: Book[] }) {
  const [panel, setPanel] = useState<PanelState>(null);
  const [query, setQuery]         = useState("");
  const [statusFilter, setStatus] = useState("");

  const filtered = useMemo(
    () =>
      initialBooks.filter((b) => {
        const q = query.toLowerCase();
        const matchText =
          !q ||
          b.title.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q);
        const matchStatus = !statusFilter || b.status === statusFilter;
        return matchText && matchStatus;
      }),
    [initialBooks, query, statusFilter]
  );

  const counts = useMemo(
    () =>
      Object.keys(STATUS_LABELS).reduce((acc, s) => {
        acc[s] = initialBooks.filter((b) => b.status === s).length;
        return acc;
      }, {} as Record<string, number>),
    [initialBooks]
  );

  const closePanel = () => setPanel(null);

  return (
    <>
      {/* Top 10 */}
      <TopTenSection books={initialBooks} onBookClick={(b) => setPanel({ type: "edit", book: b })} />

      {/* Statistiche */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const active = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatus(active ? "" : key)}
              className={`text-left p-4 rounded-xl border transition-all
                ${active
                  ? STATUS_COLORS_ACTIVE[key]
                  : "border-stone-800 bg-stone-800/40 hover:bg-stone-800/70 hover:border-stone-700"}`}
            >
              <p className={`text-2xl font-bold ${active ? STATUS_NUMBER_ACTIVE[key] : "text-stone-300"}`}>
                {counts[key]}
              </p>
              <p className={`text-xs mt-0.5 ${active ? "opacity-80" : "text-stone-600"}`}>{label}</p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca titolo o autore…"
          className="flex-1 min-w-[180px] border border-stone-700 bg-stone-800 text-stone-100
            placeholder:text-stone-600 rounded-xl px-4 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-700"
        />

        {/* Pills filtro */}
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(STATUS_LABELS).map(([key, label]) => {
            const active = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatus(active ? "" : key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all
                  ${active
                    ? STATUS_COLORS_ACTIVE[key]
                    : "border-stone-700 text-stone-500 hover:bg-stone-800 hover:text-stone-300"}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Aggiungi */}
        <button
          onClick={() => setPanel({ type: "add" })}
          className="flex items-center gap-2 bg-amber-600 text-stone-950 px-4 py-2 rounded-xl text-sm
            font-semibold hover:bg-amber-500 transition-colors shadow-md shadow-amber-900/30"
        >
          <span className="text-base leading-none">+</span>
          Aggiungi
        </button>
      </div>

      {/* Griglia libri */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4 opacity-30">📚</div>
          <p className="text-stone-500 font-medium">
            {initialBooks.length === 0 ? "La tua libreria è vuota." : "Nessun libro trovato."}
          </p>
          <p className="text-stone-600 text-sm mt-1">
            {initialBooks.length === 0
              ? "Aggiungi il tuo primo libro con il pulsante in alto."
              : "Prova a cambiare filtro o query di ricerca."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onClick={(b) => setPanel({ type: "edit", book: b })}
            />
          ))}
        </div>
      )}

      {/* Slide Panel */}
      <SlidePanel
        isOpen={panel !== null}
        onClose={closePanel}
        title={
          panel?.type === "add" ? "Aggiungi libro"
          : panel?.type === "edit" ? "Dettagli libro"
          : ""
        }
      >
        {panel?.type === "add" && <AddBookForm onSuccess={closePanel} />}
        {panel?.type === "edit" && (
          <EditBookForm book={panel.book} onClose={closePanel} />
        )}
      </SlidePanel>
    </>
  );
}
