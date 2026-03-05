"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

type SeriesBook = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  series: string | null;
  seriesOrder: number | null;
  status: string;
};

const STATUS_LABELS: Record<string, string> = {
  TO_READ:  "Da leggere",
  READING:  "In lettura",
  READ:     "Letto",
  WISHLIST: "Wishlist",
};

const STATUS_DOT: Record<string, string> = {
  TO_READ:  "#78716c",
  READING:  "#3b82f6",
  READ:     "#10b981",
  WISHLIST: "#8b5cf6",
};

interface Props {
  seriesName: string;        // valore attuale del campo serie
  currentBookId: string;
  onNavigate: (bookId: string) => void; // apre il pannello edit di quel libro
}

export function SeriesPanel({ seriesName, currentBookId, onNavigate }: Props) {
  const [books,   setBooks]   = useState<SeriesBook[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (name: string) => {
    if (!name || name.length < 2) { setBooks([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/series?name=${encodeURIComponent(name)}&excludeId=${currentBookId}`);
      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [currentBookId]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(seriesName), 600);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [seriesName, load]);

  if (!seriesName || seriesName.length < 2) return null;
  if (!loading && books.length === 0) return null;

  return (
    <div
      className="rounded-xl border p-3 flex flex-col gap-2"
      style={{
        background:  "color-mix(in srgb, var(--accent) 6%, var(--bg-elevated))",
        borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-subtle)" }}>
        Altri libri in questa serie
      </p>

      {loading && (
        <p className="text-xs italic" style={{ color: "var(--fg-subtle)" }}>Ricerca…</p>
      )}

      <div className="flex flex-col gap-2">
        {books.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onNavigate(b.id)}
            className="flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity"
          >
            {b.coverUrl ? (
              <Image src={b.coverUrl} alt={b.title} width={28} height={40}
                className="rounded shrink-0 object-cover shadow" />
            ) : (
              <div className="w-7 h-10 rounded shrink-0 flex items-center justify-center border"
                style={{ background: "var(--bg-page)", borderColor: "color-mix(in srgb,var(--fg-subtle) 20%,transparent)" }}>
                <span className="text-[7px]" style={{ color: "var(--fg-subtle)" }}>📖</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {b.seriesOrder && (
                  <span className="text-[9px] font-bold px-1 rounded"
                    style={{ background: "color-mix(in srgb,var(--accent) 20%,transparent)", color: "var(--accent)" }}>
                    #{b.seriesOrder}
                  </span>
                )}
                <p className="text-xs font-medium truncate" style={{ color: "var(--fg-primary)" }}>{b.title}</p>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_DOT[b.status] ?? "#78716c" }} />
                <p className="text-[9px]" style={{ color: "var(--fg-subtle)" }}>{STATUS_LABELS[b.status] ?? b.status}</p>
              </div>
            </div>
            <span className="text-xs shrink-0" style={{ color: "var(--accent)" }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
