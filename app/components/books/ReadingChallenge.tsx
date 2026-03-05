"use client";

import { useState, useEffect } from "react";
import type { Book } from "@/app/generated/prisma/client";

const YEAR = new Date().getFullYear();

function motivation(pct: number): string {
  if (pct === 0)  return "Inizia la tua avventura letteraria!";
  if (pct < 25)  return "Ottimo inizio — continua così.";
  if (pct < 50)  return "Buon ritmo, sei sulla strada giusta.";
  if (pct < 75)  return "Più della metà completata!";
  if (pct < 100) return "Quasi arrivato/a — un ultimo sforzo.";
  return "Obiettivo raggiunto! 🎉";
}

export function ReadingChallenge({ books }: { books: Book[] }) {
  const [goal,     setGoal]     = useState(12);
  const [editing,  setEditing]  = useState(false);
  const [inputVal, setInputVal] = useState("12");
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("readingGoal");
    if (saved) {
      const n = parseInt(saved, 10);
      if (!isNaN(n) && n > 0) { setGoal(n); setInputVal(String(n)); }
    }
  }, []);

  const booksThisYear = books.filter(
    (b) => b.status === "READ" && new Date(b.finishedAt ?? b.updatedAt).getFullYear() === YEAR
  ).length;

  const pct = Math.min(100, Math.round((booksThisYear / goal) * 100));

  function saveGoal() {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n > 0) {
      setGoal(n);
      localStorage.setItem("readingGoal", String(n));
    }
    setEditing(false);
  }

  if (!mounted) return null;

  return (
    <div
      className="glass mb-6 px-4 py-3.5 rounded-xl backdrop-blur-sm"
      style={{
        background: "color-mix(in srgb, var(--accent) 5%, color-mix(in srgb, var(--bg-card) 80%, transparent))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <h3 className="font-display text-sm font-semibold" style={{ color: "var(--fg-primary)" }}>
            Obiettivo {YEAR}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <input
                type="number" min="1" max="365"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  saveGoal();
                  if (e.key === "Escape") setEditing(false);
                }}
                autoFocus
                className="w-14 text-center text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-2"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                }}
              />
              <button onClick={saveGoal} className="text-xs transition-colors" style={{ color: "var(--accent)" }}>✓</button>
              <button onClick={() => setEditing(false)} className="text-xs transition-colors" style={{ color: "var(--fg-subtle)" }}>✕</button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs transition-colors flex items-center gap-1"
              style={{ color: "var(--fg-subtle)" }}
              title="Modifica obiettivo"
            >
              <span>✏️</span> {goal} libri
            </button>
          )}
        </div>
      </div>

      {/* Barra progresso */}
      <div
        className="relative h-2.5 rounded-full overflow-hidden mb-2"
        style={{ background: "var(--bg-elevated)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: pct >= 100
              ? "linear-gradient(90deg, var(--accent), var(--accent-hover), var(--accent))"
              : "linear-gradient(90deg, color-mix(in srgb, var(--accent) 50%, black), var(--accent))",
          }}
        />
        {pct > 5 && pct < 100 && (
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              left: 0,
              width: `${pct}%`,
              background: "linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.12) 70%, transparent 100%)",
              animation: "shimmer 2.5s infinite",
              backgroundSize: "200% 100%",
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="font-reading text-xs italic" style={{ color: "var(--fg-subtle)" }}>
          {motivation(pct)}
        </p>
        <p className="text-xs font-semibold tabular-nums" style={{ color: "var(--accent)" }}>
          {booksThisYear}/{goal} — {pct}%
        </p>
      </div>
    </div>
  );
}
