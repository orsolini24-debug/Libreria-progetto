"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Book } from "@/app/generated/prisma/client";

interface Props {
  books: Book[];
  onStatClick?: (filter: string, year?: number) => void;
}

export function YearWrapped({ books, onStatClick }: Props) {
  // Anni disponibili (quelli in cui l'utente ha finito almeno un libro)
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    books.forEach(b => {
      if (b.status === "READ") {
        years.add(new Date(b.finishedAt ?? b.updatedAt).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [books]);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(
    availableYears.includes(currentYear) ? currentYear : availableYears[0] || currentYear
  );

  const stats = useMemo(() => {
    const readThisYear = books.filter(
      (b) => b.status === "READ" && new Date(b.finishedAt ?? b.updatedAt).getFullYear() === selectedYear
    );

    if (readThisYear.length === 0) return null;

    const pages = readThisYear
      .filter((b) => b.pageCount != null)
      .reduce((s, b) => s + (b.pageCount ?? 0), 0);

    const authors = new Set(
      readThisYear.map((b) => b.author?.trim()).filter(Boolean)
    ).size;

    const tagCounts: Record<string, number> = {};
    for (const book of readThisYear) {
      if (!book.tags) continue;
      for (const tag of book.tags.split(",").map((t) => t.trim()).filter(Boolean)) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }
    const topGenre = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const bestBook = readThisYear
      .filter((b) => b.rating != null && b.rating > 0)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0] ?? null;

    return { readThisYear, pages, authors, topGenre, bestBook };
  }, [books, selectedYear]);

  if (!stats && availableYears.length === 0) return null;

  const statCards = stats ? [
    { value: stats.readThisYear.length, label: "libri letti", filter: "READ" },
    { value: `~${stats.pages.toLocaleString("it")}`, label: "pagine", filter: "READ" },
    { value: stats.authors, label: "autori", filter: "READ" },
    { value: stats.topGenre || "-", label: "genere top", filter: "READ", italic: true },
  ] : [];

  return (
    <section className="mb-12 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-2xl font-black tracking-tighter text-amber-500">
            Il tuo {selectedYear}
          </h2>
          <span className="font-reading text-xs italic opacity-40">riepilogo annuale</span>
        </div>

        {/* Selettore Anno */}
        {availableYears.length > 1 && (
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all
                  ${selectedYear === year ? 'bg-amber-500 text-black' : 'opacity-40 hover:opacity-100'}`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-1 rounded-[2.5rem] bg-gradient-to-br from-amber-500/20 via-transparent to-transparent shadow-2xl">
        <div className="glass rounded-[2.4rem] overflow-hidden bg-[#121212]/80 backdrop-blur-xl border border-white/5 p-6 flex flex-col gap-8">
          
          {/* Stat Grid Interattiva */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(({ value, label, filter, italic }, i) => (
              <button
                key={i}
                onClick={() => onStatClick?.(filter, selectedYear)}
                className="group p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all text-center relative"
              >
                <p className={`font-display font-black leading-none text-3xl tracking-tighter mb-2 group-hover:scale-110 transition-transform ${italic ? "italic" : ""}`}
                   style={{ color: "var(--accent)" }}>
                  {value}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                  {label}
                </p>
                <span className="absolute top-3 right-3 text-[8px] opacity-0 group-hover:opacity-40 tracking-tighter">VEDI ↗</span>
              </button>
            ))}
          </div>

          {/* Highlights */}
          {stats?.bestBook && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="flex items-center gap-5 p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 group cursor-pointer hover:bg-white/5 transition-all"
                   onClick={() => onStatClick?.("READ", selectedYear)}>
                <div className="relative shrink-0">
                  <span className="absolute -top-3 -left-3 text-2xl z-10 drop-shadow-xl">🏆</span>
                  {stats.bestBook.coverUrl ? (
                    <Image src={stats.bestBook.coverUrl} alt="" width={56} height={80} unoptimized className="rounded-xl shadow-2xl transition-transform group-hover:rotate-3" />
                  ) : (
                    <div className="w-14 h-20 bg-amber-500/10 rounded-xl flex items-center justify-center text-[8px] opacity-30">IMG</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">Miglior Lettura</p>
                  <p className="font-display text-base font-bold text-amber-500 truncate leading-tight">{stats.bestBook.title}</p>
                  <p className="text-xs opacity-50 italic truncate">{stats.bestBook.author}</p>
                  <div className="mt-2 text-xs font-black text-amber-500/80">{stats.bestBook.rating}/10</div>
                </div>
              </div>

              {/* Prossimo obiettivo basato sui dati dell'anno */}
              <div className="p-5 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex flex-col justify-center">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-2 text-amber-500">Curiosità del {selectedYear}</p>
                <p className="text-xs leading-relaxed font-medium">
                  Hai esplorato <span className="text-amber-500 font-bold">{stats.authors}</span> universi narrativi differenti. 
                  {stats.topGenre && <> Il genere <span className="text-amber-500 font-bold uppercase tracking-tighter">{stats.topGenre}</span> è stato la tua bussola.</>}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
