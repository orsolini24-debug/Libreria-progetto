"use client";

import Image from "next/image";
import { RatingDisplay } from "./StarRating";
import { STATUS_LABELS } from "@/app/lib/constants";
import type { Book } from "@/app/generated/prisma/client";

const STATUS_ACCENT: Record<string, string> = {
  TO_READ:   "after:bg-stone-600",
  READING:   "after:bg-blue-500",
  READ:      "after:bg-emerald-500",
  WISHLIST:  "after:bg-violet-500",
  ABANDONED: "after:bg-zinc-600",
};

const STATUS_DOT: Record<string, string> = {
  TO_READ:   "bg-stone-500",
  READING:   "bg-blue-500",
  READ:      "bg-emerald-500",
  WISHLIST:  "bg-violet-500",
  ABANDONED: "bg-zinc-500",
};

const STATUS_COVER_BG: Record<string, string> = {
  TO_READ:   "from-stone-700 to-stone-900",
  READING:   "from-blue-800 to-blue-950",
  READ:      "from-emerald-700 to-emerald-950",
  WISHLIST:  "from-violet-700 to-violet-950",
  ABANDONED: "from-zinc-700 to-zinc-900",
};

const FORMAT_ICONS: Record<string, string> = {
  cartaceo: "📖", kindle: "📱", audible: "🎧",
};

export function BookCard({ book, onClick }: { book: Book; onClick: (b: Book) => void }) {
  const tags    = book.tags    ? book.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const formats = book.formats ? book.formats.split(",").map((f) => f.trim()).filter(Boolean) : [];

  return (
    <div
      onClick={() => onClick(book)}
      className={`group cursor-pointer relative rounded-xl overflow-hidden
        shadow-md shadow-black/40 hover:shadow-xl hover:shadow-black/60
        transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02]
        after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5
        ${STATUS_ACCENT[book.status] ?? "after:bg-stone-600"}`}
    >
      {/* Cover */}
      <div className="aspect-[2/3] relative overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
        {book.coverUrl ? (
          <Image src={book.coverUrl} alt={book.title} fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-b ${STATUS_COVER_BG[book.status] ?? "from-stone-700 to-stone-900"}
            flex flex-col items-center justify-center p-3 gap-2`}>
            <div className="w-8 h-px bg-white/20" />
            <p className="font-reading text-white/80 text-xs font-medium text-center leading-tight italic">
              {book.title.length > 40 ? book.title.slice(0, 40) + "…" : book.title}
            </p>
            {book.author && (
              <p className="text-white/40 text-[10px] text-center">{book.author}</p>
            )}
            <div className="w-8 h-px bg-white/20" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 gap-1.5">
          {book.rating != null && <RatingDisplay value={book.rating} size="sm" />}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/15 text-white/90 rounded-full backdrop-blur-sm border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {formats.length > 0 && (
            <p className="text-xs">{formats.map((f) => FORMAT_ICONS[f] ?? f).join(" ")}</p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="glass px-2.5 py-2.5 rounded-b-xl">
        <div className="flex items-start gap-1.5">
          <span className={`mt-[5px] w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[book.status] ?? "bg-stone-500"}`} />
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight line-clamp-2" style={{ color: "var(--fg-primary)" }}>{book.title}</p>
            {book.author && (
              <p className="font-reading text-[10px] mt-0.5 truncate italic" style={{ color: "var(--fg-muted)" }}>{book.author}</p>
            )}
          </div>
        </div>
        <p className="text-[10px] mt-1.5 pl-3" style={{ color: "var(--fg-subtle)" }}>{STATUS_LABELS[book.status]}</p>

        {/* Badge Formati */}
        {formats.length > 0 && (
          <div className="flex gap-1 mt-2 pl-3">
            {formats.map(f => (
              <span key={f} className="text-[10px] opacity-60" title={f}>
                {FORMAT_ICONS[f] || f}
              </span>
            ))}
          </div>
        )}

        {/* Progress bar — solo per libri in lettura con pagina corrente */}
        {book.status === "READING" && book.currentPage != null && book.pageCount && (
          <div className="mt-2 px-0.5">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.round((book.currentPage / book.pageCount) * 100))}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
            <p className="text-[9px] mt-0.5 text-right" style={{ color: "var(--fg-subtle)" }}>
              p. {book.currentPage}/{book.pageCount}
            </p>
          </div>
        )}

        {/* Badge serie */}
        {book.series && (
          <p className="text-[9px] mt-1 pl-3 truncate" style={{ color: "var(--fg-subtle)" }}>
            {book.series}{book.seriesOrder ? ` #${book.seriesOrder}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
