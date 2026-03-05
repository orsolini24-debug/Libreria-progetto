"use client";

import { useState } from "react";

interface StarRatingProps {
  name: string;
  defaultValue?: number | null;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const STAR_SIZES = { sm: 16, md: 22, lg: 28 };

export function StarRating({ name, defaultValue = 0, readOnly = false, size = "md" }: StarRatingProps) {
  const [value, setValue] = useState<number>(defaultValue ?? 0);
  const [hover, setHover] = useState<number>(0);

  const active = hover || value;
  const px = STAR_SIZES[size];

  function fillPercent(star: number): number {
    if (active >= star) return 100;
    if (active >= star - 0.5) return 50;
    return 0;
  }

  return (
    <div className="flex items-center gap-0.5">
      <input type="hidden" name={name} value={value > 0 ? value : ""} />

      {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => {
        const fill = fillPercent(star);

        if (readOnly) {
          return (
            <span key={star} className="relative inline-block" style={{ width: px, height: px, fontSize: px }}>
              <span className="text-stone-700 select-none">★</span>
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden text-amber-400 select-none"
                  style={{ width: `${fill}%` }}
                >
                  ★
                </span>
              )}
            </span>
          );
        }

        return (
          <span
            key={star}
            className="relative inline-block cursor-pointer transition-transform duration-150"
            style={{
              width: px,
              height: px,
              fontSize: px,
              transform: hover === star || hover === star - 0.5 ? "scale(1.25)" : "scale(1)",
            }}
            onMouseLeave={() => setHover(0)}
          >
            {/* Stella base (vuota) */}
            <span className="text-stone-700 select-none" style={{ transition: "color 120ms ease" }}>★</span>

            {/* Overlay colorato */}
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden text-amber-400 pointer-events-none select-none"
                style={{ width: `${fill}%`, transition: "width 80ms ease" }}
              >
                ★
              </span>
            )}

            {/* Zona sinistra: mezzo voto */}
            <span
              className="absolute left-0 top-0 h-full w-1/2 z-10"
              onMouseEnter={() => setHover(star - 0.5)}
              onClick={() => setValue(star - 0.5 === value ? 0 : star - 0.5)}
              onTouchStart={(e) => { e.preventDefault(); setHover(star - 0.5); }}
              onTouchEnd={(e) => { e.preventDefault(); setValue(star - 0.5 === value ? 0 : star - 0.5); setHover(0); }}
            />
            {/* Zona destra: voto intero */}
            <span
              className="absolute right-0 top-0 h-full w-1/2 z-10"
              onMouseEnter={() => setHover(star)}
              onClick={() => setValue(star === value ? 0 : star)}
              onTouchStart={(e) => { e.preventDefault(); setHover(star); }}
              onTouchEnd={(e) => { e.preventDefault(); setValue(star === value ? 0 : star); setHover(0); }}
            />
          </span>
        );
      })}

      {!readOnly && (
        <span className="ml-2 text-sm font-semibold text-amber-500/80 min-w-[32px]">
          {active > 0 ? `${active}/10` : ""}
        </span>
      )}
      {!readOnly && value > 0 && (
        <button
          type="button"
          onClick={() => setValue(0)}
          className="ml-1 text-xs text-stone-600 hover:text-stone-400 transition-colors"
          title="Rimuovi valutazione"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function RatingDisplay({ value, size = "sm" }: { value: number | null; size?: "sm" | "md" }) {
  if (!value) return null;
  return (
    <span className="flex items-center gap-1">
      <StarRating name="_display" defaultValue={value} readOnly size={size} />
      <span className={`font-semibold ${size === "sm" ? "text-xs" : "text-sm"} text-amber-400`}>
        {value}/10
      </span>
    </span>
  );
}
