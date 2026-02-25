"use client";

import type { Book } from "@/app/generated/prisma/client";

export function StatsBar({ books }: { books: Book[] }) {
  if (books.length === 0) return null;

  const readBooks  = books.filter((b) => b.status === "READ");
  const ratedBooks = readBooks.filter((b) => b.rating != null && b.rating > 0);

  const uniqueAuthors = new Set(
    books.map((b) => b.author?.trim()).filter(Boolean)
  ).size;

  const avgRating =
    ratedBooks.length > 0
      ? (ratedBooks.reduce((s, b) => s + (b.rating ?? 0), 0) / ratedBooks.length).toFixed(1)
      : null;

  // Pagine lette: libri finiti (pageCount) + libri in corso (currentPage)
  const pagesRead = readBooks
    .filter((b) => b.pageCount != null)
    .reduce((s, b) => s + (b.pageCount ?? 0), 0);

  const pagesInProgress = books
    .filter((b) => b.status === "READING" && b.currentPage != null)
    .reduce((s, b) => s + (b.currentPage ?? 0), 0);

  const totalPages = pagesRead + pagesInProgress;

  const readingBooks = books.filter((b) => b.status === "READING");

  const stats = [
    { icon: "📚", value: books.length,          label: "nella libreria" },
    { icon: "✅", value: readBooks.length,       label: "letti" },
    ...(readingBooks.length > 0
      ? [{ icon: "📖", value: readingBooks.length, label: "in lettura" }]
      : []),
    { icon: "✍️", value: uniqueAuthors,          label: "autori" },
    ...(avgRating
      ? [{ icon: "⭐", value: `${avgRating}/10`, label: "media voti" }]
      : []),
    ...(totalPages > 0
      ? [{ icon: "📄", value: `~${totalPages.toLocaleString("it")}`, label: "pag. lette" }]
      : []),
  ];

  return (
    <div className="glass flex flex-wrap gap-x-6 gap-y-3 mb-6 px-4 py-3.5 rounded-xl">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="text-lg leading-none">{s.icon}</span>
          <div>
            <p className="font-display text-lg font-bold leading-none" style={{ color: "var(--accent)" }}>
              {s.value}
            </p>
            <p className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: "var(--fg-subtle)" }}>
              {s.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
