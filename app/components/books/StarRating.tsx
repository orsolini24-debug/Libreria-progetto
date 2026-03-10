"use client";

import { useState } from "react";

interface StarRatingProps {
  name: string;
  defaultValue?: number | null;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const STAR_SIZES = { sm: 15, md: 21, lg: 28 };

function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

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
    <div className="flex items-center gap-1.5">
      <input type="hidden" name={name} value={value > 0 ? value : ""} />

      <div className="flex items-center gap-0.5" onMouseLeave={() => !readOnly && setHover(0)}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => {
          const fill = fillPercent(star);
          const isHov = hover === star || hover === star - 0.5;

          return (
            <span
              key={star}
              className="relative inline-block"
              style={{
                width: px,
                height: px,
                transition: "transform 0.1s ease, filter 0.1s ease",
                transform: !readOnly && isHov ? "scale(1.4) translateY(-2px)" : "scale(1)",
                filter: !readOnly && isHov
                  ? `drop-shadow(0 2px 5px color-mix(in srgb, var(--accent) 65%, transparent))`
                  : "none",
              }}
            >
              {/* Stella base (vuota) */}
              <span style={{ color: "rgba(156, 163, 175, 0.22)", display: "block" }}>
                <Star size={px} />
              </span>

              {/* Overlay colorato */}
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill}%`, color: "var(--accent)", display: "block" }}
                >
                  <Star size={px} />
                </span>
              )}

              {/* Zone click (solo interattivo) */}
              {!readOnly && (
                <>
                  <span
                    className="absolute left-0 top-0 h-full w-1/2 z-10 cursor-pointer"
                    onMouseEnter={() => setHover(star - 0.5)}
                    onClick={() => setValue(star - 0.5 === value ? 0 : star - 0.5)}
                  />
                  <span
                    className="absolute right-0 top-0 h-full w-1/2 z-10 cursor-pointer"
                    onMouseEnter={() => setHover(star)}
                    onClick={() => setValue(star === value ? 0 : star)}
                  />
                </>
              )}
            </span>
          );
        })}
      </div>

      {!readOnly && (
        <span
          className="ml-2 text-xs font-black tracking-tighter transition-all duration-150"
          style={{ color: "var(--accent)", minWidth: "3.5rem" }}
        >
          {active > 0 ? `${active} / 10` : "Vota"}
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
      <span className="font-black text-[10px] tracking-tighter" style={{ color: "var(--accent)" }}>{value}/10</span>
    </span>
  );
}
