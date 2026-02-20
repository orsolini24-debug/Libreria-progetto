"use client";

import Image from "next/image";
import { RatingDisplay } from "./StarRating";
import type { Book } from "@/app/generated/prisma/client";

const STATUS_ACCENT: Record<string, string> = {
  TO_READ:  "after:bg-gray-400",
  READING:  "after:bg-blue-500",
  READ:     "after:bg-emerald-500",
  WISHLIST: "after:bg-violet-500",
};

const STATUS_DOT: Record<string, string> = {
  TO_READ:  "bg-gray-400",
  READING:  "bg-blue-500",
  READ:     "bg-emerald-500",
  WISHLIST: "bg-violet-500",
};

const STATUS_COVER_BG: Record<string, string> = {
  TO_READ:  "from-gray-700 to-gray-900",
  READING:  "from-blue-800 to-blue-950",
  READ:     "from-emerald-700 to-emerald-950",
  WISHLIST: "from-violet-700 to-violet-950",
};

const STATUS_LABELS: Record<string, string> = {
  TO_READ: "Da leggere", READING: "In lettura", READ: "Letto", WISHLIST: "Wishlist",
};

const FORMAT_ICONS: Record<string, string> = {
  cartaceo: "📖", kindle: "📱", audible: "🎧",
};

export function BookCard({ book, onClick }: { book: Book; onClick: (b: Book) => void }) {
  const tags = book.tags ? book.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const formats = book.formats ? book.formats.split(",").map((f) => f.trim()).filter(Boolean) : [];

  return (
    <div
      onClick={() => onClick(book)}
      className={`group cursor-pointer relative rounded-xl overflow-hidden shadow-sm hover:shadow-xl
        transition-all duration-300 hover:-translate-y-1
        after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5
        ${STATUS_ACCENT[book.status] ?? "after:bg-gray-400"}`}
    >
      {/* Cover */}
      <div className="aspect-[2/3] relative overflow-hidden bg-gray-100">
        {book.coverUrl ? (
          <Image src={book.coverUrl} alt={book.title} fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-b ${STATUS_COVER_BG[book.status] ?? "from-gray-700 to-gray-900"}
            flex flex-col items-center justify-center p-3 gap-2`}>
            <div className="w-8 h-px bg-white/30" />
            <p className="text-white/90 text-xs font-medium text-center leading-tight">
              {book.title.length > 40 ? book.title.slice(0, 40) + "…" : book.title}
            </p>
            {book.author && <p className="text-white/50 text-[10px] text-center">{book.author}</p>}
            <div className="w-8 h-px bg-white/30" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 gap-1.5">
          {book.rating != null && <RatingDisplay value={book.rating} size="sm" />}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/20 text-white rounded-full backdrop-blur-sm">
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
      <div className="bg-white px-2.5 py-2.5">
        <div className="flex items-start gap-1.5">
          <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[book.status] ?? "bg-gray-400"}`} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{book.title}</p>
            {book.author && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{book.author}</p>}
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">{STATUS_LABELS[book.status]}</p>
      </div>
    </div>
  );
}
