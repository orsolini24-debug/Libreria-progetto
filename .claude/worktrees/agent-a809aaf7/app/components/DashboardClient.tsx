"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { BookCard } from "./books/BookCard";
import { SlidePanel } from "./SlidePanel";
import { EditBookForm } from "./books/EditBookForm";
import AddBookForm from "./books/AddBookForm";
import { StatsBar } from "./books/StatsBar";
import { ReadingChallenge } from "./books/ReadingChallenge";
import { ConfettiCelebration } from "./ConfettiCelebration";
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

const STATUS_ICON: Record<string, string> = {
  TO_READ:  "📚",
  READING:  "📖",
  READ:     "✅",
  WISHLIST: "🔖",
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
    <section className="mb-8">
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="font-display text-lg font-semibold text-amber-200/90 tracking-tight">
          Top {top.length < 10 ? top.length : "10"}
        </h2>
        <span className="font-reading text-xs text-stone-500 italic">i tuoi libri più amati</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
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
                  className="object-cover rounded-lg shadow-lg shadow-black/50
                    group-hover:shadow-amber-950/60 group-hover:scale-105 transition-all duration-300"
                  sizes="72px"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-gradient-to-b from-stone-700 to-stone-900
                  flex items-center justify-center border border-stone-700">
                  <span className="text-stone-500 text-[10px] text-center px-1 leading-tight">
                    {book.title.slice(0, 20)}
                  </span>
                </div>
              )}
              <span className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center
                text-[11px] font-bold shadow-md
                ${i === 0 ? "bg-amber-500 text-amber-950"
                : i === 1 ? "bg-stone-400 text-stone-900"
                : i === 2 ? "bg-orange-700 text-orange-100"
                : "bg-stone-700 text-stone-300"}`}>
                {i < 3 ? MEDALS[i] : i + 1}
              </span>
              <span className="absolute -bottom-1 -right-1 bg-amber-600 text-stone-950 text-[10px]
                font-bold px-1.5 py-0.5 rounded-full shadow">
                {book.rating}/10
              </span>
            </div>
            <p className="font-reading text-[10px] text-stone-400 text-center leading-tight
              line-clamp-2 w-full px-0.5 group-hover:text-stone-200 transition-colors italic">
              {book.title}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function DashboardClient({ initialBooks }: { initialBooks: Book[] }) {
  const [panel,     setPanel]     = useState<PanelState>(null);
  const [query,     setQuery]     = useState("");
  const [statusFilter, setStatus] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  function handleCelebrate() {
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 100);
  }

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
      <ConfettiCelebration show={celebrate} />

      {/* Top 10 */}
      <TopTenSection books={initialBooks} onBookClick={(b) => setPanel({ type: "edit", book: b })} />

      {/* Stats bar */}
      <StatsBar books={initialBooks} />

      {/* Reading challenge */}
      <ReadingChallenge books={initialBooks} />

      {/* Contatori per stato */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const active = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatus(active ? "" : key)}
              className={`group text-left p-4 rounded-xl border transition-all duration-200
                ${active
                  ? STATUS_COLORS_ACTIVE[key]
                  : "bg-[#1f1710]/60 border-amber-900/20 hover:bg-[#271d12]/80 hover:border-amber-800/40"}`}
            >
              <div className="flex items-start justify-between mb-1">
                <p className={`font-display text-2xl font-bold
                  ${active ? STATUS_NUMBER_ACTIVE[key] : "text-amber-200/70"}`}>
                  {counts[key]}
                </p>
                <span className="text-base opacity-50">{STATUS_ICON[key]}</span>
              </div>
              <p className={`text-xs ${active ? "opacity-80" : "text-stone-600"}`}>{label}</p>
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
          className="flex-1 min-w-[180px] border border-amber-900/20 bg-[#1f1710]/60 text-stone-200
            placeholder:text-stone-600 rounded-xl px-4 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-amber-700/40 focus:border-amber-700/40
            transition-colors"
        />
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(STATUS_LABELS).map(([key, label]) => {
            const active = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatus(active ? "" : key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200
                  ${active
                    ? STATUS_COLORS_ACTIVE[key]
                    : "border-amber-900/20 text-stone-500 hover:bg-amber-950/30 hover:text-stone-300 hover:border-amber-800/40"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setPanel({ type: "add" })}
          className="flex items-center gap-2 bg-amber-600 text-stone-950 px-4 py-2 rounded-xl text-sm
            font-semibold hover:bg-amber-500 active:scale-95 transition-all duration-150
            shadow-lg shadow-amber-900/40"
        >
          <span className="text-base leading-none">+</span>
          Aggiungi
        </button>
      </div>

      {/* Griglia libri */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
          <div className="text-5xl mb-4 opacity-20">📚</div>
          <p className="font-display text-stone-500 font-medium text-lg">
            {initialBooks.length === 0 ? "La tua libreria è vuota." : "Nessun libro trovato."}
          </p>
          <p className="font-reading text-stone-600 text-sm mt-2 italic">
            {initialBooks.length === 0
              ? "Aggiungi il tuo primo libro con il pulsante in alto."
              : "Prova a cambiare filtro o query di ricerca."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((book) => (
            <div key={book.id} className="book-grid-item">
              <BookCard
                book={book}
                onClick={(b) => setPanel({ type: "edit", book: b })}
              />
            </div>
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
          <EditBookForm
            book={panel.book}
            onClose={closePanel}
            onCelebrate={handleCelebrate}
          />
        )}
      </SlidePanel>
    </>
  );
}
