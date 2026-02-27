"use client";

import { useState } from "react";
import { BookOpen, X, ChevronRight } from "lucide-react";
import { updateBook } from "@/app/lib/book-actions";

interface Props {
  bookId: string;
  bookTitle: string;
  currentPage: number | null;
  pageCount: number | null;
  onClose: () => void;
}

function getTodayKey(bookId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `reading-nudge-${bookId}-${today}`;
}

export function useReadingNudge(bookId: string) {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(getTodayKey(bookId)) !== "dismissed";
}

export function ReadingProgressNudge({ bookId, bookTitle, currentPage, pageCount, onClose }: Props) {
  const [page, setPage] = useState<string>(currentPage?.toString() ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");

  const pageNum = parseInt(page, 10);
  const percent = pageCount && pageNum > 0
    ? Math.min(100, Math.round((pageNum / pageCount) * 100))
    : null;

  const handleDismiss = () => {
    localStorage.setItem(getTodayKey(bookId), "dismissed");
    onClose();
  };

  const handleSave = async () => {
    if (!pageNum || pageNum <= 0) return;
    setStatus("saving");

    const formData = new FormData();
    formData.set("title", bookTitle);
    formData.set("currentPage", pageNum.toString());

    await updateBook(bookId, null, formData);
    localStorage.setItem(getTodayKey(bookId), "dismissed");
    setStatus("done");
    setTimeout(onClose, 800);
  };

  return (
    <div
      className="rounded-2xl p-4 border mb-4 animate-in slide-in-from-top-2 fade-in duration-300"
      style={{
        background: "color-mix(in srgb, var(--accent) 8%, var(--bg-card))",
        borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
            <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--fg-primary)" }}>
            A che pagina sei?
          </span>
        </div>
        <button onClick={handleDismiss} className="opacity-40 hover:opacity-100 transition-opacity">
          <X className="w-3.5 h-3.5" style={{ color: "var(--fg-muted)" }} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={pageCount ?? undefined}
          value={page}
          onChange={(e) => setPage(e.target.value)}
          placeholder={currentPage ? `Era p. ${currentPage}` : "Pagina…"}
          className="w-24 rounded-lg px-3 py-1.5 text-sm border focus:outline-none transition-all"
          style={{
            background: "var(--bg-input)",
            color: "var(--fg-primary)",
            borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
          }}
        />
        {pageCount && (
          <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
            / {pageCount}
          </span>
        )}
        {percent !== null && (
          <span
            className="text-xs font-bold ml-1"
            style={{ color: "var(--accent)" }}
          >
            {percent}%
          </span>
        )}

        <button
          onClick={handleSave}
          disabled={!pageNum || pageNum <= 0 || status === "saving" || status === "done"}
          className="ml-auto flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
          style={{ background: "var(--accent)", color: "var(--accent-on)" }}
        >
          {status === "done" ? "✓" : status === "saving" ? "…" : (
            <><span>Aggiorna</span><ChevronRight className="w-3 h-3" /></>
          )}
        </button>
      </div>

      {/* Progress bar */}
      {percent !== null && (
        <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percent}%`, background: "var(--accent)" }}
          />
        </div>
      )}
    </div>
  );
}
