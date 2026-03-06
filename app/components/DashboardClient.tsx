"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import { BookCard } from "./books/BookCard";
import { SlidePanel } from "./SlidePanel";
import { EditBookForm } from "./books/EditBookForm";
import AddBookForm from "./books/AddBookForm";
import { StatsBar } from "./books/StatsBar";
import { ReadingChallenge } from "./books/ReadingChallenge";
import { YearWrapped } from "./books/YearWrapped";
import { ActivityHeatMap } from "./books/ActivityHeatMap";
import { ConfettiCelebration } from "./ConfettiCelebration";
import { STATUS_LABELS } from "@/app/lib/constants";
import { StatsModal } from "./books/StatsModal";
import { SanctuaryChat } from "./ai/SanctuaryChat";
import { ShelfSharingControl } from "./books/ShelfSharingControl";
import type { Book } from "@/app/generated/prisma/client";

const STATUS_COLORS_ACTIVE: Record<string, string> = {
  TO_READ:  "bg-stone-700 text-stone-200 border-stone-600",
  READING:  "bg-blue-900/60 text-blue-300 border-blue-700",
  READ:     "bg-emerald-900/60 text-emerald-300 border-emerald-700",
  WISHLIST: "bg-violet-900/60 text-violet-300 border-violet-700",
  ABANDONED: "bg-zinc-700 text-zinc-300 border-zinc-600",
};

const STATUS_NUMBER_ACTIVE: Record<string, string> = {
  TO_READ:  "text-stone-200",
  READING:  "text-blue-300",
  READ:     "text-emerald-300",
  WISHLIST: "text-violet-300",
  ABANDONED: "text-zinc-300",
};

const STATUS_ICON: Record<string, string> = {
  TO_READ:  "📚",
  READING:  "📖",
  READ:     "✅",
  WISHLIST: "🔖",
  ABANDONED: "🚫",
};

type PanelState =
  | { type: "add" }
  | { type: "edit"; book: Book }
  | null;

const MEDALS = ["🥇", "🥈", "🥉"];

