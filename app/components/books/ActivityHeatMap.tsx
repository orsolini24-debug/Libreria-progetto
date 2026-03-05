"use client";

import { useMemo } from "react";
import type { Book } from "@/app/generated/prisma/client";

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MONTHS = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const DAYS   = ["D","L","M","M","G","V","S"];

function cellColor(count: number, max: number): string {
  if (count === 0) return "var(--bg-elevated)";
  const t = count / max;
  if (t < 0.33) return "color-mix(in srgb, var(--accent) 30%, var(--bg-elevated))";
  if (t < 0.66) return "color-mix(in srgb, var(--accent) 60%, var(--bg-elevated))";
  return "var(--accent)";
}

export function ActivityHeatMap({ books }: { books: Book[] }) {
  const { weeks, max, total } = useMemo(() => {
    // Count books added per day
    const counts: Record<string, number> = {};
    for (const book of books) {
      const key = toYMD(new Date(book.createdAt));
      counts[key] = (counts[key] ?? 0) + 1;
    }

    // Build 52-week grid ending on the most recent Saturday
    const today = new Date();
    // Align to last Sunday
    const dayOfWeek = today.getDay();
    const origin = new Date(today);
    origin.setDate(today.getDate() - dayOfWeek);

    const weeks: { date: Date; count: number; key: string }[][] = [];
    for (let w = 51; w >= 0; w--) {
      const week: { date: Date; count: number; key: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(origin);
        date.setDate(origin.getDate() - w * 7 + d);
        const key = toYMD(date);
        week.push({ date, count: counts[key] ?? 0, key });
      }
      weeks.push(week);
    }

    const flat = weeks.flat();
    const max  = Math.max(1, ...flat.map((c) => c.count));
    const total = flat.reduce((s, c) => s + c.count, 0);
    return { weeks, max, total };
  }, [books]);

  if (total === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="font-display text-lg font-semibold tracking-tight" style={{ color: "var(--fg-primary)" }}>
          Attività
        </h2>
        <span className="font-reading text-xs italic" style={{ color: "var(--fg-subtle)" }}>
          libri aggiunti negli ultimi 12 mesi
        </span>
      </div>

      <div className="overflow-x-auto scrollbar-hide pb-1">
        <div className="flex gap-1 min-w-max">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1 pt-4">
            {DAYS.map((d, i) => (
              <div
                key={i}
                className="h-2.5 text-[8px] leading-none flex items-center pr-1"
                style={{ color: "var(--fg-subtle)" }}
              >
                {i % 2 === 0 ? d : ""}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => {
            const firstDay  = week[0].date;
            const showMonth = firstDay.getDate() <= 7;
            return (
              <div key={wi} className="flex flex-col gap-0.5">
                {/* Month label */}
                <div
                  className="h-3.5 text-[8px] leading-none"
                  style={{ color: showMonth ? "var(--fg-muted)" : "transparent" }}
                >
                  {MONTHS[firstDay.getMonth()]}
                </div>
                {/* Day cells */}
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={`${cell.key}: ${cell.count} ${cell.count === 1 ? "libro" : "libri"}`}
                    className="w-2.5 h-2.5 rounded-sm transition-transform duration-100 hover:scale-125 cursor-default"
                    style={{ background: cellColor(cell.count, max) }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-[9px]" style={{ color: "var(--fg-subtle)" }}>meno</span>
        {[0, 0.25, 0.5, 0.8, 1].map((t, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-sm"
            style={{ background: cellColor(Math.round(t * max), max) }}
          />
        ))}
        <span className="text-[9px]" style={{ color: "var(--fg-subtle)" }}>più</span>
      </div>
    </section>
  );
}
