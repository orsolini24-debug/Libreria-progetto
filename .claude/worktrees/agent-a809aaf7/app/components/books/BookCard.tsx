"use client";

import Image from "next/image";
import { RatingDisplay } from "./StarRating";
import { STATUS_LABELS } from "@/app/lib/constants";
import type { Book } from "@/app/generated/prisma/client";

const STATUS_ACCENT: Record<string, string> = {
  TO_READ:  "after:bg-stone-600",
  READING:  "after:bg-blue-500",
  READ:     "after:bg-emerald-500",
  WISHLIST: "after:bg-violet-500",
};

const STATUS_DOT: Record<string, string> = {
  TO_READ:  "bg-stone-500",
  READING:  "bg-blue-500",
  READ:     "bg-emerald-500",
  WISHLIST: "bg-violet-500",
};

const STATUS_COVER_BG: Record<string, string> = {
  TO_READ:  "from-stone-700 to-stone-900",
  READING:  "from-blue-800 to-blue-950",
  READ:     "from-emerald-700 to-emerald-950",
  WISHLIST: "from-violet-700 to-violet-950",
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
      <div className="aspect-[2/3] relative overflow-hidden bg-stone-800">
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
      <div className="bg-[#221810] border-t border-amber-900/25 px-2.5 py-2.5">
        <div className="flex items-start gap-1.5">
          <span className={`mt-[5px] w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[book.status] ?? "bg-stone-500"}`} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-stone-100 leading-tight line-clamp-2">{book.title}</p>
            {book.author && (
              <p className="font-reading text-[10px] text-stone-500 mt-0.5 truncate italic">{book.author}</p>
            )}
          </div>
        </div>
        <p className="text-[10px] text-stone-600 mt-1.5 pl-3">{STATUS_LABELS[book.status]}</p>
      </div>
    </div>
  );
}