// #131: Sub-componente TopTen
function TopTenSection({ books, onBookClick }: { books: Book[], onBookClick: (b: Book) => void }) {
  const top = useMemo(() =>
    [...books].filter(b => b.rating != null && b.rating > 0).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 10),
    [books]
  );
  if (top.length < 3) return null;

  return (
    <section className="mb-8">
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="font-display text-lg font-semibold tracking-tight" style={{ color: "var(--fg-primary)" }}>Top {top.length < 10 ? top.length : "10"}</h2>
        <span className="font-reading text-xs italic" style={{ color: "var(--fg-subtle)" }}>i tuoi libri più amati</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {top.map((book, i) => (
          <button key={book.id} onClick={() => onBookClick(book)} className="group relative shrink-0 w-[88px] flex flex-col items-center gap-2 focus:outline-none">
            <div className="relative w-[72px] h-[100px]">
              {book.coverUrl ? (
                <Image src={book.coverUrl} alt={book.title} fill className="object-cover rounded-lg shadow-lg group-hover:scale-105 transition-all duration-300" sizes="72px" />
              ) : (
                <div className="w-full h-full rounded-lg flex items-center justify-center border" style={{ background: "var(--bg-elevated)", borderColor: "color-mix(in srgb, var(--fg-subtle) 25%, transparent)" }}>
                  <span className="text-[10px] text-center px-1 leading-tight" style={{ color: "var(--fg-subtle)" }}>{book.title.slice(0, 20)}</span>
                </div>
              )}
              <span className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shadow-md ${i === 0 ? "bg-amber-500 text-amber-950" : i === 1 ? "bg-stone-400 text-stone-900" : i === 2 ? "bg-orange-700 text-orange-100" : "bg-stone-700 text-stone-300"}`}>{i < 3 ? MEDALS[i] : i + 1}</span>
              <span className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow" style={{ background: "var(--accent)", color: "var(--accent-on)" }}>{book.rating}/10</span>
            </div>
            <p className="font-reading text-[10px] text-center leading-tight line-clamp-2 italic transition-colors" style={{ color: "var(--fg-muted)" }}>{book.title}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

interface DashboardClientProps {
  initialBooks: Book[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  statusCounts?: Record<string, number>;
  userPrivacy: { userId: string; isPublic: boolean };
}

export function DashboardClient({ initialBooks, totalPages, currentPage, statusCounts, userPrivacy }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [panel, setPanel] = useState<PanelState>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [statsModal, setStatsModal] = useState<string | null>(null);

  const query = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") ?? "updatedAt";
  const bookParam = searchParams.get("book");

  useEffect(() => {
    let changed = false;
    const params = new URLSearchParams(searchParams.toString());
    if (bookParam) {
      const book = initialBooks.find(b => b.id === bookParam);
      if (book) setPanel({ type: "edit", book });
      params.delete("book");
      changed = true;
    }
    if (params.get("q") === "") { params.delete("q"); changed = true; }
    if (changed) router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  }, [bookParam, initialBooks, pathname, router, searchParams]);

  function handleCelebrate() {
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 100);
  }

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // Resetta a pagina 1 su ogni filtro
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  // #162: Navigazione tra pagine
  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  // Counts totali per stato — usa i dati server-side se disponibili, altrimenti fallback sulla pagina corrente
  const counts = useMemo(() => {
    if (statusCounts) return statusCounts;
    return Object.keys(STATUS_LABELS).reduce((acc, s) => {
      acc[s] = initialBooks.filter(b => b.status === s).length;
      return acc;
    }, {} as Record<string, number>);
  }, [statusCounts, initialBooks]);

  const closePanel = () => setPanel(null);

  return (
    <>
      <ConfettiCelebration show={celebrate} />
      {statsModal && <StatsModal books={initialBooks} filter={statsModal} onClose={() => setStatsModal(null)} onBookClick={(b) => { setStatsModal(null); setPanel({ type: "edit", book: b }); }} />}

      <TopTenSection books={initialBooks} onBookClick={(b) => setPanel({ type: "edit", book: b })} />
      <StatsBar books={initialBooks} onStatClick={(f) => setStatsModal(f)} />
      <YearWrapped books={initialBooks} onStatClick={(filter, year) => { if (year) setStatsModal(`${filter}-${year}`); else updateFilters({ status: filter }); }} />
      <ReadingChallenge books={initialBooks} />
      <ActivityHeatMap books={initialBooks} />

      {/* #164: Controllo condivisione */}
      <ShelfSharingControl userId={userPrivacy.userId} isPublic={userPrivacy.isPublic} />

      {/* Contatori per stato */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const active = statusFilter === key;
          return (
            <button key={key} onClick={() => updateFilters({ status: active ? null : key })} className={`group text-left p-4 rounded-xl border transition-all duration-200 ${active ? STATUS_COLORS_ACTIVE[key] : "border"}`} style={!active ? { background: "var(--bg-card)", borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)" } : undefined}>
              <div className="flex items-start justify-between mb-1">
                <p className={`font-display text-2xl font-bold ${active ? STATUS_NUMBER_ACTIVE[key] : ""}`} style={!active ? { color: "var(--fg-primary)" } : undefined}>{counts[key] ?? 0}</p>
                <span className="text-base opacity-50">{STATUS_ICON[key]}</span>
              </div>
              <p className={`text-xs ${active ? "opacity-80" : ""}`} style={!active ? { color: "var(--fg-subtle)" } : undefined}>{label}</p>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <div className="relative flex-1 min-w-[180px]">
          <input type="text" defaultValue={query} onKeyDown={(e) => { if (e.key === "Enter") updateFilters({ q: e.currentTarget.value }); }} placeholder="Cerca titolo, autore, tag..." className="w-full rounded-xl pl-4 pr-10 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors" style={{ background: "var(--bg-input)", color: "var(--fg-primary)", borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)" }} />
          {query && <button onClick={() => updateFilters({ q: null })} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-40 hover:opacity-100">✕</button>}
        </div>
        <select value={sort} onChange={(e) => updateFilters({ sort: e.target.value })} className="rounded-xl px-3 py-2 text-xs border bg-transparent font-bold uppercase" style={{ borderColor: "var(--bg-input)", color: "var(--fg-muted)" }}>
          <option value="updatedAt">Recenti</option>
          <option value="createdAt">Data aggiunta</option>
          <option value="title">Titolo</option>
          <option value="rating">Voto</option>
        </select>
        <button onClick={() => setPanel({ type: "add" })} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all duration-150 shadow-lg" style={{ background: "var(--accent)", color: "var(--accent-on)", boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 35%, transparent)" }}><span className="text-base leading-none">+</span>Aggiungi</button>
      </div>

      {initialBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4 opacity-20">📚</div>
          <p className="font-display font-medium text-lg px-6" style={{ color: "var(--fg-muted)" }}>{query || statusFilter ? `Nessun libro trovato per ${statusFilter ? `lo stato "${STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS]}"` : ""}${query && statusFilter ? " e " : ""}${query ? `la ricerca "${query}"` : ""}.` : "La tua libreria è ancora vuota."}</p>
          {(query || statusFilter) && <button onClick={() => updateFilters({ q: null, status: null })} className="mt-4 text-xs font-black uppercase tracking-widest" style={{ color: "var(--accent)" }}>Pulisci filtri</button>}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 sm:gap-6 mb-8">
          {initialBooks.map((book) => (
            <div key={book.id} className="book-grid-item">
              <BookCard book={book} onClick={(b) => setPanel({ type: "edit", book: b })} />
            </div>
          ))}
        </div>
      )}

      {/* #162: Navigazione Paginazione */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mb-12">
          <button disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)} className="p-2 rounded-lg border border-white/10 disabled:opacity-20 transition-all hover:bg-white/5 active:scale-95">←</button>
          <span className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg bg-white/5 border border-white/5">Pagina {currentPage} di {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)} className="p-2 rounded-lg border border-white/10 disabled:opacity-20 transition-all hover:bg-white/5 active:scale-95">→</button>
        </div>
      )}

      <SlidePanel isOpen={panel !== null} onClose={closePanel} title={panel?.type === "add" ? "Aggiungi libro" : panel?.type === "edit" ? "Dettagli libro" : ""}>
        {panel?.type === "add" && <AddBookForm onSuccess={closePanel} />}
        {panel?.type === "edit" && <EditBookForm book={panel.book} onClose={closePanel} onCelebrate={handleCelebrate} onNavigateToBook={(bookId) => { const target = initialBooks.find((b) => b.id === bookId); if (target) setPanel({ type: "edit", book: target }); }} />}
      </SlidePanel>

      <SanctuaryChat currentBookId={panel?.type === "edit" ? panel.book.id : undefined} />
    </>
  );
}
