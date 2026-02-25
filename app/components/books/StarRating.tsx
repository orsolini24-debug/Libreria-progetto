"use client";

import { useState } from "react";

interface StarRatingProps {
  name: string;
  defaultValue?: number | null;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const STAR_SIZES = { sm: 14, md: 20, lg: 26 };

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
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={value > 0 ? value : ""} />

      <div className="flex items-center gap-0.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => {
          const fill = fillPercent(star);

          if (readOnly) {
            return (
              <span key={star} className="relative inline-block" style={{ width: px, height: px, fontSize: px }}>
                <span style={{ color: "color-mix(in srgb, var(--accent) 20%, transparent)", userSelect: "none" }}>★</span>
                {fill > 0 && (
                  <span
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${fill}%`, color: "var(--accent)", userSelect: "none" }}
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
              className="relative inline-block cursor-pointer transition-all duration-150"
              style={{
                width: px,
                height: px,
                fontSize: px,
                transform: hover === star || hover === star - 0.5 ? "scale(1.2)" : "scale(1)",
              }}
              onMouseLeave={() => setHover(0)}
            >
              <span style={{ color: "rgba(255,255,255,0.1)", userSelect: "none" }}>★</span>
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${fill}%`, color: "var(--accent)", userSelect: "none" }}
                >
                  ★
                </span>
              )}
              <span className="absolute left-0 top-0 h-full w-1/2 z-10" onMouseEnter={() => setHover(star - 0.5)} onClick={() => setValue(star - 0.5 === value ? 0 : star - 0.5)} />
              <span className="absolute right-0 top-0 h-full w-1/2 z-10" onMouseEnter={() => setHover(star)} onClick={() => setValue(star === value ? 0 : star)} />
            </span>
          );
        })}
      </div>

      {!readOnly && (
        <span className="ml-3 text-xs font-black tracking-tighter whitespace-nowrap" style={{ color: "var(--accent)" }}>
          {active > 0 ? `${active} / 10` : "VOTA"}
        </span>
      )}
    </div>
  );
}

export function RatingDisplay({ value, size = "sm" }: { value: number | null; size?: "sm" | "md" }) {
  if (!value) return null;
  return (
    <span className="flex items-center gap-2">
      <StarRating name="_display" defaultValue={value} readOnly size={size} />
      <span className="font-black text-[10px] tracking-tighter text-amber-500">{value}/10</span>
    </span>
  );
}
