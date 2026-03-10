"use client";

export interface ServerStats {
  totalCount: number;
  readCount: number;
  readingCount: number;
  uniqueAuthors: number;
  avgRating: number | null;
  bookPagesTotal: number;
}

interface Props {
  serverStats: ServerStats;
  onStatClick?: (filter: string) => void;
}

export function StatsBar({ serverStats, onStatClick }: Props) {
  if (serverStats.totalCount === 0) return null;

  const { totalCount, readCount, readingCount, uniqueAuthors, avgRating, bookPagesTotal } = serverStats;

  const stats: { icon: string; value: number | string; label: string; filter?: string }[] = [
    { icon: "📚", value: totalCount,      label: "nella libreria" },
    { icon: "✅", value: readCount,        label: "letti",         filter: "READ" },
    ...(readingCount > 0
      ? [{ icon: "📖", value: readingCount, label: "in lettura",   filter: "READING" }]
      : []),
    { icon: "✍️", value: uniqueAuthors,   label: "autori" },
    ...(avgRating != null
      ? [{ icon: "⭐", value: `${avgRating.toFixed(1)}/10`, label: "media voti", filter: "READ" }]
      : []),
    ...(bookPagesTotal > 0
      ? [{ icon: "📄", value: `~${bookPagesTotal.toLocaleString("it")}`, label: "pagine totali", filter: "READ" }]
      : []),
  ];

  return (
    <div className="glass flex flex-wrap gap-x-6 gap-y-3 mb-6 px-4 py-3.5 rounded-xl">
      {stats.map((s, i) => {
        const clickable = !!s.filter && !!onStatClick;
        return (
          <div
            key={i}
            className={`flex items-center gap-2.5 ${clickable ? "cursor-pointer group/stat" : ""}`}
            onClick={clickable ? () => onStatClick!(s.filter!) : undefined}
            title={clickable ? "Clicca per vedere i libri" : undefined}
          >
            <span className="text-lg leading-none">{s.icon}</span>
            <div>
              <p
                className={`font-display text-lg font-bold leading-none transition-opacity
                  ${clickable ? "group-hover/stat:opacity-70" : ""}`}
                style={{ color: "var(--accent)" }}
              >
                {s.value}
              </p>
              <p
                className={`text-[10px] mt-0.5 uppercase tracking-wide transition-colors
                  ${clickable ? "group-hover/stat:underline underline-offset-2" : ""}`}
                style={{ color: "var(--fg-subtle)" }}
              >
                {s.label}
              </p>
            </div>
            {clickable && (
              <span className="opacity-0 group-hover/stat:opacity-40 text-[10px] -ml-1.5 transition-opacity"
                style={{ color: "var(--accent)" }}>↗</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
