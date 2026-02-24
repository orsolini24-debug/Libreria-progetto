"use client";

import { useMemo } from "react";
import Image from "next/image";
import type { Book } from "@/app/generated/prisma/client";

const YEAR = new Date().getFullYear();

export function YearWrapped({ books }: { books: Book[] }) {
  const stats = useMemo(() => {
    // Libri letti quest'anno — usa finishedAt se disponibile, altrimenti updatedAt come fallback
    const readThisYear = books.filter(
      (b) => b.status === "READ" && new Date((b as any).finishedAt ?? b.updatedAt).getFullYear() === YEAR
    );

    if (readThisYear.length < 3) return null;

    // Pagine lette
    const pages = readThisYear
      .filter((b) => b.pageCount != null)
      .reduce((s, b) => s + (b.pageCount ?? 0), 0);

    // Autori unici
    const authors = new Set(
      readThisYear.map((b) => b.author?.trim()).filter(Boolean)
    ).size;

    // Tag più frequente
    const tagCounts: Record<string, number> = {};
    for (const book of readThisYear) {
      if (!book.tags) continue;
      for (const tag of book.tags.split(",").map((t) => t.trim()).filter(Boolean)) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }
    const topGenre = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Libro con voto più alto
    const bestBook = readThisYear
      .filter((b) => b.rating != null && b.rating > 0)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0] ?? null;

    return { readThisYear, pages, authors, topGenre, bestBook };
  }, [books]);

  if (!stats) return null;

  const statCards = [
    { value: stats.readThisYear.length, label: "libri letti" },
    ...(stats.pages > 0
      ? [{ value: `~${stats.pages.toLocaleString("it")}`, label: "pagine" }]
      : []),
    ...(stats.authors > 1
      ? [{ value: stats.authors, label: "autori diversi" }]
      : []),
    ...(stats.topGenre
      ? [{ value: stats.topGenre, label: "genere preferito", italic: true }]
      : []),
  ];

  return (
    <section className="mb-8">
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="font-display text-lg font-semibold tracking-tight" style={{ color: "var(--fg-primary)" }}>
          Il tuo {YEAR}
        </h2>
        <span className="font-reading text-xs italic" style={{ color: "var(--fg-subtle)" }}>
          riepilogo annuale
        </span>
      </div>

      <div
        className="glass rounded-2xl overflow-hidden backdrop-blur-sm"
        style={{
          borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
        }}
      >
        {/* Accent stripe */}
        <div
          className="h-1"
          style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-hover), var(--accent))" }}
        />

        <div className="p-5 flex flex-col gap-5">
          {/* Stat grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map(({ value, label, italic }, i) => (
              <div key={i} className="glass-sm rounded-xl py-4 text-center">
                <p
                  className={`font-display font-bold leading-none ${typeof value === "string" && value.length > 6 ? "text-xl" : "text-4xl"} ${italic ? "italic" : ""}`}
                  style={{ color: "var(--accent)" }}
                >
                  {value}
                </p>
                <p className="text-xs mt-1.5" style={{ color: "var(--fg-muted)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Best book */}
          {stats.bestBook && (
            <div
              className="glass-sm flex items-center gap-4 p-3.5 rounded-xl backdrop-blur-sm"
            >
              <span className="text-2xl shrink-0 select-none">🏆</span>

              {stats.bestBook.coverUrl ? (
                <Image
                  src={stats.bestBook.coverUrl}
                  alt={stats.bestBook.title}
                  width={40}
                  height={56}
                  className="rounded object-cover shrink-0 shadow-md shadow-black/40"
                />
              ) : (
                <div
                  className="w-10 h-14 rounded shrink-0"
                  style={{ background: "var(--bg-page)" }}
                />
              )}

              <div className="min-w-0 flex-1">
                <p
                  className="text-[9px] uppercase tracking-widest font-semibold"
                  style={{ color: "var(--fg-subtle)" }}
                >
                  miglior libro dell&apos;anno
                </p>
                <p
                  className="font-display text-sm font-bold leading-snug mt-1 truncate"
                  style={{ color: "var(--fg-primary)" }}
                >
                  {stats.bestBook.title}
                </p>
                {stats.bestBook.author && (
                  <p
                    className="font-reading text-xs italic mt-0.5 truncate"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {stats.bestBook.author}
                  </p>
                )}
                <p className="text-sm font-bold mt-1.5" style={{ color: "var(--accent)" }}>
                  {stats.bestBook.rating}/10
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
