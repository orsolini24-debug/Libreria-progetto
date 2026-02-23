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

  const totalPages = readBooks
    .filter((b) => b.pageCount != null)
    .reduce((s, b) => s + (b.pageCount ?? 0), 0);

  const stats = [
    { icon: "📚", value: books.length,         label: "nella libreria" },
    { icon: "✅", value: readBooks.length,      label: "letti" },
    { icon: "✍️", value: uniqueAuthors,         label: "autori" },
    ...(avgRating
      ? [{ icon: "⭐", value: `${avgRating}/10`, label: "media voti" }]
      : []),
    ...(totalPages > 0
      ? [{ icon: "📄", value: `~${totalPages.toLocaleString("it")}`, label: "pag. lette" }]
      : []),
  ];

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6 px-4 py-3.5 rounded-xl border border-amber-900/25 bg-amber-950/10">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="text-lg leading-none">{s.icon}</span>
          <div>
            <p className="font-display text-lg font-bold text-amber-300 leading-none">{s.value}</p>
            <p className="text-[10px] text-stone-500 mt-0.5 uppercase tracking-wide">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
